"use client";

import "@fontsource/caveat/600.css";
import "@fontsource/caveat/700.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor, RoundedBox } from "@react-three/drei";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { projects } from "@/data/projects";
import { chipTexture, noteTexture, pcbTexture, radialTexture, screenTexture } from "./textures";

// ─────────────────────────────────────────────────────────────
// A see-through handheld. Projects are the chips on its board.
// Poke the case: the parts pop out ("oops"), then snap back ("fixed").
// ─────────────────────────────────────────────────────────────

type Quality = "high" | "low";
type V3 = [number, number, number];

export type DeviceProps = {
  selected: string | null;
  onSelect: (slug: string | null) => void;
  reducedMotion: boolean;
  compact: boolean;
  activity: number[]; // last 7 days of GitHub activity, levels 0–4
  labels: React.RefObject<Record<string, HTMLElement | null>>;
  onPoke: (phase: "oops" | "fixed") => void;
};

const W = 3.0; // case width
const H = 4.8; // case height
const D = 0.72; // case depth

const chipSlots: { pos: [number, number]; size: [number, number]; out: V3; spin: V3 }[] = [
  { pos: [-0.82, 0.05], size: [0.66, 0.5], out: [-0.55, 0.25, 1.1], spin: [0.3, -0.5, 0.4] },
  { pos: [0, 0.05], size: [0.66, 0.5], out: [0, 0.45, 1.35], spin: [-0.4, 0.2, -0.3] },
  { pos: [0.82, 0.05], size: [0.66, 0.5], out: [0.6, 0.2, 1.15], spin: [0.2, 0.6, 0.5] },
  { pos: [-0.6, -1.95], size: [0.8, 0.42], out: [-0.5, -0.35, 1.0], spin: [0.5, 0.3, -0.6] },
  { pos: [0.6, -1.95], size: [0.8, 0.42], out: [0.55, -0.4, 1.2], spin: [-0.3, -0.4, 0.5] },
];

// Add ?quality=high or ?quality=low to the address to force a version (handy for testing).
function forcedQuality(): Quality | null {
  if (typeof window === "undefined") return null;
  const q = new URLSearchParams(window.location.search).get("quality");
  return q === "high" || q === "low" ? q : null;
}

function initialQuality(compact: boolean): Quality {
  if (typeof window === "undefined") return "low";
  const forced = forcedQuality();
  if (forced) return forced;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency ?? 4;
  return compact || coarse || cores <= 4 ? "low" : "high";
}

// The "explode" amount (0 = assembled, 1 = parts out), shared with every part.
const ExplodeCtx = createContext<React.RefObject<number>>({ current: 0 });

export default function Device(props: DeviceProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const [quality, setQuality] = useState<Quality>(() => initialQuality(props.compact));
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [fontsReady, setFontsReady] = useState(false);

  // Drag to turn the device. Horizontal drags rotate it; vertical swipes still scroll the page.
  const drag = useRef({ down: false, x: 0, y: 0, moved: 0, rotY: 0, rotX: 0 });

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    const vis = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", vis);
    // Canvas textures need the fonts loaded first, or they fall back to system fonts.
    Promise.all([
      document.fonts.load("700 40px Caveat"),
      document.fonts.load("500 30px 'IBM Plex Mono'"),
      document.fonts.load("600 30px 'IBM Plex Mono'"),
    ])
      .catch(() => {})
      .finally(() => setFontsReady(true));
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);

  return (
    <div
      ref={wrap}
      className="h-full w-full touch-pan-y select-none"
      onPointerDown={(e) => {
        drag.current.down = true;
        drag.current.x = e.clientX;
        drag.current.y = e.clientY;
        drag.current.moved = 0;
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d.down) return;
        const dx = e.clientX - d.x;
        const dy = e.clientY - d.y;
        d.x = e.clientX;
        d.y = e.clientY;
        d.moved += Math.abs(dx) + Math.abs(dy);
        d.rotY += dx * 0.012;
        d.rotX = THREE.MathUtils.clamp(d.rotX + dy * 0.006, -0.45, 0.45);
      }}
      onPointerUp={() => (drag.current.down = false)}
      onPointerLeave={() => (drag.current.down = false)}
    >
      {fontsReady && (
        <Canvas
          camera={{ position: [0, 0.3, props.compact ? 12.5 : 11.5], fov: 35 }}
          dpr={[1, 2]} // sharp on high-density phone screens; the lighter tier is still capped at 30 fps
          frameloop={!onScreen || !tabVisible ? "never" : quality === "low" ? "demand" : "always"}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance", stencil: false }}
          fallback={null}
        >
          <PerformanceMonitor flipflops={1} onDecline={() => !forcedQuality() && setQuality("low")} />
          {quality === "low" && onScreen && tabVisible && <Throttle fps={30} />}
          <Scene {...props} quality={quality} drag={drag} />
        </Canvas>
      )}
    </div>
  );
}

// On the lighter tier, draw at 30 fps: the motion here is slow, and it halves the GPU work on phones.
function Throttle({ fps }: { fps: number }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const loop = (now: number) => {
      if (now - last >= 1000 / fps - 2) {
        last = now;
        invalidate();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [fps, invalidate]);
  return null;
}

function Scene({
  selected,
  onSelect,
  reducedMotion,
  compact,
  activity,
  labels,
  onPoke,
  quality,
  drag,
}: DeviceProps & {
  quality: Quality;
  drag: React.RefObject<{ down: boolean; moved: number; rotY: number; rotX: number }>;
}) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const explode = useRef(0);
  const poke = useRef({ t: -1, announcedFix: false });
  const [hover, setHover] = useState<string | null>(null);
  const anchors = useRef<Record<string, THREE.Object3D | null>>({});
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const shadowTex = useMemo(radialTexture, []);

  const clickedNotDragged = () => (drag.current?.moved ?? 0) < 6;

  const startPoke = () => {
    if (poke.current.t >= 0) return;
    poke.current = { t: 0, announcedFix: false };
    onPoke("oops");
  };

  useFrame((state, rawDt) => {
    // Cap the step so a slow frame slows the animation down instead of skipping it.
    const dt = Math.min(rawDt, 1 / 30);
    const t = state.clock.elapsedTime;
    const g = root.current;
    const b = body.current;
    if (!g || !b) return;

    // Poke timeline: pop out (0.3s) → hang (0.6s) → snap back (0.7s, with overshoot).
    let e = 0;
    let jolt = 0;
    const p = poke.current;
    if (p.t >= 0) {
      p.t += dt;
      const out = 0.3,
        hold = 0.6,
        back = 0.7;
      if (p.t < out) e = 1 - Math.pow(1 - p.t / out, 3);
      else if (p.t < out + hold) e = 1;
      else if (p.t < out + hold + back) {
        const k = (p.t - out - hold) / back;
        const c1 = 1.70158,
          c3 = c1 + 1; // easeOutBack, inverted so it slightly overshoots past "assembled"
        e = 1 - (1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2));
      } else {
        e = 0;
        p.t = -1;
      }
      if (p.t >= out + hold + back * 0.8 && !p.announcedFix) {
        p.announcedFix = true;
        onPoke("fixed");
      }
      jolt = p.t >= 0 && p.t < 0.6 ? Math.sin(p.t * 38) * Math.exp(-p.t * 7) : 0;
    }
    explode.current = e;

    // Idle sway + drag rotation + jolt.
    const d = drag.current!;
    const sway = reducedMotion ? 0 : Math.sin(t * 0.45) * 0.22;
    const bob = reducedMotion ? 0 : Math.sin(t * 0.9) * 0.06;
    const targetY = -0.35 + sway + d.rotY;
    const targetX = 0.06 + d.rotX;
    b.rotation.y = THREE.MathUtils.damp(b.rotation.y, targetY, 6, dt);
    b.rotation.x = THREE.MathUtils.damp(b.rotation.x, targetX, 6, dt);
    b.rotation.z = jolt * 0.12;
    b.position.y = bob + Math.abs(jolt) * 0.15;
    if (!d.down) d.rotX = THREE.MathUtils.damp(d.rotX, 0, 2, dt); // tilt eases back when let go

    if (shadow.current) {
      const s = 1 - Math.abs(bob) * 0.8 - e * 0.1;
      shadow.current.scale.set(3.4 * s, 1.1 * s, 1);
      (shadow.current.material as THREE.MeshBasicMaterial).opacity = 0.55 - e * 0.15;
    }

    // Labels for hovered/selected chips, positioned over the canvas.
    const els = labels.current;
    if (els) {
      for (const [id, obj] of Object.entries(anchors.current)) {
        const el = els[id];
        if (!obj || !el) continue;
        tmp.setFromMatrixPosition(obj.matrixWorld).project(state.camera);
        const x = ((tmp.x + 1) / 2) * state.size.width;
        const y = ((1 - tmp.y) / 2) * state.size.height;
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`;
        el.style.opacity = (hover === id || selected === id) && e < 0.05 ? "1" : "0";
      }
    }
  });

  return (
    <ExplodeCtx.Provider value={explode}>
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 6, 5]} intensity={2.4} color="#f3f6ff" />
      <pointLight position={[-4, 2, -4]} intensity={35} color="#8ab4ff" />
      <pointLight position={[4, -3, 3]} intensity={12} color="#ffd9b0" />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 5, 3]} scale={[8, 1.5, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.6} position={[-5, 0, 2]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} color="#cfe0ff" />
        <Lightformer form="rect" intensity={1.2} position={[5, -1, 1]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} color="#ffe2c4" />
      </Environment>

      <group
        ref={root}
        position={compact ? [0, 0.35, 0] : [1.9, 0.1, 0]}
        scale={compact ? 0.92 : 1}
        onPointerMissed={() => clickedNotDragged() && onSelect(null)}
      >
        <mesh ref={shadow} position={[0, -H / 2 - 0.45, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={shadowTex} color="#000000" transparent opacity={0.55} depthWrite={false} />
        </mesh>

        <group ref={body}>
          <Shell
            quality={quality}
            onPoke={() => clickedNotDragged() && startPoke()}
          />
          <Board />
          <Screen />
          <ActivityLeds levels={activity} reducedMotion={reducedMotion} />
          {projects.slice(0, chipSlots.length).map((p, i) => (
            <Chip
              key={p.slug}
              slot={chipSlots[i]}
              name={p.name}
              metric={p.metric}
              hue={p.hue}
              active={hover === p.slug || selected === p.slug}
              anchor={(o) => (anchors.current[p.slug] = o)}
              onHover={(on) => setHover(on ? p.slug : null)}
              onClick={() => clickedNotDragged() && onSelect(selected === p.slug ? null : p.slug)}
            />
          ))}
          <Controls />
          <Batteries />
          <Fan reducedMotion={reducedMotion} />
          <Screws />
          <StickyNote />
        </group>
      </group>
    </ExplodeCtx.Provider>
  );
}

/** Moves its children outwards (and spins them a little) as the device "explodes". */
function Part({ out, spin = [0, 0, 0], children }: { out: V3; spin?: V3; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const explode = useContext(ExplodeCtx);
  useFrame(() => {
    const e = explode.current ?? 0;
    if (!ref.current) return;
    ref.current.position.set(out[0] * e, out[1] * e, out[2] * e);
    ref.current.rotation.set(spin[0] * e, spin[1] * e, spin[2] * e);
  });
  return <group ref={ref}>{children}</group>;
}

function pointer(on: boolean) {
  document.body.style.cursor = on ? "pointer" : "";
}

function Shell({ quality, onPoke }: { quality: Quality; onPoke: () => void }) {
  const glare = useMemo(glareTexture, []);
  return (
    <>
    {/* Inside faces of the case, faintly lit, so its thickness and edges read as plastic. */}
    <RoundedBox args={[W, H, D]} radius={0.24} smoothness={quality === "high" ? 4 : 3} raycast={() => null}>
      {quality === "high" ? (
        <meshPhysicalMaterial color="#cfe0ff" side={THREE.BackSide} transparent opacity={0.1} roughness={0.2} depthWrite={false} />
      ) : (
        <meshBasicMaterial color="#cfe0ff" side={THREE.BackSide} transparent opacity={0.06} depthWrite={false} />
      )}
    </RoundedBox>
    {/* A soft diagonal glare across the front. */}
    <mesh position={[0, 0, D / 2 + 0.004]} raycast={() => null} renderOrder={3}>
      <planeGeometry args={[W - 0.1, H - 0.1]} />
      <meshBasicMaterial map={glare} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0.5} />
    </mesh>
    <RoundedBox
      args={[W, H, D]}
      radius={0.24}
      smoothness={quality === "high" ? 6 : 4}
      onPointerOver={() => pointer(true)}
      onPointerOut={() => pointer(false)}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        // The case is in front of everything: if a chip is under the pointer, let the chip handle it.
        if (e.intersections.some((i) => i.object.userData.chip)) return;
        e.stopPropagation();
        onPoke();
      }}
      renderOrder={2}
    >
      {/* Clear plastic. We don't use real refraction ("transmission"): it blurs whatever is
          behind it and is the most expensive effect for the GPU. A thin, mostly transparent
          shell that only shows reflections keeps every chip readable. */}
      <meshPhysicalMaterial
        color="#e4edff"
        transparent
        opacity={quality === "high" ? 0.14 : 0.16}
        roughness={0.04}
        clearcoat={1}
        clearcoatRoughness={0.03}
        envMapIntensity={quality === "high" ? 2.4 : 2}
        specularIntensity={1}
        depthWrite={false}
      />
    </RoundedBox>
    </>
  );
}

function glareTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 410;
  const x = c.getContext("2d")!;
  const g = x.createLinearGradient(0, 0, 256, 410);
  g.addColorStop(0.0, "rgba(255,255,255,0)");
  g.addColorStop(0.22, "rgba(255,255,255,0.0)");
  g.addColorStop(0.3, "rgba(255,255,255,0.22)");
  g.addColorStop(0.36, "rgba(255,255,255,0.04)");
  g.addColorStop(0.44, "rgba(255,255,255,0.1)");
  g.addColorStop(0.5, "rgba(255,255,255,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 410);
  return new THREE.CanvasTexture(c);
}

function Board() {
  const tex = useMemo(pcbTexture, []);
  return (
    <mesh position={[0, -0.05, -0.08]}>
      <boxGeometry args={[W - 0.28, H - 0.3, 0.06]} />
      <meshStandardMaterial map={tex} roughness={0.55} metalness={0.15} />
    </mesh>
  );
}

function Screen() {
  const tex = useMemo(
    () =>
      screenTexture([
        "$ whoami",
        "sahil shaikh, ai engineer",
        "$ cat mistakes.log | wc -l",
        "3   (all fixed)",
        "$",
      ]),
    [],
  );
  const cursor = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (cursor.current) cursor.current.visible = Math.floor(clock.elapsedTime * 1.6) % 2 === 0;
  });
  return (
    <Part out={[0, 0.5, 0.8]} spin={[-0.25, 0, 0.08]}>
      <group position={[0, 1.38, 0.02]}>
        <RoundedBox args={[2.5, 1.55, 0.12]} radius={0.06} smoothness={3}>
          <meshStandardMaterial color="#14161b" roughness={0.6} />
        </RoundedBox>
        <mesh position={[0, 0, 0.065]}>
          <planeGeometry args={[2.2, 1.28]} />
          <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
        <mesh ref={cursor} position={[-0.86, -0.5, 0.067]}>
          <planeGeometry args={[0.08, 0.1]} />
          <meshBasicMaterial color="#9ff3e2" toneMapped={false} />
        </mesh>
      </group>
    </Part>
  );
}

function ActivityLeds({ levels, reducedMotion }: { levels: number[]; reducedMotion: boolean }) {
  const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  useFrame(({ clock }) => {
    levels.forEach((lvl, i) => {
      const m = mats.current[i];
      if (!m) return;
      let k = 0.15 + lvl * 0.6;
      // Today's LED blinks.
      if (i === levels.length - 1 && !reducedMotion) k *= 0.55 + 0.45 * Math.sin(clock.elapsedTime * 4);
      m.emissiveIntensity = k;
    });
  });
  return (
    <group position={[-0.6, 0.48, -0.02]}>
      {levels.map((_, i) => (
        <mesh key={i} position={[i * 0.2, 0, 0]}>
          <boxGeometry args={[0.1, 0.06, 0.05]} />
          <meshStandardMaterial
            ref={(m) => {
              mats.current[i] = m;
            }}
            color="#1b3b36"
            emissive="#6fd6c2"
            emissiveIntensity={0.3}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function Chip({
  slot,
  name,
  metric,
  hue,
  active,
  anchor,
  onHover,
  onClick,
}: {
  slot: (typeof chipSlots)[number];
  name: string;
  metric: string;
  hue: string;
  active: boolean;
  anchor: (o: THREE.Object3D | null) => void;
  onHover: (on: boolean) => void;
  onClick: () => void;
}) {
  const lift = useRef<THREE.Group>(null);
  const led = useRef<THREE.MeshStandardMaterial>(null);
  const tex = useMemo(() => chipTexture(name, metric), [name, metric]);
  const [w, h] = slot.size;
  const pins = useMemo(() => {
    const out: V3[] = [];
    const n = Math.round(w / 0.09);
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + 0.06 + (i * (w - 0.12)) / (n - 1);
      out.push([x, h / 2 + 0.03, -0.02], [x, -h / 2 - 0.03, -0.02]);
    }
    return out;
  }, [w, h]);
  const pinRef = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const m = new THREE.Matrix4();
    pins.forEach((p, i) => pinRef.current?.setMatrixAt(i, m.makeTranslation(...p)));
    if (pinRef.current) pinRef.current.instanceMatrix.needsUpdate = true;
  }, [pins]);

  useFrame((_, dt) => {
    if (lift.current) lift.current.position.z = THREE.MathUtils.damp(lift.current.position.z, active ? 0.14 : 0, 10, dt);
    if (led.current) led.current.emissiveIntensity = THREE.MathUtils.damp(led.current.emissiveIntensity, active ? 4 : 1.6, 8, dt);
  });

  return (
    <Part out={slot.out} spin={slot.spin}>
      <group position={[slot.pos[0], slot.pos[1], 0.0]}>
        <group ref={lift}>
          <mesh
            userData={{ chip: true }}
            onPointerOver={(e) => {
              e.stopPropagation();
              pointer(true);
              onHover(true);
            }}
            onPointerOut={() => {
              pointer(false);
              onHover(false);
            }}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <boxGeometry args={[w, h, 0.1]} />
            <meshStandardMaterial color="#15171c" roughness={0.45} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0, 0.0505]} userData={{ chip: true }} raycast={() => null}>
            <planeGeometry args={[w, h]} />
            <meshStandardMaterial map={tex} roughness={0.5} />
          </mesh>
          <instancedMesh ref={pinRef} args={[undefined, undefined, pins.length]}>
            <boxGeometry args={[0.035, 0.07, 0.025]} />
            <meshStandardMaterial color="#c9ccd2" metalness={1} roughness={0.25} />
          </instancedMesh>
          <mesh position={[w / 2 - 0.06, h / 2 + 0.11, -0.01]}>
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshStandardMaterial ref={led} color={hue} emissive={hue} emissiveIntensity={1.6} toneMapped={false} />
          </mesh>
          <object3D ref={anchor} position={[0, h / 2 + 0.2, 0.1]} />
        </group>
      </group>
    </Part>
  );
}

function Controls() {
  const plastic = (
    <meshPhysicalMaterial color="#2a3140" roughness={0.3} clearcoat={1} transparent opacity={0.92} />
  );
  return (
    <>
      {/* D-pad */}
      <Part out={[-0.35, -0.2, 0.75]} spin={[0, 0, 0.8]}>
        <group position={[-0.82, -1.12, 0.3]}>
          <RoundedBox args={[0.72, 0.24, 0.16]} radius={0.04} smoothness={2}>
            {plastic}
          </RoundedBox>
          <RoundedBox args={[0.24, 0.72, 0.16]} radius={0.04} smoothness={2}>
            {plastic}
          </RoundedBox>
        </group>
      </Part>
      {/* A / B */}
      {(
        [
          [0.88, -0.98, "#a78bfa"],
          [0.38, -1.28, "#ff6b7a"],
        ] as const
      ).map(([x, y, c], i) => (
        <Part key={i} out={[0.3 + i * 0.1, -0.15, 0.8 + i * 0.15]} spin={[0.4, 0.3, 0]}>
          <mesh position={[x, y, 0.3]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.17, 0.17, 0.16, 32]} />
            <meshPhysicalMaterial color={c} roughness={0.2} clearcoat={1} transparent opacity={0.85} />
          </mesh>
        </Part>
      ))}
    </>
  );
}

function Batteries() {
  return (
    <>
      {[-1.0, -1.32].map((y, i) => (
        <Part key={y} out={[i ? -0.35 : 0.35, -0.2, -0.9]} spin={[0.2, 0.4, 0.3]}>
          <group position={[0.05, y, -0.23]} rotation-z={Math.PI / 2}>
            <mesh>
              <cylinderGeometry args={[0.11, 0.11, 1.0, 24]} />
              <meshStandardMaterial color={i ? "#d9a441" : "#3a3f4b"} metalness={0.4} roughness={0.35} />
            </mesh>
            <mesh position={[0, 0.53, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.06, 12]} />
              <meshStandardMaterial color="#d6d9de" metalness={1} roughness={0.2} />
            </mesh>
          </group>
        </Part>
      ))}
    </>
  );
}

function Fan({ reducedMotion }: { reducedMotion: boolean }) {
  const rotor = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (rotor.current && !reducedMotion) rotor.current.rotation.z += dt * 9;
  });
  return (
    <Part out={[0.4, 0.4, -1.0]} spin={[0.3, -0.3, 0]}>
      <group position={[0.65, 1.35, -0.24]}>
        <mesh>
          <torusGeometry args={[0.42, 0.04, 10, 40]} />
          <meshStandardMaterial color="#1c1f26" roughness={0.5} />
        </mesh>
        <group ref={rotor}>
          <mesh>
            <cylinderGeometry args={[0.09, 0.09, 0.08, 20]} />
            <meshStandardMaterial color="#2b303a" />
          </mesh>
          {Array.from({ length: 7 }).map((_, i) => (
            <mesh key={i} rotation-z={(i / 7) * Math.PI * 2} position={[0, 0, 0]}>
              <boxGeometry args={[0.06, 0.62, 0.015]} />
              <meshStandardMaterial color="#3a4150" roughness={0.4} />
            </mesh>
          ))}
        </group>
      </group>
    </Part>
  );
}

function Screws() {
  const pts: [number, number][] = [
    [-W / 2 + 0.22, H / 2 - 0.22],
    [W / 2 - 0.22, H / 2 - 0.22],
    [-W / 2 + 0.22, -H / 2 + 0.22],
    [W / 2 - 0.22, -H / 2 + 0.22],
  ];
  return (
    <>
      {pts.map(([x, y]) => (
        <mesh key={`${x}${y}`} position={[x, y, D / 2 + 0.005]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.07, 0.07, 0.02, 20]} />
          <meshStandardMaterial color="#b9bec7" metalness={1} roughness={0.3} />
        </mesh>
      ))}
    </>
  );
}

function StickyNote() {
  // Your note: one string per line. Keep it to about 3 short lines.
  const tex = useMemo(() => noteTexture(["it worked on", "my machine,", "I promise."]), []);
  return (
    <Part out={[0.8, -0.3, 0.9]} spin={[0.2, -0.3, -0.9]}>
      <mesh position={[1.6, -0.48, D / 2 + 0.03]} rotation={[0.02, 0.06, -0.16]}>
        <planeGeometry args={[1.0, 1.0]} />
        {/* Matte paper: Lambert has no specular highlight, so the note doesn't shine like plastic. */}
        <meshLambertMaterial map={tex} side={THREE.DoubleSide} />
      </mesh>
    </Part>
  );
}
