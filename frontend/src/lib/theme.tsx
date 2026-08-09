import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

export type ThemeMode = "light" | "dark" | "system";
type EffectiveTheme = "light" | "dark";

const STORAGE_KEY = "stamina_theme";

interface ThemeContextValue {
  mode: ThemeMode;
  effectiveTheme: EffectiveTheme;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveEffectiveTheme(mode: ThemeMode): EffectiveTheme {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}

function applyMetaThemeColor(effectiveTheme: EffectiveTheme) {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", effectiveTheme === "dark" ? "#0e1310" : "#16a34a");
}

async function applyStatusBarStyle(effectiveTheme: EffectiveTheme) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: effectiveTheme === "dark" ? Style.Dark : Style.Light });
  } catch {
    // status bar plugin not available: no-op
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  });
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>(() => resolveEffectiveTheme(mode));

  useEffect(() => {
    const effective = resolveEffectiveTheme(mode);
    setEffectiveTheme(effective);
    document.documentElement.setAttribute("data-theme", effective);
    applyMetaThemeColor(effective);
    applyStatusBarStyle(effective);

    if (mode !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const next = resolveEffectiveTheme("system");
      setEffectiveTheme(next);
      document.documentElement.setAttribute("data-theme", next);
      applyMetaThemeColor(next);
      applyStatusBarStyle(next);
    };
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => {
    localStorage.setItem(STORAGE_KEY, next);
    setModeState(next);
  }, []);

  return <ThemeContext.Provider value={{ mode, effectiveTheme, setMode }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
