import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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

            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <div className="bg-primary/10 p-3 rounded-xl w-fit mx-auto mb-2">
                    <Globe className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-center">Our Mission</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center">
                    To make learning about the world fun, interactive, and accessible to everyone.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="bg-secondary/10 p-3 rounded-xl w-fit mx-auto mb-2">
                    <Target className="h-8 w-8 text-secondary" />
                  </div>
                  <CardTitle className="text-center">Our Goal</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center">
                    To provide accurate, engaging facts and quizzes that spark curiosity about our world.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="bg-accent/10 p-3 rounded-xl w-fit mx-auto mb-2">
                    <Users className="h-8 w-8 text-accent" />
                  </div>
                  <CardTitle className="text-center">Our Community</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center">
                    Join thousands of curious minds exploring the world together.
                  </p>
                </CardContent>
              </Card>
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
