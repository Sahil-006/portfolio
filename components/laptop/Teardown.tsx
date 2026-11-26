"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { site } from "@/data/site";
import { projects } from "@/data/projects";
import LinkButton from "@/components/LinkButton";
import CopyEmail from "@/components/CopyEmail";
import ProjectPanel from "@/components/ProjectPanel";
import { btechYears, chapters, groupColors } from "./chapters";

const Laptop = dynamic(() => import("./Laptop"), { ssr: false });

// Scroll height per chapter, as a share of the viewport height. Shorter on phones,
// so one swipe moves one layer.
const CHAPTER_VH = 95;
const CHAPTER_VH_PHONE = 70;

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

export default function Teardown() {
  const section = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const [chapter, setChapter] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [keyGroup, setKeyGroup] = useState<number | null>(null);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const compact = !useMedia("(min-width: 1024px)");
  const reducedMotion = useMedia("(prefers-reduced-motion: reduce)");
  const touch = useMedia("(pointer: coarse)");
  const chapterVh = touch ? CHAPTER_VH_PHONE : CHAPTER_VH;
  const labels = useRef<Record<string, HTMLElement | null>>({});
  const reboot = useRef(0);
  const gliding = useRef<number | null>(null); // animation frame id while we're scrolling for the visitor
  const [fading, setFading] = useState(false);
  const n = chapters.length;

  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    // On touch screens, snap one layer per swipe while inside the story, then
    // release the snapping at the last chapter so the rest of the page scrolls freely.
    if (touch && webgl && gliding.current === null) {
      document.documentElement.style.scrollSnapType = v < (n - 0.6) / n ? "y mandatory" : "";
    }
    const cf = Math.min(n - 0.001, Math.max(0, v * n));
    progress.current = cf;
    const ch = Math.floor(cf);
    setChapter((c) => (c === ch ? c : ch));
  });

  useEffect(() => setWebgl(hasWebGL()), []);
  useEffect(() => () => void (document.documentElement.style.scrollSnapType = ""), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  // Leaving the projects chapter closes an open project card.
  useEffect(() => {
    if (chapters[chapter]?.id !== "projects") setSelected(null);
  }, [chapter]);

  const sectionTop = () => {
    const el = section.current;
    return el ? el.getBoundingClientRect().top + window.scrollY : 0;
  };

  const stopGlide = () => {
    if (gliding.current !== null) cancelAnimationFrame(gliding.current);
    gliding.current = null;
  };

  // Scroll for the visitor with our own timed easing, instead of the browser's quick jump,
  // so the laptop has time to move through each layer. Any wheel or touch takes over.
  const glideTo = (top: number) => {
    stopGlide();
    const html = document.documentElement;
    if (reducedMotion) {
      window.scrollTo({ top, behavior: "instant" as ScrollBehavior });
      return;
    }
    html.style.scrollSnapType = "";
    const start = window.scrollY;
    const dist = top - start;
    const duration = Math.min(2200, 700 + (Math.abs(dist) / window.innerHeight) * 260);
    const t0 = performance.now();
    const cancel = () => stopGlide();
    window.addEventListener("wheel", cancel, { once: true, passive: true });
    window.addEventListener("touchstart", cancel, { once: true, passive: true });
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      window.scrollTo({ top: start + dist * eased, behavior: "instant" as ScrollBehavior });
      if (p < 1 && gliding.current !== null) gliding.current = requestAnimationFrame(step);
      else {
        gliding.current = null;
        window.removeEventListener("wheel", cancel);
        window.removeEventListener("touchstart", cancel);
      }
    };
    gliding.current = requestAnimationFrame(step);
  };

  const goTo = (i: number) => {
    const el = section.current;
    if (!el) return;
    const chapterPx = (el.offsetHeight - window.innerHeight) / n;
    glideTo(sectionTop() + (i === 0 ? 0 : chapterPx * (i + 0.5)));
  };

  // "Take it apart again": fade the laptop out, jump back to the start, and fade it in
  // assembled with the lid opening again, like a reboot. Cheap to render, smooth everywhere.
  const restart = () => {
    stopGlide();
    setFading(true);
    window.setTimeout(
      () => {
        document.documentElement.style.scrollSnapType = "";
        window.scrollTo({ top: sectionTop(), behavior: "instant" as ScrollBehavior });
        progress.current = 0;
        reboot.current += 1;
        setChapter(0);
        setSelected(null);
        requestAnimationFrame(() => setFading(false));
      },
      reducedMotion ? 0 : 280,
    );
  };
  useEffect(() => () => stopGlide(), []);

  // Without WebGL, show the chapters as a plain page.
  if (webgl === false) {
    return (
      <div className="space-y-16 pt-16">
        {chapters.map((c, i) => (
          <ChapterPanel key={c.id} index={i} onProject={() => {}} keyGroup={null} onRestart={() => {}} />
        ))}
      </div>
    );
  }

  const project = projects.find((p) => p.slug === selected) ?? null;

  return (
    <section
      ref={section}
      aria-label="Sahil's laptop, taken apart one layer at a time"
      className="relative ml-[calc(50%-50vw)] w-screen"
      style={{ height: `${n * chapterVh + 5}vh` }}
    >
      {/* Snap points: one per chapter, at the middle of its scroll range (used on touch screens). */}
      {touch &&
        chapters.map((c, i) => (
          <div
            key={c.id}
            aria-hidden
            className="pointer-events-none absolute left-0 h-px w-px snap-start snap-always"
            style={{ top: i === 0 ? 0 : `calc((${n * chapterVh + 5}vh - 100vh) / ${n} * ${i + 0.5})` }}
          />
        ))}
      <div className="sticky top-0 h-[100dvh] overflow-hidden">
        {/* Backlight */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: `radial-gradient(36% 50% at ${compact ? "50% 22%" : "68% 50%"}, rgb(138 180 255 / 0.09), transparent 70%)`,
          }}
        />

        {/* 3D laptop: right side on desktop, top part on phones */}
        <div
          className="absolute inset-x-0 top-0 h-[42%] transition-opacity duration-300 lg:inset-0 lg:h-full"
          style={{ opacity: fading ? 0 : 1 }}
        >
          {webgl && (
            <>
              <Laptop
                progress={progress}
                compact={compact}
                reducedMotion={reducedMotion}
                selected={selected}
                onSelect={setSelected}
                onKey={setKeyGroup}
                labels={labels}
                reboot={reboot}
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
                {/* Tags on the laptop itself, naming the layer in focus */}
                {chapters
                  .filter((c) => c.layer)
                  .map((c) => (
                    <span
                      key={c.id}
                      ref={(el) => {
                        labels.current[`tag:${c.layer}`] = el;
                      }}
                      className="absolute left-0 top-0 flex items-center gap-2 whitespace-nowrap rounded-full border border-signal/40 bg-ground/85 px-3 py-1 text-xs text-ink opacity-0 backdrop-blur-sm transition-opacity duration-300"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-signal" aria-hidden />
                      {c.part}: {c.title}
                    </span>
                  ))}
              </div>
              {/* Soft fade where the 3D area meets the text on phones */}
              <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-ground to-transparent lg:hidden" />
            </>
          )}
        </div>

        {/* Progress rail (desktop) */}
        <nav aria-label="Laptop layers" className="absolute right-6 top-1/2 hidden -translate-y-1/2 lg:block">
          <ol className="space-y-2.5 text-right text-xs">
            {chapters.map((c, i) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  className={`inline-flex items-center gap-2 transition-colors ${i === chapter ? "text-ink" : "text-dim/60 hover:text-dim"}`}
                  aria-current={i === chapter ? "step" : undefined}
                >
                  {c.part ?? (i === 0 ? "Start" : "Done")}
                  <span
                    className={`h-1.5 rounded-full transition-all ${i === chapter ? "w-5 bg-signal" : "w-1.5 bg-dim/40"}`}
                    aria-hidden
                  />
                </button>
              </li>
            ))}
          </ol>
        </nav>

        {/* Chapter text: left on desktop, bottom on phones */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[42%] lg:inset-0 lg:top-0">
          <div className="mx-auto flex h-full w-full max-w-6xl items-start px-5 pb-24 pt-1 sm:px-8 lg:items-center lg:pb-0 lg:pt-0">
            <div className="pointer-events-auto w-full lg:max-w-[440px]">
              {/* Panels crossfade in place (both sit in the same grid cell), so there's no wait between them. */}
              <div className="grid">
              <AnimatePresence initial={false}>
                <motion.div
                  key={chapter}
                  className="[grid-area:1/1]"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: reducedMotion ? 0 : 0.18 }}
                >
                  <ChapterPanel
                    index={chapter}
                    onProject={setSelected}
                    keyGroup={keyGroup}
                    onRestart={restart}
                  />
                </motion.div>
              </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Project card */}
        <AnimatePresence>
          {project && (
            <motion.aside
              key={project.slug}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.22 }}
              className="glass absolute inset-x-4 bottom-24 z-20 rounded-2xl !bg-[#141a24]/95 p-5 lg:inset-x-auto lg:bottom-24 lg:right-24 lg:w-[340px]"
              aria-live="polite"
            >
              <ProjectPanel project={project} onClose={() => setSelected(null)} />
            </motion.aside>
          )}
        </AnimatePresence>

        {chapter === 0 && webgl && (
          <p className="pointer-events-none absolute bottom-10 left-1/2 hidden -translate-x-1/2 text-xs text-dim lg:block">
            Scroll to take it apart
          </p>
        )}
      </div>
    </section>
  );
}

/** The text for one chapter. Content comes from data/site.ts and data/projects.ts. */
function ChapterPanel({
  index,
  onProject,
  keyGroup,
  onRestart,
}: {
  index: number;
  onProject: (slug: string) => void;
  keyGroup: number | null;
  onRestart: () => void;
}) {
  const c = chapters[index];
  const layerNo = chapters.slice(0, index).filter((x) => x.layer).length + 1;
  const layerCount = chapters.filter((x) => x.layer).length;

  const heading = (
    <>
      {c.part && (
        <p className="text-sm text-dim">
          Layer {layerNo} of {layerCount}: {c.part}
        </p>
      )}
      <h2 className="mt-0.5 text-[clamp(1.5rem,4vw,2.4rem)] font-semibold leading-tight tracking-tight text-ink">{c.title}</h2>
    </>
  );

  switch (c.id) {
    case "intro": {
      const socials = [
        { label: "GitHub", href: site.links.github },
        { label: "LinkedIn", href: site.links.linkedin },
        { label: "X", href: site.links.x },
      ].filter((s) => s.href);
      return (
        <div>
          <div className="flex items-center gap-3">
            {site.photo ? (
              <Image src={site.photo} alt={site.name} width={40} height={40} className="h-10 w-10 rounded-full border border-rule object-cover" priority />
            ) : null}
            {site.status && (
              <p className="glass flex items-center gap-2 rounded-full px-3 py-1 text-sm text-dim">
                <span className="h-2 w-2 rounded-full bg-amber" aria-hidden />
                {site.status}
              </p>
            )}
          </div>
          <h1
            className="mt-4 text-[clamp(2.6rem,9vw,5.25rem)] font-bold leading-[0.92] tracking-[-0.035em] text-ink"
            style={{ fontVariationSettings: '"wdth" 78' }}
          >
            {site.name}
          </h1>
          <p className="mt-3 text-lg text-ink">{site.title}</p>
          <p className="mt-1 max-w-[36ch] leading-relaxed text-dim sm:text-lg">{site.tagline}</p>
          <div className="mt-5 flex flex-wrap gap-2">
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
      );
    }

    case "about": {
      const ed = site.education[0];
      return (
        <div>
          {heading}
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-dim sm:text-base">
            {site.about.map((p, i) => (
              <p key={p} className={i > 0 ? "hidden sm:block" : undefined}>
                {p}
              </p>
            ))}
          </div>
          <p className="mt-4 text-sm text-dim">
            {site.location}
            {ed ? `. ${ed.detail.split(",")[0]}, ${ed.period}.` : ""}
          </p>
        </div>
      );
    }

    case "skills":
      return (
        <div>
          {heading}
          <p className="mt-2 text-sm text-dim">Every key is one of my skills, coloured by group. Press one.</p>
          <dl className="mt-3 space-y-2 lg:mt-4 lg:space-y-3">
            {site.stack.map((g, gi) => {
              const color = groupColors[gi % groupColors.length];
              const active = keyGroup === gi;
              return (
                <div key={g.group} className={`transition-opacity ${keyGroup === null || active ? "opacity-100" : "opacity-45"}`}>
                  <dt className="flex items-center gap-2 text-xs" style={{ color }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} aria-hidden />
                    {g.group}
                  </dt>
                  <dd className="mt-0.5 text-[13px] leading-snug text-ink/85 lg:mt-1 lg:text-sm lg:leading-relaxed">{g.items.join(", ")}</dd>
                </div>
              );
            })}
          </dl>
        </div>
      );

    case "projects":
      return (
        <div>
          {heading}
          <p className="mt-2 hidden text-sm text-dim sm:block">Each chip on the board is a project. Click one, or pick from the list.</p>
          <ul className="mt-2 space-y-0.5 lg:mt-4 lg:space-y-1.5">
            {projects.slice(0, 5).map((p) => (
              <li key={p.slug}>
                <button
                  type="button"
                  onClick={() => onProject(p.slug)}
                  className="group flex w-full items-baseline justify-between gap-4 rounded-lg px-2 py-1 text-left text-[15px] transition-colors hover:bg-white/[0.04] lg:py-1.5 lg:text-base"
                >
                  <span className="flex items-center gap-2 text-ink">
                    <span className="h-2 w-2 rounded-full" style={{ background: p.hue }} aria-hidden />
                    {p.name}
                  </span>
                  <span className="text-sm text-dim">{p.metric}</span>
                </button>
              </li>
            ))}
          </ul>
          <Link href="/projects" className="mt-3 inline-block text-sm text-ink underline decoration-rule underline-offset-4 hover:decoration-signal">
            See all projects in detail
          </Link>
        </div>
      );

    case "education": {
      const ed = site.education[0];
      const years = btechYears();
      return (
        <div>
          {heading}
          {ed && (
            <>
              <p className="mt-3 text-ink">{ed.detail}</p>
              <p className="text-sm text-dim">{ed.school}</p>
            </>
          )}
          <ol className="mt-5 grid grid-cols-4 gap-2">
            {years.map((y) => (
              <li
                key={y.n}
                className={`rounded-lg border px-2 py-2 text-center text-xs ${
                  y.current ? "border-signal/50 bg-signal/10 text-signal" : y.done ? "border-white/10 text-ink" : "border-white/[0.06] text-dim"
                }`}
              >
                <span className="block font-semibold">Year {y.n}</span>
                <span className="block opacity-80">{y.current ? "now" : y.range}</span>
              </li>
            ))}
          </ol>
        </div>
      );
    }

    case "experience":
      return (
        <div>
          {heading}
          {site.experience.map((e) => (
            <div key={e.role} className="mt-4">
              <p className="text-ink">{e.role}</p>
              <p className="text-sm text-dim">
                {e.org}, {e.period}
              </p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-dim marker:text-rule">
                {e.points.map((pt) => (
                  <li key={pt}>{pt}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );

    default:
      return (
        <div>
          {heading}
          <p className="mt-3 leading-relaxed text-dim">
            Every part is back where it belongs. Well, almost: one screw is left over. It still boots.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <CopyEmail primary />
            <button
              type="button"
              onClick={onRestart}
              className="inline-flex items-center rounded-md border border-rule px-3 py-1.5 text-sm text-ink hover:border-dim"
            >
              Take it apart again
            </button>
          </div>
        </div>
      );
  }
}
