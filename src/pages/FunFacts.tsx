import { Dog, FlaskConical, Scroll, Apple, Trophy, Mountain, Sparkles } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CategoryCard from "@/components/cards/CategoryCard";

const FunFacts = () => {
  const categories = [
    { title: "Animals", icon: Dog },
    { title: "Science & Technology", icon: FlaskConical },
    { title: "History", icon: Scroll },
    { title: "Foods", icon: Apple },
    { title: "Sports", icon: Trophy },
    { title: "Geography", icon: Mountain },
    { title: "Random & Weird", icon: Sparkles },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                  Fun Facts
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Discover amazing and entertaining facts from around the world
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FunFacts;
