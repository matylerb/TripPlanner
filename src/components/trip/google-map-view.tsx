"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildMapData } from "@/components/trip/map-data";
import { greatCircle, type LatLng } from "@/lib/geo";
import type { TripState } from "@/lib/types";
import { createCrimeHeatmap } from "@/lib/crime-heatmap";
import { crimeBand, crimeCityAt } from "@/lib/crime-data";

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

type GoogleMapInstance = { fitBounds: (bounds: unknown, padding?: number) => void; setCenter: (center: { lat: number; lng: number }) => void; setZoom: (zoom: number) => void };
type Overlay = { setMap: (map: GoogleMapInstance | null) => void };
type GoogleMapsApi = {
  maps: {
    Map: new (element: HTMLElement, options: Record<string, unknown>) => GoogleMapInstance;
    Marker: new (options: Record<string, unknown>) => Overlay & { addListener?: (event: string, callback: () => void) => void };
    Polyline: new (options: Record<string, unknown>) => Overlay;
    GroundOverlay: new (url: string, bounds: { north: number; south: number; east: number; west: number }, options: Record<string, unknown>) => Overlay & { addListener: (event: string, callback: (event: { latLng?: { lat: () => number; lng: () => number } }) => void) => { remove: () => void } };
    Circle: new (options: Record<string, unknown>) => Overlay & { addListener: (event: string, callback: () => void) => { remove: () => void } };
    InfoWindow: new (options: Record<string, unknown>) => { open: (options: Record<string, unknown>) => void; close: () => void };
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
  const [showCrime, setShowCrime] = useState(false);
  const crimeCity = crimeCityAt(state.trip.destination);
  const { points, dayRoutes, flights } = useMemo(() => buildMapData(state), [state]);
  const visiblePoints = useMemo(() => selectedDay ? points.filter((point) => point.dayNumber === selectedDay) : points, [points, selectedDay]);
  const visibleRoutes = useMemo(() => selectedDay ? dayRoutes.filter((route) => route.dayNumber === selectedDay) : dayRoutes, [dayRoutes, selectedDay]);
  const visibleFlights = useMemo(() => selectedDay ? flights.filter((flight) => flight.dayNumber === selectedDay) : flights, [flights, selectedDay]);

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

  useEffect(() => {
    const map = mapRef.current;
    const api = window.google;
    if (!mapReady || !map || !api || !showCrime || !crimeCity) return;
    const heatmap = createCrimeHeatmap(crimeCity);
    const surface = new api.maps.GroundOverlay(heatmap.url, heatmap.bounds, { clickable: true, opacity: 0.7 });
    surface.setMap(map);
    const windows: { close: () => void }[] = [];
    const listener = surface.addListener("click", (event) => {
      if (!event.latLng) return;
      const lat = event.latLng.lat(), lng = event.latLng.lng();
      const area = crimeCity.areas.reduce((nearest, candidate) => {
        const distance = (a: typeof candidate) => (a.lat - lat) ** 2 + ((a.lng - lng) * Math.cos(lat * Math.PI / 180)) ** 2;
        return distance(candidate) < distance(nearest) ? candidate : nearest;
      });
      const band = crimeBand(crimeCity, area);
      const center = { lat: area.lat, lng: area.lng };
      windows.forEach((popup) => popup.close());
      windows.length = 0;
      const info = new api.maps.InfoWindow({ position: center, content:
        `<div style="color:#18181b;padding:4px;max-width:240px"><strong>${escapeHtml(area.name)}</strong><br>${area.count.toLocaleString("en-US")} reported offences · ${crimeCity.year}<br>${band.label} total within ${crimeCity.name}<br><small>Whole-area total. Approximate center, not a street-level safety rating.</small></div>` });
      windows.push(info);
      info.open({ map });
    });
    return () => {
      listener.remove();
      windows.forEach((popup) => popup.close());
      surface.setMap(null);
    };
  }, [crimeCity, mapReady, showCrime]);

  if (!GOOGLE_MAPS_KEY) return <div className="h-full w-full grid place-items-center bg-bg-2 p-6 text-center text-sm text-fg-2">Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local to use Google Maps.</div>;
  if (error) return <div className="h-full w-full grid place-items-center bg-bg-2 p-6 text-center text-sm text-fg-2">{error}</div>;
  return <>
    <div ref={elementRef} className="h-full w-full bg-bg-2" aria-label="Google Maps trip map" />
    <div className="absolute left-3 top-3 z-10 max-w-[min(320px,calc(100%-24px))] rounded-2xl border border-line-c bg-bg p-3 shadow-lg text-fg">
      <button type="button" aria-pressed={showCrime && !!crimeCity} disabled={!crimeCity}
        onClick={() => setShowCrime((value) => !value)}
        className="flex w-full items-center justify-between gap-4 text-sm font-semibold disabled:opacity-60">
        Crime heatmap
        <span className={showCrime && crimeCity ? "rounded-full bg-accent px-2 py-1 text-white" : "rounded-full bg-bg-2 px-2 py-1"}>{showCrime && crimeCity ? "On" : "Off"}</span>
      </button>
      {!crimeCity && <p className="mt-1 text-xs text-fg-3">Available for London and Tokyo’s 23 wards.</p>}
      {crimeCity && showCrime && <div className="mt-2 space-y-2 text-xs">
        <p>{crimeCity.name} · {crimeCity.year} reported crime totals</p>
        <div className="h-2 rounded-full" style={{ background: "linear-gradient(to right, #22c55e, #f59e0b, #ef4444)" }} />
        <div className="flex justify-between gap-3" aria-label="Lower, middle and higher reported offence totals">
          {[['Lower', '#22c55e'], ['Middle', '#f59e0b'], ['Higher', '#ef4444']].map(([label, color]) => <span key={label} className="flex items-center gap-1"><span className="size-2.5 rounded-full" style={{ background: color }} />{label}</span>)}
        </div>
        <p className="text-fg-3">Smoothed estimates between borough/ward centers, not street-level observations or boundaries. Tap near a center for its reported total.</p>
        <details>
          <summary className="cursor-pointer underline">About these statistics</summary>
          <p className="mt-1 text-fg-3">Historical borough/ward totals, not population-adjusted. Colors rank totals within each city; population, visitors and reporting affect counts. Not a personal safety score or a comparison between cities. {crimeCity.name === "London" ? "City of London is excluded." : "Coverage excludes the rest of Tokyo Metropolis."}</p>
          <a className="mt-1 inline-block underline" href={crimeCity.source} target="_blank" rel="noreferrer">Official source</a>
        </details>
      </div>}
    </div>
  </>;
}

function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character); }
