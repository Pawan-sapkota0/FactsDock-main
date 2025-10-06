import { useState } from "react";
import { Mountain, Scroll, FlaskConical, Users, Newspaper, BarChart, ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CategoryCard from "@/components/cards/CategoryCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { generateQuiz } from '@/lib/quiz';

const WorldFacts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [facts, setFacts] = useState<any[]>([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  
  const categories = [
    { title: "Geography", icon: Mountain },
    { title: "History", icon: Scroll },
    { title: "Science", icon: FlaskConical },
    { title: "Culture", icon: Users },
    { title: "Current Events", icon: Newspaper },
    { title: "National Data", icon: BarChart },
  ];

  const handleCategoryClick = async (categoryTitle: string) => {
    setSelectedCategory(categoryTitle);
    setIsOpen(true);
    setIsLoading(true);
    setFacts([]);

    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          type: 'world-facts',
          category: categoryTitle
        }
      });

      if (error) throw error;

      setFacts(data.data);
      toast({
        title: "Facts Loaded!",
        description: `Generated ${data.data.length} world facts about ${categoryTitle}.`,
      });
    } catch (error) {
      console.error('Error generating facts:', error);
      toast({
        title: "Error",
        description: "Failed to generate facts. Please try again.",
        variant: "destructive",
      });
      setIsOpen(false);
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
                  onClick={() => handleCategoryClick(category.title)}
                />
              ))}
            </div>

            {/* Quiz CTA */}
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20 mt-8">
              <div className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-4 text-foreground">Test Your Knowledge!</h3>
                <p className="text-muted-foreground mb-6">Take a quiz based on world facts and topics you like.</p>
                <Button variant="hero" size="lg" onClick={async () => {
                  try {
                    const questions = await generateQuiz(undefined, 10);
                    localStorage.setItem('currentQuiz', JSON.stringify(questions));
                    // start quiz immediately
                    navigate('/quiz?autoStart=1');
                  } catch (e) {
                    console.error('Failed to generate quiz:', e);
                  }
                }}>Play Quiz</Button>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">World Facts: {selectedCategory}</DialogTitle>
            <DialogDescription>
              Educational facts about our world
            </DialogDescription>
          </DialogHeader>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Generating world facts...</span>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {facts.map((fact, index) => (
                <Card key={index} className="p-6">
                  <h3 className="text-lg font-semibold mb-2 text-primary">
                    {fact.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {fact.description}
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

export default WorldFacts;
