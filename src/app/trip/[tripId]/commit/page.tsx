"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Lock, RotateCcw, Sparkles, Unlock } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar, Button, ButtonLink, Empty, cn } from "@/components/ui";
import { ai } from "@/lib/ai";
import { budgetTotals } from "@/lib/budget";
import { useStore } from "@/lib/store";
import { fmtRange, plural, usd } from "@/lib/format";

export default function CommitPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const router = useRouter();
  const state = useStore((s) => s.trips[tripId]);
  const me = useStore((s) => s.me);
  const setCommitted = useStore((s) => s.setCommitted);
  const lockTrip = useStore((s) => s.lockTrip);
  const reopenPlanning = useStore((s) => s.reopenPlanning);
  const setBookingSearch = useStore((s) => s.setBookingSearch);
  const setBookings = useStore((s) => s.setBookings);
  const setAiBusy = useStore((s) => s.setAiBusy);
  const [confirmOverride, setConfirmOverride] = useState(false);

  if (!state || !me) return null;
  if (state.days.length === 0) {
    return <Empty icon={<Sparkles className="size-8" />} title="Nothing to commit to yet" body="Generate a draft first, then come back here once the group is happy with it." action={<ButtonLink href={`/trip/${tripId}/input`}>Go to the brief <ArrowRight className="size-4" /></ButtonLink>} />;
  }

  const mine = state.members.find((m) => m.id === me.id)!;
  const committed = state.members.filter((m) => m.committed);
  const all = committed.length === state.members.length;
  const quorum = committed.length >= Math.ceil(state.members.length / 2);
  const locked = state.trip.status === "committed" || state.trip.status === "booked";
  const { perPerson } = budgetTotals(state.budget);
  const d = state.trip.destination!;

  const lock = async () => {
    lockTrip(tripId);
    setBookingSearch(tripId, "searching");
    router.push(`/trip/${tripId}/bookings`);
    try {
      const options = await ai.searchBookings(state.trip, state.items, state.members.length, (m) => setAiBusy(tripId, m));
      setBookings(tripId, options);
    } finally {
      setAiBusy(tripId, null);
    }
  };

  return (
    <div className="px-4 sm:px-8 pt-6 max-w-6xl">
      <span className="eyebrow">Step 3</span>
      <h2 className="mt-1 font-display text-[clamp(1.9rem,3.5vw,2.75rem)] leading-[1]">{locked ? "The plan is locked." : "Is everyone in?"}</h2>
      <p className="mt-2 text-sm text-fg-3 max-w-xl">
        {locked ? "Bookings are being searched against this exact plan. Nothing is purchased automatically." : "Nothing gets searched or booked until the group commits. Toggle yourself in; the organiser locks it when everyone's ready."}
      </p>

      <div className="mt-8 grid lg:grid-cols-[1fr_340px] gap-6 items-start">
        <div className="space-y-5">
          {/* What you're committing to */}
          <div className="card p-6 grid sm:grid-cols-3 gap-5">
            <div className="sm:col-span-3 flex items-baseline justify-between gap-4 border-b border-line-c pb-4">
              <div className="font-display text-3xl leading-none">
                {d.name}
                <span className="text-fg-3 text-lg"> · {d.country}</span>
              </div>
              <span className="text-sm text-fg-3">{fmtRange(state.trip.startDate, state.trip.endDate)}</span>
            </div>
            <Stat label="Days" value={String(state.days.length)} />
            <Stat label="Per person" value={usd(perPerson)} />
            <Stat label="Group total" value={usd(perPerson * state.members.length)} />
          </div>

          {/* Members */}
          <div className="grid sm:grid-cols-2 gap-3">
            {state.members.map((m) => {
              const isMe = m.id === me.id;
              return (
                <motion.div key={m.id} layout className={cn("card p-4 flex items-center gap-3 transition-colors", m.committed && "border-sage/60 bg-sage-soft/40 dark:bg-sage/10")}>
                  <Avatar name={m.displayName} color={m.color} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {m.displayName} {isMe && <span className="text-fg-4 font-normal">(you)</span>}
                    </div>
                    <div className="text-xs text-fg-3">{m.isOrganizer ? "Organiser" : "Member"}</div>
                  </div>
                  {isMe && !locked ? (
                    <button onClick={() => setCommitted(tripId, !mine.committed)} className={cn("relative h-9 rounded-full px-4 text-sm font-medium transition-all active:scale-95", mine.committed ? "bg-sage text-white" : "bg-fg text-bg")}>
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.span key={String(mine.committed)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="flex items-center gap-1.5">
                          {mine.committed ? (
                            <>
                              <Check className="size-4" /> I&apos;m in
                            </>
                          ) : (
                            "I'm in"
                          )}
                        </motion.span>
                      </AnimatePresence>
                    </button>
                  ) : (
                    <span className={cn("grid place-items-center size-9 rounded-full", m.committed ? "bg-sage text-white" : "bg-bg-3 text-fg-4")}>
                      {m.committed ? <Check className="size-4" /> : <span className="size-2 rounded-full bg-current" />}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Lock panel */}
        <div className="card p-6 lg:sticky lg:top-[4.5rem]">
          <Ring value={committed.length / Math.max(1, state.members.length)} label={`${committed.length}/${state.members.length}`} />
          <div className="mt-4 text-center">
            <div className="font-display text-2xl">{locked ? "Locked in" : all ? "Everyone's in" : `${plural(state.members.length - committed.length, "person", "people")} still deciding`}</div>
            <p className="mt-1 text-xs text-fg-3">{locked ? `Locked ${state.trip.committedAt ? new Date(state.trip.committedAt).toLocaleString() : ""}` : all ? "The organiser can lock the plan and start the search." : quorum ? "Quorum reached. The organiser can lock early." : "Waiting for a majority."}</p>
          </div>

          <div className="mt-6 space-y-2">
            {locked ? (
              <>
                <ButtonLink href={`/trip/${tripId}/bookings`} size="lg" className="w-full">
                  See bookings <ArrowRight className="size-4" />
                </ButtonLink>
                {mine.isOrganizer && state.trip.status !== "booked" && (
                  <Button variant="ghost" size="md" className="w-full" onClick={() => reopenPlanning(tripId)}>
                    <Unlock className="size-4" /> Reopen planning
                  </Button>
                )}
              </>
            ) : mine.isOrganizer ? (
              <>
                {all || confirmOverride ? (
                  <Button size="lg" className="w-full" onClick={lock}>
                    <Lock className="size-4" /> Lock it in & find bookings
                  </Button>
                ) : (
                  <Button size="lg" className="w-full" disabled={!quorum} onClick={() => setConfirmOverride(true)}>
                    <Lock className="size-4" /> Lock with {committed.length} of {state.members.length}
                  </Button>
                )}
                {confirmOverride && !all && <p className="text-[11.5px] text-fg-3 text-center">Not everyone has committed. Locking now goes ahead without them.</p>}
                <Button variant="ghost" size="sm" className="w-full" onClick={() => router.push(`/trip/${tripId}/plan`)}>
                  <RotateCcw className="size-3.5" /> Keep editing
                </Button>
              </>
            ) : (
              <p className="text-xs text-fg-3 text-center">Only the organiser can lock the plan.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div className="mt-1 font-display text-2xl tabular">{value}</div>
    </div>
  );
}

function Ring({ value, label }: { value: number; label: string }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-32 mx-auto">
      <svg viewBox="0 0 120 120" className="size-32 -rotate-90">
        <circle cx="60" cy="60" r={r} stroke="var(--line)" strokeWidth="8" fill="none" />
        <motion.circle cx="60" cy="60" r={r} stroke={value >= 1 ? "var(--color-sage)" : "var(--accent)"} strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - value) }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-display text-3xl tabular">{label}</span>
    </div>
  );
}
