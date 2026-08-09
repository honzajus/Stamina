# Stamina — Web App

A mobile-first React client for the Stamina API. Runs in a browser but is
laid out and paced like a native app: a phone-width column, a bottom
navigation bar, and a single dominant element per screen.

No emoji anywhere — every icon is a hand-built custom SVG (`src/lib/icons.tsx`),
mirroring the set the API serves under `/assets/icons`.

## Stack

- React 18 + TypeScript + Vite
- React Router for navigation
- Plain CSS with design tokens (`src/styles/tokens.css`) for the Stamina brand
- No UI kit, no map SDK — routes are drawn as a custom SVG polyline (`src/components/RouteMap.tsx`), no API key required
- Real browser Geolocation API for GPS recording (no simulated GPS)

## Getting started

```bash
npm install
cp .env.example .env
npm run dev                # http://localhost:5173
```

The API must be running (see the root [README](../README.md)). API requests
go to a relative `/api` path, proxied by Vite's dev server to
`http://localhost:4000` (see `vite.config.ts`) — this is what lets the same
build work whether it's opened at `localhost:5173`, over a tunnel (ngrok),
or from the iOS app below, with no `VITE_API_URL` juggling.

## Screens

Onboarding (`pages/onboarding/`) → auth (`pages/auth/`) → the four tabs
(`Home`, `Explore`, `Record`, `You`) plus full-screen flows reached from
them: recording an activity, saving it, its detail page, another athlete's
profile, editing your own profile, and privacy settings.

`Record` is real GPS: it calls `navigator.geolocation.watchPosition`,
computes live distance/pace client-side for immediate feedback, batches
points up to the API as they arrive, and asks the API to recompute the
authoritative stats on finish. If location permission is denied, the screen
stays usable (timer keeps running, pause/finish still work) and shows what
happened instead of failing silently.

## Running as a native iOS app (Capacitor)

The `ios/` folder is a Capacitor-wrapped native shell around this same React
app — installed on your phone via Xcode, not the App Store.

**How it's wired for development:** `capacitor.config.ts` points the native
app's webview at your Mac's LAN dev server (`server.url`), not a bundled
build. That means the app on your phone is live-reloading the same code
`npm run dev` serves — edit a file, see it update on the phone. It requires:

- Your Mac and phone on the same Wi-Fi network.
- Both dev servers running: the API (`npm run dev` at the repo root, port
  4000) and this frontend with `npm run dev -- --host` (so Vite binds the
  LAN interface, not just localhost).
- The IP in `capacitor.config.ts`'s `server.url` matching your Mac's current
  LAN IP (`ipconfig getifaddr en0`) — update it and run `npx cap sync ios`
  again if your IP changes (e.g. after reconnecting to Wi-Fi).

**To install on your iPhone:**

```bash
npm run build && npx cap sync ios   # only needed after native config changes
npx cap open ios                     # opens Xcode
```

Then in Xcode: select the **App** target → **Signing & Capabilities** → sign
in with your Apple ID and pick it as the Team → select your iPhone (not a
simulator) from the device dropdown in the toolbar → press **Run**. First
launch, the phone will refuse to open it until you go to **Settings → General
→ VPN & Device Management** and trust your developer certificate. With a
free Apple ID (no paid Developer Program), the install expires after about
7 days — just re-run from Xcode to renew it.

**Location permission strings** (`NSLocationWhenInUseUsageDescription` etc.)
and a dev-only cleartext-HTTP exception (`NSAppTransportSecurity`, since the
LAN dev server isn't HTTPS) are already set in `ios/App/App/Info.plist`.

**For a real release build** (App Store / TestFlight, not live-reload): remove
the `server` block from `capacitor.config.ts` so the app loads the bundled
`dist/` instead, set a real `VITE_API_URL` pointing at a deployed API, run
`npm run build && npx cap sync ios`, drop the ATS exception, and configure
proper signing — none of that is set up yet.

## Out of scope

Same phased scope as the API — no segments, challenges, achievements,
clubs, routes marketplace, notifications, wearables, or Stamina+. Explore
currently only searches and follows athletes; it says so on the screen.
