"use client";

import { motion } from "framer-motion";
import { ThumbsDown, ThumbsUp, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { CountUp } from "@/components/count-up";
import { cn } from "@/components/ui";
import { mergePrefs } from "@/lib/ai";
import { CATEGORY_LABEL, budgetTotals } from "@/lib/budget";
import type { TripState } from "@/lib/types";
import { eur } from "@/lib/format";

const CAT_COLORS: Record<string, string> = {
  flights: "var(--color-sky)",
  lodging: "var(--accent)",
  food: "var(--color-gold)",
  activities: "var(--color-sage)",
  transit: "var(--fg-4)",
  buffer: "var(--line)",
};

export function BudgetPanel({ state, compact }: { state: TripState; compact?: boolean }) {
  const { perPerson, group } = budgetTotals(state.budget);
  const merged = useMemo(() => mergePrefs(state.inputs), [state.inputs]);
  const target = merged.budgetSet ? merged.budgetPerPerson : null;
  const delta = target ? perPerson - target : 0;
  const max = Math.max(...state.budget.map((b) => b.perPersonAmount), 1);

  const voteSummary = useMemo(() => {
    const scored = state.items.map((i) => {
      const ups = Object.values(i.votes).filter((v) => v === "up").length;
      const downs = Object.values(i.votes).filter((v) => v === "down").length;
      return { i, ups, downs, net: ups - downs };
    });
    const loved = scored.filter((s) => s.ups > 0).sort((a, b) => b.net - a.net).slice(0, 3);
    const contested = scored.filter((s) => s.downs > 0).sort((a, b) => b.downs - a.downs).slice(0, 3);
    return { loved, contested };
  }, [state.items]);

  return (
    <div className={cn("card overflow-hidden", compact && "border-0 shadow-none")}>
      <div className="px-5 pt-5 pb-4">
        <div className="eyebrow">Per person, all-in</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span data-testid="per-person" className="font-display-tight text-[3rem] leading-none tabular">
            <CountUp value={perPerson} format={(n) => eur(n)} />
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-3">
          <span>
            <span className="text-fg font-medium tabular">{eur(group)}</span> for {state.members.length}
          </span>
          {target && (
            <span className={cn("inline-flex items-center gap-1 font-medium", delta > 0 ? "text-red-500" : "text-sage")}>
              {delta > 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
              {delta > 0 ? `${eur(delta)} over` : `${eur(-delta)} under`} the {eur(target)} target
            </span>
          )}
        </div>
      </div>

      {/* Stacked bar */}
      <div className="px-5">
        <div className="flex h-2.5 rounded-full overflow-hidden bg-bg-3">
          {state.budget.map((b) => (
            <motion.span key={b.category} layout animate={{ width: `${(b.perPersonAmount / Math.max(perPerson, 1)) * 100}%` }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} style={{ background: CAT_COLORS[b.category] }} />
          ))}
        </div>
      </div>

      <ul className="px-5 py-4 space-y-2.5">
        {state.budget.map((b) => (
          <li key={b.category} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 text-sm">
            <span className="size-2.5 rounded-full" style={{ background: CAT_COLORS[b.category] }} />
            <div className="min-w-0">
              <div className="flex justify-between">
                <span className="text-fg-2">{CATEGORY_LABEL[b.category]}</span>
              </div>
              <div className="mt-1 h-1 rounded-full bg-bg-3 overflow-hidden">
                <motion.div animate={{ width: `${(b.perPersonAmount / max) * 100}%` }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="h-full rounded-full" style={{ background: CAT_COLORS[b.category] }} />
              </div>
            </div>
            <span className="tabular font-medium w-16 text-right">
              <CountUp value={b.perPersonAmount} format={(n) => eur(n)} />
            </span>
          </li>
        ))}
      </ul>

      {(voteSummary.loved.length > 0 || voteSummary.contested.length > 0) && (
        <div className="border-t border-line-c px-5 py-4 space-y-3">
          {voteSummary.loved.length > 0 && (
            <div>
              <div className="eyebrow flex items-center gap-1.5">
                <ThumbsUp className="size-3 text-sage" /> Group favourites
              </div>
              <ul className="mt-1.5 space-y-1">
                {voteSummary.loved.map(({ i, ups }) => (
                  <li key={i.id} className="text-sm flex justify-between gap-3">
                    <span className="truncate text-fg-2">{i.title}</span>
                    <span className="text-sage font-medium tabular">+{ups}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {voteSummary.contested.length > 0 && (
            <div>
              <div className="eyebrow flex items-center gap-1.5">
                <ThumbsDown className="size-3 text-plum" /> Contested
              </div>
              <ul className="mt-1.5 space-y-1">
                {voteSummary.contested.map(({ i, downs }) => (
                  <li key={i.id} className="text-sm flex justify-between gap-3">
                    <span className="truncate text-fg-2">{i.title}</span>
                    <span className="text-plum font-medium tabular">−{downs}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
