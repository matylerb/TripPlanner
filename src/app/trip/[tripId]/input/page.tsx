"use client";

import { motion } from "framer-motion";
import { ClipboardList, MessageSquare } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { BriefPanel } from "@/components/trip/brief-panel";
import { ChatPanel } from "@/components/trip/chat-panel";
import { Questionnaire } from "@/components/trip/questionnaire";
import { cn } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function InputPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const state = useStore((s) => s.trips[tripId]);
  const [tab, setTab] = useState<"chat" | "form">("chat");
  const [showBrief, setShowBrief] = useState(false);
  if (!state) return null;

  return (
    <div className="px-4 sm:px-8 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div>
          <span className="eyebrow">Step 1</span>
          <h2 className="mt-1 font-display text-[clamp(1.9rem,3.5vw,2.75rem)] leading-[1]">What does everyone want?</h2>
          <p className="mt-2 text-sm text-fg-3 max-w-xl">Chat or fill in the form. Both feed the same brief on the right. When it feels complete, anyone can generate the draft.</p>
        </div>
        <button onClick={() => setShowBrief((s) => !s)} className="xl:hidden chip">
          {showBrief ? "Hide brief" : `Show brief (${state.inputs.length})`}
        </button>
      </div>

      <div className="grid xl:grid-cols-[1fr_400px] gap-5 items-start">
        <div className="card overflow-hidden">
          <div className="flex items-center gap-1 p-1.5 border-b border-line-c bg-bg-2/60">
            {(
              [
                ["chat", "Group chat", MessageSquare],
                ["form", "Questionnaire", ClipboardList],
              ] as const
            ).map(([k, label, Icon]) => (
              <button key={k} onClick={() => setTab(k)} className={cn("relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors", tab === k ? "text-fg" : "text-fg-3 hover:text-fg")}>
                {tab === k && <motion.span layoutId="inputTab" className="absolute inset-0 rounded-xl bg-card shadow-soft border border-line-c" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
                <Icon className="relative size-4" />
                <span className="relative">{label}</span>
              </button>
            ))}
            <span className="ml-auto pr-3 text-[11px] text-fg-4 font-mono hidden sm:inline">Both write to the same brief</span>
          </div>
          <div className="min-h-[560px]">{tab === "chat" ? <ChatPanel state={state} /> : <Questionnaire state={state} onDone={() => setTab("chat")} />}</div>
        </div>

        <div className={cn("card overflow-hidden xl:sticky xl:top-[4.5rem] xl:h-[calc(100vh-6rem)] h-[70vh]", !showBrief && "hidden xl:flex", showBrief && "flex")}>
          <BriefPanel state={state} />
        </div>
      </div>
    </div>
  );
}
