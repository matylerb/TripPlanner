import { nanoid } from "nanoid";
import type {
  BookingOption,
  ItineraryDay,
  ItineraryItem,
  Member,
  Pace,
  PreferenceInput,
  StructuredPrefs,
  Trip,
} from "../types";
import { addDays, daysBetween } from "../format";
import { haversineKm } from "../geo";
import {
  DESTINATIONS,
  ORIGINS,
  airlinesFor,
  type DestinationProfile,
  type Poi,
  type Tag,
} from "./destinations";
import type { DraftResult, ProgressFn } from "./provider";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

const KEYWORDS: Record<Tag, string[]> = {
  warm: ["warm", "sun", "sunny", "hot", "tropical", "heat"],
  cold: ["cold", "snow", "ski", "winter", "aurora", "northern lights", "glacier"],
  mild: ["mild", "spring", "autumn", "fall weather"],
  beach: ["beach", "ocean", "sea", "surf", "swim", "coast", "island"],
  city: ["city", "urban", "skyline", "metropolis"],
  food: ["food", "eat", "foodie", "restaurant", "cuisine", "tacos", "sushi", "ramen", "wine", "tapas", "street food", "cooking"],
  culture: ["culture", "temple", "local", "tradition", "festival"],
  nature: ["nature", "hike", "hiking", "mountain", "mountains", "lake", "waterfall", "outdoors", "trek"],
  nightlife: ["nightlife", "bar", "bars", "club", "party", "drinks", "cocktail"],
  adventure: ["adventure", "adrenaline", "climb", "dive", "diving", "kayak", "bike"],
  art: ["art", "museum", "museums", "gallery", "design", "architecture", "photography"],
  budget: ["cheap", "budget", "affordable", "backpack", "hostel"],
  luxury: ["luxury", "splurge", "fancy", "michelin", "five star", "5 star", "spa hotel"],
  romantic: ["romantic", "honeymoon", "anniversary", "couple"],
  history: ["history", "historic", "ruins", "castle", "ancient", "old town"],
  wellness: ["wellness", "spa", "yoga", "relax", "relaxing", "chill", "onsen", "hot spring", "unwind"],
};

function detectTags(text: string): Tag[] {
  const t = text.toLowerCase();
  const found: Tag[] = [];
  (Object.keys(KEYWORDS) as Tag[]).forEach((tag) => {
    if (KEYWORDS[tag].some((k) => t.includes(k))) found.push(tag);
  });
  return found;
}

function detectBudget(text: string): number | undefined {
  const t = text.toLowerCase().replace(/,/g, "");
  const m =
    t.match(/\$\s?(\d{3,5})(?:\s?(?:k))?/) ||
    t.match(/(\d{3,5})\s?(?:dollars|usd|bucks)/) ||
    t.match(/budget[^0-9]{0,20}(\d{3,5})/) ||
    t.match(/(\d)(?:\.\d)?k\b/);
  if (!m) return undefined;
  let n = parseFloat(m[1]);
  if (/\dk\b/.test(m[0]) && n < 100) n *= 1000;
  if (n < 100 || n > 50000) return undefined;
  return Math.round(n);
}

function detectMonth(text: string): string | undefined {
  const t = text.toLowerCase();
  for (const m of MONTHS) if (t.includes(m) || t.includes(m.slice(0, 3) + " ")) return m;
  return undefined;
}

function detectDates(text: string): { start?: string; end?: string } {
  // e.g. "March 10-17", "Oct 3 to Oct 9", "2026-03-10 to 2026-03-17"
  const iso = text.match(/(\d{4}-\d{2}-\d{2})\s*(?:to|-|–|through)\s*(\d{4}-\d{2}-\d{2})/);
  if (iso) return { start: iso[1], end: iso[2] };
  const t = text.toLowerCase();
  const m = t.match(
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?\s*(?:-|–|to|through)\s*(?:(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+)?(\d{1,2})/,
  );
  if (!m) return {};
  const monIdx = (s: string) => MONTHS.findIndex((x) => x.startsWith(s.slice(0, 3)));
  const year = new Date().getFullYear() + (monIdx(m[1]) < new Date().getMonth() ? 1 : 0);
  const m1 = monIdx(m[1]);
  const m2 = m[3] ? monIdx(m[3]) : m1;
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    start: `${year}-${pad(m1 + 1)}-${pad(+m[2])}`,
    end: `${year}-${pad(m2 + 1)}-${pad(+m[4])}`,
  };
}

function detectNights(text: string): number | undefined {
  const m = text.toLowerCase().match(/(\d{1,2})\s*(?:nights|days)/);
  if (m) return Math.min(14, Math.max(2, parseInt(m[1], 10) - (m[0].includes("days") ? 1 : 0)));
  if (/long weekend/i.test(text)) return 3;
  if (/\bweek\b/i.test(text)) return 6;
  return undefined;
}

function detectDestination(text: string): DestinationProfile | undefined {
  const t = text.toLowerCase();
  return DESTINATIONS.find((d) => d.aliases.some((a) => new RegExp(`\\b${a}\\b`).test(t)));
}

function detectOrigin(text: string): string | undefined {
  const t = text.toLowerCase();
  const m = t.match(/(?:from|flying out of|leaving from|based in|live in)\s+([a-z .]+?)(?:[,.!?]|$| and | with | budget)/);
  const candidate = m?.[1]?.trim();
  for (const key of Object.keys(ORIGINS)) {
    const o = ORIGINS[key];
    if (candidate && o.aliases.some((a) => candidate.includes(a))) return key;
  }
  return undefined;
}

function detectPace(text: string): Pace | undefined {
  const t = text.toLowerCase();
  if (/(slow|chill|relax|lazy|easy|unwind|rest)/.test(t)) return "slow";
  if (/(packed|see everything|busy|non-stop|nonstop|jam)/.test(t)) return "packed";
  return undefined;
}

function detectDealBreakers(text: string): string[] {
  const out: string[] = [];
  const t = text.toLowerCase();
  if (/(hate|no|avoid|not a fan of|can't do|cant do)\s+(early|red-?eye|6\s?am|morning) flights?/.test(t) || /early flights?/.test(t))
    out.push("No early flights");
  if (/(hate|no|avoid).{0,15}(crowds|touristy|tourist traps)/.test(t)) out.push("Avoid crowds");
  if (/(hate|no|avoid).{0,15}(hostel)/.test(t)) out.push("No hostels");
  if (/(vegetarian|vegan)/.test(t)) out.push("Vegetarian-friendly food");
  if (/(no|avoid|hate).{0,15}(long flights?|layovers?)/.test(t)) out.push("Short flights only");
  if (/(hate|no|not).{0,10}(cold|freezing)/.test(t)) out.push("Nothing cold");
  return out;
}

function detectMustHaves(text: string): string[] {
  const out: string[] = [];
  const t = text.toLowerCase();
  if (/(pool)/.test(t)) out.push("Pool");
  if (/(walkable)/.test(t)) out.push("Walkable");
  if (/(direct flight|nonstop flight|non-stop flight)/.test(t)) out.push("Direct flights");
  if (/(rooftop)/.test(t)) out.push("Rooftop");
  if (/(one (?:big|nice) dinner|splurge dinner|fancy dinner)/.test(t)) out.push("One splurge dinner");
  if (/(free day|day off|down ?time)/.test(t)) out.push("A free day");
  return out;
}

/* ------------------------------------------------------------------ */
/* parsePreferences                                                    */
/* ------------------------------------------------------------------ */

export function parsePreferencesMock(text: string): StructuredPrefs {
  const tags = detectTags(text);
  const dest = detectDestination(text);
  const dates = detectDates(text);
  const prefs: StructuredPrefs = {};
  if (dest) prefs.destination = dest.name;
  if (/surprise me|anywhere|don'?t care where|open to anything/i.test(text)) prefs.surpriseMe = true;
  const origin = detectOrigin(text);
  if (origin) prefs.origin = origin;
  const month = detectMonth(text);
  if (month) prefs.month = month;
  if (dates.start) prefs.startDate = dates.start;
  if (dates.end) prefs.endDate = dates.end;
  if (/flexible|flex|whenever/i.test(text)) prefs.flexibleDates = true;
  const nights = detectNights(text);
  if (nights) prefs.nights = nights;
  const budget = detectBudget(text);
  if (budget) prefs.budgetPerPerson = budget;
  const pace = detectPace(text);
  if (pace) prefs.pace = pace;
  const interests = tags.filter((t) => !["warm", "cold", "mild"].includes(t));
  if (interests.length) prefs.interests = interests;
  if (tags.includes("warm")) prefs.climate = "warm";
  else if (tags.includes("cold")) prefs.climate = "cold";
  const db = detectDealBreakers(text);
  if (db.length) prefs.dealBreakers = db;
  const mh = detectMustHaves(text);
  if (mh.length) prefs.mustHaves = mh;
  return prefs;
}

export function aiReplyFor(prefs: StructuredPrefs, name: string): string {
  const bits: string[] = [];
  if (prefs.destination) bits.push(`${prefs.destination} is on the board`);
  if (prefs.surpriseMe) bits.push("open to anywhere");
  if (prefs.climate === "warm") bits.push("somewhere warm");
  if (prefs.climate === "cold") bits.push("somewhere cold");
  if (prefs.month) bits.push(`in ${prefs.month[0].toUpperCase() + prefs.month.slice(1)}`);
  if (prefs.startDate && prefs.endDate) bits.push(`${prefs.startDate} → ${prefs.endDate}`);
  if (prefs.nights) bits.push(`about ${prefs.nights} nights`);
  if (prefs.budgetPerPerson) bits.push(`~$${prefs.budgetPerPerson.toLocaleString()} per person`);
  if (prefs.interests?.length) bits.push(`into ${prefs.interests.slice(0, 3).join(", ")}`);
  if (prefs.pace) bits.push(`${prefs.pace} pace`);
  if (prefs.dealBreakers?.length) bits.push(`noted: ${prefs.dealBreakers.join(", ").toLowerCase()}`);
  if (prefs.mustHaves?.length) bits.push(`must-have: ${prefs.mustHaves.join(", ").toLowerCase()}`);
  if (!bits.length) {
    return `Got it, ${name}. I'll keep that in mind. Tell me about budget, timing, or what kind of place you're picturing and I'll fold it in.`;
  }
  const openers = ["Got it", "Noted", "Logged", "Perfect", "On it"];
  const o = openers[hash(name + bits.join()) % openers.length];
  return `${o} — ${bits.join(", ")}. Added to the group's preferences.`;
}

/** Deterministic non-negative string hash (safe to use for array indexing). */
function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/* ------------------------------------------------------------------ */
/* Merge preferences                                                  */
/* ------------------------------------------------------------------ */

export interface MergedPrefs {
  destinationVotes: Record<string, number>;
  surpriseMe: boolean;
  origin: string;
  month?: string;
  startDate?: string;
  endDate?: string;
  nights: number;
  budgetPerPerson: number;
  budgetSet: boolean;
  pace: Pace;
  interests: Record<Tag, number>;
  climate?: "warm" | "cold" | "mild";
  mustHaves: string[];
  dealBreakers: string[];
}

export function mergePrefs(inputs: PreferenceInput[]): MergedPrefs {
  const m: MergedPrefs = {
    destinationVotes: {},
    surpriseMe: false,
    origin: "nyc",
    nights: 5,
    budgetPerPerson: 1500,
    budgetSet: false,
    pace: "balanced",
    interests: {} as Record<Tag, number>,
    mustHaves: [],
    dealBreakers: [],
  };
  const budgets: number[] = [];
  const originVotes: Record<string, number> = {};
  const paces: Pace[] = [];
  const nightsArr: number[] = [];
  const climates: string[] = [];
  for (const inp of inputs) {
    const p = inp.structured;
    if (!p) continue;
    if (p.destination) m.destinationVotes[p.destination] = (m.destinationVotes[p.destination] ?? 0) + 1;
    if (p.surpriseMe) m.surpriseMe = true;
    if (p.origin) originVotes[p.origin] = (originVotes[p.origin] ?? 0) + 1;
    if (p.month) m.month = p.month;
    if (p.startDate && p.endDate) {
      m.startDate = p.startDate;
      m.endDate = p.endDate;
    }
    if (p.nights) nightsArr.push(p.nights);
    if (p.budgetPerPerson) budgets.push(p.budgetPerPerson);
    if (p.pace) paces.push(p.pace);
    if (p.climate) climates.push(p.climate);
    p.interests?.forEach((i) => {
      m.interests[i as Tag] = (m.interests[i as Tag] ?? 0) + 1;
    });
    p.mustHaves?.forEach((x) => !m.mustHaves.includes(x) && m.mustHaves.push(x));
    p.dealBreakers?.forEach((x) => !m.dealBreakers.includes(x) && m.dealBreakers.push(x));
  }
  // most-mentioned origin wins; ties go to whoever said it first
  const topOrigin = Object.entries(originVotes).sort((a, b) => b[1] - a[1])[0];
  if (topOrigin) m.origin = topOrigin[0];
  if (budgets.length) {
    // the group budget is the lowest stated budget — nobody gets priced out
    m.budgetPerPerson = Math.min(...budgets);
    m.budgetSet = true;
  }
  if (nightsArr.length) m.nights = Math.round(nightsArr.reduce((a, b) => a + b, 0) / nightsArr.length);
  if (m.startDate && m.endDate) m.nights = Math.max(2, daysBetween(m.startDate, m.endDate));
  if (paces.length) {
    const counts = paces.reduce((a, p) => ({ ...a, [p]: (a[p] ?? 0) + 1 }), {} as Record<Pace, number>);
    m.pace = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as Pace) ?? "balanced";
  }
  if (climates.length) {
    const c = climates.reduce((a, p) => ({ ...a, [p]: (a[p] ?? 0) + 1 }), {} as Record<string, number>);
    m.climate = Object.entries(c).sort((a, b) => b[1] - a[1])[0][0] as MergedPrefs["climate"];
  }
  return m;
}

/* ------------------------------------------------------------------ */
/* Destination choice                                                 */
/* ------------------------------------------------------------------ */

function scoreDestination(d: DestinationProfile, m: MergedPrefs, monthIdx: number, originKey: string) {
  let s = 0;
  const votes = m.destinationVotes[d.name] ?? 0;
  s += votes * 100;
  for (const [tag, n] of Object.entries(m.interests)) if (d.tags.includes(tag as Tag)) s += 6 * n;
  if (m.climate && d.tags.includes(m.climate)) s += 14;
  if (m.climate === "warm" && d.tags.includes("cold")) s -= 20;
  if (m.climate === "cold" && d.tags.includes("warm")) s -= 20;
  if (d.bestMonths.includes(monthIdx + 1)) s += 10;
  // budget fit
  const o = ORIGINS[originKey] ?? ORIGINS.nyc;
  const flight = flightEstimate([o.lat, o.lng], [d.airportLat, d.airportLng], d.priceLevel);
  const est = flight + d.nightly * m.nights + d.mealCost * 2.5 * (m.nights + 1) + 40 * m.nights;
  const ratio = est / m.budgetPerPerson;
  if (ratio <= 0.9) s += 8;
  else if (ratio <= 1.1) s += 3;
  else if (ratio <= 1.35) s -= 6;
  else s -= 18;
  if (m.dealBreakers.includes("Short flights only")) s -= Math.max(0, haversineKm([o.lat, o.lng], [d.airportLat, d.airportLng]) / 800 - 3) * 6;
  if (m.dealBreakers.includes("Nothing cold") && d.tags.includes("cold")) s -= 50;
  if (d.slug === "new-york" && originKey === "nyc") s -= 100;
  // gentle variety
  s += (hash(d.slug) % 7) / 10;
  return s;
}

export function flightEstimate(from: [number, number], to: [number, number], priceLevel: number) {
  const km = haversineKm(from, to);
  const base = 90 + km * 0.085 + (km > 5000 ? 120 : 0);
  return Math.round((base * (0.9 + priceLevel * 0.08)) / 5) * 5;
}

/* ------------------------------------------------------------------ */
/* Draft generation                                                   */
/* ------------------------------------------------------------------ */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function pickDates(m: MergedPrefs): { start: string; end: string } {
  if (m.startDate && m.endDate) return { start: m.startDate, end: m.endDate };
  const now = new Date();
  let target = new Date(now.getFullYear(), now.getMonth() + 2, 1);
  if (m.month) {
    const mi = MONTHS.indexOf(m.month);
    target = new Date(now.getFullYear(), mi, 1);
    if (target < now) target = new Date(now.getFullYear() + 1, mi, 1);
  }
  // pick the second Thursday of that month for a nice departure
  const d = new Date(target);
  while (d.getDay() !== 4) d.setDate(d.getDate() + 1);
  d.setDate(d.getDate() + 7);
  const start = d.toISOString().slice(0, 10);
  return { start, end: addDays(start, m.nights) };
}

function pickPois(pool: Poi[], m: MergedPrefs, used: Set<string>, slot: Poi["slot"], seed: number, strict = true): Poi | undefined {
  let candidates = pool.filter((p) => !used.has(p.title) && p.slot === slot);
  // If nothing fits this slot, borrow from a neighbouring one so a day is never left empty.
  if (!candidates.length && !strict) candidates = pool.filter((p) => !used.has(p.title));
  const scored = candidates
    .map((p) => {
      let s = 0;
      for (const t of p.tags) s += (m.interests[t] ?? 0) * 3;
      if (p.tags.includes("luxury") && !m.interests.luxury) s -= 4;
      if (p.tags.includes("budget") && m.interests.budget) s += 2;
      s += ((hash(p.title) + seed) % 5) / 5;
      return { p, s };
    })
    .sort((a, b) => b.s - a.s);
  const pick = scored[0]?.p;
  if (pick) used.add(pick.title);
  return pick;
}

export async function generateDraftMock(
  trip: Trip,
  inputs: PreferenceInput[],
  members: Member[],
  onProgress?: ProgressFn,
): Promise<DraftResult> {
  const m = mergePrefs(inputs);
  const originKey = m.origin in ORIGINS ? m.origin : "nyc";
  const origin = ORIGINS[originKey];
  const { start, end } = pickDates(m);
  const monthIdx = new Date(start + "T12:00:00").getMonth();

  onProgress?.(`Reading ${inputs.length} preference${inputs.length === 1 ? "" : "s"} from ${members.length} ${members.length === 1 ? "person" : "people"}…`);
  await sleep(700);

  const ranked = [...DESTINATIONS].sort(
    (a, b) => scoreDestination(b, m, monthIdx, originKey) - scoreDestination(a, m, monthIdx, originKey),
  );
  const dest = ranked[0];
  const runnerUp = ranked[1];
  onProgress?.(`Weighing ${DESTINATIONS.length} destinations against the group's budget and vibe…`);
  await sleep(900);
  onProgress?.(`${dest.name} wins. Sketching ${m.nights + 1} days…`);
  await sleep(800);

  const nights = m.nights;
  const dayCount = nights + 1;
  const flightCost = flightEstimate([origin.lat, origin.lng], [dest.airportLat, dest.airportLng], dest.priceLevel);
  const noEarly = m.dealBreakers.includes("No early flights");

  const days: ItineraryDay[] = [];
  const items: ItineraryItem[] = [];
  const used = new Set<string>();
  const perDay = m.pace === "slow" ? 2 : m.pace === "packed" ? 4 : 3;

  const dayId = (n: number) => `day_${trip.id}_${n}`;
  let order = 0;
  const push = (day: ItineraryDay, partial: Omit<ItineraryItem, "id" | "dayId" | "orderIndex" | "votes" | "comments">) => {
    items.push({
      id: nanoid(10),
      dayId: day.id,
      orderIndex: order++,
      votes: {},
      comments: [],
      ...partial,
    });
  };

  for (let n = 1; n <= dayCount; n++) {
    const date = addDays(start, n - 1);
    const day: ItineraryDay = {
      id: dayId(n),
      tripId: trip.id,
      dayNumber: n,
      date,
      location: n === 1 ? `${origin.name} → ${dest.name}` : n === dayCount ? `${dest.name} → ${origin.name}` : dest.name,
      lat: dest.lat,
      lng: dest.lng,
    };
    days.push(day);
    order = 0;

    if (n === 1) {
      day.headline = "Arrival";
      push(day, {
        type: "flight",
        title: `${origin.airport} → ${dest.airport}`,
        details: {
          from: origin.name, to: dest.name, fromCode: origin.airport, toCode: dest.airport,
          fromLat: origin.lat, fromLng: origin.lng, toLat: dest.airportLat, toLng: dest.airportLng,
          startTime: noEarly ? "11:40" : "07:15",
          duration: `${Math.max(1.5, Math.round((haversineKm([origin.lat, origin.lng], [dest.airportLat, dest.airportLng]) / 800) * 2) / 2)}h`,
          description: `Outbound. ${noEarly ? "Late-morning departure, as requested." : "Early departure to maximise day one."}`,
        },
        costEstimate: Math.round(flightCost / 2),
      });
      push(day, {
        type: "transit",
        title: `Airport → ${dest.neighborhood}`,
        details: { description: "Taxi or rideshare from the airport.", lat: dest.lat, lng: dest.lng, location: dest.neighborhood, duration: "45m" },
        costEstimate: dest.priceLevel === 3 ? 18 : 10,
      });
      push(day, {
        type: "lodging",
        title: `${dest.hotelNames[0]}, ${dest.neighborhood}`,
        details: { description: `Check-in. ${nights} nights. Base for the whole trip.`, lat: dest.lat + 0.003, lng: dest.lng - 0.002, location: dest.neighborhood, nights },
        costEstimate: dest.nightly * nights,
      });
      const ev = pickPois(dest.pois, m, used, "evening", n) ?? pickPois(dest.pois, m, used, "afternoon", n);
      if (ev) push(day, poiToItem(ev, dest));
    } else if (n === dayCount) {
      day.headline = "Departure";
      const mo = pickPois(dest.pois, m, used, "morning", n);
      if (mo && parseFloat(mo.duration) <= 3) push(day, poiToItem(mo, dest));
      push(day, {
        type: "transit",
        title: `${dest.neighborhood} → Airport`,
        details: { description: "Leave three hours before departure.", lat: dest.airportLat, lng: dest.airportLng, location: dest.airportName, duration: "45m" },
        costEstimate: dest.priceLevel === 3 ? 18 : 10,
      });
      push(day, {
        type: "flight",
        title: `${dest.airport} → ${origin.airport}`,
        details: {
          from: dest.name, to: origin.name, fromCode: dest.airport, toCode: origin.airport,
          fromLat: dest.airportLat, fromLng: dest.airportLng, toLat: origin.lat, toLng: origin.lng,
          startTime: "16:30",
          duration: `${Math.max(1.5, Math.round((haversineKm([origin.lat, origin.lng], [dest.airportLat, dest.airportLng]) / 800) * 2) / 2)}h`,
          description: "Return. Afternoon departure, home by tonight.",
        },
        costEstimate: Math.round(flightCost / 2),
      });
    } else {
      const slots: Poi["slot"][] =
        perDay === 2 ? ["midday", "evening"] : perDay === 3 ? ["morning", "midday", "evening"] : ["morning", "midday", "afternoon", "evening"];
      // Every other middle day, start with a big excursion (morning slot, long duration)
      const chosen: Poi[] = [];
      for (const slot of slots) {
        const p = pickPois(dest.pois, m, used, slot, n, false);
        if (p) chosen.push({ ...p, slot });
      }
      // ensure there is at least one meal per day
      if (!chosen.some((c) => c.type === "meal")) {
        const meal = dest.pois.find((p) => p.type === "meal" && !used.has(p.title));
        if (meal) {
          used.add(meal.title);
          chosen.push(meal);
        }
      }
      chosen.sort((a, b) => slotIdx(a.slot) - slotIdx(b.slot));
      day.headline = chosen[0]?.tags.includes("nature") ? "Out of town" : chosen.some((c) => c.tags.includes("beach")) ? "Slow day" : "Explore";
      for (const p of chosen) push(day, poiToItem(p, dest));
      if (m.mustHaves.includes("A free day") && n === Math.ceil(dayCount / 2)) {
        day.headline = "Free day";
        // strip to one meal
        const keep = items.filter((i) => i.dayId === day.id && i.type === "meal").slice(0, 1);
        for (let i = items.length - 1; i >= 0; i--) if (items[i].dayId === day.id && !keep.includes(items[i])) items.splice(i, 1);
      }
    }
  }

  onProgress?.("Pricing it out per person…");
  await sleep(700);

  const interestsList = Object.entries(m.interests)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k);
  const summary = [
    `${dest.name}, ${dest.country}: ${dest.blurb}`,
    `${nights} nights based in ${dest.neighborhood}, ${m.pace} pace${interestsList.length ? `, leaning into ${interestsList.join(", ")}` : ""}.`,
    m.budgetSet ? `Built to fit the group's tightest budget of $${m.budgetPerPerson.toLocaleString()} per person.` : "No budget was set, so this targets a mid-range spend.",
    runnerUp ? `Runner-up was ${runnerUp.name}. Say the word and I'll redraft.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    destination: {
      name: dest.name,
      country: dest.country,
      lat: dest.lat,
      lng: dest.lng,
      airport: dest.airport,
      airportLat: dest.airportLat,
      airportLng: dest.airportLng,
    },
    origin: {
      name: origin.name,
      country: origin.country,
      lat: origin.lat,
      lng: origin.lng,
      airport: origin.airport,
      airportLat: origin.lat,
      airportLng: origin.lng,
    },
    startDate: start,
    endDate: end,
    summary,
    days,
    items,
  };
}

function slotIdx(s: Poi["slot"]) {
  return ["morning", "midday", "afternoon", "evening"].indexOf(s);
}

function poiToItem(p: Poi, dest: DestinationProfile): Omit<ItineraryItem, "id" | "dayId" | "orderIndex" | "votes" | "comments"> {
  const times: Record<Poi["slot"], string> = { morning: "08:30", midday: "12:30", afternoon: "15:00", evening: "19:30" };
  return {
    type: p.type,
    title: p.title,
    details: { description: p.description, lat: p.lat, lng: p.lng, location: dest.name, startTime: times[p.slot], duration: p.duration },
    costEstimate: p.cost,
  };
}

/* ------------------------------------------------------------------ */
/* Booking search                                                     */
/* ------------------------------------------------------------------ */

function slugify(s: string) {
  return encodeURIComponent(s.trim());
}

export async function searchBookingsMock(
  trip: Trip,
  items: ItineraryItem[],
  memberCount: number,
  onProgress?: ProgressFn,
): Promise<BookingOption[]> {
  const out: BookingOption[] = [];
  const dest = DESTINATIONS.find((d) => d.name === trip.destination?.name) ?? DESTINATIONS[0];
  const airlines = airlinesFor(dest.slug);
  const start = trip.startDate ?? "";
  const end = trip.endDate ?? "";

  const flights = items.filter((i) => i.type === "flight");
  const lodgings = items.filter((i) => i.type === "lodging");
  const activities = items.filter((i) => i.type === "activity" && i.costEstimate > 0);

  onProgress?.(`Searching flights ${trip.origin?.airport} ⇄ ${trip.destination?.airport} for ${memberCount} travellers…`);
  await sleep(1100);

  flights.forEach((f, fi) => {
    const dateForLeg = fi === 0 ? start : end;
    const base = f.costEstimate;
    const variants = [
      { mult: 0.88, tag: "Cheapest", stops: "1 stop", time: "06:10" },
      { mult: 1.0, tag: "Best value", stops: "Nonstop", time: f.details.startTime ?? "09:40" },
      { mult: 1.22, tag: "Most comfortable", stops: "Nonstop · extra legroom", time: "13:25" },
    ];
    variants.forEach((v, i) => {
      const airline = airlines[(i + fi * 2 + hash(trip.id)) % airlines.length];
      const q = `Flights from ${f.details.fromCode} to ${f.details.toCode} on ${dateForLeg}`;
      out.push({
        id: nanoid(8),
        itineraryItemId: f.id,
        provider: airline,
        title: `${f.details.fromCode} → ${f.details.toCode} · ${v.stops}`,
        subtitle: `Departs ${v.time} · ${f.details.duration} · ${dateForLeg}`,
        price: Math.round((base * v.mult) / 5) * 5,
        rating: 4.1 + ((hash(airline) % 8) / 10),
        tags: [v.tag],
        deepLink: `https://www.google.com/travel/flights?q=${slugify(q)}`,
        status: "suggested",
        rank: i + 1,
      });
    });
  });

  onProgress?.(`Checking stays in ${dest.neighborhood}…`);
  await sleep(1000);

  lodgings.forEach((l) => {
    const nights = l.details.nights ?? 4;
    const perNight = l.costEstimate / nights;
    const variants = [
      { mult: 0.8, tag: "Great value", name: dest.hotelNames[1], stars: 3, note: "Rooftop terrace · Breakfast included" },
      { mult: 1.0, tag: "Top pick", name: dest.hotelNames[0], stars: 4, note: `Heart of ${dest.neighborhood} · Walkable` },
      { mult: 1.45, tag: "Splurge", name: dest.hotelNames[2], stars: 5, note: "Pool · Spa · Design hotel" },
    ];
    variants.forEach((v, i) => {
      const q = `${v.name} ${dest.name}`;
      out.push({
        id: nanoid(8),
        itineraryItemId: l.id,
        provider: i === 2 ? "Hotels.com" : "Booking.com",
        title: v.name,
        subtitle: `${"★".repeat(v.stars)} · ${v.note} · ${nights} nights`,
        price: Math.round(perNight * v.mult * nights),
        rating: 4.2 + ((hash(v.name) % 7) / 10),
        tags: [v.tag],
        deepLink:
          i === 2
            ? `https://www.hotels.com/search.do?q-destination=${slugify(q)}&q-check-in=${start}&q-check-out=${end}&q-rooms=1&q-room-0-adults=${memberCount}`
            : `https://www.booking.com/searchresults.html?ss=${slugify(q)}&checkin=${start}&checkout=${end}&group_adults=${memberCount}&no_rooms=${Math.ceil(memberCount / 2)}`,
        status: "suggested",
        rank: i + 1,
      });
    });
  });

  onProgress?.(`Finding bookable tickets for ${activities.length} activities…`);
  await sleep(900);

  activities.forEach((a, ai) => {
    const providers = [
      { name: "GetYourGuide", url: (q: string) => `https://www.getyourguide.com/s/?q=${slugify(q)}&date_from=${start}&date_to=${end}` },
      { name: "Viator", url: (q: string) => `https://www.viator.com/searchResults/all?text=${slugify(q)}` },
      { name: "Airbnb Experiences", url: (q: string) => `https://www.airbnb.com/s/${slugify(dest.name)}/experiences?query=${slugify(q)}` },
    ];
    const count = a.costEstimate > 25 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const p = providers[(ai + i) % providers.length];
      const q = `${a.title} ${dest.name}`;
      out.push({
        id: nanoid(8),
        itineraryItemId: a.id,
        provider: p.name,
        title: a.title,
        subtitle: i === 0 ? "Instant confirmation · Free cancellation" : "Small group · English guide",
        price: Math.round(a.costEstimate * (i === 0 ? 1 : 1.18)),
        rating: 4.4 + ((hash(a.title + i) % 5) / 10),
        tags: [i === 0 ? "Best match" : "Alternative"],
        deepLink: p.url(q),
        status: "suggested",
        rank: i + 1,
      });
    }
  });

  onProgress?.("Ranking by price, rating, and fit…");
  await sleep(600);
  return out;
}
