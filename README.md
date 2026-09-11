# TripSync

A group plans a trip together through chat or a short questionnaire. The planner turns everyone's input into a day-by-day itinerary and a per-person budget. The group edits it live, votes, and comments. Nothing is searched or booked until every member commits. After the lock, the app finds ranked flights, stays, and tickets with pre-filled provider links, and lays the whole trip out on a map.

Built from `Plan.md`. **Runs with zero configuration** — no API keys, no accounts, no database.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000, start a trip, then **copy the invite link and open it in a second tab**. Each tab is its own person (identity lives in `sessionStorage`), so you can watch chat, edits, votes, presence, and the budget sync live between tabs.

## How it works without keys

| Plan.md said      | This MVP uses                                                                                                       | Swap to the real thing                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Supabase Realtime | `localStorage` + `BroadcastChannel` (`src/lib/store/sync.ts`). Version-checked merges, presence heartbeats.        | Replace `sync.ts` with a Supabase Realtime adapter; the store API in `store/index.ts` stays. |
| Gemini            | A heuristic planner over a curated dataset of 11 destinations (`src/lib/ai/mock.ts`, `destinations.ts`).           | Set `GEMINI_API_KEY`. `/api/ai` already routes chat parsing to Gemini and falls back to the local planner on any failure. Wire draft + booking prompts in `src/app/api/ai/route.ts`. |
| Google Maps       | Leaflet + OpenStreetMap tiles with great-circle flight arcs, per-day routes, numbered pins (`components/trip/map-view.tsx`). | Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` and replace `MapView`; `buildMapData()` already produces the pins/routes/arcs. |
| Booking APIs      | Ranked options with real deep links: Google Flights, Booking.com, Hotels.com, GetYourGuide, Viator, Airbnb.        | Replace `searchBookingsMock`. The `BookingOption` shape and the select → confirm flow stay. |

Copy `.env.example` to `.env.local` when you have keys. Everything in it is optional.

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
- The local planner knows 11 destinations. Ask for one it doesn't know and it picks the closest fit and tells you the runner-up.
