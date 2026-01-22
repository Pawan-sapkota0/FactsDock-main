import React from "react";
import { Card } from "@/components/ui/card";

const NewsSkeleton: React.FC = () => {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="p-4">
          <div className="space-y-2">
            <div className="h-5 bg-gray-700 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-gray-700 rounded w-1/2 animate-pulse" />
            <div className="h-3 bg-gray-600 rounded w-1/4 animate-pulse" />
          </div>
        </Card>
      ))}
    </div>
  );
};

export default NewsSkeleton;
