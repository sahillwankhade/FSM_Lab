// CameraControls.jsx — OrbitControls for the scene camera.
// Since @react-three/drei is NOT in package.json, we import
// OrbitControls directly from three's examples and register it
// with R3F via extend().

import React, { useRef } from 'react';
import { extend, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Register OrbitControls as a declarative R3F element: <orbitControls>
extend({ OrbitControls });

export default function CameraControls() {
  const controlsRef = useRef();
  const { camera, gl } = useThree();

  // Update controls every frame so damping works smoothly
  useFrame(() => {
    if (controlsRef.current) controlsRef.current.update();
  });

  return (
    <orbitControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
      // Start looking at the machine center, slightly from the right
      target={[0, 0.8, 0]}
      // Limit zoom so the user can't fly through the floor
      minDistance={2}
      maxDistance={12}
      // Limit vertical orbit to avoid going below the floor
      maxPolarAngle={Math.PI / 2 - 0.05}
      // Smooth damping for a polished feel
      enableDamping
      dampingFactor={0.08}
    />
  );
}
