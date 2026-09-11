import "server-only";
import { GoogleGenAI } from "@google/genai";
import { nanoid } from "nanoid";
import type { ItemType, ItineraryDay, ItineraryItem, Member, PreferenceInput, StructuredPrefs, Trip } from "../types";
import { addDays, daysBetween } from "../format";
import { mergePrefs } from "./mock";
import { ORIGINS } from "./destinations";
import type { DraftResult, ProgressFn } from "./provider";

/**
 * Gemini-powered planning agent (server side).
 *
 * - parseWithGemini: one chat message -> structured preferences + a short reply.
 * - draftWithGemini: the whole brief -> a full DraftResult. Gemini picks the
 *   destination, dates, and every itinerary item; Google Places (New) then pins
 *   each item to real coordinates so the map is accurate.
 *
 * Every function throws on failure; the API route turns that into a fallback so
 * the local planner takes over and the product keeps working.
 */

const FLASH = process.env.GEMINI_FLASH_MODEL || "gemini-2.5-flash";
// Drafting uses a light model for speed. Override with GEMINI_DRAFT_MODEL; falls back to FLASH if unavailable.
const DRAFT = process.env.GEMINI_DRAFT_MODEL || "gemini-flash-lite-latest";
// Flash models "think" before answering, which is most of their latency; turn it off.
// Lite models have no thinking and reject the option, so it is only sent to FLASH.
const NO_THINKING = { thinkingConfig: { thinkingBudget: 0 } };

let client: GoogleGenAI | null = null;
function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  client ??= new GoogleGenAI({ apiKey: key });
  return client;
}

export function geminiConfigured() {
  return !!process.env.GEMINI_API_KEY;
}

/* ------------------------------------------------------------------ */
/* Preference parsing                                                 */
/* ------------------------------------------------------------------ */

export async function parseWithGemini(text: string, memberName: string): Promise<{ prefs: StructuredPrefs; reply: string }> {
  const prompt = `You extract travel preferences from one group-chat message into JSON.
Message from ${memberName}: """${text}"""
Only include keys the message actually supports. Keys: destination (string, a city/region), surpriseMe (bool), origin (one of ${Object.keys(ORIGINS).join(",")} if a matching home city is mentioned), month (lowercase english), startDate, endDate (YYYY-MM-DD), flexibleDates (bool), nights (int), budgetPerPerson (EUR int, total per person for the whole trip), pace (slow|balanced|packed), interests (array from: food,beach,nature,culture,art,nightlife,adventure,history,wellness,romantic,luxury,budget,city), climate (warm|cold|mild), mustHaves (string[] short phrases), dealBreakers (string[] short phrases, e.g. "No early flights"), reply (one warm sentence, under 30 words, acknowledging exactly what you captured — never invent details).`;
  const res = await getClient().models.generateContent({
    model: FLASH,
    contents: prompt,
    config: { responseMimeType: "application/json", temperature: 0.2, ...NO_THINKING },
  });
  const parsed = JSON.parse(res.text ?? "{}") as Record<string, unknown> & { reply?: string };
  const { reply, ...prefs } = parsed;
  return { prefs: prefs as StructuredPrefs, reply: reply ?? "Got it — added to the group's preferences." };
}

/* ------------------------------------------------------------------ */
/* Draft generation                                                   */
/* ------------------------------------------------------------------ */

interface GeminiItem {
  type: ItemType;
  title: string;
  description: string;
  placeQuery?: string;
  lat?: number;
  lng?: number;
  startTime?: string;
  duration?: string;
  costPerPerson: number;
  nights?: number;
}
interface GeminiDay {
  dayNumber: number;
  headline: string;
  location: string;
  items: GeminiItem[];
}
interface GeminiPlan {
  destination: { name: string; country: string; lat: number; lng: number; airportCode: string; airportLat: number; airportLng: number };
  origin: { name: string; country: string; airportCode: string; airportLat: number; airportLng: number };
  startDate: string;
  endDate: string;
  summary: string;
  totalPerPerson?: number;
  days: GeminiDay[];
}

const PLAN_SCHEMA = {
  type: "object",
  required: ["destination", "origin", "startDate", "endDate", "summary", "totalPerPerson", "days"],
  properties: {
    destination: {
      type: "object",
      required: ["name", "country", "lat", "lng", "airportCode", "airportLat", "airportLng"],
      properties: {
        name: { type: "string" },
        country: { type: "string" },
        lat: { type: "number" },
        lng: { type: "number" },
        airportCode: { type: "string", description: "IATA code of the main arrival airport" },
        airportLat: { type: "number" },
        airportLng: { type: "number" },
      },
    },
    origin: {
      type: "object",
      required: ["name", "country", "airportCode", "airportLat", "airportLng"],
      properties: {
        name: { type: "string" },
        country: { type: "string" },
        airportCode: { type: "string" },
        airportLat: { type: "number" },
        airportLng: { type: "number" },
      },
    },
    startDate: { type: "string", description: "YYYY-MM-DD" },
    endDate: { type: "string", description: "YYYY-MM-DD, the day the group flies home" },
    summary: { type: "string", description: "2-3 sentences to the group: why this place, how the days are shaped, how it fits the budget, and the runner-up destination." },
    totalPerPerson: { type: "number", description: "Sum of every item's costPerPerson across all days. Must be at or under the budget cap." },
    days: {
      type: "array",
      items: {
        type: "object",
        required: ["dayNumber", "headline", "location", "items"],
        properties: {
          dayNumber: { type: "integer" },
          headline: { type: "string", description: "1-3 words, e.g. Arrival, Old town, Out of town, Slow day, Departure" },
          location: { type: "string", description: "Where the day is based, e.g. 'Lisbon' or 'Sintra day trip'" },
          items: {
            type: "array",
            items: {
              type: "object",
              required: ["type", "title", "description", "costPerPerson"],
              properties: {
                type: { type: "string", enum: ["flight", "lodging", "activity", "meal", "transit"] },
                title: { type: "string", description: "Specific and real. For flights: 'JFK → LIS'. For lodging: 'Hotel name, neighbourhood'." },
                description: { type: "string", description: "One short sentence, max 12 words." },
                placeQuery: { type: "string", description: "A Google Maps search string that finds this exact place, e.g. 'Cervejaria Ramiro, Lisbon'. Omit for flights." },
                lat: { type: "number" },
                lng: { type: "number" },
                startTime: { type: "string", description: "HH:MM 24h" },
                duration: { type: "string", description: "e.g. '2h', '45m', '7h'" },
                costPerPerson: { type: "number", description: "EUR per person. Flights: cost of that one leg. Lodging: total for all nights, per person (share of a room)." },
                nights: { type: "integer", description: "Lodging only: number of nights" },
              },
            },
          },
        },
      },
    },
  },
};

function buildDraftPrompt(trip: Trip, inputs: PreferenceInput[], members: Member[]) {
  const m = mergePrefs(inputs);
  const origin = ORIGINS[m.origin] ?? ORIGINS.nyc;
  const today = new Date().toISOString().slice(0, 10);
  const nameOf = (id: string) => members.find((x) => x.id === id)?.displayName ?? "Someone";
  const rawLines = inputs.map((i) => `- ${nameOf(i.memberId)} (${i.source}): ${i.rawContent}`).join("\n");
  const destVotes = Object.entries(m.destinationVotes)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} (${v})`)
    .join(", ");
  const interests = Object.entries(m.interests)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} (${v})`)
    .join(", ");
  const perDay = m.pace === "slow" ? "2" : m.pace === "packed" ? "4" : "3";

  return `You are TripSync's planning agent. A group of ${members.length} (${members.map((x) => x.displayName).join(", ")}) is planning a trip called "${trip.name}". Turn their brief into one concrete, bookable, day-by-day draft.

TODAY: ${today}

MERGED BRIEF (already reconciled across everyone):
- Destination votes: ${destVotes || "none — choose the best fit and name the runner-up in the summary"}${m.surpriseMe ? " (someone said 'surprise me')" : ""}
- Flying from: ${origin.name} (${origin.airport}, lat ${origin.lat}, lng ${origin.lng})
- Dates: ${m.startDate && m.endDate ? `${m.startDate} to ${m.endDate} (fixed)` : `${m.month ? `in ${m.month}, ` : ""}about ${m.nights} nights, flexible — pick a sensible window after today, ideally departing on a Thursday or Friday`}
- Budget: ${m.budgetSet ? `€${m.budgetPerPerson} per person ALL-IN (this is the lowest number anyone said — nobody gets priced out; land under it)` : "not stated — aim mid-range, around €1,500 per person all-in"}
- Pace: ${m.pace} (${perDay} things per full day, plus meals)
- Climate wish: ${m.climate ?? "no preference"}
- Interests: ${interests || "none stated"}
- Must-haves: ${m.mustHaves.join("; ") || "none"}
- Deal-breakers: ${m.dealBreakers.join("; ") || "none"}

RAW INPUTS (for nuance the merge may have lost):
${rawLines || "- (none)"}

RULES
1. Pick ONE destination. Honour destination votes unless a deal-breaker rules it out. Real cities/regions only.
2. Day 1 = arrival: outbound flight (${origin.airport} → destination airport), an airport transit, ONE lodging item (check-in, with nights = total nights and costPerPerson = total lodging cost per person for the whole stay), then one evening item. Last day = departure: at most one short morning item, a transit to the airport, the return flight. Middle days: ${perDay} activities/meals spaced through the day, at least one meal per day.
3. If "No early flights" is a deal-breaker, no departure before 10:00.
4. Every non-flight item must be a real, specific, currently-operating place with a placeQuery that Google Maps can find. No generic "local restaurant". Include your best lat/lng.
5. Costs are EUR per person and realistic for the destination. HARD CAP: the sum of every costPerPerson (both flights + lodging + all activities, meals, transit) must be at most €${m.budgetSet ? Math.round(m.budgetPerPerson * 0.9) : 1350}. Add it up, write it in totalPerPerson, and if it is over, choose cheaper lodging and free/low-cost activities until it fits.
6. Pure JSON matching the schema. No markdown.`;
}

/* ------------------------------------------------------------------ */
/* Google Places (New) geocoding                                      */
/* ------------------------------------------------------------------ */

async function placesLookup(query: string, near: { lat: number; lng: number }): Promise<{ lat: number; lng: number; name?: string } | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return null;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 6000);
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      signal: ctl.signal,
      headers: {
        "content-type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "places.location,places.displayName",
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: 1,
        locationBias: { circle: { center: { latitude: near.lat, longitude: near.lng }, radius: 50000 } },
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { places?: { location?: { latitude: number; longitude: number }; displayName?: { text?: string } }[] };
    const p = json.places?.[0];
    if (!p?.location) return null;
    return { lat: p.location.latitude, lng: p.location.longitude, name: p.displayName?.text };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/* ------------------------------------------------------------------ */
/* Orchestration                                                      */
/* ------------------------------------------------------------------ */

export async function draftWithGemini(trip: Trip, inputs: PreferenceInput[], members: Member[], emit: ProgressFn): Promise<DraftResult> {
  emit(`Reading ${inputs.length} input${inputs.length === 1 ? "" : "s"} from ${members.length} ${members.length === 1 ? "person" : "people"}…`);
  const prompt = buildDraftPrompt(trip, inputs, members);

  emit(`Asking Gemini (${DRAFT}) to choose a destination and shape the days…`);
  const text = await generatePlanJson(prompt, emit);
  const plan = JSON.parse(text) as GeminiPlan;
  validatePlan(plan);

  // Normalise dates: trust startDate, derive endDate from the number of days if Gemini's is inconsistent.
  const dayCount = plan.days.length;
  const start = plan.startDate;
  let end = plan.endDate;
  if (!end || daysBetween(start, end) !== dayCount - 1) end = addDays(start, dayCount - 1);

  const geocodable = plan.days.flatMap((d) => d.items.filter((i) => i.type !== "flight" && i.placeQuery));
  emit(`${plan.destination.name} it is. Pinning ${geocodable.length} places with Google Places…`);
  const near = { lat: plan.destination.lat, lng: plan.destination.lng };
  const lookups = await Promise.allSettled(geocodable.map((i) => placesLookup(i.placeQuery!, near)));
  let pinned = 0;
  geocodable.forEach((item, idx) => {
    const r = lookups[idx];
    if (r.status === "fulfilled" && r.value) {
      item.lat = r.value.lat;
      item.lng = r.value.lng;
      pinned += 1;
    }
  });
  emit(pinned ? `${pinned} of ${geocodable.length} places confirmed on the map. Pricing it out…` : "Using Gemini's coordinates. Pricing it out…");

  const draft = toDraftResult(trip, plan, start, end);
  const m = mergePrefs(inputs);
  if (m.budgetSet) {
    const trimmed = fitToBudget(draft.items, draft.days, m.budgetPerPerson);
    if (trimmed.length) {
      emit(`Trimmed ${trimmed.length} pricey extra${trimmed.length === 1 ? "" : "s"} to land under €${m.budgetPerPerson.toLocaleString()}…`);
      draft.summary += ` To stay under €${m.budgetPerPerson.toLocaleString()} per person I left out ${trimmed.slice(0, 3).join(", ")}${trimmed.length > 3 ? ` and ${trimmed.length - 3} more` : ""} — add any back if the group would rather stretch.`;
    }
  }
  return draft;
}

/**
 * Deterministic budget fit. Lite models are fast but loose with arithmetic, so if the
 * draft's per-person subtotal is over the group's cap, drop the most expensive optional
 * items — paid activities first, then meals on days that still have another meal.
 * Never flights, lodging, transit, day 1 or the last day. Returns the titles removed.
 */
function fitToBudget(items: ItineraryItem[], days: ItineraryDay[], cap: number): string[] {
  const total = () => items.reduce((s, i) => s + i.costEstimate, 0);
  const removed: string[] = [];
  const lastDay = days.length;
  const dayOf = (i: ItineraryItem) => days.find((d) => d.id === i.dayId)!;
  const optional = (i: ItineraryItem) => {
    const day = dayOf(i);
    if (day.dayNumber === 1 || day.dayNumber === lastDay || i.costEstimate <= 0) return false;
    const sameDay = items.filter((x) => x.dayId === i.dayId);
    if (sameDay.length <= 2) return false;
    if (i.type === "activity") return true;
    if (i.type === "meal") return sameDay.filter((x) => x.type === "meal").length > 1;
    return false;
  };
  while (total() > cap) {
    const pool = items.filter(optional);
    const activities = pool.filter((i) => i.type === "activity").sort((a, b) => b.costEstimate - a.costEstimate);
    const meals = pool.filter((i) => i.type === "meal").sort((a, b) => b.costEstimate - a.costEstimate);
    const victim = activities[0] ?? meals[0];
    if (!victim) break;
    items.splice(items.indexOf(victim), 1);
    removed.push(victim.title);
    items.filter((x) => x.dayId === victim.dayId).sort((a, b) => a.orderIndex - b.orderIndex).forEach((x, idx) => (x.orderIndex = idx));
  }
  return removed;
}

/** Try the (lite) draft model first; if it is unavailable or rejects the request, retry on flash with thinking off. */
async function generatePlanJson(prompt: string, emit: ProgressFn): Promise<string> {
  const config = { responseMimeType: "application/json", responseJsonSchema: PLAN_SCHEMA, temperature: 0.7 };
  try {
    const res = await getClient().models.generateContent({ model: DRAFT, contents: prompt, config });
    return res.text ?? "{}";
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (DRAFT === FLASH) throw err;
    console.warn(`[ai] draft model "${DRAFT}" failed (${msg.slice(0, 80)}); retrying with ${FLASH}`);
    emit(`${DRAFT} didn't answer — switching to ${FLASH}…`);
    const res = await getClient().models.generateContent({ model: FLASH, contents: prompt, config: { ...config, ...NO_THINKING } });
    return res.text ?? "{}";
  }
}

function validatePlan(p: GeminiPlan) {
  if (!p?.destination?.name || typeof p.destination.lat !== "number" || typeof p.destination.lng !== "number") throw new Error("Gemini plan missing destination");
  if (!Array.isArray(p.days) || p.days.length < 2) throw new Error("Gemini plan has too few days");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.startDate ?? "")) throw new Error("Gemini plan has a bad startDate");
  for (const d of p.days) if (!Array.isArray(d.items)) throw new Error("Gemini day missing items");
}

function toDraftResult(trip: Trip, plan: GeminiPlan, start: string, end: string): DraftResult {
  const dest = plan.destination;
  const origin = plan.origin;
  const days: ItineraryDay[] = [];
  const items: ItineraryItem[] = [];
  const sorted = [...plan.days].sort((a, b) => a.dayNumber - b.dayNumber);
  let flightSeen = 0;

  sorted.forEach((d, idx) => {
    const n = idx + 1;
    const day: ItineraryDay = {
      id: `day_${trip.id}_${n}`,
      tripId: trip.id,
      dayNumber: n,
      date: addDays(start, idx),
      location: d.location || dest.name,
      lat: dest.lat,
      lng: dest.lng,
      headline: d.headline,
    };
    days.push(day);
    d.items.forEach((it, order) => {
      const type: ItemType = (["flight", "lodging", "activity", "meal", "transit"] as ItemType[]).includes(it.type) ? it.type : "activity";
      const item: ItineraryItem = {
        id: nanoid(10),
        dayId: day.id,
        type,
        title: it.title,
        details: {
          description: it.description,
          startTime: it.startTime,
          duration: it.duration,
          location: it.placeQuery ?? dest.name,
        },
        costEstimate: Math.max(0, Math.round(it.costPerPerson || 0)),
        orderIndex: order,
        votes: {},
        comments: [],
      };
      if (type === "flight") {
        const outbound = flightSeen === 0;
        flightSeen += 1;
        item.details = {
          ...item.details,
          from: outbound ? origin.name : dest.name,
          to: outbound ? dest.name : origin.name,
          fromCode: outbound ? origin.airportCode : dest.airportCode,
          toCode: outbound ? dest.airportCode : origin.airportCode,
          fromLat: outbound ? origin.airportLat : dest.airportLat,
          fromLng: outbound ? origin.airportLng : dest.airportLng,
          toLat: outbound ? dest.airportLat : origin.airportLat,
          toLng: outbound ? dest.airportLng : origin.airportLng,
        };
        if (!/→/.test(item.title)) item.title = `${item.details.fromCode} → ${item.details.toCode}`;
      } else {
        item.details.lat = typeof it.lat === "number" ? it.lat : dest.lat;
        item.details.lng = typeof it.lng === "number" ? it.lng : dest.lng;
        if (type === "lodging") item.details.nights = it.nights ?? Math.max(1, sorted.length - 1);
      }
      items.push(item);
    });
  });

  return {
    destination: { name: dest.name, country: dest.country, lat: dest.lat, lng: dest.lng, airport: dest.airportCode, airportLat: dest.airportLat, airportLng: dest.airportLng },
    origin: { name: origin.name, country: origin.country, lat: origin.airportLat, lng: origin.airportLng, airport: origin.airportCode, airportLat: origin.airportLat, airportLng: origin.airportLng },
    startDate: start,
    endDate: end,
    summary: plan.summary,
    days,
    items,
  };
}
