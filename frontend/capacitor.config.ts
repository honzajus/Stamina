import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.stamina.mobile",
  appName: "Stamina",
  webDir: "dist",
  // Release build: loads the bundled dist/ (built with VITE_API_URL pointed
  // at the deployed API), not a LAN dev server. To go back to live-reload
  // development, see "How it's wired for development" in README.md.
};

export default config;
