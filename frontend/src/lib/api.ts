import type {
  Activity,
  Comment,
  Friend,
  IconRef,
  ProgressResponse,
  PeriodStats,
  Sport,
  StaminaEntry,
  StatsRange,
  User,
  UserSearchResult,
  UserSummary,
  Visibility,
} from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const TOKEN_KEY = "stamina_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, body?.error?.message ?? "Something went wrong");
  }
  return body as T;
}

// ---- Auth ----

export function register(data: { email: string; password: string; name: string; sports: Sport[] }) {
  return request<{ token: string; user: User }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function login(data: { email: string; password: string }) {
  return request<{ token: string; user: User }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function fetchMe() {
  return request<{ user: User }>("/api/auth/me");
}

// ---- Users ----

export function searchUsers(query: string) {
  const qs = query ? `?search=${encodeURIComponent(query)}` : "";
  return request<{ users: UserSearchResult[] }>(`/api/users${qs}`);
}

export function getUserProfile(id: string) {
  return request<{
    user: User;
    counts: { activities: number; followers: number; following: number };
    thisYear: PeriodStats;
    isFollowing: boolean;
  }>(`/api/users/${id}`);
}

export function updateMyProfile(
  data: Partial<
    Pick<User, "name" | "bio" | "avatarUrl" | "location" | "locationLat" | "locationLng" | "sports" | "visibility">
  >
) {
  return request<{ user: User }>("/api/users/me", { method: "PATCH", body: JSON.stringify(data) });
}

export function followUser(id: string) {
  return request<{ following: boolean }>(`/api/users/${id}/follow`, { method: "POST" });
}

export function unfollowUser(id: string) {
  return request<{ following: boolean }>(`/api/users/${id}/follow`, { method: "DELETE" });
}

export function listFollowers(id: string) {
  return request<{ users: UserSummary[] }>(`/api/users/${id}/followers`);
}

export function listFollowing(id: string) {
  return request<{ users: UserSummary[] }>(`/api/users/${id}/following`);
}

export function getFriends() {
  return request<{ users: Friend[] }>("/api/users/me/friends");
}

export function listUserActivities(id: string, limit = 20) {
  return request<{ activities: Activity[]; nextCursor: string | null }>(
    `/api/users/${id}/activities?limit=${limit}`
  );
}

export function myStats(range: StatsRange) {
  return request<{ range: StatsRange; stats: PeriodStats }>(`/api/users/me/stats?range=${range}`);
}

export function myProgress(range: StatsRange) {
  return request<ProgressResponse>(`/api/users/me/progress?range=${range}`);
}

// ---- Activities ----

export function startActivity(data: { sport: Sport; title?: string }) {
  return request<{ activity: Activity }>("/api/activities/start", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function addPoints(
  id: string,
  points: { latitude: number; longitude: number; altitude?: number; speed?: number; timestamp?: string }[]
) {
  return request<{ pointsAdded: number }>(`/api/activities/${id}/points`, {
    method: "POST",
    body: JSON.stringify({ points }),
  });
}

export function pauseActivity(id: string) {
  return request<{ activity: Activity }>(`/api/activities/${id}/pause`, { method: "POST" });
}

export function resumeActivity(id: string) {
  return request<{ activity: Activity }>(`/api/activities/${id}/resume`, { method: "POST" });
}

export function finishActivity(id: string) {
  return request<{ activity: Activity }>(`/api/activities/${id}/finish`, { method: "POST" });
}

export function updateActivity(id: string, data: { title?: string; visibility?: Visibility }) {
  return request<{ activity: Activity }>(`/api/activities/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteActivity(id: string) {
  return request<void>(`/api/activities/${id}`, { method: "DELETE" });
}

export function getActivity(id: string) {
  return request<{ activity: Activity }>(`/api/activities/${id}`);
}

// ---- Feed ----

export function getFeed(cursor?: string) {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return request<{ activities: Activity[]; nextCursor: string | null }>(`/api/feed${qs}`);
}

// ---- Social ----

export function giveStamina(activityId: string) {
  return request<{ stamina: StaminaEntry }>(`/api/activities/${activityId}/stamina`, { method: "POST" });
}

export function removeStamina(activityId: string) {
  return request<void>(`/api/activities/${activityId}/stamina`, { method: "DELETE" });
}

export function listStamina(activityId: string) {
  return request<{ staminas: StaminaEntry[] }>(`/api/activities/${activityId}/stamina`);
}

export function createComment(activityId: string, text: string) {
  return request<{ comment: Comment }>(`/api/activities/${activityId}/comments`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export function listComments(activityId: string) {
  return request<{ comments: Comment[] }>(`/api/activities/${activityId}/comments`);
}

export function deleteComment(commentId: string) {
  return request<void>(`/api/comments/${commentId}`, { method: "DELETE" });
}

// ---- Icons ----

export function listIcons() {
  return request<{ icons: (IconRef & { label: string })[] }>("/api/icons");
}
