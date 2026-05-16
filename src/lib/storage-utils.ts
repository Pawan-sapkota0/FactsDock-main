import { supabase } from "@/integrations/supabase/client";
import logger from "@/lib/logger";

/**
 * Upload an image file to Supabase storage and return the public URL
 */
export const uploadStoryImage = async (file: File): Promise<string> => {
  try {
    if (!file) throw new Error("No file provided");

    // Validate file is an image
    if (!file.type.startsWith("image/")) {
      throw new Error("Only image files are allowed");
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      throw new Error("File size must be less than 5MB");
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split(".").pop();
    const filename = `story-${timestamp}-${randomStr}.${extension}`;

    // Upload to storage
    const { error: uploadError, data } = await supabase.storage
      .from("story-covers")
      .upload(filename, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("story-covers")
      .getPublicUrl(filename);

    if (!publicUrlData?.publicUrl) {
      throw new Error("Failed to get public URL");
    }

    logger.log("[uploadStoryImage] File uploaded successfully", filename);
    return publicUrlData.publicUrl;
  } catch (error) {
    logger.error("[uploadStoryImage] Upload failed", error);
    throw error;
  }
};

/**
 * Delete an image file from Supabase storage
 */
export const deleteStoryImage = async (imageUrl: string): Promise<void> => {
  try {
    if (!imageUrl) return;

    // Extract filename from URL
    const urlParts = imageUrl.split("/");
    const filename = urlParts[urlParts.length - 1];

    if (!filename) return;

    const { error } = await supabase.storage
      .from("story-covers")
      .remove([filename]);

    if (error) {
      logger.error("[deleteStoryImage] Delete failed", error);
      // Don't throw - deletion failures shouldn't block operations
    } else {
      logger.log("[deleteStoryImage] File deleted successfully", filename);
    }
  } catch (error) {
    logger.error("[deleteStoryImage] Unexpected error", error);
    // Silently fail - don't block operations
  }
};
