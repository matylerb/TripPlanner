import type { BudgetCategory, BudgetLine, ItemType, ItineraryItem } from "./types";

export const CATEGORY_ORDER: BudgetCategory[] = [
  "flights",
  "lodging",
  "food",
  "activities",
  "transit",
  "buffer",
];

export const CATEGORY_LABEL: Record<BudgetCategory, string> = {
  flights: "Flights",
  lodging: "Lodging",
  food: "Food & drink",
  activities: "Activities",
  transit: "Local transit",
  buffer: "Buffer",
};

const TYPE_TO_CATEGORY: Record<ItemType, BudgetCategory> = {
  flight: "flights",
  lodging: "lodging",
  meal: "food",
  activity: "activities",
  transit: "transit",
};

export const BUFFER_RATE = 0.1;

/** Pure: recompute the budget lines from the itinerary items. Costs are per person. */
export function computeBudget(items: ItineraryItem[], memberCount: number): BudgetLine[] {
  const n = Math.max(1, memberCount);
  const perPerson: Record<BudgetCategory, number> = {
    flights: 0,
    lodging: 0,
    food: 0,
    activities: 0,
    transit: 0,
    buffer: 0,
  };
  for (const it of items) {
    perPerson[TYPE_TO_CATEGORY[it.type]] += it.costEstimate || 0;
  }
  const subtotal = CATEGORY_ORDER.filter((c) => c !== "buffer").reduce(
    (s, c) => s + perPerson[c],
    0,
  );
  perPerson.buffer = Math.round(subtotal * BUFFER_RATE);
  return CATEGORY_ORDER.map((category) => ({
    category,
    perPersonAmount: Math.round(perPerson[category]),
    estimatedAmount: Math.round(perPerson[category] * n),
  }));
}

export function budgetTotals(lines: BudgetLine[]) {
  const perPerson = lines.reduce((s, l) => s + l.perPersonAmount, 0);
  const group = lines.reduce((s, l) => s + l.estimatedAmount, 0);
  return { perPerson, group };
}
