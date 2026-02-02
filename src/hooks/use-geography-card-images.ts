/**
 * Hook: useGeographyCardImages
 * Fetches and manages geography highlight card images
 * Reuses existing fetchCountryImages function for efficient multi-layer caching (IndexedDB + localStorage + memory)
 * Returns 8-12 images per geography card topic
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchCountryImages, UnsplashImage } from '@/lib/unsplash-api';
import logger from '@/lib/logger';

interface UseGeographyCardImagesReturn {
  images: UnsplashImage[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom search queries per geography card
 * Uses card value strictly as search term
 */
const GEOGRAPHY_CARD_QUERIES: Record<string, string> = {
  'Mt. Everest': 'Mount Everest',
  'Dead Sea Shore': 'Dead Sea',
  'Pacific Ocean': 'Pacific Ocean',
  'Antarctica': 'Antarctica',
  'Nile River': 'Nile River',
  'Caspian Sea': 'Caspian Sea',
};

/**
 * Fetch images for a specific geography card topic
 * Reuses the existing fetchCountryImages function which provides:
 * - Multi-layer caching: IndexedDB (500+ MB) + localStorage + memory
 * - Image compression (30-40% smaller)
 * - Smarter search strategies (8 queries instead of 4)
 * - 8-12 images per topic (vs 6-10)
 * - Better image deduplication
 */
export function useGeographyCardImages(cardTopic: string | null): UseGeographyCardImagesReturn {
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchImages = useCallback(async () => {
    if (!cardTopic) {
      setImages([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get Unsplash API key from environment
      const apiKey = import.meta.env.VITE_UNSPLASH_API_KEY;

      if (!apiKey) {
        logger.debug('[useGeographyCardImages] Unsplash API key not configured');
        setImages([]);
        setIsLoading(false);
        return;
      }

      // Use custom search queries for better results, or fall back to card topic
      const searchTerm = GEOGRAPHY_CARD_QUERIES[cardTopic] || cardTopic;
      
      // Reuse existing fetchCountryImages function for efficient caching
      // It handles: IndexedDB, localStorage, memory caching, compression, deduplication
      const fetchedImages = await fetchCountryImages(searchTerm, apiKey);
      setImages(fetchedImages);
      
      logger.debug(`[useGeographyCardImages] Fetched ${fetchedImages.length} images for "${cardTopic}"`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch images');
      logger.error('[useGeographyCardImages] Error fetching geography card images:', error);
      setError(error);
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  }, [cardTopic]);

  // Fetch images when card topic changes
  useEffect(() => {
    fetchImages();
  }, [cardTopic, fetchImages]);

  return {
    images,
    isLoading,
    error,
    refetch: fetchImages,
  };
}
