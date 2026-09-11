"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Link2, Lock, Map, MessageSquare, ShoppingBag, Sparkles, Users, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Avatar, Empty, Logo, Pill, ThemeToggle, cn } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { TripState, TripStatus } from "@/lib/types";
import { fmtRange } from "@/lib/format";

export const SECTIONS = [
  { key: "input", label: "Brief", hint: "Chat & questionnaire", icon: MessageSquare },
  { key: "plan", label: "Plan", hint: "Itinerary & budget", icon: Sparkles },
  { key: "commit", label: "Commit", hint: "Everyone in?", icon: Lock },
  { key: "bookings", label: "Book", hint: "Flights, stays, tickets", icon: ShoppingBag },
  { key: "map", label: "Map", hint: "The whole trip", icon: Map },
] as const;

export type SectionKey = (typeof SECTIONS)[number]["key"];

const STATUS_ORDER: TripStatus[] = ["gathering", "reviewing", "committed", "booked"];

export function sectionAvailability(state: TripState): Record<SectionKey, boolean> {
  const idx = STATUS_ORDER.indexOf(state.trip.status);
  return {
    input: true,
    plan: idx >= 1,
    commit: idx >= 1,
    bookings: idx >= 2,
    map: idx >= 1,
  };
}

export function statusTone(s: TripStatus) {
  return ({ gathering: "neutral", reviewing: "gold", committed: "sky", booked: "sage" } as const)[s];
}

export function TripShell({ tripId, children }: { tripId: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useStore((s) => s.hydrated);
  const state = useStore((s) => s.trips[tripId]);
  const me = useStore((s) => s.me);
  const presence = useStore((s) => s.presence[tripId]);
  const announce = useStore((s) => s.announce);
  const isMember = useStore((s) => s.isMember(tripId));

  const section = (pathname.split("/")[3] as SectionKey) || "input";

  useEffect(() => {
    if (!hydrated) return;
    if (state && !isMember) router.replace(`/join/${tripId}`);
  }, [hydrated, state, isMember, router, tripId]);

  useEffect(() => {
    if (!hydrated || !isMember) return;
    announce(tripId, section);
    const t = setInterval(() => announce(tripId, section), 3000);
    return () => clearInterval(t);
  }, [hydrated, isMember, announce, tripId, section]);

  const online = useMemo(() => {
    if (!state) return [];
    const ids = new Set(Object.keys(presence ?? {}));
    if (me) ids.add(me.id);
    return state.members.filter((m) => ids.has(m.id)).map((m) => ({ ...m, view: m.id === me?.id ? section : presence?.[m.id]?.view }));
  }, [state, presence, me, section]);

  if (!hydrated) return <div className="min-h-screen" />;
  if (!state) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="mx-auto w-full max-w-7xl px-5 sm:px-8 h-16 flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </header>
        <main className="flex-1 grid place-items-center">
          <Empty title="Trip not found in this browser" body="Trips are stored locally for now. Open the invite link on the device it was created on, or start a new trip." action={<Link href="/new" className="text-accent hover:underline">Start a new trip →</Link>} />
        </main>
      </div>
    );
  }
  if (!isMember) return <div className="min-h-screen" />;

  const avail = sectionAvailability(state);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[272px_1fr]">
      {/* Rail */}
      <aside className="hidden lg:flex flex-col sticky top-0 h-screen border-r border-line-c bg-bg-2/50 px-5 py-6">
        <Logo />
        <div className="mt-8">
          <div className="flex items-center gap-2">
            <Pill tone={statusTone(state.trip.status)} className="capitalize">{state.trip.status}</Pill>
          </div>
          <h1 className="mt-3 font-display text-[1.65rem] leading-[1.05] break-words">{state.trip.name}</h1>
          <p className="mt-1.5 text-xs text-fg-3">
            {state.trip.destination ? `${state.trip.destination.name} · ${fmtRange(state.trip.startDate, state.trip.endDate)}` : "Destination TBD"}
          </p>
        </div>

        <nav className="mt-8 space-y-1">
          {SECTIONS.map((s, i) => {
            const active = section === s.key;
            const ok = avail[s.key];
            return (
              <Link
                key={s.key}
                href={`/trip/${tripId}/${s.key}`}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all",
                  active ? "bg-card shadow-soft border border-line-c" : "hover:bg-card/70 border border-transparent",
                  !ok && "opacity-45",
                )}
              >
                <span className={cn("font-mono text-[10px] w-4 text-fg-4", active && "text-accent")}>0{i + 1}</span>
                <s.icon className={cn("size-4", active ? "text-accent" : "text-fg-3")} />
                <span className="flex-1">
                  <span className={cn("block text-sm font-medium", active ? "text-fg" : "text-fg-2")}>{s.label}</span>
                  <span className="block text-[11px] text-fg-4">{s.hint}</span>
                </span>
                {!ok && <Lock className="size-3 text-fg-4" />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6">
          <MembersList state={state} online={online} meId={me?.id} />
          <InviteButton tripId={tripId} className="mt-4 w-full" />
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 backdrop-blur-md bg-[color-mix(in_srgb,var(--bg)_78%,transparent)] border-b border-line-c/70">
          <div className="px-4 sm:px-8 h-14 flex items-center gap-3">
            <div className="lg:hidden">
              <Logo compact />
            </div>
            <div className="lg:hidden min-w-0 flex-1">
              <div className="font-display text-base truncate leading-tight">{state.trip.name}</div>
            </div>
            <div className="hidden lg:flex items-center gap-2 text-sm text-fg-3">
              <span className="text-fg font-medium">{SECTIONS.find((s) => s.key === section)?.label}</span>
              <span className="text-fg-4">·</span>
              <span>{SECTIONS.find((s) => s.key === section)?.hint}</span>
            </div>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <PresenceStrip online={online} meId={me?.id} />
              <div className="lg:hidden">
                <InviteButton tripId={tripId} compact />
              </div>
              <Link href="/friends" title="Friends & chats" className="grid place-items-center size-9 rounded-full border border-line-c bg-card text-fg-2 hover:text-fg hover:border-fg-4 transition-all">
                <UsersRound className="size-4" />
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="flex-1 pb-24 lg:pb-10">
          <AnimatePresence mode="wait">
            <motion.div key={section} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mobile tab bar */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-line-c bg-[color-mix(in_srgb,var(--card)_90%,transparent)] backdrop-blur-md px-2 pb-[env(safe-area-inset-bottom)]">
          <div className="grid grid-cols-5">
            {SECTIONS.map((s) => {
              const active = section === s.key;
              return (
                <Link key={s.key} href={`/trip/${tripId}/${s.key}`} className={cn("flex flex-col items-center gap-1 py-2.5 text-[10.5px] font-medium", active ? "text-accent" : "text-fg-3", !avail[s.key] && "opacity-45")}>
                  <s.icon className="size-5" />
                  {s.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

function MembersList({ state, online, meId }: { state: TripState; online: { id: string; view?: string }[]; meId?: string }) {
  const onlineIds = new Set(online.map((o) => o.id));
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="eyebrow">Group · {state.members.length}/8</span>
        <Users className="size-3.5 text-fg-4" />
      </div>
      <ul className="mt-3 space-y-2">
        {state.members.map((m) => {
          const on = onlineIds.has(m.id);
          const view = online.find((o) => o.id === m.id)?.view;
          return (
            <li key={m.id} className="flex items-center gap-2.5 text-sm">
              <span className="relative">
                <Avatar name={m.displayName} color={m.color} size={26} />
                <span className={cn("absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-2 ring-[var(--bg-2)]", on ? "bg-sage" : "bg-fg-4/50")} />
              </span>
              <span className="flex-1 truncate">
                {m.displayName}
                {m.id === meId && <span className="text-fg-4"> (you)</span>}
              </span>
              {on && view && <span className="text-[10px] font-mono uppercase tracking-wider text-fg-4">{view}</span>}
              {m.committed && <Check className="size-3.5 text-sage" />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PresenceStrip({ online, meId }: { online: { id: string; displayName: string; color: string; view?: string }[]; meId?: string }) {
  return (
    <div className="flex items-center">
      <AnimatePresence initial={false}>
        {online.map((m, i) => (
          <motion.span
            key={m.id}
            initial={{ scale: 0, opacity: 0, x: 8 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative"
            style={{ marginLeft: i === 0 ? 0 : -8, zIndex: online.length - i }}
            title={`${m.displayName}${m.id === meId ? " (you)" : ""} · viewing ${m.view ?? "…"}`}
          >
            <Avatar name={m.displayName} color={m.color} size={28} ring />
            {m.id !== meId && <span className="absolute -inset-0.5 rounded-full pulse-ring pointer-events-none" style={{ ["--accent" as string]: m.color }} />}
          </motion.span>
        ))}
      </AnimatePresence>
      <span className="ml-2.5 hidden sm:inline text-xs text-fg-3">
        {online.length} online
      </span>
    </div>
  );
}

export function InviteButton({ tripId, className, compact }: { tripId: string; className?: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    const url = `${window.location.origin}/join/${tripId}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy this invite link", url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  if (compact) {
    return (
      <button onClick={copy} aria-label="Copy invite link" className="grid place-items-center size-9 rounded-full border border-line-c bg-card text-fg-2 hover:text-fg hover:border-fg-4 transition-all">
        {copied ? <Check className="size-4 text-sage" /> : <Link2 className="size-4" />}
      </button>
    );
  }
  return (
    <button onClick={copy} className={cn("group relative flex items-center justify-center gap-2 h-10 rounded-xl bg-fg text-bg text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98]", className)}>
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span key="ok" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="flex items-center gap-2">
            <Check className="size-4" /> Link copied
          </motion.span>
        ) : (
          <motion.span key="copy" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="flex items-center gap-2">
            <Copy className="size-4" /> Copy invite link
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
