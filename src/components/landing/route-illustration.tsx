"use client";

import { motion } from "framer-motion";

/**
 * An abstract, hand-drawn-feeling route: dotted flight arc, a few pins, and
 * a day-by-day path that draws itself on load. Three leader-line annotations
 * label the stages of the product (input, draft, budget) once the route settles.
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
  const fade = (delay: number, dur = 0.6) => ({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: dur, delay },
  });

  const annotations = [
    { step: "01", label: "GROUP INPUT", color: "var(--fg)", node: [120, 246], path: "M120 246 L120 -30 L85 -30 L85 -72", box: { x: 0, y: -72, w: 170, h: 40 } },
    { step: "02", label: "AI DRAFT", color: "var(--color-sky)", node: [307, 131], path: "M307 131 L307 -30 L515 -30 L515 -72", box: { x: 430, y: -72, w: 170, h: 40 } },
    { step: "03", label: "LIVE BUDGET", color: "var(--accent)", node: [500, 300], path: "M500 300 L500 420 L425 420 L425 456", box: { x: 340, y: 456, w: 170, h: 40 } },
  ] as const;

  return (
    <svg viewBox="0 -80 640 580" className={className} fill="none" aria-hidden>
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

      {/* annotations: leader-lines from the route to labeled spec tags */}
      {annotations.map((a, i) => {
        const delay = 4.2 + i * 0.3;
        const boxMidX = a.box.x + a.box.w / 2;
        return (
          <g key={a.label}>
            <motion.rect x={a.node[0] - 3} y={a.node[1] - 3} width="6" height="6" fill={a.color} {...pop(delay)} />
            <motion.path d={a.path} stroke="var(--fg-4)" strokeWidth="1" {...draw(delay + 0.1, 0.6)} />
            <motion.g {...fade(delay + 0.5)}>
              <rect x={a.box.x} y={a.box.y} width={a.box.w} height={a.box.h} fill="var(--bg)" fillOpacity="0.7" stroke="var(--line)" strokeWidth="1" />
              <path
                d={`M${a.box.x} ${a.box.y + 10} v-10 h10 M${a.box.x + a.box.w - 10} ${a.box.y} h10 v10 M${a.box.x + a.box.w} ${a.box.y + a.box.h - 10} v10 h-10 M${a.box.x + 10} ${a.box.y + a.box.h} h-10 v-10`}
                stroke={a.color}
                strokeWidth="1.5"
              />
              <text x={boxMidX} y={a.box.y + 16} textAnchor="middle" fontSize="9" fill="var(--fg-3)" fontFamily="var(--font-mono)" letterSpacing="0.08em">
                STEP {a.step}
              </text>
              <text x={boxMidX} y={a.box.y + 30} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--fg)" fontFamily="var(--font-mono)" letterSpacing="0.06em">
                {a.label}
              </text>
            </motion.g>
          </g>
        );
      })}
    </svg>
  );
}
