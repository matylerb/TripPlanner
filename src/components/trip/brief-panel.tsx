"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Sparkles, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Avatar, Button, Pill, cn } from "@/components/ui";
import { ai, mergePrefs } from "@/lib/ai";
import { ORIGINS } from "@/lib/ai/destinations";
import { useStore } from "@/lib/store";
import type { TripState } from "@/lib/types";
import { eur, plural, timeAgo } from "@/lib/format";

export function BriefPanel({ state }: { state: TripState }) {
  const router = useRouter();
  const me = useStore((s) => s.me)!;
  const removeInput = useStore((s) => s.removeInput);
  const applyDraft = useStore((s) => s.applyDraft);
  const setAiBusy = useStore((s) => s.setAiBusy);
  const busyMsg = useStore((s) => s.aiBusy[state.trip.id]);
  const [log, setLog] = useState<string[]>([]);
  const [local, setLocal] = useState(false);

  const merged = useMemo(() => mergePrefs(state.inputs), [state.inputs]);
  const contributors = new Set(state.inputs.map((i) => i.memberId));
  const readiness = Math.min(1, (contributors.size / Math.max(1, state.members.length)) * 0.6 + Math.min(state.inputs.length, 4) * 0.1);
  const hasDraft = state.trip.status !== "gathering";

  const generate = async () => {
    setLocal(true);
    setLog([]);
    setAiBusy(state.trip.id, "Starting…");
    try {
      const draft = await ai.generateDraft(state.trip, state.inputs, state.members, (m) => {
        setLog((l) => [...l, m]);
        setAiBusy(state.trip.id, m);
      });
      applyDraft(state.trip.id, draft);
      setAiBusy(state.trip.id, null);
      router.push(`/trip/${state.trip.id}/plan`);
    } catch (e) {
      console.error(e);
      setAiBusy(state.trip.id, null);
      setLocal(false);
    }
  };

  const busy = !!busyMsg || local;
  const topDest = Object.entries(merged.destinationVotes).sort((a, b) => b[1] - a[1])[0];
  const interests = Object.entries(merged.interests).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-line-c flex items-center justify-between">
        <div>
          <span className="eyebrow">The brief</span>
          <div className="text-sm text-fg-3 mt-0.5">
            {plural(state.inputs.length, "input")} from {plural(contributors.size, "person", "people")}
          </div>
        </div>
        <ReadinessRing value={readiness} />
      </div>

      {/* Merged summary */}
      <div className="px-5 py-4 grid grid-cols-2 gap-x-4 gap-y-3 border-b border-line-c">
        <Stat label="Destination" value={merged.surpriseMe && !topDest ? "Surprise us" : topDest ? `${topDest[0]}${topDest[1] > 1 ? ` ×${topDest[1]}` : ""}` : "Open"} />
        <Stat label="From" value={ORIGINS[merged.origin]?.name ?? "New York"} />
        <Stat label="When" value={merged.startDate && merged.endDate ? `${merged.startDate.slice(5)} → ${merged.endDate.slice(5)}` : merged.month ? `${merged.month[0].toUpperCase()}${merged.month.slice(1)} · ${merged.nights}n` : `~${merged.nights} nights`} />
        <Stat label="Budget / person" value={merged.budgetSet ? eur(merged.budgetPerPerson) : "Not set"} accent={merged.budgetSet} />
        <Stat label="Pace" value={merged.pace} cap />
        <Stat label="Weather" value={merged.climate ?? "Any"} cap />
        {interests.length > 0 && (
          <div className="col-span-2">
            <div className="eyebrow mb-1.5">Into</div>
            <div className="flex flex-wrap gap-1.5">
              {interests.map(([k, n]) => (
                <Pill key={k} tone="accent" className="capitalize">
                  {k} {n > 1 && <span className="opacity-60">×{n}</span>}
                </Pill>
              ))}
            </div>
          </div>
        )}
        {(merged.mustHaves.length > 0 || merged.dealBreakers.length > 0) && (
          <div className="col-span-2 flex flex-wrap gap-1.5">
            {merged.mustHaves.map((m) => (
              <Pill key={m} tone="sage">✓ {m}</Pill>
            ))}
            {merged.dealBreakers.map((m) => (
              <Pill key={m} tone="plum">✕ {m}</Pill>
            ))}
          </div>
        )}
      </div>

      {/* Inputs list */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
        {state.inputs.length === 0 && <p className="text-sm text-fg-3 leading-relaxed">Nothing yet. Say something in the chat, or fill in the questionnaire. Every message and answer lands here as part of one shared brief.</p>}
        <AnimatePresence initial={false}>
          {[...state.inputs].reverse().map((inp) => {
            const m = state.members.find((x) => x.id === inp.memberId);
            return (
              <motion.div key={inp.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} className="group rounded-xl border border-line-c bg-bg-2 p-3">
                <div className="flex items-center gap-2 text-xs text-fg-3">
                  <Avatar name={m?.displayName ?? "?"} color={m?.color ?? "#888"} size={18} />
                  <span className="font-medium text-fg-2">{m?.displayName}</span>
                  <Pill className="capitalize">{inp.source}</Pill>
                  <span className="ml-auto">{timeAgo(inp.createdAt)}</span>
                  {inp.memberId === me.id && (
                    <button onClick={() => removeInput(state.trip.id, inp.id)} className="opacity-0 group-hover:opacity-100 text-fg-4 hover:text-red-500 transition-all" aria-label="Remove">
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
                <p className="mt-1.5 text-sm leading-relaxed">{inp.rawContent}</p>
                {inp.structured && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {Object.entries(inp.structured).map(([k, v]) => (
                      <span key={k} className="rounded-md bg-card border border-line-c px-1.5 py-0.5 text-[10.5px] font-mono text-fg-3">
                        {k}: {Array.isArray(v) ? v.join(", ") : String(v)}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Generate */}
      <div className="p-5 border-t border-line-c bg-bg-2/50">
        <AnimatePresence mode="wait">
          {busy ? (
            <motion.div key="busy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="size-4 text-accent animate-pulse" /> Drafting…
              </div>
              <ul className="space-y-1">
                {log.map((l, i) => (
                  <motion.li key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: i === log.length - 1 ? 1 : 0.5, x: 0 }} className="text-xs text-fg-2 font-mono">
                    › {l}
                  </motion.li>
                ))}
                {!log.length && busyMsg && <li className="text-xs text-fg-2 font-mono">› {busyMsg}</li>}
              </ul>
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Button size="lg" className="w-full" onClick={generate} disabled={state.inputs.length === 0}>
                <Sparkles className="size-4" /> {hasDraft ? "Redraft from the brief" : "Generate draft"} <ArrowRight className="size-4 ml-auto" />
              </Button>
              <p className="mt-2.5 text-[11.5px] text-fg-3 leading-relaxed">
                {hasDraft ? "This replaces the current itinerary. Votes and comments will be cleared." : state.inputs.length === 0 ? "Add at least one input to draft." : readiness < 0.6 ? "You can draft now, but the more people weigh in, the better it fits." : "Enough to work with. Draft whenever."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Stat({ label, value, accent, cap }: { label: string; value: string; accent?: boolean; cap?: boolean }) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div className={cn("mt-0.5 font-display text-lg leading-tight truncate", accent && "text-accent", cap && "capitalize")}>{value}</div>
    </div>
  );
}

function ReadinessRing({ value }: { value: number }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-11" title={`${Math.round(value * 100)}% ready`}>
      <svg viewBox="0 0 40 40" className="size-11 -rotate-90">
        <circle cx="20" cy="20" r={r} stroke="var(--line)" strokeWidth="3" fill="none" />
        <motion.circle cx="20" cy="20" r={r} stroke="var(--accent)" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray={c} animate={{ strokeDashoffset: c * (1 - value) }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[10px] font-semibold tabular">{Math.round(value * 100)}%</span>
    </div>
  );
}

export function CloseX({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="grid place-items-center size-8 rounded-full hover:bg-bg-2 text-fg-3" aria-label="Close">
      <X className="size-4" />
    </button>
  );
}
