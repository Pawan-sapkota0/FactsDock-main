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
              {/* Card shared styles: rounded, padded, shadow, responsive */}
              <div
                onClick={() => (window.location.href = '/fun-facts')}
                className="group cursor-pointer rounded-lg p-6 bg-gradient-to-br from-white/60 to-gray-50 border border-gray-200 shadow-sm hover:shadow-lg transform transition-all duration-300 ease-in-out hover:scale-103 md:hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 relative"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') window.location.href = '/fun-facts'; }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="bg-muted p-3 rounded-2xl mb-4">
                    <Globe className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Our Mission</h3>
                  <p className="text-muted-foreground">To make learning about the world fun, interactive, and accessible to everyone.</p>
                </div>
                {/* border accent on hover (uses group hover to change border color) */}
                <div className="absolute inset-0 rounded-lg pointer-events-none border-2 border-transparent group-hover:border-blue-500 transition-colors duration-300 ease-in-out" />
              </div>

              <div
                onClick={() => (window.location.href = '/world-facts')}
                className="group cursor-pointer rounded-lg p-6 bg-gradient-to-br from-white/60 to-gray-50 border border-gray-200 shadow-sm hover:shadow-lg transform transition-all duration-300 ease-in-out hover:scale-103 md:hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 relative"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') window.location.href = '/world-facts'; }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="bg-muted p-3 rounded-2xl mb-4">
                    <Target className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Our Goal</h3>
                  <p className="text-muted-foreground">To provide accurate, engaging facts and quizzes that spark curiosity about our world.</p>
                </div>
                <div className="absolute inset-0 rounded-lg pointer-events-none border-2 border-transparent group-hover:border-purple-500 transition-colors duration-300 ease-in-out" />
              </div>

              <div
                className="group cursor-default rounded-lg p-6 bg-gradient-to-br from-white/60 to-gray-50 border border-gray-200 shadow-sm hover:shadow-lg transform transition-all duration-300 ease-in-out hover:scale-103 md:hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent relative"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="bg-muted p-3 rounded-2xl mb-4">
                    <Users className="h-8 w-8 text-accent" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Our Community</h3>
                  <p className="text-muted-foreground">Join thousands of curious minds exploring the world together.</p>
                </div>
                <div className="absolute inset-0 rounded-lg pointer-events-none border-2 border-transparent group-hover:border-accent transition-colors duration-300 ease-in-out" />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">What We Offer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground">Comprehensive Country Data</h3>
                  <p className="text-muted-foreground">
                    Explore detailed information about countries worldwide, including geography, culture, and current events.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground">Fun & World Facts</h3>
                  <p className="text-muted-foreground">
                    Discover fascinating facts across multiple categories from animals to science and everything in between.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground">Interactive Quizzes</h3>
                  <p className="text-muted-foreground">
                    Test your knowledge with our engaging quiz system featuring both country-specific and random quizzes.
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
