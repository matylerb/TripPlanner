"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus, Star, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { ItemIcon } from "./item-icon";
import { useStore } from "@/lib/store";
import { DESTINATIONS, poiCategory, poiRating, type Poi, type PoiCategory } from "@/lib/ai/destinations";
import type { TripState } from "@/lib/types";
import { eur } from "@/lib/format";

const CATEGORIES: PoiCategory[] = ["Museums & Culture", "Food & Drink", "Outdoors & Nature", "Nightlife", "Wellness & Relax", "Sightseeing"];

export function ThingsToDo({ state, readOnly }: { state: TripState; readOnly?: boolean }) {
  const dest = useMemo(() => DESTINATIONS.find((d) => d.name === state.trip.destination?.name), [state.trip.destination?.name]);
  const [filter, setFilter] = useState<PoiCategory | "All">("All");

  if (!dest) return null;

  const pois = (filter === "All" ? dest.pois : dest.pois.filter((p) => poiCategory(p) === filter)).slice().sort((a, b) => poiRating(b) - poiRating(a));
  const presentCats = CATEGORIES.filter((c) => dest.pois.some((p) => poiCategory(p) === c));

  return (
    <div className="card overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-line-c">
        <div className="eyebrow">Things to do in {dest.name}</div>
        <p className="mt-1 text-sm text-fg-3">Museums, food, and more — rated, with one-tap add to any day.</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button data-on={filter === "All"} onClick={() => setFilter("All")} className="chip">
            All
          </button>
          {presentCats.map((c) => (
            <button key={c} data-on={filter === c} onClick={() => setFilter(c)} className="chip">
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="max-h-[560px] overflow-y-auto divide-y divide-line-c">
        <AnimatePresence initial={false}>
          {pois.map((poi) => (
            <PoiRow key={poi.title} poi={poi} state={state} readOnly={readOnly} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PoiRow({ poi, state, readOnly }: { poi: Poi; state: TripState; readOnly?: boolean }) {
  const addItem = useStore((s) => s.addItem);
  const deleteItem = useStore((s) => s.deleteItem);
  const rating = poiRating(poi);
  const added = state.items.filter((i) => i.title === poi.title);
  const defaultDay = state.days[Math.min(1, state.days.length - 1)]?.id ?? state.days[0]?.id ?? "";
  const [dayId, setDayId] = useState(defaultDay);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-5 py-3.5">
      <div className="flex items-start gap-3">
        <ItemIcon type={poi.type} size={34} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm leading-snug">{poi.title}</span>
            <span className="inline-flex items-center gap-0.5 text-xs text-gold font-medium shrink-0">
              <Star className="size-3 fill-current" /> {rating.toFixed(1)}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-fg-3 leading-relaxed line-clamp-2">{poi.description}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-fg-4 font-mono uppercase tracking-wide">
            <span>{poi.cost ? eur(poi.cost) : "Free"}</span>
            <span>{poi.duration}</span>
          </div>
        </div>
      </div>

      {!readOnly && state.days.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2 pl-[46px]">
          <select
            value={dayId}
            onChange={(e) => setDayId(e.target.value)}
            className="h-7 rounded-lg border border-line-c bg-bg-2 px-2 text-xs text-fg-2 outline-none focus:border-accent"
          >
            {state.days.map((d) => (
              <option key={d.id} value={d.id}>
                Day {d.dayNumber}
              </option>
            ))}
          </select>
          <button
            onClick={() =>
              dayId &&
              addItem(state.trip.id, dayId, poi.type, poi.title, {
                costEstimate: poi.cost,
                details: { description: poi.description, lat: poi.lat, lng: poi.lng, duration: poi.duration, location: state.trip.destination?.name },
              })
            }
            className="inline-flex items-center gap-1 rounded-full border border-line-c px-2.5 h-7 text-xs font-medium text-fg-2 hover:text-fg hover:border-fg-4 transition-colors"
          >
            <Plus className="size-3.5" /> Add
          </button>
          <AnimatePresence initial={false}>
            {added.map((it) => {
              const day = state.days.find((d) => d.id === it.dayId);
              return (
                <motion.span
                  key={it.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="inline-flex items-center gap-1 rounded-full bg-sage-soft text-sage dark:bg-sage/20 pl-2.5 pr-1 h-7 text-[11px] font-medium"
                >
                  Day {day?.dayNumber}
                  <button onClick={() => deleteItem(state.trip.id, it.id)} className="grid place-items-center size-5 rounded-full hover:bg-sage/30 transition-colors" aria-label={`Remove from day ${day?.dayNumber}`}>
                    <Trash2 className="size-3" />
                  </button>
                </motion.span>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
