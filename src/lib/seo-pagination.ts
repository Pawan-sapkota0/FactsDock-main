/**
 * SEO utilities for pagination
 * Handles canonical URLs, meta tags, and structured data for paginated content
 */

export interface PaginationMeta {
  pageNumber: number;
  totalPages: number;
  currentUrl: string;
  canonicalUrl: string;
  nextPageUrl?: string;
  prevPageUrl?: string;
}

/**
 * Set canonical URL meta tag for pagination SEO
 * Ensures search engines understand the correct page structure
 */
export function setCanonicalUrl(url: string) {
  // Remove or update existing canonical tag
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link") as HTMLLinkElement;
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", url);
}

/**
 * Set pagination rel links (prev/next) for search engines
 * Helps search engines understand pagination structure
 */
export function setPaginationRelLinks(
  nextUrl?: string,
  prevUrl?: string
) {
  // Remove existing pagination links
  document.querySelectorAll('link[rel="next"], link[rel="prev"]').forEach((el) => el.remove());

  if (nextUrl) {
    const nextLink = document.createElement("link");
    nextLink.rel = "next";
    nextLink.href = nextUrl;
    document.head.appendChild(nextLink);
  }

  if (prevUrl) {
    const prevLink = document.createElement("link");
    prevLink.rel = "prev";
    prevLink.href = prevUrl;
    document.head.appendChild(prevLink);
  }
}

/**
 * Generate pagination URLs
 * Properly handles query parameters while maintaining clean URLs
 */
export function generatePaginationUrl(
  basePath: string,
  pageNumber: number,
  preserveParams?: Record<string, string>
): string {
  const url = new URL(basePath, window.location.origin);
  
  if (pageNumber > 1) {
    url.searchParams.set("page", String(pageNumber));
  }

  // Add other query parameters if provided
  if (preserveParams) {
    Object.entries(preserveParams).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
  }

  return url.pathname + url.search;
}

/**
 * Update page meta description for pagination
 * Helps search engines understand content and improves click-through rates
 */
export function updatePaginationMetaDescription(
  baseDescription: string,
  pageNumber: number,
  totalPages: number
): void {
  let metaDescription = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!metaDescription) {
    metaDescription = document.createElement("meta");
    metaDescription.name = "description";
    document.head.appendChild(metaDescription);
  }

  if (pageNumber > 1) {
    metaDescription.setAttribute(
      "content",
      `${baseDescription} - Page ${pageNumber} of ${totalPages}`
    );
  } else {
    metaDescription.setAttribute("content", baseDescription);
  }
}

/**
 * Create JSON-LD structured data for pagination
 * Helps search engines understand pagination better
 */
export function generatePaginationStructuredData(meta: PaginationMeta): string {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    url: meta.canonicalUrl,
    name: `Results Page ${meta.pageNumber}`,
    isPartOf: {
      "@type": "Collection",
      url: meta.canonicalUrl.split("?")[0],
      hasPart: {
        "@type": "WebPage",
        url: meta.canonicalUrl,
        position: meta.pageNumber,
      },
    },
  };

  if (meta.nextPageUrl) {
    (structuredData as any).relatedLink = meta.nextPageUrl;
  }

  return JSON.stringify(structuredData);
}

/**
 * Update page title for pagination
 * Shows users what page they're on
 */
export function updatePageTitleForPagination(
  baseTitle: string,
  pageNumber: number,
  totalPages: number
): void {
  if (pageNumber > 1) {
    document.title = `${baseTitle} - Page ${pageNumber}`;
  } else {
    document.title = baseTitle;
  }
}

/**
 * Initialize SEO for paginated content
 * Comprehensive function to set all necessary SEO elements
 */
export function initializePaginationSEO(
  pageNumber: number,
  totalPages: number,
  basePath: string,
  baseTitle: string,
  baseDescription: string,
  preserveParams?: Record<string, string>
): void {
  const currentUrl = window.location.pathname + window.location.search;
  const canonicalUrl = generatePaginationUrl(basePath, pageNumber, preserveParams);

  // Generate pagination URLs
  let nextUrl: string | undefined;
  let prevUrl: string | undefined;

  if (pageNumber < totalPages) {
    nextUrl = generatePaginationUrl(basePath, pageNumber + 1, preserveParams);
  }

  if (pageNumber > 1) {
    prevUrl = generatePaginationUrl(
      basePath,
      pageNumber > 2 ? pageNumber - 1 : 1,
      preserveParams
    );
    if (pageNumber === 2) {
      // First page doesn't have ?page param
      prevUrl = basePath + (Object.keys(preserveParams || {}).length > 0 ? "?" + new URLSearchParams(preserveParams).toString() : "");
    }
  }

  // Update all SEO elements
  setCanonicalUrl(canonicalUrl);
  setPaginationRelLinks(nextUrl, prevUrl);
  updatePageTitleForPagination(baseTitle, pageNumber, totalPages);
  updatePaginationMetaDescription(baseDescription, pageNumber, totalPages);
}
