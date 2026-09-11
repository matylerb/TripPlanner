"use client";

import { motion } from "framer-motion";
import { ArrowRight, Map as MapIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ItemIcon } from "@/components/trip/item-icon";
import { ButtonLink, Empty, cn } from "@/components/ui";
import { sortedItems, useStore } from "@/lib/store";
import { fmtDate, fmtRange, usd } from "@/lib/format";

const GoogleMapView = dynamic(() => import("@/components/trip/google-map-view"), {
  ssr: false,
  loading: () => <div className="h-full w-full shimmer" />,
});

export default function MapPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const state = useStore((s) => s.trips[tripId]);
  const [day, setDay] = useState<number | null>(null);
  const [focus, setFocus] = useState<string | null>(null);

  const listDays = useMemo(() => (state ? (day ? state.days.filter((d) => d.dayNumber === day) : state.days) : []), [state, day]);

  if (!state) return null;
  if (state.days.length === 0) {
    return <Empty icon={<MapIcon className="size-8" />} title="Nothing to map yet" body="Generate a draft and the whole trip, flights and all, shows up here." action={<ButtonLink href={`/trip/${tripId}/input`}>Go to the brief <ArrowRight className="size-4" /></ButtonLink>} />;
  }

  return (
    <div className="lg:h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="px-4 sm:px-8 pt-5 pb-3 flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <span className="eyebrow">Step 5</span>
          <h2 className="font-display text-2xl leading-none mt-0.5">
            {state.trip.destination?.name} <span className="text-fg-3 text-base">· {fmtRange(state.trip.startDate, state.trip.endDate)}</span>
          </h2>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-full bg-bg-2 border border-line-c overflow-x-auto max-w-full">
          <DayChip active={day === null} onClick={() => { setDay(null); setFocus(null); }}>
            Whole trip
          </DayChip>
          {state.days.map((d) => (
            <DayChip key={d.id} active={day === d.dayNumber} onClick={() => { setDay(d.dayNumber); setFocus(null); }}>
              Day {d.dayNumber}
            </DayChip>
          ))}
        </div>
      </div>

      <div className="flex-1 grid lg:grid-cols-[360px_1fr] gap-0 lg:gap-4 px-0 lg:px-8 pb-0 lg:pb-6 min-h-0">
        <div className="order-2 lg:order-1 overflow-y-auto lg:card p-3 sm:p-4 space-y-4 max-h-[50vh] lg:max-h-none">
          {listDays.map((d) => {
            const items = sortedItems(state.items, d.id);
            let idx = 0;
            return (
              <div key={d.id}>
                <div className="flex items-baseline gap-2 px-1 mb-1.5">
                  <span className="font-display text-xl">Day {d.dayNumber}</span>
                  <span className="text-xs text-fg-3">{fmtDate(d.date, "weekday")} · {d.location}</span>
                </div>
                <ul className="space-y-1">
                  {items.map((it) => {
                    const mappable = it.type !== "flight" && it.details.lat != null;
                    if (mappable) idx += 1;
                    const n = idx;
                    return (
                      <li key={it.id}>
                        <button
                          onClick={() => {
                            if (!mappable) return;
                            setDay(d.dayNumber);
                            setFocus(it.id);
                          }}
                          className={cn("w-full flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors", focus === it.id ? "bg-fg text-bg" : "hover:bg-bg-2", !mappable && "opacity-60 cursor-default")}
                        >
                          <span className={cn("grid place-items-center size-6 rounded-full text-[10px] font-bold shrink-0", focus === it.id ? "bg-bg text-fg" : "bg-bg-3 text-fg-2")}>{it.type === "flight" ? "✈" : it.type === "lodging" ? "⌂" : n}</span>
                          <ItemIcon type={it.type} size={22} />
                          <span className="flex-1 min-w-0 text-sm truncate">{it.title}</span>
                          <span className={cn("text-xs tabular", focus === it.id ? "text-bg/70" : "text-fg-3")}>{it.costEstimate ? usd(it.costEstimate) : ""}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="order-1 lg:order-2 relative h-[52vh] lg:h-auto lg:rounded-[1.5rem] overflow-hidden border-y lg:border border-line-c shadow-soft">
          <GoogleMapView state={state} selectedDay={day} focusId={focus} />
          <div className="absolute left-3 bottom-3 z-[500] flex flex-wrap gap-2 text-[11px]">
            <Legend swatch="border-2 border-dashed border-sky" label="Flight" />
            <Legend swatch="bg-accent" label="Stay" />
            <Legend swatch="bg-fg" label="Stops, in order" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function DayChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("relative rounded-full px-3.5 h-8 text-sm font-medium whitespace-nowrap transition-colors", active ? "text-bg" : "text-fg-2 hover:text-fg")}>
      {active && <motion.span layoutId="dayChip" className="absolute inset-0 rounded-full bg-fg" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
      <span className="relative">{children}</span>
    </button>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--card)_88%,transparent)] backdrop-blur px-2.5 py-1 border border-line-c text-fg-2">
      <span className={cn("size-2.5 rounded-full", swatch)} /> {label}
    </span>
  );
}
