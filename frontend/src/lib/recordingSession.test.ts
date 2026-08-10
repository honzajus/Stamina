import { beforeEach, describe, expect, it } from "vitest";
import { clearRecordingSession, loadRecordingSession, saveRecordingSession, type RecordingSession } from "./recordingSession";

const SAMPLE: RecordingSession = {
  activityId: "act_123",
  sport: "RUNNING",
  phase: "active",
  startedAt: 1_700_000_000_000,
  pausedMs: 5_000,
  pauseStartedAt: null,
  distanceMeters: 1234.5,
  elevationGainMeters: 12,
  lastPoint: { latitude: 50.1, longitude: 14.2, altitude: 210, timestamp: 1_700_000_100_000 },
  pendingPoints: [{ latitude: 50.1, longitude: 14.2, altitude: 210, timestamp: "2026-01-01T00:00:00.000Z" }],
};

describe("recordingSession persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when nothing has been saved", () => {
    expect(loadRecordingSession()).toBeNull();
  });

  it("round-trips a full session through localStorage — this is what survives an app kill mid-run", () => {
    saveRecordingSession(SAMPLE);
    expect(loadRecordingSession()).toEqual(SAMPLE);
  });

  it("overwrites the previous session on repeated saves rather than accumulating", () => {
    saveRecordingSession(SAMPLE);
    const updated: RecordingSession = { ...SAMPLE, distanceMeters: 2000, phase: "paused" };
    saveRecordingSession(updated);
    expect(loadRecordingSession()).toEqual(updated);
  });

  it("clears the session so a later load sees nothing", () => {
    saveRecordingSession(SAMPLE);
    clearRecordingSession();
    expect(loadRecordingSession()).toBeNull();
  });

  it("returns null instead of throwing on corrupted stored data", () => {
    localStorage.setItem("stamina_recording_session", "{not valid json");
    expect(loadRecordingSession()).toBeNull();
  });
});
