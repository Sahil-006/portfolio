"use client";

import { useState } from "react";

// A tiny pixel version of the clear-case device from the hero, with legs.
// Hover (or tap) and it trips, drops a chip, then gets back up.

const P = 4; // size of one pixel, in CSS px

const colors: Record<string, string> = {
  c: "#cfe0ff", // clear case
  b: "#0c2a2a", // board
  s: "#0b1f1b", // screen
  t: "#6fd6c2", // screen face
  k: "#1b1e25", // chips
  g: "#4a5263", // d-pad, arms, legs
  r: "#ff6b7a",
  v: "#a78bfa",
};

// 14 × 16 sprite. "." is transparent. The face rows (3–5) are drawn separately.
const body = [
  "..cccccccccc..",
  ".cbbbbbbbbbbc.",
  ".cbssssssssbc.",
  ".cbssssssssbc.",
  ".cbssssssssbc.",
  ".cbssssssssbc.",
  ".cbssssssssbc.",
  ".cbbbbbbbbbbc.",
  "gcbkkbbbbkkbcg",
  "gcbbbbbbbbbbcg",
  ".cbgbbbbbvbbc.",
  ".cbgggbbrbbbc.",
  ".cbgbbbbbbbbc.",
  "..cccccccccc..",
  "...gg....gg...",
  "..ggg....ggg..",
];

// Faces sit on screen rows 3–5, columns 3–10.
const happy = ["..t...t.", "........", "..tttt.."];
const oops = [".t.t.t.t", "..t...t.", "..tttt.."]; // ">_<"-ish: squeezed eyes, flat mouth

function Pixels({ rows, x0 = 0, y0 = 0 }: { rows: string[]; x0?: number; y0?: number }) {
  return (
    <>
      {rows.flatMap((row, y) =>
        [...row].map((ch, x) =>
          ch === "." ? null : (
            <rect key={`${x0 + x}-${y0 + y}`} x={(x0 + x) * P} y={(y0 + y) * P} width={P} height={P} fill={colors[ch]} />
          ),
        ),
      )}
    </>
  );
}

export default function PixelBuddy() {
  const [play, setPlay] = useState(0); // bump to (re)start the trip animation

  const trip = () => setPlay((n) => (n === 0 ? Date.now() : n));

  return (
    <button
      type="button"
      onMouseEnter={trip}
      onFocus={trip}
      onClick={trip}
      aria-label="A tiny clear-case robot. Poke it."
      className="buddy relative block shrink-0 cursor-pointer rounded-md"
      data-play={play ? "true" : undefined}
    >
      <span
        className="buddy-oops pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#ffe98f] px-2 py-0.5 font-display text-xs font-semibold text-[#2b2a33]"
        aria-hidden
      >
        oops.
      </span>
      <svg
        key={play}
        width={14 * P}
        height={16 * P}
        viewBox={`0 0 ${14 * P} ${16 * P}`}
        shapeRendering="crispEdges"
        className="buddy-body overflow-visible"
        onAnimationEnd={(e) => {
          if (e.animationName.includes("buddy-trip")) setPlay(0);
        }}
        aria-hidden
      >
        <g className="buddy-sprite">
          <Pixels rows={body} />
          <g className="buddy-face-happy">
            <Pixels rows={happy} x0={3} y0={3} />
          </g>
          <g className="buddy-face-oops">
            <Pixels rows={oops} x0={3} y0={3} />
          </g>
          {/* The chip that pops out */}
          <g className="buddy-chip">
            <rect x={3 * P} y={8 * P} width={2 * P} height={P} fill={colors.k} />
          </g>
        </g>
      </svg>
      <style>{`
        .buddy-face-oops, .buddy-oops { opacity: 0; }
        .buddy-sprite { transform-box: fill-box; transform-origin: 15% 100%; }
        .buddy-chip { transform-box: fill-box; }
        .buddy[data-play] .buddy-sprite { animation: buddy-trip 1.7s cubic-bezier(.3,.7,.3,1) both; }
        .buddy[data-play] .buddy-face-happy { animation: buddy-face-off 1.7s steps(1) both; }
        .buddy[data-play] .buddy-face-oops { animation: buddy-face-on 1.7s steps(1) both; }
        .buddy[data-play] .buddy-chip { animation: buddy-chip 1.7s ease-out both; }
        .buddy[data-play] .buddy-oops { animation: buddy-bubble 1.7s ease both; }
        @keyframes buddy-trip {
          0% { transform: rotate(0deg); }
          8% { transform: rotate(8deg); }
          24% { transform: rotate(-84deg); }
          30% { transform: rotate(-76deg); }
          34% { transform: rotate(-84deg); }
          62% { transform: rotate(-84deg); }
          82% { transform: rotate(6deg); }
          90% { transform: rotate(-3deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes buddy-face-off { 0% { opacity: 1; } 18% { opacity: 0; } 70% { opacity: 1; } }
        @keyframes buddy-face-on { 0% { opacity: 0; } 18% { opacity: 1; } 70% { opacity: 0; } }
        @keyframes buddy-chip {
          0%, 22% { transform: translate(0, 0); }
          36% { transform: translate(14px, -26px); }
          52% { transform: translate(22px, -6px); }
          64% { transform: translate(22px, -6px); }
          80%, 100% { transform: translate(0, 0); }
        }
        @keyframes buddy-bubble {
          0%, 20% { opacity: 0; transform: translate(-50%, 4px); }
          28%, 62% { opacity: 1; transform: translate(-50%, 0); }
          74%, 100% { opacity: 0; transform: translate(-50%, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .buddy[data-play] .buddy-sprite, .buddy[data-play] .buddy-chip { animation: none; }
        }
      `}</style>
    </button>
  );
}
