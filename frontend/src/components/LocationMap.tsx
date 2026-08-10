import { Marker } from "react-leaflet";
import { MapView } from "./MapView";
import { pinIcon } from "../lib/mapIcon";

interface LocationMapProps {
  latitude: number;
  longitude: number;
  height?: number;
}

const NEUTRAL_MARKER = "#111814";
// Built once at module load: this icon never changes, so there's no reason
// to rebuild it on every render of every LocationMap instance.
const MARKER_ICON = pinIcon(NEUTRAL_MARKER);

/** Real, pannable/zoomable map centered on a single saved location (profile, friend). */
export function LocationMap({ latitude, longitude, height = 160 }: LocationMapProps) {
  const center: [number, number] = [latitude, longitude];

  return (
    <MapView center={center} zoom={11} height={height}>
      <Marker position={center} icon={MARKER_ICON} />
    </MapView>
  );
}
