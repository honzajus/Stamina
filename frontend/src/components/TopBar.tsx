import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../lib/icons";

interface TopBarProps {
  title?: string;
  onBack?: () => void;
  right?: ReactNode;
}

export function TopBar({ title, onBack, right }: TopBarProps) {
  const navigate = useNavigate();

  return (
    <div className="top-bar">
      {onBack ? (
        <button className="icon-button" onClick={onBack} aria-label="Back">
          <Icon name="chevronLeft" size={20} />
        </button>
      ) : (
        <div className="wordmark" onClick={() => navigate("/home")} style={{ cursor: "pointer" }}>
          STAMINA<span>.</span>
        </div>
      )}
      {title && <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>}
      <div>{right}</div>
    </div>
  );
}
