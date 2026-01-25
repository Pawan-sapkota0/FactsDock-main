import { supabase } from "@/integrations/supabase/client";

const BUCKET_NAME = "site-assets";
const CACHE_DURATION = 3600; // 1 hour

export interface UploadResponse {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

export interface DeleteResponse {
  success: boolean;
  error?: string;
}

/**
 * Upload a site image to Supabase Storage
 */
export async function uploadSiteImage(
  file: File,
  imageType: "hero" | "logo" | "favicon"
): Promise<UploadResponse> {
  try {
    // Validate file
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const extension = file.name.split(".").pop() || "jpg";
    const fileName = `${imageType}/${timestamp}.${extension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    return {
      success: true,
      url: urlData.publicUrl,
      path: fileName,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Upload failed";
    return { success: false, error: errorMessage };
  }
}

/**
 * Delete a site image from Supabase Storage
 */
export async function deleteSiteImage(path: string): Promise<DeleteResponse> {
  try {
    if (!path) {
      return { success: false, error: "No file path provided" };
    }

    const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);

    if (error) {
      return { success: false, error: error.message };
    }

    // Clear cache for this image
    const cacheKey = `site-image:${path}`;
    localStorage.removeItem(cacheKey);

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Delete failed";
    return { success: false, error: errorMessage };
  }
}

/**
 * Get cached image URL or fetch from storage
 */
export function getCachedImageUrl(path: string): string | null {
  if (!path) return null;

  const cacheKey = `site-image:${path}`;
  
  // Check localStorage cache
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed.ts && parsed.ttl && Date.now() - parsed.ts < parsed.ttl) {
        return parsed.value;
      }
    } catch (e) {
      // ignore parse errors
    }
  }

  // Generate URL and cache it
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  if (data?.publicUrl) {
    const cacheObj = { ts: Date.now(), ttl: CACHE_DURATION * 1000, value: data.publicUrl };
    localStorage.setItem(cacheKey, JSON.stringify(cacheObj));
    return data.publicUrl;
  }

  return null;
}

/**
 * Fetch site images from settings
 */
export async function fetchSiteImages() {
  try {
    const { data, error } = await supabase
      .from("settings")
      .select(
        "hero_background_url, logo_url, favicon_url"
      )
      .single();

    if (error) {
      return null;
    }

    // Return with camelCase keys to match hook expectations
    return {
      heroBackgroundUrl: data?.hero_background_url || null,
      logoUrl: data?.logo_url || null,
      faviconUrl: data?.favicon_url || null,
    };
  } catch (err) {
    return null;
  }
}
