export type Sport = "RUNNING" | "CYCLING" | "WALKING" | "HIKING" | "SWIMMING" | "TRAINING";
export type Visibility = "EVERYONE" | "FOLLOWERS" | "ONLY_ME";
export type ActivityStatus = "ACTIVE" | "PAUSED" | "FINISHED";

export interface IconRef {
  key: string;
  url: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
  locationLat: number | null;
  locationLng: number | null;
  sports: Sport[];
  visibility: Visibility;
  createdAt: string;
}

export interface UserSummary {
  id: string;
  name: string;
  avatarUrl: string | null;
  icon: IconRef;
}

export interface UserSearchResult extends UserSummary {
  isFollowing: boolean;
}

export interface Friend extends UserSummary {
  location: string | null;
  locationLat: number | null;
  locationLng: number | null;
  lastActivityAt: string | null;
}

export interface MapPoint {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  sequence: number;
}

export interface Activity {
  id: string;
  title: string;
  sport: Sport;
  icon: IconRef;
  status: ActivityStatus;
  visibility: Visibility;
  startTime: string;
  endTime: string | null;
  duration: number;
  distance: number;
  pace: number | null;
  avgSpeed: number | null;
  elevationGain: number;
  user?: UserSummary;
  map?: { points: MapPoint[] };
  staminaCount: number;
  commentCount: number;
  viewerHasGivenStamina: boolean;
  staminaIcon: IconRef;
  createdAt: string;
}

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  user?: UserSummary;
}

export interface StaminaEntry {
  id: string;
  createdAt: string;
  user?: UserSummary;
}

export interface PeriodStats {
  distance: number;
  elevationGain: number;
  movingTime: number;
  activities: number;
}

export type StatsRange = "week" | "month" | "year";

export interface ProgressResponse {
  range: StatsRange;
  current: PeriodStats;
  previous: PeriodStats;
  distanceChangePercent: number | null;
}
