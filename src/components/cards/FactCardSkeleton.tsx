import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Skeleton placeholder for FactCard
 * Matches the layout of LazyFactCard to prevent layout shift
 */
export const FactCardSkeleton = () => {
  return (
    <Card className="bg-card border-border hover:shadow-md transition-shadow duration-300 overflow-hidden h-full">
      <CardHeader className="pb-4">
        {/* Title skeleton */}
        <div className="h-6 bg-muted rounded-md w-3/4 mb-2 animate-pulse" />
        {/* Subtitle skeleton */}
        <div className="h-4 bg-muted rounded-md w-1/2 animate-pulse" />
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Content lines skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded-md w-full animate-pulse" />
          <div className="h-4 bg-muted rounded-md w-5/6 animate-pulse" />
          <div className="h-4 bg-muted rounded-md w-4/5 animate-pulse" />
        </div>

        {/* Button skeleton */}
        <div className="pt-2">
          <div className="h-9 bg-muted rounded-md w-24 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Quiz Card Skeleton
 * Matches the layout of quiz cards
 */
export const QuizCardSkeleton = () => {
  return (
    <Card className="bg-card border-border hover:shadow-md transition-shadow duration-300 overflow-hidden h-full">
      <CardHeader className="pb-4">
        {/* Badge skeleton */}
        <div className="h-6 bg-muted rounded-full w-20 mb-3 animate-pulse" />
        {/* Title skeleton */}
        <div className="h-6 bg-muted rounded-md w-3/4 animate-pulse" />
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Content skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded-md w-full animate-pulse" />
          <div className="h-4 bg-muted rounded-md w-5/6 animate-pulse" />
        </div>

        {/* Meta info skeleton */}
        <div className="flex gap-4 pt-2">
          <div className="h-4 bg-muted rounded-md w-16 animate-pulse" />
          <div className="h-4 bg-muted rounded-md w-16 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
};
