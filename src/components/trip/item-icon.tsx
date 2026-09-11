"use client";

import { Bed, Bus, Compass, Plane, Utensils } from "lucide-react";
import type { ItemType } from "@/lib/types";
import { cn } from "@/components/ui";

export const TYPE_META: Record<ItemType, { label: string; icon: typeof Plane; tone: string }> = {
  flight: { label: "Flight", icon: Plane, tone: "bg-sky-soft text-sky dark:bg-sky/20" },
  lodging: { label: "Stay", icon: Bed, tone: "bg-accent-soft text-accent" },
  activity: { label: "Activity", icon: Compass, tone: "bg-sage-soft text-sage dark:bg-sage/20" },
  meal: { label: "Meal", icon: Utensils, tone: "bg-gold-soft text-gold dark:bg-gold/20" },
  transit: { label: "Transit", icon: Bus, tone: "bg-bg-3 text-fg-3" },
};

export function ItemIcon({ type, className, size = 36 }: { type: ItemType; className?: string; size?: number }) {
  const m = TYPE_META[type];
  const Icon = m.icon;
  return (
    <span className={cn("grid place-items-center rounded-xl shrink-0", m.tone, className)} style={{ width: size, height: size }} title={m.label}>
      <Icon style={{ width: size * 0.45, height: size * 0.45 }} />
    </span>
  );
}
