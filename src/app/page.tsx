"use client";

import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Lock, MessageSquare, Map, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { ButtonLink, Logo, Reveal, ThemeToggle, Pill, cn } from "@/components/ui";
import { RouteIllustration } from "@/components/landing/route-illustration";
import { useStore } from "@/lib/store";

const steps = [
  {
    n: "01",
    icon: MessageSquare,
    title: "Everyone weighs in",
    body: "Chat like you already do, or answer six quick questions. Both feed the same shared brief.",
  },
  {
    n: "02",
    icon: Sparkles,
    title: "A draft appears",
    body: "The planner reads every preference and proposes a destination, days, and a per-person budget.",
  },
  {
    n: "03",
    icon: Users,
    title: "Edit it together, live",
    body: "Reorder, vote, comment. Watch the budget recalculate as your friends change things.",
  },
  {
    n: "04",
    icon: Lock,
    title: "Commit, then book",
    body: "Nothing gets searched until everyone says \"I'm in.\" Then flights, stays, and tickets, ranked.",
  },
];

const chatDemo = [
  { who: "Maya", color: "#d4562e", text: "somewhere warm in March, ~€1,200 each?" },
  { who: "Jules", color: "#4d7ea8", text: "I hate early flights. otherwise in." },
  { who: "Sam", color: "#6f8f6a", text: "food city please. tacos or tapas." },
  { who: "AI", color: "#14120f", text: "Drafting Lisbon · 5 nights · €1,140 pp" },
  { who: "Priya", color: "#c9962b", text: "one big dinner, one free day 🙏" },
  { who: "Maya", color: "#d4562e", text: "sintra day trip 👍👍👍" },
];

export default function Landing() {
  const trips = useStore((s) => s.trips);
  const hydrated = useStore((s) => s.hydrated);
  const recent = Object.values(trips)
    .sort((a, b) => b.trip.createdAt.localeCompare(a.trip.createdAt))
    .slice(0, 3);

  return (
    <div className="relative min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[color-mix(in_srgb,var(--bg)_75%,transparent)] border-b border-line-c/60">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 h-16 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-sm text-fg-2">
            <a href="#how" className="hover:text-fg transition-colors">How it works</a>
            <a href="#principles" className="hover:text-fg transition-colors">Principles</a>
            <Link href="/friends" className="hover:text-fg transition-colors">Friends</Link>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/friends" className="md:hidden text-fg-2 hover:text-fg transition-colors" aria-label="Friends">
              <Users className="size-5" />
            </Link>
            <ButtonLink href="/new" size="md" variant="ink">
              Start a trip <ArrowRight className="size-4" />
            </ButtonLink>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 pt-10 sm:pt-16 pb-10">
          <div className="relative rounded-[2rem] border border-line-c px-4 sm:px-9 pt-10 sm:pt-14 pb-7">
            <span className="bracket-corner bracket-tl" />
            <span className="bracket-corner bracket-tr" />
            <span className="bracket-corner bracket-bl" />
            <span className="bracket-corner bracket-br" />

            <div className="grid lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 relative z-10">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                  <Pill tone="accent" className="mb-6">
                    <Sparkles className="size-3" /> Collaborative AI trip planner
                  </Pill>
                </motion.div>
                <h1 className="font-display-tight text-[clamp(3rem,8.5vw,7.5rem)] leading-[0.92] text-fg">
                  {["Plan the trip.", "Together.", "Then go."].map((line, i) => (
                    <span key={line} className="block overflow-hidden">
                      <motion.span
                        className="block"
                        initial={{ y: "110%" }}
                        animate={{ y: 0 }}
                        transition={{ duration: 0.9, delay: 0.1 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {i === 1 ? <em className="not-italic text-accent">{line}</em> : line}
                      </motion.span>
                    </span>
                  ))}
                </h1>
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.55 }}
                  className="mt-8 max-w-xl text-lg sm:text-xl text-fg-2 leading-relaxed"
                >
                  A group chat that turns into an itinerary. Everyone says what they want, the planner drafts a
                  trip and a budget, the group edits it live, and nothing gets booked until everyone&apos;s in.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.7 }}
                  className="mt-10 flex flex-wrap items-center gap-4"
                >
                  <ButtonLink href="/new" size="lg">
                    Start a trip <ArrowRight className="size-4" />
                  </ButtonLink>
                  <a href="#how" className="group inline-flex items-center gap-2 text-fg-2 hover:text-fg transition-colors text-[15px]">
                    See how it works
                    <span className="size-6 grid place-items-center rounded-full border border-line-c group-hover:border-fg-4 transition-colors">
                      <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </a>
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="mt-10 flex items-center gap-3 text-xs text-fg-3">
                  <span className="font-mono tracking-widest uppercase">No account needed</span>
                  <span className="size-1 rounded-full bg-fg-4" />
                  <span className="font-mono tracking-widest uppercase">Works in this browser today</span>
                </motion.div>
              </div>

              <div className="lg:col-span-5 relative">
                <div className="absolute -inset-10 bg-[radial-gradient(ellipse_at_center,var(--accent-soft),transparent_65%)] opacity-70 blur-2xl" />
                <RouteIllustration className="relative w-full h-auto" />
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 5.1, duration: 0.5 }}
                  className="relative -mt-2 inline-flex items-center gap-2.5 rounded-lg border border-line-c bg-bg px-3.5 py-2 font-mono text-[11px] tracking-wider text-fg-2"
                >
                  <span className="size-1.5 rounded-full bg-sky animate-pulse" />
                  ROUTE_04 &middot; 4 STOPS &middot; 1 BUDGET
                </motion.div>
                <ChatTicker />
              </div>
            </div>

            {/* compact step ledger — full detail lives in "How it works" below */}
            <Reveal className="mt-10 pt-6 border-t border-line-c grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-5">
              {steps.map((s) => (
                <div key={s.n} className="flex items-center gap-3 min-w-0">
                  <span className="font-display text-sm text-fg-3 shrink-0">{s.n}</span>
                  <div className="min-w-0">
                    <div className="text-[13px] text-fg truncate">{s.title}</div>
                    <div className="mt-1.5 flex gap-1">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <span key={j} className={cn("h-1 w-3 rounded-full", j <= Number(s.n) - 1 ? "bg-accent" : "bg-bg-3")} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </section>

      {/* Recent trips (only if any) */}
      {hydrated && recent.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 sm:px-8 pb-6">
          <Reveal className="card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="eyebrow">Pick up where you left off</span>
              <Link href="/new" className="text-sm text-accent hover:underline">New trip</Link>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {recent.map((t) => (
                <Link
                  key={t.trip.id}
                  href={`/trip/${t.trip.id}`}
                  className="group rounded-2xl border border-line-c bg-bg-2 p-4 hover:border-fg-4 hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-display text-xl leading-tight">{t.trip.name}</div>
                      <div className="mt-1 text-xs text-fg-3">
                        {t.trip.destination?.name ?? "No destination yet"} · {t.members.length} {t.members.length === 1 ? "member" : "members"}
                      </div>
                    </div>
                    <ArrowUpRight className="size-4 text-fg-4 group-hover:text-fg transition-colors" />
                  </div>
                  <Pill className="mt-3 capitalize">{t.trip.status}</Pill>
                </Link>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* How it works */}
      <section id="how" className="mx-auto max-w-7xl px-5 sm:px-8 py-20 sm:py-28">
        <Reveal>
          <span className="eyebrow">How it works</span>
          <h2 className="mt-3 font-display text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.02] max-w-2xl">
            Four steps. One shared brief. Zero &ldquo;so what did we decide?&rdquo;
          </h2>
        </Reveal>
        <div className="mt-14 grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.08} className="card p-6 sm:p-7 relative overflow-hidden group">
              <div className="absolute -right-6 -top-8 font-display text-[9rem] leading-none text-fg/[0.04] group-hover:text-accent/10 transition-colors select-none">
                {s.n}
              </div>
              <s.icon className="size-5 text-accent" />
              <h3 className="mt-6 font-display text-2xl leading-tight">{s.title}</h3>
              <p className="mt-3 text-sm text-fg-3 leading-relaxed">{s.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Principles */}
      <section id="principles" className="border-y border-line-c bg-bg-2/60">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-20 sm:py-28 grid lg:grid-cols-12 gap-10">
          <Reveal className="lg:col-span-5">
            <span className="eyebrow">Principles</span>
            <h2 className="mt-3 font-display text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.02]">
              Opinionated about the boring parts.
            </h2>
          </Reveal>
          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-x-10 gap-y-8">
            {[
              ["The budget is the lowest number in the room.", "Nobody gets priced out. The draft is built to the tightest stated budget, not the average."],
              ["Nothing books itself.", "There is an explicit gate. Until every member is in, the planner only proposes."],
              ["Chat and forms are the same input.", "A one-liner in chat and a filled questionnaire land in the same structured brief."],
              ["Every edit moves the money.", "Change a dinner, swap a hotel, drop a day. The per-person total updates for everyone instantly."],
              ["See the whole trip on one map.", "Flights as arcs, days as routes, stays as pins. Filter by day or take it all in."],
              ["Humans click the last button.", "Deep links open pre-filled searches at real providers. You pay them, not us."],
            ].map(([t, b], i) => (
              <Reveal key={t} delay={i * 0.05}>
                <h3 className="font-display text-xl leading-snug">{t}</h3>
                <p className="mt-2 text-sm text-fg-3 leading-relaxed">{b}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 sm:px-8 py-24 sm:py-32">
        <Reveal className="relative overflow-hidden rounded-[2rem] bg-fg text-bg p-10 sm:p-16">
          <div className="absolute inset-0 opacity-[0.12] [background:radial-gradient(circle_at_20%_20%,var(--accent),transparent_40%),radial-gradient(circle_at_80%_80%,var(--color-sky),transparent_40%)]" />
          <div className="relative grid lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <Map className="size-6 opacity-70" />
              <h2 className="mt-6 font-display-tight text-[clamp(2.5rem,6vw,5.5rem)] leading-[0.95]">
                Your group chat deserves a destination.
              </h2>
            </div>
            <div className="lg:col-span-4 lg:justify-self-end">
              <Link
                href="/new"
                className="inline-flex items-center gap-3 rounded-full bg-bg text-fg px-7 h-14 text-[15px] font-medium hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                Start a trip <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="mx-auto max-w-7xl px-5 sm:px-8 pb-10 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between text-xs text-fg-3">
        <Logo compact />
        <span className="font-mono tracking-wider">GOPLAN · MVP · NO PAYMENTS, NO PURCHASES, JUST PLANS</span>
      </footer>
    </div>
  );
}

function ChatTicker() {
  const doubled = [...chatDemo, ...chatDemo];
  return (
    <div className="relative mt-2 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
      <div className="flex gap-3 w-max animate-marquee">
        {doubled.map((m, i) => (
          <div key={i} className="flex items-center gap-2.5 rounded-full border border-line-c bg-card pl-1.5 pr-4 py-1.5 text-[13px] whitespace-nowrap shadow-soft">
            <span className="grid place-items-center size-6 rounded-full text-[10px] font-bold text-white" style={{ background: m.color }}>
              {m.who === "AI" ? "✦" : m.who[0]}
            </span>
            <span className="text-fg-2">
              <span className="font-semibold text-fg">{m.who}</span> {m.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
