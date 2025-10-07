import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dog, FlaskConical, Scroll, Apple, Trophy, Mountain, Sparkles, Loader2, X } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CategoryCard from "@/components/cards/CategoryCard";
import { useToast } from "@/hooks/use-toast";
import { fetchFactsByCategory } from '@/lib/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { generateQuiz } from '@/lib/quiz';
import { Button } from "@/components/ui/button";

const FunFacts = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [facts, setFacts] = useState<any[]>([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  const categories = [
    { title: "Animals", icon: Dog },
    { title: "Science & Technology", icon: FlaskConical },
    { title: "History", icon: Scroll },
    { title: "Foods", icon: Apple },
    { title: "Sports", icon: Trophy },
    { title: "Geography", icon: Mountain },
    { title: "Random & Weird", icon: Sparkles },
  ];

  const handleCategoryClick = async (categoryTitle: string) => {
    setSelectedCategory(categoryTitle);
    // Render inline instead of forcing navigation — open modal for details only
    setIsLoading(true);
    setFacts([]);

    try {
      const result = await fetchFactsByCategory('fun-facts', categoryTitle, { force: true });
  setFacts(result || []);
      toast({
        title: "Facts Loaded!",
        description: `Generated ${result?.length || (Array.isArray(facts) ? facts.length : 0)} fun facts about ${categoryTitle}.`,
      });
    } catch (error) {
      console.error('Error generating facts:', error);
      toast({
        title: "Error",
        description: "Failed to generate facts. Please try again.",
        variant: "destructive",
      });
      // keep inline state
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="mb-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>

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
                  onClick={() => handleCategoryClick(category.title)}
                />
              ))}
            </div>

            {/* Inline Facts */}
            {selectedCategory && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">{selectedCategory} — Fun Facts</h2>
                {isLoading ? (
                  <div className="flex items-center gap-3"><Loader2 className="animate-spin" /> Generating facts...</div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {facts.map((fact, idx) => (
                      <Card key={idx} className="p-4">
                        <h3 className="font-semibold">{fact.title}</h3>
                        <p className="text-muted-foreground">{fact.fact}</p>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quiz CTA */}
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20 mt-8">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-4 text-foreground">Test Your Knowledge!</h3>
                <p className="text-muted-foreground mb-6">Take a quiz based on fun facts and topics you like.</p>
                <Button variant="hero" size="lg" onClick={async () => {
                  try {
                    const questions = await generateQuiz(undefined, 10);
                    localStorage.setItem('currentQuiz', JSON.stringify(questions));
                    navigate('/quiz?autoStart=1');
                  } catch (e) {
                    console.error('Failed to generate quiz:', e);
                  }
                }}>Play Quiz</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Fun Facts: {selectedCategory}</DialogTitle>
            <DialogDescription>
              Discover amazing and entertaining facts
            </DialogDescription>
          </DialogHeader>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Generating fun facts...</span>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {facts.map((fact, index) => (
                <Card key={index} className="p-6">
                  <h3 className="text-lg font-semibold mb-2 text-primary">
                    {fact.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {fact.fact}
                  </p>
                </Card>
              ))}
              {facts.length > 0 && (
                <Button 
                  onClick={() => handleCategoryClick(selectedCategory)} 
                  variant="outline"
                  className="w-full"
                >
                  Generate More Facts
                </Button>
              )}
              {facts.length > 0 && (
                <div className="pt-4">
                  <Button
                      variant="secondary"
                      className="w-full"
                      onClick={async () => {
                        setIsGeneratingQuiz(true);
                        try {
                          toast({ title: 'Generating quiz', description: `Generating quiz for ${selectedCategory}...` });
                          const questions = await generateQuiz(selectedCategory, 10);
                          localStorage.setItem('currentQuiz', JSON.stringify(questions));
                          navigate('/quiz?autoStart=1');
                          toast({ title: 'Quiz ready', description: 'Quiz generated and starting now.' });
                        } catch (e) {
                          console.error('Failed to generate quiz:', e);
                          toast({ title: 'Error', description: 'Failed to generate quiz. Try again.', variant: 'destructive' });
                        } finally {
                          setIsGeneratingQuiz(false);
                        }
                      }}
                      disabled={isGeneratingQuiz}
                    >
                      {isGeneratingQuiz ? 'Generating...' : 'Play Quiz'}
                    </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default FunFacts;
