import Link from "next/link";
import type { Project } from "@/data/projects";
import LinkButton from "./LinkButton";

export default function ProjectPanel({ project, onClose }: { project: Project; onClose: () => void }) {
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
