import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface PaginationSkeletonProps {
  count?: number;
  columns?: number;
  height?: string;
}

/**
 * Skeleton loader for paginated content
 * Shows loading state while fetching paginated data
 */
export const PaginationSkeleton = ({
  count = 8,
  columns = 2,
  height = "200px",
}: PaginationSkeletonProps) => {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-${columns} gap-4 md:gap-6`}
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(250px, 1fr))` }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-4">
            <div
              className="bg-muted rounded-md animate-pulse mb-3"
              style={{ height }}
            />
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded-md animate-pulse w-3/4" />
              <div className="h-4 bg-muted rounded-md animate-pulse w-1/2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PaginationSkeleton;
