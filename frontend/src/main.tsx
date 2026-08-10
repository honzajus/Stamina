import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { defineCustomElements } from "@ionic/pwa-elements/loader";
import { App } from "./App";
import { AuthProvider } from "./lib/auth";
import { ThemeProvider } from "./lib/theme";
import "./styles/global.css";
// Loaded eagerly here (not from MapView.tsx, which only ever runs inside a
// lazy-loaded route) so the stylesheet is guaranteed present before any map
// mounts. Leaflet needs its own CSS for the tile/marker panes to be
// positioned and sized correctly; if it's still racing in via a dynamically
// injected <link> at the moment a map first renders, the panes collapse and
// all you see is the marker icons with no visible tiles underneath.
import "leaflet/dist/leaflet.css";
import "./components/map-view.css";

defineCustomElements(window);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
