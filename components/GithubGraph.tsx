"use client";

import { useEffect, useState } from "react";

type Day = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 };

// Public contributions API (no token needed). Shows the last 12 months.
const API = (user: string) => `https://github-contributions-api.jogruber.de/v4/${user}?y=last`;

const levelFill = [
  "var(--color-rule)",
  "color-mix(in srgb, var(--color-signal) 30%, var(--color-rule))",
  "color-mix(in srgb, var(--color-signal) 55%, var(--color-rule))",
  "color-mix(in srgb, var(--color-signal) 80%, var(--color-rule))",
  "var(--color-signal)",
];

export default function GithubGraph({ username }: { username: string }) {
  const [days, setDays] = useState<Day[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(API(username))
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((json) => alive && setDays(json.contributions as Day[]))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [username]);

  const profile = `https://github.com/${username}`;

  if (failed) {
    return (
      <p className="text-sm text-dim">
        The contribution graph didn’t load.{" "}
        <a href={profile} target="_blank" rel="noopener noreferrer" className="text-ink underline underline-offset-4">
          See activity on GitHub
        </a>
        .
      </p>
    );
  }

  if (!days) {
    return <div className="h-[118px] animate-pulse rounded-lg bg-panel" aria-label="Loading contribution graph" />;
  }

  // Group into weeks (columns), padding the first week so rows line up with weekdays.
  const firstDow = new Date(days[0].date).getDay();
  const padded: (Day | null)[] = [...Array(firstDow).fill(null), ...days];
  const weeks: (Day | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7));
  const total = days.reduce((s, d) => s + d.count, 0);

  const cell = 10;
  const gap = 3;
  const w = weeks.length * (cell + gap);
  const h = 7 * (cell + gap);

  return (
    <figure>
      <div className="overflow-x-auto pb-1">
        <svg
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          role="img"
          aria-label={`${total} GitHub contributions in the last year`}
        >
          {weeks.map((week, wi) =>
            week.map((d, di) =>
              d ? (
                <rect
                  key={d.date}
                  x={wi * (cell + gap)}
                  y={di * (cell + gap)}
                  width={cell}
                  height={cell}
                  rx={2}
                  fill={levelFill[d.level]}
                >
                  <title>{`${d.count} on ${d.date}`}</title>
                </rect>
              ) : null,
            ),
          )}
        </svg>
      </div>
      <figcaption className="mt-3 text-sm text-dim">
        {total.toLocaleString()} contributions in the last year on{" "}
        <a href={profile} target="_blank" rel="noopener noreferrer" className="text-ink underline underline-offset-4">
          GitHub
        </a>
      </figcaption>
    </figure>
  );
}
