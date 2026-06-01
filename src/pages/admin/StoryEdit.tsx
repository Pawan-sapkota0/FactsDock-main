import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Save,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Eye,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  storiesAPI,
  storyCategoriesAPI,
  Story,
  StoryCategory,
  CreateStoryPayload,
  StoryContent,
  StoryContentObject,
} from "@/lib/stories-api";
import { uploadStoryImage, deleteStoryImage } from "@/lib/storage-utils";
import logger from "@/lib/logger";

const StoryEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(!!id);
  const [savingAction, setSavingAction] = useState<
    "idle" | "draft" | "publish"
  >("idle");
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<StoryCategory[]>([]);
  const [story, setStory] = useState<Partial<Story>>({
    title: "",
    slug: "",
    description: "",
    content: {
      body: "",
      highlights: [],
    },
    cover_image: "",
    category_id: "",
    tags: [],
    reading_time: "",
    meta_title: "",
    meta_description: "",
    seo_keywords: "",
    is_featured: false,
  });

  useEffect(() => {
    loadCategories();
    if (id) loadStory();
  }, [id]);

  const loadCategories = async () => {
    try {
      const data = await storyCategoriesAPI.getAll();
      setCategories(data);
    } catch (error) {
      logger.error("[StoryEdit] Failed to load categories", error);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    }
  };

  const loadStory = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await storiesAPI.getAllStories();
      const found = data.find((s) => s.id === id);
      if (found) setStory(found);
    } catch (error) {
      logger.error("[StoryEdit] Failed to load story", error);
      toast({
        title: "Error",
        description: "Failed to load story",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const normalizeContent = (
    content?: StoryContent,
  ): StoryContentObject & { body: string; highlights: string[] } => {
    if (!content) {
      return { body: "", highlights: [] };
    }
    if (typeof content === "string") {
      return { body: content, highlights: [] };
    }
    return {
      body: content.body || "",
      highlights: content.highlights || [],
      sections: content.sections,
      type: content.type,
      content: content.content,
    };
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const publicUrl = await uploadStoryImage(file);
      setStory({ ...story, cover_image: publicUrl });
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      logger.error("[StoryEdit] Image upload failed", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = "";
    }
  };

  const handleRemoveImage = async () => {
    if (story.cover_image) {
      try {
        await deleteStoryImage(story.cover_image);
      } catch (error) {
        logger.error("[StoryEdit] Image deletion failed", error);
      }
    }
    setStory({ ...story, cover_image: "" });
  };

  const handleTitleChange = (value: string) => {
    setStory({
      ...story,
      title: value,
      slug: generateSlug(value),
    });
  };

  const handleSave = async (asDraft: boolean = true) => {
    try {
      const normalizedContent = normalizeContent(story.content);
      if (
        !story.title ||
        !story.slug ||
        !story.description ||
        !story.cover_image ||
        !story.category_id ||
        !normalizedContent.body.trim()
      ) {
        toast({
          title: "Error",
          description:
            "Please fill in all required fields, including story content",
          variant: "destructive",
        });
        return;
      }

      setSavingAction(asDraft ? "draft" : "publish");
      const contentObject = normalizeContent(story.content);
      const payload: CreateStoryPayload = {
        title: story.title,
        slug: story.slug,
        description: story.description,
        content: {
          body: contentObject.body,
          highlights: contentObject.highlights,
        },
        cover_image: story.cover_image,
        category_id: story.category_id,
        tags: story.tags,
        reading_time: story.reading_time,
        meta_title: story.meta_title,
        meta_description: story.meta_description,
        seo_keywords: story.seo_keywords,
        is_featured: story.is_featured,
      };

      if (id) {
        await storiesAPI.updateStory(id, {
          ...payload,
          status: asDraft ? "draft" : "published",
        });
      } else {
        await storiesAPI.createStory({
          ...payload,
          status: asDraft ? "draft" : "published",
          publish_date: asDraft ? undefined : new Date().toISOString(),
        });
      }

      toast({
        title: "Success",
        description: `Story ${asDraft ? "saved as draft" : "published"} successfully`,
      });

      if (!id) navigate("/admin/stories");
    } catch (error) {
      logger.error("[StoryEdit] Failed to save story", error);
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "Failed to save story";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSavingAction("idle");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/stories")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {id ? "Edit Story" : "Create Story"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {id
                ? "Update story details and content"
                : "Create a new educational story"}
            </p>
          </div>
        </div>
        {id && (
          <Button
            variant="outline"
            onClick={() => window.open(`/stories/${story.slug}`, "_blank")}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Basic Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Story Title *
                </label>
                <Input
                  value={story.title || ""}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g., The Dark Truth Behind Ancient Rome"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Slug (auto-generated) *
                </label>
                <Input
                  value={story.slug || ""}
                  onChange={(e) => setStory({ ...story, slug: e.target.value })}
                  placeholder="auto-generated-slug"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Short Description *
                </label>
                <textarea
                  value={story.description || ""}
                  onChange={(e) =>
                    setStory({ ...story, description: e.target.value })
                  }
                  placeholder="Brief description visible on story cards..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Cover Image *
                </label>

                {/* Image Upload Section */}
                <div className="space-y-4">
                  {/* File Upload Input */}
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      aria-label="Upload cover image"
                    />
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">
                          Uploading...
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <p className="font-medium text-foreground">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Or divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        or use URL
                      </span>
                    </div>
                  </div>

                  {/* URL Input */}
                  <Input
                    value={story.cover_image || ""}
                    onChange={(e) =>
                      setStory({ ...story, cover_image: e.target.value })
                    }
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>

                {/* Image Preview */}
                {story.cover_image && (
                  <div className="mt-4 relative">
                    <img
                      src={story.cover_image}
                      alt="Cover preview"
                      className="h-40 w-full object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveImage}
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Category *
                  </label>
                  <select
                    value={story.category_id || ""}
                    onChange={(e) =>
                      setStory({ ...story, category_id: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Reading Time
                  </label>
                  <Input
                    value={story.reading_time || ""}
                    onChange={(e) =>
                      setStory({ ...story, reading_time: e.target.value })
                    }
                    placeholder="e.g., 5 min read"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Story Content */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Story Content *
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Full Story Content
                </label>
                <textarea
                  value={normalizeContent(story.content).body}
                  onChange={(e) =>
                    setStory({
                      ...story,
                      content: {
                        ...normalizeContent(story.content),
                        body: e.target.value,
                      },
                    })
                  }
                  placeholder="Write your story content here using Markdown syntax for headings, bold, italics, and lists."
                  rows={20}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-mono text-sm leading-relaxed"
                  style={{ minHeight: "400px" }}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Tip: Use Markdown headings like `## Did You Know?` and blank
                  lines for paragraphs.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Story Highlights (Optional)
                </label>
                <textarea
                  value={normalizeContent(story.content).highlights.join("\n")}
                  onChange={(e) =>
                    setStory({
                      ...story,
                      content: {
                        ...normalizeContent(story.content),
                        highlights: e.target.value
                          .split("\n")
                          .filter((h) => h.trim()),
                      },
                    })
                  }
                  placeholder="Key points or highlights (one per line)"
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Add 3-5 key highlights that will appear in the story preview
                </p>
              </div>
            </div>
          </Card>

          {/* SEO Section */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              SEO Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Meta Title
                </label>
                <Input
                  value={story.meta_title || ""}
                  onChange={(e) =>
                    setStory({ ...story, meta_title: e.target.value })
                  }
                  placeholder="Meta title for search engines"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Meta Description
                </label>
                <textarea
                  value={story.meta_description || ""}
                  onChange={(e) =>
                    setStory({ ...story, meta_description: e.target.value })
                  }
                  placeholder="Meta description for search engines"
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  SEO Keywords
                </label>
                <Input
                  value={story.seo_keywords || ""}
                  onChange={(e) =>
                    setStory({ ...story, seo_keywords: e.target.value })
                  }
                  placeholder="Comma-separated keywords"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Story Options */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Story Options
            </h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={story.is_featured || false}
                  onChange={(e) =>
                    setStory({ ...story, is_featured: e.target.checked })
                  }
                  className="w-4 h-4 rounded border border-input"
                />
                <span className="text-sm font-medium text-foreground">
                  🔥 Featured Story
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={story.is_trending || false}
                  onChange={(e) =>
                    setStory({ ...story, is_trending: e.target.checked })
                  }
                  className="w-4 h-4 rounded border border-input"
                />
                <span className="text-sm font-medium text-foreground">
                  📈 Trending Story
                </span>
              </label>
            </div>
          </Card>

          {/* Save Actions */}
          <Card className="p-6">
            <div className="space-y-3">
              <Button
                type="button"
                onClick={() => handleSave(true)}
                disabled={savingAction !== "idle"}
                variant="outline"
                className="w-full gap-2"
              >
                {savingAction === "draft" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Draft
              </Button>
              <Button
                type="button"
                onClick={() => handleSave(false)}
                disabled={savingAction !== "idle"}
                className="w-full gap-2"
              >
                {savingAction === "publish" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Publish
              </Button>
            </div>
          </Card>

          {/* Info Box */}
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-900">
                  Content Editor Available
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Use the large text area above to write your story content.
                  Rich text editor with formatting options coming in a future
                  update.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StoryEdit;
