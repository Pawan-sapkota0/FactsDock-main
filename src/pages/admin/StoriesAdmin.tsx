import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  Search,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { storiesAPI, Story } from "@/lib/stories-api";
import logger from "@/lib/logger";

const StoriesAdmin: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "draft" | "published"
  >("all");

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await storiesAPI.getAllStories();
      setStories(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load stories";
      setError(message);
      logger.error("[StoriesAdmin] Failed to load stories", error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this story?")) return;

    try {
      await storiesAPI.deleteStory(id);
      setStories(stories.filter((s) => s.id !== id));
      toast({
        title: "Success",
        description: "Story deleted successfully",
      });
    } catch (error) {
      logger.error("[StoriesAdmin] Failed to delete story", error);
      toast({
        title: "Error",
        description: "Failed to delete story",
        variant: "destructive",
      });
    }
  };

  const handlePublish = async (
    id: string,
    newStatus: "published" | "draft",
  ) => {
    try {
      await storiesAPI.publishStory(id, newStatus);
      setStories(
        stories.map((s) => (s.id === id ? { ...s, status: newStatus } : s)),
      );
      toast({
        title: "Success",
        description: `Story ${newStatus}`,
      });
    } catch (error) {
      logger.error("[StoriesAdmin] Failed to update story status", error);
      toast({
        title: "Error",
        description: "Failed to update story status",
        variant: "destructive",
      });
    }
  };

  const filteredStories = stories.filter((story) => {
    const matchesSearch =
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || story.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Stories</h1>
          <p className="text-muted-foreground mt-1">Manage all stories</p>
        </div>
        <Button
          onClick={() => navigate("/admin/stories/new")}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          New Story
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2 rounded-lg border border-input bg-background text-foreground"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      {/* Stories Table */}
      {error ? (
        <Card className="p-8 text-center border-destructive/30 bg-destructive/5">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
          <p className="text-lg font-semibold text-foreground">
            Unable to load stories
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </Card>
      ) : filteredStories.length === 0 ? (
        <Card className="p-8 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No stories found</p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Featured
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredStories.map((story) => (
                <tr
                  key={story.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={story.cover_image}
                        alt={story.title}
                        className="h-10 w-10 rounded object-cover"
                      />
                      <div>
                        <p className="font-medium text-foreground">
                          {story.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {story.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-foreground">
                      {story.story_categories?.name || "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        story.status === "published"
                          ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300"
                      }`}
                    >
                      {story.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {story.is_featured ? (
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">
                        🔥 Featured
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-foreground">
                      {story.views}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">
                      {new Date(story.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          navigate(`/admin/stories/${story.id}/edit`)
                        }
                        title="Edit story"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          window.open(`/stories/${story.slug}`, "_blank")
                        }
                        title="Preview story"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={
                          story.status === "published" ? "outline" : "secondary"
                        }
                        size="icon"
                        onClick={() =>
                          handlePublish(
                            story.id,
                            story.status === "published"
                              ? "draft"
                              : "published",
                          )
                        }
                        title={
                          story.status === "published"
                            ? "Unpublish story"
                            : "Publish story"
                        }
                      >
                        <span className="sr-only">
                          {story.status === "published"
                            ? "Unpublish"
                            : "Publish"}
                        </span>
                        <span className="text-xs">
                          {story.status === "published"
                            ? "Unpublish"
                            : "Publish"}
                        </span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(story.id)}
                        title="Delete story"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StoriesAdmin;
