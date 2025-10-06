import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Users, DollarSign, Languages, Flag } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CategoryCard from "@/components/cards/CategoryCard";

const Country = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  // Mock data - will be replaced with API data
  const countryData = {
    name: slug?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    flag: "🇺🇸",
    capital: "Washington, D.C.",
    population: "331 million",
    currency: "US Dollar (USD)",
    languages: "English",
    area: "9.8 million km²",
  };

  const categories = [
    { title: "Geography", icon: MapPin },
    { title: "History", icon: Flag },
    { title: "Culture", icon: Users },
    { title: "Current Events", icon: DollarSign },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>

          <div className="max-w-5xl mx-auto space-y-8">
            {/* Country Header */}
            <div className="text-center space-y-4">
              <div className="text-8xl">{countryData.flag}</div>
              <h1 className="text-5xl font-bold text-foreground">{countryData.name}</h1>
            </div>

            {/* Main Facts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Main Facts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-semibold text-foreground">Capital</p>
                      <p className="text-muted-foreground">{countryData.capital}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-semibold text-foreground">Population</p>
                      <p className="text-muted-foreground">{countryData.population}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-semibold text-foreground">Currency</p>
                      <p className="text-muted-foreground">{countryData.currency}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Languages className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-semibold text-foreground">Languages</p>
                      <p className="text-muted-foreground">{countryData.languages}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <div>
              <h2 className="text-2xl font-bold mb-6 text-foreground">Explore Categories</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.map((category) => (
                  <CategoryCard
                    key={category.title}
                    title={category.title}
                    icon={category.icon}
                    onClick={() => console.log(`Selected category: ${category.title}`)}
                  />
                ))}
              </div>
            </div>

            {/* Quiz CTA */}
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-4 text-foreground">
                  Test Your Knowledge!
                </h3>
                <p className="text-muted-foreground mb-6">
                  Take a quiz about {countryData.name} and see how much you know
                </p>
                <Button variant="hero" size="lg" onClick={() => navigate(`/quiz?country=${slug}`)}>
                  Play Quiz for {countryData.name}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Country;
