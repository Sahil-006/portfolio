import { projects } from "@/data/projects";

// Turns projects + their tags into points in a small 3D "embedding space".
// Project positions are hand-placed; skills sit near the projects that use them,
// so shared skills (Python, Flask, Next.js…) land between clusters.

export type Vec3 = [number, number, number];

export type ProjectNode = { kind: "project"; id: string; label: string; pos: Vec3; hue: string };
export type SkillNode = { kind: "skill"; id: string; label: string; pos: Vec3; hue: string; projects: string[] };
export type Edge = { from: Vec3; to: Vec3; skill: string; project: string; hue: string };

const anchors: Vec3[] = [
  [-2.5, 0.9, 0.3],
  [-0.7, -1.5, 1.1],
  [1.7, 1.15, -0.5],
  [2.5, -1.15, 0.6],
  [0.1, 1.9, -1.9],
  [-1.6, -0.6, -2.2],
  [0.9, -0.2, 2.4],
];

// Small deterministic random so the layout is identical on every load.
function seeded(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function mixHex(a: string, b: string) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (p: number, s: number) => (p >> s) & 255;
  const m = (s: number) => Math.round((ch(pa, s) + ch(pb, s)) / 2);
  return `#${((m(16) << 16) | (m(8) << 8) | m(0)).toString(16).padStart(6, "0")}`;
}

export function buildSpace() {
  const projectNodes: ProjectNode[] = projects.map((p, i) => ({
    kind: "project",
    id: p.slug,
    label: p.name,
    pos: anchors[i % anchors.length],
    hue: p.hue,
  }));
  const byId = Object.fromEntries(projectNodes.map((n) => [n.id, n]));

  const tagMap = new Map<string, string[]>();
  for (const p of projects) for (const t of p.tags) tagMap.set(t, [...(tagMap.get(t) ?? []), p.slug]);

  const skillNodes: SkillNode[] = [];
  for (const [tag, users] of tagMap) {
    const rnd = seeded(tag);
    const centre = users
      .map((u) => byId[u].pos)
      .reduce<Vec3>((acc, v) => [acc[0] + v[0], acc[1] + v[1], acc[2] + v[2]], [0, 0, 0])
      .map((c) => c / users.length) as Vec3;

    // Single-project skills orbit their project; shared ones sit near the midpoint.
    const r = users.length === 1 ? 0.85 + rnd() * 0.45 : 0.25 + rnd() * 0.35;
    const theta = rnd() * Math.PI * 2;
    const phi = Math.acos(2 * rnd() - 1);
    const pos: Vec3 = [
      centre[0] + r * Math.sin(phi) * Math.cos(theta),
      centre[1] + r * Math.sin(phi) * Math.sin(theta),
      centre[2] + r * Math.cos(phi),
    ];
    const hue = users.length === 1 ? byId[users[0]].hue : users.map((u) => byId[u].hue).reduce(mixHex);
    skillNodes.push({ kind: "skill", id: tag, label: tag, pos, hue, projects: users });
  }

  const edges: Edge[] = skillNodes.flatMap((s) =>
    s.projects.map((pid) => ({ from: s.pos, to: byId[pid].pos, skill: s.id, project: pid, hue: byId[pid].hue })),
  );

  return { projectNodes, skillNodes, edges };
}
