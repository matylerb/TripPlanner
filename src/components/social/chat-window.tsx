"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, MapPin, MessageCircle, Send, Sparkles, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, Button, cn } from "@/components/ui";
import { friendById, useSocialStore } from "@/lib/social/store";
import { useStore } from "@/lib/store";
import type { SocialThread } from "@/lib/types";
import { timeAgo } from "@/lib/format";

export function ChatWindow({ thread }: { thread: SocialThread }) {
  const me = useStore((s) => s.me);
  const friends = useSocialStore((s) => s.friends);
  const allMessages = useSocialStore((s) => s.messages);
  const messages = useMemo(() => allMessages.filter((m) => m.threadId === thread.id), [allMessages, thread.id]);
  const sendMessage = useSocialStore((s) => s.sendMessage);
  const typingFriendId = useSocialStore((s) => s.typing[thread.id]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, typingFriendId]);

  const isGroup = thread.kind === "group";
  const dm = !isGroup ? friendById(friends, thread.memberIds[0]) : undefined;
  const members = thread.memberIds.map((id) => friendById(friends, id)).filter(Boolean) as NonNullable<ReturnType<typeof friendById>>[];
  const typingFriend = typingFriendId ? friendById(friends, typingFriendId) : undefined;

  const send = () => {
    const t = text.trim();
    if (!t) return;
    setText("");
    sendMessage(thread.id, t);
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-3 px-5 h-16 border-b border-line-c shrink-0">
        {isGroup ? (
          <span className="grid place-items-center size-10 rounded-full bg-accent-soft text-lg shrink-0">{thread.emoji ?? "🧳"}</span>
        ) : (
          <Avatar name={dm?.name ?? "?"} color={dm?.color ?? "#999"} size={40} />
        )}
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm">{isGroup ? thread.name : dm?.name}</div>
          <div className="text-xs text-fg-3 truncate">
            {isGroup ? `${members.length} friends · ${members.map((m) => m.name.split(" ")[0]).join(", ")}` : dm?.online ? "Active now" : `Active ${timeAgo(dm?.lastActiveAt ?? new Date().toISOString())}`}
          </div>
        </div>
        {isGroup && <TripCta thread={thread} members={members} />}
      </header>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4">
        {messages.length === 0 && (
          <div className="h-full grid place-items-center text-center px-6">
            <div>
              <MessageCircle className="size-8 text-fg-4 mx-auto" />
              <p className="mt-3 text-sm text-fg-3">Say hi to {isGroup ? "the group" : dm?.name} to get things started.</p>
            </div>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m) => {
            const mine = m.senderId === "me";
            const sender = mine ? undefined : friendById(friends, m.senderId);
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className={cn("flex gap-3 max-w-[85%]", mine ? "ml-auto flex-row-reverse" : "")}
              >
                <Avatar name={mine ? me?.name ?? "You" : sender?.name ?? "?"} color={mine ? me?.color ?? "#14120f" : sender?.color ?? "#999"} size={32} />
                <div className={cn("min-w-0", mine && "text-right")}>
                  <div className={cn("text-[11px] text-fg-4 mb-1", mine && "text-right")}>
                    {mine ? "You" : sender?.name ?? "Someone"} · {timeAgo(m.createdAt)}
                  </div>
                  <div className={cn("inline-block text-left rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed", mine ? "bg-fg text-bg rounded-tr-md" : "bg-card border border-line-c rounded-tl-md")} style={!mine ? { borderColor: sender?.color, borderLeftWidth: 3 } : undefined}>
                    {m.text}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {typingFriend && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 items-center">
            <Avatar name={typingFriend.name} color={typingFriend.color} size={32} />
            <span className="flex gap-1 rounded-2xl bg-bg-2 border border-line-c px-4 py-3">
              {[0, 1, 2].map((i) => (
                <motion.span key={i} className="size-1.5 rounded-full bg-fg-3" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.15 }} />
              ))}
            </span>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="border-t border-line-c p-3 sm:p-4 flex items-end gap-2 shrink-0"
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
          placeholder={`Message ${isGroup ? thread.name : dm?.name ?? "…"}`}
          className="field resize-none max-h-32 min-h-[46px] leading-relaxed"
        />
        <button type="submit" disabled={!text.trim()} aria-label="Send" className="grid place-items-center size-[46px] rounded-xl bg-accent text-white disabled:opacity-40 transition-all active:scale-95 shrink-0">
          <Send className="size-5" />
        </button>
      </form>
    </div>
  );
}

function TripCta({ thread, members }: { thread: SocialThread; members: { id: string }[] }) {
  const router = useRouter();
  const me = useStore((s) => s.me);
  const createTrip = useStore((s) => s.createTrip);
  const setTripFriends = useStore((s) => s.setTripFriends);
  const linkTripToThread = useSocialStore((s) => s.linkTripToThread);
  const [asking, setAsking] = useState(false);
  const [name, setName] = useState("");

  if (thread.tripId) {
    return (
      <Button size="sm" variant="secondary" onClick={() => router.push(`/trip/${thread.tripId}/plan`)}>
        <MapPin className="size-3.5" /> View trip
      </Button>
    );
  }

  const start = (organizer: string) => {
    const id = createTrip(thread.name ?? "Trip with friends", organizer);
    setTripFriends(id, members.map((m) => m.id));
    linkTripToThread(thread.id, id);
    router.push(`/trip/${id}/input`);
  };

  if (asking) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) start(name.trim());
        }}
        className="flex items-center gap-1.5"
      >
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="field !py-1.5 !px-3 text-sm w-32" />
        <button type="submit" disabled={!name.trim()} className="grid place-items-center size-8 rounded-lg bg-fg text-bg disabled:opacity-40 shrink-0">
          <ArrowRight className="size-3.5" />
        </button>
      </form>
    );
  }

  return (
    <Button size="sm" onClick={() => (me ? start(me.name) : setAsking(true))}>
      <Sparkles className="size-3.5" /> Plan this trip
    </Button>
  );
}

export function EmptyChatState({ onNewGroup }: { onNewGroup: () => void }) {
  return (
    <div className="h-full grid place-items-center px-8">
      <div className="text-center max-w-sm">
        <span className="grid place-items-center size-16 rounded-3xl bg-accent-soft text-accent mx-auto">
          <Users className="size-7" />
        </span>
        <h2 className="mt-5 font-display text-2xl">Plan the next trip with friends</h2>
        <p className="mt-2 text-sm text-fg-3 leading-relaxed">Pick a conversation on the left, or start a new group chat to get the whole crew talking.</p>
        <Button className="mt-6" onClick={onNewGroup}>
          <Users className="size-4" /> New group chat
        </Button>
      </div>
    </div>
  );
}
