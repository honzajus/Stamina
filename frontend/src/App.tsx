import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth, RequireGuest, TabLayout, PlainLayout } from "./components/Layout";
import { Welcome } from "./pages/onboarding/Welcome";
import { SportSelect } from "./pages/onboarding/SportSelect";
import { LocationPermission } from "./pages/onboarding/LocationPermission";
import { Login } from "./pages/auth/Login";
import { Register } from "./pages/auth/Register";
import { Home } from "./pages/Home";
import { Explore } from "./pages/Explore";
import { Progress } from "./pages/Progress";
import { Profile } from "./pages/Profile";
import { EditProfile } from "./pages/EditProfile";
import { UserProfile } from "./pages/UserProfile";
import { Record } from "./pages/Record";
import { ActivitySave } from "./pages/ActivitySave";
import { ActivityDetail } from "./pages/ActivityDetail";
import { Settings } from "./pages/Settings";
import { Appearance } from "./pages/Appearance";
import { Privacy } from "./pages/Privacy";

export function App() {
  return (
    <Routes>
      <Route element={<RequireGuest />}>
        <Route path="/welcome" element={<PlainLayout><Welcome /></PlainLayout>} />
        <Route path="/login" element={<PlainLayout><Login /></PlainLayout>} />
        <Route path="/register" element={<PlainLayout><Register /></PlainLayout>} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route path="/onboarding/sports" element={<PlainLayout><SportSelect /></PlainLayout>} />
        <Route path="/onboarding/location" element={<PlainLayout><LocationPermission /></PlainLayout>} />

        <Route element={<TabLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/you" element={<Profile />} />
        </Route>

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
  );
}
