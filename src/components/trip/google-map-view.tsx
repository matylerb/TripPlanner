"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildMapData } from "@/components/trip/map-data";
import { greatCircle, type LatLng } from "@/lib/geo";
import type { TripState } from "@/lib/types";

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

type GoogleMapInstance = { fitBounds: (bounds: unknown, padding?: number) => void; setCenter: (center: { lat: number; lng: number }) => void; setZoom: (zoom: number) => void };
type Overlay = { setMap: (map: GoogleMapInstance | null) => void };
type GoogleMapsApi = {
  maps: {
    Map: new (element: HTMLElement, options: Record<string, unknown>) => GoogleMapInstance;
    Marker: new (options: Record<string, unknown>) => Overlay & { addListener?: (event: string, callback: () => void) => void };
    Polyline: new (options: Record<string, unknown>) => Overlay;
    InfoWindow: new (options: Record<string, unknown>) => { open: (options: Record<string, unknown>) => void };
    LatLngBounds: new () => { extend: (point: { lat: number; lng: number }) => void };
  };
};

declare global { interface Window { google?: GoogleMapsApi } }

function loadGoogleMaps(): Promise<GoogleMapsApi> {
  if (window.google) return Promise.resolve(window.google);
  const existing = document.querySelector<HTMLScriptElement>("script[data-google-maps]");
  if (existing) return new Promise((resolve, reject) => {
    existing.addEventListener("load", () => window.google ? resolve(window.google) : reject(new Error("Google Maps API unavailable")));
    existing.addEventListener("error", () => reject(new Error("Google Maps failed to load")));
  });
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.dataset.googleMaps = "true";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_KEY ?? "")}`;
    script.async = true;
    script.defer = true;
    script.onload = () => window.google ? resolve(window.google) : reject(new Error("Google Maps API unavailable"));
    script.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(script);
  });
}

export default function GoogleMapView({ state, selectedDay, focusId }: { state: TripState; selectedDay: number | null; focusId?: string | null }) {
  const elementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const overlaysRef = useRef<Overlay[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const { points, dayRoutes, flights } = useMemo(() => buildMapData(state), [state]);
  const visiblePoints = selectedDay ? points.filter((point) => point.dayNumber === selectedDay) : points;
  const visibleRoutes = selectedDay ? dayRoutes.filter((route) => route.dayNumber === selectedDay) : dayRoutes;
  const visibleFlights = selectedDay ? flights.filter((flight) => flight.dayNumber === selectedDay) : flights;

  useEffect(() => {
    if (!GOOGLE_MAPS_KEY) return;
    let cancelled = false;
    loadGoogleMaps().then((api) => {
      if (cancelled || !elementRef.current || mapRef.current) return;
      mapRef.current = new api.maps.Map(elementRef.current, { center: { lat: state.trip.destination?.lat ?? 20, lng: state.trip.destination?.lng ?? 0 }, zoom: 11, mapTypeControl: false, streetViewControl: false, fullscreenControl: false });
      setMapReady(true);
    }).catch((loadError: Error) => setError(loadError.message));
    return () => { cancelled = true; };
  }, [state.trip.destination?.lat, state.trip.destination?.lng]);

  useEffect(() => {
    const map = mapRef.current;
    const api = window.google;
    if (!map || !api) return;
    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    overlaysRef.current = [];
    const bounds = new api.maps.LatLngBounds();
    const addPoint = ([lat, lng]: LatLng) => bounds.extend({ lat, lng });
    const addPolyline = (path: LatLng[], color: string, dashed = false) => {
      const overlay = new api.maps.Polyline({ map, path: path.map(([lat, lng]) => ({ lat, lng })), strokeColor: color, strokeOpacity: dashed ? 0 : 0.85, strokeWeight: 3, icons: dashed ? [{ icon: { path: "M 0,-1 0,1", strokeOpacity: 0.9, scale: 3 }, offset: "0", repeat: "14px" }] : undefined });
      overlaysRef.current.push(overlay);
    };
    visibleFlights.forEach((flight) => { addPolyline(greatCircle(flight.from, flight.to), "#4d7ea8", true); [flight.from, flight.to].forEach((position) => { addPoint(position); overlaysRef.current.push(new api.maps.Marker({ map, position: { lat: position[0], lng: position[1] }, label: "✈" })); }); });
    visibleRoutes.forEach((route) => { route.pts.forEach(addPoint); addPolyline(route.pts, route.color); });
    visiblePoints.forEach((point) => {
      addPoint(point.pos);
      const marker = new api.maps.Marker({ map, position: { lat: point.pos[0], lng: point.pos[1] }, label: point.kind === "lodging" ? "⌂" : String(point.index) });
      const info = new api.maps.InfoWindow({ content: `<strong>${escapeHtml(point.title)}</strong><br>Day ${point.dayNumber}` });
      marker.addListener?.("click", () => info.open({ map, anchor: marker }));
      overlaysRef.current.push(marker);
    });
    if (focusId) { const focused = points.find((point) => point.id === focusId); if (focused) { map.setCenter({ lat: focused.pos[0], lng: focused.pos[1] }); map.setZoom(14); return; } }
    if (visiblePoints.length || visibleFlights.length) map.fitBounds(bounds, 60);
  }, [focusId, mapReady, points, visibleFlights, visiblePoints, visibleRoutes]);

  if (!GOOGLE_MAPS_KEY) return <div className="h-full w-full grid place-items-center bg-bg-2 p-6 text-center text-sm text-fg-2">Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local to use Google Maps.</div>;
  if (error) return <div className="h-full w-full grid place-items-center bg-bg-2 p-6 text-center text-sm text-fg-2">{error}</div>;
  return <div ref={elementRef} className="h-full w-full bg-bg-2" aria-label="Google Maps trip map" />;
}

function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character); }
