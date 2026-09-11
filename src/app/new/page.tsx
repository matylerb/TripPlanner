"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ColorPicker } from "@/components/color-picker";
import { Avatar, Button, Logo, ThemeToggle } from "@/components/ui";
import { MEMBER_COLORS } from "@/lib/format";
import { useStore } from "@/lib/store";

const SUGGESTIONS = ["Spring break, finally", "The big 30", "Bachelor(ette) weekend", "Family summer", "Mates' trip"];

export default function NewTrip() {
  const router = useRouter();
  const createTrip = useStore((s) => s.createTrip);
  const me = useStore((s) => s.me);
  const hydrated = useStore((s) => s.hydrated);
  const [name, setName] = useState("");
  const [whoInput, setWho] = useState<string | null>(null);
  const [colorInput, setColor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const who = whoInput ?? me?.name ?? "";
  const color = colorInput ?? me?.color ?? MEMBER_COLORS[0];

  const canGo = name.trim().length > 1 && who.trim().length > 0;

  const go = () => {
    if (!canGo) return;
    setBusy(true);
    const id = createTrip(name, who, color);
    router.push(`/trip/${id}/input`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="mx-auto w-full max-w-7xl px-5 sm:px-8 h-16 flex items-center justify-between">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="flex-1 grid place-items-center px-5 pb-20">
        <motion.form
          onSubmit={(e) => {
            e.preventDefault();
            go();
          }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-xl"
        >
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-fg-3 hover:text-fg transition-colors mb-8">
            <ArrowLeft className="size-4" /> Back
          </Link>
          <span className="eyebrow">New trip</span>
          <h1 className="mt-2 font-display text-[clamp(2.4rem,6vw,4rem)] leading-[1]">Name the thing.</h1>
          <p className="mt-3 text-fg-3">You can invite the group in a second. First, what are we calling it?</p>

          <div className="card mt-8 p-6 sm:p-8 space-y-7">
            <label className="block">
              <span className="text-sm font-medium">Trip name</span>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maya's 30th somewhere warm"
                className="field mt-2 text-lg"
                maxLength={60}
              />
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button type="button" key={s} onClick={() => setName(s)} className="chip">
                    {s}
                  </button>
                ))}
              </div>
            </label>

            <div className="grid sm:grid-cols-[1fr_auto] gap-5 items-end">
              <label className="block">
                <span className="text-sm font-medium">Your name</span>
                <input value={who} onChange={(e) => setWho(e.target.value)} placeholder="What the group calls you" className="field mt-2" maxLength={24} />
              </label>
              <Avatar name={who || "?"} color={color} size={46} />
            </div>
            <div>
              <span className="text-sm font-medium">Your colour</span>
              <div className="mt-2.5">
                <ColorPicker value={color} onChange={setColor} />
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={!canGo || !hydrated} loading={busy}>
              Create trip <ArrowRight className="size-4" />
            </Button>
          </div>
        </motion.form>
      </main>
    </div>
  );
}
