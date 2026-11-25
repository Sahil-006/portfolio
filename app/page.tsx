import Link from "next/link";
import { site } from "@/data/site";
import { projects } from "@/data/projects";
import Hero from "@/components/device/Hero";
import Section from "@/components/Section";
import ProjectCover from "@/components/ProjectCover";
import GithubGraph from "@/components/GithubGraph";
import CopyEmail from "@/components/CopyEmail";
import LinkButton from "@/components/LinkButton";

export default function Home() {
  const hueFor = (name: string) => projects.find((p) => p.name === name)?.hue ?? "#6fd6c2";
  const education = site.education[0];

  return (
    <>
      <Hero />

      <Section title="About" id="about">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-10">
          <div className="max-w-[62ch] space-y-4 leading-relaxed text-dim">
            {site.about.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <dl className="glass h-fit space-y-4 rounded-2xl p-5 text-sm">
            <div>
              <dt className="text-dim">Based in</dt>
              <dd className="mt-0.5 text-ink">{site.location}</dd>
            </div>
            {education && (
              <div>
                <dt className="text-dim">Studying</dt>
                <dd className="mt-0.5 text-ink">
                  {education.detail.split(",")[0]}, until {education.period.split("–").pop()?.trim()}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-dim">Focus</dt>
              <dd className="mt-0.5 text-ink">Trustworthy ML and the backends that serve it</dd>
            </div>
            {site.status && (
              <div>
                <dt className="text-dim">Status</dt>
                <dd className="mt-0.5 flex items-center gap-2 text-ink">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-amber" aria-hidden />
                  {site.status}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </Section>

      {site.onRepeat.title && (
        <Section title="On repeat" id="on-repeat">
          <a
            href={site.onRepeat.url || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="glass flex max-w-sm items-center gap-4 rounded-xl p-3 transition-colors hover:border-dim"
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

      <Section title="Things I broke (and fixed)" id="broke" note="Real bugs from my own projects, and what I did about them.">
        <ol className="space-y-4">
          {site.brokeAndFixed.map((item) => {
            const hue = hueFor(item.project);
            return (
              <li key={item.broke} className="glass rounded-2xl p-5 sm:p-6">
                <p
                  className="inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-xs"
                  style={{ color: hue, borderColor: `${hue}55` }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: hue }} aria-hidden />
                  {item.project}
                </p>
                <div className="mt-4 grid gap-5 md:grid-cols-2 md:gap-8">
                  <div>
                    <p className="flex items-center gap-2 text-xs text-dim">
                      <span className="h-2 w-2 rounded-full bg-amber" aria-hidden />
                      What broke
                    </p>
                    <p className="mt-2 leading-relaxed text-ink">{item.broke}</p>
                  </div>
                  <div className="md:border-l md:border-white/[0.07] md:pl-8">
                    <p className="flex items-center gap-2 text-xs text-dim">
                      <span className="h-2 w-2 rounded-full bg-signal" aria-hidden />
                      The fix
                    </p>
                    <p className="mt-2 leading-relaxed text-ink/80">{item.fixed}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </Section>

      <Section title="Selected work" id="work" note={`${Math.min(3, projects.length)} of ${projects.length} projects. The rest are on the projects page.`}>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.slice(0, 3).map((p) => (
            <li key={p.slug}>
              <Link
                href={`/projects#${p.slug}`}
                className="group flex h-full flex-col gap-4 rounded-2xl border border-transparent p-2 transition-colors hover:border-rule"
              >
                <ProjectCover project={p} compact />
                <div className="px-1 pb-1">
                  <h3 className="text-lg font-semibold text-ink group-hover:text-signal">{p.name}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-dim">{p.summary}</p>
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

      <Section title="Stack" id="stack" note="What I reach for, grouped by where it sits in the pipeline.">
        <dl className="grid gap-4 sm:grid-cols-2">
          {site.stack.map((g) => (
            <div key={g.group} className="glass rounded-2xl p-5">
              <dt className="mb-3 text-sm text-dim">{g.group}</dt>
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

      <Section title="Experience and education" id="experience">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {site.experience.map((e) => (
            <article key={e.role + e.org} className="glass rounded-2xl p-5 sm:p-6">
              <p className="text-xs text-dim">{e.period}</p>
              <h3 className="mt-2 text-lg font-semibold text-ink">{e.role}</h3>
              <p className="text-dim">{e.org}</p>
              <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-dim marker:text-rule">
                {e.points.map((pt) => (
                  <li key={pt}>{pt}</li>
                ))}
              </ul>
            </article>
          ))}
          {site.education.map((ed) => (
            <article key={ed.school} className="glass rounded-2xl p-5 sm:p-6">
              <p className="text-xs text-dim">{ed.period}</p>
              <h3 className="mt-2 text-lg font-semibold leading-snug text-ink">{ed.school}</h3>
              <p className="mt-1 text-dim">{ed.detail}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section title="GitHub activity" id="github" note="The last 12 months, pulled live from GitHub.">
        <div className="glass rounded-2xl p-5 sm:p-6">
          <GithubGraph username={site.githubUsername} />
        </div>
      </Section>

      <Section title="Say hi" id="contact">
        <div className="glass rounded-2xl p-6 sm:p-8">
          <p className="max-w-[46ch] font-display text-2xl font-semibold leading-snug tracking-tight text-ink sm:text-[1.7rem]">
            Hiring for an AI/ML or backend role, or want to talk about one of these projects?
          </p>
          <p className="mt-3 text-dim">
            Email me at{" "}
            <a href={`mailto:${site.links.email}`} className="text-ink underline decoration-rule underline-offset-4 hover:decoration-signal">
              {site.links.email}
            </a>
            .
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <CopyEmail primary label="Copy email" />
            <LinkButton href={`mailto:${site.links.email}`}>Open in mail app</LinkButton>
          </div>
        </div>
      </Section>
    </>
  );
}
