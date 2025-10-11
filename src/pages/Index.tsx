import { Sparkles, Globe2, Brain, Plane, MapPin, Cloud, Star, ChevronDown, Navigation } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SearchBar from "@/components/common/SearchBar";
import { useNavigate } from 'react-router-dom';
import CountryCard from "@/components/cards/CountryCard";
import FeatureCard from "@/components/cards/FeatureCard";
import { Button } from "@/components/ui/button";
import { useRef } from 'react';
import heroGlobeCartoon from '@/assets/hero-globe-cartoon.png';

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
  <section className="relative overflow-hidden py-20 hero-gradient min-h-[90vh] flex flex-col">
          {/* Background cartoonish globe - center-right, blurred */}
          <img 
            src={heroGlobeCartoon} 
            alt="Decorative globe illustration" 
            className="hero-globe-bg"
          />

          {/* Floating animated icons scattered around */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Plane - top left */}
            <Plane className="floating-icon floating-1 h-10 w-10 absolute" style={{ top: '12%', left: '8%', color: '#A78BFA' }} />
            
            {/* Twinkling star - top right */}
            <Star className="floating-icon floating-2 twinkle h-8 w-8 absolute" style={{ top: '20%', right: '15%', color: '#FBBF24' }} />
            
            {/* Globe icon - middle left */}
            <Globe2 className="floating-icon floating-3 h-12 w-12 absolute" style={{ top: '45%', left: '5%', color: '#60A5FA' }} />
            
            {/* Location pin - bottom left */}
            <MapPin className="floating-icon floating-4 h-9 w-9 absolute" style={{ bottom: '25%', left: '12%', color: '#F59E0B' }} />
            
            {/* Navigation arrow - bottom right */}
            <Navigation className="floating-icon floating-5 h-8 w-8 absolute" style={{ bottom: '30%', right: '10%', color: '#EC4899' }} />
            
            {/* Cloud - top center */}
            <Cloud className="floating-icon floating-6 h-10 w-10 absolute" style={{ top: '15%', left: '45%', color: '#CBD5E1' }} />
            
            {/* Additional star - middle right */}
            <Star className="floating-icon floating-1 twinkle h-6 w-6 absolute" style={{ top: '55%', right: '25%', color: '#FBBF24' }} />
            
            {/* Additional cloud - bottom center */}
            <Cloud className="floating-icon floating-2 h-9 w-9 absolute" style={{ bottom: '20%', left: '35%', color: '#E2E8F0' }} />
          </div>

          <div className="container mx-auto px-4 flex-1 flex items-center justify-center">
            <div className="text-center space-y-6 relative z-10 max-w-4xl">
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold leading-relaxed space-y-2">
                <span className="bg-gradient-to-r from-[#9333EA] via-[#A78BFA] to-[#C084FC] bg-clip-text text-transparent block">
                  Know the world
                </span>
                <span className="bg-gradient-to-r from-[#A78BFA] via-[#F59E0B] to-[#FBBF24] bg-clip-text text-transparent block">
                  in one glance
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground">
                Discover the world while playing quizzes
              </p>
              <div className="flex gap-4 justify-center pt-4">
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
          </div>

          {/* Scroll Down Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 scroll-indicator animate-fade-in">
            <span className="text-sm text-muted-foreground font-medium">Scroll Down</span>
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
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
