import { ReactNode, useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import { useTheme } from "../lib/theme";
// This component's CSS (leaflet's own + map-view.css) is imported eagerly
// from main.tsx instead of here — see the comment there. MapView itself
// only ever loads inside a lazy-loaded route, so an import here would ship
// inside that same lazy chunk and could still lose the race against first
// render.

interface MapViewProps {
  center: LatLngExpression;
  zoom?: number;
  bounds?: LatLngBoundsExpression;
  height?: number;
  children?: ReactNode;
}

// Carto's dark tile style ("dark_all") is a deliberately minimal basemap —
// no building footprints, faint unlabeled roads — a different, less
// detailed style than the light "voyager" tiles rather than a dark version
// of the same map. To keep buildings/roads visible in dark mode, the same
// fully-detailed voyager tiles are used in both themes and recolored with a
// CSS filter (see .map-view.is-dark in map-view.css) instead of switching
// to a sparser tile source.
const TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

/**
 * The map container's real pixel size isn't settled until after layout has
 * run (fonts, flex reflow, the surrounding card's final height, a card that
 * only mounts once its data has loaded). Leaflet measures its container once
 * at creation, so a map that's born at a stale/zero size renders blank tiles
 * forever until something calls invalidateSize. This always re-measures
 * (every map, not just ones with bounds to fit) and, when bounds are given,
 * re-fits to them too — both retried once more after the size settles.
 */
function FitBounds({ bounds }: { bounds?: LatLngBoundsExpression }) {
  const map = useMap();

  useEffect(() => {
    const fit = () => {
      map.invalidateSize();
      if (bounds) map.fitBounds(bounds, { padding: [24, 24] });
    };
    fit();
    const timer = window.setTimeout(fit, 250);
    return () => window.clearTimeout(timer);
  }, [map, bounds]);

  return null;
}

export function MapView({ center, zoom = 14, bounds, height = 220, children }: MapViewProps) {
  const { effectiveTheme } = useTheme();

  return (
    <div className={`map-view ${effectiveTheme === "dark" ? "is-dark" : ""}`} style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer url={TILE_URL} attribution={ATTRIBUTION} maxZoom={19} />
        <FitBounds bounds={bounds} />
        {children}
      </MapContainer>
    </div>
  );
}
