import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Camera controller that handles smooth transitions between scenes
function CameraRig({ activeScene }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 3, 10));
  const targetLook = useRef(new THREE.Vector3(0, 1.5, 0));
  
  // Update target vectors based on the selected scene
  useEffect(() => {
    switch (activeScene) {
      case 'HERO':
        targetPos.current.set(0, 4, 11);
        targetLook.current.set(0, 1.5, 0);
        break;
      case 'PROBLEM':
        targetPos.current.set(0, 8, 14);
        targetLook.current.set(0, 0, 0);
        break;
      case 'INVISIBLE':
        // Zoom in to Silo 1 (left)
        targetPos.current.set(-4, 3, 5);
        targetLook.current.set(-4, 2.5, 0);
        break;
      case 'SENSING':
        // Zoom in close to Silo 2 (center) sensor nodes
        targetPos.current.set(0, 2.8, 3.5);
        targetLook.current.set(0, 2.5, 0);
        break;
      case 'INTELLIGENCE':
        // Transition to AI Particle Core view
        targetPos.current.set(0, 0, 8);
        targetLook.current.set(0, 0, 0);
        break;
      case 'PREDICTION':
        // Focus on Silo 3 (right) risk warning pulses
        targetPos.current.set(4, 2.8, 4.5);
        targetLook.current.set(4, 2.5, 0);
        break;
      case 'ACTION':
        // Operational alert screen view
        targetPos.current.set(0, 5, 8);
        targetLook.current.set(0, 2, 0);
        break;
      case 'NETWORK':
        // Top-down map view
        targetPos.current.set(0, 10, 0.1); // Avoid exact gimbal lock
        targetLook.current.set(0, 0, 0);
        break;
      case 'OPERATIONAL':
        // Dashboard interactive view
        targetPos.current.set(0, 4, 9.5);
        targetLook.current.set(0, 1.5, 0);
        break;
      default:
        targetPos.current.set(0, 3, 10);
        targetLook.current.set(0, 1.5, 0);
    }
  }, [activeScene]);

  useFrame((state) => {
    // Smooth camera position interpolation
    camera.position.lerp(targetPos.current, 0.04);

    // Dynamic rotation during HERO for organic feeling
    if (activeScene === 'HERO') {
      const t = state.clock.getElapsedTime();
      camera.position.x += Math.sin(t * 0.1) * 0.005;
      camera.position.z += Math.cos(t * 0.1) * 0.005;
    }

    // Look at target interpolation
    const currentLook = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).add(camera.position);
    const desiredLook = targetLook.current.clone();
    
    const tempLook = new THREE.Vector3().lerpVectors(currentLook, desiredLook, 0.06);
    camera.lookAt(tempLook);
  });

  return null;
}

export default function CanvasContainer({ children, activeScene }) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'auto' }}>
      <Canvas
        camera={{ position: [0, 10, 20], fov: 45 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color('#f1f5f9'));
        }}
      >
        {/* Light theme: Ambient light must be very bright to replicate clinical laboratory lighting */}
        <ambientLight intensity={0.7} />
        
        {/* Modern slate/light-grey grid lines */}
        <gridHelper args={[60, 60, '#94a3b8', '#e2e8f0']} position={[0, -0.01, 0]} />
        
        {/* Core Scene Elements */}
        {children}
        
        {/* Camera Rig Transitions */}
        <CameraRig activeScene={activeScene} />
        
        {/* Free Orbit controls ONLY during operational simulation mode */}
        {activeScene === 'OPERATIONAL' && (
          <OrbitControls 
            enableDamping 
            dampingFactor={0.05} 
            maxPolarAngle={Math.PI / 2.1} // Prevent looking below ground
            minDistance={3}
            maxDistance={25}
          />
        )}
      </Canvas>
    </div>
  );
}
