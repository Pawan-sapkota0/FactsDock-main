import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { SEOMeta } from "@/components/common/SEOMeta";
import { FlagTemplate } from "@/components/game/templates/FlagTemplate";
import { generateArticleSchema } from "@/lib/seo-utils";
import { GameStats } from "@/components/game/types";

const questions = [
  {
    id: "japan",
    country: "Japan",
    correctFlag: "https://flagcdn.com/w320/jp.png",
    options: [
      "https://flagcdn.com/w320/jp.png",
      "https://flagcdn.com/w320/cn.png",
      "https://flagcdn.com/w320/kr.png",
      "https://flagcdn.com/w320/vn.png",
    ],
    fact: "Japan's flag is called Nisshōki, meaning 'sun-mark flag'.",
  },
  {
    id: "canada",
    country: "Canada",
    correctFlag: "https://flagcdn.com/w320/ca.png",
    options: [
      "https://flagcdn.com/w320/ca.png",
      "https://flagcdn.com/w320/us.png",
      "https://flagcdn.com/w320/gb.png",
      "https://flagcdn.com/w320/au.png",
    ],
    fact: "The maple leaf has been a Canadian symbol since the 18th century.",
  },
  {
    id: "brazil",
    country: "Brazil",
    correctFlag: "https://flagcdn.com/w320/br.png",
    options: [
      "https://flagcdn.com/w320/br.png",
      "https://flagcdn.com/w320/mx.png",
      "https://flagcdn.com/w320/ar.png",
      "https://flagcdn.com/w320/cl.png",
    ],
    fact: "Brazil's flag features a star-studded globe and the national motto.",
  },
  {
    id: "germany",
    country: "Germany",
    correctFlag: "https://flagcdn.com/w320/de.png",
    options: [
      "https://flagcdn.com/w320/de.png",
      "https://flagcdn.com/w320/nl.png",
      "https://flagcdn.com/w320/ch.png",
      "https://flagcdn.com/w320/at.png",
    ],
    fact: "Germany's flag has three horizontal bands of black, red, and gold.",
  },
  {
    id: "india",
    country: "India",
    correctFlag: "https://flagcdn.com/w320/in.png",
    options: [
      "https://flagcdn.com/w320/in.png",
      "https://flagcdn.com/w320/pk.png",
      "https://flagcdn.com/w320/bd.png",
      "https://flagcdn.com/w320/lk.png",
    ],
    fact: "India's flag features a blue Ashoka Chakra with 24 spokes.",
  },
  {
    id: "south-korea",
    country: "South Korea",
    correctFlag: "https://flagcdn.com/w320/kr.png",
    options: [
      "https://flagcdn.com/w320/kr.png",
      "https://flagcdn.com/w320/jp.png",
      "https://flagcdn.com/w320/cn.png",
      "https://flagcdn.com/w320/vn.png",
    ],
    fact: "South Korea's flag is called Taegeukgi and symbolizes balance.",
  },
  {
    id: "mexico",
    country: "Mexico",
    correctFlag: "https://flagcdn.com/w320/mx.png",
    options: [
      "https://flagcdn.com/w320/mx.png",
      "https://flagcdn.com/w320/br.png",
      "https://flagcdn.com/w320/ar.png",
      "https://flagcdn.com/w320/cl.png",
    ],
    fact: "Mexico's flag includes an eagle holding a snake over a cactus.",
  },
  {
    id: "australia",
    country: "Australia",
    correctFlag: "https://flagcdn.com/w320/au.png",
    options: [
      "https://flagcdn.com/w320/au.png",
      "https://flagcdn.com/w320/nz.png",
      "https://flagcdn.com/w320/gb.png",
      "https://flagcdn.com/w320/ca.png",
    ],
    fact: "Australia's flag shows the Southern Cross constellation.",
  },
  {
    id: "south-africa",
    country: "South Africa",
    correctFlag: "https://flagcdn.com/w320/za.png",
    options: [
      "https://flagcdn.com/w320/za.png",
      "https://flagcdn.com/w320/zw.png",
      "https://flagcdn.com/w320/zm.png",
      "https://flagcdn.com/w320/na.png",
    ],
    fact: "South Africa's flag is one of the newest national flags, adopted in 1994.",
  },
  {
    id: "italy",
    country: "Italy",
    correctFlag: "https://flagcdn.com/w320/it.png",
    options: [
      "https://flagcdn.com/w320/it.png",
      "https://flagcdn.com/w320/fr.png",
      "https://flagcdn.com/w320/ro.png",
      "https://flagcdn.com/w320/hu.png",
    ],
    fact: "Italy's flag is a green, white, and red tricolor.",
  },
];

const FlagFinder = () => {
  const navigate = useNavigate();

  const handleBack = () => navigate("/fun-zone");

  const handleGameComplete = (stats: GameStats) => {
    console.log("Flag Finder completed", stats);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <SEOMeta
        title="FactsDock | Flag Finder"
        description="Match flags to countries in a fast-paced FunZone challenge."
        keywords="flag game, memory, geography"
        ogImage={`${typeof window !== "undefined" ? window.location.origin : ""}/og-image.png`}
        structuredData={generateArticleSchema({
          headline: "Flag Finder",
          description: "Learn flags with a fun and fast game.",
          datePublished: new Date().toISOString(),
        })}
      />

      <Navbar />

      <main className="min-h-screen">
        <FlagTemplate
          title="Flag Finder"
          questions={questions}
          onBack={handleBack}
          onGameComplete={handleGameComplete}
        />
      </main>

      <Footer />
    </div>
  );
};

export default FlagFinder;
