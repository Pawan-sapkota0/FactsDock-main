import { useEffect } from "react";
import {
  updateMetaTags,
  addStructuredData,
  MetaTags,
  StructuredData,
} from "@/lib/seo-utils";

interface SEOMetaProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  canonical?: string;
  robots?: string;
  structuredData?: StructuredData;
}

/**
 * SEOMeta Component
 * Manages all meta tags and structured data for a page
 * Place this at the top level of any page component
 *
 * @example
 * <SEOMeta
 *   title="Country Facts | World Facts"
 *   description="Explore fascinating facts about countries"
 *   keywords="country facts, world information"
 *   ogImage="https://example.com/image.jpg"
 *   structuredData={articleSchema}
 * />
 */
export const SEOMeta = ({
  title,
  description,
  keywords,
  ogImage,
  ogTitle,
  ogDescription,
  canonical,
  robots,
  structuredData,
}: SEOMetaProps) => {
  useEffect(() => {
    // Update meta tags
    updateMetaTags({
      title,
      description,
      keywords,
      ogImage,
      ogTitle: ogTitle || title,
      ogDescription: ogDescription || description,
      canonical: canonical || window.location.href,
      robots: robots || "index, follow",
    });

    // Add structured data if provided
    if (structuredData) {
      addStructuredData(structuredData);
    }
  }, [
    title,
    description,
    keywords,
    ogImage,
    ogTitle,
    ogDescription,
    canonical,
    robots,
    structuredData,
  ]);

  return null;
};
