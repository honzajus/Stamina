import { ReactNode } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
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

export function MapView({ center, zoom = 14, bounds, height = 220, children }: MapViewProps) {
  const { effectiveTheme } = useTheme();
  const tileUrl = effectiveTheme === "dark" ? DARK_TILES : LIGHT_TILES;

  return (
    <div className="map-view" style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        bounds={bounds}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer url={tileUrl} attribution={ATTRIBUTION} maxZoom={19} />
        {children}
      </MapContainer>
    </div>
  );
}
