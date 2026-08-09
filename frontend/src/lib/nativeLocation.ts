import { Capacitor, registerPlugin } from "@capacitor/core";

export interface NativePosition {
  timestamp: number;
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude: number | null;
    altitudeAccuracy: number | null;
    speed: number | null;
    heading: number | null;
  };
}

type PermissionState = "granted" | "denied" | "prompt";

interface BackgroundLocationPlugin {
  requestPermissions(): Promise<{ location: PermissionState }>;
  checkPermissions(): Promise<{ location: PermissionState }>;
  getCurrentPosition(): Promise<NativePosition>;
  watchPosition(
    options: Record<string, never>,
    callback: (position: NativePosition | null, err?: { message?: string }) => void
  ): Promise<string>;
  clearWatch(options: { id: string }): Promise<void>;
}

const NativeBackgroundLocation = registerPlugin<BackgroundLocationPlugin>("BackgroundLocation");

export const isNativePlatform = Capacitor.isNativePlatform();

function fromWebPosition(position: GeolocationPosition): NativePosition {
  return {
    timestamp: position.timestamp,
    coords: {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      altitudeAccuracy: position.coords.altitudeAccuracy,
      speed: position.coords.speed,
      heading: position.coords.heading,
    },
  };
}

export async function requestLocationPermission(): Promise<boolean> {
  if (isNativePlatform) {
    const result = await NativeBackgroundLocation.requestPermissions();
    return result.location === "granted";
  }

  if (!navigator.geolocation) return false;

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve(true),
      () => resolve(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

export async function getCurrentLocation(): Promise<NativePosition> {
  if (isNativePlatform) {
    return NativeBackgroundLocation.getCurrentPosition();
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(fromWebPosition(position)),
      (err) => reject(new Error(err.message)),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

export interface LocationWatch {
  clear: () => void;
}

export function watchLocation(
  onPosition: (position: NativePosition) => void,
  onError: (message: string) => void
): LocationWatch {
  if (isNativePlatform) {
    let watchId: string | null = null;
    let cleared = false;

    NativeBackgroundLocation.watchPosition({}, (position, err) => {
      if (err) {
        onError(err.message ?? "Location error");
        return;
      }
      if (position) onPosition(position);
    }).then((id) => {
      watchId = id;
      if (cleared) NativeBackgroundLocation.clearWatch({ id });
    });

    return {
      clear: () => {
        cleared = true;
        if (watchId) NativeBackgroundLocation.clearWatch({ id: watchId });
      },
    };
  }

  if (!navigator.geolocation) {
    onError("This browser does not support GPS location.");
    return { clear: () => {} };
  }

  const id = navigator.geolocation.watchPosition(
    (position) => onPosition(fromWebPosition(position)),
    (err) => onError(err.message || "Location permission is required to record a route."),
    { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
  );

  return { clear: () => navigator.geolocation.clearWatch(id) };
}
