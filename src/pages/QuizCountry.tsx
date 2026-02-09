import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useParams, useNavigate } from "react-router-dom";
import { SEOMeta } from "@/components/common/SEOMeta";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const QuizModal = React.lazy(() => import("@/components/QuizModal"));

const QuizCountry = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const countryTitle = slug
    ? slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Country";

  return (
    <div className="min-h-screen flex flex-col">
      <SEOMeta
        title={`FactsDock | ${countryTitle} Quiz`}
        description={`Take a quiz about ${countryTitle}. Test your knowledge and learn interesting facts about ${countryTitle}.`}
        keywords={`${countryTitle} quiz, ${countryTitle} facts, geography quiz, ${countryTitle} knowledge`}
        ogImage={`${typeof window !== "undefined" ? window.location.origin : ""}/og-image.png`}
      />
      <Navbar />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          {/* Back button removed per request */}
          <h1 className="text-3xl font-bold mb-6">Quiz: {slug}</h1>
          <Card className="p-6 text-center">
            <p className="mb-4">Start a quiz about {slug}</p>
            <div className="flex gap-4 justify-center">
              <Button variant="hero" onClick={() => setOpen(true)}>
                Play Quiz
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/country/${slug}`)}
              >
                View Country Details
              </Button>
            </div>
          </Card>
        </div>
      </main>
      <React.Suspense fallback={<div />}>
        <QuizModal
          open={open}
          onOpenChange={setOpen}
          topic={slug}
          sourceType="country"
        />
      </React.Suspense>
      <Footer />
    </div>
  );
};

export default QuizCountry;
