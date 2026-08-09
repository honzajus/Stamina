import { Marker } from "react-leaflet";
import { MapView } from "./MapView";
import { pinIcon } from "../lib/mapIcon";

interface LocationMapProps {
  latitude: number;
  longitude: number;
  height?: number;
}

const NEUTRAL_MARKER = "#111814";

/** Real, pannable/zoomable map centered on a single saved location (profile, friend). */
export function LocationMap({ latitude, longitude, height = 160 }: LocationMapProps) {
  const center: [number, number] = [latitude, longitude];

  return (
    <MapView center={center} zoom={11} height={height}>
      <Marker position={center} icon={pinIcon(NEUTRAL_MARKER)} />
    </MapView>
  );
}
