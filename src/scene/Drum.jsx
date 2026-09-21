// Drum.jsx — Rotating drum with paddles and perforated holes.
// Accepts `rpm` (number) and `direction` (1 or -1) as props.
// The drum rotates on its Z axis in useFrame, driven purely by props
// (no FSM wiring yet).

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Number of small drainage holes around the drum wall
const HOLE_COUNT = 24;
// Number of agitation paddles inside the drum
const PADDLE_COUNT = 4;

export default function Drum({ rpm = 0, direction = 1 }) {
  const groupRef = useRef();

  // Rotate the entire drum group each frame.
  // rpm → radians/sec: (rpm / 60) * 2π
  useFrame((_, delta) => {
    if (groupRef.current && rpm !== 0) {
      const radsPerSec = (rpm / 60) * Math.PI * 2;
      groupRef.current.rotation.z += radsPerSec * direction * delta;
    }
  });

  // Pre-compute hole positions around the circumference (instanced).
  const holeMatrices = useMemo(() => {
    const matrices = [];
    const drumRadius = 0.38;
    // Arrange holes in 3 rings along the drum depth
    const rings = 3;
    const holesPerRing = Math.floor(HOLE_COUNT / rings);
    for (let ring = 0; ring < rings; ring++) {
      const zOff = -0.2 + ring * 0.2; // spread along Z
      for (let i = 0; i < holesPerRing; i++) {
        const angle = (i / holesPerRing) * Math.PI * 2;
        const mat = new THREE.Matrix4();
        // Position on drum surface, orient radially outward
        mat.makeRotationZ(angle);
        mat.setPosition(
          Math.cos(angle) * drumRadius,
          Math.sin(angle) * drumRadius,
          zOff
        );
        matrices.push(mat);
      }
    }
    return matrices;
  }, []);

  return (
    <group ref={groupRef} name="drum">
      {/* ── Drum cylinder (open-ended, perforated look) ──────────── */}
      <mesh name="drumBody">
        <cylinderGeometry args={[0.4, 0.4, 0.55, 20, 1, true]} />
        <meshStandardMaterial
          color="#8a8a90"
          metalness={0.7}
          roughness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── Back plate (solid disc) ──────────────────────────────── */}
      <mesh name="drumBackPlate" position={[0, 0, -0.275]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.4, 20]} />
        <meshStandardMaterial color="#7a7a80" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* ── Shaft stub (connects to belt/motor) ──────────────────── */}
      <mesh name="drumShaft" position={[0, 0, -0.35]}>
        <cylinderGeometry args={[0.04, 0.04, 0.2, 8]} />
        <meshStandardMaterial color="#555" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* ── Agitation paddles ────────────────────────────────────── */}
      {Array.from({ length: PADDLE_COUNT }).map((_, i) => {
        const angle = (i / PADDLE_COUNT) * Math.PI * 2;
        const r = 0.28; // paddle offset from center
        return (
          <mesh
            key={`paddle-${i}`}
            name={`paddle-${i}`}
            position={[Math.cos(angle) * r, Math.sin(angle) * r, 0]}
            rotation={[0, 0, angle]}
          >
            <boxGeometry args={[0.18, 0.04, 0.4]} />
            <meshStandardMaterial color="#999" metalness={0.5} roughness={0.4} />
          </mesh>
        );
      })}

      {/* ── Drainage holes (instanced for performance) ───────────── */}
      <instancedMesh
        name="drumHoles"
        args={[undefined, undefined, holeMatrices.length]}
        ref={(inst) => {
          if (inst) {
            holeMatrices.forEach((mat, i) => inst.setMatrixAt(i, mat));
            inst.instanceMatrix.needsUpdate = true;
          }
        }}
      >
        <cylinderGeometry args={[0.012, 0.012, 0.04, 6]} />
        <meshStandardMaterial color="#222" metalness={0.3} roughness={0.7} />
      </instancedMesh>
    </group>
  );
}
