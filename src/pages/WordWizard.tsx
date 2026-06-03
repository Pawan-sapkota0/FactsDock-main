import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { SEOMeta } from "@/components/common/SEOMeta";
import { WordTemplate } from "@/components/game/templates/WordTemplate";
import { generateArticleSchema } from "@/lib/seo-utils";
import { GameStats } from "@/components/game/types";

const questions = [
  {
    id: "syn1",
    prompt: "Choose the synonym for 'rapid'",
    correct: "fast",
    options: ["slow", "fast", "late", "ancient"],
    fact: "'Rapid' and 'fast' are close synonyms in many contexts.",
  },
  {
    id: "ant1",
    prompt: "Choose the antonym for 'ancient'",
    correct: "modern",
    options: ["modern", "old", "historic", "primeval"],
    fact: "Antonyms are words with opposite meanings.",
  },
  {
    id: "syn2",
    prompt: "Choose the synonym for 'brave'",
    correct: "courageous",
    options: ["cowardly", "timid", "courageous", "quiet"],
    fact: "'Brave' and 'courageous' have very similar meanings.",
  },
  {
    id: "ant2",
    prompt: "Choose the antonym for 'difficult'",
    correct: "easy",
    options: ["hard", "easy", "tough", "complex"],
    fact: "'Easy' is the opposite of 'difficult'.",
  },
  {
    id: "syn3",
    prompt: "Choose the synonym for 'happy'",
    correct: "joyful",
    options: ["sad", "angry", "joyful", "bored"],
    fact: "'Happy' and 'joyful' both describe positive emotions.",
  },
  {
    id: "ant3",
    prompt: "Choose the antonym for 'ancient'",
    correct: "modern",
    options: ["modern", "old", "classic", "antique"],
    fact: "Modern means something current, the opposite of ancient.",
  },
  {
    id: "syn4",
    prompt: "Choose the synonym for 'bright'",
    correct: "luminous",
    options: ["dark", "dull", "luminous", "heavy"],
    fact: "'Bright' and 'luminous' both describe strong light.",
  },
  {
    id: "ant4",
    prompt: "Choose the antonym for 'generous'",
    correct: "stingy",
    options: ["kind", "stingy", "happy", "clear"],
    fact: "'Stingy' means not willing to share, opposite of generous.",
  },
  {
    id: "syn5",
    prompt: "Choose the synonym for 'tiny'",
    correct: "small",
    options: ["huge", "small", "fast", "cold"],
    fact: "'Tiny' and 'small' both mean very little in size.",
  },
  {
    id: "ant5",
    prompt: "Choose the antonym for 'rough'",
    correct: "smooth",
    options: ["hard", "rough", "bumpy", "smooth"],
    fact: "'Smooth' describes a surface without bumps, opposite of rough.",
  },
];

const WordWizard = () => {
  const navigate = useNavigate();

  const handleBack = () => navigate("/fun-zone");

  const handleGameComplete = (stats: GameStats) => {
    console.log("Word Wizard completed", stats);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <SEOMeta
        title="FactsDock | Word Wizard"
        description="Word puzzles to build vocabulary and quick thinking."
        keywords="word game, vocabulary, puzzles"
        ogImage={`${typeof window !== "undefined" ? window.location.origin : ""}/og-image.png`}
        structuredData={generateArticleSchema({
          headline: "Word Wizard",
          description: "Play short vocabulary challenges in FunZone.",
          datePublished: new Date().toISOString(),
        })}
      />

      <Navbar />

      <main className="min-h-screen">
        <WordTemplate
          title="Word Wizard"
          questions={questions}
          onBack={handleBack}
          onGameComplete={handleGameComplete}
        />
      </main>

      <Footer />
    </div>
  );
};

export default WordWizard;
