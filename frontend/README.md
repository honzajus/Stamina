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

**How it's wired now (release mode):** `capacitor.config.ts` has no `server`
override, so the native shell loads the bundled `dist/` directly — built with
`VITE_API_URL` pointed at the deployed API (`frontend/.env.production`, baked
in at build time). The app is fully self-contained: no dependency on your
Mac being on the same Wi-Fi or running anything.

**To install on your iPhone (after any code change):**

```bash
npm run build && npx cap sync ios   # bundles dist/ + copies it into the native shell
npx cap open ios                     # opens Xcode
```

Then in Xcode: select the **App** target → **Signing & Capabilities** → sign
in with your Apple ID and pick it as the Team → select your iPhone (not a
simulator) from the device dropdown in the toolbar → press **Run**. First
launch, the phone will refuse to open it until you go to **Settings → General
→ VPN & Device Management** and trust your developer certificate. With a
free Apple ID (no paid Developer Program), the install expires after about
7 days — just re-run from Xcode to renew it. Since this is a bundled build,
**editing frontend code has no effect on the phone until you re-run those two
commands and re-build in Xcode** — it doesn't live-reload.

**Location permission strings** (`NSLocationWhenInUseUsageDescription` etc.)
are set in `ios/App/App/Info.plist`.

**To switch back to live-reload development** (edit code, see it update on
the phone instantly): add back a `server` block to `capacitor.config.ts`
pointing at your Mac's LAN dev server —

```ts
server: { url: "http://<your-mac-LAN-IP>:5173", cleartext: true }
```

— re-add the ATS cleartext exception to `Info.plist` (`NSAppTransportSecurity`
→ `NSAllowsArbitraryLoads: true`), run `npm run dev -- --host` here and
`npm run dev` for the API, then `npx cap sync ios` and re-run from Xcode. Keep
your Mac and phone on the same Wi-Fi, and update the IP (`ipconfig getifaddr
en0`) whenever it changes.

## Out of scope

Same phased scope as the API — no segments, challenges, achievements,
clubs, routes marketplace, notifications, wearables, or Stamina+. Explore
currently only searches and follows athletes; it says so on the screen.
