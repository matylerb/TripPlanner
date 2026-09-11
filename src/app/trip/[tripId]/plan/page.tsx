"use client";

import { motion } from "framer-motion";
import { ArrowRight, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BudgetPanel } from "@/components/trip/budget-panel";
import { Itinerary } from "@/components/trip/itinerary";
import { ButtonLink, Empty, Pill } from "@/components/ui";
import { useStore } from "@/lib/store";
import { fmtRange, plural } from "@/lib/format";

export default function PlanPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const state = useStore((s) => s.trips[tripId]);
  if (!state) return null;

  if (state.days.length === 0) {
    return (
      <Empty
        icon={<Sparkles className="size-8" />}
        title="No draft yet"
        body="Once the group has weighed in, generate a draft from the brief and it'll show up here for everyone to edit."
        action={
          <ButtonLink href={`/trip/${tripId}/input`}>
            Go to the brief <ArrowRight className="size-4" />
          </ButtonLink>
        }
      />
    );
  }

  const locked = state.trip.status === "committed" || state.trip.status === "booked";
  const committedCount = state.members.filter((m) => m.committed).length;
  const d = state.trip.destination!;

  return (
    <div className="px-4 sm:px-8 pt-6">
      {/* Destination header */}
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="relative overflow-hidden rounded-[1.75rem] bg-fg text-bg px-6 sm:px-10 py-8 sm:py-10 mb-6">
        <div className="absolute inset-0 opacity-[0.16] [background:radial-gradient(circle_at_85%_15%,var(--accent),transparent_45%),radial-gradient(circle_at_10%_90%,var(--color-sky),transparent_40%)]" />
        <div className="relative grid lg:grid-cols-12 gap-6 items-end">
          <div className="lg:col-span-8">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono uppercase tracking-widest opacity-70">
              <span>Step 2 · Draft</span>
              <span>·</span>
              <span>{fmtRange(state.trip.startDate, state.trip.endDate)}</span>
              <span>·</span>
              <span>{plural(state.days.length, "day")}</span>
              {locked && (
                <Pill tone="sky" className="ml-1">
                  <Lock className="size-3" /> Locked
                </Pill>
              )}
            </div>
            <h2 className="mt-3 font-display-tight text-[clamp(2.6rem,7vw,5.5rem)] leading-[0.92]">
              {d.name}
              <span className="block text-[0.45em] font-display opacity-70 mt-2">{d.country}</span>
            </h2>
            {state.trip.summary && <p className="mt-5 max-w-2xl text-[15px] leading-relaxed opacity-85">{state.trip.summary}</p>}
          </div>
          <div className="lg:col-span-4 lg:justify-self-end flex flex-col items-start lg:items-end gap-3">
            {locked ? (
              <Link href={`/trip/${tripId}/bookings`} className="inline-flex items-center gap-2 rounded-full bg-bg text-fg px-6 h-12 text-[15px] font-medium hover:scale-[1.02] transition-transform">
                See bookings <ArrowRight className="size-4" />
              </Link>
            ) : (
              <Link href={`/trip/${tripId}/commit`} className="inline-flex items-center gap-2 rounded-full bg-bg text-fg px-6 h-12 text-[15px] font-medium hover:scale-[1.02] transition-transform">
                Ready to commit <ArrowRight className="size-4" />
              </Link>
            )}
            <span className="text-xs opacity-60">
              {committedCount}/{state.members.length} in so far
            </span>
          </div>
        </div>
      </motion.header>

      <div className="grid xl:grid-cols-[1fr_360px] gap-6 items-start">
        <div>
          {!locked && <p className="mb-4 text-sm text-fg-3">Click a title or a price to edit. Drag the handle to reorder. Everyone sees changes instantly.</p>}
          <Itinerary state={state} readOnly={locked} />
        </div>
        <div className="xl:sticky xl:top-[4.5rem] space-y-4">
          <BudgetPanel state={state} />
        </div>
      </div>
    </div>
  );
}
