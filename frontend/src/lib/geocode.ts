export interface ReverseGeocodeResult {
  label: string;
  latitude: number;
  longitude: number;
}

/**
 * Reverse-geocodes coordinates into a short, human-readable place name using
 * OpenStreetMap's free Nominatim API (no key required). Falls back to the
 * raw coordinates if the lookup fails, since the map pin already carries the
 * precise location regardless.
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodeResult> {
  const fallback: ReverseGeocodeResult = {
    label: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    latitude,
    longitude,
  };

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
      { headers: { Accept: "application/json" } }
    );
    if (!response.ok) return fallback;

    const data = await response.json();
    const address = data?.address ?? {};
    const city = address.city ?? address.town ?? address.village ?? address.municipality;
    const country = address.country;
    const label = [city, country].filter(Boolean).join(", ");

    return { label: label || fallback.label, latitude, longitude };
  } catch {
    return fallback;
  }
}
