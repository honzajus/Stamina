import L from "leaflet";

export function pinIcon(color: string, size = 34): L.DivIcon {
  return L.divIcon({
    className: "map-pin-icon",
    html: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 21.5s-7-6.4-7-11.5a7 7 0 0 1 14 0c0 5.1-7 11.5-7 11.5Z" fill="${color}" stroke="#ffffff" stroke-width="1"/>
      <circle cx="12" cy="10" r="2.6" fill="#ffffff"/>
    </svg>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

export function dotIcon(color: string, size = 18): L.DivIcon {
  return L.divIcon({
    className: "map-dot-icon",
    html: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" fill="${color}" stroke="#ffffff" stroke-width="2.5"/>
    </svg>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function avatarPinIcon(name: string, avatarUrl: string | null | undefined, opts?: { self?: boolean }, size = 44): L.DivIcon {
  const inner = avatarUrl
    ? `<div class="map-avatar-pin${opts?.self ? " is-self" : ""}" style="background-image:url('${avatarUrl.replace(/'/g, "%27")}')"></div>`
    : `<div class="map-avatar-pin${opts?.self ? " is-self" : ""}" style="background:${opts?.self ? "var(--color-brand)" : "var(--color-primary)"}">${initials(name)}</div>`;

  return L.divIcon({
    className: "map-avatar-icon",
    html: inner,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}
