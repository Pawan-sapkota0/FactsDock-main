import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';

type Article = { title: string; url: string; source?: { name?: string } };

export default function NewsSection({ country }: { country?: string }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!country) return;
    const key = import.meta.env.VITE_NEWS_API_KEY;
    if (!key) return;
    setLoading(true);
    fetch(`https://newsapi.org/v2/top-headlines?q=${encodeURIComponent(country)}&pageSize=4&apiKey=${key}`)
      .then((r) => r.json())
      .then((data) => setArticles(data.articles || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [country]);

  if (!import.meta.env.VITE_NEWS_API_KEY) return null;

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Recent News</h2>
      {loading ? <div>Loading news...</div> : (
        <div className="grid md:grid-cols-2 gap-4">
          {articles.map((a, i) => (
            <Card key={i} className="p-4">
              <a href={a.url} target="_blank" rel="noreferrer" className="font-semibold text-foreground">{a.title}</a>
              <div className="text-sm text-muted-foreground">{a.source?.name}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
