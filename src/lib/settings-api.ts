import { supabase } from "@/integrations/supabase/client";
import { log, debug, warn, error } from "@/lib/logger";

export interface Settings {
  // Database ID
  id?: string;

  // General Settings
  website_name: string;
  website_tagline: string;
  default_language: string;
  default_timezone: string;
  items_per_page: number;

  // SEO Settings
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  og_image_url?: string;
  allow_indexing: boolean;

  // Content Settings
  facts_per_page: number;
  quiz_questions_limit: number;
  enable_random_quiz: boolean;
  enable_country_quiz: boolean;

  // Performance Settings
  enable_skeleton_loading: boolean;
  enable_pagination: boolean;
  enable_lazy_loading: boolean;

  // Security & Access
  admin_email?: string;
  maintenance_mode: boolean;
  content_approval_required: boolean;

  // Branding Settings
  hero_background_url?: string | null;
  logo_url?: string | null;
  favicon_url?: string | null;
  hero_background_storage_path?: string | null;
  logo_storage_path?: string | null;
  favicon_storage_path?: string | null;
}

export const DEFAULT_SETTINGS: Settings = {
  website_name: "FactsDock",
  website_tagline: "Discover amazing facts from around the world",
  default_language: "en",
  default_timezone: "UTC",
  items_per_page: 8,
  meta_title: "FactsDock - Discover Amazing Facts",
  meta_description: "Explore interesting facts about countries, history, science, and more",
  meta_keywords: "facts, world, education, countries",
  allow_indexing: true,
  facts_per_page: 8,
  quiz_questions_limit: 10,
  enable_random_quiz: true,
  enable_country_quiz: true,
  enable_skeleton_loading: true,
  enable_pagination: true,
  enable_lazy_loading: true,
  maintenance_mode: false,
  content_approval_required: false,
  hero_background_url: null,
  logo_url: null,
  favicon_url: null,
  hero_background_storage_path: null,
  logo_storage_path: null,
  favicon_storage_path: null,
};

/**
 * Fetch current settings from database
 */
export const fetchSettings = async (): Promise<Settings> => {
  try {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .single();

    if (error) {
      warn("Failed to fetch settings, using defaults:", error);
      return DEFAULT_SETTINGS;
    }

    return data || DEFAULT_SETTINGS;
  } catch (err) {
    error("Settings fetch error:", err);
    return DEFAULT_SETTINGS;
  }
};

/**
 * Save settings to database
 */
export const saveSettings = async (settings: Partial<Settings>): Promise<Settings> => {
  try {
    const { data, error } = await supabase
      .from("settings")
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .eq("id", (await supabase.from("settings").select("id").single()).data?.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    error("Failed to save settings:", err);
    throw err;
  }
};

/**
 * Update a single setting
 */
export const updateSetting = async (key: keyof Settings, value: unknown): Promise<void> => {
  try {
    const { error } = await supabase
      .from("settings")
      .update({
        // cast to any at boundary for Supabase client
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SDK/DB boundary: update payload
        [key]: value as any,
        updated_at: new Date().toISOString(),
      })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) throw error;
  } catch (err) {
    error(`Failed to update ${key}:`, err);
    throw err;
  }
};

/**
 * Cache settings in localStorage
 */
export const cacheSettings = (settings: Settings): void => {
  try {
    localStorage.setItem("wf:settings", JSON.stringify(settings));
  } catch (err) {
    warn("Failed to cache settings:", err);
  }
};

/**
 * Get cached settings from localStorage
 */
export const getCachedSettings = (): Settings | null => {
  try {
    const cached = localStorage.getItem("wf:settings");
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    warn("Failed to get cached settings:", err);
    return null;
  }
};
