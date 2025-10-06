import { Sparkles, Globe2, Brain } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SearchBar from "@/components/common/SearchBar";
import { useNavigate } from 'react-router-dom';
import CountryCard from "@/components/cards/CountryCard";
import FeatureCard from "@/components/cards/FeatureCard";
import { Button } from "@/components/ui/button";
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

function RotatingGlobe() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      meshRef.current.rotation.x += 0.001;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2, 32, 32]} />
      <meshStandardMaterial
        color="#6366f1"
        wireframe
        emissive="#4f46e5"
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

const Index = () => {
  const trendingCountries = [
    { name: "United States", slug: "united-states", flag: "🇺🇸" },
    { name: "Japan", slug: "japan", flag: "🇯🇵" },
    { name: "France", slug: "france", flag: "🇫🇷" },
    { name: "Brazil", slug: "brazil", flag: "🇧🇷" },
  ];

  const navigate = useNavigate();

  const handleSearch = (value: string) => {
    // Keep console log for debugging
    console.log("Searching for:", value);
  };

  const handleSelect = (country: string) => {
    // navigate to the country page using slugified name
    const slug = country.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    navigate(`/country/${slug}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <div className="text-center lg:text-left space-y-6">
                <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Know the world
                  </span>
                  <br />
                  <span className="text-foreground">in one glance</span>
                </h1>
                <p className="text-xl text-muted-foreground">
                  Discover the world while playing quizzes
                </p>
                <div className="flex gap-4 justify-center lg:justify-start">
                  <Button variant="hero" size="lg">
                    Get Started
                  </Button>
                  <Button variant="outline" size="lg">
                    Learn More
                  </Button>
                </div>
              </div>
              
              <div className="h-[400px] w-full">
                <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
                  <ambientLight intensity={0.5} />
                  <directionalLight position={[5, 5, 5]} intensity={1} />
                  <pointLight position={[-5, -5, -5]} intensity={0.5} color="#8b5cf6" />
                  <RotatingGlobe />
                </Canvas>
              </div>
            </div>
          </div>
        </section>

        {/* Search Section */}
        <section className="py-12 bg-card/30">
          <div className="container mx-auto px-4">
            <SearchBar onChange={handleSearch} onSelect={handleSelect} />
          </div>
        </section>

        {/* Trending Countries */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-10 text-foreground">
              Trending Countries
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {trendingCountries.map((country) => (
                <CountryCard key={country.slug} {...country} />
              ))}
            </div>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <FeatureCard
                title="Fun Facts"
                description="Different categories like animal, people, fruits, history"
                icon={Sparkles}
                link="/fun-facts"
                iconColor="text-secondary"
              />
              <FeatureCard
                title="World Facts"
                description="Different categories like animal, people, fruits, history"
                icon={Globe2}
                link="/world-facts"
                iconColor="text-primary"
              />
              <FeatureCard
                title="Play Quiz"
                description="Country wise quiz or Random quiz"
                icon={Brain}
                link="/quiz"
                iconColor="text-accent"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
