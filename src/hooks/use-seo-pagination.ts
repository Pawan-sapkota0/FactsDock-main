import { useEffect } from "react";
import { usePagination } from "./use-pagination";
import { initializePaginationSEO } from "@/lib/seo-pagination";

export interface UseSEOPaginationOptions {
  itemsPerPage?: number;
  defaultPage?: number;
  baseTitle: string;
  baseDescription: string;
  basePath: string;
  preserveParams?: Record<string, string>;
}

/**
 * Hook that combines pagination with SEO utilities
 * Automatically updates canonical URLs, meta tags, and page title
 */
export function useSEOPagination(options: UseSEOPaginationOptions) {
  const {
    itemsPerPage = 8,
    baseTitle,
    baseDescription,
    basePath,
    preserveParams = {},
  } = options;

  const pagination = usePagination({ itemsPerPage });

  // Update SEO elements whenever page changes
  useEffect(() => {
    initializePaginationSEO(
      pagination.currentPage,
      pagination.totalPages,
      basePath,
      baseTitle,
      baseDescription,
      preserveParams
    );
  }, [
    pagination.currentPage,
    pagination.totalPages,
    basePath,
    baseTitle,
    baseDescription,
    preserveParams,
  ]);

  return pagination;
}
