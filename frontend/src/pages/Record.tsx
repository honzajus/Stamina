import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon, SPORT_LABEL, SPORTS, sportIconName } from "../lib/icons";
import { formatDistanceKm, formatDuration, formatSpeedKmh, formatTimeAgo } from "../lib/format";
import { accumulateStats, TrackedPoint } from "../lib/geo";
import { LocationWatch, NativePosition, requestLocationPermission, watchLocation } from "../lib/nativeLocation";
import * as api from "../lib/api";
import { ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { Sport } from "../lib/types";
import {
  clearRecordingSession,
  loadRecordingSession,
  saveRecordingSession,
  type PendingPoint,
  type RecordingSession,
} from "../lib/recordingSession";

type Phase = "idle" | "active" | "paused" | "finishing";
type LocationState = "unknown" | "granted" | "denied";

const FLUSH_EVERY = 8;
const SYNC_RETRY_MS = 10_000;
const FINISH_RETRY_MS = 8_000;
// A session this old almost certainly isn't a run still in progress — more
// likely the app was killed and never reopened, or reopened days later.
// Auto-resuming would silently glue a stale timer/GPS watch back together;
// asking first (resume vs. discard) keeps the orphaned-activity problem
// from just moving from "invisible on the server" to "invisible in the UI."
const STALE_SESSION_MS = 6 * 60 * 60 * 1000;

function toTrackedPoint(position: NativePosition): TrackedPoint {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    altitude: position.coords.altitude,
    timestamp: position.timestamp,
  };
}

export function Record() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sport, setSport] = useState<Sport>((user?.sports?.[0] as Sport) ?? "RUNNING");
  const [phase, setPhase] = useState<Phase>("idle");
  const [locationState, setLocationState] = useState<LocationState>("unknown");
  const [locationError, setLocationError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [pendingStaleSession, setPendingStaleSession] = useState<RecordingSession | null>(null);

  const [distanceMeters, setDistanceMeters] = useState(0);
  const [elevationGainMeters, setElevationGainMeters] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const phaseRef = useRef<Phase>("idle");
  const activityIdRef = useRef<string | null>(null);
  const watchRef = useRef<LocationWatch | null>(null);
  const lastPointRef = useRef<TrackedPoint | null>(null);
  const bufferRef = useRef<PendingPoint[]>([]);
  const distanceMetersRef = useRef(0);
  const elevationGainMetersRef = useRef(0);
  const startedAtRef = useRef<number>(0);
  const pausedMsRef = useRef<number>(0);
  const pauseStartedAtRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const syncIntervalRef = useRef<number | null>(null);
  const finishRetryRef = useRef<number | null>(null);

  function setPhaseState(next: Phase) {
    phaseRef.current = next;
    setPhase(next);
  }

  function computeElapsedSeconds(): number {
    const ongoingPauseMs = pauseStartedAtRef.current ? Date.now() - pauseStartedAtRef.current : 0;
    return Math.max(0, (Date.now() - startedAtRef.current - pausedMsRef.current - ongoingPauseMs) / 1000);
  }

  function persistSession(currentPhase: Phase) {
    if (currentPhase === "idle" || !activityIdRef.current) return;
    const session: RecordingSession = {
      activityId: activityIdRef.current,
      sport,
      phase: currentPhase,
      startedAt: startedAtRef.current,
      pausedMs: pausedMsRef.current,
      pauseStartedAt: pauseStartedAtRef.current,
      distanceMeters: distanceMetersRef.current,
      elevationGainMeters: elevationGainMetersRef.current,
      lastPoint: lastPointRef.current,
      pendingPoints: bufferRef.current,
    };
    saveRecordingSession(session);
  }

  function attachWatch() {
    watchRef.current = watchLocation(handlePosition, (message) => {
      setLocationState("denied");
      setLocationError(message);
    });
  }

  function startTick() {
    if (tickRef.current !== null) return;
    tickRef.current = window.setInterval(() => setElapsedSeconds(computeElapsedSeconds()), 1000);
  }

  function startSyncInterval() {
    if (syncIntervalRef.current !== null) return;
    syncIntervalRef.current = window.setInterval(() => {
      if (bufferRef.current.length > 0) flushPoints().catch(() => {});
    }, SYNC_RETRY_MS);
  }

  function stopTimers() {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (syncIntervalRef.current !== null) {
      window.clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  }

  function handlePosition(position: NativePosition) {
    setLocationState("granted");
    setLocationError(null);
    const point = toTrackedPoint(position);
    const prevPoint = lastPointRef.current;
    lastPointRef.current = point;

    if (prevPoint) {
      const delta = accumulateStats({ distanceMeters: 0, elevationGainMeters: 0 }, prevPoint, point);
      distanceMetersRef.current += delta.distanceMeters;
      elevationGainMetersRef.current += delta.elevationGainMeters;
      setDistanceMeters(distanceMetersRef.current);
      setElevationGainMeters(elevationGainMetersRef.current);
    }

    bufferRef.current.push({
      latitude: point.latitude,
      longitude: point.longitude,
      altitude: point.altitude ?? undefined,
      timestamp: new Date(point.timestamp).toISOString(),
    });

    persistSession(phaseRef.current);

    if (bufferRef.current.length >= FLUSH_EVERY) {
      flushPoints().catch(() => {});
    }
  }

  /** Syncs buffered points to the server. On failure the batch is kept (not dropped) so it's retried. */
  function flushPoints(): Promise<void> {
    const id = activityIdRef.current;
    const batch = bufferRef.current;
    if (!id || batch.length === 0) return Promise.resolve();
    bufferRef.current = [];

    return api
      .addPoints(id, batch)
      .then(() => {
        persistSession(phaseRef.current);
      })
      .catch((err) => {
        bufferRef.current = [...batch, ...bufferRef.current];
        persistSession(phaseRef.current);
        throw err;
      });
  }

  /** Fire-and-forget: the recording's local state never waits on this, it just retries once connectivity returns. */
  function syncPhaseToServer(id: string, action: "pause" | "resume") {
    const call = action === "pause" ? api.pauseActivity : api.resumeActivity;
    call(id).catch(() => {
      const retry = () => call(id).catch(() => {});
      window.addEventListener("online", retry, { once: true });
    });
  }

  function rehydrate(session: RecordingSession) {
    activityIdRef.current = session.activityId;
    setSport(session.sport);
    startedAtRef.current = session.startedAt;
    pausedMsRef.current = session.pausedMs;
    pauseStartedAtRef.current = session.pauseStartedAt;
    distanceMetersRef.current = session.distanceMeters;
    elevationGainMetersRef.current = session.elevationGainMeters;
    setDistanceMeters(session.distanceMeters);
    setElevationGainMeters(session.elevationGainMeters);
    lastPointRef.current = session.lastPoint;
    bufferRef.current = session.pendingPoints;

    if (session.phase === "finishing") {
      setPhaseState("finishing");
      setElapsedSeconds(computeElapsedSeconds());
      attemptFinish();
      return;
    }

    setPhaseState(session.phase);
    setElapsedSeconds(computeElapsedSeconds());
    startTick();
    startSyncInterval();

    if (session.phase === "active") {
      requestLocationPermission().then((granted) => {
        if (!granted) {
          setLocationState("denied");
          setLocationError("Location permission is required to keep recording.");
          return;
        }
        attachWatch();
      });
    }
  }

  useEffect(() => {
    const session = loadRecordingSession();
    if (session) {
      const isStale = session.phase !== "finishing" && Date.now() - session.startedAt > STALE_SESSION_MS;
      if (isStale) setPendingStaleSession(session);
      else rehydrate(session);
    }

    function handleOnline() {
      if (phaseRef.current === "finishing") {
        if (finishRetryRef.current !== null) {
          window.clearTimeout(finishRetryRef.current);
          finishRetryRef.current = null;
        }
        attemptFinish();
      } else {
        flushPoints().catch(() => {});
      }
    }
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
      watchRef.current?.clear();
      stopTimers();
      if (finishRetryRef.current !== null) window.clearTimeout(finishRetryRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleStart() {
    setStartError(null);
    const granted = await requestLocationPermission();
    if (!granted) {
      setLocationState("denied");
      setLocationError("Location permission is required to record a route.");
      return;
    }

    try {
      const { activity } = await api.startActivity({ sport });
      activityIdRef.current = activity.id;
      startedAtRef.current = Date.now();
      pausedMsRef.current = 0;
      pauseStartedAtRef.current = null;
      distanceMetersRef.current = 0;
      elevationGainMetersRef.current = 0;
      lastPointRef.current = null;
      bufferRef.current = [];
      setDistanceMeters(0);
      setElevationGainMeters(0);
      setElapsedSeconds(0);

      attachWatch();
      startTick();
      startSyncInterval();
      setPhaseState("active");
      persistSession("active");
    } catch {
      setStartError("Couldn't start recording. Check your connection and try again.");
    }
  }

  function handlePause() {
    if (phaseRef.current !== "active") return;
    const id = activityIdRef.current;
    if (!id) return;

    watchRef.current?.clear();
    watchRef.current = null;
    pauseStartedAtRef.current = Date.now();
    setPhaseState("paused");
    persistSession("paused");
    flushPoints().catch(() => {});
    syncPhaseToServer(id, "pause");
  }

  async function handleResume() {
    if (phaseRef.current !== "paused") return;
    const id = activityIdRef.current;
    if (!id) return;

    if (pauseStartedAtRef.current !== null) {
      pausedMsRef.current += Date.now() - pauseStartedAtRef.current;
      pauseStartedAtRef.current = null;
    }
    lastPointRef.current = null; // don't count the paused gap as distance covered
    setPhaseState("active");
    persistSession("active");
    syncPhaseToServer(id, "resume");

    const granted = await requestLocationPermission();
    if (!granted) {
      setLocationState("denied");
      setLocationError("Location permission is required to keep recording.");
      return;
    }
    attachWatch();
  }

  async function attemptFinish() {
    const id = activityIdRef.current;
    if (!id) return;

    watchRef.current?.clear();
    watchRef.current = null;
    stopTimers();
    setPhaseState("finishing");
    persistSession("finishing");
    setFinishError(null);

    try {
      await flushPoints();
      await api.finishActivity(id);
      clearRecordingSession();
      navigate(`/activities/${id}/save`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        // The only 400 this endpoint returns is "already finished" — a previous
        // finish call must have succeeded before the app closed. Treat as done.
        clearRecordingSession();
        navigate(`/activities/${id}/save`, { replace: true });
        return;
      }
      setFinishError("No connection. This will finish automatically once you're back online.");
      if (finishRetryRef.current === null) {
        finishRetryRef.current = window.setTimeout(() => {
          finishRetryRef.current = null;
          attemptFinish();
        }, FINISH_RETRY_MS);
      }
    }
  }

  function handleFinish() {
    if (finishRetryRef.current !== null) {
      window.clearTimeout(finishRetryRef.current);
      finishRetryRef.current = null;
    }
    attemptFinish();
  }

  function resetToIdle() {
    activityIdRef.current = null;
    lastPointRef.current = null;
    bufferRef.current = [];
    distanceMetersRef.current = 0;
    elevationGainMetersRef.current = 0;
    startedAtRef.current = 0;
    pausedMsRef.current = 0;
    pauseStartedAtRef.current = null;
    setDistanceMeters(0);
    setElevationGainMeters(0);
    setElapsedSeconds(0);
    setFinishError(null);
    setPhaseState("idle");
  }

  function handleDiscard() {
    if (!window.confirm("Discard this activity? This cannot be undone.")) return;
    const id = activityIdRef.current;

    watchRef.current?.clear();
    watchRef.current = null;
    stopTimers();
    if (finishRetryRef.current !== null) {
      window.clearTimeout(finishRetryRef.current);
      finishRetryRef.current = null;
    }
    clearRecordingSession();
    resetToIdle();
    if (id) api.deleteActivity(id).catch(() => {});
  }

  function handleResumeStale() {
    if (!pendingStaleSession) return;
    const session = pendingStaleSession;
    setPendingStaleSession(null);
    rehydrate(session);
  }

  function handleDiscardStale() {
    if (!pendingStaleSession) return;
    const id = pendingStaleSession.activityId;
    clearRecordingSession();
    setPendingStaleSession(null);
    api.deleteActivity(id).catch(() => {});
  }

  const avgSpeedMs = elapsedSeconds > 0 ? distanceMeters / elapsedSeconds : null;

  if (pendingStaleSession) {
    return (
      <div className="screen screen--centered">
        <div className="section-title">Unfinished activity</div>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Still recording?</h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          You have a {SPORT_LABEL[pendingStaleSession.sport]} activity from{" "}
          {formatTimeAgo(new Date(pendingStaleSession.startedAt).toISOString())} that never finished. Resume it, or
          discard it and start fresh.
        </p>
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
          <button className="btn btn-primary" onClick={handleResumeStale}>
            Resume
          </button>
          <button className="btn btn-outline" onClick={handleDiscardStale}>
            Discard
          </button>
        </div>
      </div>
    );
  }

  if (phase === "idle") {
    return (
      <div className="screen">
        <div className="top-bar">
          <button className="icon-button" onClick={() => navigate(-1)} aria-label="Back">
            <Icon name="chevronLeft" size={20} />
          </button>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{SPORT_LABEL[sport]}</div>
          <div style={{ width: 40 }} />
        </div>

        <div className="sport-grid">
          {SPORTS.map((s) => (
            <button
              key={s}
              type="button"
              className={`sport-option ${sport === s ? "is-selected" : ""}`}
              onClick={() => setSport(s as Sport)}
            >
              <Icon name={sportIconName(s)} size={20} />
              {SPORT_LABEL[s]}
            </button>
          ))}
        </div>

        <div className="record-metric" style={{ marginTop: 24 }}>
          <div className="record-metric-value">0.00</div>
          <div className="record-metric-unit">KM</div>
        </div>

        <div className="record-secondary">
          <div>
            <div className="record-secondary-value">0:00</div>
            <div className="record-secondary-label">Time</div>
          </div>
          <div>
            <div className="record-secondary-value">--</div>
            <div className="record-secondary-label">Avg Speed</div>
          </div>
        </div>

        {locationState === "denied" && (
          <div className="banner is-error">{locationError ?? "Location permission is required to record."}</div>
        )}
        {startError && <div className="banner is-error">{startError}</div>}

        <div style={{ marginTop: "auto", display: "flex", justifyContent: "center" }}>
          <button className="btn btn-brand btn-round" onClick={handleStart}>
            START
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className={`record-status ${phase !== "active" ? "is-paused" : ""}`}>
        {phase === "paused" ? "Paused" : phase === "finishing" ? "Finishing…" : SPORT_LABEL[sport]}
      </div>

      <div className="record-metric">
        <div className="record-metric-value">{formatDistanceKm(distanceMeters)}</div>
        <div className="record-metric-unit">KM</div>
      </div>

      <div className="record-secondary">
        <div>
          <div className="record-secondary-value">{formatDuration(elapsedSeconds)}</div>
          <div className="record-secondary-label">Time</div>
        </div>
        <div>
          <div className="record-secondary-value">{formatSpeedKmh(avgSpeedMs)}</div>
          <div className="record-secondary-label">Avg Speed</div>
        </div>
        <div>
          <div className="record-secondary-value">{Math.round(elevationGainMeters)} m</div>
          <div className="record-secondary-label">Elevation</div>
        </div>
      </div>

      {locationState === "denied" && (
        <div className="banner is-error">{locationError ?? "Location permission was lost."}</div>
      )}
      {finishError && <div className="banner is-error">{finishError}</div>}

      <div style={{ marginTop: "auto" }}>
        {phase === "active" && (
          <button className="btn btn-secondary" onClick={handlePause}>
            Pause
          </button>
        )}
        {phase === "paused" && (
          <>
            <div className="record-controls">
              <button className="btn btn-primary" onClick={handleResume}>
                Resume
              </button>
              <button className="btn btn-outline" onClick={handleFinish}>
                Finish
              </button>
            </div>
            <button className="btn-ghost" style={{ width: "100%", marginTop: 8 }} onClick={handleDiscard}>
              Discard activity
            </button>
          </>
        )}
        {phase === "finishing" && !finishError && (
          <button className="btn btn-primary" disabled>
            Saving your activity…
          </button>
        )}
        {phase === "finishing" && finishError && (
          <button className="btn btn-primary" onClick={handleFinish}>
            Retry now
          </button>
        )}
      </div>
    </div>
  );
}
