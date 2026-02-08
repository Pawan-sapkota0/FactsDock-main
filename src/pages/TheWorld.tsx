import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PreFooterCTA from "@/components/layout/PreFooterCTA";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Users, Mountain, Zap, MapPin } from "lucide-react";
import GeographyImageOverlay from "@/components/overlays/GeographyImageOverlay";
import { useGeographyCardImages } from "@/hooks/use-geography-card-images";

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  clickable?: boolean;
  onClick?: () => void;
  hasImages?: boolean;
  onViewImages?: () => void;
}

const StatCard = ({
  title,
  value,
  description,
  clickable,
  onClick,
  hasImages,
  onViewImages,
}: StatCardProps) => (
  <Card
    className={`relative h-full transition-all duration-300 ${
      clickable
        ? "cursor-pointer hover:shadow-lg hover:scale-105 border-2 hover:border-primary"
        : "hover:shadow-md"
    }`}
    onClick={onClick}
  >
    <CardHeader>
      <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <div className="text-3xl md:text-4xl font-bold text-primary">
          {value}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </CardContent>
    {hasImages && (
      <div className="absolute bottom-3 right-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewImages?.();
          }}
          className="text-xs font-medium text-primary hover:text-primary/80 transition-colors hover:underline"
          title="View images for this card"
        >
          View Images
        </button>
      </div>
    )}
  </Card>
);

interface GeographyCardConfig {
  id: string;
  title: string;
  value: string;
  description: string;
  searchQuery: string;
}

const GEOGRAPHY_CARDS: GeographyCardConfig[] = [
  {
    id: "highest",
    title: "Highest Point",
    value: "Mt. Everest",
    description: "8,848.86 m above sea level",
    searchQuery: "Mount Everest",
  },
  {
    id: "lowest",
    title: "Lowest Point (Land)",
    value: "Dead Sea Shore",
    description: "−430 m below sea level",
    searchQuery: "Dead Sea",
  },
  {
    id: "ocean",
    title: "Largest Ocean",
    value: "Pacific Ocean",
    description: "Covers ~46% of water surface",
    searchQuery: "Pacific Ocean",
  },
  {
    id: "desert",
    title: "Largest Desert",
    value: "Antarctica",
    description: "World's largest cold desert",
    searchQuery: "Antarctica",
  },
  {
    id: "river",
    title: "Longest River",
    value: "Nile River",
    description: "~6,650 km across Africa",
    searchQuery: "Nile River",
  },
  {
    id: "lake",
    title: "Largest Lake",
    value: "Caspian Sea",
    description: "~371,000 km² in surface area",
    searchQuery: "Caspian Sea",
  },
];

const TheWorld = () => {
  const navigate = useNavigate();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const selectedCard = GEOGRAPHY_CARDS.find((c) => c.id === selectedCardId);
  const { images, isLoading } = useGeographyCardImages(
    selectedCard?.searchQuery || null,
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto text-center space-y-6 mb-16">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              The World
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Global knowledge & overview at a glance
            </p>
          </div>

          {/* Core World Statistics */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-foreground">
              Core World Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Continents"
                value="7"
                description="Asia, Africa, North America, South America, Antarctica, Europe, Australia"
              />
              <StatCard
                title="Total Countries"
                value="195"
                description="193 UN members + 2 observers"
              />
              <StatCard
                title="World Population"
                value="8+ billion"
                description="Growing at a slowing rate globally"
              />
              <StatCard
                title="Total Land Area"
                value="~149M km²"
                description="Continents and islands combined"
              />
              <StatCard
                title="Water Coverage"
                value="~71%"
                description="Oceans dominate the planet"
              />
              <StatCard
                title="Languages Spoken"
                value="7,000+"
                description="Diverse linguistic heritage"
              />
              <StatCard
                title="Time Zones"
                value="24"
                description="UTC -12 to UTC +14"
              />
              <StatCard
                title="Earth's Age"
                value="~4.54B years"
                description="Formed from solar nebula"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Source: <span className="text-green-600"> •</span> Verified global
              data
            </p>
          </div>

          {/* Geography Highlights */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-foreground">
              Geography Highlights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {GEOGRAPHY_CARDS.map((card) => (
                <StatCard
                  key={card.id}
                  title={card.title}
                  value={card.value}
                  description={card.description}
                  hasImages={true}
                  onViewImages={() => setSelectedCardId(card.id)}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Source: <span className="text-green-600"> • </span> Verified
              global data
            </p>
          </div>

          {/* Human & Civilization Data */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-foreground">
              Human & Civilization Data
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Most Populated Country"
                value="India"
                description="Recent demographic milestone"
              />
              <StatCard
                title="Largest Country (Area)"
                value="Russia"
                description="~17.1 million km²"
              />
              <StatCard
                title="Smallest Country"
                value="Vatican City"
                description="~0.44 km² sovereign state"
              />
              <StatCard
                title="Urbanization Rate"
                value="~56%"
                description="Of humans live in cities"
              />
              <StatCard
                title="Currencies in Use"
                value="180+"
                description="Diverse economic systems"
              />
              <StatCard
                title="Religions"
                value="Many"
                description="Rich spiritual diversity"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Source: <span className="text-green-600"> •</span> Verified global
              data
            </p>
          </div>

          {/* Optional Clickable Navigation Cards */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-foreground">
              Explore More
            </h2>
            <p className="text-muted-foreground mb-6">
              Discover more about our world's countries, facts, and quizzes.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card
                className="relative cursor-pointer hover:shadow-lg hover:scale-105 border-2 hover:border-primary transition-all duration-300 h-full"
                onClick={() => navigate("/world-facts")}
              >
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <div className="bg-primary/10 p-3 rounded-xl">
                      <Mountain className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-lg text-center">
                    World Facts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-center text-muted-foreground">
                    Discover fascinating facts about countries and continents
                  </p>
                </CardContent>
              </Card>

              <Card
                className="relative cursor-pointer hover:shadow-lg hover:scale-105 border-2 hover:border-primary transition-all duration-300 h-full"
                onClick={() => navigate("/quiz")}
              >
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <div className="bg-primary/10 p-3 rounded-xl">
                      <Zap className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-lg text-center">
                    World Quizzes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-center text-muted-foreground">
                    Test your knowledge with interactive quizzes
                  </p>
                </CardContent>
              </Card>

              <Card
                className="relative cursor-pointer hover:shadow-lg hover:scale-105 border-2 hover:border-primary transition-all duration-300 h-full"
                onClick={() => navigate("/fun-facts")}
              >
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <div className="bg-primary/10 p-3 rounded-xl">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-lg text-center">
                    Fun Facts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-center text-muted-foreground">
                    Enjoy entertaining and surprising facts about our world
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Image Overlay for Geography Cards */}
      {selectedCard && (
        <GeographyImageOverlay
          isOpen={selectedCardId !== null}
          onClose={() => setSelectedCardId(null)}
          images={images}
          title={selectedCard.value}
          isLoading={isLoading}
        />
      )}

      <PreFooterCTA />
      <Footer />
    </div>
  );
};

export default TheWorld;
