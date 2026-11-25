"use client";

import { motion, useReducedMotion } from "framer-motion";

// A hand-built ECG trace (P wave, QRS spike, T wave) — a nod to Early Spark.
// It draws itself once on page load, then stays still.
function buildPath(width: number, base: number, beats: number[]) {
  let d = `M0 ${base}`;
  for (const x of beats) {
    d += ` L${x} ${base}`;
    d += ` Q${x + 7} ${base - 7} ${x + 14} ${base}`; // P
    d += ` L${x + 22} ${base}`;
    d += ` L${x + 25} ${base + 6}`; // Q
    d += ` L${x + 30} ${base - 40}`; // R
    d += ` L${x + 35} ${base + 14}`; // S
    d += ` L${x + 39} ${base}`;
    d += ` L${x + 50} ${base}`;
    d += ` Q${x + 60} ${base - 12} ${x + 70} ${base}`; // T
  }
  d += ` L${width} ${base}`;
  return d;
}

export default function EcgTrace() {
  const reduce = useReducedMotion();
  const width = 720;
  const path = buildPath(width, 52, [70, 250, 430, 610]);

  return (
    <svg
      viewBox={`0 0 ${width} 72`}
      className="h-14 w-full sm:h-[72px]"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path d={`M0 52 L${width} 52`} stroke="var(--color-rule)" strokeWidth="1" />
      <motion.path
        d={path}
        fill="none"
        stroke="var(--color-signal)"
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2.2, ease: [0.4, 0, 0.2, 1] }}
      />
    </svg>
  );
}
