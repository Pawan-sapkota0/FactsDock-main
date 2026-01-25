import { useEffect, useState } from "react";
import { fetchSiteImages } from "@/lib/site-images-api";
import logger from "@/lib/logger";

export interface UseSiteImagesResult {
  heroBackground: string | null;
  logo: string | null;
  favicon: string | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useSiteImages(): UseSiteImagesResult {
  const [images, setImages] = useState<{
    heroBackgroundUrl: string | null;
    logoUrl: string | null;
    faviconUrl: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadImages = async () => {
    try {
      setIsLoading(true);
      const fetchedImages = await fetchSiteImages();
      setImages(fetchedImages);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      logger.error("[useSiteImages]", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadImages();

    // Listen for settings updates
    const handleSettingsUpdate = () => {
      loadImages();
    };

    window.addEventListener("wf:settings-updated", handleSettingsUpdate);
    return () => {
      window.removeEventListener("wf:settings-updated", handleSettingsUpdate);
    };
  }, []);

  return {
    heroBackground: images?.heroBackgroundUrl || null,
    logo: images?.logoUrl || null,
    favicon: images?.faviconUrl || null,
    isLoading,
    error,
    refetch: loadImages,
  };
}
