import { Activity, Comment, GpsPoint, Stamina, User } from "@prisma/client";
import { iconUrl, SPORT_ICON } from "./icons";

export function serializeUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    location: user.location,
    locationLat: user.locationLat,
    locationLng: user.locationLng,
    sports: JSON.parse(user.sports) as string[],
    visibility: user.visibility,
    createdAt: user.createdAt,
  };
}

/** Slimmer projection safe to embed inside activities, feed items, comments, etc. */
export function serializeUserSummary(user: User) {
  return {
    id: user.id,
    name: user.name,
    avatarUrl: user.avatarUrl,
    icon: { key: "user", url: iconUrl("user") },
  };
}

export function serializeActivity(
  activity: Activity & {
    user?: User;
    points?: GpsPoint[];
    _count?: { staminas?: number; comments?: number };
    viewerHasGivenStamina?: boolean;
  }
) {
  const sportIconKey = SPORT_ICON[activity.sport] ?? "running";

  return {
    id: activity.id,
    title: activity.title,
    sport: activity.sport,
    icon: { key: sportIconKey, url: iconUrl(sportIconKey) },
    status: activity.status,
    visibility: activity.visibility,
    startTime: activity.startTime,
    endTime: activity.endTime,
    duration: activity.duration,
    distance: activity.distance,
    pace: activity.pace,
    avgSpeed: activity.avgSpeed,
    elevationGain: activity.elevationGain,
    user: activity.user ? serializeUserSummary(activity.user) : undefined,
    map: activity.points
      ? {
          points: activity.points.map((p) => ({
            latitude: p.latitude,
            longitude: p.longitude,
            altitude: p.altitude,
            sequence: p.sequence,
          })),
        }
      : undefined,
    staminaCount: activity._count?.staminas ?? 0,
    commentCount: activity._count?.comments ?? 0,
    viewerHasGivenStamina: activity.viewerHasGivenStamina ?? false,
    staminaIcon: { key: "stamina", url: iconUrl("stamina") },
    createdAt: activity.createdAt,
  };
}

export function serializeComment(comment: Comment & { user?: User }) {
  return {
    id: comment.id,
    text: comment.text,
    createdAt: comment.createdAt,
    user: comment.user ? serializeUserSummary(comment.user) : undefined,
  };
}

export function serializeStamina(stamina: Stamina & { user?: User }) {
  return {
    id: stamina.id,
    createdAt: stamina.createdAt,
    user: stamina.user ? serializeUserSummary(stamina.user) : undefined,
  };
}
