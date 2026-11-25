"use client";

import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Environment, Float, Lightformer, Line, OrbitControls, PerformanceMonitor } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { buildSpace, type ProjectNode, type SkillNode, type Vec3 } from "./layout";

type Focus = { kind: "project" | "skill"; id: string } | null;

// "high": real glass refraction + bloom (desktops with decent GPUs).
// "low": cheap glass + additive halos, no post-processing (phones, weak GPUs, or when FPS drops).
type Quality = "high" | "low";

function initialQuality(compact: boolean): Quality {
  if (typeof window === "undefined") return "low";
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency ?? 4;
  return compact || coarse || cores <= 4 ? "low" : "high";
}

export type LatentSpaceProps = {
  selected: string | null;
  onSelect: (slug: string | null) => void;
  reducedMotion: boolean;
  compact: boolean; // small screens: fewer particles, centred scene
  // DOM label elements (rendered by Hero, outside the canvas), keyed by node id.
  labels: React.RefObject<Record<string, HTMLElement | null>>;
};

export default function LatentSpace(props: LatentSpaceProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const [quality, setQuality] = useState<Quality>(() => initialQuality(props.compact));
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);

  // Stop rendering entirely when the hero is scrolled out of view or the tab is hidden.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    const vis = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", vis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);

  return (
    <div ref={wrap} className="h-full w-full">
      <Canvas
        camera={{ position: [0, 0, props.compact ? 10.5 : 8.2], fov: 45 }}
        dpr={quality === "high" ? [1, 1.5] : [1, 1.25]}
        frameloop={onScreen && tabVisible ? "always" : "never"}
        gl={{ antialias: quality === "high", alpha: true, powerPreference: "high-performance", stencil: false }}
        fallback={null}
      >
        {/* If the frame rate drops, switch to the cheaper look for the rest of the visit. */}
        <PerformanceMonitor flipflops={1} onDecline={() => setQuality("low")} />
        <Scene {...props} quality={quality} />
      </Canvas>
    </div>
  );
}

function Scene({ selected, onSelect, reducedMotion, compact, labels, quality }: LatentSpaceProps & { quality: Quality }) {
  const { projectNodes, skillNodes, edges } = useMemo(buildSpace, []);
  const [hover, setHover] = useState<Focus>(null);
  const [skillFocus, setSkillFocus] = useState<string | null>(null);

  // What is "lit up": a hovered/selected project and its skills, or a hovered/clicked skill and its projects.
  const focus: Focus =
    hover ?? (skillFocus ? { kind: "skill", id: skillFocus } : selected ? { kind: "project", id: selected } : null);
  const isLit = (kind: "project" | "skill", id: string, skillProjects: string[] = []) => {
    if (!focus) return true;
    if (focus.kind === "project") {
      return kind === "project" ? id === focus.id : skillProjects.includes(focus.id);
    }
    const s = skillNodes.find((n) => n.id === focus.id);
    return kind === "skill" ? id === focus.id : !!s?.projects.includes(id);
  };

  // Label anchors: empty objects placed under each orb; we project them to screen space every frame.
  const anchorsRef = useRef<Record<string, THREE.Object3D | null>>({});
  const register = (id: string) => (o: THREE.Object3D | null) => {
    anchorsRef.current[id] = o;
  };
  const v = useMemo(() => new THREE.Vector3(), []);
  const labelOpacity = (id: string) => {
    const p = projectNodes.find((n) => n.id === id);
    if (p) return isLit("project", id) ? 1 : 0.25;
    const s = skillNodes.find((n) => n.id === id)!;
    const shown =
      hover?.id === id || skillFocus === id || (!!focus && focus.kind === "project" && s.projects.includes(focus.id));
    return shown ? 1 : 0;
  };
  useFrame(({ camera, size }) => {
    const els = labels.current;
    if (!els) return;
    for (const [id, obj] of Object.entries(anchorsRef.current)) {
      const el = els[id];
      if (!obj || !el) continue;
      v.setFromMatrixPosition(obj.matrixWorld).project(camera);
      const x = ((v.x + 1) / 2) * size.width;
      const y = ((1 - v.y) / 2) * size.height;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      el.style.opacity = v.z > 1 ? "0" : String(labelOpacity(id));
    }
  });

  return (
    <>
      <color attach="background" args={["#0f131a"]} />
      <fog attach="fog" args={["#0f131a", 9, 18]} />
      <ambientLight intensity={0.35} />
      <pointLight position={[4, 5, 6]} intensity={40} color="#cfe9ff" />
      <pointLight position={[-6, -3, -4]} intensity={25} color="#b39dff" />

      {/* Reflections for the glass, built from local light panels (no downloads). */}
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[0, 4, -6]} scale={[10, 2, 1]} color="#dbeafe" />
        <Lightformer form="rect" intensity={1.4} position={[-6, 0, 2]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} color="#c4b5fd" />
        <Lightformer form="ring" intensity={1.8} position={[5, 1, 3]} scale={2.5} color="#99f6e4" />
      </Environment>

      <group
        position={compact ? [0, 0.1, 0] : [1.35, 0.15, 0]}
        scale={compact ? 0.78 : 1}
        onPointerMissed={() => {
          setSkillFocus(null);
          onSelect(null);
        }}
      >
        <Dust count={quality === "low" ? 260 : 650} />

        {edges.map((e) => {
          const lit = focus && isLit("skill", e.skill, [e.project]) && isLit("project", e.project);
          return (
            <Line
              key={e.skill + e.project}
              points={[e.from, e.to]}
              color={e.hue}
              lineWidth={lit ? 1.4 : 0.8}
              transparent
              opacity={focus ? (lit ? 0.75 : 0.06) : 0.22}
            />
          );
        })}

        {skillNodes.map((s) => (
          <SkillOrb
            key={s.id}
            node={s}
            anchor={register(s.id)}
            lit={isLit("skill", s.id, s.projects)}
            showLabel={
              hover?.id === s.id ||
              skillFocus === s.id ||
              (!!focus && focus.kind === "project" && s.projects.includes(focus.id))
            }
            onHover={(on) => setHover(on ? { kind: "skill", id: s.id } : null)}
            onClick={() => {
              onSelect(null);
              setSkillFocus((f) => (f === s.id ? null : s.id));
            }}
          />
        ))}

        {projectNodes.map((p) => (
          <ProjectOrb
            key={p.id}
            node={p}
            anchor={register(p.id)}
            lit={isLit("project", p.id)}
            active={selected === p.id || hover?.id === p.id}
            reducedMotion={reducedMotion}
            quality={quality}
            onHover={(on) => setHover(on ? { kind: "project", id: p.id } : null)}
            onClick={() => {
              setSkillFocus(null);
              onSelect(selected === p.id ? null : p.id);
            }}
          />
        ))}
      </group>

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        autoRotate={!reducedMotion && !hover && !selected && !skillFocus}
        autoRotateSpeed={0.45}
        minPolarAngle={Math.PI * 0.25}
        maxPolarAngle={Math.PI * 0.75}
      />

      {quality === "high" && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={0.75} luminanceThreshold={0.75} luminanceSmoothing={0.2} />
        </EffectComposer>
      )}
    </>
  );
}

function useHoverCursor() {
  return {
    over: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      document.body.style.cursor = "pointer";
    },
    out: () => {
      document.body.style.cursor = "";
    },
  };
}

function ProjectOrb({
  node,
  anchor,
  lit,
  active,
  reducedMotion,
  quality,
  onHover,
  onClick,
}: {
  node: ProjectNode;
  anchor: (o: THREE.Object3D | null) => void;
  lit: boolean;
  active: boolean;
  reducedMotion: boolean;
  quality: Quality;
  onHover: (on: boolean) => void;
  onClick: () => void;
}) {
  const halo = useRef<THREE.SpriteMaterial>(null);
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.MeshBasicMaterial>(null);
  const glow = useRef(1.5);
  const cursor = useHoverCursor();
  const color = useMemo(() => new THREE.Color(node.hue), [node.hue]);

  useFrame((_, dt) => {
    if (!group.current || !core.current) return;
    const target = active ? 1.22 : 1;
    const s = THREE.MathUtils.damp(group.current.scale.x, target, 8, dt);
    group.current.scale.setScalar(s);
    // Core brightness drives the bloom glow; dim when another cluster is in focus.
    glow.current = THREE.MathUtils.damp(glow.current, lit ? (active ? 2.6 : 1.5) : 0.3, 6, dt);
    core.current.color.copy(color).multiplyScalar(glow.current);
    if (halo.current) halo.current.opacity = Math.min(0.9, glow.current * 0.28);
  });

  return (
    <Float
      speed={reducedMotion ? 0 : 1.2}
      rotationIntensity={0}
      floatIntensity={reducedMotion ? 0 : 0.6}
      floatingRange={[-0.08, 0.08]}
    >
      <group ref={group} position={node.pos}>
        {/* Outer glass shell */}
        <mesh
          onPointerOver={(e) => {
            cursor.over(e);
            onHover(true);
          }}
          onPointerOut={() => {
            cursor.out();
            onHover(false);
          }}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <sphereGeometry args={[0.46, quality === "high" ? 48 : 28, quality === "high" ? 48 : 28]} />
          {quality === "high" ? (
            <meshPhysicalMaterial
              transmission={1}
              thickness={0.55}
              roughness={0.04}
              ior={1.45}
              clearcoat={1}
              clearcoatRoughness={0.05}
              iridescence={0.55}
              iridescenceIOR={1.3}
              attenuationColor={node.hue}
              attenuationDistance={3.2}
              color="#ffffff"
              envMapIntensity={1.2}
              transparent
              opacity={lit ? 1 : 0.35}
            />
          ) : (
            // Cheap glass: a thin, mostly transparent shell that only shows reflections.
            <meshPhysicalMaterial
              color={node.hue}
              roughness={0.05}
              clearcoat={1}
              clearcoatRoughness={0.05}
              envMapIntensity={1.6}
              transparent
              depthWrite={false}
              opacity={lit ? 0.22 : 0.08}
            />
          )}
        </mesh>
        {/* Glowing core */}
        <mesh>
          <sphereGeometry args={[0.11, 16, 16]} />
          <meshBasicMaterial ref={core} toneMapped={false} />
        </mesh>
        {/* Without bloom, a soft additive halo fakes the glow for almost no cost. */}
        {quality === "low" && (
          <sprite scale={1.5}>
            <spriteMaterial ref={halo} map={haloTexture()} color={node.hue} blending={THREE.AdditiveBlending} depthWrite={false} transparent />
          </sprite>
        )}
        <object3D ref={anchor} position={[0, -0.74, 0]} />
      </group>
    </Float>
  );
}

function SkillOrb({
  node,
  anchor,
  lit,
  showLabel,
  onHover,
  onClick,
}: {
  node: SkillNode;
  anchor: (o: THREE.Object3D | null) => void;
  lit: boolean;
  showLabel: boolean;
  onHover: (on: boolean) => void;
  onClick: () => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const cursor = useHoverCursor();
  const shared = node.projects.length > 1;

  useFrame((_, dt) => {
    if (!ref.current) return;
    const target = showLabel ? 1.5 : 1;
    ref.current.scale.setScalar(THREE.MathUtils.damp(ref.current.scale.x, target, 10, dt));
  });

  return (
    <group position={node.pos as Vec3}>
      <mesh
        ref={ref}
        onPointerOver={(e) => {
          cursor.over(e);
          onHover(true);
        }}
        onPointerOut={() => {
          cursor.out();
          onHover(false);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <sphereGeometry args={[shared ? 0.13 : 0.1, 16, 16]} />
        <meshPhysicalMaterial
          color={node.hue}
          emissive={node.hue}
          emissiveIntensity={lit ? 0.55 : 0.05}
          roughness={0.25}
          clearcoat={1}
          transparent
          opacity={lit ? 1 : 0.3}
        />
      </mesh>
      <object3D ref={anchor} position={[0, 0.27, 0]} />
    </group>
  );
}

// Faint background points, like the rest of the embedding space.
function Dust({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    let s = 7;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < count; i++) {
      const r = 3 + rnd() * 7;
      const t = rnd() * Math.PI * 2;
      const p = Math.acos(2 * rnd() - 1);
      arr.set([r * Math.sin(p) * Math.cos(t), r * Math.sin(p) * Math.sin(t), r * Math.cos(p)], i * 3);
    }
    return arr;
  }, [count]);

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#8a93a3" transparent opacity={0.55} sizeAttenuation depthWrite={false} />
    </points>
  );
}

// One shared radial-gradient texture for every halo, created once.
let _halo: THREE.Texture | null = null;
function haloTexture() {
  if (_halo) return _halo;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.18, "rgba(255,255,255,0.55)");
  g.addColorStop(0.45, "rgba(255,255,255,0.12)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  _halo = new THREE.CanvasTexture(c);
  return _halo;
}
