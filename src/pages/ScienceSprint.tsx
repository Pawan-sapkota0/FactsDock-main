import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { SEOMeta } from "@/components/common/SEOMeta";
import { ScienceTemplate } from "@/components/game/templates/ScienceTemplate";
import { generateArticleSchema } from "@/lib/seo-utils";
import { GameStats } from "@/components/game/types";

const questions = [
  {
    id: "water",
    prompt: "What is the chemical formula for water?",
    correct: "H2O",
    options: ["CO2", "H2O", "O2", "H2"],
    fact: "Water is a molecule made of two hydrogen atoms and one oxygen atom.",
  },
  {
    id: "sun",
    prompt: "Which star is the center of our solar system?",
    correct: "Sun",
    options: ["Sirius", "Alpha Centauri", "Sun", "Vega"],
    fact: "The Sun provides the energy that sustains life on Earth.",
  },
  {
    id: "earth",
    prompt: "Which planet is known as the Blue Planet?",
    correct: "Earth",
    options: ["Mars", "Earth", "Venus", "Jupiter"],
    fact: "Earth appears blue from space because of its oceans.",
  },
  {
    id: "gravity",
    prompt: "What force keeps us on the ground?",
    correct: "Gravity",
    options: ["Friction", "Gravity", "Magnetism", "Electricity"],
    fact: "Gravity pulls objects toward the center of the Earth.",
  },
  {
    id: "plants",
    prompt: "What process do plants use to make food?",
    correct: "Photosynthesis",
    options: ["Respiration", "Digestion", "Photosynthesis", "Evaporation"],
    fact: "Photosynthesis uses sunlight to turn carbon dioxide and water into sugar.",
  },
  {
    id: "atoms",
    prompt: "What is the smallest unit of matter?",
    correct: "Atom",
    options: ["Molecule", "Cell", "Atom", "Organ"],
    fact: "Atoms are the building blocks of all matter.",
  },
  {
    id: "oxygen",
    prompt: "Which gas do humans need to breathe?",
    correct: "Oxygen",
    options: ["Nitrogen", "Carbon Dioxide", "Oxygen", "Hydrogen"],
    fact: "Oxygen is essential for respiration in many living organisms.",
  },
  {
    id: "seasons",
    prompt: "What causes seasons on Earth?",
    correct: "Tilt of Earth's axis",
    options: [
      "Distance from the Sun",
      "Tilt of Earth's axis",
      "Moon phases",
      "Earthquakes",
    ],
    fact: "Seasons happen because Earth's axis is tilted as it orbits the Sun.",
  },
  {
    id: "sound",
    prompt: "What travels faster: sound or light?",
    correct: "Light",
    options: ["Sound", "Light", "Water", "Heat"],
    fact: "Light travels much faster than sound.",
  },
  {
    id: "steel",
    prompt: "What is a common alloy made mostly of iron and carbon?",
    correct: "Steel",
    options: ["Bronze", "Steel", "Plastic", "Glass"],
    fact: "Steel is an alloy used in buildings, tools, and machines.",
  },
];

const ScienceSprint = () => {
  const navigate = useNavigate();

  const handleBack = () => navigate("/fun-zone");

  const handleGameComplete = (stats: GameStats) => {
    console.log("Science Sprint completed", stats);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <SEOMeta
        title="FactsDock | Science Sprint"
        description="Quick science questions to test your knowledge."
        keywords="science game, facts, quiz"
        ogImage={`${typeof window !== "undefined" ? window.location.origin : ""}/og-image.png`}
        structuredData={generateArticleSchema({
          headline: "Science Sprint",
          description: "Short science quiz rounds for FunZone.",
          datePublished: new Date().toISOString(),
        })}
      />

      <Navbar />

      <main className="min-h-screen">
        <ScienceTemplate
          title="Science Sprint"
          questions={questions}
          onBack={handleBack}
          onGameComplete={handleGameComplete}
        />
      </main>

      <Footer />
    </div>
  );
};

export default ScienceSprint;
