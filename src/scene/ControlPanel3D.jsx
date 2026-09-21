// ControlPanel3D.jsx — 3D Control Panel with pressable buttons mounted on the washing machine.
// Contains Start, Pause/Resume, Emergency Stop mushroom button, Reset, and Intensity Selector.
// Clicking buttons updates FSM inputs directly via inputs.js helpers.

import React, { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { pulseInput, toggleEStop, setIntensity, getInputs, getIntensity } from '../fsm/inputs.js';
import { useFsm } from '../hooks/useFsm.js';

/** Generic 3D Push Button with hover glow and press depression animation */
function PushButton({
  position,
  color,
  hoverColor,
  label,
  onClick,
  size = [0.08, 0.08, 0.04],
  isMushroom = false,
  active = false,
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const meshRef = useRef();

  // Smooth press depression animation in useFrame
  useFrame(() => {
    if (meshRef.current) {
      const targetZ = pressed ? -0.015 : 0;
      meshRef.current.position.z += (targetZ - meshRef.current.position.z) * 0.3;
    }
  });

  const displayColor = active ? hoverColor : hovered ? hoverColor : color;

  return (
    <group position={position}>
      {/* Button Base Bezel */}
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[size[0] + 0.02, size[1] + 0.02, 0.02]} />
        <meshStandardMaterial color="#2a2a32" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Pressable Button Body */}
      <mesh
        ref={meshRef}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
        onPointerDown={(e) => {
          e.stopPropagation();
          setPressed(true);
          onClick();
        }}
        onPointerUp={(e) => { e.stopPropagation(); setPressed(false); }}
      >
        {isMushroom ? (
          // Red mushroom E-Stop button cap
          <cylinderGeometry args={[0.07, 0.05, 0.06, 16]} />
        ) : (
          <boxGeometry args={size} />
        )}
        <meshStandardMaterial
          color={displayColor}
          emissive={hovered || active ? displayColor : '#000000'}
          emissiveIntensity={hovered || active ? 0.4 : 0}
          metalness={0.5}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}

export default function ControlPanel3D({ position = [-0.5, 1.17, 0.48] }) {
  const { state } = useFsm();
  const currentInputs = getInputs();
  const activeIntensity = getIntensity();

  const isPaused = state === 'PAUSED';
  const isEStopActive = currentInputs.EStop;

  return (
    <group name="controlPanel3D" position={position}>
      {/* Panel Background Plate */}
      <mesh position={[0, 0, -0.02]}>
        <boxGeometry args={[0.82, 0.18, 0.02]} />
        <meshStandardMaterial color="#1a1a22" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* 1. Start Button (Green) */}
      <PushButton
        position={[-0.3, 0, 0]}
        color="#28a745"
        hoverColor="#34ce57"
        label="Start"
        onClick={() => pulseInput('Start')}
      />

      {/* 2. Pause / Resume Button (Yellow / Cyan) */}
      <PushButton
        position={[-0.18, 0, 0]}
        color={isPaused ? "#17a2b8" : "#ffc107"}
        hoverColor={isPaused ? "#20c997" : "#ffcd39"}
        label={isPaused ? "Resume" : "Pause"}
        onClick={() => {
          if (isPaused) {
            pulseInput('Resume');
          } else {
            pulseInput('Pause');
          }
        }}
      />

      {/* 3. Emergency Stop Mushroom Button (Red with yellow collar) */}
      <group position={[0.3, 0, 0]}>
        {/* Yellow safety collar */}
        <mesh position={[0, 0, -0.005]}>
          <cylinderGeometry args={[0.085, 0.085, 0.015, 16]} />
          <meshStandardMaterial color="#ffc107" metalness={0.4} roughness={0.4} />
        </mesh>
        <PushButton
          position={[0, 0, 0.02]}
          color="#dc3545"
          hoverColor="#ff4d5e"
          label="E-STOP"
          isMushroom={true}
          active={isEStopActive}
          onClick={() => toggleEStop()}
        />
      </group>

      {/* 4. Fault Reset Button (Blue) */}
      <PushButton
        position={[0.15, 0, 0]}
        color="#0d6efd"
        hoverColor="#0b5ed7"
        label="Reset"
        onClick={() => pulseInput('Reset')}
      />

      {/* 5. Wash Intensity Selector (Light / Normal / Heavy) */}
      <group position={[-0.04, 0, 0]}>
        {['light', 'normal', 'heavy'].map((mode, idx) => (
          <PushButton
            key={mode}
            position={[(idx - 1) * 0.05, -0.04, 0]}
            size={[0.04, 0.03, 0.02]}
            color="#495057"
            hoverColor="#6c757d"
            active={activeIntensity === mode}
            label={mode[0].toUpperCase()}
            onClick={() => setIntensity(mode)}
          />
        ))}
      </group>
    </group>
  );
}
