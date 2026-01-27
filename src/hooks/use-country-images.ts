/**
 * Hook: useCountryImages
 * Fetches and manages country gallery images with caching and error handling
 */

import { useState, useEffect } from 'react';
import { fetchCountryImages, UnsplashImage } from '@/lib/unsplash-api';
import logger from '@/lib/logger';

interface UseCountryImagesReturn {
  images: UnsplashImage[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useCountryImages(countryName: string | null): UseCountryImagesReturn {
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchImages = async () => {
    if (!countryName) {
      setImages([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get Unsplash API key from environment
      const apiKey = import.meta.env.VITE_UNSPLASH_API_KEY;

      if (!apiKey) {
        logger.debug('[useCountryImages] Unsplash API key not configured');
        setImages([]);
        setIsLoading(false);
        return;
      }

      const fetchedImages = await fetchCountryImages(countryName, apiKey);
      setImages(fetchedImages);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch images');
      logger.error('[useCountryImages] Error fetching country images:', error);
      setError(error);
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch images when country changes
  useEffect(() => {
    fetchImages();
  }, [countryName]);

  return {
    images,
    isLoading,
    error,
    refetch: fetchImages,
  };
}
