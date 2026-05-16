import { supabase } from "@/integrations/supabase/client";
import { log, error } from "@/lib/logger";

const API_URL = import.meta.env.VITE_SUPABASE_URL;

export interface StoryCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  created_at?: string;
}

export interface StoryContentObject {
  body?: string;
  highlights?: string[];
  sections?: Array<{
    heading: string;
    body: string;
    image?: string;
  }>;
  type?: string;
  content?: unknown[];
}

export type StoryContent = string | StoryContentObject;

export interface Story {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: StoryContent;
  cover_image: string;
  category_id: string;
  tags?: string[];
  reading_time: string;
  is_featured: boolean;
  is_trending: boolean;
  status: "draft" | "published";
  views: number;
  meta_title?: string;
  meta_description?: string;
  seo_keywords?: string;
  author: string;
  publish_date?: string;
  created_at: string;
  updated_at: string;
  story_categories?: StoryCategory;
}

export interface CreateStoryPayload {
  title: string;
  slug: string;
  description: string;
  content: StoryContent;
  cover_image: string;
  category_id: string;
  tags?: string[];
  reading_time: string;
  status?: "draft" | "published";
  publish_date?: string;
  meta_title?: string;
  meta_description?: string;
  seo_keywords?: string;
  is_featured?: boolean;
}

const getAuthToken = async () => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return session?.access_token;
};

const getErrorMessage = (err: unknown) => {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
};

const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeout = 20000,
) => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Request timed out. The server took too long to respond.");
    }
    throw err;
  } finally {
    window.clearTimeout(timer);
  }
};

const parseResponse = async (response: Response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON response: ${text}`);
  }
};

const ensureOk = async (response: Response, action: string) => {
  if (response.ok) return;
  const body = await parseResponse(response).catch(() => null);
  const message = body?.error || response.statusText || action;
  throw new Error(`${action}: ${message}`);
};

// ============================================================================
// Story Management API
// ============================================================================

export const storiesAPI = {
  // Get all stories (admin view - includes drafts)
  async getAllStories() {
    try {
      const { data: stories, error } = await supabase
        .from("stories")
        .select(
          `id, title, slug, description, content, cover_image, category_id,
           tags, reading_time, status, is_featured, is_trending, views,
           meta_title, meta_description, seo_keywords, author, publish_date,
           created_at, updated_at, story_categories(name, slug)`
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (stories || []) as Story[];
    } catch (err) {
      error("[storiesAPI.getAllStories]", err);
      throw err;
    }
  },

  // Get single story by slug (for public view and detail pages)
  async getStoryBySlug(slug: string) {
    try {
      const { data: story, error } = await supabase
        .from("stories")
        .select(`id, title, slug, description, content, cover_image, category_id, tags, reading_time, status, views, meta_title, meta_description, seo_keywords, author, publish_date, created_at, updated_at, story_categories(name, slug)`)
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (error || !story) {
        throw new Error("Story not found");
      }

      return story as Story;
    } catch (err) {
      error("[storiesAPI.getStoryBySlug]", err);
      throw err;
    }
  },

  // Get featured stories for homepage
  async getFeaturedStories() {
    try {
      const { data: featured, error } = await supabase
        .from("stories")
        .select(`id, title, slug, description, cover_image, category_id, reading_time, views, publish_date, created_at, story_categories(name, slug)`)
        .eq("status", "published")
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) {
        throw error;
      }

      if (featured && featured.length > 0) {
        return featured as Story[];
      }

      const { data: fallback, error: fallbackError } = await supabase
        .from("stories")
        .select(`id, title, slug, description, cover_image, category_id, reading_time, views, publish_date, created_at, story_categories(name, slug)`)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(3);

      if (fallbackError) {
        throw fallbackError;
      }

      return fallback || [];
    } catch (err) {
      error("[storiesAPI.getFeaturedStories]", err);
      throw err;
    }
  },

  // Get all published stories
  async getPublishedStories() {
    try {
      const { data: stories, error } = await supabase
        .from("stories")
        .select(`id, title, slug, description, cover_image, category_id, reading_time, views, publish_date, created_at, story_categories(name, slug)`)
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return (stories || []) as Story[];
    } catch (err) {
      error("[storiesAPI.getPublishedStories]", err);
      throw err;
    }
  },

  // Create story
  async createStory(payload: CreateStoryPayload) {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session?.user) {
        throw new Error("Authentication is required to create a story.");
      }

      const insertStatus = payload.status === "published" ? "published" : "draft";
      const publishDate = insertStatus === "published" ? payload.publish_date || new Date().toISOString() : null;

      const { data: story, error } = await supabase
        .from("stories")
        .insert({
          title: payload.title,
          slug: payload.slug,
          description: payload.description,
          content: payload.content,
          cover_image: payload.cover_image,
          category_id: payload.category_id,
          tags: payload.tags || [],
          reading_time: payload.reading_time,
          status: insertStatus,
          publish_date: publishDate,
          is_featured: payload.is_featured || false,
          meta_title: payload.meta_title,
          meta_description: payload.meta_description,
          seo_keywords: payload.seo_keywords,
          created_by: session.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      log("[storiesAPI.createStory] Success");
      return story as Story;
    } catch (err) {
      const message = getErrorMessage(err);
      error("[storiesAPI.createStory]", message);
      throw new Error(message);
    }
  },

  // Update story
  async updateStory(id: string, payload: Partial<Story>) {
    try {
      const { data: story, error } = await supabase
        .from("stories")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      log("[storiesAPI.updateStory] Success");
      return story as Story;
    } catch (err) {
      const message = getErrorMessage(err);
      error("[storiesAPI.updateStory]", message);
      throw new Error(message);
    }
  },

  // Delete story
  async deleteStory(id: string) {
    try {
      const { error } = await supabase
        .from("stories")
        .delete()
        .eq("id", id);

      if (error) throw error;
      log("[storiesAPI.deleteStory] Success");
      return true;
    } catch (err) {
      error("[storiesAPI.deleteStory]", err);
      throw err;
    }
  },

  // Publish/Unpublish story
  async publishStory(id: string, status: "published" | "draft") {
    try {
      const updates: Partial<Story> = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (status === "published") {
        updates.publish_date = new Date().toISOString();
      } else {
        updates.publish_date = null;
      }

      const { data: story, error } = await supabase
        .from("stories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      log("[storiesAPI.publishStory] Success");
      return story as Story;
    } catch (err) {
      const message = getErrorMessage(err);
      error("[storiesAPI.publishStory]", message);
      throw new Error(message);
    }
  },
};

// ============================================================================
// Story Categories API
// ============================================================================

export const storyCategoriesAPI = {
  // Get all categories
  async getAll() {
    try {
      const { data, error } = await supabase
        .from("story_categories")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as StoryCategory[];
    } catch (err) {
      error("[storyCategoriesAPI.getAll]", err);
      throw err;
    }
  },

  // Create category
  async create(name: string, slug: string, description?: string) {
    try {
      const { data, error } = await supabase
        .from("story_categories")
        .insert({ name, slug, description })
        .select()
        .single();

      if (error) throw error;
      log("[storyCategoriesAPI.create] Success");
      return data as StoryCategory;
    } catch (err) {
      error("[storyCategoriesAPI.create]", err);
      throw err;
    }
  },

  // Update category
  async update(id: string, payload: Partial<StoryCategory>) {
    try {
      const { data, error } = await supabase
        .from("story_categories")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      log("[storyCategoriesAPI.update] Success");
      return data as StoryCategory;
    } catch (err) {
      error("[storyCategoriesAPI.update]", err);
      throw err;
    }
  },

  // Delete category
  async delete(id: string) {
    try {
      const { error } = await supabase
        .from("story_categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
      log("[storyCategoriesAPI.delete] Success");
      return true;
    } catch (err) {
      error("[storyCategoriesAPI.delete]", err);
      throw err;
    }
  },
};
