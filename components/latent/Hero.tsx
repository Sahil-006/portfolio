"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { site } from "@/data/site";
import { projects } from "@/data/projects";
import LinkButton from "@/components/LinkButton";
import { buildSpace } from "./layout";

const LatentSpace = dynamic(() => import("./LatentSpace"), { ssr: false });

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

export default function Hero() {
  const [selected, setSelected] = useState<string | null>(null);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const compact = !useMedia("(min-width: 768px)");
  const reducedMotion = useMedia("(prefers-reduced-motion: reduce)");
  const project = projects.find((p) => p.slug === selected) ?? null;
  const { projectNodes, skillNodes } = useMemo(buildSpace, []);
  const labels = useRef<Record<string, HTMLElement | null>>({});
  const setLabel = (id: string) => (el: HTMLElement | null) => {
    labels.current[id] = el;
  };

  useEffect(() => setWebgl(hasWebGL()), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const socials = [
    { label: "GitHub", href: site.links.github },
    { label: "LinkedIn", href: site.links.linkedin },
    { label: "X", href: site.links.x },
    { label: "Email", href: site.links.email ? `mailto:${site.links.email}` : "" },
  ].filter((s) => s.href);

  return (
    <section className="relative ml-[calc(50%-50vw)] w-screen" aria-label="Introduction">
      {/* 3D space */}
      <div className="relative h-[46vh] min-h-[340px] md:absolute md:inset-0 md:h-auto">
        {/* Soft colour glows behind the canvas: visible while it loads and if WebGL is unavailable. */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: projects
              .slice(0, 5)
              .map(
                (p, i) =>
                  `radial-gradient(28% 34% at ${[62, 48, 78, 84, 68][i]}% ${[38, 66, 30, 66, 20][i]}%, ${p.hue}1f, transparent 70%)`,
              )
              .join(","),
          }}
        />
        {webgl && (
          <div
            className="absolute inset-0"
            role="img"
            aria-label="Interactive 3D map of Sahil's projects as glass orbs, with the skills each one uses clustered around it"
          >
            <LatentSpace
              selected={selected}
              onSelect={setSelected}
              reducedMotion={reducedMotion}
              compact={compact}
              labels={labels}
            />
            {/* Orb labels, positioned every frame by the 3D scene. */}
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
              {projectNodes.map((n) => (
                <span
                  key={n.id}
                  ref={setLabel(n.id)}
                  className="absolute left-0 top-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[13px] font-medium opacity-0 transition-opacity duration-300"
                  style={{ color: n.hue, background: "rgb(15 19 26 / 0.6)", border: `1px solid ${n.hue}40` }}
                >
                  {n.label}
                </span>
              ))}
              {skillNodes.map((n) => (
                <span
                  key={n.id}
                  ref={setLabel(n.id)}
                  className="absolute left-0 top-0 whitespace-nowrap rounded-md bg-ground/80 px-2 py-0.5 text-xs text-ink opacity-0 transition-opacity duration-200"
                >
                  {n.label}
                </span>
              ))}
            </div>
          </div>
        )}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-ground to-transparent" />

        {webgl && (
          <p className="pointer-events-none absolute right-5 top-4 text-xs text-dim sm:right-8 md:top-6">
            {compact ? "Drag to look around. Tap an orb." : "Drag to look around. Click an orb to open its project."}
          </p>
        )}

        {/* Project panel (desktop) */}
        <AnimatePresence>
          {project && !compact && (
            <motion.aside
              key={project.slug}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25 }}
              className="glass absolute bottom-16 right-8 z-10 w-[340px] rounded-2xl !bg-[#141a24]/90 p-5"
              aria-live="polite"
            >
              <ProjectPanel project={project} onClose={() => setSelected(null)} />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Project panel (mobile) */}
      <AnimatePresence>
        {project && compact && (
          <motion.aside
            key={project.slug}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="glass relative z-10 mx-5 -mt-10 rounded-2xl !bg-[#141a24]/90 p-5"
            aria-live="polite"
          >
            <ProjectPanel project={project} onClose={() => setSelected(null)} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Intro text: overlaid on desktop, below the canvas on mobile */}
      <div className="pointer-events-none relative md:flex md:h-[min(88vh,820px)] md:items-end">
        <div className="mx-auto w-full max-w-6xl px-5 pb-4 pt-8 sm:px-8 md:pb-20 md:pt-0">
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
            <p className="mt-1.5 max-w-[34ch] text-lg leading-relaxed text-dim">{site.tagline}</p>
            <div className="pointer-events-auto mt-7 flex flex-wrap gap-2">
              {site.resumes.map((r, i) => (
                <LinkButton key={r.href} href={r.href} primary={i === 0}>
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

function ProjectPanel({ project, onClose }: { project: (typeof projects)[number]; onClose: () => void }) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight" style={{ color: project.hue }}>
          {project.name}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close project"
          className="-mr-1 -mt-1 rounded-md p-1 text-dim hover:text-ink"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      <p
        className="mt-3 font-display text-3xl font-semibold leading-none tracking-tight text-ink"
        style={{ fontVariationSettings: '"wdth" 82' }}
      >
        {project.metric}
      </p>
      <p className="mt-1.5 text-sm leading-snug text-dim">{project.metricLabel}</p>
      <p className="mt-4 text-sm leading-relaxed text-ink/85">{project.summary}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href={`/projects#${project.slug}`}
          className="inline-flex items-center rounded-md border border-signal/40 bg-signal/10 px-3 py-1.5 text-sm text-signal hover:bg-signal/20"
        >
          Read the details
        </Link>
        {project.links.live && <LinkButton href={project.links.live}>Live demo</LinkButton>}
      </div>
    </>
  );
}
