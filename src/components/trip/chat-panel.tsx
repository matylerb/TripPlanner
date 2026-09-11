"use client";

import { AnimatePresence, motion } from "framer-motion";
import { SendHorizontal, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar, cn } from "@/components/ui";
import { ai } from "@/lib/ai";
import { useStore } from "@/lib/store";
import type { TripState } from "@/lib/types";
import { timeAgo } from "@/lib/format";

const PROMPTS = [
  "Somewhere warm in March, ~$1,200 each, I hate early flights",
  "Tokyo for a week from SF, food + art, budget around $2,500",
  "Surprise me. Beach, chill pace, 5 nights, cheap-ish",
  "Mexico City from Austin in November, tacos and museums, $900 max",
];

export function ChatPanel({ state }: { state: TripState }) {
  const me = useStore((s) => s.me)!;
  const addChatMessage = useStore((s) => s.addChatMessage);
  const addInput = useStore((s) => s.addInput);
  const [text, setText] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const tripId = state.trip.id;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [state.messages.length, thinking]);

  const send = async (raw?: string) => {
    const t = (raw ?? text).trim();
    if (!t || thinking) return;
    setText("");
    addChatMessage(tripId, { memberId: me.id, kind: "user", text: t });
    setThinking(true);
    try {
      const { prefs, reply } = await ai.parsePreferences(t, me.name);
      const hasSignal = Object.keys(prefs).length > 0;
      addInput(tripId, "chat", t, hasSignal ? prefs : null);
      addChatMessage(tripId, { memberId: "ai", kind: "ai", text: reply });
    } finally {
      setThinking(false);
    }
  };

  const members = state.members;
  const showPrompts = state.messages.filter((m) => m.kind === "user").length === 0;

  return (
    <div className="flex flex-col h-full min-h-[560px]">
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4">
        <AnimatePresence initial={false}>
          {state.messages.map((m) => {
            if (m.kind === "system") {
              return (
                <motion.div key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-[11px] font-mono uppercase tracking-wider text-fg-4 py-1">
                  {m.text}
                </motion.div>
              );
            }
            const mine = m.memberId === me.id;
            const author = members.find((x) => x.id === m.memberId);
            const isAi = m.kind === "ai";
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className={cn("flex gap-3 max-w-[85%]", mine ? "ml-auto flex-row-reverse" : "")}
              >
                {isAi ? (
                  <span className="grid place-items-center size-8 rounded-full bg-fg text-bg shrink-0">
                    <Sparkles className="size-4" />
                  </span>
                ) : (
                  <Avatar name={author?.displayName ?? "?"} color={author?.color ?? "#999"} size={32} />
                )}
                <div className={cn("min-w-0", mine && "text-right")}>
                  <div className={cn("text-[11px] text-fg-4 mb-1", mine && "text-right")}>
                    {isAi ? "Planner" : author?.displayName ?? "Someone"} · {timeAgo(m.createdAt)}
                  </div>
                  <div
                    className={cn(
                      "inline-block text-left rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed",
                      isAi ? "bg-bg-2 border border-line-c text-fg" : mine ? "bg-fg text-bg rounded-tr-md" : "bg-card border border-line-c rounded-tl-md",
                    )}
                    style={!isAi && !mine ? { borderColor: author?.color, borderLeftWidth: 3 } : undefined}
                  >
                    {m.text}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {thinking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 items-center">
            <span className="grid place-items-center size-8 rounded-full bg-fg text-bg">
              <Sparkles className="size-4" />
            </span>
            <span className="flex gap-1 rounded-2xl bg-bg-2 border border-line-c px-4 py-3">
              {[0, 1, 2].map((i) => (
                <motion.span key={i} className="size-1.5 rounded-full bg-fg-3" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.15 }} />
              ))}
            </span>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {showPrompts && (
        <div className="px-4 sm:px-6 pb-3 flex flex-wrap gap-2">
          {PROMPTS.map((p) => (
            <button key={p} onClick={() => send(p)} className="chip text-left">
              {p}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="border-t border-line-c p-3 sm:p-4 flex items-end gap-2"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder="Say what you want: where, when, budget, vibe…"
          className="field resize-none max-h-32 min-h-[46px] leading-relaxed"
        />
        <button type="submit" disabled={!text.trim() || thinking} aria-label="Send" className="grid place-items-center size-[46px] rounded-xl bg-accent text-white disabled:opacity-40 transition-all active:scale-95 shrink-0">
          <SendHorizontal className="size-5" />
        </button>
      </form>
    </div>
  );
}
