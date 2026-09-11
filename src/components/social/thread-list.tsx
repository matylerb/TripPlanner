"use client";

import { motion } from "framer-motion";
import { MessageCircle, Plus, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar, cn } from "@/components/ui";
import { friendById, useSocialStore } from "@/lib/social/store";
import type { Friend, SocialThread } from "@/lib/types";
import { timeAgo } from "@/lib/format";

export function ThreadList({
  selectedId,
  onSelect,
  onNewGroup,
  tab,
  onTabChange,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewGroup: () => void;
  tab: "chats" | "friends";
  onTabChange: (tab: "chats" | "friends") => void;
}) {
  const friends = useSocialStore((s) => s.friends);
  const threads = useSocialStore((s) => s.threads);
  const messages = useSocialStore((s) => s.messages);
  const startDm = useSocialStore((s) => s.startDm);
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    return threads
      .map((t) => {
        const ms = messages.filter((m) => m.threadId === t.id);
        const last = ms[ms.length - 1];
        return { thread: t, last, at: last?.createdAt ?? t.createdAt };
      })
      .filter((r) => threadLabel(r.thread, friends).toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => b.at.localeCompare(a.at));
  }, [threads, messages, friends, q]);

  const filteredFriends = useMemo(() => friends.filter((f) => f.name.toLowerCase().includes(q.toLowerCase())), [friends, q]);

  const select = (id: string) => {
    onTabChange("chats");
    onSelect(id);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 border-b border-line-c space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl leading-none">Friends</h1>
          <button onClick={onNewGroup} title="New group chat" className="grid place-items-center size-9 rounded-full bg-fg text-bg hover:opacity-90 transition-opacity">
            <Plus className="size-4" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-fg-4" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="field !py-2 !pl-9 text-sm" />
        </div>
        <div className="flex gap-1.5">
          <button data-on={tab === "chats"} onClick={() => onTabChange("chats")} className="chip flex-1 justify-center">
            <MessageCircle className="size-3.5" /> Chats
          </button>
          <button data-on={tab === "friends"} onClick={() => onTabChange("friends")} className="chip flex-1 justify-center">
            <Users className="size-3.5" /> Friends
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "chats" &&
          rows.map(({ thread, last }) => (
            <ThreadRow key={thread.id} thread={thread} friends={friends} last={last?.text} lastAt={last?.createdAt} active={thread.id === selectedId} onClick={() => select(thread.id)} />
          ))}
        {tab === "chats" && rows.length === 0 && <p className="px-4 py-10 text-center text-sm text-fg-3">No conversations match &ldquo;{q}&rdquo;.</p>}

        {tab === "friends" &&
          filteredFriends.map((f) => (
            <FriendRow
              key={f.id}
              friend={f}
              onClick={() => select(startDm(f.id))}
            />
          ))}
      </div>
    </div>
  );
}

function threadLabel(thread: SocialThread, friends: Friend[]) {
  if (thread.kind === "group") return thread.name ?? "Group";
  return friendById(friends, thread.memberIds[0])?.name ?? "Friend";
}

function ThreadRow({ thread, friends, last, lastAt, active, onClick }: { thread: SocialThread; friends: Friend[]; last?: string; lastAt?: string; active: boolean; onClick: () => void }) {
  const isGroup = thread.kind === "group";
  const dm = !isGroup ? friendById(friends, thread.memberIds[0]) : undefined;
  const members = isGroup ? thread.memberIds.map((id) => friendById(friends, id)).filter(Boolean).slice(0, 3) as Friend[] : [];

  return (
    <button onClick={onClick} className={cn("w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-line-c/60", active ? "bg-card" : "hover:bg-bg-2/70")}>
      {isGroup ? (
        <span className="relative grid place-items-center size-11 shrink-0 rounded-full bg-accent-soft text-lg">{thread.emoji ?? "🧳"}</span>
      ) : (
        <Avatar name={dm?.name ?? "?"} color={dm?.color ?? "#999"} size={44} />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm truncate">{isGroup ? thread.name : dm?.name}</span>
          {lastAt && <span className="text-[11px] text-fg-4 shrink-0">{timeAgo(lastAt)}</span>}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className="text-xs text-fg-3 truncate">{last ?? (isGroup ? `${members.length} friends` : "Say hi 👋")}</span>
          {thread.tripId && <span className="size-1.5 rounded-full bg-sage shrink-0" title="Trip linked" />}
        </div>
      </div>
    </button>
  );
}

function FriendRow({ friend, onClick }: { friend: Friend; onClick: () => void }) {
  return (
    <motion.button whileTap={{ scale: 0.99 }} onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-bg-2/70 transition-colors border-b border-line-c/60">
      <span className="relative shrink-0">
        <Avatar name={friend.name} color={friend.color} size={44} />
        <span className={cn("absolute -right-0.5 -bottom-0.5 size-3 rounded-full ring-2 ring-[var(--bg)]", friend.online ? "bg-sage" : "bg-fg-4/50")} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-medium text-sm">{friend.name}</div>
        <div className="text-xs text-fg-3 truncate">{friend.online ? "Active now" : `Active ${timeAgo(friend.lastActiveAt)}`} · {friend.location}</div>
      </div>
    </motion.button>
  );
}
