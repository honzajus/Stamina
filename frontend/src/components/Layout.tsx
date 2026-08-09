import { ReactNode, TouchEvent, useRef } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { BottomNav } from "./BottomNav";

const SWIPE_TAB_ORDER = ["/home", "/explore", "/you"];
const SWIPE_MIN_DISTANCE = 60;
const SWIPE_MAX_OFF_AXIS = 60;

export function TabLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const touchStart = useRef<{ x: number; y: number; onMap: boolean } | null>(null);

  function handleTouchStart(e: TouchEvent) {
    if (e.touches.length !== 1) {
      touchStart.current = null;
      return;
    }
    const touch = e.touches[0];
    const onMap = (e.target as HTMLElement).closest(".leaflet-container") !== null;
    touchStart.current = { x: touch.clientX, y: touch.clientY, onMap };
  }

  function handleTouchEnd(e: TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || start.onMap || e.changedTouches.length !== 1) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < SWIPE_MIN_DISTANCE || Math.abs(deltaY) > SWIPE_MAX_OFF_AXIS) return;

    const currentIndex = SWIPE_TAB_ORDER.indexOf(location.pathname);
    if (currentIndex === -1) return;

    const nextIndex = deltaX < 0 ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0 || nextIndex >= SWIPE_TAB_ORDER.length) return;

    navigate(SWIPE_TAB_ORDER[nextIndex]);
  }

  return (
    <div className="app-shell">
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}

export function PlainLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="app-shell">
      {children ?? <Outlet />}
    </div>
  );
}

export function RequireAuth() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-shell">
        <div className="loading-dots">Loading Stamina…</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/welcome" replace />;

  return <Outlet />;
}

export function RequireGuest() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/home" replace />;

  return <Outlet />;
}
