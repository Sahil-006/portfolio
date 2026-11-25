import Link from "next/link";
import { site } from "@/data/site";
import { projects } from "@/data/projects";
import Hero from "@/components/latent/Hero";
import Section from "@/components/Section";
import ProjectCover from "@/components/ProjectCover";
import GithubGraph from "@/components/GithubGraph";

export default function Home() {
  return (
    <>
      <Hero />

      <Section title="About" id="about">
        <div className="max-w-[65ch] space-y-4 leading-relaxed text-dim">
          {site.about.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <p className="mt-4 text-sm text-dim">Based in {site.location}.</p>
      </Section>

      {site.onRepeat.title && (
        <Section title="On repeat" id="on-repeat">
          <a
            href={site.onRepeat.url || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="flex max-w-sm items-center gap-4 rounded-xl border border-rule bg-panel p-3 transition-colors hover:border-dim"
          >
            {site.onRepeat.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={site.onRepeat.cover} alt="" className="h-14 w-14 rounded-md object-cover" />
            ) : (
              <div className="h-14 w-14 rounded-md bg-rule" aria-hidden />
            )}
            <div>
              <p className="font-medium text-ink">{site.onRepeat.title}</p>
              <p className="text-sm text-dim">{site.onRepeat.artist}</p>
            </div>
          </a>
        </Section>
      )}

      <Section title="Selected work" id="work">
        <ul className="-mx-2 space-y-2">
          {projects.slice(0, 3).map((p) => (
            <li key={p.slug}>
              <Link
                href={`/projects#${p.slug}`}
                className="group grid gap-4 rounded-xl border border-transparent p-2 transition-colors hover:border-rule sm:grid-cols-[200px_1fr] sm:items-center"
              >
                <ProjectCover project={p} compact />
                <div>
                  <h3 className="text-lg font-semibold text-ink group-hover:text-signal">{p.name}</h3>
                  <p className="mt-1 leading-relaxed text-dim">{p.summary}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/projects"
          className="mt-6 inline-block text-sm text-ink underline decoration-rule underline-offset-4 hover:decoration-signal"
        >
          See all {projects.length} projects
        </Link>
      </Section>

      <Section title="Stack" id="stack">
        <dl className="grid gap-6 sm:grid-cols-2">
          {site.stack.map((g) => (
            <div key={g.group}>
              <dt className="mb-2 text-sm text-dim">{g.group}</dt>
              <dd className="flex flex-wrap gap-1.5">
                {g.items.map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 text-sm text-ink">
                    {item}
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Experience" id="experience">
        {site.experience.map((e) => (
          <article key={e.role + e.org}>
            <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
              <h3 className="text-lg font-semibold text-ink">{e.role}</h3>
              <p className="text-sm text-dim">{e.period}</p>
            </div>
            <p className="text-dim">{e.org}</p>
            <ul className="mt-3 max-w-[65ch] list-disc space-y-1.5 pl-5 leading-relaxed text-dim marker:text-rule">
              {e.points.map((pt) => (
                <li key={pt}>{pt}</li>
              ))}
            </ul>
          </article>
        ))}
      </Section>

      <Section title="Education" id="education">
        {site.education.map((ed) => (
          <article key={ed.school}>
            <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
              <h3 className="text-lg font-semibold text-ink">{ed.school}</h3>
              <p className="shrink-0 text-sm text-dim">{ed.period}</p>
            </div>
            <p className="text-dim">{ed.detail}</p>
          </article>
        ))}
      </Section>

      <Section title="GitHub activity" id="github">
        <GithubGraph username={site.githubUsername} />
      </Section>
    </>
  );
}
