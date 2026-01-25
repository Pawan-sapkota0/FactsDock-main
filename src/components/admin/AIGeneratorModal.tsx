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
import logger from "@/lib/logger";
import { supabase } from "@/integrations/supabase/client";
import { generateQuizWithGemini } from "@/lib/gemini-quiz";
import { generateQuizzesWithUniqueness } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

interface AIGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factTypes: FactType[];
  onAcceptQuestions: (questions: GeneratedQuestion[]) => void;
  isLoading?: boolean;
}

interface FactType {
  id: string;
  name: string;
}

interface GeneratedQuestion {
  question: string;
  q?: string;
  options: string[];
  correct_answer?: string;
  correctAnswer?: number;
  difficulty?: string;
}

type ModalStep = "config" | "preview";

type UniquenessReport = {
  totalGenerated?: number;
  uniqueCount?: number;
  duplicateCount?: number;
  duplicates?: Array<{
    text: string;
    duplicateCount: number;
    matches: Array<{ similarity: number; text: string }>;
  }>;
  timestamp?: string;
};

/**
 * AI Generator Modal for quiz creation with preview
 *
 * Step 1: Config - User selects parameters
 * Step 2: Preview - AI-generated questions shown for review before accepting
 */
export const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({
  open,
  onOpenChange,
  factTypes,
  onAcceptQuestions,
  isLoading = false,
}) => {
  const { toast } = useToast();
  const [step, setStep] = useState<ModalStep>("config");

  // Config step state
  const [selectedFactTypeId, setSelectedFactTypeId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [questionCount, setQuestionCount] = useState(5);
  const [isRandom, setIsRandom] = useState(false);
  const [categories, setCategories] = useState<FactType[]>([]);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState("");
  const [subcategories, setSubcategories] = useState<FactType[]>([]);

  // Preview step state
  const [generatedQuestions, setGeneratedQuestions] = useState<
    GeneratedQuestion[]
  >([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uniquenessReport, setUniquenessReport] =
    useState<UniquenessReport | null>(null);
  const qc = useQueryClient();
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  // Load categories when fact type changes
  useEffect(() => {
    if (!selectedFactTypeId) {
      setCategories([]);
      setSubcategories([]);
      setSelectedCategoryId("");
      setSelectedSubcategoryId("");
      return;
    }

    const loadCategories = async () => {
      try {
        const { data } = await supabase
          .from("categories")
          .select("*")
          .eq("fact_type_id", selectedFactTypeId)
          .order("name");
        setCategories(data || []);
        setSubcategories([]);
        setSelectedSubcategoryId("");
      } catch (error) {
        logger.error("Failed to load categories:", error);
        setCategories([]);
        setSubcategories([]);
      }
    };

    loadCategories();
  }, [selectedFactTypeId]);

  // Load subcategories when category changes
  useEffect(() => {
    if (!selectedCategoryId) {
      setSubcategories([]);
      setSelectedSubcategoryId("");
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
        setSelectedSubcategoryId("");
      } catch (error) {
        logger.error("Failed to load subcategories:", error);
        setSubcategories([]);
      }
    };

    loadSubcategories();
  }, [selectedCategoryId]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setStep("config");
      setSelectedFactTypeId("");
      setSelectedCategoryId("");
      setSelectedSubcategoryId("");
      setSelectedCountry("");
      setDifficulty("medium");
      setQuestionCount(5);
      setIsRandom(false);
      setCategories([]);
      setSubcategories([]);
      setGeneratedQuestions([]);
    }
  }, [open]);

  // load admin user id
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // SDK boundary: narrow with an inline cast to access user. Keep minimal runtime change.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SDK auth response
        const resp: any = await supabase.auth.getUser();
        const user = resp?.data?.user || null;
        if (mounted && user) setAdminUserId(user.id);
      } catch (_e: unknown) {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleFactTypeChange = (typeId: string) => {
    setSelectedFactTypeId(typeId);
    setSelectedCategoryId("none");
  };

  const handleGenerate = async () => {
    // Validate
    if (!isRandom && !selectedFactTypeId) {
      toast({
        title: "Error",
        description: "Fact Type is required",
        variant: "destructive",
      });
      return;
    }

    if (questionCount < 1 || questionCount > 50) {
      toast({
        title: "Error",
        description: "Question count must be between 1 and 50",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Get fact type name
      const selectedFactType = factTypes.find(
        (ft) => ft.id === selectedFactTypeId,
      );
      const factTypeName = selectedFactType?.name || "Unknown";

      // Get category name if selected
      const selectedCategory = categories.find(
        (c) => c.id === selectedCategoryId,
      );
      const categoryName = selectedCategory?.name;

      // Get subcategory name if selected
      const selectedSubcategory = subcategories.find(
        (s) => s.id === selectedSubcategoryId,
      );
      const subcategoryName = selectedSubcategory?.name;

      // Call API to generate questions with uniqueness checking
      const result = await generateQuizzesWithUniqueness({
        factTypeId: selectedFactTypeId,
        factTypeName,
        categoryId: selectedCategoryId || undefined,
        categoryName,
        subcategoryId: selectedSubcategoryId || undefined,
        subcategoryName,
        country: selectedCountry || undefined,
        difficulty,
        questionCount,
      });

      if (result.quizzes.length === 0) {
        toast({
          title: "Error",
          description: "No questions generated",
          variant: "destructive",
        });
        return;
      }

      setGeneratedQuestions(result.quizzes as GeneratedQuestion[]);
      setUniquenessReport(result.uniquenessReport);
      setStep("preview");

      toast({
        title: "Generated",
        description: `${result.quizzes.length} questions generated. Review before accepting.`,
      });
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: unknown }).message ?? "")
          : "Failed to generate questions";
      toast({
        title: "Generation Failed",
        description: message,
        variant: "destructive",
      });
      logger.error("Generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save random quizzes to DB with is_random = true
  const saveRandomQuizzes = async (publish: boolean) => {
    if (!adminUserId) {
      toast({
        title: "Error",
        description: "Not authenticated",
        variant: "destructive",
      });
      return;
    }
    if (!generatedQuestions || !generatedQuestions.length) {
      toast({
        title: "Error",
        description: "No generated questions to save",
        variant: "destructive",
      });
      return;
    }
    try {
      // Create individual quiz entries for each generated question set
      const payload = generatedQuestions.map((g: GeneratedQuestion) => {
        // Handle correctAnswer - could be number (index) or string (text)
        let correctAnswerText = g.correct_answer || "";
        if (!correctAnswerText && g.correctAnswer !== undefined) {
          const answerIndex = g.correctAnswer;
          if (
            typeof answerIndex === "number" &&
            g.options &&
            g.options[answerIndex]
          ) {
            correctAnswerText = g.options[answerIndex];
          }
        }

        const questionObj = {
          question: g.question || g.q || "",
          options: g.options || [],
          correct_answer: correctAnswerText,
        };
        return {
          questions: [questionObj],
          fact_type_id: null,
          category_id: null,
          country: null,
          difficulty: g.difficulty || difficulty,
          status: publish ? "approved" : "draft",
          created_by: adminUserId,
          is_random: true,
          ai_generated: true,
        };
      });

      const { data, error } = await supabase
        .from("quizzes")
        .insert(payload)
        .select("id, questions");
      if (error) throw error;
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error("Failed to save quizzes - no data returned");
      }
      qc.invalidateQueries({ queryKey: ["admin", "quizzes"] });
      toast({
        title: publish ? "Published" : "Saved",
        description: publish
          ? `${data.length} random quiz(zes) published.`
          : `${data.length} random quiz(zes) saved as draft.`,
      });
      onOpenChange(false);
    } catch (e: unknown) {
      const message =
        e && typeof e === "object" && "message" in e
          ? String((e as { message?: unknown }).message ?? "")
          : "Save failed";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleAccept = () => {
    onAcceptQuestions(generatedQuestions);
    onOpenChange(false);
    toast({
      title: "Success",
      description: `${generatedQuestions.length} questions added to quiz`,
    });
  };

  const handleReject = () => {
    setStep("config");
    setGeneratedQuestions([]);
    setUniquenessReport(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        {step === "config" ? (
          <>
            <DialogHeader>
              <DialogTitle>Generate Quiz with AI</DialogTitle>
              <DialogDescription>
                Configure quiz generation settings
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Random Toggle */}
              <div className="flex items-center gap-2 p-3 rounded border border-muted">
                <Checkbox
                  id="random"
                  checked={isRandom}
                  onCheckedChange={(checked) => setIsRandom(checked as boolean)}
                />
                <Label
                  htmlFor="random"
                  className="text-sm font-medium cursor-pointer flex-1"
                >
                  Generate Random Quiz
                </Label>
              </div>

              {/* Fact Type */}
              <div className="grid gap-2">
                <Label htmlFor="fact-type">
                  Fact Type{" "}
                  {!isRandom && <span className="text-red-500">*</span>}
                </Label>
                <Select
                  value={selectedFactTypeId}
                  onValueChange={handleFactTypeChange}
                  disabled={isRandom}
                >
                  <SelectTrigger id="fact-type">
                    <SelectValue placeholder="Select a fact type" />
                  </SelectTrigger>
                  <SelectContent>
                    {factTypes.map((ft) => (
                      <SelectItem key={ft.id} value={ft.id}>
                        {ft.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              {!isRandom && selectedFactTypeId && (
                <div className="grid gap-2">
                  <Label htmlFor="category">Category (optional)</Label>
                  <Select
                    value={selectedCategoryId || "none"}
                    onValueChange={(val) =>
                      setSelectedCategoryId(val === "none" ? "" : val)
                    }
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No category</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Subcategory */}
              {!isRandom && selectedCategoryId && (
                <div className="grid gap-2">
                  <Label htmlFor="subcategory">Subcategory (optional)</Label>
                  <Select
                    value={selectedSubcategoryId || "none"}
                    onValueChange={(val) =>
                      setSelectedSubcategoryId(val === "none" ? "" : val)
                    }
                  >
                    <SelectTrigger id="subcategory">
                      <SelectValue placeholder="Select a subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No subcategory</SelectItem>
                      {subcategories.map((subcat) => (
                        <SelectItem key={subcat.id} value={subcat.id}>
                          {subcat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Country */}
              {!isRandom && (
                <div className="grid gap-2">
                  <Label htmlFor="country">Country (optional)</Label>
                  <Input
                    id="country"
                    placeholder="e.g., France, Japan"
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                  />
                </div>
              )}

              {/* Difficulty */}
              <div className="grid gap-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger id="difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Question Count */}
              <div className="grid gap-2">
                <Label htmlFor="question-count">Number of Questions</Label>
                <Input
                  id="question-count"
                  type="number"
                  min="1"
                  max="50"
                  value={questionCount}
                  onChange={(e) =>
                    setQuestionCount(
                      Math.max(1, Math.min(50, Number(e.target.value) || 1)),
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">1-50 questions</p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isGenerating || isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || isLoading}
              >
                {isGenerating ? "Generating..." : "Generate & Preview"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Review Generated Questions</DialogTitle>
              <DialogDescription>
                {generatedQuestions.length} questions generated. Review and
                accept or go back to adjust settings.
              </DialogDescription>
            </DialogHeader>

            {/* Uniqueness Report */}
            {uniquenessReport && (
              <div className="space-y-2">
                <Card
                  className={`p-3 ${uniquenessReport.duplicateCount > 0 ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-600" : "border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-600"}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className={`font-semibold text-sm ${uniquenessReport.duplicateCount > 0 ? "text-yellow-900 dark:text-yellow-300" : "text-green-900 dark:text-green-300"}`}
                      >
                        {uniquenessReport.duplicateCount > 0
                          ? `⚠️ ${uniquenessReport.duplicateCount} Duplicate(s) Found`
                          : "✓ All Questions are Unique"}
                      </p>
                      <p className="text-xs text-muted-foreground dark:text-gray-300">
                        Generated: {uniquenessReport.totalGenerated}, Unique:{" "}
                        {uniquenessReport.uniqueCount}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Show duplicate details if any */}
                {uniquenessReport.duplicates &&
                  uniquenessReport.duplicates.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold dark:text-gray-300">
                        Duplicate Questions:
                      </p>
                      {uniquenessReport.duplicates.map((dup, idx) => (
                        <Card
                          key={idx}
                          className="p-3 border-orange-300 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-600"
                        >
                          <p className="text-xs font-semibold text-orange-900 dark:text-orange-300">
                            {dup.text?.substring(0, 50)}...
                          </p>
                          {dup.matches && dup.matches.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {dup.matches.map((match, mIdx) => (
                                <div key={mIdx}>
                                  <p className="text-xs text-orange-800 dark:text-orange-200">
                                    Matches: {match.text?.substring(0, 50)}...
                                  </p>
                                  <p className="text-xs text-orange-700 mt-0.5">
                                    Similarity:{" "}
                                    {(match.similarity * 100).toFixed(1)}%
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
              </div>
            )}

            <div className="space-y-3 py-4 max-h-[400px] overflow-y-auto">
              {generatedQuestions.map((q, idx) => (
                <Card key={idx} className="p-4">
                  <div className="mb-3">
                    <p className="font-semibold text-sm">
                      Q{idx + 1}: {q.question}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Difficulty: {q.difficulty}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {q.options.map((option: string, oi: number) => (
                      <div
                        key={oi}
                        className={`text-sm p-2 rounded ${
                          option === q.correct_answer
                            ? "bg-green-100 text-green-900 font-semibold"
                            : "bg-muted"
                        }`}
                      >
                        {option}
                        {option === q.correct_answer && " ✓"}
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleReject}
                disabled={isGenerating}
              >
                ← Back to Settings
              </Button>
              {isRandom ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => saveRandomQuizzes(false)}
                    disabled={isGenerating}
                  >
                    💾 Save Draft
                  </Button>
                  <Button
                    onClick={() => saveRandomQuizzes(true)}
                    disabled={isGenerating}
                  >
                    ✅ Publish
                  </Button>
                </div>
              ) : (
                <Button onClick={handleAccept} disabled={isGenerating}>
                  ✓ Accept These Questions
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
