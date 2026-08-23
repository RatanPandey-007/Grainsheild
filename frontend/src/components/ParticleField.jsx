import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function ParticleField({ sensors, activeScene }) {
  const ambientPoints = useRef();
  const riskFieldPoints = useRef();

  // 1. Setup Ambient Falling Grain Particles
  const ambientCount = 800;
  const [ambientPositions, ambientSpeeds] = useMemo(() => {
    const pos = new Float32Array(ambientCount * 3);
    const speed = new Float32Array(ambientCount);
    for (let i = 0; i < ambientCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 15;      // X
      pos[i * 3 + 1] = Math.random() * 10;            // Y
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15;    // Z
      speed[i] = 0.02 + Math.random() * 0.04;
    }
    return [pos, speed];
  }, []);

  // 2. Setup Volumetric Spoilage Risk Field Particles
  const riskParticleCount = 1000;
  const [riskPositions, riskOriginals] = useMemo(() => {
    const pos = new Float32Array(riskParticleCount * 3);
    const originals = [];
    
    for (let i = 0; i < riskParticleCount; i++) {
      const siloIdx = Math.floor(Math.random() * 3);
      const siloX = (siloIdx - 1) * 4; // -4, 0, 4
      
      const radius = 0.5 + Math.random() * 1.5;
      const angle = Math.random() * Math.PI * 2;
      const x = siloX + Math.cos(angle) * radius;
      const y = Math.random() * 4.5;
      const z = (Math.random() - 0.5) * 2;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      originals.push({
        siloIdx,
        baseX: siloX,
        angle,
        radius,
        heightSpeed: 0.1 + Math.random() * 0.2
      });
    }
    return [pos, originals];
  }, []);

  // Update particles inside WebGL thread
  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Ambient Falling Grains (Amber dust)
    if (ambientPoints.current) {
      const positions = ambientPoints.current.geometry.attributes.position.array;
      for (let i = 0; i < ambientCount; i++) {
        positions[i * 3 + 1] -= ambientSpeeds[i];
        positions[i * 3] += Math.sin(t + i) * 0.005;

        if (positions[i * 3 + 1] < 0) {
          positions[i * 3 + 1] = 10;
          positions[i * 3] = (Math.random() - 0.5) * 15;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 15;
        }
      }
      ambientPoints.current.geometry.attributes.position.needsUpdate = true;
    }

    // Spoilage Risk Gas Field
    if (riskFieldPoints.current) {
      const positions = riskFieldPoints.current.geometry.attributes.position.array;
      const colors = riskFieldPoints.current.geometry.attributes.color.array;
      
      const siloRisks = [0, 0, 0];
      sensors.forEach(s => {
        const siloIdx = s.id <= 3 ? 0 : s.id <= 6 ? 1 : s.id <= 9 ? 2 : -1;
        if (siloIdx !== -1) {
          siloRisks[siloIdx] = Math.max(siloRisks[siloIdx], s.prediction?.risk_score || 0);
        }
      });

      for (let i = 0; i < riskParticleCount; i++) {
        const orig = riskOriginals[i];
        const risk = siloRisks[orig.siloIdx];
        const swirlSpeed = 0.5 + (risk / 100) * 2.5;
        const turbulence = (risk / 100) * 0.4;

        orig.angle += 0.01 * swirlSpeed;
        const currentRadius = orig.radius * (1.0 + (risk / 100) * 0.5 + Math.sin(t * 2 + i) * turbulence);
        
        positions[i * 3] = orig.baseX + Math.cos(orig.angle) * currentRadius;
        positions[i * 3 + 1] += 0.005 * swirlSpeed;
        if (positions[i * 3 + 1] > 4.5) {
          positions[i * 3 + 1] = 0;
        }

        // Calibrated colors for high contrast light backgrounds
        let rColor, gColor, bColor;
        if (risk < 30) {
          // Precision Blue/Teal gas representation
          rColor = 0.01;
          gColor = 0.52;
          bColor = 0.78;
        } else if (risk < 70) {
          // Warning Orange gas
          rColor = 0.92;
          gColor = 0.35;
          bColor = 0.03;
        } else {
          // Critical Red gas
          rColor = 0.86;
          gColor = 0.15;
          bColor = 0.15;
        }

        colors[i * 3] = rColor;
        colors[i * 3 + 1] = gColor;
        colors[i * 3 + 2] = bColor;
      }
      
      riskFieldPoints.current.geometry.attributes.position.needsUpdate = true;
      riskFieldPoints.current.geometry.attributes.color.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* 1. Ambient Grains (Amber dust) */}
      <points ref={ambientPoints}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[ambientPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={activeScene === 'PROBLEM' ? 0.09 : 0.04}
          color="#d97706" /* Rich warm amber */
          transparent
          opacity={activeScene === 'PROBLEM' ? 0.95 : 0.4}
          sizeAttenuation
        />
      </points>

      {/* 2. Spoilage Volumetric Gas/Heat Field (No AdditiveBlending for light theme) */}
      {(activeScene === 'OPERATIONAL' || activeScene === 'PREDICTION' || activeScene === 'INVISIBLE' || activeScene === 'ACTION') && (
        <points ref={riskFieldPoints}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[riskPositions, 3]}
            />
            <bufferAttribute
              attach="attributes-color"
              args={[new Float32Array(riskParticleCount * 3), 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.07}
            vertexColors
            transparent
            opacity={0.45}
            sizeAttenuation
            /* Standard alpha transparency blending for white backgrounds */
            depthWrite={false}
          />
        </points>
      )}
    </group>
  );
}
