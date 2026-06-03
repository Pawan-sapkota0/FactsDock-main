import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { SEOMeta } from "@/components/common/SEOMeta";
import { QuizTemplate } from "@/components/game/templates/QuizTemplate";
import { generateArticleSchema } from "@/lib/seo-utils";
import { GameStats } from "@/components/game/types";

const questions = [
  {
    question: "Which festival celebrates the harvest and the moon in China?",
    answer: "Mid-Autumn Festival",
    options: ["Diwali", "Mid-Autumn Festival", "Carnival", "Hanami"],
    fact: "The Mid-Autumn Festival is one of China's most important traditional celebrations.",
  },
  {
    question: "Which ancient empire built the city of Machu Picchu?",
    answer: "Inca Empire",
    options: ["Mayan Empire", "Aztec Empire", "Inca Empire", "Roman Empire"],
    fact: "Machu Picchu was constructed in the 15th century by the Inca civilization.",
  },
  {
    question: "What is the traditional Japanese art of paper folding called?",
    answer: "Origami",
    options: ["Ikebana", "Origami", "Calligraphy", "Sumi-e"],
    fact: "Origami is the art of folding paper into decorative shapes and figures.",
  },
  {
    question: "Which language family includes Spanish, French, and Italian?",
    answer: "Romance languages",
    options: [
      "Germanic languages",
      "Slavic languages",
      "Romance languages",
      "Sino-Tibetan languages",
    ],
    fact: "Romance languages evolved from Latin, the language of the Roman Empire.",
  },
  {
    question:
      "Which country is known for the annual tomato-throwing festival La Tomatina?",
    answer: "Spain",
    options: ["Italy", "Mexico", "Spain", "Brazil"],
    fact: "La Tomatina is a famous Spanish festival held in Buñol each August.",
  },
  {
    question: "Which city hosts the Rio Carnival every year?",
    answer: "Rio de Janeiro",
    options: ["São Paulo", "Buenos Aires", "Rio de Janeiro", "Lima"],
    fact: "Rio de Janeiro is famous for its colorful Carnival celebrations.",
  },
  {
    question: "Which traditional dance is most associated with Argentina?",
    answer: "Tango",
    options: ["Salsa", "Flamenco", "Tango", "Ballet"],
    fact: "Tango originated in Argentina and Uruguay in the late 19th century.",
  },
  {
    question:
      "Which holiday is celebrated with fireworks in the United States on July 4th?",
    answer: "Independence Day",
    options: ["Labor Day", "Thanksgiving", "Independence Day", "Memorial Day"],
    fact: "July 4th marks the United States' declaration of independence in 1776.",
  },
  {
    question:
      "What is the traditional Korean meal made of fermented vegetables called?",
    answer: "Kimchi",
    options: ["Sushi", "Kimchi", "Taco", "Biryani"],
    fact: "Kimchi is a staple in Korean cuisine made from fermented vegetables.",
  },
  {
    question: "Which African country is famous for its Maasai warrior culture?",
    answer: "Kenya",
    options: ["Nigeria", "Egypt", "Kenya", "Ghana"],
    fact: "The Maasai people are known for their distinctive dress and customs in Kenya.",
  },
];

const CultureQuiz = () => {
  const navigate = useNavigate();

  const handleBack = () => navigate("/fun-zone");

  const handleGameComplete = (stats: GameStats) => {
    console.log("Culture Quiz completed", stats);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <SEOMeta
        title="FactsDock | Culture Quiz"
        description="Test your knowledge of world cultures, traditions, and history in a fast-paced FunZone quiz."
        keywords="culture quiz, history game, geography quiz, world cultures"
        ogImage={`${typeof window !== "undefined" ? window.location.origin : ""}/og-image.png`}
        structuredData={generateArticleSchema({
          headline: "Culture Quiz",
          description:
            "Sharpen your cultural knowledge in this premium FunZone trivia game.",
          datePublished: new Date().toISOString(),
        })}
      />

      <Navbar />

      <main className="min-h-screen">
        <QuizTemplate
          title="Culture Quiz"
          questions={questions}
          gameId="culture-quiz"
          gameRoute="/fun-zone/culture-quiz"
          onBack={handleBack}
          onGameComplete={handleGameComplete}
        />
      </main>

      <Footer />
    </div>
  );
};

export default CultureQuiz;
