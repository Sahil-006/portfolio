"use client";

import "@fontsource/caveat/700.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import "@fontsource/ibm-plex-mono/700.css";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Edges, Environment, Lightformer, Line, PerformanceMonitor, RoundedBox } from "@react-three/drei";
import { createContext, memo, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { site } from "@/data/site";
import { projects } from "@/data/projects";
import { btechYears, chapters, explodeAt, focusAt, groupColors, type LayerId } from "./chapters";
import {
  batteryTexture,
  chipTexture,
  keyAtlas,
  noteTexture,
  pcbTexture,
  radialTexture,
  ramTexture,
  screenTexture,
} from "./textures";

// ─────────────────────────────────────────────────────────────
// A clear laptop that takes itself apart as you scroll.
// Layers (bottom → top): case, battery, motherboard, RAM, keyboard, lid.
// ─────────────────────────────────────────────────────────────

type Quality = "high" | "low";

export type LaptopProps = {
  progress: React.RefObject<number>; // position in the story, in chapters (0 … chapters.length)
  compact: boolean;
  reducedMotion: boolean;
  selected: string | null;
  onSelect: (slug: string | null) => void;
  onKey: (group: number) => void;
  labels: React.RefObject<Record<string, HTMLElement | null>>;
  reboot: React.RefObject<number>; // bump to snap back to the start and replay the lid opening
};

const W = 3.4; // width (x)
const D = 2.3; // depth (z)

// Where each layer sits when assembled, and how far it moves up when exploded.
const LAYERS: Record<LayerId | "case", { y: number; up: number }> = {
  case: { y: 0.03, up: -1.3 },
  battery: { y: 0.1, up: -0.68 },
  board: { y: 0.16, up: 0 },
  ram: { y: 0.2, up: 0.55 },
  keyboard: { y: 0.25, up: 1.18 },
  lid: { y: 0.3, up: 1.5 },
};

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

// Shared per-frame state: how exploded the laptop is and where we are in the story.
type Story = { cf: number; e: number; boot: number };
const StoryCtx = createContext<React.RefObject<Story>>({ current: { cf: 0, e: 0, boot: 0 } });

// Named points on the laptop: "subject:<layer>" is what the camera frames in that chapter,
// "tag:<layer>" is where the layer's label sits.
const AnchorCtx = createContext<React.RefObject<Record<string, THREE.Object3D | null>>>({ current: {} });

const H_LID = 2.15;

// Camera shots. Close-ups keep roughly the overview's viewing angle, just nearer.
const OVERVIEW = { pos: new THREE.Vector3(0, 3.6, 10.5), look: new THREE.Vector3(0, 0.2, 0) };
// Phones get their own camera: a wider lens and a closer overview, so the laptop fills the
// tall, narrow frame and the close-ups really feel close.
const PHONE_FOV = 38;
const OVERVIEW_PHONE = { pos: new THREE.Vector3(0, 3.0, 8.4), look: new THREE.Vector3(0, 0.35, 0) };

// True on phones and small screens: lets parts skip extras that don't show at that size.
const CompactCtx = createContext(false);
const CLOSE_FLAT = new THREE.Vector3(0, 2.95, 5.7); // looking down at a flat layer
const CLOSE_LID = new THREE.Vector3(0, 0.85, 6.3); // facing the screen

function LaptopCanvas(props: LaptopProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const [quality, setQuality] = useState<Quality>(() => initialQuality(props.compact));
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [fontsReady, setFontsReady] = useState(false);
  const drag = useRef({ down: false, x: 0, y: 0, moved: 0, rotY: 0 });

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    const vis = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", vis);
    Promise.all([
      document.fonts.load("700 40px Caveat"),
      document.fonts.load("500 30px 'IBM Plex Mono'"),
      document.fonts.load("600 30px 'IBM Plex Mono'"),
      document.fonts.load("700 30px 'IBM Plex Mono'"),
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
        drag.current = { ...drag.current, down: true, x: e.clientX, y: e.clientY, moved: 0 };
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d.down) return;
        const dx = e.clientX - d.x;
        d.moved += Math.abs(dx) + Math.abs(e.clientY - d.y);
        d.x = e.clientX;
        d.y = e.clientY;
        d.rotY = THREE.MathUtils.clamp(d.rotY + dx * 0.008, -1.1, 1.1);
      }}
      onPointerUp={() => (drag.current.down = false)}
      onPointerLeave={() => (drag.current.down = false)}
    >
      {fontsReady && (
        <Canvas
          camera={{
            position: props.compact ? OVERVIEW_PHONE.pos.toArray() : OVERVIEW.pos.toArray(),
            fov: props.compact ? PHONE_FOV : 32,
          }}
          // Full frame rate and a fixed, sharp resolution on every device. (A resolution that dipped
          // while moving caused a visible blur-then-sharpen flicker, so it's gone.)
          dpr={quality === "high" ? [1, 2] : [1, 1.75]}
          frameloop={!onScreen || !tabVisible ? "never" : "always"}
          // Edge smoothing (antialias) is costly on phones and barely visible on their dense screens.
          gl={{ antialias: quality === "high", alpha: true, powerPreference: "high-performance", stencil: false }}
          fallback={null}
        >
          <PerformanceMonitor flipflops={1} onDecline={() => !forcedQuality() && setQuality("low")} />
          <Scene {...props} quality={quality} drag={drag} />
        </Canvas>
      )}
    </div>
  );
}

/** Frees GPU memory held by a texture/geometry (or an array/object of them). */
function disposeAll(value: unknown) {
  if (!value) return;
  if (Array.isArray(value)) return value.forEach(disposeAll);
  const v = value as { dispose?: () => void };
  if (typeof v.dispose === "function") return v.dispose();
  if (typeof value === "object") Object.values(value as Record<string, unknown>).forEach(disposeAll);
}

/**
 * Like useMemo, for textures and geometries we create ourselves: they're freed from the GPU
 * when the component unmounts (e.g. when you leave the home page). Without this, every visit
 * to the home page left ~25 MB of old textures behind.
 */
function useDisposable<T>(create: () => T, deps: React.DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(create, deps);
  useEffect(() => () => disposeAll(value), [value]);
  return value;
}

// Memoised: the page re-renders when the chapter changes, but nothing the 3D scene needs has
// changed, so React shouldn't walk the whole 3D tree again (that caused a hitch at each chapter).
const Laptop = memo(LaptopCanvas);
export default Laptop;

function pointer(on: boolean) {
  document.body.style.cursor = on ? "pointer" : "";
}

function Scene({
  progress,
  compact,
  reducedMotion,
  selected,
  onSelect,
  onKey,
  labels,
  reboot,
  quality,
  drag,
}: LaptopProps & { quality: Quality; drag: React.RefObject<{ down: boolean; moved: number; rotY: number }> }) {
  const story = useRef<Story>({ cf: 0, e: 0, boot: 0 });
  const seenReboot = useRef(reboot.current ?? 0);
  const lastStyle = useRef<Record<string, string>>({});
  const root = useRef<THREE.Group>(null);
  const frame = useRef<THREE.Group>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const shadowTex = useDisposable(radialTexture, []);
  const anchors = useRef<Record<string, THREE.Object3D | null>>({});
  const [hover, setHover] = useState<string | null>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const camLook = useRef(OVERVIEW.look.clone());
  const v = useMemo(
    () => ({ pos: new THREE.Vector3(), look: new THREE.Vector3(), sp: new THREE.Vector3(), sl: new THREE.Vector3(), s: new THREE.Vector3() }),
    [],
  );
  const clicked = () => (drag.current?.moved ?? 0) < 6;

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30);
    // Ease towards the scroll position so the motion stays smooth between scroll events.
    const target = progress.current ?? 0;
    // "Take it apart again": jump straight back to the start and replay the lid opening.
    if ((reboot.current ?? 0) !== seenReboot.current) {
      seenReboot.current = reboot.current ?? 0;
      story.current.cf = target;
      story.current.boot += 1;
    }
    story.current.cf = THREE.MathUtils.damp(story.current.cf, target, compact ? 10 : 8, dt);
    story.current.e = explodeAt(story.current.cf);

    // The exploded stack is taller, so shrink and lower it a little to keep it all in view.
    if (frame.current) {
      const e = story.current.e;
      const base = compact ? 1.0 : 0.92;
      frame.current.scale.setScalar(base * (1 - 0.16 * e));
      frame.current.position.y = (compact ? 0.05 : -0.05) - 0.42 * e;
    }

    // Camera: blend between per-chapter shots. Each chapter's shot peaks in the middle of the chapter.
    {
      const cf = story.current.cf;
      v.pos.set(0, 0, 0);
      v.look.set(0, 0, 0);
      let total = 0;
      chapters.forEach((c, i) => {
        const w = Math.max(0, 1 - Math.abs(cf - (i + 0.5)));
        if (w <= 0) return;
        const subject = c.layer ? anchors.current[`subject:${c.layer}`] : null;
        // (phones: centred close-ups, no sideways offset; desktop: part kept clear of the text)
        if (subject && story.current.e > 0.05) {
          subject.getWorldPosition(v.s);
          // On desktop the text panel is on the left, so aim a little left of the part to keep it on the right.
          v.sl.copy(v.s).add(tmp.set(compact ? 0 : c.layer === "lid" ? -0.75 : -1.05, 0, 0));
          v.sp
            .copy(c.layer === "lid" ? CLOSE_LID : CLOSE_FLAT)
            .multiplyScalar(compact ? 0.92 : 1)
            .add(v.sl);
        } else {
          v.sp.copy(compact ? OVERVIEW_PHONE.pos : OVERVIEW.pos);
          v.sl.copy(compact ? OVERVIEW_PHONE.look : OVERVIEW.look);
        }
        v.pos.addScaledVector(v.sp, w);
        v.look.addScaledVector(v.sl, w);
        total += w;
      });
      if (total > 0) {
        v.pos.multiplyScalar(1 / total);
        v.look.multiplyScalar(1 / total);
        const k = compact ? 6 : 4.5;
        state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, v.pos.x, k, dt);
        state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, v.pos.y, k, dt);
        state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, v.pos.z, k, dt);
        camLook.current.x = THREE.MathUtils.damp(camLook.current.x, v.look.x, k, dt);
        camLook.current.y = THREE.MathUtils.damp(camLook.current.y, v.look.y, k, dt);
        camLook.current.z = THREE.MathUtils.damp(camLook.current.z, v.look.z, k, dt);
        state.camera.lookAt(camLook.current);
      }
    }

    const g = root.current;
    if (g) {
      const t = state.clock.elapsedTime;
      const sway = reducedMotion ? 0 : Math.sin(t * 0.35) * 0.06;
      const base = compact ? -0.5 : -0.62;
      g.rotation.y = THREE.MathUtils.damp(g.rotation.y, base + sway + (drag.current?.rotY ?? 0), 5, dt);
      if (!drag.current?.down && drag.current) drag.current.rotY = THREE.MathUtils.damp(drag.current.rotY, 0, 1.2, dt);
    }
    if (shadow.current) {
      const m = shadow.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.5 - story.current.e * 0.25;
    }

    // Labels over chips and layers. Only touch the page when a value actually changes:
    // writing styles every frame makes the browser redo work 60 times a second.
    const write = (id: string, el: HTMLElement, transform: string, opacity: string) => {
      const key = transform + opacity;
      if (lastStyle.current[id] === key) return;
      lastStyle.current[id] = key;
      el.style.transform = transform;
      el.style.opacity = opacity;
    };
    const els = labels.current;
    if (els) {
      for (const [id, obj] of Object.entries(anchors.current)) {
        const el = els[id];
        if (!obj || !el) continue;
        tmp.setFromMatrixPosition(obj.matrixWorld).project(state.camera);
        const x = ((tmp.x + 1) / 2) * state.size.width;
        const y = ((1 - tmp.y) / 2) * state.size.height;
        if (id.startsWith("tag:")) {
          // Layer tags hang just below the front edge of the layer and show while it's in focus.
          const layer = id.slice(4) as LayerId;
          const f = focusAt(story.current.cf, layer) * story.current.e;
          write(id, el, `translate3d(${x.toFixed(0)}px, ${y.toFixed(0)}px, 0) translate(-50%, 10px)`, f > 0.45 ? "1" : "0");
        } else {
          write(id, el, `translate3d(${x.toFixed(0)}px, ${y.toFixed(0)}px, 0) translate(-50%, -100%)`, hover === id || selected === id ? "1" : "0");
        }
      }
    }
  });

  return (
    <StoryCtx.Provider value={story}>
    <AnchorCtx.Provider value={anchors}>
    <CompactCtx.Provider value={compact}>
      {/* A solid background (same colour as the page) so the glass parts blend inside the scene.
          Against the see-through canvas they darkened the page behind them instead. */}
      <color attach="background" args={["#0f131a"]} />
      <Backlight />
      <ambientLight intensity={0.55} />
      {/* Rim light from behind: makes the clear edges glow against the dark background. */}
      <pointLight position={[0, 4, -6]} intensity={70} color="#bcd4ff" />
      <directionalLight position={[3, 7, 5]} intensity={2.3} color="#f3f6ff" />
      {!compact && (
        <>
          <pointLight position={[-5, 3, -3]} intensity={30} color="#8ab4ff" />
          <pointLight position={[5, -2, 4]} intensity={12} color="#ffd9b0" />
        </>
      )}
      <Warmup />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 6, 3]} scale={[9, 1.5, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.5} position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} color="#cfe0ff" />
        <Lightformer form="rect" intensity={1.1} position={[6, 0, 1]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} color="#ffe2c4" />
      </Environment>

      <group ref={frame} position={compact ? [0, 0.05, 0] : [1.75, -0.05, 0]} scale={compact ? 1.0 : 0.92}>
        <mesh ref={shadow} position={[0, -1.55, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[W * 1.5, D * 1.4]} />
          <meshBasicMaterial map={shadowTex} color="#000000" transparent opacity={0.5} depthWrite={false} />
        </mesh>
        <group ref={root} onPointerMissed={() => clicked() && onSelect(null)}>
          <Layer id="case">
            <BottomCase quality={quality} />
          </Layer>
          <Layer id="battery" frame={[2.7, 0.8]} subject={[0, 0.04, 0.35]} tag={[0, 0.0, 0.74]}>
            <Battery />
          </Layer>
          <Layer id="board" frame={[W - 0.3, D - 0.4]} subject={[0, 0.05, -0.05]} tag={[0, 0.0, (D - 0.4) / 2]}>
            <Board
              selected={selected}
              hover={hover}
              setHover={setHover}
              anchors={anchors}
              onChip={(slug) => clicked() && onSelect(selected === slug ? null : slug)}
              reducedMotion={reducedMotion}
            />
          </Layer>
          <Layer id="ram" frame={[3.0, 0.42]} frameZ={0.5} subject={[0, 0.02, 0.5]} tag={[0, 0.0, 0.66]}>
            <Ram />
          </Layer>
          <Layer id="keyboard" frame={[W - 0.2, D - 0.2]} subject={[0, 0.06, -0.1]} tag={[0, 0.0, D / 2]}>
            <Keyboard quality={quality} onKey={(gi) => clicked() && onKey(gi)} />
          </Layer>
          <Lid quality={quality} reducedMotion={reducedMotion} />
          <LeftoverScrew />
        </group>
      </group>
    </CompactCtx.Provider>
    </AnchorCtx.Provider>
    </StoryCtx.Provider>
  );
}

/**
 * Prepares every shader on the GPU right after the scene appears, instead of the first time
 * something becomes visible mid-scroll (which shows up as a stutter).
 */
function Warmup() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    const id = requestAnimationFrame(() => gl.compile(scene, camera));
    return () => cancelAnimationFrame(id);
  }, [gl, scene, camera]);
  return null;
}

/** Soft blue glow behind the laptop. Follows the camera's direction so it always sits behind the subject. */
function Backlight() {
  const ref = useRef<THREE.Mesh>(null);
  const tex = useDisposable(radialTexture, []);
  const camera = useThree((s) => s.camera);
  const dir = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    if (!ref.current) return;
    camera.getWorldDirection(dir);
    ref.current.position.copy(camera.position).addScaledVector(dir, 22);
    ref.current.quaternion.copy(camera.quaternion);
  });
  return (
    <mesh ref={ref} renderOrder={-1} raycast={() => null}>
      <planeGeometry args={[30, 22]} />
      <meshBasicMaterial map={tex} color="#2a3f66" transparent opacity={0.55} depthWrite={false} depthTest={false} />
    </mesh>
  );
}

/** Positions a layer from the story state: moves up when exploded, forward when in focus. */
function Layer({
  id,
  frame,
  frameZ = 0,
  subject,
  tag,
  children,
}: {
  id: LayerId | "case";
  frame?: [number, number];
  frameZ?: number;
  subject?: [number, number, number];
  tag?: [number, number, number];
  children: React.ReactNode;
}) {
  const story = useContext(StoryCtx);
  const anchors = useContext(AnchorCtx);
  const compact = useContext(CompactCtx);
  const ref = useRef<THREE.Group>(null);
  const lineRef = useRef<{ material: THREE.Material & { opacity: number } } | null>(null);
  const cfg = LAYERS[id];

  useFrame(() => {
    const s = story.current;
    if (!ref.current || !s) return;
    const f = id === "case" ? 0 : focusAt(s.cf, id as LayerId) * s.e;
    ref.current.position.set(0, cfg.y + cfg.up * s.e + f * 0.08, f * 0.45);
    if (lineRef.current) lineRef.current.material.opacity = f * 0.9;
  });

  const pts = frame
    ? ([
        [-frame[0] / 2, 0.06, frameZ - frame[1] / 2],
        [frame[0] / 2, 0.06, frameZ - frame[1] / 2],
        [frame[0] / 2, 0.06, frameZ + frame[1] / 2],
        [-frame[0] / 2, 0.06, frameZ + frame[1] / 2],
        [-frame[0] / 2, 0.06, frameZ - frame[1] / 2],
      ] as [number, number, number][])
    : null;

  return (
    <group ref={ref}>
      {children}
      {subject && (
        <object3D
          position={subject}
          ref={(o) => {
            if (anchors.current) anchors.current[`subject:${id}`] = o;
          }}
        />
      )}
      {tag && (
        <object3D
          position={tag}
          ref={(o) => {
            if (anchors.current) anchors.current[`tag:${id}`] = o;
          }}
        />
      )}
      {pts && !compact && (
        <Line
          // @ts-expect-error drei's Line ref type is loose; we only touch material.opacity
          ref={lineRef}
          points={pts}
          color="#6fd6c2"
          lineWidth={1.6}
          transparent
          opacity={0}
          depthWrite={false}
        />
      )}
    </group>
  );
}

/**
 * A clear plastic part, drawn like glass in a technical drawing: a faint tint and glowing edges.
 * (A reflective plastic material looked like grey slabs here: its reflections stay bright even
 * when the part is almost fully transparent.)
 */
function ClearPlate({
  args,
  radius,
  position,
  quality,
}: {
  args: [number, number, number];
  radius: number;
  position?: [number, number, number];
  quality: Quality;
}) {
  return (
    <group position={position}>
      <RoundedBox args={args} radius={radius} smoothness={quality === "high" ? 4 : 3}>
        {/* Additive: the glass adds a little light instead of darkening what's behind it. */}
        <meshBasicMaterial color="#8fb0e8" transparent opacity={0.07} depthWrite={false} blending={THREE.AdditiveBlending} />
        <Edges threshold={20} color="#f2f7ff" transparent opacity={0.95} />
      </RoundedBox>
    </group>
  );
}

function BottomCase({ quality }: { quality: Quality }) {
  const screws: [number, number][] = [
    [-W / 2 + 0.18, -D / 2 + 0.18],
    [W / 2 - 0.18, -D / 2 + 0.18],
    [-W / 2 + 0.18, D / 2 - 0.18],
    [W / 2 - 0.18, D / 2 - 0.18],
  ];
  return (
    <>
      <ClearPlate args={[W, 0.08, D]} radius={0.04} quality={quality} />
      {screws.map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.045, z]}>
          <cylinderGeometry args={[0.05, 0.05, 0.02, 16]} />
          <meshStandardMaterial color="#b9bec7" metalness={1} roughness={0.3} />
        </mesh>
      ))}
    </>
  );
}

function Battery() {
  const story = useContext(StoryCtx);
  const exp = site.experience[0];
  const tex = useDisposable(
    () => batteryTexture([exp ? "INTERNSHIP" : "BATTERY", exp?.org.toUpperCase().slice(0, 34) ?? "", exp?.period ?? ""]),
    [exp],
  );
  const segs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  useFrame(() => {
    // The charge bar fills up while the battery is in focus.
    const s = story.current;
    if (!s) return;
    const f = focusAt(s.cf, "battery") * s.e;
    segs.current.forEach((m, i) => {
      if (m) m.emissiveIntensity = f * 6 > i ? 2.2 : 0.15;
    });
  });
  return (
    <group position={[0, 0, 0.35]}>
      <mesh>
        <boxGeometry args={[2.6, 0.07, 0.72]} />
        <meshStandardMaterial color="#1a1d24" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.0355, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[2.6, 0.72]} />
        <meshStandardMaterial map={tex} roughness={0.6} />
      </mesh>
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[0.55 + i * 0.12, 0.04, -0.2]}>
          <boxGeometry args={[0.09, 0.02, 0.12]} />
          <meshStandardMaterial
            ref={(m) => {
              segs.current[i] = m;
            }}
            color="#1f3d33"
            emissive="#86efac"
            emissiveIntensity={0.15}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function Board({
  selected,
  hover,
  setHover,
  anchors,
  onChip,
  reducedMotion,
}: {
  selected: string | null;
  hover: string | null;
  setHover: (s: string | null) => void;
  anchors: React.RefObject<Record<string, THREE.Object3D | null>>;
  onChip: (slug: string) => void;
  reducedMotion: boolean;
}) {
  const tex = useDisposable(pcbTexture, []);
  const list = projects.slice(0, 5);
  return (
    <group>
      <mesh>
        <boxGeometry args={[W - 0.3, 0.04, D - 0.4]} />
        <meshStandardMaterial map={tex} roughness={0.55} metalness={0.15} />
      </mesh>
      {list.map((p, i) => (
        <Chip
          key={p.slug}
          x={-1.24 + i * 0.62}
          z={-0.25}
          name={p.name}
          metric={p.metric}
          hue={p.hue}
          active={hover === p.slug || selected === p.slug}
          anchor={(o) => {
            if (anchors.current) anchors.current[p.slug] = o;
          }}
          onHover={(on) => setHover(on ? p.slug : null)}
          onClick={() => onChip(p.slug)}
        />
      ))}
      <Fan reducedMotion={reducedMotion} />
    </group>
  );
}

function Chip({
  x,
  z,
  name,
  metric,
  hue,
  active,
  anchor,
  onHover,
  onClick,
}: {
  x: number;
  z: number;
  name: string;
  metric: string;
  hue: string;
  active: boolean;
  anchor: (o: THREE.Object3D | null) => void;
  onHover: (on: boolean) => void;
  onClick: () => void;
}) {
  const w = 0.52;
  const d = 0.42;
  const lift = useRef<THREE.Group>(null);
  const led = useRef<THREE.MeshStandardMaterial>(null);
  const tex = useDisposable(() => chipTexture(name, metric), [name, metric]);
  useFrame((_, dt) => {
    if (lift.current) lift.current.position.y = THREE.MathUtils.damp(lift.current.position.y, active ? 0.12 : 0, 10, dt);
    if (led.current) led.current.emissiveIntensity = THREE.MathUtils.damp(led.current.emissiveIntensity, active ? 4 : 1.6, 8, dt);
  });
  return (
    <group position={[x, 0.06, z]}>
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
          <boxGeometry args={[w, 0.07, d]} />
          <meshStandardMaterial color="#15171c" roughness={0.45} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.0355, 0]} rotation-x={-Math.PI / 2} raycast={() => null}>
          <planeGeometry args={[w, d]} />
          <meshStandardMaterial map={tex} roughness={0.5} />
        </mesh>
        <mesh position={[w / 2 - 0.05, 0.05, -d / 2 - 0.07]}>
          <sphereGeometry args={[0.03, 12, 12]} />
          <meshStandardMaterial ref={led} color={hue} emissive={hue} emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
        <object3D ref={anchor} position={[0, 0.2, 0]} />
      </group>
    </group>
  );
}

function Fan({ reducedMotion }: { reducedMotion: boolean }) {
  const rotor = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (rotor.current && !reducedMotion) rotor.current.rotation.y += dt * 9;
  });
  return (
    <group position={[1.2, 0.05, -0.68]}>
      <mesh rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.2, 0.025, 8, 32]} />
        <meshStandardMaterial color="#1c1f26" roughness={0.5} />
      </mesh>
      <group ref={rotor}>
        {Array.from({ length: 7 }).map((_, i) => (
          <mesh key={i} rotation-y={(i / 7) * Math.PI * 2}>
            <boxGeometry args={[0.03, 0.01, 0.34]} />
            <meshStandardMaterial color="#3a4150" roughness={0.4} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Ram() {
  const years = useMemo(btechYears, []);
  const n = years.length;
  const textures = useDisposable(() => years.map((y) => ramTexture(`YEAR ${y.n}`, y.current ? "NOW" : y.range, y.current)), [years]);
  return (
    <group position={[0, 0, 0.5]}>
      {years.map((y, i) => {
        const x = (i - (n - 1) / 2) * 0.76;
        return (
          <group key={y.n} position={[x, 0, 0]}>
            <mesh>
              <boxGeometry args={[0.7, 0.025, 0.3]} />
              <meshStandardMaterial color="#0e3a2f" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.0135, 0]} rotation-x={-Math.PI / 2}>
              <planeGeometry args={[0.7, 0.3]} />
              <meshStandardMaterial
                map={textures[i]}
                roughness={0.55}
                emissive={y.current ? "#6fd6c2" : "#000000"}
                emissiveIntensity={y.current ? 0.12 : 0}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// Skill keys flow across rows like words in a paragraph; key width follows the label length.
function useKeyLayout() {
  return useMemo(() => {
    const keys: { label: string; group: number; x: number; z: number; w: number }[] = [];
    const maxW = 3.05;
    const gap = 0.05;
    const rowH = 0.27;
    let row: typeof keys = [];
    let rowW = 0;
    let z = -0.78;
    const flush = () => {
      let x = -rowW / 2;
      row.forEach((k) => {
        k.x = x + k.w / 2;
        k.z = z;
        x += k.w + gap;
      });
      keys.push(...row);
      row = [];
      rowW = 0;
      z += rowH;
    };
    site.stack.forEach((g, gi) =>
      g.items.forEach((label) => {
        const w = Math.min(1.05, Math.max(0.34, 0.16 + label.length * 0.052));
        if (rowW + w + (row.length ? gap : 0) > maxW) flush();
        rowW += w + (row.length ? gap : 0);
        row.push({ label, group: gi, x: 0, z: 0, w });
      }),
    );
    if (row.length) flush();
    return keys;
  }, []);
}

function Keyboard({ quality, onKey }: { quality: Quality; onKey: (group: number) => void }) {
  const keys = useKeyLayout();
  return (
    <group>
      {/* Top case (clear) */}
      <ClearPlate args={[W, 0.05, D]} radius={0.025} quality={quality} />
      <KeyCaps keys={keys} onKey={onKey} />
      {/* Trackpad */}
      <mesh position={[0, 0.03, 0.78]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[1.15, 0.5]} />
        <meshPhysicalMaterial color="#2a303c" roughness={0.25} transparent opacity={0.75} clearcoat={1} />
      </mesh>
    </group>
  );
}

const KEY_Y = 0.055; // keycap centre height above the top case
const KEY_H = 0.06; // keycap thickness
const KEY_D = 0.22; // keycap depth

/**
 * All skill keys in two GPU draw calls: one instanced mesh for the keycaps (each instance
 * scaled to its key's width) and one merged mesh for every label, textured from a shared atlas.
 * A pressed key dips by moving its instance and its four label vertices.
 */
function KeyCaps({
  keys,
  onKey,
}: {
  keys: { label: string; group: number; x: number; z: number; w: number }[];
  onKey: (group: number) => void;
}) {
  const caps = useRef<THREE.InstancedMesh>(null);
  const pressed = useRef<number[]>(keys.map(() => 0));
  const m = useMemo(() => new THREE.Matrix4(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const scl = useMemo(() => new THREE.Vector3(), []);
  const quat = useMemo(() => new THREE.Quaternion(), []);

  const { texture, labels } = useDisposable(() => {
    const atlas = keyAtlas(keys.map((k) => ({ label: k.label, w: k.w, color: groupColors[k.group % groupColors.length] })));
    // One flat quad per key, lying on top of its keycap, facing up.
    const positions = new Float32Array(keys.length * 4 * 3);
    const uvs = new Float32Array(keys.length * 4 * 2);
    const index: number[] = [];
    const top = KEY_Y + KEY_H / 2 + 0.0008;
    keys.forEach((k, i) => {
      const { u0, u1, v0, v1 } = atlas.uv[i];
      const x0 = k.x - k.w / 2;
      const x1 = k.x + k.w / 2;
      const zb = k.z - KEY_D / 2; // back edge (top of the label)
      const zf = k.z + KEY_D / 2; // front edge
      positions.set([x0, top, zf, x1, top, zf, x1, top, zb, x0, top, zb], i * 12);
      uvs.set([u0, v0, u1, v0, u1, v1, u0, v1], i * 8);
      const o = i * 4;
      index.push(o, o + 1, o + 2, o, o + 2, o + 3);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(index);
    geo.computeVertexNormals();
    return { texture: atlas.texture, labels: geo };
  }, [keys]);

  const setKey = (i: number, dip: number) => {
    const k = keys[i];
    m.compose(pos.set(k.x, KEY_Y - dip, k.z), quat, scl.set(k.w, 1, 1));
    caps.current?.setMatrixAt(i, m);
    const p = labels.getAttribute("position") as THREE.BufferAttribute;
    const top = KEY_Y + KEY_H / 2 + 0.0008 - dip;
    for (let v = 0; v < 4; v++) p.setY(i * 4 + v, top);
  };

  useLayoutEffect(() => {
    keys.forEach((_, i) => setKey(i, 0));
    if (caps.current) caps.current.instanceMatrix.needsUpdate = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys]);

  useFrame((_, dt) => {
    let changed = false;
    pressed.current.forEach((p, i) => {
      if (p <= 0) return;
      const next = Math.max(0, p - dt * 4);
      pressed.current[i] = next;
      setKey(i, Math.sin(next * Math.PI) * 0.03);
      changed = true;
    });
    if (changed && caps.current) {
      caps.current.instanceMatrix.needsUpdate = true;
      labels.getAttribute("position").needsUpdate = true;
    }
  });

  return (
    <>
      <instancedMesh
        ref={caps}
        args={[undefined, undefined, keys.length]}
        onPointerOver={(e) => {
          e.stopPropagation();
          pointer(true);
        }}
        onPointerOut={() => pointer(false)}
        onClick={(e) => {
          e.stopPropagation();
          const i = e.instanceId;
          if (i === undefined) return;
          pressed.current[i] = 1;
          onKey(keys[i].group);
        }}
      >
        <boxGeometry args={[1, KEY_H, KEY_D]} />
        <meshStandardMaterial color="#1b1e25" roughness={0.6} />
      </instancedMesh>
      <mesh geometry={labels} raycast={() => null}>
        <meshStandardMaterial map={texture} roughness={0.6} polygonOffset polygonOffsetFactor={-1} />
      </mesh>
    </>
  );
}

function Lid({ quality, reducedMotion }: { quality: Quality; reducedMotion: boolean }) {
  const story = useContext(StoryCtx);
  const anchors = useContext(AnchorCtx);
  const hinge = useRef<THREE.Group>(null);
  const screenMat = useRef<THREE.MeshBasicMaterial>(null);
  const open = useRef(reducedMotion ? 1 : 0);
  const lastChapter = useRef(-1);
  const seenBoot = useRef(0);
  const textures = useDisposable(() => chapters.map((c) => screenTexture(c.screen)), []);
  const gl = useThree((st) => st.gl);
  // Upload every chapter's screen image to the GPU now, not when it first appears mid-scroll.
  useEffect(() => {
    textures.forEach((t) => gl.initTexture(t));
  }, [gl, textures]);
  const note = useDisposable(() => noteTexture(["it worked on", "my machine,", "I promise."]), []);
  const cfg = LAYERS.lid;
  const H = H_LID;

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30);
    const s = story.current;
    if (!hinge.current || !s) return;
    // The lid swings open on load, and again after "Take it apart again".
    if (s.boot !== seenBoot.current) {
      seenBoot.current = s.boot;
      if (!reducedMotion) open.current = 0;
    }
    open.current = Math.min(1, open.current + dt / 1.4);
    const o = 1 - Math.pow(1 - open.current, 3);
    const f = focusAt(s.cf, "lid") * s.e;
    hinge.current.position.set(0, cfg.y + cfg.up * s.e + f * 0.05, -D / 2 - 0.25 * s.e + f * 0.4);
    hinge.current.rotation.x = THREE.MathUtils.lerp(Math.PI / 2, -0.2, o) - 0.25 * s.e;

    const ch = Math.min(chapters.length - 1, Math.max(0, Math.floor(s.cf)));
    if (ch !== lastChapter.current && screenMat.current) {
      lastChapter.current = ch;
      // Swapping one texture for another needs no material rebuild (needsUpdate would recompile).
      screenMat.current.map = textures[ch];
    }
  });

  return (
    <group ref={hinge}>
      {/* Back shell (clear) */}
      <ClearPlate args={[W, H, 0.07]} radius={0.04} position={[0, H / 2, -0.01]} quality={quality} />
      <object3D
        position={[0, H / 2, 0.03]}
        ref={(o) => {
          if (anchors.current) anchors.current["subject:lid"] = o;
        }}
      />
      <object3D
        position={[0, -0.12, 0.05]}
        ref={(o) => {
          if (anchors.current) anchors.current["tag:lid"] = o;
        }}
      />
      {/* Bezel */}
      <mesh position={[0, H / 2, 0.03]}>
        <planeGeometry args={[W - 0.08, H - 0.08]} />
        <meshStandardMaterial color="#111318" roughness={0.6} />
      </mesh>
      {/* Screen */}
      <mesh position={[0, H / 2 + 0.03, 0.033]}>
        <planeGeometry args={[W - 0.34, H - 0.36]} />
        <meshBasicMaterial ref={screenMat} map={textures[0]} toneMapped={false} />
      </mesh>
      {/* Webcam */}
      <mesh position={[0, H - 0.08, 0.034]}>
        <circleGeometry args={[0.02, 12]} />
        <meshBasicMaterial color="#2c3340" />
      </mesh>
      {/* Hinge */}
      <mesh rotation-z={Math.PI / 2} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.045, W - 0.6, 16]} />
        <meshStandardMaterial color="#2a2f39" metalness={0.6} roughness={0.35} />
      </mesh>
      {/* Your sticky note, stuck on the bezel */}
      <mesh position={[W / 2 - 0.42, 0.52, 0.05]} rotation-z={0.1}>
        <planeGeometry args={[0.72, 0.72]} />
        <meshLambertMaterial map={note} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** The screw that didn't make it back in. Appears once the laptop is reassembled. Poke it. */
function LeftoverScrew() {
  const story = useContext(StoryCtx);
  const ref = useRef<THREE.Group>(null);
  const spin = useRef(0);
  useFrame((_, dt) => {
    const s = story.current;
    if (!ref.current || !s) return;
    const show = Math.max(0, Math.min(1, (s.cf - (chapters.length - 1.05)) * 4));
    ref.current.visible = show > 0.01;
    ref.current.scale.setScalar(show);
    spin.current = Math.max(0, spin.current - dt * 1.5);
    ref.current.rotation.y += spin.current * dt * 18;
    ref.current.position.x = W / 2 + 0.55 + Math.sin(spin.current * 3) * 0.08;
  });
  return (
    <group ref={ref} position={[W / 2 + 0.55, 0.0, D / 2 - 0.1]} visible={false}>
      <mesh
        rotation-z={Math.PI / 2}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          pointer(true);
        }}
        onPointerOut={() => pointer(false)}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          spin.current = 1;
        }}
      >
        <cylinderGeometry args={[0.025, 0.025, 0.2, 12]} />
        <meshStandardMaterial color="#c9ccd2" metalness={1} roughness={0.25} />
      </mesh>
      <mesh position={[-0.11, 0, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.06, 0.06, 0.03, 16]} />
        <meshStandardMaterial color="#c9ccd2" metalness={1} roughness={0.25} />
      </mesh>
    </group>
  );
}
