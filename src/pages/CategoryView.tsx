import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { fetchFactsByCategory } from '@/lib/api';
const QuizModal = React.lazy(() => import('../components/QuizModal'));
import { useToast } from '@/hooks/use-toast';

function slugToTitle(slug: string) {
  return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const BATCH_SIZE = 10;

const CategoryView: React.FC = () => {
  const { slug, type } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
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

  const categoryKey = `${type || 'fun-facts'}:${slug}`;

  useEffect(() => {
    // reset when slug/type changes
    setFacts([]);
    setPage(0);
    setHasMore(true);
    cacheRef.current.clear();
    loadMore(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, type]);

  const loadMore = async (nextPage = page) => {
    if (!slug) return;
    // determine whether this page is for world or fun based on pathname
    const isWorld = location.pathname.startsWith('/world-facts');
    const typeKey = (isWorld ? 'world-facts' : 'fun-facts') as 'fun-facts' | 'world-facts';

    // prefer currentCategoryKey if set (used for subcategory paging)
    const preferredKey = currentCategoryKey || `${typeKey}:${slugToTitle(slug)}`;
    const cacheKey = preferredKey;
    try {
      setIsLoading(true);
      // If we've cached a full list for this category, page through it locally
      if (cacheRef.current.has(cacheKey)) {
        const all = cacheRef.current.get(cacheKey) || [];
        const start = nextPage * BATCH_SIZE;
        const slice = all.slice(start, start + BATCH_SIZE);
        setFacts((s) => [...s, ...slice]);
        setHasMore(start + BATCH_SIZE < all.length);
        setPage(nextPage + 1);
        return;
      }

  // If we don't already have the full list cached for the cacheKey, fetch it
  // cacheKey might be in the form 'fun-facts:Title — Sub' or 'fun-facts:Title'
  const fetchCategory = cacheKey.split(':').slice(1).join(':');
  const res = await fetchFactsByCategory(typeKey, fetchCategory);
  const items = res || [];
  cacheRef.current.set(cacheKey, items);
  setCurrentCategoryKey(cacheKey);
  const slice = items.slice(0, BATCH_SIZE);
  setFacts((s) => (nextPage === 0 ? slice : [...s, ...slice]));
  setHasMore(items.length > slice.length);
  setPage(nextPage === 0 ? 1 : nextPage + 1);
    } catch (e) {
      console.error('Failed to load category facts', e);
      toast({ title: 'Error', description: 'Failed to load facts for this category', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = () => {
    const next = page;
    loadMore(next);
  };

  // NOTE: Infinite-scroll via IntersectionObserver was causing repeated triggers and layout jitter
  // that produced a 'shaking' effect. Re-introducing a guarded observer that will trigger
  // loadMore() only when not loading and hasMore is true. This uses a tiny debounce via
  // checking isLoading/hasMore and a short timeout to avoid rapid retriggers.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && hasMore && !isLoading) {
          // small safety delay
          setTimeout(() => {
            if (!isLoading && hasMore) loadMore(page);
          }, 150);
        }
      });
    }, { root: null, rootMargin: '150px', threshold: 0.1 });
    observerRef.current.observe(el);
    return () => observerRef.current?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, isLoading, page, currentCategoryKey]);

  // When a subcategory is chosen from the dropdown, fetch facts for that subtopic
  const handleSubSelect = async (sub: string) => {
    if (!slug) return;
    setShowSubs(false);
    setIsLoading(true);
    setFacts([]);
    try {
      const typeKey = (type === 'world' ? 'world-facts' : 'fun-facts') as 'fun-facts' | 'world-facts';
      const category = `${title} — ${sub}`;
      const cacheKey = `${typeKey}:${category}`;

      if (cacheRef.current.has(cacheKey)) {
        const cached = cacheRef.current.get(cacheKey) || [];
        setFacts(cached.slice(0, BATCH_SIZE));
        setHasMore(cached.length > BATCH_SIZE);
        setPage(1);
        return;
      }

      const res = await fetchFactsByCategory(typeKey, category);
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

  // Prefer the title passed via navigation state so it matches the main category exact label
  const navState: any = (location && (location.state as any)) || {};
  const mainTitle = navState.title || (slug ? slugToTitle(slug.split('-')[0]) : 'Category');
  const availableSubs: string[] = navState.subs || [];
  const title = mainTitle;

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
              <h1 className="text-xl md:text-2xl font-semibold mb-4 text-center animate-fade-in transition-all duration-300"><span className="inline-block pb-1 border-b-2 border-primary/10">{title}</span></h1>

              <div className="w-full flex items-center justify-between mb-6">
              <div>
                <Button variant="outline" onClick={() => setShowSubs((s) => !s)} className="px-4 py-2 text-lg">
                  Facts by Subcategories
                </Button>
              </div>

              <div>
                {/* use native title attribute for tooltip to avoid layout jitter */}
                <Button onClick={() => setOpenQuiz(true)} variant="secondary" className="px-4 py-2 text-lg transform transition-transform duration-200 ease-out hover:scale-105 hover:shadow-[0_10px_24px_rgba(99,102,241,0.10)]" title={`Play a quick quiz about ${title}`}>Play Quiz</Button>
              </div>
            </div>

            {/* Dynamic heading moved below the subcategories so opening the dropdown pushes the heading down */}
          </div>

          {/* Subcategories dropdown (toggle controlled) */}
          {showSubs && (
            <div className="mb-4">
              <div className="bg-card border border-border rounded-lg p-3 shadow-sm">
                {availableSubs.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No subcategories available for this category.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {availableSubs.map((s) => (
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

          {/* Dynamic heading placed after subcategories so it moves down when subs open */}
          {title && (
            <div className="w-full mt-6 mb-2">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">Facts about {title}</h2>
            </div>
          )}

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
                <Button onClick={handleLoadMore} className="w-full">Load more</Button>
              </div>
            )}
            {/* sentinel for guarded infinite scroll (observed by IntersectionObserver) */}
            <div ref={sentinelRef as any} style={{ height: 1 }} />
          </div>
        </div>
      </main>
      <React.Suspense fallback={<div />}>
        <QuizModal open={openQuiz} onOpenChange={setOpenQuiz} topic={title} sourceType={type === 'world' ? 'world' : 'fun'} />
      </React.Suspense>
      <Footer />
    </div>
  );
};

export default CategoryView;
