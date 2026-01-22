import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

export interface UsePaginationOptions {
  itemsPerPage?: number;
  defaultPage?: number;
}

export interface UsePaginationReturn {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  setPage: (page: number) => void;
  setTotalItems: (total: number) => void;
  paginate: <T>(items: T[]) => T[];
}

/**
 * Hook to manage pagination with URL query parameters
 * Automatically syncs page state with URL (?page=2)
 */
export function usePagination(
  options: UsePaginationOptions = {}
): UsePaginationReturn {
  const { itemsPerPage = 8, defaultPage = 1 } = options;
  const [searchParams, setSearchParams] = useSearchParams();
  const [totalItems, setTotalItems] = useState(0);

  // Get current page from URL or use default
  const currentPage = Math.max(
    1,
    parseInt(searchParams.get("page") || String(defaultPage), 10)
  );

  // Calculate pagination values
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Ensure current page doesn't exceed total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const setPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages || 1));
    // Update URL with page parameter
    const params = new URLSearchParams(searchParams);
    if (validPage === 1) {
      // Remove page param if it's the default
      params.delete("page");
    } else {
      params.set("page", String(validPage));
    }
    setSearchParams(params, { replace: true });
  };

  const paginate = <T,>(items: T[]): T[] => {
    return items.slice(startIndex, endIndex);
  };

  return {
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    canGoPrevious: currentPage > 1,
    canGoNext: currentPage < totalPages,
    setPage,
    setTotalItems,
    paginate,
  };
}
