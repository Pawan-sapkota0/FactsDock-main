import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Globe, Zap, Lock, Lightbulb } from "lucide-react";

interface DifficitySelectorProps {
  onSelectDifficulty: (difficulty: "easy" | "medium" | "hard") => void;
  isLoading?: boolean;
  title?: string;
}

interface DifficultyOption {
  id: "easy" | "medium" | "hard";
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  hoverBorder: string;
}

const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  {
    id: "easy",
    label: "Easy",
    description: "Basics & introductions",
    icon: <Target className="h-10 w-10" />,
    color: "text-primary",
    bgColor: "bg-transparent",
    borderColor: "border-border",
    hoverBorder: "hover:border-primary",
  },
  {
    id: "medium",
    label: "Medium",
    description: "Geography, culture & details",
    icon: <Globe className="h-10 w-10" />,
    color: "text-primary",
    bgColor: "bg-transparent",
    borderColor: "border-border",
    hoverBorder: "hover:border-primary",
  },
  {
    id: "hard",
    label: "Hard",
    description: "History & advanced facts",
    icon: <Zap className="h-10 w-10" />,
    color: "text-primary",
    bgColor: "bg-transparent",
    borderColor: "border-border",
    hoverBorder: "hover:border-primary",
  },
];

/**
 * DifficultySelector Component
 * Displays 3 difficulty options as selectable cards
 * Users must select difficulty before viewing available levels
 */
export const DifficultySelector: React.FC<DifficitySelectorProps> = ({
  onSelectDifficulty,
  isLoading = false,
  title = "Choose Difficulty",
}) => {
  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">
          {title}
        </h2>
        <p className="text-muted-foreground text-lg">
          Select your skill level to get started
        </p>
      </div>

      {/* Difficulty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {DIFFICULTY_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelectDifficulty(option.id)}
            disabled={isLoading}
            className="w-full text-left transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Card
              className={`h-full border-2 cursor-pointer transition-all duration-300 ${option.bgColor} ${option.borderColor} ${option.hoverBorder} ${
                isLoading ? "opacity-50" : ""
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-3">
                  <div className={option.color}>{option.icon}</div>
                  <Lock className="h-5 w-5 text-muted-foreground opacity-0" />
                </div>
                <CardTitle className="text-2xl text-foreground">
                  {option.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {option.description}
                </p>

                {/* Question count preview (optional) */}
                <div className="pt-2 border-t border-current border-opacity-10">
                  <p className="text-xs text-muted-foreground">
                    Perfect for: {getAudienceForDifficulty(option.id)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
        <p className="text-sm text-foreground">
          <Lightbulb className="inline h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
          <span className="font-medium">Tip:</span> You can switch difficulties
          anytime. Start easy to build confidence!
        </p>
      </div>
    </div>
  );
};

/**
 * Helper to get audience description for each difficulty
 */
function getAudienceForDifficulty(difficulty: string): string {
  const audiences: Record<string, string> = {
    easy: "Beginners & students",
    medium: "Intermediate learners",
    hard: "Geography experts",
  };
  return audiences[difficulty] || "All levels";
}

export default DifficultySelector;
