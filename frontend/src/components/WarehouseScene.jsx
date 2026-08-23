import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

function Silo({ position, name, status, riskScore }) {
  const meshRef = useRef();
  
  // Custom glowing visual indicators based on silo status
  let glowColor = "#16a34a"; // SAFE Green
  if (status === "WARNING") glowColor = "#ea580c"; // Warning Orange
  if (status === "CRITICAL") glowColor = "#dc2626"; // Critical Red

  return (
    <group position={position}>
      {/* Silo Body - Metallic silver/aluminum cylinder */}
      <mesh ref={meshRef} position={[0, 2, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 4, 24]} />
        <meshStandardMaterial 
          color="#cbd5e1" /* Premium Aluminum Alloy */
          roughness={0.18} 
          metalness={0.85} 
          envMapIntensity={0.8}
        />
      </mesh>

      {/* Silo Cyber Wireframe Overlay - Technical overlay adjusted for high light contrast */}
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[1.21, 1.21, 4.02, 12, 4]} />
        <meshBasicMaterial 
          color={glowColor} 
          wireframe 
          transparent 
          opacity={0.09 + (riskScore / 100) * 0.2} 
        />
      </mesh>

      {/* Silo Cap - Light anodized metallic cap */}
      <mesh position={[0, 4.25, 0]}>
        <coneGeometry args={[1.2, 0.6, 24]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.25} metalness={0.8} />
      </mesh>

      {/* Silo Bottom Ring */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[1.3, 1.3, 0.1, 24]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
      </mesh>
      
      {/* Volumetric indicator rings around the Silo */}
      <mesh position={[0, 1.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.22, 1.24, 24]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.5} />
      </mesh>
      <mesh position={[0, 3.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.22, 1.24, 24]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

// Interactive Sensor Node inside 3D environment
function SensorNode({ sensor, onHoverSensor, onClickSensor, selectedId }) {
  const nodeRef = useRef();
  const [hovered, setHovered] = useState(false);

  // Status color codes (Light theme calibrated)
  const statusColors = {
    NORMAL: "#16a34a",
    WARNING: "#ea580c",
    CRITICAL: "#dc2626"
  };
  const color = statusColors[sensor.status] || "#16a34a";

  useFrame((state) => {
    if (!nodeRef.current) return;
    const t = state.clock.getElapsedTime();
    
    const speed = sensor.status === "CRITICAL" ? 6 : sensor.status === "WARNING" ? 3.5 : 2;
    const pulseScale = 1.0 + Math.sin(t * speed) * 0.18;
    
    nodeRef.current.scale.setScalar(pulseScale * (hovered || selectedId === sensor.id ? 1.4 : 1.0));
  });

  const showHUD = hovered || selectedId === sensor.id;

  return (
    <group 
      position={[sensor.x_pos, sensor.y_pos, sensor.z_pos]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHoverSensor(sensor, e);
      }}
      onPointerOut={(e) => {
        setHovered(false);
        onHoverSensor(null, null);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClickSensor(sensor);
      }}
    >
      {/* Glowing inner core */}
      <mesh ref={nodeRef}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Pulsing outer aura ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.25, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>
      
      {/* Directional light pulse emitted inside silos */}
      <pointLight distance={1.5} intensity={sensor.status === "CRITICAL" ? 1.0 : 0.4} color={color} />

      {/* Floating high-tech HTML HUD tooltip in 3D Space */}
      {showHUD && (
        <Html distanceFactor={6} position={[0.2, 0.3, 0]} style={{ pointerEvents: 'none' }}>
          <div className="floating-hud">
            <div className="floating-hud-header">{sensor.node_name}</div>
            <div className="floating-hud-row">
              <span>TEMP</span>
              <span className="floating-hud-value">{sensor.telemetry.temperature}°C</span>
            </div>
            <div className="floating-hud-row">
              <span>HUMIDITY</span>
              <span className="floating-hud-value">{sensor.telemetry.humidity}%</span>
            </div>
            <div className="floating-hud-row">
              <span>MOISTURE</span>
              <span className="floating-hud-value">{sensor.telemetry.moisture}%</span>
            </div>
            <div className="floating-hud-row">
              <span>GAS</span>
              <span className="floating-hud-value">{sensor.telemetry.gas} PPM</span>
            </div>
            <div className="floating-hud-row" style={{ marginTop: '6px', borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '4px' }}>
              <span>STATUS</span>
              <span style={{ color: color, fontWeight: 'bold' }}>{sensor.status}</span>
            </div>
            {sensor.prediction && (
              <div className="floating-hud-row">
                <span>RISK</span>
                <span style={{ color: color }}>{sensor.prediction.risk_score}%</span>
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

export default function WarehouseScene({ sensors, onHoverSensor, onClickSensor, selectedSensorId }) {
  const getSiloState = (siloNum) => {
    const startIdx = (siloNum - 1) * 3;
    const siloSensors = sensors.filter(s => s.id > startIdx && s.id <= startIdx + 3);
    
    let status = "NORMAL";
    let maxRisk = 0;
    
    siloSensors.forEach(s => {
      const score = s.prediction?.risk_score || 0;
      if (score > maxRisk) maxRisk = score;
      if (s.status === "CRITICAL") status = "CRITICAL";
      else if (s.status === "WARNING" && status !== "CRITICAL") status = "WARNING";
    });

    return { status, riskScore: maxRisk };
  };

  const silo1 = getSiloState(1);
  const silo2 = getSiloState(2);
  const silo3 = getSiloState(3);

  return (
    <group>
      {/* Daylight Lighting Rig */}
      <directionalLight position={[10, 15, 5]} intensity={0.8} castShadow />
      <directionalLight position={[-8, 6, -3]} intensity={0.3} color="#bae6fd" />
      <pointLight position={[0, 5, 5]} intensity={0.5} color="#ffffff" />

      {/* Silo 1 (Left: x=-4) */}
      <Silo position={[-4, 0, 0]} name="SILO_01" status={silo1.status} riskScore={silo1.riskScore} />

      {/* Silo 2 (Center: x=0) */}
      <Silo position={[0, 0, 0]} name="SILO_02" status={silo2.status} riskScore={silo2.riskScore} />

      {/* Silo 3 (Right: x=4) */}
      <Silo position={[4, 0, 0]} name="SILO_03" status={silo3.status} riskScore={silo3.riskScore} />

      {/* Flat Warehouse Hall Structure (Anodized light steel look) */}
      <group position={[0, 0.5, 4]}>
        <mesh>
          <boxGeometry args={[9, 1.0, 3]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[9.02, 1.02, 3.02]} />
          <meshBasicMaterial color="#cbd5e1" wireframe transparent opacity={0.5} />
        </mesh>
      </group>

      {/* Connecting Pipes network (Silver metal look) */}
      <mesh position={[0, 4.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 8, 8]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.15} />
      </mesh>
      
      <mesh position={[-4, 4.35, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 1, 8]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} />
      </mesh>
      <mesh position={[0, 4.35, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 1, 8]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} />
      </mesh>
      <mesh position={[4, 4.35, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 1, 8]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} />
      </mesh>

      {/* Pulsing Sensors */}
      {sensors.map((sensor) => (
        <SensorNode 
          key={sensor.id} 
          sensor={sensor} 
          onHoverSensor={onHoverSensor} 
          onClickSensor={onClickSensor}
          selectedId={selectedSensorId}
        />
      ))}
    </group>
  );
}
