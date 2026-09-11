export const eur = (n: number, opts: { compact?: boolean } = {}) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
    notation: opts.compact ? "compact" : "standard",
  }).format(n);

export function fmtDate(iso: string | undefined, style: "short" | "long" | "weekday" = "short") {
  if (!iso) return "";
  const d = new Date(iso + (iso.length === 10 ? "T12:00:00" : ""));
  if (Number.isNaN(d.getTime())) return iso;
  if (style === "long")
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  if (style === "weekday")
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function fmtRange(start?: string, end?: string) {
  if (!start || !end) return "Dates TBD";
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  const sameMonth = s.getMonth() === e.getMonth();
  const sm = s.toLocaleDateString("en-US", { month: "short" });
  const em = e.toLocaleDateString("en-US", { month: "short" });
  return sameMonth
    ? `${sm} ${s.getDate()}–${e.getDate()}`
    : `${sm} ${s.getDate()} – ${em} ${e.getDate()}`;
}

export function addDays(iso: string, n: number) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string) {
  const d1 = new Date(a + "T12:00:00").getTime();
  const d2 = new Date(b + "T12:00:00").getTime();
  return Math.round((d2 - d1) / 86400000);
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}

export function plural(n: number, word: string, pluralWord?: string) {
  return `${n} ${n === 1 ? word : pluralWord ?? word + "s"}`;
}

export const MEMBER_COLORS = [
  "#d4562e",
  "#4d7ea8",
  "#6f8f6a",
  "#c9962b",
  "#7a4b7b",
  "#2f8f8a",
  "#b04a6b",
  "#5b6abf",
];
