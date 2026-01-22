import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import LazyFactCard from "@/components/cards/LazyFactCard";
import { FactCardSkeleton } from "@/components/cards/FactCardSkeleton";
import { fetchFactsInitialBatch, fetchFactsNextBatch } from "@/lib/facts";

interface FactsListProps {
  factType: string;
  category: string;
  subcategory?: string;
  initialCount?: number;
  pageSize?: number;
  onLoadComplete?: () => void;
}

/**
 * Reusable component for displaying facts with skeleton loading and "Load More" functionality
 * Handles initial batch loading with skeletons and incremental data fetching
 */
export const FactsList = ({
  factType,
  category,
  subcategory,
  initialCount = 8,
  pageSize = 8,
  onLoadComplete,
}: FactsListProps) => {
  const [facts, setFacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalFacts, setTotalFacts] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Load initial batch on mount or when category changes
  useEffect(() => {
    loadInitial();
  }, [factType, category, subcategory]);

  const loadInitial = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchFactsInitialBatch(
        factType,
        category,
        initialCount,
        subcategory,
      );

      if (result.facts.length === 0 && result.total === 0) {
        setError("No facts found for this category.");
      }

      setFacts(result.facts);
      setCurrentPage(0);
      setHasMore(result.hasMore);
      setTotalFacts(result.total);
      onLoadComplete?.();
    } catch (err) {
      console.error("Error loading initial facts:", err);
      setError("Failed to load facts. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = async () => {
    setIsLoadingMore(true);
    setError(null);
    try {
      const result = await fetchFactsNextBatch(
        factType,
        category,
        currentPage,
        pageSize,
        subcategory,
      );

      setFacts((prev) => [...prev, ...result.facts]);
      setCurrentPage((prev) => prev + 1);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error("Error loading more facts:", err);
      setError("Failed to load more facts. Please try again.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Show skeleton placeholders while loading
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: initialCount }).map((_, i) => (
          <FactCardSkeleton key={`skeleton-${i}`} />
        ))}
      </div>
    );
  }

  if (error && facts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={loadInitial} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Facts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {facts.map((fact) => (
          <LazyFactCard key={fact.id} fact={fact} />
        ))}
      </div>

      {/* Load More Section */}
      {hasMore && (
        <div className="flex justify-center pt-6">
          <Button
            onClick={loadMore}
            disabled={isLoadingMore}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              `Load More (${facts.length} of ${totalFacts})`
            )}
          </Button>
        </div>
      )}

      {/* End of list message */}
      {!hasMore && facts.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Showing all {facts.length} facts</p>
        </div>
      )}

      {/* Error message for load more failures */}
      {error && facts.length > 0 && (
        <div className="text-center py-4">
          <p className="text-destructive mb-3">{error}</p>
          <Button onClick={loadMore} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
};

export default FactsList;
