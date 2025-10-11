import { Sparkles, Globe2, Brain, Plane, MapPin, Cloud, ChevronDown } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SearchBar from "@/components/common/SearchBar";
import { useNavigate } from 'react-router-dom';
import CountryCard from "@/components/cards/CountryCard";
import FeatureCard from "@/components/cards/FeatureCard";
import { Button } from "@/components/ui/button";
import { useRef } from 'react';
import Globe3D from '@/components/Globe3D';
import HeroIllustration from '@/components/illustration/HeroIllustration';

// Illustration-based hero visual (framer-motion animated SVG)

const Index = () => {
  const trendingCountries = [
    { name: "United States", slug: "united-states", flag: "🇺🇸" },
    { name: "Japan", slug: "japan", flag: "🇯🇵" },
    { name: "France", slug: "france", flag: "🇫🇷" },
    { name: "Brazil", slug: "brazil", flag: "🇧🇷" },
  ];

  const navigate = useNavigate();
  // refs to target sections for smooth scrolling
  const searchRef = useRef<HTMLElement | null>(null);
  const trendingRef = useRef<HTMLElement | null>(null);

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
  <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20 hero-gradient">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <div className="relative text-center lg:text-left space-y-6">
                {/* Floating background icons on the left */}
                <div className="absolute inset-0 pointer-events-none overflow-visible">
                  <Plane className="absolute h-8 w-8 text-primary/30" style={{ top: '10%', left: '5%', animation: 'floatSlow 8s ease-in-out infinite' }} />
                  <Sparkles className="absolute h-7 w-7 text-secondary/30" style={{ top: '15%', right: '10%', animation: 'floatSlow 10s ease-in-out infinite' }} />
                  <Cloud className="absolute h-9 w-9 text-accent/30" style={{ bottom: '20%', left: '8%', animation: 'floatSlow 9s ease-in-out infinite' }} />
                  <MapPin className="absolute h-6 w-6 text-primary/30" style={{ bottom: '30%', right: '15%', animation: 'floatSlow 11s ease-in-out infinite' }} />
                  <Globe2 className="absolute h-10 w-10 text-secondary/30" style={{ top: '50%', left: '2%', animation: 'floatSlow 12s ease-in-out infinite' }} />
                </div>
                
                <h1 className="relative text-5xl md:text-6xl font-bold leading-tight z-10">
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Know the world
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">in one glance</span>
                </h1>
                <p className="relative text-xl text-muted-foreground z-10">
                  Discover the world while playing quizzes
                </p>
                <div className="relative flex gap-4 justify-center lg:justify-start z-10">
                  <Button
                    variant="hero"
                    size="lg"
                    onClick={() => searchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  >
                    Get Started
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => trendingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  >
                    Learn More
                  </Button>
                </div>
              </div>
              
              <div className="h-[420px] w-full relative flex items-center justify-center">
                <HeroIllustration />
              </div>
            </div>
            
            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in">
              <p className="text-sm text-muted-foreground">Scroll to explore 🌏</p>
              <ChevronDown className="h-6 w-6 text-primary animate-bounce" />
            </div>
          </div>
        </section>

        {/* Search Section */}
        <section ref={searchRef} className="py-12 bg-card/30">
          <div className="container mx-auto px-4">
            <SearchBar onChange={handleSearch} onSelect={handleSelect} onSubmit={(value) => {
              if (!value) return;
              const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
              navigate(`/country/${slug}`);
            }} />
          </div>
        </section>

  {/* Trending Countries */}
  <section ref={trendingRef} className="py-16">
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
