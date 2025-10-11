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
      <Sphere ref={globeRef} args={[2.5, 64, 64]}>
        <meshStandardMaterial
          color={new THREE.Color(0x2563eb)}
          metalness={0.4}
          roughness={0.6}
        />
      </Sphere>

      {/* outer atmosphere layer */}
      <Sphere args={[2.62, 64, 64]}> {/* slightly larger than main globe */}
        <meshStandardMaterial
          color={new THREE.Color(0x86a8e7)}
          transparent={true}
          opacity={0.12}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          roughness={1}
          metalness={0}
          emissive={new THREE.Color(0x86a8e7)}
          emissiveIntensity={0.2}
        />
      </Sphere>
    </>
  );
}

const Globe3D = () => {
  return (
    <div className="w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 animate-pulse"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent blur-2xl"></div>
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
