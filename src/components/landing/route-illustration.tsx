"use client";

import { motion } from "framer-motion";

/**
 * An abstract, hand-drawn-feeling route: dotted flight arc, a few pins, and
 * a day-by-day path that draws itself on load.
 */
export function RouteIllustration({ className }: { className?: string }) {
  const draw = (delay: number, dur = 2.2) => ({
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
    transition: { pathLength: { duration: dur, delay, ease: [0.16, 1, 0.3, 1] as const }, opacity: { duration: 0.3, delay } },
  });
  const pop = (delay: number) => ({
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { type: "spring" as const, stiffness: 260, damping: 18, delay },
  });

  return (
    <svg viewBox="0 0 640 420" className={className} fill="none" aria-hidden>
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* faint graticule */}
      {[60, 140, 220, 300, 380].map((y) => (
        <path key={y} d={`M0 ${y} H640`} stroke="var(--line)" strokeWidth="1" strokeDasharray="2 6" />
      ))}
      {[80, 200, 320, 440, 560].map((x) => (
        <path key={x} d={`M${x} 0 V420`} stroke="var(--line)" strokeWidth="1" strokeDasharray="2 6" />
      ))}

      {/* land masses (abstract) */}
      <motion.path
        d="M40 250 C 90 200, 140 210, 170 240 C 200 270, 180 320, 130 330 C 80 340, 30 300, 40 250 Z"
        stroke="var(--fg-4)"
        strokeWidth="1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ duration: 1.2 }}
      />
      <motion.path
        d="M400 110 C 470 80, 560 100, 600 150 C 630 200, 590 260, 540 280 C 480 300, 430 280, 410 230 C 390 190, 380 130, 400 110 Z"
        stroke="var(--fg-4)"
        strokeWidth="1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ duration: 1.2, delay: 0.2 }}
      />

      {/* flight arc */}
      <motion.path
        d="M120 275 Q 320 40 470 170"
        stroke="var(--color-sky)"
        strokeWidth="2.5"
        strokeDasharray="6 8"
        strokeLinecap="round"
        {...draw(0.4, 2.4)}
      />
      {/* plane */}
      <motion.g
        initial={{ offsetDistance: "0%", opacity: 0 }}
        animate={{ offsetDistance: "100%", opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.4, delay: 0.4, ease: [0.16, 1, 0.3, 1], times: [0, 0.1, 0.9, 1] }}
        style={{ offsetPath: "path('M120 275 Q 320 40 470 170')", offsetRotate: "auto" }}
      >
        <path d="M-9 0 L9 0 M2 -6 L9 0 L2 6" stroke="var(--color-sky)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </motion.g>

      {/* day route */}
      <motion.path
        d="M470 170 C 500 190, 520 210, 505 235 C 490 260, 540 270, 560 250 C 580 232, 545 300, 500 300"
        stroke="var(--accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        {...draw(2.2, 1.8)}
      />

      {/* origin pin */}
      <motion.g {...pop(0.3)} style={{ transformOrigin: "120px 275px" }}>
        <circle cx="120" cy="275" r="26" fill="url(#glow)" />
        <circle cx="120" cy="275" r="7" fill="var(--fg)" stroke="var(--bg)" strokeWidth="3" />
      </motion.g>

      {/* destination pins */}
      {[
        [470, 170, 2.4, "1"],
        [505, 235, 2.9, "2"],
        [560, 250, 3.3, "3"],
        [500, 300, 3.8, "4"],
      ].map(([x, y, d, n]) => (
        <motion.g key={n} {...pop(Number(d))} style={{ transformOrigin: `${x}px ${y}px` }}>
          <circle cx={x} cy={y} r="12" fill="var(--accent)" stroke="var(--bg)" strokeWidth="3" />
          <text x={x} y={Number(y) + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff" fontFamily="var(--font-sans)">
            {n}
          </text>
        </motion.g>
      ))}

      {/* labels */}
      <motion.text x="120" y="312" textAnchor="middle" fontSize="11" fill="var(--fg-3)" fontFamily="var(--font-mono)" letterSpacing="0.1em" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
        HOME
      </motion.text>
      <motion.text x="470" y="150" textAnchor="middle" fontSize="11" fill="var(--fg-3)" fontFamily="var(--font-mono)" letterSpacing="0.1em" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.8 }}>
        DAY 1
      </motion.text>
    </svg>
  );
}
