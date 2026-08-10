import type { Sport } from "./types";

/**
 * Durable, disk-backed snapshot of the one in-progress recording. Kept in
 * localStorage (not React state) so an app kill/relaunch mid-run — the
 * normal case for a GPS recording that can run for a long time in the
 * background — resumes exactly where it left off instead of silently
 * losing the activity.
 */

export type RecordPhase = "active" | "paused" | "finishing";

export interface PendingPoint {
  latitude: number;
  longitude: number;
  altitude?: number;
  timestamp: string;
}

export interface RecordingSession {
  activityId: string;
  sport: Sport;
  phase: RecordPhase;
  startedAt: number;
  pausedMs: number;
  pauseStartedAt: number | null;
  distanceMeters: number;
  elevationGainMeters: number;
  lastPoint: { latitude: number; longitude: number; altitude?: number | null; timestamp: number } | null;
  pendingPoints: PendingPoint[];
}

const STORAGE_KEY = "stamina_recording_session";

export function saveRecordingSession(session: RecordingSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function loadRecordingSession(): RecordingSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RecordingSession;
  } catch {
    return null;
  }
}

export function clearRecordingSession() {
  localStorage.removeItem(STORAGE_KEY);
}
