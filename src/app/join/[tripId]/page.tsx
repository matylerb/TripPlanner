"use client";

import { motion } from "framer-motion";
import { ArrowRight, Users } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ColorPicker } from "@/components/color-picker";
import { Avatar, AvatarStack, Button, Empty, Logo, Pill, ThemeToggle } from "@/components/ui";
import { MEMBER_COLORS } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function JoinTrip() {
  const { tripId } = useParams<{ tripId: string }>();
  const router = useRouter();
  const hydrated = useStore((s) => s.hydrated);
  const state = useStore((s) => s.trips[tripId]);
  const me = useStore((s) => s.me);
  const isMember = useStore((s) => s.isMember(tripId));
  const joinTrip = useStore((s) => s.joinTrip);

  const [whoInput, setWho] = useState<string | null>(null);
  const [colorInput, setColor] = useState<string | null>(null);
  const who = whoInput ?? me?.name ?? "";
  const color = colorInput ?? me?.color ?? MEMBER_COLORS[1];

  useEffect(() => {
    if (hydrated && isMember) router.replace(`/trip/${tripId}`);
  }, [hydrated, isMember, router, tripId]);

  if (!hydrated) return null;

  if (!state) {
    return (
      <Shell>
        <Empty
          icon={<Users className="size-8" />}
          title="This trip isn't in this browser."
          body="Trips are stored locally for now. Ask the organiser to open the link on this device, or start a new one."
          action={
            <Link href="/new" className="text-accent hover:underline">
              Start a new trip →
            </Link>
          }
        />
      </Shell>
    );
  }

  const full = state.members.length >= 8;

  return (
    <Shell>
      <motion.form
        onSubmit={(e) => {
          e.preventDefault();
          if (joinTrip(tripId, who, color)) router.replace(`/trip/${tripId}`);
        }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl"
      >
        <span className="eyebrow">You&apos;re invited</span>
        <h1 className="mt-2 font-display text-[clamp(2.4rem,6vw,4rem)] leading-[1]">{state.trip.name}</h1>
        <div className="mt-4 flex items-center gap-3">
          <AvatarStack people={state.members.map((m) => ({ id: m.id, name: m.displayName, color: m.color }))} />
          <span className="text-sm text-fg-3">
            {state.members.map((m) => m.displayName).join(", ")} {state.members.length === 1 ? "is" : "are"} already in
          </span>
          <Pill className="capitalize">{state.trip.status}</Pill>
        </div>

        <div className="card mt-8 p-6 sm:p-8 space-y-7">
          <div className="grid sm:grid-cols-[1fr_auto] gap-5 items-end">
            <label className="block">
              <span className="text-sm font-medium">Your name</span>
              <input autoFocus value={who} onChange={(e) => setWho(e.target.value)} placeholder="What the group calls you" className="field mt-2 text-lg" maxLength={24} />
            </label>
            <Avatar name={who || "?"} color={color} size={46} />
          </div>
          <div>
            <span className="text-sm font-medium">Your colour</span>
            <div className="mt-2.5">
              <ColorPicker value={color} onChange={setColor} />
            </div>
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={who.trim().length === 0 || full}>
            {full ? "This trip is full (8 max)" : "Join the trip"} {!full && <ArrowRight className="size-4" />}
          </Button>
        </div>
      </motion.form>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="mx-auto w-full max-w-7xl px-5 sm:px-8 h-16 flex items-center justify-between">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="flex-1 grid place-items-center px-5 pb-20">{children}</main>
    </div>
  );
}
