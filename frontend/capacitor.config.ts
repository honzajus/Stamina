import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.stamina.mobile",
  appName: "Stamina",
  webDir: "dist",
  // Points the native shell at the live Vite dev server on your Mac's LAN IP
  // instead of the bundled dist/ build, so editing code updates the app on
  // the phone instantly. Switch this off for a real release build — see
  // frontend/README.md.
  server: {
    url: "http://192.168.1.135:5173",
    cleartext: true,
  },
};

export default config;
