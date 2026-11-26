import { site } from "@/data/site";

// The teardown story, in scroll order. Each chapter is one screen-height of scrolling.
// `layer` is the part of the laptop that comes forward during that chapter.

export type LayerId = "lid" | "keyboard" | "board" | "ram" | "battery";

export type Chapter = {
  id: string;
  layer?: LayerId;
  part?: string; // the hardware part, shown above the chapter title
  title: string;
  screen: string[]; // what the laptop screen shows during this chapter
};

export const chapters: Chapter[] = [
  {
    id: "intro",
    title: site.name,
    screen: ["$ boot sahil.os", "> hello, i'm sahil", "> ai engineer", "> scroll to take me apart"],
  },
  {
    id: "about",
    layer: "lid",
    part: "Screen",
    title: "About",
    screen: ["$ cat about.txt", "final-year computer engineering", "models people can trust,", "and the backends that ship them"],
  },
  {
    id: "skills",
    layer: "keyboard",
    part: "Keyboard",
    title: "Skills",
    screen: ["$ ls ~/skills", "every key is a skill.", "press one."],
  },
  {
    id: "projects",
    layer: "board",
    part: "Motherboard",
    title: "Projects",
    screen: ["$ ls ~/projects", "early-spark  ai-nids", "codetrust  intellihelp", "smart-agro"],
  },
  {
    id: "education",
    layer: "ram",
    part: "Memory",
    title: "B.Tech, year by year",
    screen: ["$ cat btech.log", "computer engineering, mbit", "one stick per year"],
  },
  {
    id: "experience",
    layer: "battery",
    part: "Battery",
    title: "Experience",
    screen: ["$ cat internship.log", "charged up on real work:", "flask + mongodb + ml apis"],
  },
  {
    id: "outro",
    title: "Reassembled",
    screen: ["$ reassemble --all", "> done.", "> 1 screw left over.", "> still boots."],
  },
];

export const layerChapter: Record<LayerId, number> = Object.fromEntries(
  chapters.flatMap((c, i) => (c.layer ? [[c.layer, i]] : [])),
) as Record<LayerId, number>;

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** How far apart the laptop is (0 = assembled, 1 = fully exploded), from the chapter position. */
export function explodeAt(cf: number) {
  const n = chapters.length;
  return smooth(0.62, 1.2, cf) * (1 - smooth(n - 1.75, n - 1.0, cf));
}

/** How much a layer is "in focus" (0–1): peaks in the middle of its chapter. */
export function focusAt(cf: number, layer: LayerId) {
  const c = layerChapter[layer];
  return Math.max(0, 1 - Math.abs(cf - (c + 0.5)) * 1.7);
}

/** B.Tech years from the education period, e.g. "2023 – 2027" → 4 years, and which one is now. */
export function btechYears() {
  const period = site.education[0]?.period ?? "2023 – 2027";
  const [start, end] = (period.match(/\d{4}/g) ?? ["2023", "2027"]).map(Number);
  const count = Math.max(1, end - start);
  const now = new Date();
  // Academic years start around July.
  const current = Math.min(count, Math.max(1, now.getFullYear() - start + (now.getMonth() >= 6 ? 1 : 0)));
  return Array.from({ length: count }, (_, i) => ({
    n: i + 1,
    range: `${start + i}–${String(start + i + 1).slice(2)}`,
    current: i + 1 === current,
    done: i + 1 < current,
  }));
}

/** Colours for the skill groups (keyboard legends and the skills panel). */
export const groupColors = ["#6fd6c2", "#a78bfa", "#fbbf24", "#8ab4ff", "#ff8fc0", "#86efac"];
