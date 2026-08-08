import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import type { Group, Mesh, Points } from "three";

/**
 * True-3D hero centerpiece — an "AI orb": emissive core inside a glass shell,
 * orbiting wireframe + torus rings, and a particle halo. Auto-rotates and bobs
 * (Float). Lazy-loaded by the Landing page so `three` only downloads when the
 * hero renders. Pauses (frameloop="demand") when scrolled off-screen and when
 * prefers-reduced-motion is set.
 */

function useAutoRotate(ref: { current: Group | Mesh | null }, speed = 0.1) {
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * speed;
  });
}

function Core() {
  const inner = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (inner.current) inner.current.rotation.y -= delta * 0.18;
  });

  return (
    <group>
      {/* Emissive energy core */}
      <mesh ref={inner}>
        <sphereGeometry args={[0.85, 48, 48]} />
        <meshStandardMaterial
          color="#00523a"
          emissive="#90d5b5"
          emissiveIntensity={0.85}
          roughness={0.35}
        />
      </mesh>
      {/* Glass shell */}
      <mesh scale={1.28}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshPhysicalMaterial
          transparent
          opacity={0.2}
          roughness={0.12}
          metalness={0.05}
          clearcoat={1}
          clearcoatRoughness={0.15}
          color="#c9f7e0"
          side={THREE.FrontSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function Wireframe() {
  const g = useRef<Group>(null);
  useAutoRotate(g, -0.1);

  return (
    <group ref={g}>
      <mesh>
        <icosahedronGeometry args={[1.75, 1]} />
        <meshBasicMaterial color="#fe924e" wireframe transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function Rings() {
  const a = useRef<Mesh>(null);
  const b = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (a.current) a.current.rotation.z += delta * 0.22;
    if (b.current) b.current.rotation.z -= delta * 0.16;
  });

  return (
    <group>
      <mesh ref={a} rotation={[Math.PI / 2.2, 0, 0]}>
        <torusGeometry args={[1.45, 0.014, 16, 128]} />
        <meshBasicMaterial color="#90d5b5" transparent opacity={0.55} />
      </mesh>
      <mesh ref={b} rotation={[Math.PI / 2.2, 0, Math.PI / 3]}>
        <torusGeometry args={[1.85, 0.009, 16, 128]} />
        <meshBasicMaterial color="#fe924e" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

function Particles() {
  const positions = useMemo(() => {
    const count = 750;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2.3 + Math.random() * 1.4;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 1.8;
      arr[i * 3] = Math.cos(theta) * r;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = Math.sin(theta) * r;
    }
    return arr;
  }, []);

  const pts = useRef<Points>(null);
  useFrame((_, delta) => {
    if (pts.current) pts.current.rotation.y += delta * 0.05;
  });

  return (
    <points ref={pts}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#acf1d0"
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function Scene() {
  const g = useRef<Group>(null);
  useAutoRotate(g, 0.12);

  return (
    <>
      <ambientLight intensity={0.7} />
      <pointLight position={[6, 5, 6]} intensity={40} color="#acf1d0" />
      <pointLight position={[-6, -3, 5]} intensity={28} color="#fe924e" />
      <directionalLight position={[0, 6, 4]} intensity={1.2} color="#ffffff" />

      <group ref={g}>
        <Float speed={1.6} rotationIntensity={0.4} floatIntensity={0.7}>
          <Core />
          <Wireframe />
          <Rings />
        </Float>
        <Particles />
      </group>
    </>
  );
}

export function OrbScene({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.05,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const paused = reduce || !visible;

  return (
    <div
      ref={containerRef}
      className={className}
      aria-hidden="true"
      style={{ position: "relative", width: "100%", height: "100%" }}
    >
      <Canvas
        frameloop={paused ? "demand" : "always"}
        dpr={[1, 1.8]}
        flat
        camera={{ fov: 40, position: [0, 0, 7.5] }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}

export default OrbScene;
