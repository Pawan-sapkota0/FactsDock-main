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
  // Generate array of page numbers to display - responsive
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const pages_to_show = new Set<number>();

    // Mobile: only show current page and ±1
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages_to_show.add(i);
      }
    } else {
      // Mobile (< md): current page only
      pages_to_show.add(currentPage);
      if (currentPage > 1) pages_to_show.add(currentPage - 1);
      if (currentPage < totalPages) pages_to_show.add(currentPage + 1);
    }

    // Convert to sorted array
    const sortedPages = Array.from(pages_to_show).sort((a, b) => a - b);

    if (totalPages <= 5) {
      // Show all pages if total is 5 or less
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

  // Desktop version with more pages
  const getPageNumbersDesktop = () => {
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
  const pageNumbersDesktop = getPageNumbersDesktop();

  return (
    <div
      className={`flex items-center justify-center gap-1 sm:gap-2 mt-8 ${className}`}
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

      {/* Page Numbers - Mobile Version (hidden on md+) */}
      <div className="flex items-center gap-1 flex-shrink-0 md:hidden">
        {pageNumbers.map((page, index) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-mobile-${index}`}
                className="px-1 py-1 text-xs"
              >
                {page}
              </span>
            );
          }

          const isActive = page === currentPage;
          return (
            <Button
              key={`mobile-${page}`}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page as number)}
              className="min-w-8 h-9 px-2 text-xs"
            >
              {page}
            </Button>
          );
        })}
      </div>

      {/* Page Numbers - Desktop Version (hidden on mobile) */}
      <div className="hidden md:flex items-center gap-1 flex-shrink-0">
        {pageNumbersDesktop.map((page, index) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-desktop-${index}`}
                className="px-2 py-1 text-sm"
              >
                {page}
              </span>
            );
          }

          const isActive = page === currentPage;
          return (
            <Button
              key={`desktop-${page}`}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page as number)}
              className="min-w-10 h-10 px-2 text-sm"
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
      <div className="text-xs sm:text-sm text-muted-foreground ml-1 sm:ml-2 flex-shrink-0 whitespace-nowrap">
        <span className="hidden sm:inline">
          Page {currentPage} of {totalPages}
        </span>
        <span className="sm:hidden">
          {currentPage}/{totalPages}
        </span>
      </div>
    </div>
  );
};

export default PaginationControls;
