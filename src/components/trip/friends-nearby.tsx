"use client";

import { MapPin, Plus } from "lucide-react";
import { useMemo } from "react";
import { Avatar, Button } from "@/components/ui";
import { DESTINATIONS } from "@/lib/ai/destinations";
import { FRIENDS_BY_DESTINATION } from "@/lib/social/mock-data";
import { friendById, useSocialStore } from "@/lib/social/store";
import { useStore } from "@/lib/store";
import type { TripState } from "@/lib/types";

export function FriendsNearby({ state, readOnly }: { state: TripState; readOnly?: boolean }) {
  const friends = useSocialStore((s) => s.friends);
  const toggleTripFriend = useStore((s) => s.toggleTripFriend);

  const dest = useMemo(() => DESTINATIONS.find((d) => d.name === state.trip.destination?.name), [state.trip.destination?.name]);
  const already = new Set(state.trip.friendIds ?? []);
  const spotted = dest ? (FRIENDS_BY_DESTINATION[dest.slug] ?? []).filter((s) => !already.has(s.friendId)) : [];

  if (!dest || spotted.length === 0) return null;

  return (
    <div className="card overflow-hidden">
      <div className="px-5 pt-5 pb-4">
        <div className="eyebrow flex items-center gap-1.5">
          <MapPin className="size-3 text-accent" /> Friends near {dest.name}
        </div>
        <p className="mt-1 text-sm text-fg-3">Not on your list yet — might be worth a message.</p>
      </div>
      <div className="divide-y divide-line-c">
        {spotted.map(({ friendId, note }) => {
          const f = friendById(friends, friendId);
          if (!f) return null;
          return (
            <div key={friendId} className="px-5 py-3 flex items-center gap-3">
              <Avatar name={f.name} color={f.color} size={38} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{f.name}</div>
                <div className="text-xs text-fg-3 truncate">{note}</div>
              </div>
              {!readOnly && (
                <Button size="sm" variant="secondary" onClick={() => toggleTripFriend(state.trip.id, friendId)}>
                  <Plus className="size-3.5" /> Add
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
