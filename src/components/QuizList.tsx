import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QuizCardSkeleton } from "@/components/cards/FactCardSkeleton";

interface Quiz {
  id: string;
  question: string;
  options: string[];
  answer: string | number;
  difficulty?: string;
  category?: string;
}

interface QuizListProps {
  quizzes: Quiz[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  initialCount?: number;
}

/**
 * Reusable component for displaying quizzes with skeleton loading
 * Handles initial batch loading with skeletons and "Load More" functionality
 */
export const QuizList = ({
  quizzes,
  isLoading = false,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  initialCount = 6,
}: QuizListProps) => {
  // Show skeleton placeholders while loading
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: initialCount }).map((_, i) => (
          <QuizCardSkeleton key={`skeleton-${i}`} />
        ))}
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No quizzes available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Quizzes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => (
          <Card
            key={quiz.id}
            className="bg-card border-border hover:shadow-md transition-shadow duration-300 cursor-pointer group"
          >
            <CardHeader>
              {quiz.difficulty && (
                <div className="mb-2 inline-flex">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      quiz.difficulty === "Easy"
                        ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300"
                        : quiz.difficulty === "Medium"
                          ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                          : "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300"
                    }`}
                  >
                    {quiz.difficulty}
                  </span>
                </div>
              )}
              <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                {quiz.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quiz.category && (
                <CardDescription className="text-xs uppercase tracking-wide">
                  {quiz.category}
                </CardDescription>
              )}
              <div className="flex gap-2 pt-2 flex-wrap">
                {(quiz.options || []).slice(0, 2).map((option, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground truncate"
                  >
                    {option}
                  </span>
                ))}
                {(quiz.options || []).length > 2 && (
                  <span className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground">
                    +{(quiz.options || []).length - 2} more
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More Section */}
      {hasMore && onLoadMore && (
        <div className="flex justify-center pt-6">
          <Button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              `Load More Quizzes`
            )}
          </Button>
        </div>
      )}

      {/* End of list message */}
      {!hasMore && quizzes.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Showing all {quizzes.length} quizzes</p>
        </div>
      )}
    </div>
  );
};

export default QuizList;
