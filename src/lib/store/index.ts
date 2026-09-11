"use client";

import { create } from "zustand";
import { nanoid } from "nanoid";
import type {
  BookingOption,
  ChatMessage,
  Identity,
  ItemType,
  ItineraryItem,
  Member,
  PreferenceInput,
  Presence,
  StructuredPrefs,
  Trip,
  TripState,
} from "../types";
import { computeBudget } from "../budget";
import { MEMBER_COLORS } from "../format";
import type { DraftResult } from "../ai/provider";
import { loadMe, loadTrips, saveMe, saveTrips, startSync, broadcastTrip, broadcastPresence } from "./sync";

export interface StoreState {
  hydrated: boolean;
  me: Identity | null;
  trips: Record<string, TripState>;
  presence: Record<string, Record<string, Presence>>;
  aiBusy: Record<string, string | null>; // tripId -> progress message

  hydrate(): void;
  setMe(name: string, color?: string): Identity;
  createTrip(name: string, organizerName: string, color?: string, friendNames?: string[]): string;
  joinTrip(tripId: string, name: string, color?: string): boolean;
  isMember(tripId: string): boolean;

  addChatMessage(tripId: string, msg: Omit<ChatMessage, "id" | "tripId" | "createdAt">): ChatMessage;
  addInput(tripId: string, source: PreferenceInput["source"], raw: string, structured: StructuredPrefs | null): void;
  removeInput(tripId: string, inputId: string): void;

  applyDraft(tripId: string, draft: DraftResult): void;
  updateTripMeta(tripId: string, patch: Partial<Trip>): void;

  addItem(tripId: string, dayId: string, type: ItemType, title?: string, extra?: { details?: ItineraryItem["details"]; costEstimate?: number }): ItineraryItem;
  updateItem(tripId: string, itemId: string, patch: Partial<Pick<ItineraryItem, "title" | "costEstimate" | "type">> & { details?: ItineraryItem["details"] }): void;
  deleteItem(tripId: string, itemId: string): void;
  reorderItems(tripId: string, dayId: string, orderedIds: string[]): void;
  vote(tripId: string, itemId: string, v: "up" | "down"): void;
  addComment(tripId: string, itemId: string, text: string): void;
  updateDayLocation(tripId: string, dayId: string, location: string): void;
  toggleTripFriend(tripId: string, friendId: string): void;
  setTripFriends(tripId: string, friendIds: string[]): void;

  setCommitted(tripId: string, committed: boolean): void;
  lockTrip(tripId: string): void;
  setBookingSearch(tripId: string, state: Trip["bookingSearchState"]): void;
  setBookings(tripId: string, bookings: BookingOption[]): void;
  selectBooking(tripId: string, bookingId: string): void;
  markBooked(tripId: string): void;
  reopenPlanning(tripId: string): void;

  setAiBusy(tripId: string, msg: string | null): void;
  receiveTrip(state: TripState): void;
  receivePresence(tripId: string, p: Presence): void;
  prunePresence(): void;
  announce(tripId: string, view: string): void;
}

/** Defensive: guarantee every collection exists, whatever version wrote it. */
function normalize(s: TripState): TripState {
  return {
    ...s,
    members: s.members ?? [],
    inputs: s.inputs ?? [],
    messages: s.messages ?? [],
    days: s.days ?? [],
    items: (s.items ?? []).map((i) => ({ ...i, votes: i.votes ?? {}, comments: i.comments ?? [], details: i.details ?? {} })),
    budget: s.budget ?? [],
    bookings: s.bookings ?? [],
    version: s.version ?? 1,
  };
}

function clone<T>(x: T): T {
  return typeof structuredClone === "function" ? structuredClone(x) : JSON.parse(JSON.stringify(x));
}

export const useStore = create<StoreState>()((set, get) => {
  const mutate = (tripId: string, recipe: (s: TripState) => void) => {
    const cur = get().trips[tripId];
    if (!cur) return;
    const next = clone(cur);
    recipe(next);
    next.budget = computeBudget(next.items, next.members.length);
    next.version = cur.version + 1;
    const trips = { ...get().trips, [tripId]: next };
    set({ trips });
    saveTrips(trips);
    broadcastTrip(next);
  };

  const requireMe = (): Identity => {
    const me = get().me;
    if (!me) throw new Error("No identity");
    return me;
  };

  return {
    hydrated: false,
    me: null,
    trips: {},
    presence: {},
    aiBusy: {},

    hydrate() {
      if (get().hydrated) return;
      const trips = Object.fromEntries(Object.entries(loadTrips()).map(([k, v]) => [k, normalize(v)]));
      const me = loadMe();
      set({ trips, me, hydrated: true });
      startSync({
        onTrip: (t) => get().receiveTrip(t),
        onPresence: (tripId, p) => get().receivePresence(tripId, p),
        onStorage: () => {
          // Another tab wrote localStorage: merge with a version check so a
          // stale write can't roll back a newer local state.
          for (const t of Object.values(loadTrips())) get().receiveTrip(t);
        },
      });
      setInterval(() => get().prunePresence(), 4000);
    },

    setMe(name, color) {
      const prev = get().me;
      const me: Identity = {
        id: prev?.id ?? nanoid(10),
        name: name.trim(),
        color: color ?? prev?.color ?? MEMBER_COLORS[Math.floor(Math.random() * MEMBER_COLORS.length)],
      };
      set({ me });
      saveMe(me);
      return me;
    },

    createTrip(name, organizerName, color, friendNames) {
      const me = get().setMe(organizerName, color);
      const id = nanoid(8);
      const now = new Date().toISOString();
      const members: TripState["members"] = [
        { id: me.id, tripId: id, displayName: me.name, color: me.color, committed: false, isOrganizer: true, joinedAt: now },
      ];
      const taken = new Set(members.map((m) => m.color));
      const precommitMessages: TripState["messages"] = [];
      for (const friendName of friendNames ?? []) {
        if (members.length >= 8) break;
        const trimmed = friendName.trim();
        if (!trimmed || members.some((m) => m.displayName.toLowerCase() === trimmed.toLowerCase())) continue;
        const c = MEMBER_COLORS.find((x) => !taken.has(x)) ?? MEMBER_COLORS[members.length % MEMBER_COLORS.length];
        taken.add(c);
        members.push({ id: nanoid(10), tripId: id, displayName: trimmed, color: c, committed: true, isOrganizer: false, joinedAt: now });
        precommitMessages.push({ id: nanoid(8), tripId: id, memberId: "system", kind: "system", text: `${trimmed} is in ✓`, createdAt: now });
      }
      const state: TripState = {
        trip: { id, name: name.trim() || "Untitled trip", status: "gathering", createdBy: me.id, createdAt: now, bookingSearchState: "idle" },
        members,
        inputs: [],
        messages: [
          {
            id: nanoid(8),
            tripId: id,
            memberId: "ai",
            kind: "ai",
            text: `Welcome to ${name.trim() || "the trip"}. Tell me what you're hoping for — where, when, how much, what kind of days — and I'll turn everyone's answers into a first draft.`,
            createdAt: now,
          },
          ...precommitMessages,
        ],
        days: [],
        items: [],
        budget: computeBudget([], members.length),
        bookings: [],
        version: 1,
      };
      const trips = { ...get().trips, [id]: state };
      set({ trips });
      saveTrips(trips);
      broadcastTrip(state);
      return id;
    },

    joinTrip(tripId, name, color) {
      const cur = get().trips[tripId];
      if (!cur) return false;
      const me = get().setMe(name, color);
      if (cur.members.some((m) => m.id === me.id)) {
        mutate(tripId, (s) => {
          const m = s.members.find((x) => x.id === me.id)!;
          m.displayName = me.name;
          m.color = me.color;
        });
        return true;
      }
      if (cur.members.length >= 8) return false;
      mutate(tripId, (s) => {
        // avoid two members with the same colour when possible
        const taken = new Set(s.members.map((m) => m.color));
        const c = taken.has(me.color) ? MEMBER_COLORS.find((x) => !taken.has(x)) ?? me.color : me.color;
        s.members.push({ id: me.id, tripId, displayName: me.name, color: c, committed: false, isOrganizer: false, joinedAt: new Date().toISOString() });
        s.messages.push({ id: nanoid(8), tripId, memberId: "system", kind: "system", text: `${me.name} joined the trip`, createdAt: new Date().toISOString() });
      });
      return true;
    },

    isMember(tripId) {
      const me = get().me;
      const t = get().trips[tripId];
      return !!me && !!t && t.members.some((m) => m.id === me.id);
    },

    addChatMessage(tripId, msg) {
      const full: ChatMessage = { ...msg, id: nanoid(8), tripId, createdAt: new Date().toISOString() };
      mutate(tripId, (s) => {
        s.messages.push(full);
      });
      return full;
    },

    addInput(tripId, source, raw, structured) {
      const me = requireMe();
      mutate(tripId, (s) => {
        s.inputs.push({ id: nanoid(8), tripId, memberId: me.id, source, rawContent: raw, structured, createdAt: new Date().toISOString() });
      });
    },

    removeInput(tripId, inputId) {
      mutate(tripId, (s) => {
        s.inputs = s.inputs.filter((i) => i.id !== inputId);
      });
    },

    applyDraft(tripId, draft) {
      mutate(tripId, (s) => {
        s.trip.destination = draft.destination;
        s.trip.origin = draft.origin;
        s.trip.startDate = draft.startDate;
        s.trip.endDate = draft.endDate;
        s.trip.summary = draft.summary;
        s.trip.status = "reviewing";
        s.trip.draftedAt = new Date().toISOString();
        s.days = draft.days;
        s.items = draft.items;
        s.members.forEach((m) => (m.committed = false));
        s.bookings = [];
        s.messages.push({ id: nanoid(8), tripId, memberId: "ai", kind: "ai", text: `Draft ready: ${draft.destination.name}, ${draft.days.length} days. Head to the Plan tab to edit it together.`, createdAt: new Date().toISOString() });
      });
    },

    updateTripMeta(tripId, patch) {
      mutate(tripId, (s) => Object.assign(s.trip, patch));
    },

    addItem(tripId, dayId, type, title, extra) {
      const item: ItineraryItem = {
        id: nanoid(10),
        dayId,
        type,
        title: title ?? { flight: "New flight", lodging: "New stay", activity: "New activity", meal: "New meal", transit: "Getting around" }[type],
        details: extra?.details ?? {},
        costEstimate: extra?.costEstimate ?? 0,
        orderIndex: 0,
        votes: {},
        comments: [],
      };
      mutate(tripId, (s) => {
        const day = s.days.find((d) => d.id === dayId);
        item.details.lat = item.details.lat ?? day?.lat;
        item.details.lng = item.details.lng ?? day?.lng;
        item.orderIndex = s.items.filter((i) => i.dayId === dayId).length;
        s.items.push(item);
      });
      return item;
    },

    updateItem(tripId, itemId, patch) {
      mutate(tripId, (s) => {
        const it = s.items.find((i) => i.id === itemId);
        if (!it) return;
        if (patch.title !== undefined) it.title = patch.title;
        if (patch.costEstimate !== undefined) it.costEstimate = Math.max(0, Math.round(patch.costEstimate));
        if (patch.type !== undefined) it.type = patch.type;
        if (patch.details) it.details = { ...it.details, ...patch.details };
      });
    },

    deleteItem(tripId, itemId) {
      mutate(tripId, (s) => {
        s.items = s.items.filter((i) => i.id !== itemId);
        s.bookings = s.bookings.filter((b) => b.itineraryItemId !== itemId);
      });
    },

    reorderItems(tripId, dayId, orderedIds) {
      mutate(tripId, (s) => {
        orderedIds.forEach((id, idx) => {
          const it = s.items.find((i) => i.id === id && i.dayId === dayId);
          if (it) it.orderIndex = idx;
        });
      });
    },

    vote(tripId, itemId, v) {
      const me = requireMe();
      mutate(tripId, (s) => {
        const it = s.items.find((i) => i.id === itemId);
        if (!it) return;
        if (it.votes[me.id] === v) delete it.votes[me.id];
        else it.votes[me.id] = v;
      });
    },

    addComment(tripId, itemId, text) {
      const me = requireMe();
      mutate(tripId, (s) => {
        const it = s.items.find((i) => i.id === itemId);
        it?.comments.push({ id: nanoid(8), memberId: me.id, text: text.trim(), createdAt: new Date().toISOString() });
      });
    },

    updateDayLocation(tripId, dayId, location) {
      mutate(tripId, (s) => {
        const d = s.days.find((x) => x.id === dayId);
        if (d) d.location = location;
      });
    },

    toggleTripFriend(tripId, friendId) {
      mutate(tripId, (s) => {
        const cur = s.trip.friendIds ?? [];
        s.trip.friendIds = cur.includes(friendId) ? cur.filter((id) => id !== friendId) : [...cur, friendId];
      });
    },

    setTripFriends(tripId, friendIds) {
      mutate(tripId, (s) => {
        s.trip.friendIds = friendIds;
      });
    },

    setCommitted(tripId, committed) {
      const me = requireMe();
      mutate(tripId, (s) => {
        const m = s.members.find((x) => x.id === me.id);
        if (m) m.committed = committed;
        s.messages.push({ id: nanoid(8), tripId, memberId: "system", kind: "system", text: `${me.name} ${committed ? "is in ✓" : "backed out"}`, createdAt: new Date().toISOString() });
      });
    },

    lockTrip(tripId) {
      mutate(tripId, (s) => {
        s.trip.status = "committed";
        s.trip.committedAt = new Date().toISOString();
        s.trip.bookingSearchState = "idle";
        s.messages.push({ id: nanoid(8), tripId, memberId: "system", kind: "system", text: "The plan is locked. Searching for bookings…", createdAt: new Date().toISOString() });
      });
    },

    setBookingSearch(tripId, state) {
      mutate(tripId, (s) => {
        s.trip.bookingSearchState = state;
      });
    },

    setBookings(tripId, bookings) {
      mutate(tripId, (s) => {
        s.bookings = bookings;
        s.trip.bookingSearchState = "done";
      });
    },

    selectBooking(tripId, bookingId) {
      mutate(tripId, (s) => {
        const b = s.bookings.find((x) => x.id === bookingId);
        if (!b) return;
        const wasSelected = b.status === "selected";
        s.bookings.filter((x) => x.itineraryItemId === b.itineraryItemId).forEach((x) => (x.status = "suggested"));
        if (!wasSelected) b.status = "selected";
      });
    },

    markBooked(tripId) {
      mutate(tripId, (s) => {
        s.trip.status = "booked";
        s.trip.bookedAt = new Date().toISOString();
        s.bookings.filter((b) => b.status === "selected").forEach((b) => (b.status = "confirmed_by_user"));
        s.messages.push({ id: nanoid(8), tripId, memberId: "system", kind: "system", text: "Trip marked as booked. See you there ✈️", createdAt: new Date().toISOString() });
      });
    },

    reopenPlanning(tripId) {
      mutate(tripId, (s) => {
        s.trip.status = "reviewing";
        s.trip.bookingSearchState = "idle";
        s.bookings = [];
        s.members.forEach((m) => (m.committed = false));
        s.messages.push({ id: nanoid(8), tripId, memberId: "system", kind: "system", text: "Planning reopened.", createdAt: new Date().toISOString() });
      });
    },

    setAiBusy(tripId, msg) {
      set({ aiBusy: { ...get().aiBusy, [tripId]: msg } });
    },

    receiveTrip(incoming) {
      const cur = get().trips[incoming.trip.id];
      if (cur && cur.version >= incoming.version) return;
      const trips = { ...get().trips, [incoming.trip.id]: normalize(incoming) };
      set({ trips });
      saveTrips(trips);
    },

    receivePresence(tripId, p) {
      const me = get().me;
      if (me && p.memberId === me.id) return;
      set({ presence: { ...get().presence, [tripId]: { ...(get().presence[tripId] ?? {}), [p.memberId]: p } } });
    },

    prunePresence() {
      const now = Date.now();
      const presence = { ...get().presence };
      let changed = false;
      for (const tripId of Object.keys(presence)) {
        const map = { ...presence[tripId] };
        for (const k of Object.keys(map)) {
          if (now - map[k].at > 9000) {
            delete map[k];
            changed = true;
          }
        }
        presence[tripId] = map;
      }
      if (changed) set({ presence });
    },

    announce(tripId, view) {
      const me = get().me;
      if (!me) return;
      broadcastPresence(tripId, { memberId: me.id, name: me.name, color: me.color, view, at: Date.now() });
    },
  };
});

/* Selectors */
export const useTrip = (tripId: string) => useStore((s) => s.trips[tripId]);
export const useMe = () => useStore((s) => s.me);
export const usePresence = (tripId: string) => useStore((s) => s.presence[tripId]);

export function sortedItems(items: ItineraryItem[], dayId: string) {
  return items.filter((i) => i.dayId === dayId).sort((a, b) => a.orderIndex - b.orderIndex);
}

export function memberById(members: Member[], id: string) {
  return members.find((m) => m.id === id);
}
