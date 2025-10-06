import { useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import earthTexture from '@/assets/earth-texture.png';

function RotatingGlobe() {
  const globeRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(THREE.TextureLoader, earthTexture);

  useFrame(() => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.002;
    }
  });

  return (
    <Sphere ref={globeRef} args={[2.5, 64, 64]}>
      <meshStandardMaterial
        map={texture}
        metalness={0.1}
        roughness={0.8}
      />
    </Sphere>
  );
}

const Globe3D = () => {
  return (
    <div className="w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 3, 5]} intensity={1.2} />
        <pointLight position={[-5, -3, -5]} intensity={0.4} color="#4169E1" />
        <RotatingGlobe />
        <OrbitControls 
          enableZoom={true}
          minDistance={4}
          maxDistance={10}
          autoRotate
          autoRotateSpeed={0.8}
          enablePan={false}
        />
      </Canvas>
    </div>
  );
};

export default Globe3D;
