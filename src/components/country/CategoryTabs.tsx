import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { fetchFactsForCountry, fetchCountryFacts } from '@/lib/api';
import { fetchFactsByCategory } from '@/lib/facts';
import { supabase } from '@/integrations/supabase/client';
import LazyFactCard from '@/components/cards/LazyFactCard';

type Props = {
  country?: string;
};

const categories = ["Geography", "History", "Culture", "National Data", "Current Events"];

export default function CategoryTabs({ country }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const [facts, setFacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const factTypeIdRef = useRef<string | null>(null);

  const loadFacts = async (category: string) => {
    setActive(category);
    setLoading(true);
    try {
      const opts: any = {};
      if (factTypeIdRef.current) opts.fact_type_id = factTypeIdRef.current;
      const result = country
        ? await fetchCountryFacts(country, { ...opts, category })
        : await fetchFactsByCategory('world-facts', category, opts);
      setFacts(result || []);
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to load facts', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // resolve fact_type id for 'world-facts' once
    void (async () => {
      try {
        const r: any = await supabase.from('fact_types').select('id').eq('slug', 'world-facts').maybeSingle();
        factTypeIdRef.current = r?.data?.id || null;
      } catch (e) {
        factTypeIdRef.current = null;
      }
    })();
  }, []);

  // use shared lazy wrapper

  return (
    <div className="mb-8">
      <div className="flex gap-3 mb-4">
        {categories.map((c) => (
          <Button key={c} variant={active === c ? 'default' : 'outline'} onClick={() => loadFacts(c)}>{c}</Button>
        ))}
      </div>

      {loading ? <div>Loading facts...</div> : (
        <div className="grid md:grid-cols-2 gap-4">
            {(() => {
            const displayed = (facts || []).filter((f) => !(f && (f as any).subcategory_id));
            return displayed.map((f, i) => (
              <div key={i}>
                <React.Suspense fallback={<div />}>
                  <LazyFactCard fact={f?.fact_text || f?.fact || f?.title || ''} />
                </React.Suspense>
              </div>
            ));
          })()}
        </div>
      )}
    </div>
  );
}
