import { NavLink, useNavigate } from "react-router-dom";
import { Icon } from "../lib/icons";

export function BottomNav() {
  const navigate = useNavigate();

  return (
    <nav className="bottom-nav">
      <NavLink to="/home" className={({ isActive }) => `nav-item ${isActive ? "is-active" : ""}`}>
        <Icon name="home" size={22} />
        Home
      </NavLink>
      <NavLink to="/explore" className={({ isActive }) => `nav-item ${isActive ? "is-active" : ""}`}>
        <Icon name="search" size={22} />
        Explore
      </NavLink>

      <div className="nav-record">
        <button className="nav-record-button" onClick={() => navigate("/record")} aria-label="Record activity">
          <Icon name="plus" size={26} style={{ color: "#FFFFFF" }} />
        </button>
        <span className="nav-record-label">Record</span>
      </div>

      <NavLink to="/you" className={({ isActive }) => `nav-item ${isActive ? "is-active" : ""}`}>
        <Icon name="user" size={22} />
        You
      </NavLink>
    </nav>
  );
}
