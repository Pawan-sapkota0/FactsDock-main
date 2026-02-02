import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ExternalLink, AlertCircle } from "lucide-react";
import NewsSkeleton from "@/components/country/NewsSkeleton";
import { fetchCountryNews } from "@/lib/api";
import { log, debug, warn, error } from "@/lib/logger";

interface NewsItem {
  id?: string;
  title: string;
  source: string;
  url: string;
  image_url?: string;
  published_at?: string;
  created_at?: string;
}

interface NewsSectionProps {
  country?: string;
}

export default function NewsSection({ country }: NewsSectionProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!country) {
      setIsLoading(false);
      return;
    }

    const loadNews = async () => {
      try {
        setIsLoading(true);
        const newsData = await fetchCountryNews(country);
        setNews(newsData || []);
      } catch (err) {
        debug("[NewsSection] Failed to fetch news", err);
        setNews([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadNews();
  }, [country]);

  if (!country) return null;

  if (isLoading) {
    return (
      <div className="mb-8" id="latest-news">
        <h2 className="text-2xl font-bold mb-4">Latest Highlights</h2>
        <NewsSkeleton />
      </div>
    );
  }

  if (!news || news.length === 0) {
    return (
      <div className="mb-8" id="latest-news">
        <h2 className="text-2xl font-bold mb-4">Latest Highlights</h2>
        <Card className="p-6 border-dashed">
          <div className="flex items-center justify-center text-muted-foreground gap-2">
            <AlertCircle className="h-5 w-5" />
            <p>No recent news available at the moment.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-8" id="latest-news">
      <h2 className="text-2xl font-bold mb-4">Latest Highlights</h2>
      <div className="space-y-3">
        {news.map((item, index) => {
          const publishedDate = item.published_at
            ? new Date(item.published_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : new Date(item.created_at || Date.now()).toLocaleDateString(
                "en-US",
                { year: "numeric", month: "short", day: "numeric" },
              );

          return (
            <Card
              key={item.id || index}
              className="p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex gap-4">
                {item.image_url && (
                  <div className="flex-shrink-0 w-24 h-24 rounded overflow-hidden bg-gray-700">
                    <img
                      src={item.image_url}
                      alt="News thumbnail"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
                <div className="flex-grow">
                  <h3 className="font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 group"
                    >
                      {item.title}
                      <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </h3>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span className="font-medium">{item.source}</span>
                    <span>•</span>
                    <time>{publishedDate}</time>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
