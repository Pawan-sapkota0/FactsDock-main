import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  fetchSettings,
  saveSettings,
  Settings,
  DEFAULT_SETTINGS,
} from "@/lib/settings-api";
import { Settings as SettingsIcon, Save, AlertCircle } from "lucide-react";

interface FormState extends Settings {
  hasChanges: boolean;
}

const SettingsAdmin: React.FC = () => {
  const { toast } = useToast();
  const [formState, setFormState] = useState<FormState>({
    ...DEFAULT_SETTINGS,
    hasChanges: false,
  });

  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Fetch settings on mount
  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: fetchSettings,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  useEffect(() => {
    if (settings) {
      setFormState({ ...settings, hasChanges: false });
    }
  }, [settings]);

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async (newSettings: Partial<Settings>) => {
      return await saveSettings(newSettings);
    },
    onSuccess: (data) => {
      setFormState({ ...data, hasChanges: false });
      setUnsavedChanges(false);
      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
      // Dispatch event for frontend to reload settings
      window.dispatchEvent(new Event("wf:settings-updated"));
    },
    onError: (error: unknown) => {
      const e = error as Record<string, unknown> | undefined;
      const message =
        (e && (e.message as string)) ||
        String(error || "Failed to save settings");
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: keyof Settings, value: unknown) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
      hasChanges: true,
    }));
    setUnsavedChanges(true);
  };

  const handleToggle = (field: keyof Settings) => {
    setFormState((prev) => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev],
      hasChanges: true,
    }));
    setUnsavedChanges(true);
  };

  const handleSave = () => {
    if (!formState.website_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Website name is required",
        variant: "destructive",
      });
      return;
    }

    // Create update object with only changed fields
    const updates: Partial<Settings> = {};
    if (settings) {
      (Object.keys(formState) as Array<keyof FormState>).forEach((key) => {
        if (
          key !== "hasChanges" &&
          formState[key] !== settings[key as keyof Settings]
        ) {
          (updates as Record<string, unknown>)[String(key)] = formState[
            key
          ] as unknown;
        }
      });
    }

    if (Object.keys(updates).length === 0) {
      toast({
        title: "No Changes",
        description: "No settings were modified",
      });
      return;
    }

    saveMutation.mutate(updates);
  };

  const handleReset = () => {
    if (settings) {
      setFormState({ ...settings, hasChanges: false });
      setUnsavedChanges(false);
      toast({
        title: "Reset",
        description: "Changes discarded",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage global website configuration
          </p>
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {unsavedChanges && (
        <div className="flex items-center gap-3 bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              You have unsaved changes
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              Click "Save Changes" to apply your modifications
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure basic website information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Website Name */}
              <div className="space-y-2">
                <Label htmlFor="website_name" className="font-medium">
                  Website Name
                </Label>
                <Input
                  id="website_name"
                  value={formState.website_name}
                  onChange={(e) =>
                    handleInputChange("website_name", e.target.value)
                  }
                  placeholder="World Facts"
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  Used in page titles and header
                </p>
              </div>

              {/* Tagline */}
              <div className="space-y-2">
                <Label htmlFor="website_tagline" className="font-medium">
                  Website Tagline
                </Label>
                <Input
                  id="website_tagline"
                  value={formState.website_tagline}
                  onChange={(e) =>
                    handleInputChange("website_tagline", e.target.value)
                  }
                  placeholder="Discover amazing facts from around the world"
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  Short description displayed with the website name
                </p>
              </div>

              {/* Language & Timezone */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default_language" className="font-medium">
                    Default Language
                  </Label>
                  <Input
                    id="default_language"
                    value={formState.default_language}
                    onChange={(e) =>
                      handleInputChange("default_language", e.target.value)
                    }
                    placeholder="en"
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default_timezone" className="font-medium">
                    Default Timezone
                  </Label>
                  <Input
                    id="default_timezone"
                    value={formState.default_timezone}
                    onChange={(e) =>
                      handleInputChange("default_timezone", e.target.value)
                    }
                    placeholder="UTC"
                    className="bg-background"
                  />
                </div>
              </div>

              {/* Items Per Page */}
              <div className="space-y-2">
                <Label htmlFor="items_per_page" className="font-medium">
                  Items Per Page
                </Label>
                <Input
                  id="items_per_page"
                  type="number"
                  value={formState.items_per_page}
                  onChange={(e) =>
                    handleInputChange(
                      "items_per_page",
                      parseInt(e.target.value),
                    )
                  }
                  min="1"
                  max="100"
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  Default pagination size for lists
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Settings */}
        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>
                Configure search engine optimization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Meta Title */}
              <div className="space-y-2">
                <Label htmlFor="meta_title" className="font-medium">
                  Meta Title
                </Label>
                <Input
                  id="meta_title"
                  value={formState.meta_title}
                  onChange={(e) =>
                    handleInputChange("meta_title", e.target.value)
                  }
                  placeholder="World Facts - Discover Amazing Facts"
                  maxLength={60}
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  Max 60 characters. Appears in search results.
                </p>
              </div>

              {/* Meta Description */}
              <div className="space-y-2">
                <Label htmlFor="meta_description" className="font-medium">
                  Meta Description
                </Label>
                <textarea
                  id="meta_description"
                  value={formState.meta_description}
                  onChange={(e) =>
                    handleInputChange("meta_description", e.target.value)
                  }
                  placeholder="Explore interesting facts about countries, history, science, and more"
                  maxLength={160}
                  rows={3}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Max 160 characters. Search engines show this snippet.
                </p>
              </div>

              {/* Meta Keywords */}
              <div className="space-y-2">
                <Label htmlFor="meta_keywords" className="font-medium">
                  Meta Keywords
                </Label>
                <Input
                  id="meta_keywords"
                  value={formState.meta_keywords}
                  onChange={(e) =>
                    handleInputChange("meta_keywords", e.target.value)
                  }
                  placeholder="facts, world, education, countries"
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated keywords (has less impact on modern SEO)
                </p>
              </div>

              {/* OG Image */}
              <div className="space-y-2">
                <Label htmlFor="og_image_url" className="font-medium">
                  Open Graph Image URL
                </Label>
                <Input
                  id="og_image_url"
                  value={formState.og_image_url || ""}
                  onChange={(e) =>
                    handleInputChange("og_image_url", e.target.value)
                  }
                  placeholder="https://example.com/og-image.jpg"
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  Image shown when sharing on social media
                </p>
              </div>

              {/* Indexing Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Allow Search Engine Indexing</p>
                  <p className="text-sm text-muted-foreground">
                    Let search engines index and crawl your site
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("allow_indexing")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formState.allow_indexing ? "bg-primary" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formState.allow_indexing
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Settings */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Settings</CardTitle>
              <CardDescription>
                Configure content display and features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Facts Per Page */}
              <div className="space-y-2">
                <Label htmlFor="facts_per_page" className="font-medium">
                  Facts Per Page
                </Label>
                <Input
                  id="facts_per_page"
                  type="number"
                  value={formState.facts_per_page}
                  onChange={(e) =>
                    handleInputChange(
                      "facts_per_page",
                      parseInt(e.target.value),
                    )
                  }
                  min="1"
                  max="50"
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  Number of facts displayed per page in pagination
                </p>
              </div>

              {/* Quiz Questions Limit */}
              <div className="space-y-2">
                <Label htmlFor="quiz_questions_limit" className="font-medium">
                  Quiz Questions Limit
                </Label>
                <Input
                  id="quiz_questions_limit"
                  type="number"
                  value={formState.quiz_questions_limit}
                  onChange={(e) =>
                    handleInputChange(
                      "quiz_questions_limit",
                      parseInt(e.target.value),
                    )
                  }
                  min="1"
                  max="100"
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  Default maximum questions per quiz
                </p>
              </div>

              {/* Enable Random Quiz */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Enable Random Quiz</p>
                  <p className="text-sm text-muted-foreground">
                    Allow users to take quizzes with random questions
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("enable_random_quiz")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formState.enable_random_quiz ? "bg-primary" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formState.enable_random_quiz
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Enable Country Quiz */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Enable Country-wise Quiz</p>
                  <p className="text-sm text-muted-foreground">
                    Allow users to take quizzes for specific countries
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("enable_country_quiz")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formState.enable_country_quiz ? "bg-primary" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formState.enable_country_quiz
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Settings */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Settings</CardTitle>
              <CardDescription>
                Optimize website performance and loading
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Skeleton Loading */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Enable Skeleton Loading</p>
                  <p className="text-sm text-muted-foreground">
                    Show skeleton placeholders while content loads
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("enable_skeleton_loading")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formState.enable_skeleton_loading
                      ? "bg-primary"
                      : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formState.enable_skeleton_loading
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Enable Pagination</p>
                  <p className="text-sm text-muted-foreground">
                    Split content into pages for better performance
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("enable_pagination")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formState.enable_pagination ? "bg-primary" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formState.enable_pagination
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Lazy Loading */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Enable Lazy Loading</p>
                  <p className="text-sm text-muted-foreground">
                    Load images only when visible in viewport
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("enable_lazy_loading")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formState.enable_lazy_loading ? "bg-primary" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formState.enable_lazy_loading
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security & Access */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security & Access</CardTitle>
              <CardDescription>
                Manage security and content approval
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Admin Email */}
              <div className="space-y-2">
                <Label htmlFor="admin_email" className="font-medium">
                  Admin Email
                </Label>
                <Input
                  id="admin_email"
                  type="email"
                  value={formState.admin_email || ""}
                  onChange={(e) =>
                    handleInputChange("admin_email", e.target.value)
                  }
                  placeholder="admin@example.com"
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  Receive admin notifications and alerts
                </p>
              </div>

              {/* Maintenance Mode */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Maintenance Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Take site offline for maintenance
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("maintenance_mode")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formState.maintenance_mode ? "bg-red-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formState.maintenance_mode
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Content Approval Required */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Content Approval Required</p>
                  <p className="text-sm text-muted-foreground">
                    Require approval before publishing new content
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("content_approval_required")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formState.content_approval_required
                      ? "bg-primary"
                      : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formState.content_approval_required
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sticky Footer with Actions */}
      <div className="sticky bottom-0 bg-background border-t border-border p-4 flex gap-3 justify-end">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={!unsavedChanges || saveMutation.isPending}
        >
          Discard Changes
        </Button>
        <Button
          onClick={handleSave}
          disabled={!unsavedChanges || saveMutation.isPending}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default SettingsAdmin;
