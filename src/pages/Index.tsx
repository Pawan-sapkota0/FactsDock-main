import { Sparkles, Globe2, Brain } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SearchBar from "@/components/common/SearchBar";
import CountryCard from "@/components/cards/CountryCard";
import FeatureCard from "@/components/cards/FeatureCard";
import { Button } from "@/components/ui/button";
import Globe3D from "@/components/Globe3D";

const Index = () => {
  const trendingCountries = [
    { name: "United States", slug: "united-states", flag: "🇺🇸" },
    { name: "Japan", slug: "japan", flag: "🇯🇵" },
    { name: "France", slug: "france", flag: "🇫🇷" },
    { name: "Brazil", slug: "brazil", flag: "🇧🇷" },
  ];

  const handleSearch = (value: string) => {
    console.log("Searching for:", value);
    // Search functionality will be added later
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-background via-primary/5 to-background py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6 z-10">
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
                <div className="flex gap-4">
                  <Button variant="hero" size="lg">
                    Get Started
                  </Button>
                  <Button variant="outline" size="lg">
                    Learn More
                  </Button>
                </div>
              </div>
              <div className="relative -mr-4 md:-mr-12">
                <Globe3D />
              </div>
            </div>
          </div>
        </section>

        {/* Search Section */}
        <section className="py-12 bg-card/30">
          <div className="container mx-auto px-4">
            <SearchBar onChange={handleSearch} />
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
