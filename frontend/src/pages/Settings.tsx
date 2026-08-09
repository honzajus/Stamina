import { useNavigate } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import { Icon, IconName } from "../lib/icons";

const ROWS: { icon: IconName; title: string; subtitle: string; path: string }[] = [
  { icon: "user", title: "Edit Profile", subtitle: "Name, bio, photo, sports, location", path: "/you/edit" },
  { icon: "sun", title: "Appearance", subtitle: "Light, dark, or match your device", path: "/settings/appearance" },
  { icon: "shield", title: "Privacy", subtitle: "Who can see your activities", path: "/settings/privacy" },
];

export function Settings() {
  const navigate = useNavigate();

  return (
    <div className="screen">
      <TopBar onBack={() => navigate(-1)} title="Settings" />

      <div className="list">
        {ROWS.map((row) => (
          <button key={row.path} className="list-row" onClick={() => navigate(row.path)}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "var(--color-primary-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "var(--color-primary-dark)",
              }}
            >
              <Icon name={row.icon} size={20} />
            </div>
            <div className="list-row-body" style={{ textAlign: "left" }}>
              <div className="list-row-title">{row.title}</div>
              <div className="list-row-subtitle">{row.subtitle}</div>
            </div>
            <Icon name="chevronRight" size={18} color="var(--color-text-secondary)" />
          </button>
        ))}
      </div>
    </div>
  );
}
