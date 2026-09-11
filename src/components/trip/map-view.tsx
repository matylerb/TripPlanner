"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Fragment, useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import { useTheme } from "@/components/providers";
import { greatCircle, jitter, type LatLng } from "@/lib/geo";
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

function pinIcon(label: string, kind: MapPoint["kind"], color: string) {
  return L.divIcon({
    className: "",
    html: `<div class="pin" data-kind="${kind}" style="${kind === "activity" || kind === "meal" ? `background:${color}` : ""}">${label}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -14],
  });
}

function FitBounds({ bounds }: { bounds: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    if (!bounds.length) return;
    const b = L.latLngBounds(bounds.map(([a, b]) => L.latLng(a, b)));
    map.flyToBounds(b.pad(0.18), { duration: 0.9, maxZoom: 14 });
  }, [map, bounds]);
  return null;
}

export default function MapView({ state, selectedDay, focusId }: { state: TripState; selectedDay: number | null; focusId?: string | null }) {
  const { dark } = useTheme();
  const { points, dayRoutes, flights } = useMemo(() => buildMapData(state), [state]);

  const visiblePoints = selectedDay ? points.filter((p) => p.dayNumber === selectedDay) : points;
  const visibleRoutes = selectedDay ? dayRoutes.filter((r) => r.dayNumber === selectedDay) : dayRoutes;
  const visibleFlights = selectedDay ? flights.filter((f) => f.dayNumber === selectedDay) : flights;

  const bounds = useMemo(() => {
    if (focusId) {
      const p = points.find((x) => x.id === focusId);
      if (p) return [p.pos, [p.pos[0] + 0.004, p.pos[1] + 0.004] as LatLng];
    }
    const b: LatLng[] = visiblePoints.map((p) => p.pos);
    for (const f of visibleFlights) b.push(f.from, f.to);
    return b.length ? b : ([[state.trip.destination?.lat ?? 0, state.trip.destination?.lng ?? 0]] as LatLng[]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay, focusId, state.trip.id, points.length]);

  const center: LatLng = [state.trip.destination?.lat ?? 20, state.trip.destination?.lng ?? 0];
  // OpenStreetMap standard tiles need no API key. Dark mode is a CSS filter on the tile pane (see globals.css).
  const tiles = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

  return (
    <MapContainer center={center} zoom={11} scrollWheelZoom className={`h-full w-full ${dark ? "map-dark" : ""}`} zoomControl={false} attributionControl>
      <TileLayer url={tiles} attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
      <FitBounds bounds={bounds} />

      {visibleFlights.map((f) => (
        <Fragment key={f.id}>
          <Polyline positions={greatCircle(f.from, f.to)} pathOptions={{ color: "#4d7ea8", weight: 2.5, dashArray: "6 8", opacity: 0.9 }} />
          <Marker position={f.from} icon={pinIcon("✈", "airport", "")}>
            <Popup>{f.label.split("→")[0].trim()}</Popup>
          </Marker>
          <Marker position={f.to} icon={pinIcon("✈", "airport", "")}>
            <Popup>{f.label.split("→")[1]?.trim()}</Popup>
          </Marker>
        </Fragment>
      ))}

      {visibleRoutes.map((r) => (
        <Polyline key={r.dayNumber} positions={r.pts} pathOptions={{ color: r.color, weight: 3, opacity: 0.85, lineCap: "round", lineJoin: "round" }} />
      ))}

      {visiblePoints.map((p) => (
        <Marker key={p.id} position={p.pos} icon={pinIcon(p.kind === "lodging" ? "⌂" : String(p.index), p.kind, DAY_COLORS[(p.dayNumber - 1) % DAY_COLORS.length])} zIndexOffset={p.id === focusId ? 1000 : 0}>
          <Popup>
            <div style={{ fontSize: 12, lineHeight: 1.4 }}>
              <div style={{ fontWeight: 600 }}>{p.title}</div>
              <div style={{ opacity: 0.6 }}>Day {p.dayNumber}</div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
