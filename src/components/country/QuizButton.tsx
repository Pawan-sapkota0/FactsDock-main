import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function QuizButton({ country }: { country?: string }) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePlayQuiz = () => {
    if (!country) {
      toast({
        title: "Quiz Unavailable",
        description: "Could not determine country for quiz.",
        variant: "destructive",
      });
      return;
    }

    // Navigate to the new quiz play page with difficulty selection
    const slug = country.toLowerCase().replace(/\s+/g, "-");
    navigate(`/quiz/play/country/${slug}`);
  };

  return (
    <Button variant="hero" onClick={handlePlayQuiz}>
      {`Play Quiz about ${country || "this country"}`}
    </Button>
  );
}
