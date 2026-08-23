import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function AIIntelligenceCore({ activeScene }) {
  const coreRef = useRef();
  const innerCoreRef = useRef();
  const outerCoreRef = useRef();
  const particleGroup = useRef();

  // Create particles streaming into the center
  const particleCount = 120;
  const [positions, targets, speeds] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const tar = new Float32Array(particleCount * 3);
    const spd = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      
      const r = 5.0;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      tar[i * 3] = 0;
      tar[i * 3 + 1] = 0;
      tar[i * 3 + 2] = 0;

      spd[i] = 0.02 + Math.random() * 0.04;
    }
    return [pos, tar, spd];
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Rotate core structures
    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.4;
      coreRef.current.rotation.x = t * 0.2;
    }
    if (innerCoreRef.current) {
      innerCoreRef.current.rotation.y = -t * 0.8;
      innerCoreRef.current.rotation.z = t * 0.3;
    }
    if (outerCoreRef.current) {
      outerCoreRef.current.rotation.x = -t * 0.15;
      outerCoreRef.current.rotation.z = -t * 0.25;
    }

    // Animate streaming particles
    if (particleGroup.current) {
      const array = particleGroup.current.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        array[i * 3] -= array[i * 3] * speeds[i];
        array[i * 3 + 1] -= array[i * 3 + 1] * speeds[i];
        array[i * 3 + 2] -= array[i * 3 + 2] * speeds[i];

        const dist = Math.sqrt(
          array[i * 3] ** 2 + 
          array[i * 3 + 1] ** 2 + 
          array[i * 3 + 2] ** 2
        );

        if (dist < 0.25) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos((Math.random() * 2) - 1);
          const r = 5.0;
          array[i * 3] = r * Math.sin(phi) * Math.cos(theta);
          array[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
          array[i * 3 + 2] = r * Math.cos(phi);
        }
      }
      particleGroup.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  if (activeScene !== 'INTELLIGENCE') return null;

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Core Computational Core Sphere */}
      <mesh ref={innerCoreRef}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshBasicMaterial color="#0284c7" wireframe transparent opacity={0.5} />
      </mesh>

      {/* 2. Outer Nesting Core Cage */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[1.2, 8, 8]} />
        <meshBasicMaterial color="#ea580c" wireframe transparent opacity={0.3} />
      </mesh>

      {/* 3. Volumetric glowing ring */}
      <mesh ref={outerCoreRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.6, 0.05, 8, 24]} />
        <meshBasicMaterial color="#0284c7" transparent opacity={0.4} />
      </mesh>

      {/* Pulsing light source in center */}
      <pointLight distance={6} intensity={1.8} color="#0284c7" />

      {/* Streaming telemetry data particles (Standard blending for light theme) */}
      <points ref={particleGroup}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.12}
          color="#0284c7"
          transparent
          opacity={0.8}
          sizeAttenuation
          depthWrite={false}
        />
      </points>

      {/* Technical grid mapping */}
      <gridHelper args={[10, 10, '#94a3b8', '#cbd5e1']} position={[0, -2, 0]} />
    </group>
  );
}
