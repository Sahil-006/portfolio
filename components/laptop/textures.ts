import * as THREE from "three";

// All surface detail on the device is drawn here with <canvas>, so the site ships no image files for it.

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

function toTexture(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// Tiny deterministic random so the board looks the same on every load.
function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

/** Circuit board: dark teal solder mask, copper traces, vias and silkscreen. */
export function pcbTexture() {
  const [c, x] = canvas(1024, 1664);
  const r = rng(42);
  x.fillStyle = "#0c2a2a";
  x.fillRect(0, 0, c.width, c.height);

  // Subtle mottling so the solder mask doesn't look flat.
  for (let i = 0; i < 900; i++) {
    x.fillStyle = `rgba(255,255,255,${r() * 0.025})`;
    x.fillRect(r() * c.width, r() * c.height, 2 + r() * 6, 2 + r() * 6);
  }

  // Copper traces: right-angle runs with 45° corners, like a real layout.
  x.lineCap = "round";
  x.lineJoin = "round";
  for (let i = 0; i < 85; i++) {
    let px = Math.round((r() * c.width) / 16) * 16;
    let py = Math.round((r() * c.height) / 16) * 16;
    x.strokeStyle = r() > 0.15 ? "rgba(201,154,74,0.32)" : "rgba(201,154,74,0.6)";
    x.lineWidth = r() > 0.8 ? 6 : 3;
    x.beginPath();
    x.moveTo(px, py);
    const segs = 2 + Math.floor(r() * 4);
    for (let s = 0; s < segs; s++) {
      const len = 40 + r() * 220;
      const dir = Math.floor(r() * 4);
      if (dir === 0) px += len;
      else if (dir === 1) px -= len;
      else if (dir === 2) py += len;
      else py -= len;
      const d = 16;
      x.lineTo(px + (dir < 2 ? 0 : d), py + (dir < 2 ? d : 0));
    }
    x.stroke();
    // Via at the end of the trace.
    x.fillStyle = "#c99a4a";
    x.beginPath();
    x.arc(px, py, 7, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = "#081c1c";
    x.beginPath();
    x.arc(px, py, 3, 0, Math.PI * 2);
    x.fill();
  }

  // Silkscreen.
  x.fillStyle = "rgba(230,236,240,0.75)";
  x.font = "600 30px 'IBM Plex Mono', monospace";
  x.fillText("CLEAR-01  REV B", 60, 1600);
  x.font = "500 22px 'IBM Plex Mono', monospace";
  x.fillText("DESIGNED BY SAHIL SHAIKH, PETLAD", 60, 1630);
  x.fillText("ACT", 300, 700);
  x.strokeStyle = "rgba(230,236,240,0.5)";
  x.lineWidth = 2;
  x.strokeRect(24, 24, c.width - 48, c.height - 48);

  return toTexture(c);
}

/** Top marking of a chip: name, headline number and the pin-1 dot. */
export function chipTexture(name: string, metric: string) {
  const [c, x] = canvas(512, 384);
  const g = x.createLinearGradient(0, 0, 512, 384);
  g.addColorStop(0, "#1c1f26");
  g.addColorStop(1, "#111318");
  x.fillStyle = g;
  x.fillRect(0, 0, 512, 384);
  x.fillStyle = "rgba(255,255,255,0.18)";
  x.beginPath();
  x.arc(44, 44, 14, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = "rgba(235,238,242,0.92)";
  x.font = "600 54px 'IBM Plex Mono', monospace";
  const words = name.toUpperCase().split(" ");
  const line1 = words.slice(0, 2).join(" ");
  x.fillText(line1.length > 14 ? line1.slice(0, 14) : line1, 40, 170);
  x.fillStyle = "rgba(235,238,242,0.55)";
  x.font = "500 40px 'IBM Plex Mono', monospace";
  x.fillText(metric.length > 18 ? metric.split(" ")[0] : metric, 40, 240);
  x.font = "500 28px 'IBM Plex Mono', monospace";
  x.fillStyle = "rgba(235,238,242,0.35)";
  x.fillText("SS-2026  MADE IN PETLAD", 40, 330);
  return toTexture(c);
}

/** LCD screen. */
export function screenTexture(lines: string[]) {
  const [c, x] = canvas(768, 448);
  x.fillStyle = "#06120f";
  x.fillRect(0, 0, c.width, c.height);
  const vg = x.createRadialGradient(384, 224, 60, 384, 224, 460);
  vg.addColorStop(0, "rgba(111,214,194,0.10)");
  vg.addColorStop(1, "rgba(0,0,0,0.5)");
  x.fillStyle = vg;
  x.fillRect(0, 0, c.width, c.height);
  x.font = "500 34px 'IBM Plex Mono', monospace";
  lines.forEach((l, i) => {
    x.fillStyle = l.startsWith("$") ? "rgba(111,214,194,0.65)" : "#9ff3e2";
    x.fillText(l, 40, 78 + i * 56);
  });
  // Scanlines.
  x.fillStyle = "rgba(0,0,0,0.22)";
  for (let y = 0; y < c.height; y += 4) x.fillRect(0, y, c.width, 1.5);
  return toTexture(c);
}

/** Sticky note with handwriting. */
export function noteTexture(lines: string[]) {
  // Drawn at 2× so the handwriting stays crisp up close.
  const [c, x] = canvas(1024, 1024);
  x.scale(2, 2);
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, "#ffe98f");
  g.addColorStop(1, "#f7d968");
  x.fillStyle = g;
  x.fillRect(0, 0, 512, 512);
  x.fillStyle = "rgba(0,0,0,0.06)";
  x.fillRect(0, 0, 512, 60); // the sticky strip

  // Make the handwriting as big as fits: the longest line spans the note's width.
  const pad = 34;
  const maxW = 512 - pad * 2;
  let size = 120;
  x.font = `700 ${size}px Caveat, cursive`;
  const widest = () => Math.max(...lines.map((l) => x.measureText(l).width));
  while (size > 40 && widest() > maxW) {
    size -= 2;
    x.font = `700 ${size}px Caveat, cursive`;
  }
  const lineH = size * 1.05;
  const blockH = lineH * lines.length;
  const top = 60 + (512 - 60 - blockH) / 2 + size * 0.78;
  x.fillStyle = "#24232b";
  lines.forEach((l, i) => x.fillText(l, pad, top + i * lineH));
  return toTexture(c);
}

/** Soft round blob for the floor shadow and LED halos. */
export function radialTexture() {
  const [c, x] = canvas(128, 128);
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.45)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

/**
 * All keycap labels packed into one texture (an "atlas"), so the whole keyboard
 * can be drawn in a couple of GPU calls. Returns the texture and each key's UV rectangle.
 */
export function keyAtlas(keys: { label: string; color: string; w: number }[]) {
  const H = 96; // pixel height of one keycap
  const W = 2048;
  const pad = 4;
  const widths = keys.map((k) => Math.round(H * (k.w / 0.2) * 0.9));
  // Pack keycaps left to right, wrapping into rows.
  const rects: { x: number; y: number; w: number }[] = [];
  let x = 0;
  let y = 0;
  widths.forEach((w) => {
    if (x + w > W) {
      x = 0;
      y += H + pad;
    }
    rects.push({ x, y, w });
    x += w + pad;
  });
  const height = Math.pow(2, Math.ceil(Math.log2(y + H)));
  const [c, ctx] = canvas(W, height);
  keys.forEach((k, i) => {
    const r = rects[i];
    const g = ctx.createLinearGradient(0, r.y, 0, r.y + H);
    g.addColorStop(0, "#23262e");
    g.addColorStop(1, "#181a20");
    ctx.fillStyle = g;
    ctx.fillRect(r.x, r.y, r.w, H);
    let size = 44;
    ctx.font = `600 ${size}px 'IBM Plex Mono', monospace`;
    while (size > 18 && ctx.measureText(k.label).width > r.w - 24) {
      size -= 2;
      ctx.font = `600 ${size}px 'IBM Plex Mono', monospace`;
    }
    ctx.fillStyle = k.color;
    ctx.textBaseline = "middle";
    ctx.fillText(k.label, r.x + 12, r.y + H / 2 + 2);
  });
  const uv = rects.map((r) => ({
    u0: r.x / W,
    u1: (r.x + r.w) / W,
    v1: 1 - r.y / height,
    v0: 1 - (r.y + H) / height,
  }));
  return { texture: toTexture(c), uv };
}

/** A SO-DIMM RAM stick label: one per year of the B.Tech. */
export function ramTexture(title: string, range: string, current: boolean) {
  const [c, x] = canvas(512, 220);
  x.fillStyle = "#0e3a2f";
  x.fillRect(0, 0, 512, 220);
  // Memory chips
  for (let i = 0; i < 4; i++) {
    x.fillStyle = "#15171c";
    x.fillRect(24 + i * 122, 26, 98, 92);
  }
  // Gold contacts
  x.fillStyle = "#d4a94e";
  for (let i = 0; i < 40; i++) x.fillRect(10 + i * 12.4, 196, 7, 24);
  // Label sticker
  x.fillStyle = current ? "#6fd6c2" : "#e9edf2";
  x.fillRect(24, 128, 464, 56);
  x.fillStyle = "#14161b";
  x.font = "700 34px 'IBM Plex Mono', monospace";
  x.fillText(title, 40, 168);
  x.font = "500 28px 'IBM Plex Mono', monospace";
  const rw = x.measureText(range).width;
  x.fillText(range, 472 - rw, 168);
  return toTexture(c);
}

/** Battery pack label. */
export function batteryTexture(lines: string[]) {
  const [c, x] = canvas(1024, 280);
  x.fillStyle = "#1a1d24";
  x.fillRect(0, 0, 1024, 280);
  // Cell outlines
  x.strokeStyle = "rgba(255,255,255,0.08)";
  x.lineWidth = 3;
  for (let i = 0; i < 4; i++) x.strokeRect(18 + i * 252, 18, 232, 244);
  x.fillStyle = "rgba(235,238,242,0.9)";
  x.font = "700 46px 'IBM Plex Mono', monospace";
  x.fillText(lines[0] ?? "", 48, 96);
  x.fillStyle = "rgba(235,238,242,0.55)";
  x.font = "500 32px 'IBM Plex Mono', monospace";
  lines.slice(1).forEach((l, i) => x.fillText(l, 48, 150 + i * 46));
  return toTexture(c);
}
