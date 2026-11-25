"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { site } from "@/data/site";
import { projects } from "@/data/projects";
import LinkButton from "@/components/LinkButton";
import ProjectPanel from "@/components/ProjectPanel";
import CopyEmail from "@/components/CopyEmail";

const Device = dynamic(() => import("./Device"), { ssr: false });

function useMedia(query: string) {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(query);
    setMatch(m.matches);
    const on = () => setMatch(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, [query]);
  return match;
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

// Last 7 days of GitHub activity for the LED strip. Falls back to a gentle pattern if the API is down.
function useActivity(username: string) {
  const [levels, setLevels] = useState<number[]>([1, 2, 1, 3, 2, 4, 2]);
  useEffect(() => {
    fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j: { contributions: { level: number }[] }) => setLevels(j.contributions.slice(-7).map((d) => d.level)))
      .catch(() => {});
  }, [username]);
  return levels;
}

export default function Hero() {
  const [selected, setSelected] = useState<string | null>(null);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [bubble, setBubble] = useState<"oops" | "fixed" | null>(null);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const compact = !useMedia("(min-width: 768px)");
  const reducedMotion = useMedia("(prefers-reduced-motion: reduce)");
  const activity = useActivity(site.githubUsername);
  const project = projects.find((p) => p.slug === selected) ?? null;
  const labels = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => setWebgl(hasWebGL()), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onPoke = (phase: "oops" | "fixed") => {
    setBubble(phase);
    clearTimeout(bubbleTimer.current);
    if (phase === "fixed") bubbleTimer.current = setTimeout(() => setBubble(null), 1400);
  };

  const socials = [
    { label: "GitHub", href: site.links.github },
    { label: "LinkedIn", href: site.links.linkedin },
    { label: "X", href: site.links.x },
  ].filter((s) => s.href);

  return (
    <section className="relative ml-[calc(50%-50vw)] w-screen" aria-label="Introduction">
      <div className="relative h-[50vh] min-h-[380px] md:absolute md:inset-0 md:h-auto">
        {/* Soft backlight behind the device, visible while it loads and without WebGL. */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(34% 46% at var(--dx) 48%, rgb(138 180 255 / 0.10), transparent 70%), radial-gradient(22% 30% at var(--dx) 70%, rgb(111 214 194 / 0.07), transparent 70%)",
            ["--dx" as string]: compact ? "50%" : "66%",
          }}
        />
        {webgl && (
          <div
            className="absolute inset-0"
            role="img"
            aria-label="A see-through handheld device. Each chip on its circuit board is one of Sahil's projects."
          >
            <Device
              selected={selected}
              onSelect={setSelected}
              reducedMotion={reducedMotion}
              compact={compact}
              activity={activity}
              labels={labels}
              onPoke={onPoke}
            />
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
              {projects.slice(0, 5).map((p) => (
                <span
                  key={p.slug}
                  ref={(el) => {
                    labels.current[p.slug] = el;
                  }}
                  className="absolute left-0 top-0 whitespace-nowrap rounded-full bg-ground/85 px-2.5 py-1 text-xs font-medium opacity-0 transition-opacity duration-200"
                  style={{ color: p.hue, border: `1px solid ${p.hue}55` }}
                >
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        )}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ground to-transparent" />

        {webgl && (
          <p className="pointer-events-none absolute right-5 top-5 max-w-[22ch] text-right text-xs leading-relaxed text-dim sm:right-8 md:max-w-none">
            {compact
              ? "Drag to turn. Tap a chip, or poke the case."
              : "Drag to turn it. Click a chip to open a project. Poke the case and see what happens."}
          </p>
        )}

        {/* "oops" / "fixed" bubble */}
        <AnimatePresence>
          {bubble && (
            <motion.p
              key={bubble}
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="pointer-events-none absolute left-1/2 top-[14%] z-10 -translate-x-1/2 rounded-full px-4 py-1.5 font-display text-lg font-semibold md:left-[66%]"
              style={{
                background: bubble === "oops" ? "#ffe98f" : "rgb(111 214 194 / 0.15)",
                color: bubble === "oops" ? "#2b2a33" : "var(--color-signal)",
                border: bubble === "oops" ? "none" : "1px solid rgb(111 214 194 / 0.4)",
              }}
              role="status"
            >
              {bubble === "oops" ? "oops." : "fixed."}
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {project && !compact && (
            <motion.aside
              key={project.slug}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25 }}
              className="glass absolute bottom-20 right-8 z-10 w-[340px] rounded-2xl !bg-[#141a24]/90 p-5"
              aria-live="polite"
            >
              <ProjectPanel project={project} onClose={() => setSelected(null)} />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {project && compact && (
          <motion.aside
            key={project.slug}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="glass relative z-10 mx-5 -mt-8 rounded-2xl !bg-[#141a24]/90 p-5"
            aria-live="polite"
          >
            <ProjectPanel project={project} onClose={() => setSelected(null)} />
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="pointer-events-none relative md:flex md:h-[min(92vh,860px)] md:items-center">
        <div className="mx-auto w-full max-w-6xl px-5 pb-4 pt-2 sm:px-8 md:pt-0">
          <div className="max-w-md">
            <div className="flex items-center gap-3">
              {site.photo ? (
                <Image
                  src={site.photo}
                  alt={site.name}
                  width={44}
                  height={44}
                  className="h-11 w-11 rounded-full border border-rule object-cover"
                  priority
                />
              ) : null}
              {site.status && (
                <p className="glass flex items-center gap-2 rounded-full px-3 py-1 text-sm text-dim">
                  <span className="h-2 w-2 rounded-full bg-amber" aria-hidden />
                  {site.status}
                </p>
              )}
            </div>
            <h1
              className="mt-5 text-[clamp(3rem,10vw,5.75rem)] font-bold leading-[0.9] tracking-[-0.035em] text-ink"
              style={{ fontVariationSettings: '"wdth" 78' }}
            >
              {site.name}
            </h1>
            <p className="mt-4 text-lg text-ink sm:text-xl">{site.title}</p>
            <p className="mt-1.5 max-w-[36ch] text-lg leading-relaxed text-dim">{site.tagline}</p>
            <div className="pointer-events-auto mt-7 flex flex-wrap gap-2">
              <CopyEmail primary />
              {site.resumes.map((r) => (
                <LinkButton key={r.href} href={r.href}>
                  {r.label}
                </LinkButton>
              ))}
              {socials.map((s) => (
                <LinkButton key={s.label} href={s.href}>
                  {s.label}
                </LinkButton>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
