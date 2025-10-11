import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import * as THREE from 'three';

function RotatingGlobe() {
  const globeRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.002;
    }
  });

  return (
    <>
      <Sphere ref={globeRef} args={[2.5, 32, 32]}>
        <meshStandardMaterial
          color={new THREE.Color(0x8b5cf6)}
          wireframe={true}
          emissive={new THREE.Color(0x6366f1)}
          emissiveIntensity={0.3}
        />
      </Sphere>

      {/* outer glow layer */}
      <Sphere args={[2.65, 32, 32]}>
        <meshStandardMaterial
          color={new THREE.Color(0x8b5cf6)}
          transparent={true}
          opacity={0.15}
          wireframe={true}
          depthWrite={false}
        />
      </Sphere>
    </>
  );
}

const Globe3D = () => {
  return (
    <div className="w-full h-full">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent blur-3xl"></div>
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 3, 5]} intensity={1.2} />
        <pointLight position={[-5, -3, -5]} intensity={0.4} color="#4169E1" />
        <RotatingGlobe />
        <OrbitControls 
          enableZoom={false}
          autoRotate
          autoRotateSpeed={0.8}
          enablePan={false}
        />
      </Canvas>
    </div>
  );
};

export default Globe3D;
