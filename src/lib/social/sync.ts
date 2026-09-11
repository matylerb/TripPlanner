"use client";

import type { SocialState } from "../types";

/** Local persistence + cross-tab live updates for friends/chats, mirroring lib/store/sync.ts. */

const SOCIAL_KEY = "tripsync:social:v1";
const CHANNEL = "tripsync:social:v1";

type Msg = { type: "social"; state: SocialState };

let channel: BroadcastChannel | null = null;

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export function loadSocial(): SocialState | null {
  if (typeof window === "undefined") return null;
  return safe(() => JSON.parse(localStorage.getItem(SOCIAL_KEY) ?? "null") as SocialState | null, null);
}

export function saveSocial(state: SocialState) {
  if (typeof window === "undefined") return;
  safe(() => localStorage.setItem(SOCIAL_KEY, JSON.stringify(state)), undefined);
}

export function startSocialSync(onUpdate: (state: SocialState) => void) {
  if (typeof window === "undefined" || channel) return;
  if ("BroadcastChannel" in window) {
    channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = (ev: MessageEvent<Msg>) => {
      if (ev.data.type === "social") onUpdate(ev.data.state);
    };
  }
  window.addEventListener("storage", (e) => {
    if (e.key === SOCIAL_KEY) {
      const s = loadSocial();
      if (s) onUpdate(s);
    }
  });
}

export function broadcastSocial(state: SocialState) {
  channel?.postMessage({ type: "social", state } satisfies Msg);
}
