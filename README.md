# GoPlan

A group plans a trip together through chat or a short questionnaire. The planner turns everyone's input into a day-by-day itinerary and a per-person budget. The group edits it live, votes, and comments. Nothing is searched or booked until every member commits. After the lock, the app finds ranked flights, stays, and tickets with pre-filled provider links, and lays the whole trip out on a map.

Built from `Plan.md`. Gemini is the planning agent; Google Places and Google Maps handle the geography. Without keys, a local planner keeps everything working.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000, start a trip, then **copy the invite link and open it in a second tab**. Each tab is its own person (identity lives in `sessionStorage`), so you can watch chat, edits, votes, presence, and the budget sync live between tabs.

## AI and services

| Piece            | What runs                                                                                                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Planning agent   | **Gemini** via `/api/ai` (`src/lib/ai/gemini.ts`). Chat messages are parsed into structured preferences with the flash model. "Generate draft" sends the whole merged brief to a lite model (`GEMINI_DRAFT_MODEL`, thinking off, ~5-10s) with a JSON schema; it picks the destination, dates, and every itinerary item. Progress streams back to the UI as NDJSON. |
| Place pinning    | **Google Places API (New)**. Every non-flight item Gemini proposes is resolved to real coordinates by text search, biased to the destination, so the map is accurate.                                                            |
| Map              | **Google Maps JavaScript API** (`components/trip/google-map-view.tsx`): flight arcs, per-day routes, numbered pins.                                                                                                              |
| Realtime         | `localStorage` + `BroadcastChannel` (`src/lib/store/sync.ts`). Each browser tab is its own member. Swap for Supabase/Firebase Realtime without touching the store API.                                                           |
| Booking search   | Local, deterministic. Produces ranked options with real pre-filled deep links (Google Flights, Booking.com, Hotels.com, GetYourGuide, Viator, Airbnb).                                                                           |
| Fallback         | If `GEMINI_API_KEY` is missing or a call fails, the local heuristic planner (`src/lib/ai/mock.ts`, 11 curated destinations) takes over automatically. If the draft model isn't available to your key, drafting retries on `GEMINI_FLASH_MODEL`. |

Copy `.env.example` to `.env` and fill in `GEMINI_API_KEY`, `GOOGLE_PLACES_API_KEY`, and `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. Model names come from `GEMINI_FLASH_MODEL` (chat parsing) and `GEMINI_DRAFT_MODEL` (itinerary drafts).

## Screens

1. **Landing** `/` — start a trip, or pick up a recent one.
2. **Brief** `/trip/:id/input` — group chat and questionnaire side by side; both write to the same structured brief. Generate Draft lives here.
3. **Plan** `/trip/:id/plan` — the collaborative editor. Inline title/cost edits, drag to reorder, 👍/👎 votes, comments, budget recomputed on every change.
4. **Commit** `/trip/:id/commit` — each member toggles "I'm in"; the organiser locks at full agreement (or at quorum with a warning).
5. **Book** `/trip/:id/bookings` — ranked options per itinerary line, grouped by flights / stays / tickets. Select, open, mark booked.
6. **Map** `/trip/:id/map` — whole trip or per day. Flights as arcs, stops as a numbered route, the stay as a pin.

## Opinions baked in

- The draft is built to the **lowest** stated budget in the group, not the average.
- Every tab is a member; joining is just a name and a colour. Max 8 per trip.
- No payments. "Open" goes to a pre-filled search at the provider; a human pays there.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind v4 · Framer Motion · Zustand · Leaflet · TypeScript

```
src/
  app/               routes (landing, new, join, trip/[id]/{input,plan,commit,bookings,map}, api/ai)
  components/        ui primitives, landing, trip/* (shell, chat, questionnaire, brief, itinerary, budget, map)
  lib/
    types.ts         data model (mirrors Plan.md)
    store/           zustand store + local persistence + cross-tab sync
    ai/              provider interface, local planner, destination dataset
    budget.ts        pure budget recompute
    geo.ts           haversine, great-circle arcs
```

## Scripts

```bash
npm run dev     # dev server
npm run build   # production build
npm run lint    # eslint
```

## Known limits (MVP)

- Trips live in one browser. Cross-device sharing needs the Supabase adapter.
- Concurrent edits from two tabs in the same instant are last-write-wins.
- The local fallback planner knows 11 destinations; Gemini knows everywhere.
