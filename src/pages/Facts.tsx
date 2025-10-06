import React, { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CategoryCard from '@/components/cards/CategoryCard';
import { fetchFactsByCategory } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Facts = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const [facts, setFacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!category) return;
    setLoading(true);
    fetchFactsByCategory('fun-facts', category)
      .then((res) => setFacts(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">Go Back</Button>
          <h1 className="text-3xl font-bold mb-6">Facts: {category}</h1>
          {loading && <p>Loading...</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {facts.map((fact: any, i: number) => (
              <Card key={i} className="p-4">
                <h3 className="font-semibold">{fact.title || fact}</h3>
                <p className="text-muted-foreground">{fact.fact || fact.description || ''}</p>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Facts;
