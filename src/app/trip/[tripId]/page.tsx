"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useStore } from "@/lib/store";

/** Redirect to the stage that matches the trip's status. */
export default function TripIndex() {
  const { tripId } = useParams<{ tripId: string }>();
  const router = useRouter();
  const hydrated = useStore((s) => s.hydrated);
  const state = useStore((s) => s.trips[tripId]);

  useEffect(() => {
    if (!hydrated) return;
    const status = state?.trip.status;
    const target = status === "reviewing" ? "plan" : status === "committed" ? "bookings" : status === "booked" ? "map" : "input";
    router.replace(`/trip/${tripId}/${target}`);
  }, [hydrated, state?.trip.status, router, tripId]);

  return null;
}
