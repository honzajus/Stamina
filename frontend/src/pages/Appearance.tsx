import { useNavigate } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import { useTheme, ThemeMode } from "../lib/theme";

const THEME_OPTIONS: { value: ThemeMode; label: string; hint: string }[] = [
  { value: "light", label: "Light", hint: "White background, dark text" },
  { value: "dark", label: "Dark", hint: "Dark background, light text" },
  { value: "system", label: "System", hint: "Match your device setting" },
];

export function Appearance() {
  const navigate = useNavigate();
  const { mode, setMode } = useTheme();

  return (
    <div className="screen">
      <TopBar onBack={() => navigate(-1)} title="Appearance" />

      <div>
        <div className="section-title" style={{ marginBottom: 8 }}>
          Theme
        </div>
        <p style={{ color: "var(--color-text-secondary)", fontSize: 13, marginBottom: 12 }}>
          Changes how Stamina looks on this device.
        </p>
        <div className="option-list">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`option-row ${mode === option.value ? "is-selected" : ""}`}
              onClick={() => setMode(option.value)}
            >
              <span className="radio-dot">{mode === option.value && <span className="radio-dot-fill" />}</span>
              <span className="option-row-text">
                <strong>{option.label}</strong>
                <span>{option.hint}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
