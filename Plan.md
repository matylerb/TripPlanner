# Build Prompt: TripSync — Collaborative AI Trip Planner (MVP)

Paste this into your AI app-builder (bolt.new, v0, Lovable, Replit Agent, etc.) to scaffold the project.

## One-line summary

Build a web app where a group plans a trip together through chat or a guided questionnaire, an AI agent turns that into a shared itinerary and budget, the group edits it together in real time, and only after everyone commits does the AI search for matching flights, hotels, and activities and lay the whole trip out on a map.

## Core user flow

1. **Create a trip** — one person starts a trip, names it, and invites the group (shareable link or email).
2. **Capture preferences (multimodal input)** — each member provides input either by:
   - Typing free-form messages in a shared group chat ("I want somewhere warm in March, budget ~$1200, I hate early flights"), or
   - Filling out a short structured questionnaire (destination or "surprise me," dates/flexibility, budget per person, pace, interests, must-haves/deal-breakers).
   - Both input modes write to the same underlying preference data — a user can mix chat and form answers.
3. **AI drafts the plan** — once enough input is collected (or a member clicks "Generate Draft"), an LLM call (Gemini API) synthesizes all members' input into:
   - A day-by-day draft itinerary (destination, rough dates, activity suggestions).
   - A budget breakdown by category (flights, lodging, food, activities, buffer) and per person.
   - This draft is *not yet booked* — it's a proposal for the group to react to.
4. **Group review + real-time collaborative editing** — the draft itinerary and budget open in a shared editor where:
   - All members see live edits from each other (presence indicators, live cursors or at least live updates without refresh).
   - Members can edit days/items, leave comments, and vote/react (👍/👎) on individual itinerary items.
   - Changes re-run the budget calculation automatically.
5. **Explicit commit gate** — the plan does NOT proceed to booking automatically. A clear "Ready to Book" action requires explicit confirmation from the group (e.g., every member toggles "I'm in," or the organizer locks it after a quorum). Until this gate is passed, nothing books or gets purchased.
6. **Automated booking search (post-commit)** — once committed, a Gemini-powered agent process:
   - Searches for flights, hotels, and activities matching the committed itinerary, dates, and per-person budget/preferences.
   - Returns ranked options with price, provider, and a deep link / pre-filled checkout link for the user to complete the booking themselves.
   - **MVP scope note:** do not attempt to autonomously complete real purchases (handling payment details, PCI compliance, and cancellation policies is out of scope for an MVP). The agent finds and recommends bookable options; a human clicks through to confirm and pay on the provider's site. Structure the code so a "confirm booking" step can be swapped for real purchase automation later.
7. **Visual trip plan** — once bookings are selected (or even just proposed), show a Google Maps view with:
   - Pins for each destination/accommodation.
   - The day-by-day route/itinerary order connecting activity pins.
   - Flight paths as curved/straight overlay lines between origin and destination airports.
   - A toggle to view by day or view the whole trip at once.

## Suggested tech stack

- **Frontend:** Next.js (React) + Tailwind CSS.
- **Backend/data:** Supabase (Postgres + Auth + Realtime channels) — Realtime powers both the group chat and the collaborative itinerary editing without building a custom WebSocket server.
- **LLM:** Gemini API (for parsing group input into structured preferences, drafting the itinerary/budget, and driving the post-commit booking-search agent).
- **Maps:** Google Maps JavaScript API + Directions API (routes) + Places API (activity/hotel lookup) + a polyline overlay for flight paths.
- **Auth:** Simple email/magic-link or OAuth (Supabase Auth) — just enough to know who's in which trip group.

## Data model (starting point)

- `trips`: id, name, status (`gathering` → `reviewing` → `committed` → `booked`), created_by, created_at.
- `trip_members`: trip_id, user_id, display_name, committed (bool).
- `preference_inputs`: trip_id, user_id, source (`chat` | `questionnaire`), raw_content, structured_json (parsed by Gemini), created_at.
- `itinerary_days`: trip_id, day_number, date, location.
- `itinerary_items`: day_id, type (`flight`|`lodging`|`activity`|`meal`|`transit`), title, details_json, cost_estimate, order_index, votes.
- `budget_lines`: trip_id, category, estimated_amount, per_person_amount.
- `booking_options`: itinerary_item_id, provider, price, deep_link, status (`suggested`|`selected`|`confirmed_by_user`).

## Key screens

1. Landing / "Start a trip" + join-by-link.
2. Group input screen — tabbed between Chat and Questionnaire, both feeding the same trip.
3. Itinerary + Budget review — the real-time collaborative editor (main screen).
4. Commit screen — shows who has and hasn't confirmed, with the lock-in action.
5. Booking results — ranked flight/hotel/activity options with links, grouped by itinerary item.
6. Map view — full trip visualized (route, flight paths, pins), filterable by day.

## Explicit MVP boundaries (do not build these yet)

- No real payment processing or autonomous purchasing — recommend + deep-link only.
- No native mobile app — responsive web is sufficient.
- No multi-currency support — assume a single currency (e.g., USD) for now.
- No offline mode.
- Keep group size small for MVP testing (e.g., up to 8 members) rather than optimizing for large groups.

## Definition of done for this MVP

A group of 3+ test users can: create a trip, contribute preferences via both chat and questionnaire, receive an AI-generated itinerary and budget, edit it together in real time and see each other's changes live, explicitly commit as a group, receive AI-suggested flight/hotel/activity options with working deep links, and view the finished plan overlaid on a Google Map.