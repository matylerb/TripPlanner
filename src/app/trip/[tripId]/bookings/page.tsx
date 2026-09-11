"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Check, Lock, PartyPopper, Search, Star } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { CountUp } from "@/components/count-up";
import { ItemIcon } from "@/components/trip/item-icon";
import { Button, ButtonLink, Empty, Pill, cn } from "@/components/ui";
import { ai } from "@/lib/ai";
import { useStore } from "@/lib/store";
import type { BookingOption, ItineraryItem } from "@/lib/types";
import { usd } from "@/lib/format";

export default function BookingsPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const state = useStore((s) => s.trips[tripId]);
  const busy = useStore((s) => s.aiBusy[tripId]);
  const selectBooking = useStore((s) => s.selectBooking);
  const markBooked = useStore((s) => s.markBooked);
  const setBookingSearch = useStore((s) => s.setBookingSearch);
  const setBookings = useStore((s) => s.setBookings);
  const setAiBusy = useStore((s) => s.setAiBusy);

  const committed = state?.trip.status === "committed" || state?.trip.status === "booked";
  const searching = state?.trip.bookingSearchState === "searching";

  const runSearch = useCallback(async () => {
    const s = useStore.getState().trips[tripId];
    if (!s) return;
    setBookingSearch(tripId, "searching");
    try {
      const o = await ai.searchBookings(s.trip, s.items, s.members.length, (m) => setAiBusy(tripId, m));
      setBookings(tripId, o);
    } catch (err) {
      console.error("[bookings] search failed", err);
      setBookingSearch(tripId, "failed");
    } finally {
      setAiBusy(tripId, null);
    }
  }, [tripId, setBookingSearch, setBookings, setAiBusy]);

  // Resilience: if a trip is committed but nobody ran the search (e.g. reload mid-search), run it once here.
  const autoRan = useRef(false);
  useEffect(() => {
    if (!state || !committed || autoRan.current) return;
    if (state.trip.bookingSearchState === "idle" && state.bookings.length === 0) {
      autoRan.current = true;
      runSearch();
    }
  }, [state, committed, runSearch]);

  const failed = !!state && committed && state.trip.bookingSearchState === "failed";

  const groups = useMemo(() => {
    if (!state) return [];
    const byItem = new Map<string, BookingOption[]>();
    for (const b of state.bookings) byItem.set(b.itineraryItemId, [...(byItem.get(b.itineraryItemId) ?? []), b]);
    const order: ItineraryItem["type"][] = ["flight", "lodging", "activity"];
    return order
      .map((type) => ({
        type,
        label: { flight: "Flights", lodging: "Where you'll stay", activity: "Tickets & experiences" }[type as "flight" | "lodging" | "activity"],
        items: state.items
          .filter((i) => i.type === type && byItem.has(i.id))
          .map((i) => ({ item: i, day: state.days.find((d) => d.id === i.dayId), options: (byItem.get(i.id) ?? []).sort((a, b) => a.rank - b.rank) })),
      }))
      .filter((g) => g.items.length > 0);
  }, [state]);

  if (!state) return null;

  if (!committed) {
    return <Empty icon={<Lock className="size-8" />} title="Locked until the group commits" body="Booking search only runs after everyone's in. That's the point." action={<ButtonLink href={`/trip/${tripId}/commit`}>Go to commit <ArrowRight className="size-4" /></ButtonLink>} />;
  }

  const selected = state.bookings.filter((b) => b.status === "selected" || b.status === "confirmed_by_user");
  const selectedTotal = selected.reduce((s, b) => s + b.price, 0);
  const hasFlight = selected.some((b) => state.items.find((i) => i.id === b.itineraryItemId)?.type === "flight");
  const hasStay = selected.some((b) => state.items.find((i) => i.id === b.itineraryItemId)?.type === "lodging");
  const booked = state.trip.status === "booked";

  return (
    <div className="px-4 sm:px-8 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <span className="eyebrow">Step 4</span>
          <h2 className="mt-1 font-display text-[clamp(1.9rem,3.5vw,2.75rem)] leading-[1]">{booked ? "Booked. Go pack." : "Pick what to book."}</h2>
          <p className="mt-2 text-sm text-fg-3 max-w-xl">Ranked options for every bookable line in the plan. &ldquo;Open&rdquo; takes you to a pre-filled search at the provider; you complete the purchase there.</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {searching || (state.bookings.length === 0 && !booked) ? (
          <motion.div key="searching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -8 }} className="card p-10 grid place-items-center text-center">
            <div className="relative size-16">
              <span className="absolute inset-0 rounded-full pulse-ring" />
              <span className="absolute inset-0 grid place-items-center rounded-full bg-fg text-bg">
                <Search className="size-6" />
              </span>
            </div>
            <div className="mt-6 font-display text-2xl">{failed ? "Search didn't finish" : "Searching…"}</div>
            <p className="mt-1 text-sm text-fg-3 font-mono min-h-[1.5em]">{busy ?? (failed ? "Something went wrong on the way." : "Reading the committed plan")}</p>
            {failed && (
              <Button className="mt-5" onClick={runSearch}>
                <Search className="size-4" /> Search again
              </Button>
            )}
            <div className="mt-6 w-full max-w-md space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 rounded-xl shimmer" />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid xl:grid-cols-[1fr_340px] gap-6 items-start">
            <div className="space-y-8">
              {groups.map((g) => (
                <section key={g.type}>
                  <h3 className="font-display text-2xl mb-3 flex items-center gap-2">
                    <ItemIcon type={g.type} size={28} /> {g.label}
                  </h3>
                  <div className="space-y-4">
                    {g.items.map(({ item, day, options }) => (
                      <div key={item.id} className="card overflow-hidden">
                        <div className="px-5 py-3 border-b border-line-c flex items-center justify-between gap-3 bg-bg-2/50">
                          <div className="min-w-0">
                            <div className="font-medium truncate">{item.title}</div>
                            <div className="text-xs text-fg-3">
                              Day {day?.dayNumber} · planned at {usd(item.costEstimate)} pp
                            </div>
                          </div>
                        </div>
                        <ul className="divide-y divide-line-c">
                          {options.map((o) => (
                            <OptionRow key={o.id} option={o} planned={item.costEstimate} booked={booked} onSelect={() => selectBooking(tripId, o.id)} />
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <div className="card p-5 xl:sticky xl:top-[4.5rem]">
              <div className="eyebrow">Selected, per person</div>
              <div className="mt-1 font-display-tight text-[2.6rem] leading-none tabular">
                <CountUp value={selectedTotal} format={(n) => usd(n)} />
              </div>
              <div className="mt-1 text-xs text-fg-3">
                {selected.length} of {groups.reduce((s, g) => s + g.items.length, 0)} lines chosen
              </div>
              <ul className="mt-4 space-y-1.5 text-sm">
                <Req ok={hasFlight} label="A flight picked" />
                <Req ok={hasStay} label="A place to stay picked" />
              </ul>
              <div className="mt-5">
                {booked ? (
                  <div className="rounded-xl bg-sage-soft dark:bg-sage/15 text-sage p-4 text-sm flex gap-2">
                    <PartyPopper className="size-4 shrink-0 mt-0.5" />
                    <span>Marked as booked. Your selections are saved. Complete each purchase at the provider if you haven&apos;t already.</span>
                  </div>
                ) : (
                  <Button size="lg" className="w-full" disabled={!hasFlight || !hasStay} onClick={() => markBooked(tripId)}>
                    <Check className="size-4" /> Mark trip as booked
                  </Button>
                )}
                <ButtonLink href={`/trip/${tripId}/map`} variant="secondary" size="md" className="w-full mt-2">
                  See it on the map <ArrowRight className="size-4" />
                </ButtonLink>
              </div>
              <p className="mt-4 text-[11px] text-fg-4 leading-relaxed">No payment happens here. This step is structured so a real checkout can replace &ldquo;Open&rdquo; later.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Req({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={cn("flex items-center gap-2", ok ? "text-fg" : "text-fg-3")}>
      <span className={cn("grid place-items-center size-4 rounded-full", ok ? "bg-sage text-white" : "border border-line-c")}>{ok && <Check className="size-2.5" />}</span>
      {label}
    </li>
  );
}

function OptionRow({ option, planned, booked, onSelect }: { option: BookingOption; planned: number; booked: boolean; onSelect: () => void }) {
  const on = option.status !== "suggested";
  const diff = option.price - planned;
  return (
    <motion.li layout className={cn("flex flex-wrap sm:flex-nowrap items-center gap-3 px-5 py-3.5 transition-colors", on && "bg-accent-soft/40 dark:bg-accent/10")}>
      <span className={cn("grid place-items-center size-7 rounded-full text-xs font-bold shrink-0", option.rank === 1 ? "bg-fg text-bg" : "bg-bg-3 text-fg-3")}>{option.rank}</span>
      <div className="min-w-0 flex-1 basis-48">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{option.provider}</span>
          {option.tags?.map((t) => (
            <Pill key={t} tone={t === "Best value" || t === "Top pick" || t === "Best match" ? "accent" : "neutral"}>
              {t}
            </Pill>
          ))}
        </div>
        <div className="text-sm text-fg-2 truncate">{option.title}</div>
        {option.subtitle && <div className="text-xs text-fg-3 truncate">{option.subtitle}</div>}
      </div>
      {option.rating && (
        <span className="inline-flex items-center gap-1 text-xs text-fg-2 tabular shrink-0">
          <Star className="size-3.5 fill-gold text-gold" /> {option.rating.toFixed(1)}
        </span>
      )}
      <div className="text-right shrink-0 w-24">
        <div className="font-display text-xl tabular">{usd(option.price)}</div>
        <div className={cn("text-[10.5px] tabular", diff > 0 ? "text-red-500" : "text-sage")}>{diff === 0 ? "on plan" : diff > 0 ? `+${usd(diff)}` : `−${usd(-diff)}`}</div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-auto">
        <a href={option.deepLink} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 h-8 px-3 rounded-lg border border-line-c text-sm hover:border-fg-4 transition-colors">
          Open <ArrowUpRight className="size-3.5" />
        </a>
        <button onClick={onSelect} disabled={booked} className={cn("inline-flex items-center gap-1 h-8 px-3 rounded-lg text-sm font-medium transition-all active:scale-95 disabled:opacity-60", on ? "bg-accent text-white" : "bg-fg text-bg")}>
          {on ? (
            <>
              <Check className="size-3.5" /> Selected
            </>
          ) : (
            "Select"
          )}
        </button>
      </div>
    </motion.li>
  );
}
