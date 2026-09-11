"use client";

import { motion } from "framer-motion";
import { MEMBER_COLORS } from "@/lib/format";
import { cn } from "./ui";

export function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {MEMBER_COLORS.map((c) => (
        <motion.button
          key={c}
          type="button"
          whileTap={{ scale: 0.85 }}
          onClick={() => onChange(c)}
          aria-label={`Pick colour ${c}`}
          className={cn("size-8 rounded-full transition-all", value === c ? "ring-2 ring-offset-2 ring-fg ring-offset-[var(--card)] scale-110" : "hover:scale-110 opacity-80 hover:opacity-100")}
          style={{ background: c }}
        />
      ))}
    </div>
  );
}
