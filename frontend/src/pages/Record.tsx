import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon, SPORT_LABEL, SPORTS, sportIconName } from "../lib/icons";
import { formatDistanceKm, formatDuration, formatSpeedKmh } from "../lib/format";
import { accumulateStats, TrackedPoint } from "../lib/geo";
import { LocationWatch, NativePosition, requestLocationPermission, watchLocation } from "../lib/nativeLocation";
import * as api from "../lib/api";
import { useAuth } from "../lib/auth";
import type { Sport } from "../lib/types";

type Phase = "idle" | "active" | "paused" | "finishing";
type LocationState = "unknown" | "granted" | "denied";

const FLUSH_EVERY = 8;

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

  const [distanceMeters, setDistanceMeters] = useState(0);
  const [elevationGainMeters, setElevationGainMeters] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const activityIdRef = useRef<string | null>(null);
  const watchRef = useRef<LocationWatch | null>(null);
  const lastPointRef = useRef<TrackedPoint | null>(null);
  const bufferRef = useRef<{ latitude: number; longitude: number; altitude?: number; timestamp: string }[]>([]);
  const startedAtRef = useRef<number>(0);
  const pausedMsRef = useRef<number>(0);
  const pauseStartedAtRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      watchRef.current?.clear();
      if (tickRef.current !== null) window.clearInterval(tickRef.current);
    };
  }, []);

  function handlePosition(position: NativePosition) {
    setLocationState("granted");
    setLocationError(null);
    const point = toTrackedPoint(position);
    const prevPoint = lastPointRef.current;
    lastPointRef.current = point;

    if (prevPoint) {
      const delta = accumulateStats({ distanceMeters: 0, elevationGainMeters: 0 }, prevPoint, point);
      setDistanceMeters((prev) => prev + delta.distanceMeters);
      setElevationGainMeters((prev) => prev + delta.elevationGainMeters);
    }

    bufferRef.current.push({
      latitude: point.latitude,
      longitude: point.longitude,
      altitude: point.altitude ?? undefined,
      timestamp: new Date(point.timestamp).toISOString(),
    });

    if (bufferRef.current.length >= FLUSH_EVERY) {
      flushPoints();
    }
  }

  function flushPoints() {
    const id = activityIdRef.current;
    const batch = bufferRef.current;
    if (!id || batch.length === 0) return;
    bufferRef.current = [];
    api.addPoints(id, batch).catch(() => {
      // best-effort sync; recorded points stay accumulated in local live stats regardless
    });
  }

  function startTimer() {
    startedAtRef.current = Date.now();
    pausedMsRef.current = 0;
    tickRef.current = window.setInterval(() => {
      setElapsedSeconds((Date.now() - startedAtRef.current - pausedMsRef.current) / 1000);
    }, 1000);
  }

  async function handleStart() {
    const granted = await requestLocationPermission();
    if (!granted) {
      setLocationState("denied");
      setLocationError("Location permission is required to record a route.");
      return;
    }

    const { activity } = await api.startActivity({ sport });
    activityIdRef.current = activity.id;

    watchRef.current = watchLocation(handlePosition, (message) => {
      setLocationState("denied");
      setLocationError(message);
    });

    startTimer();
    setPhase("active");
  }

  async function handlePause() {
    const id = activityIdRef.current;
    if (!id) return;
    flushPoints();
    pauseStartedAtRef.current = Date.now();
    await api.pauseActivity(id);
    setPhase("paused");
  }

  async function handleResume() {
    const id = activityIdRef.current;
    if (!id) return;
    if (pauseStartedAtRef.current) {
      pausedMsRef.current += Date.now() - pauseStartedAtRef.current;
      pauseStartedAtRef.current = null;
    }
    await api.resumeActivity(id);
    setPhase("active");
  }

  async function handleFinish() {
    const id = activityIdRef.current;
    if (!id) return;
    setPhase("finishing");

    watchRef.current?.clear();
    if (tickRef.current !== null) window.clearInterval(tickRef.current);
    flushPoints();

    await api.finishActivity(id);
    navigate(`/activities/${id}/save`);
  }

  const avgSpeedMs = elapsedSeconds > 0 ? distanceMeters / elapsedSeconds : null;

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

      <div style={{ marginTop: "auto" }}>
        {phase === "active" && (
          <button className="btn btn-secondary" onClick={handlePause}>
            Pause
          </button>
        )}
        {phase === "paused" && (
          <div className="record-controls">
            <button className="btn btn-primary" onClick={handleResume}>
              Resume
            </button>
            <button className="btn btn-outline" onClick={handleFinish}>
              Finish
            </button>
          </div>
        )}
        {phase === "finishing" && (
          <button className="btn btn-primary" disabled>
            Saving your activity…
          </button>
        )}
      </div>
    </div>
  );
}
