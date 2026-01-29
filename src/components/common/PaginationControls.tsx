import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  className?: string;
}

/**
 * Reusable pagination controls component
 * Displays Previous/Next buttons and page numbers
 */
export const PaginationControls = ({
  currentPage,
  totalPages,
  onPageChange,
  canGoPrevious,
  canGoNext,
  className = "",
}: PaginationControlsProps) => {
  // Generate array of page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const pages_to_show = new Set<number>();

    // Always include first 2 and last 2 pages
    pages_to_show.add(1);
    if (totalPages > 1) pages_to_show.add(2);
    pages_to_show.add(totalPages);
    if (totalPages > 1) pages_to_show.add(totalPages - 1);

    // Include current page and ±1
    pages_to_show.add(currentPage);
    if (currentPage > 1) pages_to_show.add(currentPage - 1);
    if (currentPage < totalPages) pages_to_show.add(currentPage + 1);

    // Convert to sorted array
    const sortedPages = Array.from(pages_to_show).sort((a, b) => a - b);

    if (totalPages <= 7) {
      // Show all pages if total is 7 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Build pages array with gaps replaced by "…"
      let lastAdded = 0;
      for (const pageNum of sortedPages) {
        // Add ellipsis if there's a gap
        if (pageNum > lastAdded + 1) {
          pages.push("...");
        }
        pages.push(pageNum);
        lastAdded = pageNum;
      }
    }

    return pages;
  };

  if (totalPages <= 1) {
    return null;
  }

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={`flex items-center justify-center gap-1 sm:gap-2 mt-8 overflow-x-auto ${className}`}
    >
      {/* Previous Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canGoPrevious}
        className="gap-1 flex-shrink-0 text-xs sm:text-sm"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Previous</span>
      </Button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {pageNumbers.map((page, index) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-1 sm:px-2 py-1 text-xs"
              >
                {page}
              </span>
            );
          }

          const isActive = page === currentPage;
          return (
            <Button
              key={page}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page as number)}
              className="min-w-8 sm:min-w-10 h-9 sm:h-10 px-2 text-xs sm:text-sm"
            >
              {page}
            </Button>
          );
        })}
      </div>

      {/* Next Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canGoNext}
        className="gap-1 flex-shrink-0 text-xs sm:text-sm"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Page Info */}
      <div className="text-xs text-muted-foreground ml-1 sm:ml-2 flex-shrink-0 whitespace-nowrap">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
};

export default PaginationControls;
