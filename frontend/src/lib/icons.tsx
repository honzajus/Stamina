import type { SVGProps } from "react";

/**
 * Stamina's custom line-icon set. No emoji are used anywhere in the app —
 * every place the product concept used one (sports, the "Give Stamina"
 * reaction, achievements, notifications) is represented by one of these
 * icons instead. Mirrors the SVG set served by the API under /assets/icons.
 */

export type IconName =
  | "home"
  | "map"
  | "plus"
  | "user"
  | "stamina"
  | "comment"
  | "trophy"
  | "target"
  | "route"
  | "settings"
  | "bell"
  | "check"
  | "running"
  | "cycling"
  | "walking"
  | "hiking"
  | "swimming"
  | "training"
  | "driving"
  | "chevronLeft"
  | "chevronRight"
  | "close"
  | "search"
  | "elevation"
  | "pace"
  | "shield"
  | "sun"
  | "camera"
  | "pin"
  | "share"
  | "layers"
  | "zoomIn"
  | "zoomOut"
  | "eye"
  | "eyeOff";

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

const PATHS: Record<IconName, JSX.Element> = {
  home: (
    <>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9" />
    </>
  ),
  map: (
    <>
      <path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2Z" />
      <path d="M9 4v14" />
      <path d="M15 6v14" />
    </>
  ),
  plus: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.9 3.13-7 7-7s7 3.1 7 7" />
    </>
  ),
  stamina: (
    <>
      <path d="M12 20.2s-7.5-4.6-9.3-9.6C1.7 7.4 3.6 4.5 6.6 4c2-.3 3.9.7 5.4 2.6C13.5 4.7 15.4 3.7 17.4 4c3 .5 4.9 3.4 3.9 6.6-1.8 5-9.3 9.6-9.3 9.6Z" />
      <path d="M12 6.6V17" />
    </>
  ),
  comment: <path d="M4 5h16v11H9l-4 3.5V16H4V5Z" />,
  trophy: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" />
      <path d="M12 14v3M9 20h6M9.5 20c0-1.7.7-2.6 2.5-3 1.8.4 2.5 1.3 2.5 3" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </>
  ),
  route: (
    <>
      <circle cx="5" cy="6" r="2" />
      <circle cx="19" cy="18" r="2" />
      <path d="M5 8c0 4 2 4 6 5s6 1 6 5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.3M12 18.2v2.3M20.5 12h-2.3M5.8 12H3.5M17.7 6.3l-1.6 1.6M7.9 16.1l-1.6 1.6M17.7 17.7l-1.6-1.6M7.9 7.9 6.3 6.3" />
    </>
  ),
  bell: (
    <>
      <path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5 10.8 15.3 16 9.5" />
    </>
  ),
  running: (
    <>
      <circle cx="14.5" cy="4.5" r="1.6" fill="currentColor" stroke="none" />
      <path d="M11 8.5 14 7l2.5 2.5 3 1.3M14 7l-1.5 4L9 13.5M12.5 11l2 2.2-1 4.3M13.5 13.2l3 .8 1 3.5M9 13.5l-2.5 1.3-1 3.2M9 13.5 7.5 20" />
    </>
  ),
  walking: (
    <>
      <circle cx="13" cy="4.5" r="1.6" fill="currentColor" stroke="none" />
      <path d="M12.3 8 10 9l.3 4-2.3 2.5M10.3 13l2.7 1 1 5.5M13 9l1 3 2.7 1.3M9.3 20l1.7-3.5" />
    </>
  ),
  cycling: (
    <>
      <circle cx="5.5" cy="17" r="3" />
      <circle cx="18.5" cy="17" r="3" />
      <path d="M5.5 17 9 9h4l3 3.5 2 4.5M9 9l1.6-2.5H13M9 9l3.5 4h5" />
    </>
  ),
  hiking: (
    <>
      <path d="M3 18 8.5 6l3 6.2L13.5 9 21 18Z" />
      <path d="M14.5 18 16.5 13.5l1 2 1.5-2 2 4.5" />
      <circle cx="8.5" cy="4" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  swimming: (
    <>
      <circle cx="17" cy="5.5" r="1.6" fill="currentColor" stroke="none" />
      <path d="M6 11.5 9 9l3 2 3-2.3L19 11" />
      <path d="M3 15.5c1.3 1.3 2.7 1.3 4 0s2.7-1.3 4 0 2.7 1.3 4 0 2.7-1.3 4 0" />
      <path d="M3 19c1.3 1.3 2.7 1.3 4 0s2.7-1.3 4 0 2.7 1.3 4 0 2.7-1.3 4 0" />
    </>
  ),
  training: (
    <>
      <path d="M2 12h2M20 12h2M4 9v6M20 9v6" />
      <rect x="5.5" y="8" width="2.5" height="8" rx="1" />
      <rect x="16" y="8" width="2.5" height="8" rx="1" />
      <path d="M8 12h8" />
    </>
  ),
  driving: (
    <>
      <path d="M4 16.5v-3l2-4.5h8l2 4.5v3" />
      <path d="M4 13.5h12" />
      <path d="M7 9V7.5h6V9" />
      <circle cx="7.5" cy="16.5" r="1.8" />
      <circle cx="15.5" cy="16.5" r="1.8" />
    </>
  ),
  chevronLeft: <path d="M15 5 8 12l7 7" />,
  chevronRight: <path d="M9 5l7 7-7 7" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.3-4.3" />
    </>
  ),
  elevation: <path d="M3 18 8.5 8l3.5 5.5L14.5 10 21 18Z" />,
  pace: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  shield: <path d="M12 3.5 19 6.5v5.5c0 4.5-3 7.5-7 8.5-4-1-7-4-7-8.5V6.5Z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.6M12 18.9v2.6M21.5 12h-2.6M5.1 12H2.5M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8M18.4 18.4l-1.8-1.8M7.4 7.4 5.6 5.6" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8.5h3l1.5-2h7l1.5 2h3v11H4Z" />
      <circle cx="12" cy="14" r="3.5" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21.5s-7-6.4-7-11.5a7 7 0 0 1 14 0c0 5.1-7 11.5-7 11.5Z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
  share: (
    <>
      <path d="M12 15V3M8.5 6.5 12 3l3.5 3.5" />
      <path d="M6 12v7a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-7" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3 3 8l9 5 9-5-9-5Z" />
      <path d="M3 13.5 12 18.5 21 13.5" />
    </>
  ),
  zoomIn: (
    <>
      <circle cx="10.5" cy="10.5" r="7" />
      <path d="M20 20l-4.3-4.3M10.5 7.5v6M7.5 10.5h6" />
    </>
  ),
  zoomOut: (
    <>
      <circle cx="10.5" cy="10.5" r="7" />
      <path d="M20 20l-4.3-4.3M7.5 10.5h6" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5c1.9 0 3.5.6 4.9 1.4M21.5 12S18 18.5 12 18.5c-1.9 0-3.5-.6-4.9-1.4" />
      <path d="M9.5 9.6a3 3 0 0 0 4.2 4.2M4 4l16 16" />
    </>
  ),
};

export function Icon({ name, size = 22, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}

const SPORT_ICON: Record<string, IconName> = {
  RUNNING: "running",
  CYCLING: "cycling",
  WALKING: "walking",
  HIKING: "hiking",
  SWIMMING: "swimming",
  TRAINING: "training",
  DRIVING: "driving",
};

export function sportIconName(sport: string): IconName {
  return SPORT_ICON[sport] ?? "running";
}

export const SPORT_LABEL: Record<string, string> = {
  RUNNING: "Running",
  CYCLING: "Cycling",
  WALKING: "Walking",
  HIKING: "Hiking",
  SWIMMING: "Swimming",
  TRAINING: "Training",
  DRIVING: "Fatass Drive",
};

export const SPORTS: string[] = ["RUNNING", "CYCLING", "WALKING", "HIKING", "SWIMMING", "TRAINING", "DRIVING"];
