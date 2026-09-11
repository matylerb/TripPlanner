"use client";

import type { Identity, Presence, TripState } from "../types";

/**
 * Local persistence + cross-tab realtime.
 *
 * - Trips live in localStorage (shared by every tab in this browser).
 * - Identity lives in sessionStorage, so every tab is its own "person" — open the
 *   invite link in a second tab and you are a second member of the group.
 * - BroadcastChannel carries live edits and presence heartbeats between tabs.
 *
 * Replace this module with a Supabase Realtime adapter to go cross-device.
 */

// Keys keep the pre-rename "tripsync" prefix on purpose: changing them would orphan
// every trip already saved in a returning user's browser under the old key.
const TRIPS_KEY = "tripsync:trips:v1";
const ME_KEY = "tripsync:me:v1";
const CHANNEL = "tripsync:v1";

type Msg =
  | { type: "trip"; state: TripState }
  | { type: "presence"; tripId: string; presence: Presence };

let channel: BroadcastChannel | null = null;

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export function loadTrips(): Record<string, TripState> {
  if (typeof window === "undefined") return {};
  return safe(() => JSON.parse(localStorage.getItem(TRIPS_KEY) ?? "{}") as Record<string, TripState>, {});
}

export function saveTrips(trips: Record<string, TripState>) {
  if (typeof window === "undefined") return;
  safe(() => localStorage.setItem(TRIPS_KEY, JSON.stringify(trips)), undefined);
}

export function loadMe(): Identity | null {
  if (typeof window === "undefined") return null;
  return safe(() => JSON.parse(sessionStorage.getItem(ME_KEY) ?? "null") as Identity | null, null);
}

export function saveMe(me: Identity) {
  if (typeof window === "undefined") return;
  safe(() => sessionStorage.setItem(ME_KEY, JSON.stringify(me)), undefined);
}

export function startSync(handlers: {
  onTrip: (t: TripState) => void;
  onPresence: (tripId: string, p: Presence) => void;
  onStorage: () => void;
}) {
  if (typeof window === "undefined" || channel) return;
  if ("BroadcastChannel" in window) {
    channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = (ev: MessageEvent<Msg>) => {
      const msg = ev.data;
      if (msg.type === "trip") handlers.onTrip(msg.state);
      else if (msg.type === "presence") handlers.onPresence(msg.tripId, msg.presence);
    };
  }
  window.addEventListener("storage", (e) => {
    if (e.key === TRIPS_KEY) handlers.onStorage();
  });
}

export function broadcastTrip(state: TripState) {
  channel?.postMessage({ type: "trip", state } satisfies Msg);
}

export function broadcastPresence(tripId: string, presence: Presence) {
  channel?.postMessage({ type: "presence", tripId, presence } satisfies Msg);
}
