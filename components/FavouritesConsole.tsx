"use client";

import { useEffect, useRef, useState } from "react";
import { favourites, type Favourite } from "@/data/favourites";
import Cartridge from "./Cartridge";

type Inserted = { kind: string; item: Favourite } | null;

// Builds the lines shown on the console screen.
function screenLines(sel: Inserted, readError: boolean): string[] {
  if (!sel) return ["$ insert a cartridge", "> waiting..."];
  const { item, kind } = sel;
  if (readError)
    return [
      `$ load ${item.title.toLowerCase().replace(/\s+/g, "_")}`,
      "> read error.",
      "> blow on the cartridge and try again.",
    ];
  return [
    `$ load ${item.title.toLowerCase().replace(/\s+/g, "_")}`,
    "> reading... ok",
    `${item.title.toUpperCase()}  (${item.year})`,
    `${kind} / ${item.by}`,
    ...(item.note ? [`"${item.note}"`] : []),
  ];
}

export default function FavouritesConsole() {
  const [sel, setSel] = useState<Inserted>(null);
  const [readError, setReadError] = useState(false);
  const [typed, setTyped] = useState(0);
  const lastWasError = useRef(false);
  const lines = screenLines(sel, readError);
  const full = lines.join("\n");

  // Type the screen text out; instant if the visitor prefers reduced motion.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTyped(full.length);
      return;
    }
    setTyped(0);
    const id = setInterval(() => {
      setTyped((n) => {
        if (n >= full.length) {
          clearInterval(id);
          return n;
        }
        return n + 2;
      });
    }, 16);
    return () => clearInterval(id);
  }, [full]);

  const insert = (kind: string, item: Favourite) => {
    const same = sel?.item.title === item.title;
    // Now and then a cartridge doesn't read on the first try. Never twice in a row,
    // and re-inserting the same one always works.
    const fail = !same && !lastWasError.current && Math.random() < 0.2;
    lastWasError.current = fail;
    setReadError(fail);
    setSel({ kind, item });
  };

  const shown = full.slice(0, typed);
  const tint = sel && !readError ? sel.item.tint : "#6fd6c2";

  return (
    <>
      {/* The console screen stays in view while you browse. */}
      <div className="sticky top-3 z-20 mt-10">
        <div className="rounded-2xl border border-white/10 bg-[#1a1d24] p-1.5 sm:p-2.5 shadow-[0_20px_50px_-24px_rgb(0_0_0/0.8)]">
          <div
            className="relative min-h-[96px] overflow-hidden rounded-xl bg-[#06120f] px-4 py-3 font-mono text-[11.5px] leading-relaxed sm:min-h-[140px] sm:px-5 sm:py-4 sm:text-sm"
            style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace" }}
            aria-live="polite"
          >
            <pre className="whitespace-pre-wrap break-words" style={{ color: tint }}>
              {shown}
              <span className="ml-0.5 inline-block h-[1.05em] w-[0.55em] translate-y-[0.15em] animate-pulse bg-current" aria-hidden />
            </pre>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "repeating-linear-gradient(180deg, rgb(0 0 0 / 0.22) 0 1.5px, transparent 1.5px 4px), radial-gradient(120% 90% at 50% 40%, transparent 50%, rgb(0 0 0 / 0.5))",
              }}
            />
          </div>
        </div>
      </div>

      {favourites.map((group) => (
        <section key={group.name} className="mt-14" aria-labelledby={`fav-${group.kind}`}>
          <h2 id={`fav-${group.kind}`} className="mb-6 text-xl font-semibold tracking-tight">
            {group.name}
          </h2>
          <ul className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-4">
            {group.items.map((item) => (
              <li key={item.title}>
                <Cartridge
                  item={item}
                  inserted={sel?.item.title === item.title && !readError}
                  onInsert={() => insert(group.kind, item)}
                />
                <p className="mt-3 text-xs leading-snug text-dim">{item.by}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
