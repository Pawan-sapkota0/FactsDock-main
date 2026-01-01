import React, { useEffect, useState, useRef } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CategoryCard from "@/components/cards/CategoryCard";
import { fetchFactsByCategory } from "@/lib/facts";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LazyFactCard from "@/components/cards/LazyFactCard";

const Facts = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const [facts, setFacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const factTypeIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!category) return;
    setLoading(true);
    const opts: any = {};
    if (factTypeIdRef.current) opts.fact_type_id = factTypeIdRef.current;
    fetchFactsByCategory("fun-facts", category, opts)
      .then((res) => setFacts(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      try {
        console.debug("[Facts page] facts changed", { category, facts });
      } catch (e) {}
    }
  }, [facts, category]);

  useEffect(() => {
    void (async () => {
      try {
        const r: any = await supabase
          .from("fact_types")
          .select("id")
          .eq("slug", "fun-facts")
          .maybeSingle();
        factTypeIdRef.current = r?.data?.id || null;
      } catch (e) {
        factTypeIdRef.current = null;
      }
    })();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          {/* Back button removed per request */}
          <h1 className="text-3xl font-bold mb-6">Facts: {category}</h1>
          {loading && <p>Loading...</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(() => {
              const displayed = (facts || []).filter(
                (f) => !(f && (f as any).subcategory_id)
              );
              if (process.env.NODE_ENV !== "production") {
                try {
                  console.debug("[Facts page] displayed", displayed);
                } catch (e) {}
              }
              return displayed.map((fact: any, i: number) => (
                <div key={fact?.id || i}>
                  <React.Suspense fallback={<div />}>
                    <LazyFactCard
                      fact={fact?.fact_text || fact?.fact || fact?.title || ""}
                    />
                  </React.Suspense>
                </div>
              ));
            })()}
          </div>
          {/* debug panel removed */}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Facts;
