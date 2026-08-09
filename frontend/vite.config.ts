import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // bind on the LAN interface too, so the Capacitor iOS shell and phones on the same Wi-Fi can reach it
    allowedHosts: ["overwillingly-orogenic-kellee.ngrok-free.dev", "192.168.1.135", "192.168.1.26"],
    proxy: {
      "/api": "http://localhost:4000",
      "/assets": "http://localhost:4000",
    },
  },
});
