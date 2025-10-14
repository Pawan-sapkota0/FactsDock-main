import React, { useState } from "react";
import { Mountain, Scroll, FlaskConical, Users, Newspaper, BarChart, ArrowLeft, Loader2, Dog, Apple, Trophy, MapPin, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CategoryCard from "@/components/cards/CategoryCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { fetchFactsByCategory } from '@/lib/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
// import { generateQuiz } from '@/lib/quiz';
const QuizModal = React.lazy(() => import('@/components/QuizModal'));

const WorldFacts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [facts, setFacts] = useState<any[]>([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [openQuizModal, setOpenQuizModal] = useState(false);
  const [quizModalTopic, setQuizModalTopic] = useState<string | undefined>(undefined);
  
  // New main categories + subcategories (9 primary groups)
  const mainCategories = [
    {
      title: 'Geography & Nature',
      icon: Mountain,
      subs: [
        "Countries & Capitals",
        'Mountains & Volcanoes',
        'Rivers, Lakes & Oceans',
        'Deserts & Forests',
        'Natural Wonders',
        'Continents & Islands',
      ],
    },
    {
      title: 'History & Culture',
      icon: Scroll,
      subs: [
        'Ancient Civilizations',
        'Historical Events',
        'Monuments & Heritage Sites',
        'Festivals & Traditions',
        'Languages of the World',
        'Flags & Symbols',
      ],
    },
    {
      title: 'Science & Discovery',
      icon: FlaskConical,
      subs: [
        'Space & Planets',
        'Inventions & Discoveries',
        'Wildlife & Ecosystems',
        'Climate & Weather',
        'Human Body Facts',
        'Technology & Innovation',
      ],
    },
    {
      title: 'People & Society',
      icon: Users,
      subs: [
        'Famous Personalities',
        'World Records',
        'Population & Cities',
        'Education & Lifestyle',
        'Global Economy',
        'Travel & Tourism',
      ],
    },
    {
      title: 'Foods & Flavors',
      icon: Apple,
      subs: [
        'Nutrition & Healthy Foods',
        'Global Cuisines & Ingredients',
        'Food History & Origins',
        'Agricultural Practices',
        'Food Production & Sustainability',
        'Famous Dishes Around the World',
        'Food Science & Chemistry',
      ],
    },
    {
      title: 'Animals & Wildlife',
      icon: Dog,
      subs: [
        'Animal Habitats & Behavior',
        'Endangered Species',
        'Animal Adaptations',
        'Interesting Animal Facts',
        'Wildlife Conservation',
        'Animal Classification & Types',
        'Animal Life Cycles',
      ],
    },
    {
      title: 'Art, Music & Entertainment',
      icon: Sparkles,
      subs: [
        'World Art & Museums',
        'Global Music Genres',
        'Movies & Media',
        'Literature & Books',
        'Architecture Styles',
      ],
    },
    {
      title: 'National Data',
      icon: BarChart,
      subs: [
        'Population Statistics',
        'Literacy & Education Rates',
        'Economic Data & GDP',
        'Health & Life Expectancy',
        'Employment & Industry Facts',
        'Geography & Land Area',
        'Government & Political Structure',
      ],
    },
    {
      title: 'Fun Zones',
      icon: Trophy,
      subs: [
        '“Did You Know?” Series',
        'Mind-Blowing Facts',
        'Unsolved Mysteries',
        'Myths & Legends',
        'Random Global Curiosities',
      ],
    },
  ];

  const [openMain, setOpenMain] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);

  // Component-level cache and pending map for subcategory results
  const subCacheRef = new Map<string, any[]>();
  const pendingRef = new Map<string, Promise<any[]>>();

  const handleMainClick = (title: string) => {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const mc = mainCategories.find((m) => m.title === title);
    navigate(`/world-facts/${slug}`, { state: { title, subs: mc?.subs || [] } });
  };

  const handleSubClick = async (main: string, sub: string) => {
    setIsLoading(true);
    setSelectedCategory(main);
    setSelectedSub(sub);
    setFacts([]);
    try {
      const key = `${main} — ${sub}`;

      if (subCacheRef.has(key)) {
        const cached = subCacheRef.get(key) || [];
        setFacts(cached);
        toast({ title: 'Loaded from cache', description: `Loaded ${cached.length} cached facts for ${sub}.` });
        setIsLoading(false);
        return;
      }

      if (pendingRef.has(key)) {
        const pending = pendingRef.get(key)!;
        const result = await pending;
        setFacts(result || []);
        toast({ title: 'Facts Loaded', description: `Loaded ${result?.length || 0} facts for ${sub}.` });
        return;
      }

      const promise = (async () => {
        const res = await fetchFactsByCategory('world-facts', key, { force: true });
        subCacheRef.set(key, res || []);
        pendingRef.delete(key);
        return res || [];
      })();

      pendingRef.set(key, promise);
      const result = await promise;
      setFacts(result || []);
      toast({ title: 'Facts Loaded', description: `Loaded ${result?.length || 0} facts for ${sub}.` });
    } catch (error) {
      console.error('Error generating facts:', error);
      toast({ title: 'Error', description: 'Failed to load facts. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to re-fetch facts for a main category (used by "Generate More Facts" button)
  const handleMainFetch = async (main: string) => {
    if (!main) return;
    setIsLoading(true);
    setFacts([]);
    try {
      const key = main;
      if (subCacheRef.has(key)) {
        const cached = subCacheRef.get(key) || [];
        setFacts(cached);
        toast({ title: 'Loaded from cache', description: `Loaded ${cached.length} cached facts for ${main}.` });
        setIsLoading(false);
        return;
      }
      if (pendingRef.has(key)) {
        const pending = pendingRef.get(key)!;
        const result = await pending;
        setFacts(result || []);
        toast({ title: 'Facts Loaded', description: `Loaded ${result?.length || 0} facts for ${main}.` });
        return;
      }
      const promise = (async () => {
        const res = await fetchFactsByCategory('world-facts', key, { force: true });
        subCacheRef.set(key, res || []);
        pendingRef.delete(key);
        return res || [];
      })();
      pendingRef.set(key, promise);
      const result = await promise;
      setFacts(result || []);
      toast({ title: 'Facts Loaded', description: `Loaded ${result?.length || 0} facts for ${main}.` });
    } catch (error) {
      console.error('Error generating facts:', error);
      toast({ title: 'Error', description: 'Failed to reload facts. Please try again.', variant: 'destructive' });
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

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {mainCategories.map((mc) => (
                <div key={mc.title} className="relative">
                  <CategoryCard title={mc.title} icon={mc.icon} onClick={() => handleMainClick(mc.title)} />

                  {/* Subcategory panel */}
                  <div
                    aria-hidden={openMain !== mc.title}
                    className={`absolute z-20 w-full mt-2 left-0 transition-all duration-300 ${openMain === mc.title ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
                  >
                    <div className="bg-card border border-border rounded-lg p-3 shadow-sm">
                      <div className="grid grid-cols-1 gap-2">
                        {mc.subs.map((sub) => (
                          <button
                            key={sub}
                            onClick={() => {
                              const mainSlug = mc.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                              const subSlug = sub.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                              navigate(`/world-facts/${mainSlug}-${subSlug}`, { state: { title: mc.title, subs: mc.subs } });
                            }}
                            className="w-full text-left px-3 py-2 rounded hover:scale-105 transition-transform duration-150 bg-transparent"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-foreground">{sub}</span>
                              <span className="text-xs text-muted-foreground">View</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Inline Facts (when a subcategory is selected) */}
            {selectedSub && (
              <div className="mt-6">
                <div className="mb-2">
                  <h2 className="text-xl md:text-2xl font-semibold text-foreground">Facts about {selectedSub}</h2>
                </div>

                {isLoading ? (
                  <div className="flex items-center gap-3"><Loader2 className="animate-spin" /> Generating facts...</div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {facts.map((fact, idx) => (
                      <Card key={idx} className="p-4 transform transition-all duration-400 opacity-0 animate-fade-in" style={{ animationDelay: `${idx * 60}ms` }}>
                        <h3 className="font-semibold">{fact.title}</h3>
                        <p className="text-muted-foreground">{fact.description}</p>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quiz CTA */}
                <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20 mt-8">
              <div className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-4 text-foreground">Test Your Knowledge!</h3>
                <p className="text-muted-foreground mb-6">Take a quiz based on world facts and topics you like.</p>
                <Button variant="hero" size="lg" className="transform transition-transform duration-200 ease-out hover:scale-105 hover:shadow-[0_12px_30px_rgba(99,102,241,0.12)]" onClick={() => {
                  // open inline quiz modal (random)
                  setQuizModalTopic(undefined);
                  setOpenQuizModal(true);
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
                  onClick={() => handleMainFetch(selectedCategory)} 
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
                      onClick={() => {
                        // open inline quiz modal for the selected category
                        setQuizModalTopic(selectedCategory || undefined);
                        setOpenQuizModal(true);
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
      <React.Suspense fallback={<div />}>
        <QuizModal open={openQuizModal} onOpenChange={setOpenQuizModal} topic={quizModalTopic} sourceType="world" />
      </React.Suspense>
    </div>
  );
};

export default WorldFacts;
