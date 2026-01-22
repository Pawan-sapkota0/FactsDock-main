import React, { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CategoryCard from "@/components/cards/CategoryCard";
import { fetchFactsByCategory as fetchFacts } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LazyFactCard from "@/components/cards/LazyFactCard";
import { usePagination } from "@/hooks/use-pagination";
import PaginationControls from "@/components/common/PaginationControls";
import PaginationSkeleton from "@/components/common/PaginationSkeleton";
import { SEOMeta } from "@/components/common/SEOMeta";
import { PAGE_TEMPLATES, generateArticleSchema } from "@/lib/seo-utils";
import { Filter } from "lucide-react";
import {
  filterFacts,
  getEmptyStateMessage,
  markFactViewed,
} from "@/lib/fact-filtering";

const Facts = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const [facts, setFacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");

  // Initialize pagination at top level
  const pagination = usePagination({ itemsPerPage: 8 });

  // Update pagination when facts change
  useEffect(() => {
    const displayed = (facts || []).filter(
      (f) => !(f && (f as any).subcategory_id),
    );
    pagination.setTotalItems(displayed.length);
  }, [facts]);

  useEffect(() => {
    if (!category) return;
    setLoading(true);
    console.log("[Facts] Fetching facts for category:", category);
    fetchFacts("fun-facts", category)
      .then((res) => {
        console.log("[Facts] Fetch success, got", res?.length || 0, "facts");
        setFacts(res);
      })
      .catch(console.error)
      .finally(() => {
        setLoading(false);
      });
  }, [category]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      try {
        console.debug("[Facts page] facts changed", { category, facts });
      } catch (e) {}
    }
  }, [facts, category]);

  // Note: fact_type resolution is handled internally by fetchFacts from api.ts

  return (
    <div className="min-h-screen flex flex-col">
      <SEOMeta
        title={PAGE_TEMPLATES.facts.title}
        description={PAGE_TEMPLATES.facts.description}
        keywords={PAGE_TEMPLATES.facts.keywords}
        ogImage={`${window.location.origin}/og-image.jpg`}
        structuredData={generateArticleSchema({
          headline: "Facts About the World",
          description:
            "Explore fascinating facts about countries worldwide. Learn culture, geography, history, economy, and more.",
          datePublished: new Date().toISOString(),
        })}
      />
      <Navbar />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          {/* Back button removed per request */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <h1 className="text-3xl font-bold">Facts: {category}</h1>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <label className="text-sm font-medium text-foreground">
                View facts
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer transition-all hover:border-primary/50"
              >
                <option value="all">All facts</option>
                <option value="newtoday">New today</option>
                <option value="latest">Latest release</option>
                <option value="notseen">Not seen yet</option>
              </select>
            </div>
          </div>
          {loading && <p>Loading...</p>}
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            id="facts-section"
          >
            {(() => {
              const displayed = (facts || []).filter(
                (f) => !(f && (f as any).subcategory_id),
              );
              // Apply filter
              const filtered = filterFacts(displayed, filterType);

              if (filtered.length === 0 && !loading) {
                return (
                  <div className="col-span-full">
                    <Card className="p-6 text-center">
                      <p className="text-muted-foreground">
                        {getEmptyStateMessage(filterType)}
                      </p>
                    </Card>
                  </div>
                );
              }

              const paginatedFacts = pagination.paginate(filtered);
              if (process.env.NODE_ENV !== "production") {
                try {
                  console.debug(
                    "[Facts page] displayed",
                    displayed,
                    "filtered",
                    filtered,
                  );
                } catch (e) {}
              }
              return paginatedFacts.map((fact: any, i: number) => (
                <div
                  key={fact?.id || i}
                  onMouseEnter={() => markFactViewed(fact?.id || fact?.fact_id)}
                >
                  <React.Suspense fallback={<div />}>
                    <LazyFactCard
                      fact={fact?.fact_text || fact?.fact || fact?.title || ""}
                    />
                  </React.Suspense>
                </div>
              ));
            })()}
          </div>
          <PaginationControls
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={(page) => {
              pagination.setPage(page);
              document
                .getElementById("facts-section")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            canGoPrevious={pagination.canGoPrevious}
            canGoNext={pagination.canGoNext}
            className="mt-8"
          />
          {/* debug panel removed */}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Facts;
