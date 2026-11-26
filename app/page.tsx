import { site } from "@/data/site";
import { projects } from "@/data/projects";
import Teardown from "@/components/laptop/Teardown";
import Section from "@/components/Section";
import GithubGraph from "@/components/GithubGraph";
import CopyEmail from "@/components/CopyEmail";
import LinkButton from "@/components/LinkButton";

export default function Home() {
  const hueFor = (name: string) => projects.find((p) => p.name === name)?.hue ?? "#6fd6c2";

  return (
    <>
      <Teardown />

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
