import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateQuiz } from '@/lib/quiz';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type Props = {
  country?: string;
};

const categories = ["Geography", "History", "Culture", "National Data", "Current Events"];

export default function CategoryTabs({ country }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const [facts, setFacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadFacts = async (category: string) => {
    setActive(category);
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: { type: 'world-facts', category }
      });
      if (error) throw error;
      setFacts(data.data || []);
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to load facts', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex gap-3 mb-4">
        {categories.map((c) => (
          <Button key={c} variant={active === c ? 'default' : 'outline'} onClick={() => loadFacts(c)}>{c}</Button>
        ))}
      </div>

      {loading ? <div>Loading facts...</div> : (
        <div className="grid md:grid-cols-2 gap-4">
          {facts.map((f, i) => (
            <Card key={i} className="p-4">
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-muted-foreground">{f.description || f.fact}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
