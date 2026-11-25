import type { Metadata } from "next";
import { projects } from "@/data/projects";
import ProjectCover from "@/components/ProjectCover";
import LinkButton from "@/components/LinkButton";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <div className="pt-12 sm:pt-16">
      <h1
        className="text-[clamp(2.5rem,8vw,4rem)] font-bold leading-none tracking-[-0.03em]"
        style={{ fontVariationSettings: '"wdth" 80' }}
      >
        Projects
      </h1>
      <p className="mt-4 max-w-[55ch] text-lg leading-relaxed text-dim">
        Models I’ve trained and checked properly, and the systems I built to put them to use.
      </p>

      <div className="mt-12 divide-y divide-rule">
        {projects.map((p) => {
          const links = [
            { label: "Live demo", href: p.links.live },
            { label: "Demo video", href: p.links.demo },
            { label: "GitHub", href: p.links.github },
          ].filter((l): l is { label: string; href: string } => Boolean(l.href));

          return (
            <article
              key={p.slug}
              id={p.slug}
              className="grid scroll-mt-24 gap-6 py-10 first:pt-0 md:grid-cols-[260px_1fr] md:gap-8"
            >
              <div className="md:sticky md:top-24 md:self-start">
                <ProjectCover project={p} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-ink">{p.name}</h2>
                <p className="mt-2 leading-relaxed text-ink/90">{p.summary}</p>
                <ul className="mt-4 list-disc space-y-1.5 pl-5 leading-relaxed text-dim marker:text-rule">
                  {p.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
                <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Built with">
                  {p.tags.map((t) => (
                    <li key={t} className="rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 text-xs text-dim">
                      {t}
                    </li>
                  ))}
                </ul>
                {links.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {links.map((l, i) => (
                      <LinkButton key={l.label} href={l.href} primary={i === 0}>
                        {l.label}
                      </LinkButton>
                    ))}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
