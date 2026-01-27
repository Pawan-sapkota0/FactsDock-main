import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Target, Users } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center">
              <h1 className="text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  About World Facts
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Your gateway to discovering the world
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div
                onClick={() => (window.location.href = "/fun-facts")}
                className="group cursor-pointer rounded-xl p-6 bg-card border-2 border-transparent hover:border-primary shadow-sm hover:shadow-md transition-all duration-300 ease-in-out hover:scale-105"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") window.location.href = "/fun-facts";
                }}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="bg-primary/10 p-3 rounded-xl">
                    <Globe className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Our Mission</h3>
                  <p className="text-muted-foreground text-sm">
                    To make learning about the world fun, interactive, and
                    accessible to everyone.
                  </p>
                </div>
              </div>

              <div
                onClick={() => (window.location.href = "/world-facts")}
                className="group cursor-pointer rounded-xl p-6 bg-card border-2 border-transparent hover:border-primary shadow-sm hover:shadow-md transition-all duration-300 ease-in-out hover:scale-105"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") window.location.href = "/world-facts";
                }}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="bg-primary/10 p-3 rounded-xl">
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Our Goal</h3>
                  <p className="text-muted-foreground text-sm">
                    To provide accurate, engaging facts and quizzes that spark
                    curiosity about our world.
                  </p>
                </div>
              </div>

              <div className="group cursor-default rounded-xl p-6 bg-card border-2 border-transparent hover:border-primary shadow-sm hover:shadow-md transition-all duration-300 ease-in-out hover:scale-105">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="bg-primary/10 p-3 rounded-xl">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Our Community</h3>
                  <p className="text-muted-foreground text-sm">
                    Join thousands of curious minds exploring the world
                    together.
                  </p>
                </div>
              </div>
            </div>

            <Card className="bg-card border-border hover:shadow-md transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">What We Offer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="pb-4 border-b border-border/50">
                  <h3 className="font-semibold text-lg mb-2 text-foreground">
                    Comprehensive Country Data
                  </h3>
                  <p className="text-muted-foreground">
                    Explore detailed information about countries worldwide,
                    including capital cities, population, currencies, languages,
                    timezones, area, and continent data. Includes live weather
                    information for capital cities.
                  </p>
                </div>
                <div className="pb-4 border-b border-border/50">
                  <h3 className="font-semibold text-lg mb-2 text-foreground">
                    Beautiful Image Galleries
                  </h3>
                  <p className="text-muted-foreground">
                    View curated galleries of high-quality images for each
                    country sourced from Unsplash. Features auto-scrolling,
                    touch navigation, and responsive design.
                  </p>
                </div>
                <div className="pb-4 border-b border-border/50">
                  <h3 className="font-semibold text-lg mb-2 text-foreground">
                    Fun & World Facts
                  </h3>
                  <p className="text-muted-foreground">
                    Discover fascinating facts across multiple categories from
                    animals to science and everything in between. Browse curated
                    facts by category and subcategory.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground">
                    Interactive Quizzes
                  </h3>
                  <p className="text-muted-foreground">
                    Test your knowledge with our engaging quiz system featuring
                    both country-specific and random quizzes. Track your
                    progress and learn while having fun.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
