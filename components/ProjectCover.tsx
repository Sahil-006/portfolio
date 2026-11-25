import Image from "next/image";
import type { Project } from "@/data/projects";

// A small glass orb in the project's colour — the same object as in the 3D hero.
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

// The cover shows a screenshot if you add one, otherwise the project's headline number.
export default function ProjectCover({ project, compact = false }: { project: Project; compact?: boolean }) {
  if (project.image) {
    return (
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-panel">
        <Image
          src={project.image}
          alt={`Screenshot of ${project.name}`}
          fill
          sizes="(min-width: 768px) 320px, 100vw"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`glass relative flex flex-col justify-end overflow-hidden rounded-2xl ${
        compact ? "min-h-[118px] p-4" : "min-h-[170px] p-5 pt-16"
      }`}
      style={{
        backgroundImage: `radial-gradient(120% 90% at 100% 0%, ${project.hue}26, transparent 60%), linear-gradient(145deg, rgb(255 255 255 / 0.06), rgb(255 255 255 / 0.01) 60%)`,
      }}
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
