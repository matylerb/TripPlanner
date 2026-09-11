"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, MessageCircle, Plus, Sparkles, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Avatar, Button, cn } from "@/components/ui";
import { friendById, useSocialStore } from "@/lib/social/store";
import { useStore } from "@/lib/store";
import type { TripState } from "@/lib/types";

export function FriendsGoing({ state, readOnly }: { state: TripState; readOnly?: boolean }) {
  const friends = useSocialStore((s) => s.friends);
  const threads = useSocialStore((s) => s.threads);
  const createGroupThread = useSocialStore((s) => s.createGroupThread);
  const toggleTripFriend = useStore((s) => s.toggleTripFriend);
  const router = useRouter();
  const [picking, setPicking] = useState(false);

  const friendIds = state.trip.friendIds ?? [];
  const going = friendIds.map((id) => friendById(friends, id)).filter(Boolean) as NonNullable<ReturnType<typeof friendById>>[];
  const linkedThread = useMemo(() => threads.find((t) => t.tripId === state.trip.id), [threads, state.trip.id]);

  const openGroupChat = () => {
    if (linkedThread) {
      router.push(`/friends?thread=${linkedThread.id}`);
      return;
    }
    const id = createGroupThread(state.trip.name, "🧳", friendIds, state.trip.id);
    router.push(`/friends?thread=${id}`);
  };

  return (
    <div className="card overflow-hidden">
      <div className="px-5 pt-5 pb-4 flex items-center justify-between">
        <div>
          <div className="eyebrow">Friends coming along</div>
          <p className="mt-1 text-sm text-fg-3">{going.length ? `${going.length} joining from your list` : "Pull in a few friends"}</p>
        </div>
        {!readOnly && (
          <button onClick={() => setPicking((p) => !p)} className={cn("grid place-items-center size-9 rounded-full border transition-colors", picking ? "bg-fg text-bg border-fg" : "border-line-c text-fg-2 hover:text-fg hover:border-fg-4")} aria-label="Add friends">
            {picking ? <Check className="size-4" /> : <UserPlus className="size-4" />}
          </button>
        )}
      </div>

      {going.length > 0 && !picking && (
        <div className="px-5 pb-4 flex flex-wrap gap-2">
          {going.map((f) => (
            <span key={f.id} className="inline-flex items-center gap-2 rounded-full bg-bg-2 border border-line-c pl-1.5 pr-3 py-1">
              <Avatar name={f.name} color={f.color} size={24} />
              <span className="text-xs font-medium">{f.name.split(" ")[0]}</span>
            </span>
          ))}
        </div>
      )}

      <AnimatePresence initial={false}>
        {picking && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-5 pb-4 space-y-1 max-h-64 overflow-y-auto">
              {friends.map((f) => {
                const on = friendIds.includes(f.id);
                return (
                  <button
                    key={f.id}
                    onClick={() => toggleTripFriend(state.trip.id, f.id)}
                    className={cn("w-full flex items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors", on ? "bg-accent-soft" : "hover:bg-bg-2")}
                  >
                    <Avatar name={f.name} color={f.color} size={30} />
                    <span className="flex-1 min-w-0 text-sm font-medium truncate">{f.name}</span>
                    <span className={cn("grid place-items-center size-5 rounded-full border shrink-0", on ? "bg-accent border-accent text-white" : "border-line-c")}>{on ? <Check className="size-3" /> : <Plus className="size-3 opacity-0" />}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {going.length === 0 && !picking && (
        <div className="px-5 pb-5">
          <p className="text-sm text-fg-3">No friends added yet — tap the + to pull people in from your list.</p>
        </div>
      )}

      {going.length > 0 && (
        <div className="px-5 pb-5">
          <Button size="sm" variant="secondary" className="w-full" onClick={openGroupChat}>
            {linkedThread ? <MessageCircle className="size-3.5" /> : <Sparkles className="size-3.5" />}
            {linkedThread ? "Open group chat" : "Start a group chat"}
          </Button>
        </div>
      )}
    </div>
  );
}
