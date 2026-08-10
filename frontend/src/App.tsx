import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth, RequireGuest, TabLayout, PlainLayout } from "./components/Layout";
import { Welcome } from "./pages/onboarding/Welcome";
import { Login } from "./pages/auth/Login";
import { Register } from "./pages/auth/Register";
import { Home } from "./pages/Home";

// Lazy-loaded: none of these are needed for first paint, and several pull
// in Leaflet (map rendering) which is one of the heaviest dependencies in
// the app — no reason to ship it in the initial bundle for someone who
// hasn't opened a map-bearing screen yet.
const SportSelect = lazy(() => import("./pages/onboarding/SportSelect").then((m) => ({ default: m.SportSelect })));
const BodyMetrics = lazy(() => import("./pages/onboarding/BodyMetrics").then((m) => ({ default: m.BodyMetrics })));
const LocationPermission = lazy(() =>
  import("./pages/onboarding/LocationPermission").then((m) => ({ default: m.LocationPermission }))
);
const Explore = lazy(() => import("./pages/Explore").then((m) => ({ default: m.Explore })));
const Progress = lazy(() => import("./pages/Progress").then((m) => ({ default: m.Progress })));
const Profile = lazy(() => import("./pages/Profile").then((m) => ({ default: m.Profile })));
const EditProfile = lazy(() => import("./pages/EditProfile").then((m) => ({ default: m.EditProfile })));
const UserProfile = lazy(() => import("./pages/UserProfile").then((m) => ({ default: m.UserProfile })));
const Record = lazy(() => import("./pages/Record").then((m) => ({ default: m.Record })));
const ActivitySave = lazy(() => import("./pages/ActivitySave").then((m) => ({ default: m.ActivitySave })));
const ActivityDetail = lazy(() => import("./pages/ActivityDetail").then((m) => ({ default: m.ActivityDetail })));
const Notifications = lazy(() => import("./pages/Notifications").then((m) => ({ default: m.Notifications })));
const Settings = lazy(() => import("./pages/Settings").then((m) => ({ default: m.Settings })));
const Appearance = lazy(() => import("./pages/Appearance").then((m) => ({ default: m.Appearance })));
const Privacy = lazy(() => import("./pages/Privacy").then((m) => ({ default: m.Privacy })));

function RouteFallback() {
  return (
    <div className="app-shell">
      <div className="loading-dots">Loading…</div>
    </div>
  );
}

export function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<RequireGuest />}>
          <Route path="/welcome" element={<PlainLayout><Welcome /></PlainLayout>} />
          <Route path="/login" element={<PlainLayout><Login /></PlainLayout>} />
          <Route path="/register" element={<PlainLayout><Register /></PlainLayout>} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route path="/onboarding/sports" element={<PlainLayout><SportSelect /></PlainLayout>} />
          <Route path="/onboarding/body" element={<PlainLayout><BodyMetrics /></PlainLayout>} />
          <Route path="/onboarding/location" element={<PlainLayout><LocationPermission /></PlainLayout>} />

          <Route element={<TabLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/you" element={<Profile />} />
          </Route>

          <Route path="/notifications" element={<PlainLayout><Notifications /></PlainLayout>} />
          <Route path="/record" element={<PlainLayout><Record /></PlainLayout>} />
          <Route path="/activities/:id/save" element={<PlainLayout><ActivitySave /></PlainLayout>} />
          <Route path="/activities/:id" element={<PlainLayout><ActivityDetail /></PlainLayout>} />
          <Route path="/users/:id" element={<UserProfile />} />
          <Route path="/you/edit" element={<PlainLayout><EditProfile /></PlainLayout>} />
          <Route path="/settings" element={<PlainLayout><Settings /></PlainLayout>} />
          <Route path="/settings/appearance" element={<PlainLayout><Appearance /></PlainLayout>} />
          <Route path="/settings/privacy" element={<PlainLayout><Privacy /></PlainLayout>} />
        </Route>

        <Route path="/share/activities/:id" element={<PlainLayout><ActivityDetail /></PlainLayout>} />
        <Route path="/share/users/:id" element={<UserProfile />} />

        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Suspense>
  );
}
