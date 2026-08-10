const SPORT_ACTIVITY_NOUN: Record<string, string> = {
  RUNNING: "Run",
  CYCLING: "Ride",
  WALKING: "Walk",
  HIKING: "Hike",
  SWIMMING: "Swim",
  TRAINING: "Training",
  DRIVING: "Drive",
};

/** Mirrors the product spec's "Morning Run" / "Evening Ride" style default titles. */
export function defaultActivityTitle(sport: string, at: Date = new Date()): string {
  const hour = at.getHours();
  const timeOfDay = hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening";
  const noun = SPORT_ACTIVITY_NOUN[sport] ?? "Activity";
  return `${timeOfDay} ${noun}`;
}
