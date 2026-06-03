import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { SEOMeta } from "@/components/common/SEOMeta";
import { MemoryTemplate } from "@/components/game/templates/MemoryTemplate";
import { generateArticleSchema } from "@/lib/seo-utils";
import { GameStats } from "@/components/game/types";

const pairs = [
  {
    id: "cat",
    prompt: "Cat",
    match: "🐱",
    fact: "Cats have excellent night vision.",
  },
  {
    id: "dog",
    prompt: "Dog",
    match: "🐶",
    fact: "Dogs have a superior sense of smell.",
  },
  {
    id: "fox",
    prompt: "Fox",
    match: "🦊",
    fact: "Foxes are known for their agility and stealth.",
  },
  {
    id: "owl",
    prompt: "Owl",
    match: "🦉",
    fact: "Owls can turn their heads almost all the way around.",
  },
  {
    id: "lion",
    prompt: "Lion",
    match: "🦁",
    fact: "Lions are often called the kings of the jungle.",
  },
  {
    id: "panda",
    prompt: "Panda",
    match: "🐼",
    fact: "Giant pandas spend most of their day eating bamboo.",
  },
  {
    id: "penguin",
    prompt: "Penguin",
    match: "🐧",
    fact: "Penguins are flightless birds adapted to cold oceans.",
  },
  {
    id: "elephant",
    prompt: "Elephant",
    match: "🐘",
    fact: "Elephants have excellent memories and strong social bonds.",
  },
  {
    id: "monkey",
    prompt: "Monkey",
    match: "🐒",
    fact: "Monkeys use tools and can solve simple puzzles.",
  },
  {
    id: "rabbit",
    prompt: "Rabbit",
    match: "🐰",
    fact: "Rabbits are known for their powerful hind legs and quick movement.",
  },
];

const MemoryMatch = () => {
  const navigate = useNavigate();

  const handleBack = () => navigate("/fun-zone");

  const handleGameComplete = (stats: GameStats) => {
    console.log("Memory Match completed", stats);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <SEOMeta
        title="FactsDock | Memory Match"
        description="Pair matching memory game in FunZone."
        keywords="memory game, matching"
        ogImage={`${typeof window !== "undefined" ? window.location.origin : ""}/og-image.png`}
        structuredData={generateArticleSchema({
          headline: "Memory Match",
          description: "A quick memory pairing game for FunZone.",
          datePublished: new Date().toISOString(),
        })}
      />

      <Navbar />

      <main className="min-h-screen">
        <MemoryTemplate
          title="Memory Match"
          pairs={pairs}
          onBack={handleBack}
          onGameComplete={handleGameComplete}
        />
      </main>

      <Footer />
    </div>
  );
};

export default MemoryMatch;
