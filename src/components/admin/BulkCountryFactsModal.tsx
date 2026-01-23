import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Check, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import logger from "@/lib/logger";

interface BulkCountryFactsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factTypes: FactType[];
  categories: Category[];
}

type ModalStep = "config" | "preview" | "saving";

interface BulkGeneratedFact {
  text: string;
  source: string;
  metadata?: Record<string, unknown>;
}

interface CountryFactsResult {
  country: string;
  facts: BulkGeneratedFact[];
  factCount: number;
  error?: string;
  selected?: boolean;
}

interface FactType {
  id: string;
  name: string;
}

interface Category {
  id: string | number;
  name: string;
}

interface Subcategory {
  id: string | number;
  name: string;
}

/**
 * Bulk Country Facts Generator Modal
 * Allows admin to generate multiple facts for all countries A-Z
 */
export const BulkCountryFactsModal: React.FC<BulkCountryFactsModalProps> = ({
  open,
  onOpenChange,
  factTypes,
  categories: allCategories,
}) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [step, setStep] = useState<ModalStep>("config");
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Config state
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [factsPerCountry, setFactsPerCountry] = useState(5);
  const [countryFactType, setCountryFactType] = useState("");

  // Preview state
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [bulkResults, setBulkResults] = useState<CountryFactsResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({
    current: 0,
    total: 0,
    currentCountry: "",
  });
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Get country facts type ID
  useEffect(() => {
    const countryFacts = factTypes.find((ft) =>
      ft.name?.toLowerCase().includes("country"),
    );
    if (countryFacts) {
      setCountryFactType(countryFacts.id);
    }
  }, [factTypes]);

  // Load admin user ID
  // Load subcategories when category changes
  useEffect(() => {
    if (!selectedCategoryId) {
      setSubcategories([]);
      setSelectedSubcategoryId("");
      setSelectedSubcategory("");
      return;
    }

    const loadSubcategories = async () => {
      try {
        const { data } = await supabase
          .from("subcategories")
          .select("*")
          .eq("category_id", selectedCategoryId)
          .order("name");
        setSubcategories(data || []);
      } catch (error: unknown) {
        logger.error("Failed to load subcategories:", error);
        setSubcategories([]);
      }
    };

    loadSubcategories();
  }, [selectedCategoryId]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SDK auth response
        const resp: any = await supabase.auth.getUser();
        const user = resp?.data?.user || null;
        if (mounted && user) setAdminUserId(user.id);
      } catch (_e: unknown) {
        logger.error("Failed to get admin user:", _e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Reset on modal close
  useEffect(() => {
    if (!open) {
      setStep("config");
      setBulkResults([]);
      setGenerationProgress({ current: 0, total: 0, currentCountry: "" });
    }
  }, [open]);

  const handleGenerate = async () => {
    // Validate input
    if (!selectedCategoryId) {
      toast({
        title: "Error",
        description: "Category is required",
        variant: "destructive",
      });
      return;
    }

    if (factsPerCountry < 1 || factsPerCountry > 20) {
      toast({
        title: "Error",
        description: "Facts per country must be between 1 and 20",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setStep("preview"); // Show preview immediately
    setBulkResults([]); // Clear previous results
    setGenerationProgress({ current: 0, total: 195, currentCountry: "" });

    // Create abort controller for this generation
    abortControllerRef.current = new AbortController();

    try {
      // Call bulk-generate-facts edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bulk-generate-facts`,
        {
          method: "POST",
          signal: abortControllerRef.current?.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${
              (await supabase.auth.getSession())?.data?.session?.access_token
            }`,
          },
          body: JSON.stringify({
            type: "country_facts",
            category: selectedCategory,
            category_id: selectedCategoryId,
            subcategory: selectedSubcategory || null,
            subcategory_id:
              selectedSubcategoryId && selectedSubcategoryId !== "none"
                ? selectedSubcategoryId
                : null,
            bulkMode: true,
            factsPerCountry: factsPerCountry,
            factTypeId: countryFactType,
            created_by: adminUserId,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(
          "[BulkModal] Response not OK:",
          response.status,
          errorText,
        );
        throw new Error(errorText || `Server error: ${response.status}`);
      }

      logger.debug("[BulkModal] Starting to stream results...");

      // Stream newline-delimited JSON results
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response body");

      let buffer = "";
      const results: CountryFactsResult[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          logger.debug("[BulkModal] Stream ended");
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const countryData = JSON.parse(line);
            const countryResult: CountryFactsResult = {
              ...countryData,
              selected: true,
            };
            results.push(countryResult);
            setBulkResults([...results]); // Update UI in real-time
            logger.debug(
              `[BulkModal] Added ${countryData.country}: ${countryData.factCount} facts`,
            );
            setGenerationProgress({
              current: results.length,
              total: 195,
              currentCountry: countryData.country,
            });
          } catch (e: unknown) {
            logger.error("Failed to parse result line:", line, e);
          }
        }
      }

      // Handle remaining buffer
      if (buffer.trim()) {
        try {
          const countryData = JSON.parse(buffer);
          const countryResult: CountryFactsResult = {
            ...countryData,
            selected: true,
          };
          results.push(countryResult);
          setBulkResults([...results]);
        } catch (e: unknown) {
          logger.error("Failed to parse final buffer:", buffer, e);
        }
      }

      const totalFacts = results.reduce((sum, r) => sum + r.factCount, 0);
      const processedCountries = results.filter((r) => !r.error).length;

      toast({
        title: "Generated",
        description: `${totalFacts} facts generated across ${processedCountries} countries. Review before saving.`,
      });
    } catch (error: unknown) {
      // Don't show error toast if user cancelled
      if (
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        String((error as { name?: unknown }).name) === "AbortError"
      ) {
        logger.info("Generation cancelled by user");
        toast({
          title: "Cancelled",
          description:
            "Generation was cancelled. Results so far are still available.",
        });
      } else {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: unknown }).message ?? "")
            : "Failed to generate facts";
        toast({
          title: "Generation Failed",
          description: message,
          variant: "destructive",
        });
        logger.error("Bulk generation error:", error);
      }
    } finally {
      setIsGenerating(false);
      setGenerationProgress({ current: 0, total: 0, currentCountry: "" });
    }
  };

  // Cancel generation
  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGenerating(false);
    setGenerationProgress({ current: 0, total: 0, currentCountry: "" });
  };

  const handleSaveBulk = async (publish: boolean) => {
    if (!adminUserId) {
      toast({
        title: "Error",
        description: "Not authenticated",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    setStep("saving");

    try {
      // Collect all selected facts
      const factsToInsert = [];

      for (const countryResult of bulkResults) {
        if (!countryResult.selected || !countryResult.facts) continue;

        for (const fact of countryResult.facts) {
          factsToInsert.push({
            fact_type_id: countryFactType || null,
            category_id: selectedCategoryId || null,
            subcategory_id:
              selectedSubcategoryId && selectedSubcategoryId !== "none"
                ? selectedSubcategoryId
                : null,
            country: countryResult.country,
            fact_text:
              (fact.text || "").toString().slice(0, 1000) ||
              JSON.stringify(fact),
            source: fact.source || "ai",
            status: publish ? "approved" : "draft",
            created_by: adminUserId,
            metadata: fact.metadata || {},
          });
        }
      }

      if (factsToInsert.length === 0) {
        toast({
          title: "Error",
          description: "No facts selected to save",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      // Insert in batches to avoid exceeding request limits
      const batchSize = 100;
      for (let i = 0; i < factsToInsert.length; i += batchSize) {
        const batch = factsToInsert.slice(i, i + batchSize);
        const { error } = await supabase.from("facts").insert(batch);

        if (error) throw error;
      }

      // Invalidate caches
      qc.invalidateQueries({ queryKey: ["admin", "facts"], exact: false });

      toast({
        title: publish ? "Published" : "Saved",
        description: `${factsToInsert.length} facts ${
          publish ? "published" : "saved as draft"
        }`,
      });

      onOpenChange(false);
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: unknown }).message ?? "")
          : "Failed to save facts";
      toast({
        title: "Save Failed",
        description: message,
        variant: "destructive",
      });
      logger.error("Bulk save error:", error);
      setStep("preview");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCountrySelection = (country: string) => {
    setBulkResults((prev) =>
      prev.map((r) =>
        r.country === country ? { ...r, selected: !r.selected } : r,
      ),
    );
  };

  const toggleAllSelection = (selected: boolean) => {
    setBulkResults((prev) => prev.map((r) => ({ ...r, selected })));
  };

  const selectedCount = bulkResults.filter((r) => r.selected).length;
  const selectedFactCount = bulkResults
    .filter((r) => r.selected)
    .reduce((sum, r) => sum + r.factCount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        {step === "config" ? (
          <>
            <DialogHeader>
              <DialogTitle>Generate Country Facts (Bulk)</DialogTitle>
              <DialogDescription>
                Generate facts for all countries A-Z in one operation
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Category - Required */}
              <div className="grid gap-2">
                <Label htmlFor="bulk-category">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedCategoryId}
                  onValueChange={(val) => {
                    setSelectedCategoryId(val);
                    const cat = allCategories.find((c) => String(c.id) === val);
                    setSelectedCategory(cat?.name || "");
                  }}
                >
                  <SelectTrigger id="bulk-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subcategory - Optional */}
              {selectedCategoryId && (
                <div className="grid gap-2">
                  <Label htmlFor="bulk-subcategory">
                    Subcategory{" "}
                    <span className="text-gray-400">(Optional)</span>
                  </Label>
                  <Select
                    value={selectedSubcategoryId}
                    onValueChange={(val) => {
                      setSelectedSubcategoryId(val);
                      if (val === "none") {
                        setSelectedSubcategory("");
                      } else {
                        const subcat = subcategories.find(
                          (s) => String(s.id) === val,
                        );
                        setSelectedSubcategory(subcat?.name || "");
                      }
                    }}
                  >
                    <SelectTrigger id="bulk-subcategory">
                      <SelectValue placeholder="No subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No subcategory</SelectItem>
                      {subcategories.map((sub) => (
                        <SelectItem key={sub.id} value={String(sub.id)}>
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Facts per country */}
              <div className="grid gap-2">
                <Label htmlFor="bulk-facts-count">Facts Per Country</Label>
                <Input
                  id="bulk-facts-count"
                  type="number"
                  min="1"
                  max="20"
                  value={factsPerCountry}
                  onChange={(e) =>
                    setFactsPerCountry(
                      Math.max(1, Math.min(20, Number(e.target.value) || 1)),
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  1-20 per country
                </p>
              </div>

              {/* Info box */}
              <Card className="p-3 bg-blue-50 border-blue-200">
                <p className="text-sm text-blue-900">
                  ℹ️ This will generate ~{factsPerCountry * 195} facts total
                  across 195 countries. Generation will take a few minutes.
                </p>
              </Card>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              {bulkResults.length > 0 && (
                <Button
                  variant="secondary"
                  onClick={() => setStep("preview")}
                  disabled={isGenerating}
                >
                  📋 View Preview ({bulkResults.length})
                </Button>
              )}
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Start Generation"
                )}
              </Button>
            </DialogFooter>
          </>
        ) : step === "preview" ? (
          <>
            <DialogHeader>
              <DialogTitle>
                Preview Generated Facts ({selectedCount} countries selected)
              </DialogTitle>
              <DialogDescription>
                {isGenerating
                  ? `Generating... ${generationProgress.current}/${generationProgress.total} countries (${generationProgress.currentCountry})`
                  : `${selectedFactCount} facts ready to save`}
              </DialogDescription>
            </DialogHeader>

            {/* Progress indicator while generating */}
            {isGenerating && (
              <div className="space-y-2 py-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">
                    {generationProgress.current}/{generationProgress.total}{" "}
                    countries
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        generationProgress.total > 0
                          ? (generationProgress.current /
                              generationProgress.total) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Selection controls */}
            <div className="flex gap-2 py-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleAllSelection(true)}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleAllSelection(false)}
              >
                Deselect All
              </Button>
            </div>

            {/* Facts preview - scrollable */}
            <div className="space-y-2 py-4 max-h-[400px] overflow-y-auto">
              {bulkResults.map((countryResult) => (
                <Card
                  key={countryResult.country}
                  className={`p-3 cursor-pointer transition ${
                    countryResult.selected
                      ? "border-green-500 bg-green-50"
                      : "border-muted bg-muted/30"
                  }`}
                  onClick={() => toggleCountrySelection(countryResult.country)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={countryResult.selected || false}
                      onCheckedChange={(checked) => {
                        if (checked !== countryResult.selected) {
                          toggleCountrySelection(countryResult.country);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{countryResult.country}</p>
                        {countryResult.error ? (
                          <X className="w-4 h-4 text-red-500" />
                        ) : (
                          <Check className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      {countryResult.error ? (
                        <p className="text-xs text-red-600">
                          Error: {countryResult.error}
                        </p>
                      ) : (
                        <>
                          <p className="text-xs text-muted-foreground">
                            {countryResult.factCount} facts
                          </p>
                          <div className="mt-2 space-y-1">
                            {countryResult.facts
                              .slice(0, 2)
                              .map((fact, idx) => (
                                <p key={idx} className="text-xs text-gray-700">
                                  • {fact.text.substring(0, 100)}...
                                </p>
                              ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <DialogFooter>
              {isGenerating ? (
                <Button variant="destructive" onClick={handleCancel}>
                  Cancel Generation
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep("config");
                    }}
                    disabled={isSaving}
                  >
                    ← Back to Settings
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleSaveBulk(false)}
                      disabled={isSaving || selectedCount === 0}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "💾 Save as Draft"
                      )}
                    </Button>
                    <Button
                      onClick={() => handleSaveBulk(true)}
                      disabled={isSaving || selectedCount === 0}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        "✅ Publish"
                      )}
                    </Button>
                  </div>
                </>
              )}
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Saving Facts...</DialogTitle>
            </DialogHeader>
            <div className="py-8 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Inserting {selectedFactCount} facts into database...
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
