import { ReactNode, useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import { useTheme } from "../lib/theme";
import "leaflet/dist/leaflet.css";
import "./map-view.css";

interface MapViewProps {
  center: LatLngExpression;
  zoom?: number;
  bounds?: LatLngBoundsExpression;
  height?: number;
  children?: ReactNode;
}

const LIGHT_TILES = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

/**
 * The map container's real pixel size isn't settled until after layout has
 * run (fonts, flex reflow, the surrounding card's final height). Fitting
 * bounds declaratively on mount can measure a stale size, so this refits
 * explicitly once the map is ready and again after the container's size
 * stabilizes.
 */
function FitBounds({ bounds }: { bounds?: LatLngBoundsExpression }) {
  const map = useMap();

  useEffect(() => {
    if (!bounds) return;
    const fit = () => {
      map.invalidateSize();
      map.fitBounds(bounds, { padding: [24, 24] });
    };
    fit();
    const timer = window.setTimeout(fit, 250);
    return () => window.clearTimeout(timer);
  }, [map, bounds]);

  return null;
}

export function MapView({ center, zoom = 14, bounds, height = 220, children }: MapViewProps) {
  const { effectiveTheme } = useTheme();
  const tileUrl = effectiveTheme === "dark" ? DARK_TILES : LIGHT_TILES;

  return (
    <div className="map-view" style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer url={tileUrl} attribution={ATTRIBUTION} maxZoom={19} />
        <FitBounds bounds={bounds} />
        {children}
      </MapContainer>
    </div>
  );
}
