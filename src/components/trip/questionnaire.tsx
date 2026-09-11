"use client";

import { motion } from "framer-motion";
import { Check, Shuffle } from "lucide-react";
import { useState } from "react";
import { Button, cn } from "@/components/ui";
import { mergePrefs } from "@/lib/ai";
import { DESTINATIONS, INTEREST_OPTIONS, ORIGINS } from "@/lib/ai/destinations";
import { useStore } from "@/lib/store";
import type { Pace, StructuredPrefs, TripState } from "@/lib/types";
import { eur } from "@/lib/format";

export function Questionnaire({ state, onDone }: { state: TripState; onDone?: () => void }) {
  const addInput = useStore((s) => s.addInput);
  const addChatMessage = useStore((s) => s.addChatMessage);
  const me = useStore((s) => s.me)!;

  const [destination, setDestination] = useState<string>("");
  const [surprise, setSurprise] = useState(false);
  // Default to whatever the group has already said about where they're flying from.
  const [origin, setOrigin] = useState(() => mergePrefs(state.inputs).origin);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [flexible, setFlexible] = useState(true);
  const [nights, setNights] = useState(5);
  const [budget, setBudget] = useState(1500);
  const [pace, setPace] = useState<Pace>("balanced");
  const [interests, setInterests] = useState<string[]>([]);
  const [climate, setClimate] = useState<"warm" | "cold" | "mild" | "">("");
  const [must, setMust] = useState("");
  const [deal, setDeal] = useState("");
  const [saved, setSaved] = useState(false);

  const toggle = (k: string) => setInterests((xs) => (xs.includes(k) ? xs.filter((x) => x !== k) : [...xs, k]));

  const submit = () => {
    const prefs: StructuredPrefs = {
      origin,
      pace,
      budgetPerPerson: budget,
      flexibleDates: flexible,
    };
    if (surprise) prefs.surpriseMe = true;
    else if (destination) prefs.destination = destination;
    if (start && end && end > start) {
      prefs.startDate = start;
      prefs.endDate = end;
    } else prefs.nights = nights;
    if (interests.length) prefs.interests = interests;
    if (climate) prefs.climate = climate;
    if (must.trim()) prefs.mustHaves = must.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
    if (deal.trim()) prefs.dealBreakers = deal.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);

    const raw = [
      surprise ? "Surprise me" : destination ? `Destination: ${destination}` : "No destination preference",
      `from ${ORIGINS[origin].name}`,
      start && end ? `${start} → ${end}` : `${nights} nights${flexible ? ", flexible" : ""}`,
      `${eur(budget)}/person`,
      `${pace} pace`,
      interests.length ? `into ${interests.join(", ")}` : "",
      climate ? `${climate} weather` : "",
      must.trim() ? `must: ${must.trim()}` : "",
      deal.trim() ? `avoid: ${deal.trim()}` : "",
    ]
      .filter(Boolean)
      .join(" · ");

    addInput(state.trip.id, "questionnaire", raw, prefs);
    addChatMessage(state.trip.id, { memberId: "system", kind: "system", text: `${me.name} filled in the questionnaire` });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onDone?.();
    }, 1400);
  };

  return (
    <div className="px-4 sm:px-6 py-6 space-y-8">
      {/* Destination */}
      <Field n="1" label="Where are you picturing?" hint="Pick one, or let the planner choose.">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { setSurprise((s) => !s); setDestination(""); }} className="chip" data-on={surprise}>
            <Shuffle className="size-3.5" /> Surprise me
          </button>
          {DESTINATIONS.map((d) => (
            <button type="button" key={d.slug} onClick={() => { setDestination(destination === d.name ? "" : d.name); setSurprise(false); }} className="chip" data-on={destination === d.name}>
              {d.name}
            </button>
          ))}
        </div>
      </Field>

      {/* Origin */}
      <Field n="2" label="Flying from">
        <select value={origin} onChange={(e) => setOrigin(e.target.value)} className="field max-w-xs">
          {Object.entries(ORIGINS).map(([k, o]) => (
            <option key={k} value={k}>
              {o.name} ({o.airport})
            </option>
          ))}
        </select>
      </Field>

      {/* Dates */}
      <Field n="3" label="When?" hint="Exact dates, or just a length and we'll find a good window.">
        <div className="grid sm:grid-cols-2 gap-3 max-w-lg">
          <label className="block text-xs text-fg-3">
            Start
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="field mt-1" />
          </label>
          <label className="block text-xs text-fg-3">
            End
            <input type="date" value={end} min={start || undefined} onChange={(e) => setEnd(e.target.value)} className="field mt-1" />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-3 text-sm">
            <span className="text-fg-3">Or about</span>
            <input type="range" min={2} max={12} value={nights} onChange={(e) => setNights(+e.target.value)} className="accent-[var(--accent)] w-36" />
            <span className="tabular font-medium w-16">{nights} nights</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Toggle on={flexible} onChange={setFlexible} /> Dates are flexible
          </label>
        </div>
      </Field>

      {/* Budget */}
      <Field n="4" label="Budget per person" hint="All-in: flights, stay, food, fun. The group's draft is built to the lowest number.">
        <div className="flex items-center gap-4 max-w-lg">
          <input type="range" min={400} max={6000} step={50} value={budget} onChange={(e) => setBudget(+e.target.value)} className="accent-[var(--accent)] flex-1" />
          <span className="font-display text-3xl tabular w-28 text-right">{eur(budget)}</span>
        </div>
      </Field>

      {/* Pace */}
      <Field n="5" label="Pace">
        <Segmented value={pace} onChange={(v) => setPace(v as Pace)} options={[["slow", "Slow", "2 things a day"], ["balanced", "Balanced", "3 things a day"], ["packed", "Packed", "See everything"]]} />
      </Field>

      {/* Climate */}
      <Field n="6" label="Weather">
        <Segmented value={climate} onChange={(v) => setClimate(v as typeof climate)} options={[["", "Don't mind", ""], ["warm", "Warm", "Sun, beaches"], ["mild", "Mild", "Spring/autumn"], ["cold", "Cold", "Snow, aurora"]]} />
      </Field>

      {/* Interests */}
      <Field n="7" label="What makes a good day?" hint="Pick as many as you like.">
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((o) => (
            <button type="button" key={o.key} onClick={() => toggle(o.key)} className="chip" data-on={interests.includes(o.key)}>
              <span>{o.emoji}</span> {o.label}
            </button>
          ))}
        </div>
      </Field>

      {/* Musts */}
      <Field n="8" label="Must-haves & deal-breakers" hint="Comma separated. Be blunt.">
        <div className="grid sm:grid-cols-2 gap-3">
          <input value={must} onChange={(e) => setMust(e.target.value)} placeholder="Must-haves: a pool, one free day…" className="field" />
          <input value={deal} onChange={(e) => setDeal(e.target.value)} placeholder="Deal-breakers: early flights, hostels…" className="field" />
        </div>
      </Field>

      <div className="flex items-center gap-4 pt-2">
        <Button size="lg" onClick={submit} disabled={saved} className="min-w-48">
          {saved ? (
            <motion.span initial={{ scale: 0.6 }} animate={{ scale: 1 }} className="flex items-center gap-2">
              <Check className="size-4" /> Added to the brief
            </motion.span>
          ) : (
            "Add my answers"
          )}
        </Button>
        <span className="text-xs text-fg-3">You can submit more than once. Later answers refine, not replace.</span>
      </div>
    </div>
  );
}

function Field({ n, label, hint, children }: { n: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid sm:grid-cols-[2.5rem_1fr] gap-x-2">
      <span className="font-display text-2xl text-fg-4 leading-none pt-0.5 hidden sm:block">{n}</span>
      <div>
        <div className="font-medium">{label}</div>
        {hint && <div className="text-xs text-fg-3 mt-0.5 mb-3">{hint}</div>}
        {!hint && <div className="mb-3" />}
        {children}
      </div>
    </div>
  );
}

function Segmented({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string, string][] }) {
  return (
    <div className="inline-flex flex-wrap gap-1 p-1 rounded-2xl bg-bg-2 border border-line-c">
      {options.map(([v, label, sub]) => {
        const on = value === v;
        return (
          <button key={v} type="button" onClick={() => onChange(v)} className={cn("relative rounded-xl px-3.5 py-2 text-left transition-colors", on ? "text-bg" : "text-fg-2 hover:text-fg")}>
            {on && <motion.span layoutId="seg" className="absolute inset-0 rounded-xl bg-fg" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
            <span className="relative block text-sm font-medium">{label}</span>
            {sub && <span className={cn("relative block text-[11px]", on ? "text-bg/70" : "text-fg-4")}>{sub}</span>}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className={cn("relative w-10 h-6 rounded-full transition-colors", on ? "bg-fg" : "bg-bg-3 border border-line-c")}>
      <motion.span layout className={cn("absolute top-1 size-4 rounded-full", on ? "bg-bg" : "bg-fg-4")} style={{ left: on ? "calc(100% - 20px)" : 4 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
    </button>
  );
}
