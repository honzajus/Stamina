# Stamina

**Stamina** is a social fitness app: record an activity with GPS, save it,
share it with your feed, and track your progress over time.

> Move. Track. Improve.

This repository has two parts:

- **`/` (this directory)** — the API (Node.js + TypeScript + Express + Prisma). See below.
- **[`frontend/`](frontend/)** — the web app (React + Vite), a mobile-first client for the API. See [frontend/README.md](frontend/README.md).

Together they implement the P0 MVP scope: authentication, profiles, sport
selection, GPS-tracked activities (start / pause / resume / finish), activity
summary/history, the social feed, following, "Give Stamina" reactions,
comments, progress tracking, and per-activity privacy.

## Running both together

```bash
# Terminal 1 — API
npm install
cp .env.example .env
npm run prisma:migrate
npm run seed
npm run dev              # http://localhost:4000

# Terminal 2 — web app
cd frontend
npm install
cp .env.example .env
npm run dev               # http://localhost:5173
```

Log in with a seeded demo account: `alex@stamina.app` / `password123` (also
`sarah@stamina.app`, `mark@stamina.app`).

No emoji are used anywhere in this codebase or its API responses. Every
place the product concept used an emoji (sport pickers, the kudos reaction,
achievement/notification symbols) is instead represented by a stable icon
key resolving to a custom SVG under `assets/icons` — see [Icons](#icons).

## Stack

- Node.js + TypeScript + Express
- Prisma ORM, Postgres via Supabase (see [Supabase setup](#supabase-setup))
- Supabase Storage for profile photo uploads
- JWT bearer authentication
- Zod request validation

## Getting started

```bash
npm install
cp .env.example .env         # fill in DATABASE_URL from your Supabase project, see below

npm run prisma:migrate     # applies the schema to your Supabase Postgres database
npm run seed                # optional: creates 3 demo users and 2 finished runs
npm run dev                  # starts the API on http://localhost:4000
```

Demo accounts created by the seed script (password for all: `password123`):
`alex@stamina.app`, `sarah@stamina.app`, `mark@stamina.app`.

## Supabase setup

The API needs a Supabase project for its Postgres database, and optionally
for profile photo storage.

1. Create a project at [supabase.com](https://supabase.com).
2. In Project Settings → Database, copy the connection string and paste it
   into `DATABASE_URL` in `.env`.
3. Run `npm run prisma:migrate` to create the tables.
4. For photo uploads: in Storage, create a **public** bucket named `avatars`
   (or set `SUPABASE_AVATAR_BUCKET` to whatever you name it). In Project
   Settings → API, copy the Project URL and the `service_role` key into
   `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`.

Leaving `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` unset is safe — profile
photos are then stored as base64 data URLs directly in the database, exactly
as before, so the app still runs with just `DATABASE_URL` configured.

## Production deployment (free tier)

The API and the web app deploy separately, both on free tiers, with the
database already on Supabase from the setup above.

**Backend → [Render](https://render.com)** (free web service; sleeps after
15 minutes idle, ~30–50s cold start on the next request — fine for a small
app):

1. Push this repo to GitHub.
2. In Render: **New +** → **Blueprint**, point it at the repo. It reads
   [`render.yaml`](render.yaml) at the repo root and creates the service.
3. Fill in the env vars it asks for: `DATABASE_URL`, `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY` — same values as your local `.env`.
4. Once deployed, add your custom domain in the service's **Settings →
   Custom Domains** (e.g. `api.yourdomain.com`) and add the CNAME record it
   gives you at your domain registrar.

**Frontend → [Vercel](https://vercel.com)** (free, custom domain included):

1. Import the same GitHub repo as a new Vercel project.
2. Set **Root Directory** to `frontend` (this is a monorepo — the API lives
   at the repo root, the web app in `frontend/`). Vercel auto-detects Vite;
   [`frontend/vercel.json`](frontend/vercel.json) adds the SPA rewrite so
   deep links like `/share/activities/:id` work on refresh.
3. Add an environment variable `VITE_API_URL` set to your Render API URL
   (e.g. `https://api.yourdomain.com`).
4. In **Settings → Domains**, add your domain and follow the DNS records
   Vercel shows you (they're generated per-account, don't hardcode them).

No CORS configuration is needed — the API allows all origins by default
(`cors()` with no options in `src/app.ts`), which is safe here since auth is
a Bearer token, not cookies.

For the iOS app to talk to the deployed API instead of your Mac's LAN dev
server, see "For a real release build" in [`frontend/README.md`](frontend/README.md).

## Project layout

```
src/
  app.ts               Express app: middleware + route mounting
  server.ts            process entry point
  env.ts                environment variable loading
  lib/                  prisma client, JWT, GPS engine, icon registry, serializers
  middleware/           auth guard, zod validation, error handler
  modules/
    auth/                register, login, current user
    users/               profile, follow/unfollow, stats, progress
    activities/           start/pause/resume/finish, GPS points, history
    feed/                  following-based activity feed
    social/                Give Stamina reactions, comments
    icons/                 SVG icon manifest
prisma/
  schema.prisma          data model
  seed.ts                 demo data
assets/icons/            custom SVG icon set served statically
```

## Core loop mapped to the API

```
POST /auth/register            create account
POST /activities/start         start GPS recording
POST /activities/:id/points     stream GPS points while moving
POST /activities/:id/pause      pause / POST .../resume to continue
POST /activities/:id/finish     compute distance, pace, elevation
PATCH /activities/:id           rename / set privacy ("save activity")
GET  /feed                      friends see it, newest first
POST /activities/:id/stamina    a friend gives Stamina
GET  /users/me/progress         see your progress vs. last period
```

## API reference

All request/response bodies are JSON. Authenticated routes require
`Authorization: Bearer <token>`, obtained from register/login.

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | – | Create an account. Body: `email, password, name, sports?` |
| POST | `/api/auth/login` | – | Body: `email, password` |
| GET | `/api/auth/me` | required | Current user |

### Users

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/users?search=` | optional | Search athletes by name (used by Explore); empty query lists recent users |
| GET | `/api/users/:id` | optional | Profile + activity/follower counts + this year's stats + `isFollowing` |
| PATCH | `/api/users/me` | required | Update `name, bio, avatarUrl, location, sports, visibility` |
| POST | `/api/users/:id/follow` | required | Follow a user |
| DELETE | `/api/users/:id/follow` | required | Unfollow a user |
| GET | `/api/users/:id/followers` | optional | Follower list |
| GET | `/api/users/:id/following` | optional | Following list |
| GET | `/api/users/:id/activities` | optional | Activity history (respects privacy) |
| GET | `/api/users/me/friends` | required | Everyone you follow, with location (if shared) and `lastActivityAt` — powers the friends map and list |
| GET | `/api/users/me/stats?range=week\|month\|year` | required | Distance, elevation, moving time, activity count |
| GET | `/api/users/me/progress?range=week\|month\|year` | required | Current vs. previous period, `distanceChangePercent` |

### Activities

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/activities/start` | required | Body: `sport, title?`. Creates an `ACTIVE` activity |
| POST | `/api/activities/:id/points` | required (owner) | Body: `points: [{ latitude, longitude, altitude?, speed?, timestamp? }]` |
| POST | `/api/activities/:id/pause` | required (owner) | `ACTIVE` → `PAUSED` |
| POST | `/api/activities/:id/resume` | required (owner) | `PAUSED` → `ACTIVE` |
| POST | `/api/activities/:id/finish` | required (owner) | Computes distance/pace/elevation from GPS points, sets `FINISHED` |
| PATCH | `/api/activities/:id` | required (owner) | Update `title, visibility` |
| DELETE | `/api/activities/:id` | required (owner) | Delete an activity |
| GET | `/api/activities/:id` | optional | Detail with map points, Stamina/comment counts (privacy-checked) |

### Feed

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/feed?limit=&cursor=` | required | Finished activities from people you follow (and yourself), newest first |

### Social

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/activities/:id/stamina` | required | Give Stamina (the kudos reaction) |
| DELETE | `/api/activities/:id/stamina` | required | Withdraw it |
| GET | `/api/activities/:id/stamina` | optional | Who gave Stamina |
| POST | `/api/activities/:id/comments` | required | Body: `text` |
| GET | `/api/activities/:id/comments` | optional | List comments |
| DELETE | `/api/comments/:commentId` | required (author) | Delete your own comment |

### Icons

| Method | Path | Description |
|---|---|---|
| GET | `/api/icons` | Manifest of every icon key with its SVG URL |
| GET | `/assets/icons/:file.svg` | Static SVG file |

Sport and reaction icon keys are also embedded directly on the relevant
resources — e.g. every activity response includes
`icon: { key: "running", url: "/assets/icons/running.svg" }`.

## Privacy

Every activity has a `visibility`: `EVERYONE`, `FOLLOWERS`, or `ONLY_ME`.
A user's `visibility` field is the default applied conceptually to new
activities; each activity can still be adjusted individually via
`PATCH /api/activities/:id`. All read endpoints that expose an activity
enforce this check server-side, not just in client UI.

## GPS engine

Distance is computed with the Haversine formula over consecutive points;
pace and average speed derive from distance and elapsed time; elevation
gain sums positive altitude deltas. A basic noise filter drops points that
imply an unrealistic speed jump from the previous point before stats are
computed (`src/lib/geo.ts`).

## Out of scope for this MVP

Per the product spec's phased rollout, the following are intentionally not
implemented here: segments, challenges, achievements, clubs, personal
records, route builder/suggested routes, notifications, wearable
integrations, advanced analytics/training plans, and Stamina+
subscriptions. The schema and module structure are organized so these can
be added later without reshaping what already exists.
