// StateDiagram3D.jsx — Floating 3D FSM State Diagram positioned to the right of the machine.
// Highlights active state with glowing/pulsing animation, connects transitions with 3D arrows,
// flashes red on blocked transitions, and displays real-time state outputs.

import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useFsm } from '../hooks/useFsm.js';

// ─── 3D Node Positions layout ─────────────────────────────────────────
const NODE_POSITIONS = {
  IDLE:   [-0.9, 0.8, 0],
  SOAK:   [-0.1, 1.3, 0],
  WASH:   [ 0.8, 0.8, 0],
  RINSE:  [ 0.8, -0.2, 0],
  SPIN:   [ 0.0, -0.7, 0],
  PAUSED: [-1.0, -0.1, 0],
  FAULT:  [ 0.0, 0.3, 0],
};

// State color palette
const STATE_COLORS = {
  IDLE:   '#6c757d',
  SOAK:   '#0dcaf0',
  WASH:   '#0d6efd',
  RINSE:  '#20c997',
  SPIN:   '#198754',
  PAUSED: '#ffc107',
  FAULT:  '#dc3545',
};

// Transition connections [from, to]
const CONNECTIONS = [
  { from: 'IDLE', to: 'SOAK' },
  { from: 'SOAK', to: 'WASH' },
  { from: 'WASH', to: 'RINSE' },
  { from: 'RINSE', to: 'SPIN' },
  { from: 'SPIN', to: 'IDLE' },
  { from: 'WASH', to: 'PAUSED' },
  { from: 'PAUSED', to: 'WASH' },
  { from: 'SOAK', to: 'FAULT' },
  { from: 'WASH', to: 'FAULT' },
  { from: 'RINSE', to: 'FAULT' },
  { from: 'SPIN', to: 'FAULT' },
  { from: 'FAULT', to: 'IDLE' },
];

/** 3D Connecting Pipe/Arrow between two nodes */
function TransitionArrow({ from, to, isActiveTransition, isBlocked }) {
  const fromPos = NODE_POSITIONS[from];
  const toPos = NODE_POSITIONS[to];

  const { position, rotation, length } = useMemo(() => {
    const start = new THREE.Vector3(...fromPos);
    const end = new THREE.Vector3(...toPos);
    const dir = new THREE.Vector3().subVectors(end, start);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

    // Compute rotation quaternion to orient cylinder along dir
    const orientation = new THREE.Matrix4();
    orientation.lookAt(start, end, new THREE.Vector3(0, 1, 0));
    const rot = new THREE.Euler().setFromRotationMatrix(orientation);

    return { position: [mid.x, mid.y, mid.z], rotation: rot, length: len };
  }, [fromPos, toPos]);

  const color = isBlocked ? '#ff0000' : isActiveTransition ? '#00ffff' : '#3a3a48';

  return (
    <group position={position} rotation={rotation}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, length * 0.85, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={isBlocked || isActiveTransition ? color : '#000000'}
          emissiveIntensity={isBlocked ? 0.9 : isActiveTransition ? 0.6 : 0}
        />
      </mesh>
    </group>
  );
}

/** Individual 3D State Node */
function StateNode({ name, position, isActive, isBlocked }) {
  const meshRef = useRef();
  const baseColor = STATE_COLORS[name] || '#888888';

  // Pulsing scale animation for active state node
  useFrame((state) => {
    if (meshRef.current && isActive) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.12;
      meshRef.current.scale.set(pulse, pulse, pulse);
    } else if (meshRef.current) {
      meshRef.current.scale.set(1, 1, 1);
    }
  });

  const displayColor = isBlocked ? '#ff0000' : baseColor;

  return (
    <group position={position}>
      {/* Node Body Sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.13, 20, 20]} />
        <meshStandardMaterial
          color={displayColor}
          emissive={isActive || isBlocked ? displayColor : '#000000'}
          emissiveIntensity={isActive ? 0.7 : isBlocked ? 0.9 : 0.1}
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>
      {/* Outer Halo ring for active node */}
      {isActive && (
        <mesh>
          <ringGeometry args={[0.16, 0.20, 24]} />
          <meshBasicMaterial color={displayColor} side={THREE.DoubleSide} transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
}

/** Real-time outputs card floating next to the active state node */
function OutputsCard({ outputs, position }) {
  return (
    <group position={[position[0] + 0.3, position[1] + 0.1, 0.05]}>
      {/* Card Background */}
      <mesh>
        <planeGeometry args={[0.65, 0.45]} />
        <meshBasicMaterial color="#0a0a14" transparent opacity={0.85} />
      </mesh>

      {/* Border outline */}
      <mesh position={[0, 0, -0.005]}>
        <planeGeometry args={[0.67, 0.47]} />
        <meshBasicMaterial color="#0dcaf0" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

export default function StateDiagram3D({ position = [2.2, 1.2, 0] }) {
  const groupRef = useRef();
  const { camera } = useThree();
  const { state: activeState, outputs, blockedReasons, history } = useFsm();

  // Determine last taken transition from history log
  const lastTransition = useMemo(() => {
    if (history.length < 2) return null;
    const prev = history[history.length - 2].state;
    const curr = history[history.length - 1].state;
    return { from: prev, to: curr };
  }, [history]);

  const isBlocked = blockedReasons && blockedReasons.length > 0;

  // Billboard effect: Keep diagram facing camera
  useFrame(() => {
    if (groupRef.current && camera) {
      groupRef.current.quaternion.copy(camera.quaternion);
    }
  });

  const activePos = NODE_POSITIONS[activeState] || [0, 0, 0];

  return (
    <group ref={groupRef} name="stateDiagram3D" position={position}>
      {/* Transition Connection Lines */}
      {CONNECTIONS.map(({ from, to }) => {
        const isActiveTrans = lastTransition && lastTransition.from === from && lastTransition.to === to;
        const isBlockedTrans = isBlocked && activeState === from;
        return (
          <TransitionArrow
            key={`${from}->${to}`}
            from={from}
            to={to}
            isActiveTransition={isActiveTrans}
            isBlocked={isBlockedTrans}
          />
        );
      })}

      {/* State Nodes */}
      {Object.entries(NODE_POSITIONS).map(([name, pos]) => (
        <StateNode
          key={name}
          name={name}
          position={pos}
          isActive={activeState === name}
          isBlocked={isBlocked && activeState === name}
        />
      ))}

      {/* Real-time Outputs Overlay Card */}
      <OutputsCard outputs={outputs} position={activePos} />
    </group>
  );
}
