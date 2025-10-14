import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { fetchFactsByCategory, fetchFactsForCountry } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
const QuizModal = React.lazy(() => import('../components/QuizModal'));

function slugToTitle(slug: string) {
  return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const BATCH_SIZE = 10;

const CountryCategoryPage: React.FC = () => {
  const { country, category } = useParams<{ country: string; category: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [facts, setFacts] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [openQuiz, setOpenQuiz] = useState(false);
  const [showSubs, setShowSubs] = useState(false);
  const [currentCategoryKey, setCurrentCategoryKey] = useState<string | null>(null);

  const cacheRef = useRef<Map<string, any[]>>(new Map());
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const title = category ? slugToTitle(category) : 'Category';
  const countryName = country ? slugToTitle(country) : 'Country';
  const pageKey = `${countryName}:${title}`;

  // predefined subcategories mapping based on the user's provided list
  const subcategoryMap: Record<string, string[]> = {
    'Geography & Nature': [
      'Major Landforms',
      'Climate & Weather Patterns',
      'Natural Resources',
      'Borders & Neighboring Countries',
      'National Parks or Natural Wonders',
    ],
    'Culture & Tradition': [
      'Festivals & Celebrations',
      'Traditional Dress',
      'Local Foods / Cuisine',
      'Arts, Music & Dance',
      'Cultural Symbols',
    ],
    'History & Heritage': [
      'Founding / Independence Date',
      'Historical Background',
      'Important Leaders or Rulers',
      'Historical Monuments & Heritage Sites',
    ],
    'Economy & Industry': [
      'Major Industries',
      'GDP (approximate)',
      'Important Exports / Imports',
      'Currency Strength & Economy Type',
    ],
    'Tourism & Landmarks': [
      'Popular Tourist Attractions',
      'UNESCO World Heritage Sites',
      'Famous Cities & Places',
      'Natural & Man-made Wonders',
    ],
    'Education & Innovation': [
      'Literacy Rate',
      'Notable Universities',
      'Scientific or Technological Contributions',
      'Research & Development',
    ],
    'Sports & Achievements': [
      'National Sports',
      'Famous Athletes',
      'Olympic Participation or Wins',
      'Major Sporting Events',
    ],
    'Fun & Interesting Facts': [
      'Unique Laws or Customs',
      'World Records or Only in This Country',
      'Weird Traditions / Oddities',
      'International Rankings',
    ],
    'Global Presence': [
      'Memberships (UN, WHO, etc.)',
      'Diplomatic Relations',
      'Embassies / Global Impact',
      'Contribution to Global Issues',
    ],
  };

  useEffect(() => {
    setFacts([]);
    setPage(0);
    setHasMore(true);
    cacheRef.current.clear();
    loadMore(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, category]);

  const loadMore = async (nextPage = page) => {
    if (!category || !country) return;
    const cacheKey = pageKey;
    try {
      setIsLoading(true);
      if (cacheRef.current.has(cacheKey)) {
        const all = cacheRef.current.get(cacheKey) || [];
        const start = nextPage * BATCH_SIZE;
        const slice = all.slice(start, start + BATCH_SIZE);
        setFacts((s) => [...s, ...slice]);
        setHasMore(start + BATCH_SIZE < all.length);
        setPage(nextPage + 1);
        return;
      }

  // Use the country-specific helper so we request world-facts for this country+category
  const res = await fetchFactsForCountry(countryName, title);
      const items = res || [];
      cacheRef.current.set(cacheKey, items);
      const slice = items.slice(0, BATCH_SIZE);
      setFacts((s) => (nextPage === 0 ? slice : [...s, ...slice]));
      setHasMore(items.length > slice.length);
      setPage(nextPage === 0 ? 1 : nextPage + 1);
    } catch (e) {
      console.error('Failed to load category facts for country', e);
      toast({ title: 'Error', description: 'Failed to load facts for this category', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // When a subcategory is selected, build a cacheKey with country + category + sub
  const handleSubSelect = async (sub: string) => {
    if (!category || !country) return;
    setShowSubs(false);
    setIsLoading(true);
    setFacts([]);
    try {
      const cacheKey = `${countryName}:${title}:${sub}`;

      // If cached, page through the cached list locally
      if (cacheRef.current.has(cacheKey)) {
        const cached = cacheRef.current.get(cacheKey) || [];
        setFacts(cached.slice(0, BATCH_SIZE));
        setHasMore(cached.length > BATCH_SIZE);
        setPage(1);
        setCurrentCategoryKey(cacheKey);
        return;
      }

      // Fetch subcategory facts for this country
      const res = await fetchFactsForCountry(countryName, `${title} — ${sub}`);
      const items = res || [];
      cacheRef.current.set(cacheKey, items);
      setCurrentCategoryKey(cacheKey);
      setFacts(items.slice(0, BATCH_SIZE));
      setHasMore(items.length > BATCH_SIZE);
      setPage(1);
    } catch (e) {
      console.error('Failed to load subcategory facts', e);
      toast({ title: 'Error', description: 'Failed to load subcategory facts', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && hasMore && !isLoading) {
          setTimeout(() => {
            if (!isLoading && hasMore) loadMore(page);
          }, 150);
        }
      });
    }, { root: null, rootMargin: '150px', threshold: 0.1 });
    observerRef.current.observe(el);
    return () => observerRef.current?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, isLoading, page]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-2">
            <div className="flex items-center justify-start">
              <Button variant="ghost" onClick={() => navigate(-1)} className="mr-3 px-3 py-2 text-base">
                <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
              </Button>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <h1 className="text-xl md:text-2xl font-semibold mb-4 text-center animate-fade-in transition-all duration-300"><span className="inline-block pb-1 border-b-2 border-primary/10">{title} of {countryName}</span></h1>

            <div className="w-full flex items-center justify-between mb-6">
              <div>
                <Button variant="outline" onClick={() => setShowSubs((s) => !s)} className="px-4 py-2 text-lg">Facts by Subcategories</Button>
              </div>

              <div>
                <Button onClick={() => setOpenQuiz(true)} variant="secondary" className="px-4 py-2 text-lg transform transition-transform duration-200 ease-out hover:scale-105 hover:shadow-[0_10px_24px_rgba(99,102,241,0.10)]" title={`Play a quick quiz about ${title} of ${countryName}`}>Play Quiz</Button>
              </div>
            </div>
          </div>

          {/* Subcategories dropdown (toggle controlled) */}
          {showSubs && (
            <div className="mb-4">
              <div className="bg-card border border-border rounded-lg p-3 shadow-sm">
                {(!subcategoryMap[title] || subcategoryMap[title].length === 0) ? (
                  <div className="text-sm text-muted-foreground">No subcategories available for this category.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {subcategoryMap[title].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSubSelect(s)}
                        className="w-full text-left px-3 py-2 rounded hover:scale-105 transition-transform duration-150 bg-transparent"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-foreground">{s}</span>
                          <span className="text-xs text-muted-foreground">View</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="w-full mt-6 mb-2">
            <h2 className="text-xl md:text-2xl font-semibold text-foreground">Facts about {title} of {countryName}</h2>
          </div>

          <div className="space-y-4">
            {facts.length === 0 && !isLoading && (
              <Card className="p-6 text-center">No facts available for this topic yet.</Card>
            )}

            {facts.map((f, i) => (
              <Card key={i} className="p-4">
                <h3 className="font-semibold">{f.title || f}</h3>
                <p className="text-muted-foreground">{f.fact || f.description || ''}</p>
              </Card>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2"><Loader2 className="animate-spin" /> Loading...</div>
            )}

            {!isLoading && hasMore && (
              <div className="pt-4">
                <Button onClick={() => loadMore(page)} className="w-full">Load more</Button>
              </div>
            )}

            <div ref={sentinelRef as any} style={{ height: 1 }} />
          </div>
        </div>
      </main>
      <React.Suspense fallback={<div />}>
        <QuizModal open={openQuiz} onOpenChange={setOpenQuiz} topic={`${title} of ${countryName}`} sourceType={'fun'} />
      </React.Suspense>
      <Footer />
    </div>
  );
};

export default CountryCategoryPage;
