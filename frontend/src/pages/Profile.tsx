import { useNavigate } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import { ProfileContent } from "../components/ProfileContent";
import { Icon } from "../lib/icons";
import { useAuth } from "../lib/auth";

export function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="screen">
      <TopBar
        right={
          <button className="icon-button" onClick={() => navigate("/settings")} aria-label="Settings">
            <Icon name="settings" size={18} />
          </button>
        }
      />

      <ProfileContent userId={user.id} isSelf />

      <button className="btn btn-secondary" onClick={() => navigate("/progress")}>
        View Your Progress
      </button>

      <button className="btn btn-danger" onClick={logout}>
        Log out
      </button>
    </div>
  );
}
