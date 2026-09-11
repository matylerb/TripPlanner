"use client";

import { create } from "zustand";
import { nanoid } from "nanoid";
import type { SocialMessage, SocialState, SocialThread } from "../types";
import { pickReply, seedSocial } from "./mock-data";
import { loadSocial, saveSocial, startSocialSync, broadcastSocial } from "./sync";

export interface SocialStoreState extends SocialState {
  hydrated: boolean;
  typing: Record<string, string | undefined>; // threadId -> friendId currently "typing"

  hydrate(): void;
  sendMessage(threadId: string, text: string): void;
  startDm(friendId: string): string;
  createGroupThread(name: string, emoji: string, memberIds: string[], tripId?: string): string;
  linkTripToThread(threadId: string, tripId: string): void;
  threadForTrip(tripId: string): SocialThread | undefined;
}

export const useSocialStore = create<SocialStoreState>()((set, get) => {
  const persist = (patch: Partial<SocialState>) => {
    const next: SocialState = {
      friends: patch.friends ?? get().friends,
      threads: patch.threads ?? get().threads,
      messages: patch.messages ?? get().messages,
    };
    set(next);
    saveSocial(next);
    broadcastSocial(next);
  };

  const queueReply = (thread: SocialThread) => {
    const pool = thread.memberIds;
    const replier = pool[Math.floor(Math.random() * pool.length)];
    if (!replier) return;
    set({ typing: { ...get().typing, [thread.id]: replier } });
    const delay = 900 + Math.random() * 1400;
    setTimeout(() => {
      const cur = get();
      set({ typing: { ...cur.typing, [thread.id]: undefined } });
      const reply: SocialMessage = {
        id: nanoid(8),
        threadId: thread.id,
        senderId: replier,
        text: pickReply(!!thread.tripId),
        createdAt: new Date().toISOString(),
      };
      persist({ messages: [...get().messages, reply] });
    }, delay);
  };

  return {
    friends: [],
    threads: [],
    messages: [],
    hydrated: false,
    typing: {},

    hydrate() {
      if (get().hydrated) return;
      const existing = loadSocial();
      const state = existing ?? seedSocial();
      if (!existing) saveSocial(state);
      set({ ...state, hydrated: true });
      startSocialSync((incoming) => set(incoming));
    },

    sendMessage(threadId, text) {
      const t = text.trim();
      if (!t) return;
      const msg: SocialMessage = { id: nanoid(8), threadId, senderId: "me", text: t, createdAt: new Date().toISOString() };
      persist({ messages: [...get().messages, msg] });
      const thread = get().threads.find((x) => x.id === threadId);
      if (thread) queueReply(thread);
    },

    startDm(friendId) {
      const existing = get().threads.find((t) => t.kind === "dm" && t.memberIds.length === 1 && t.memberIds[0] === friendId);
      if (existing) return existing.id;
      const thread: SocialThread = { id: nanoid(8), kind: "dm", memberIds: [friendId], createdAt: new Date().toISOString() };
      persist({ threads: [...get().threads, thread] });
      return thread.id;
    },

    createGroupThread(name, emoji, memberIds, tripId) {
      const thread: SocialThread = { id: nanoid(8), kind: "group", name, emoji, memberIds, createdAt: new Date().toISOString(), tripId };
      persist({ threads: [...get().threads, thread] });
      return thread.id;
    },

    linkTripToThread(threadId, tripId) {
      const threads = get().threads.map((t) => (t.id === threadId ? { ...t, tripId } : t));
      persist({ threads });
    },

    threadForTrip(tripId) {
      return get().threads.find((t) => t.tripId === tripId);
    },
  };
});

export function friendById(friends: SocialState["friends"], id: string) {
  return friends.find((f) => f.id === id);
}
