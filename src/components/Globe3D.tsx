import { useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Sphere, Stars } from '@react-three/drei';
import * as THREE from 'three';
import earthTexture from '@/assets/earth-realistic.jpg';

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
    <div className="w-full h-[500px] md:h-[600px] relative">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <color attach="background" args={['#000814']} />
        <Stars radius={300} depth={60} count={3000} factor={7} saturation={0} fade speed={1} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 3, 5]} intensity={1.5} />
        <pointLight position={[-5, -3, -5]} intensity={0.6} color="#4169E1" />
        <pointLight position={[5, 5, 5]} intensity={0.3} color="#ffffff" />
        <RotatingGlobe />
        <OrbitControls 
          enableZoom={false}
          autoRotate
          autoRotateSpeed={0.5}
          enablePan={false}
          minPolarAngle={Math.PI / 2.5}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-background via-background/50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
      </div>
    </div>
  );
};

export default Globe3D;
