import Link from "next/link";
import Image from "next/image";
import { site } from "@/data/site";
import { projects } from "@/data/projects";
import EcgTrace from "@/components/EcgTrace";
import Section from "@/components/Section";
import LinkButton from "@/components/LinkButton";
import ProjectCover from "@/components/ProjectCover";
import GithubGraph from "@/components/GithubGraph";

export default function Home() {
  const socials = [
    { label: "GitHub", href: site.links.github },
    { label: "LinkedIn", href: site.links.linkedin },
    { label: "X", href: site.links.x },
    { label: "Email", href: site.links.email ? `mailto:${site.links.email}` : "" },
  ].filter((s) => s.href);

  return (
    <>
      {/* Hero */}
      <section className="pt-10 sm:pt-16">
        <EcgTrace />

        <div className="mt-8 flex items-center gap-4">
          {site.photo ? (
            <Image
              src={site.photo}
              alt={site.name}
              width={56}
              height={56}
              className="h-14 w-14 rounded-full border border-rule object-cover"
              priority
            />
          ) : (
            <div
              aria-hidden
              className="grid h-14 w-14 place-items-center rounded-full border border-rule bg-panel font-display text-lg font-semibold text-ink"
            >
              {site.initials}
            </div>
          )}
          {site.status && (
            <p className="flex items-center gap-2 text-sm text-dim">
              <span className="h-2 w-2 rounded-full bg-amber" aria-hidden />
              {site.status}
            </p>
          )}
        </div>

        <h1
          className="mt-6 text-[clamp(3rem,12vw,5.75rem)] font-bold leading-[0.92] tracking-[-0.035em] text-ink"
          style={{ fontVariationSettings: '"wdth" 80' }}
        >
          {site.name}
        </h1>
        <p className="mt-5 text-lg text-ink sm:text-xl">{site.title}</p>
        <p className="mt-2 max-w-[34ch] text-lg leading-relaxed text-dim sm:text-xl">{site.tagline}</p>

        <div className="mt-8 flex flex-wrap gap-2">
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
      </section>

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
                  <span key={item} className="rounded-md border border-rule px-2 py-1 text-sm text-ink">
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
