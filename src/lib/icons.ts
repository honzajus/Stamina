/**
 * Central icon registry. Stamina never uses emoji in API payloads or UI copy —
 * every place the product spec used an emoji (sport pickers, the "Give Stamina"
 * reaction, achievement badges, notification types) is instead represented by
 * a stable icon key that resolves to a custom SVG served from /assets/icons.
 */

export const ICONS = {
  home: "home",
  map: "map",
  plus: "plus",
  user: "user",
  stamina: "stamina",
  comment: "comment",
  trophy: "trophy",
  target: "target",
  route: "route",
  settings: "settings",
  bell: "bell",
  check: "check",
  running: "running",
  cycling: "cycling",
  walking: "walking",
  hiking: "hiking",
  swimming: "swimming",
  training: "training",
  driving: "driving",
} as const;

export type IconKey = keyof typeof ICONS;

export const ICON_LABELS: Record<IconKey, string> = {
  home: "Home",
  map: "Map",
  plus: "Record",
  user: "Profile",
  stamina: "Give Stamina",
  comment: "Comment",
  trophy: "Achievement",
  target: "Goal",
  route: "Route",
  settings: "Settings",
  bell: "Notification",
  check: "Personal best",
  running: "Running",
  cycling: "Cycling",
  walking: "Walking",
  hiking: "Hiking",
  swimming: "Swimming",
  training: "Training",
  driving: "Driving",
};

export const SPORT_ICON: Record<string, IconKey> = {
  RUNNING: "running",
  CYCLING: "cycling",
  WALKING: "walking",
  HIKING: "hiking",
  SWIMMING: "swimming",
  TRAINING: "training",
  DRIVING: "driving",
};

export function iconUrl(key: IconKey): string {
  return `/assets/icons/${ICONS[key]}.svg`;
}

export function listIcons() {
  return (Object.keys(ICONS) as IconKey[]).map((key) => ({
    key,
    label: ICON_LABELS[key],
    url: iconUrl(key),
  }));
}
