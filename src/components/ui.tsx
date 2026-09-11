"use client";

import Link from "next/link";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { useTheme } from "./providers";
import { initials } from "@/lib/format";

/* ---------- cn ---------- */
export function cn(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

/* ---------- Button ---------- */
type Variant = "primary" | "secondary" | "ghost" | "danger" | "ink";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-2 shadow-[0_8px_24px_-8px_var(--accent)]",
  ink: "bg-fg text-bg hover:opacity-90",
  secondary: "bg-card border border-line-c text-fg hover:border-fg-4 hover:bg-bg-2",
  ghost: "text-fg-2 hover:bg-bg-2 hover:text-fg",
  danger: "text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40",
};
const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-xl gap-2",
  lg: "h-12 px-6 text-[15px] rounded-2xl gap-2.5",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium whitespace-nowrap select-none transition-all duration-200 ease-[var(--ease-out-expo)] active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/25",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
});

export function ButtonLink({
  href,
  className,
  variant = "primary",
  size = "md",
  children,
}: {
  href: string;
  className?: string;
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center font-medium whitespace-nowrap select-none transition-all duration-200 ease-[var(--ease-out-expo)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/25",
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </Link>
  );
}

/* ---------- Spinner ---------- */
export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- Avatar ---------- */
export function Avatar({
  name,
  color,
  size = 32,
  className,
  ring,
  title,
}: {
  name: string;
  color: string;
  size?: number;
  className?: string;
  ring?: boolean;
  title?: string;
}) {
  return (
    <span
      title={title ?? name}
      className={cn("relative inline-grid place-items-center rounded-full font-semibold text-white shrink-0", ring && "ring-2 ring-[var(--card)]", className)}
      style={{ width: size, height: size, background: color, fontSize: Math.max(10, size * 0.38) }}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({
  people,
  size = 28,
  max = 5,
}: {
  people: { name: string; color: string; id: string }[];
  size?: number;
  max?: number;
}) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((p, i) => (
        <span key={p.id} style={{ marginLeft: i === 0 ? 0 : -size * 0.3, zIndex: shown.length - i }} className="relative">
          <Avatar name={p.name} color={p.color} size={size} ring />
        </span>
      ))}
      {rest > 0 && (
        <span
          className="relative grid place-items-center rounded-full bg-bg-3 text-fg-2 font-semibold ring-2 ring-[var(--card)]"
          style={{ width: size, height: size, marginLeft: -size * 0.3, fontSize: size * 0.36 }}
        >
          +{rest}
        </span>
      )}
    </div>
  );
}

/* ---------- Logo ---------- */
export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5 select-none", className)} aria-label="GoPlan home">
      <span className="relative grid place-items-center size-7 rounded-lg bg-fg text-bg overflow-hidden">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 18c3-6 6-9 9-9s5 3 7 3" className="transition-transform duration-500 group-hover:-translate-y-0.5" />
          <circle cx="4" cy="18" r="1.6" fill="currentColor" stroke="none" />
          <circle cx="20" cy="12" r="1.6" fill="currentColor" stroke="none" />
        </svg>
      </span>
      {!compact && <span className="font-display text-[19px] tracking-tight">GoPlan</span>}
    </Link>
  );
}

/* ---------- Theme toggle ---------- */
export function ThemeToggle({ className }: { className?: string }) {
  const { dark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className={cn("grid place-items-center size-9 rounded-full border border-line-c bg-card text-fg-2 hover:text-fg hover:border-fg-4 transition-all", className)}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

/* ---------- Pill ---------- */
export function Pill({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "accent" | "sage" | "sky" | "gold" | "plum"; className?: string }) {
  const tones = {
    neutral: "bg-bg-2 text-fg-2 border-line-c",
    accent: "bg-accent-soft text-accent border-transparent",
    sage: "bg-sage-soft text-sage border-transparent dark:bg-sage/20",
    sky: "bg-sky-soft text-sky border-transparent dark:bg-sky/20",
    gold: "bg-gold-soft text-gold border-transparent dark:bg-gold/20",
    plum: "bg-plum-soft text-plum border-transparent dark:bg-plum/20",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold tracking-wide", tones[tone], className)}>
      {children}
    </span>
  );
}

/* ---------- Motion presets ---------- */
export const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
};

export function Reveal({ children, delay = 0, className, ...rest }: HTMLMotionProps<"div"> & { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/* ---------- Page wrapper ---------- */
export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }} className={className}>
      {children}
    </motion.div>
  );
}

/* ---------- Empty ---------- */
export function Empty({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-6">
      {icon && <div className="mb-4 text-fg-3">{icon}</div>}
      <h3 className="font-display text-2xl">{title}</h3>
      {body && <p className="mt-2 max-w-sm text-sm text-fg-3 leading-relaxed">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
