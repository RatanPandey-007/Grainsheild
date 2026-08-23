import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function NetworkMap({ activeScene }) {
  const mapGroupRef = useRef();

  const cities = useMemo(() => [
    { name: "PUNJAB", pos: [-1.2, 0, -2.8], capacity: "12,500 T", load: "74%" },
    { name: "HARYANA", pos: [-0.6, 0, -2.2], capacity: "8,200 T", load: "58%" },
    { name: "DELHI HUB", pos: [-0.2, 0, -1.8], capacity: "15,000 T", load: "92%" },
    { name: "LUCKNOW", pos: [0.8, 0, -1.2], capacity: "9,000 T", load: "42%" },
    { name: "BIHAR", pos: [2.0, 0, -0.8], capacity: "7,400 T", load: "31%" },
    { name: "MADHYA PRADESH", pos: [0.0, 0, 0.4], capacity: "11,000 T", load: "65%" },
    { name: "MAHARASHTRA", pos: [-1.5, 0, 1.8], capacity: "14,000 T", load: "80%" }
  ], []);

  const linePoints = useMemo(() => {
    const points = [];
    const delhi = cities.find(c => c.name === "DELHI HUB").pos;
    
    cities.forEach(city => {
      if (city.name !== "DELHI HUB") {
        points.push(new THREE.Vector3(...city.pos));
        points.push(new THREE.Vector3(...delhi));
      }
    });

    const punjab = cities.find(c => c.name === "PUNJAB").pos;
    const haryana = cities.find(c => c.name === "HARYANA").pos;
    points.push(new THREE.Vector3(...punjab));
    points.push(new THREE.Vector3(...haryana));

    const lucknow = cities.find(c => c.name === "LUCKNOW").pos;
    const bihar = cities.find(c => c.name === "BIHAR").pos;
    points.push(new THREE.Vector3(...lucknow));
    points.push(new THREE.Vector3(...bihar));

    return points;
  }, [cities]);

  useFrame((state) => {
    if (!mapGroupRef.current) return;
    const t = state.clock.getElapsedTime();

    if (activeScene === 'NETWORK') {
      mapGroupRef.current.rotation.y = Math.sin(t * 0.15) * 0.15;
    }
  });

  if (activeScene !== 'NETWORK') return null;

  return (
    <group ref={mapGroupRef} position={[0, -1, 0]}>
      {/* Light slate tactical geographical grid mapping */}
      <gridHelper args={[15, 15, '#0284c7', '#cbd5e1']} position={[0, -0.05, 0]} />

      {/* Network links */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(linePoints.flatMap(p => [p.x, p.y, p.z])), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#0284c7" transparent opacity={0.4} linewidth={1} />
      </lineSegments>

      {/* City nodes */}
      {cities.map((city, idx) => (
        <group key={idx} position={city.pos}>
          {/* Blue node sphere */}
          <mesh>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshBasicMaterial color="#0284c7" />
          </mesh>

          {/* Clean radar circular tracking rings */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.2, 0.3, 16]} />
            <meshBasicMaterial color="#0284c7" transparent opacity={0.3} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.4, 0.45, 16]} />
            <meshBasicMaterial color="#16a34a" transparent opacity={0.2} />
          </mesh>

          {/* Node signal stem */}
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.8, 8]} />
            <meshBasicMaterial color="#0284c7" transparent opacity={0.4} />
          </mesh>

          <pointLight distance={3} intensity={0.6} color="#0284c7" />
        </group>
      ))}

      {/* Tactical visual tracking cone */}
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0, 4, 4, 32, 1, true]} />
        <meshBasicMaterial 
          color="#0284c7" 
          transparent 
          opacity={0.04} 
          wireframe 
          side={THREE.DoubleSide} 
        />
      </mesh>
    </group>
  );
}
