import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { SEOMeta } from "@/components/common/SEOMeta";
import { NumberTemplate } from "@/components/game/templates/NumberTemplate";
import { generateArticleSchema } from "@/lib/seo-utils";
import { GameStats } from "@/components/game/types";

const questions = [
  {
    id: "sum1",
    prompt: "What is 12 + 9?",
    correct: "21",
    options: ["20", "21", "22", "19"],
  },
  {
    id: "mul1",
    prompt: "What is 7 × 6?",
    correct: "42",
    options: ["36", "42", "48", "40"],
  },
  {
    id: "div1",
    prompt: "What is 81 ÷ 9?",
    correct: "9",
    options: ["8", "9", "7", "6"],
  },
  {
    id: "sum2",
    prompt: "What is 15 + 14?",
    correct: "29",
    options: ["29", "30", "28", "27"],
  },
  {
    id: "sub1",
    prompt: "What is 20 - 7?",
    correct: "13",
    options: ["13", "14", "12", "15"],
  },
  {
    id: "mul2",
    prompt: "What is 8 × 5?",
    correct: "40",
    options: ["35", "40", "45", "50"],
  },
  {
    id: "div2",
    prompt: "What is 36 ÷ 6?",
    correct: "6",
    options: ["5", "6", "7", "8"],
  },
  {
    id: "sum3",
    prompt: "What is 27 + 13?",
    correct: "40",
    options: ["39", "40", "41", "42"],
  },
  {
    id: "sub2",
    prompt: "What is 18 - 9?",
    correct: "9",
    options: ["8", "9", "10", "11"],
  },
  {
    id: "mul3",
    prompt: "What is 9 × 4?",
    correct: "36",
    options: ["32", "34", "36", "38"],
  },
];

const NumberNavigator = () => {
  const navigate = useNavigate();

  const handleBack = () => navigate("/fun-zone");

  const handleGameComplete = (stats: GameStats) => {
    console.log("Number Navigator completed", stats);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <SEOMeta
        title="FactsDock | Number Navigator"
        description="Fast math puzzles to test speed and accuracy."
        keywords="math game, arithmetic, puzzles"
        ogImage={`${typeof window !== "undefined" ? window.location.origin : ""}/og-image.png`}
        structuredData={generateArticleSchema({
          headline: "Number Navigator",
          description: "Sharpen math skills with quick calculation rounds.",
          datePublished: new Date().toISOString(),
        })}
      />

      <Navbar />

      <main className="min-h-screen">
        <NumberTemplate
          title="Number Navigator"
          questions={questions}
          onBack={handleBack}
          onGameComplete={handleGameComplete}
        />
      </main>

      <Footer />
    </div>
  );
};

export default NumberNavigator;
