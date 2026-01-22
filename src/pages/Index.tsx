import React from "react";
import {
  Sparkles,
  Globe2,
  Brain,
  Gamepad2,
  BookOpen,
  Users,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SearchBar from "@/components/common/SearchBar";
import { useNavigate, Link } from "react-router-dom";
import CountryCard from "@/components/cards/CountryCard";
import FeatureCard from "@/components/cards/FeatureCard";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { SEOMeta } from "@/components/common/SEOMeta";
import {
  generateOrganizationSchema,
  generateWebsiteSchema,
  PAGE_TEMPLATES,
} from "@/lib/seo-utils";

// HeroSection Component
const HeroSection = ({
  onExploreFactsClick,
  onBrowseCountriesClick,
}: {
  onExploreFactsClick: () => void;
  onBrowseCountriesClick: () => void;
}) => {
  return (
    <section className="relative overflow-hidden py-16 md:py-24 lg:py-32">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src="/hero-bg.jpg"
          alt="Books with warm lighting"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
            <Brain className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Explore the World Through Facts & Quizzes
            </span>
          </div>

          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-tight mb-8 animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            Know the World{" "}
            <span className="text-gradient"> In One Glance </span>
          </h1>

          <p
            className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            Explore fascinating facts and quizzes from every corner of the
            globe. Turn curiosity into adventure with world quizzes that make
            learning fun.
          </p>

          <div
            className="flex flex-wrap gap-4 animate-fade-in-up mb-12"
            style={{ animationDelay: "0.3s" }}
          >
            <Button
              size="lg"
              className="gap-2 shadow-hover"
              onClick={onExploreFactsClick}
            >
              <BookOpen className="h-5 w-5" />
              Explore Facts
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={onBrowseCountriesClick}
            >
              Browse Countries
            </Button>
          </div>

          {/* Trust indicators */}
          <div
            className="flex items-center gap-6 text-sm text-muted-foreground animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Learn While You Play</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <span>Every Country Covered</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// StatsSection Component
interface StatItemProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  suffix?: string;
}

const StatItem = ({ icon, value, label, suffix = "" }: StatItemProps) => {
  const [count, setCount] = React.useState(0);
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!isVisible) return;

    const duration = 2000;
    const steps = 60;
    const stepValue = value / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(stepValue * currentStep));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isVisible, value]);

  return (
    <div ref={ref} className="text-center group">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <div className="text-3xl md:text-4xl font-bold font-heading mb-2 animate-count">
        {count.toLocaleString()}
        {suffix}
      </div>
      <div className="text-muted-foreground font-medium">{label}</div>
    </div>
  );
};

const StatsSection = () => {
  const stats = [
    {
      icon: <Sparkles className="h-7 w-7" />,
      value: 10000,
      label: "Facts",
      suffix: "+",
    },
    {
      icon: <Brain className="h-7 w-7" />,
      value: 500,
      label: "Quizzes",
      suffix: "+",
    },
    {
      icon: <Globe2 className="h-7 w-7" />,
      value: 195,
      label: "Countries",
      suffix: "+",
    },
    {
      icon: <Users className="h-7 w-7" />,
      value: 100000,
      label: "Active Users",
      suffix: "+",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, index) => (
            <StatItem key={index} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
};

const Index = () => {
  const [trendingCountries, setTrendingCountries] = React.useState<
    { name: string; slug: string; flag?: string }[]
  >([
    { name: "United States", slug: "united-states", flag: "🇺🇸" },
    { name: "Nepal", slug: "nepal", flag: "🇳🇵" },
    { name: "India", slug: "india", flag: "🇮🇳" },
    { name: "China", slug: "china", flag: "🇨🇳" },
  ]);

  const navigate = useNavigate();
  const searchRef = useRef<HTMLElement | null>(null);
  const trendingRef = useRef<HTMLElement | null>(null);
  const factsRef = useRef<HTMLElement | null>(null);

  // Load dynamic trending countries
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(
          `${
            import.meta.env.VITE_SUPABASE_URL
          }/functions/v1/trending-countries`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          },
        );
        if (!res.ok) {
          setTrendingCountries([
            { name: "United States", slug: "united-states", flag: "🇺🇸" },
            { name: "Nepal", slug: "nepal", flag: "🇳🇵" },
            { name: "India", slug: "india", flag: "🇮🇳" },
            { name: "China", slug: "china", flag: "🇨🇳" },
          ]);
          return;
        }
        const payload = await res.json();
        const data = payload?.data || [];
        if (!mounted) return;
        if (!Array.isArray(data) || data.length === 0) return;

        const items: { name: string; slug: string; flag?: string }[] = [];
        for (const d of data.slice(0, 4)) {
          const name = d.name || d.country || "";
          const slug = String(name)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
          const flag = d.flag || d.flags || undefined;
          items.push({ name, slug, flag });
        }

        for (let i = 0; i < items.length; i++) {
          try {
            const name = items[i].name;
            const resp = await fetch(
              `${
                import.meta.env.VITE_SUPABASE_URL
              }/functions/v1/fetch-country-data`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ countryName: name }),
              },
            );
            if (!resp.ok) continue;
            const p = await resp.json();
            const cdata = p?.data?.data || p?.data || [];
            const first = Array.isArray(cdata) ? cdata[0] : cdata;
            if (first)
              items[i].flag =
                first.flag ||
                first.flagImage ||
                first.flags?.emoji ||
                undefined;
          } catch (e) {
            // ignore
          }
        }

        if (items.length === 4) setTrendingCountries(items);
      } catch (e) {
        console.warn("Failed to load trending countries", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSearch = (value: string) => {
    console.log("Searching for:", value);
  };

  const handleSelect = (country: string) => {
    const slug = country
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    navigate(`/country/${slug}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEOMeta
        title={PAGE_TEMPLATES.home.title}
        description={PAGE_TEMPLATES.home.description}
        keywords={PAGE_TEMPLATES.home.keywords}
        ogImage={`${window.location.origin}/og-image.jpg`}
        structuredData={generateWebsiteSchema()}
      />
      <Navbar />

      <main className="flex-1">
        {/* New Hero Section Component */}
        <HeroSection
          onExploreFactsClick={() =>
            factsRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
          }
          onBrowseCountriesClick={() =>
            searchRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
          }
        />

        {/* New Stats Section Component */}
        <StatsSection />

        {/* Search Section */}
        <section ref={searchRef} className="py-12 bg-card/30">
          <div className="container mx-auto px-4">
            <SearchBar
              onChange={handleSearch}
              onSelect={handleSelect}
              onSubmit={(value) => {
                if (!value) return;
                const slug = value
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/(^-|-$)/g, "");
                navigate(`/country/${slug}`);
              }}
            />
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
        <section ref={factsRef} className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
              <FeatureCard
                title="Fun Facts"
                description="Learn the funniest and mind-blowing facts"
                icon={Sparkles}
                link="/fun-facts"
                iconColor="text-primary"
              />
              <FeatureCard
                title="Fun Zone"
                description="Play, learn, and refresh your mind with interactive games"
                icon={Gamepad2}
                link="/fun-zone"
                iconColor="text-primary"
              />
              <FeatureCard
                title="World Facts"
                description="Travel the world through facts"
                icon={Globe2}
                link="/world-facts"
                iconColor="text-primary"
              />
              <FeatureCard
                title="Play Quiz"
                description="Country wise quiz or Random quiz"
                icon={Brain}
                link="/quiz"
                iconColor="text-primary"
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
