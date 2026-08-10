/**
 * Pure date-streak math, kept separate from the DB query so it's testable
 * without a database: given the distinct calendar dates (YYYY-MM-DD, in
 * whatever timezone the caller already normalized to) an activity happened
 * on, computes the current and longest consecutive-day streaks as of
 * `today`.
 */
export function computeStreaks(
  activityDates: string[],
  today: string
): { currentStreakDays: number; longestStreakDays: number } {
  const dates = new Set(activityDates);
  if (dates.size === 0) return { currentStreakDays: 0, longestStreakDays: 0 };

  const sorted = [...dates].sort();

  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    run = daysBetween(sorted[i - 1], sorted[i]) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  // A streak "still counts" through today even if today hasn't happened
  // yet — it only breaks once a full calendar day is skipped.
  let current = 0;
  let cursor = dates.has(today) ? today : addDays(today, -1);
  while (dates.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  return { currentStreakDays: current, longestStreakDays: longest };
}

function addDays(dateStr: string, delta: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 86_400_000;
  return Math.round((new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / msPerDay);
}
