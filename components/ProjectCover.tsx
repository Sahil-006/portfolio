import Image from "next/image";
import type { Project, ProjectChart } from "@/data/projects";

// A small glass orb in the project's colour, echoing the device hero.
function Orb({ hue, size }: { hue: string; size: number }) {
  return (
    <span
      aria-hidden
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        top: size * -0.18,
        right: size * -0.12,
        background: `radial-gradient(circle at 32% 28%, rgb(255 255 255 / 0.75), rgb(255 255 255 / 0.08) 18%, transparent 30%),
          radial-gradient(circle at 50% 55%, ${hue} 0 14%, ${hue}55 26%, ${hue}14 52%, transparent 70%),
          radial-gradient(circle at 70% 80%, rgb(255 255 255 / 0.12), transparent 40%)`,
        boxShadow: `inset 0 0 ${size * 0.18}px rgb(255 255 255 / 0.12), 0 0 ${size * 0.5}px ${hue}30`,
        border: "1px solid rgb(255 255 255 / 0.12)",
      }}
    />
  );
}

// One dot per case; filled dots are the hits, hollow ones the misses.
function Dots({ chart, hue }: { chart: Extract<ProjectChart, { type: "dots" }>; hue: string }) {
  const cols = chart.total > 60 ? 12 : 10;
  const rows = Math.ceil(chart.total / cols);
  const gap = 15;
  const r = 4.6;
  return (
    <svg
      viewBox={`0 0 ${cols * gap} ${rows * gap}`}
      className="w-full max-w-[210px]"
      role="img"
      aria-label={chart.caption}
    >
      {Array.from({ length: chart.total }).map((_, i) => {
        const hit = i < chart.hit;
        return (
          <circle
            key={i}
            cx={(i % cols) * gap + gap / 2}
            cy={Math.floor(i / cols) * gap + gap / 2}
            r={r}
            fill={hit ? hue : "none"}
            stroke={hit ? "none" : "var(--color-ink)"}
            strokeWidth={1.4}
            opacity={hit ? 0.9 : 0.85}
          />
        );
      })}
    </svg>
  );
}

// Horizontal bars on a 0–100 scale. Tiny values still get a visible sliver.
function Bars({ chart, hue }: { chart: Extract<ProjectChart, { type: "bars" }>; hue: string }) {
  return (
    <div className="w-full space-y-3" role="img" aria-label={`${chart.caption}: ${chart.bars.map((b) => `${b.label} ${b.display}`).join(", ")}`}>
      {chart.bars.map((b) => (
        <div key={b.label}>
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="text-dim">{b.label}</span>
            <span className="font-display text-sm font-semibold" style={{ color: hue }}>
              {b.display}
            </span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-white/[0.06]">
            <div className="h-2 rounded-full" style={{ width: `max(${b.value}%, 3px)`, background: hue }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// The cover shows a screenshot if there is one, then a chart, then the headline number.
export default function ProjectCover({ project, compact = false }: { project: Project; compact?: boolean }) {
  if (project.image) {
    return (
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-panel">
        <Image
          src={project.image}
          alt={`Screenshot of ${project.name}`}
          fill
          sizes="(min-width: 768px) 320px, 100vw"
          className="object-cover object-top"
        />
      </div>
    );
  }

  const glow = {
    backgroundImage: `radial-gradient(120% 90% at 100% 0%, ${project.hue}26, transparent 60%), linear-gradient(145deg, rgb(255 255 255 / 0.06), rgb(255 255 255 / 0.01) 60%)`,
  };

  // Charts are too small to read in the compact home-page cards, so those keep the number.
  if (project.chart && !compact) {
    return (
      <div className="glass relative flex min-h-[170px] flex-col justify-between gap-4 overflow-hidden rounded-2xl p-5" style={glow}>
        {/* Bar charts already show their numbers, so only dot charts get the headline figure. */}
        {project.chart.type === "dots" && (
          <p
            className="relative font-display text-[clamp(1.4rem,3.2vw,1.9rem)] font-semibold leading-none tracking-tight"
            style={{ fontVariationSettings: '"wdth" 82', color: project.hue }}
          >
            {project.metric}
          </p>
        )}
        <div className="relative">
          {project.chart.type === "dots" ? (
            <Dots chart={project.chart} hue={project.hue} />
          ) : (
            <Bars chart={project.chart} hue={project.hue} />
          )}
        </div>
        <p className="relative text-sm leading-snug text-dim">{project.chart.caption}</p>
      </div>
    );
  }

  return (
    <div
      className={`glass relative flex flex-col justify-end overflow-hidden rounded-2xl ${
        compact ? "aspect-[16/10] p-4" : "min-h-[170px] p-5 pt-16"
      }`}
      style={glow}
    >
      <Orb hue={project.hue} size={compact ? 64 : 88} />
      <p
        className={`relative font-display font-semibold leading-none tracking-tight ${
          compact ? "text-2xl" : "text-[clamp(1.5rem,3.6vw,2.1rem)]"
        }`}
        style={{ fontVariationSettings: '"wdth" 82', color: project.hue }}
      >
        {project.metric}
      </p>
      <p className={`relative mt-2 text-dim ${compact ? "text-xs" : "text-sm"} leading-snug`}>{project.metricLabel}</p>
    </div>
  );
}
