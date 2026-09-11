import { jitter, type LatLng } from "@/lib/geo";
import { sortedItems } from "@/lib/store";
import type { TripState } from "@/lib/types";

const DAY_COLORS = ["#d4562e", "#4d7ea8", "#6f8f6a", "#c9962b", "#7a4b7b", "#2f8f8a", "#b04a6b", "#5b6abf", "#d4562e", "#4d7ea8", "#6f8f6a", "#c9962b", "#7a4b7b", "#2f8f8a"];

export interface MapPoint {
  id: string;
  dayNumber: number;
  index: number;
  title: string;
  kind: "activity" | "meal" | "lodging" | "transit" | "airport";
  pos: LatLng;
}

export function buildMapData(state: TripState) {
  const points: MapPoint[] = [];
  const dayRoutes: { dayNumber: number; pts: LatLng[]; color: string }[] = [];
  const flights: { id: string; from: LatLng; to: LatLng; label: string; dayNumber: number }[] = [];

  for (const day of state.days) {
    const items = sortedItems(state.items, day.id);
    const pts: LatLng[] = [];
    let idx = 0;
    for (const it of items) {
      if (it.type === "flight" && it.details.fromLat != null && it.details.toLat != null) {
        flights.push({ id: it.id, from: [it.details.fromLat, it.details.fromLng!], to: [it.details.toLat, it.details.toLng!], label: it.title, dayNumber: day.dayNumber });
        continue;
      }
      if (it.details.lat == null || it.details.lng == null) continue;
      idx += 1;
      const pos = jitter([it.details.lat, it.details.lng], idx + day.dayNumber * 13, it.type === "lodging" ? 0 : 0.0025);
      points.push({ id: it.id, dayNumber: day.dayNumber, index: idx, title: it.title, kind: it.type as MapPoint["kind"], pos });
      pts.push(pos);
    }
    if (pts.length > 1) dayRoutes.push({ dayNumber: day.dayNumber, pts, color: DAY_COLORS[(day.dayNumber - 1) % DAY_COLORS.length] });
  }
  return { points, dayRoutes, flights };
}
