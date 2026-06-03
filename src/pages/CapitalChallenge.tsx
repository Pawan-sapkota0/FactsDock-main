import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { SEOMeta } from "@/components/common/SEOMeta";
import { CapitalTemplate } from "@/components/game/templates/CapitalTemplate";
import { generateArticleSchema } from "@/lib/seo-utils";
import { GameStats } from "@/components/game/types";

interface CapitalQuestion {
  id: string;
  country: string;
  capital: string;
  options: string[];
  fact: string;
  image?: string;
}

const questions: CapitalQuestion[] = [
  {
    id: "france",
    country: "France",
    capital: "Paris",
    options: ["Madrid", "Paris", "Berlin", "Rome"],
    fact: "Paris is also known as the City of Light and welcomes millions of visitors each year.",
  },
  {
    id: "japan",
    country: "Japan",
    capital: "Tokyo",
    options: ["Tokyo", "Seoul", "Bangkok", "Beijing"],
    fact: "Tokyo is the largest metropolitan area in the world by population.",
  },
  {
    id: "brazil",
    country: "Brazil",
    capital: "Brasília",
    options: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador"],
    fact: "Brasília was designed and built in the 1950s to serve as Brazil's planned capital.",
  },
  {
    id: "canada",
    country: "Canada",
    capital: "Ottawa",
    options: ["Toronto", "Ottawa", "Vancouver", "Montreal"],
    fact: "Ottawa sits on the border between Ontario and Quebec and is Canada's political center.",
  },
  {
    id: "egypt",
    country: "Egypt",
    capital: "Cairo",
    options: ["Alexandria", "Cairo", "Luxor", "Aswan"],
    fact: "Cairo is the largest city in Africa and one of the oldest major cities in the world.",
  },
  {
    id: "india",
    country: "India",
    capital: "New Delhi",
    options: ["Mumbai", "Kolkata", "New Delhi", "Chennai"],
    fact: "New Delhi is one of the nine districts of the National Capital Territory of Delhi.",
  },
  {
    id: "australia",
    country: "Australia",
    capital: "Canberra",
    options: ["Sydney", "Melbourne", "Canberra", "Brisbane"],
    fact: "Canberra was selected as Australia's capital in 1908 as a compromise between Sydney and Melbourne.",
  },
  {
    id: "russia",
    country: "Russia",
    capital: "Moscow",
    options: ["Saint Petersburg", "Moscow", "Kazan", "Sochi"],
    fact: "Moscow is Russia's largest city and its political, economic, and cultural center.",
  },
  {
    id: "mexico",
    country: "Mexico",
    capital: "Mexico City",
    options: ["Mexico City", "Guadalajara", "Monterrey", "Puebla"],
    fact: "Mexico City is one of the largest metropolitan areas in the world.",
  },
  {
    id: "south-korea",
    country: "South Korea",
    capital: "Seoul",
    options: ["Busan", "Incheon", "Seoul", "Daegu"],
    fact: "Seoul is a major global city and the cultural heart of South Korea.",
  },
];

const CapitalChallenge = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/fun-zone");
  };

  const handleGameComplete = (stats: GameStats) => {
    // Placeholder for analytics or reward updates after completion.
    console.log("Capital Challenge completed", stats);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <SEOMeta
        title="FactsDock | Capital Challenge"
        description="Play the Capital Challenge and test your knowledge of world capitals with a modern game experience."
        keywords="capital quiz, geography game, world capitals, learning game"
        ogImage={`${typeof window !== "undefined" ? window.location.origin : ""}/og-image.png`}
        structuredData={generateArticleSchema({
          headline: "Capital Challenge",
          description:
            "Test your world capital knowledge in a premium FunZone game experience.",
          datePublished: new Date().toISOString(),
        })}
      />
      <Navbar />

      <main className="min-h-screen">
        <CapitalTemplate
          questions={questions}
          title="Capital Challenge"
          onBack={handleBack}
          onGameComplete={handleGameComplete}
        />
      </main>

      <Footer />
    </div>
  );
};

export default CapitalChallenge;
