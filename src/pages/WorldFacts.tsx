import { Mountain, Scroll, FlaskConical, Users, Newspaper, BarChart } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CategoryCard from "@/components/cards/CategoryCard";

const WorldFacts = () => {
  const categories = [
    { title: "Geography", icon: Mountain },
    { title: "History", icon: Scroll },
    { title: "Science", icon: FlaskConical },
    { title: "Culture", icon: Users },
    { title: "Current Events", icon: Newspaper },
    { title: "National Data", icon: BarChart },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
                  World Facts
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Explore comprehensive facts and data about our world
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
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

export default WorldFacts;
