import Image from "next/image";
import type { Project } from "@/data/projects";

// The cover shows a screenshot if you add one, otherwise the project's headline number.
export default function ProjectCover({ project, compact = false }: { project: Project; compact?: boolean }) {
  if (project.image) {
    return (
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-rule bg-panel">
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
      className={`flex flex-col justify-end rounded-xl border border-rule bg-panel ${
        compact ? "p-4" : "aspect-[16/10] p-5"
      }`}
    >
      <p
        className={`font-display font-semibold leading-none tracking-tight text-signal ${
          compact ? "text-2xl" : "text-[clamp(1.6rem,4.5vw,2.4rem)]"
        }`}
        style={{ fontVariationSettings: '"wdth" 85' }}
      >
        {project.metric}
      </p>
      <p className={`mt-2 text-dim ${compact ? "text-xs" : "text-sm"} leading-snug`}>{project.metricLabel}</p>
    </div>
  );
}
