/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { AIGeneratorModal } from "@/components/admin/AIGeneratorModal";

// Dynamic loader for DnD builder with fallback to static UI
function DynamicQuizBuilder(props: any) {
  const { questions, setQuestions, setQuestionsJson } = props;
  const [Comp, setComp] = React.useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod = await import("./QuizBuilderDnd");
        if (mounted && mod && mod.default) setComp(() => mod.default);
      } catch (e) {
        console.warn(
          "Failed to load QuizBuilderDnd, falling back to static builder",
          e
        );
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (Comp)
    return (
      <Comp
        questions={questions}
        setQuestions={setQuestions}
        setQuestionsJson={setQuestionsJson}
      />
    );
  return (
    <div className="space-y-3">
      {questions.map((qq: any, qi: number) => (
        <StaticQuestion
          key={qq.id || qq._localId || qi}
          qi={qi}
          qq={qq}
          questions={questions}
          setQuestions={setQuestions}
          setQuestionsJson={setQuestionsJson}
        />
      ))}
    </div>
  );
}

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallbackRender?: () => React.ReactNode;
};

type ErrorBoundaryState = { hasError: boolean };

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    console.error("ErrorBoundary caught", error);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallbackRender ? this.props.fallbackRender() : null;
    }
    return this.props.children;
  }
}

// Helper to move array elements
function arrayMoveLocal(arr: any[], from: number, to: number) {
  const copy = arr.slice();
  if (from < 0 || from >= copy.length || to < 0 || to >= copy.length)
    return copy;
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

// Static (non-draggable) question card with up/down buttons
function StaticQuestion({
  qi,
  qq,
  questions,
  setQuestions,
  setQuestionsJson,
}: any) {
  const updateQuestion = (updater: (q: any) => void) => {
    const copy = [...questions];
    updater(copy[qi]);
    setQuestions(copy);
    setQuestionsJson(JSON.stringify(copy, null, 2));
  };

  const qText = qq.question || qq.q || "";
  const opts = qq.options || [];
  const correct = qq.correct_answer || null;

  return (
    <div className="p-3 border rounded">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="text-sm font-semibold mb-2">
            Q{qi + 1}: {qText.substring(0, 60)}...
          </div>
          <div className="text-xs text-muted-foreground">
            {opts.length} options | Correct:{" "}
            {typeof correct === "string" ? correct.substring(0, 40) : "Not set"}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (qi > 0) {
                const copy = arrayMoveLocal(questions, qi, qi - 1);
                setQuestions(copy);
                setQuestionsJson(JSON.stringify(copy, null, 2));
              }
            }}
          >
            ↑
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (qi < questions.length - 1) {
                const copy = arrayMoveLocal(questions, qi, qi + 1);
                setQuestions(copy);
                setQuestionsJson(JSON.stringify(copy, null, 2));
              }
            }}
          >
            ↓
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              const copy = [...questions];
              copy.splice(qi, 1);
              setQuestions(copy);
              setQuestionsJson(JSON.stringify(copy, null, 2));
            }}
          >
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}

const QuizEdit: React.FC = () => {
  const { id: editId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();

  // Manual quiz form state
  const [factTypeId, setFactTypeId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [country, setCountry] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionsJson, setQuestionsJson] = useState("[]");
  const [status, setStatus] = useState<string>("draft");
  const [saving, setSaving] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  // AI Generator Modal state
  const [aiGeneratorOpen, setAiGeneratorOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Queries
  const quizQ = useQuery({
    queryKey: ["admin", "quiz", editId],
    queryFn: async () => {
      if (!editId) return null;
      const { data } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", editId)
        .single();
      return data || null;
    },
    enabled: !!editId,
  });

  const factTypesQ = useQuery({
    queryKey: ["admin", "fact_types"],
    queryFn: async () => {
      const { data } = await supabase
        .from("fact_types")
        .select("*")
        .order("name");
      return data || [];
    },
  });
  const factTypes = (factTypesQ?.data as any) || [];

  const categoriesByFactTypeQ = useQuery({
    queryKey: ["admin", "categories", "byFactTypeForSave", factTypeId],
    queryFn: async () => {
      if (!factTypeId) return [];
      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("fact_type_id", factTypeId)
        .order("name");
      return data || [];
    },
    enabled: !!factTypeId,
  });
  const categories = (categoriesByFactTypeQ?.data as any) || [];

  // Load quiz data when editing
  useEffect(() => {
    if (!quizQ?.data) return;
    const row = quizQ.data as any;
    setCountry(row.country || "");
    setDifficulty(row.difficulty || "medium");
    setQuestions(row.questions || []);
    setQuestionsJson(JSON.stringify(row.questions || [], null, 2));
    setFactTypeId(row.fact_type_id || null);
    setCategoryId(row.category_id || null);
    setStatus(row.status || "draft");
  }, [quizQ?.data]);

  // Load admin user
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp: any = await supabase.auth.getUser();
        const user = resp?.data?.user || null;
        if (mounted && user) setAdminUserId(user.id);
      } catch (e) {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Save mutation
  const saveMut = useMutation({
    mutationFn: async ({ publish }: { publish?: boolean } = {}) => {
      let payloadQuestions = questions;
      if (!payloadQuestions || payloadQuestions.length === 0) {
        try {
          payloadQuestions = JSON.parse(questionsJson);
        } catch (e) {
          throw new Error("Questions must be valid JSON");
        }
      }

      // Validation: fact_type_id is ALWAYS required
      if (!factTypeId) throw new Error("Fact Type is required");
      if (!Array.isArray(payloadQuestions) || payloadQuestions.length === 0) {
        throw new Error("At least one question is required");
      }

      // Call server-side validator if available
      try {
        const validateUrl =
          (import.meta.env.VITE_VALIDATE_QUIZ_URL as string) || "";
        if (validateUrl) {
          const res = await fetch(validateUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ questions: payloadQuestions }),
          });
          if (res.status >= 400) {
            const j = await res.json();
            const msg =
              (j && j.errors && j.errors.join("; ")) ||
              "Server-side validation failed";
            throw new Error(msg);
          }
        }
      } catch (e) {
        console.debug("validate-quiz call failed or not available:", e);
      }

      // Determine status and approval metadata.
      const nowIso = new Date().toISOString();
      const payload: any = {
        fact_type_id: factTypeId,
        country: country || null,
        difficulty,
        questions: payloadQuestions,
        category_id: categoryId || null,
        created_by: adminUserId,
      };

      if (publish) {
        // Publishing directly should mark the quiz as approved immediately.
        // Do not set `approved_at` here because the column may not exist.
        payload.status = "approved";
      } else {
        // Regular save keeps draft status and clears approval when editing.
        payload.status = "draft";
      }

      if (editId) {
        // Editing without publishing will keep status as 'draft', requiring re-approval.
        const res = await supabase
          .from("quizzes")
          .update(payload)
          .eq("id", editId)
          .select("id");
        if (res.error) throw res.error;
        return res;
      }

      const insertRes = await supabase
        .from("quizzes")
        .insert([payload])
        .select("id");
      if (insertRes.error) throw insertRes.error;
      return insertRes;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "quizzes"] });
    },
    onError: (err: any) => {
      const message =
        err?.message || err?.error?.message || "Failed to save quiz.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleSave = async (publish = false) => {
    // Client-side validation to give immediate feedback
    if (!factTypeId) {
      toast({
        title: "Validation",
        description: "Fact Type is required",
        variant: "destructive",
      });
      return;
    }
    const payloadQuestions =
      questions && questions.length
        ? questions
        : (() => {
            try {
              return JSON.parse(questionsJson);
            } catch {
              return null;
            }
          })();
    if (
      !payloadQuestions ||
      !Array.isArray(payloadQuestions) ||
      payloadQuestions.length === 0
    ) {
      toast({
        title: "Validation",
        description: "At least one question is required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const res: any = await saveMut.mutateAsync({ publish });
      if (!editId && res && res.data && res.data.length && res.data[0].id) {
        const newId = res.data[0].id;
        toast({
          title: publish ? "Published" : "Created",
          description: publish ? "Quiz published." : "Quiz created.",
        });
        navigate(`/admin/quizzes/${newId}/edit`);
        return;
      }
      toast({
        title: publish ? "Published" : "Saved",
        description: publish ? "Quiz published." : "Quiz saved.",
      });
      navigate("/admin/quizzes");
    } catch (e: any) {
      // show a clearer error if supabase returned details
      const msg = e?.message || e?.error?.message || "Failed to save quiz.";
      toast({ title: "Save Error", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Handle accepting AI-generated questions
  const handleAcceptAIQuestions = (questions: any[]) => {
    // Normalize questions from Gemini format to internal format
    // Gemini: { question, options[], correct_answer }
    // Internal: { question, options[], correct_answer } (for storage)

    const normalizedQuestions = questions.map((q) => ({
      question: q.question || q.q || "",
      options: Array.isArray(q.options) ? q.options : [],
      correct_answer: q.correct_answer || "",
      // Provide fields expected by the DnD/static editor:
      q: q.question || q.q || "",
      // Map correct_answer (value) to answer (index). If not found, default to 0.
      answer: (() => {
        const opts = Array.isArray(q.options) ? q.options : [];
        const idx = opts.indexOf(q.correct_answer);
        if (idx >= 0) return idx;
        return 0;
      })(),
      fact_type_id: q.fact_type_id,
      category_id: q.category_id,
      country: q.country,
      difficulty: q.difficulty,
    }));

    // Apply generated questions to form
    setQuestions(normalizedQuestions);
    setQuestionsJson(JSON.stringify(normalizedQuestions, null, 2));
    // Extract metadata from first question to set form fields
    if (questions.length > 0) {
      const firstQ = normalizedQuestions[0];
      if (firstQ.fact_type_id) setFactTypeId(firstQ.fact_type_id);
      if (firstQ.category_id) setCategoryId(firstQ.category_id);
      if (firstQ.country) setCountry(firstQ.country);
      if (firstQ.difficulty) setDifficulty(firstQ.difficulty);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          {editId ? "Edit Quiz" : "Create New Quiz"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {editId
            ? "Modify the quiz below"
            : "Fill in the details and add questions"}
        </p>
      </div>

      <div className="grid gap-4">
        {/* Manual Quiz Section */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quiz Details</h3>

          <div className="grid gap-4">
            {/* Fact Type - REQUIRED */}
            <div className="grid gap-2">
              <label className="text-sm font-medium">
                Fact Type <span className="text-red-500">*</span>
              </label>
              <Select
                value={factTypeId || "none"}
                onValueChange={(v) => setFactTypeId(v === "none" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a fact type" />
                </SelectTrigger>
                <SelectContent>
                  {factTypes.map((ft: any) => (
                    <SelectItem key={ft.id} value={String(ft.id)}>
                      {ft.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category - OPTIONAL */}
            <div className="grid gap-2">
              <label className="text-sm font-medium">Category (optional)</label>
              <Select
                value={categoryId || "none"}
                onValueChange={(v) => setCategoryId(v === "none" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Country - OPTIONAL */}
            <div className="grid gap-2">
              <label className="text-sm font-medium">Country (optional)</label>
              <Input
                placeholder="e.g., France, Japan"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>

            {/* Difficulty */}
            <div className="grid gap-2">
              <label className="text-sm font-medium">Difficulty</label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Questions Section */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Questions</h3>
            <Button
              onClick={() => setAiGeneratorOpen(true)}
              variant="outline"
              size="sm"
            >
              ✨ Generate with AI
            </Button>
          </div>

          <div className="space-y-3">
            {questions.length === 0 && (
              <div className="p-4 bg-muted/50 rounded text-sm text-muted-foreground">
                No questions yet. Add one manually or use "Generate with AI".
              </div>
            )}

            {/* Multi-question builder */}
            <ErrorBoundary
              fallbackRender={() => (
                <div className="space-y-3">
                  {questions.map((qq, qi) => (
                    <StaticQuestion
                      key={qq.id || qq._localId || qi}
                      qi={qi}
                      qq={qq}
                      questions={questions}
                      setQuestions={setQuestions}
                      setQuestionsJson={setQuestionsJson}
                    />
                  ))}
                </div>
              )}
            >
              <React.Suspense
                fallback={
                  <div className="space-y-3">
                    {questions.map((qq, qi) => (
                      <StaticQuestion
                        key={qq.id || qq._localId || qi}
                        qi={qi}
                        qq={qq}
                        questions={questions}
                        setQuestions={setQuestions}
                        setQuestionsJson={setQuestionsJson}
                      />
                    ))}
                  </div>
                }
              >
                <DynamicQuizBuilder
                  questions={questions}
                  setQuestions={setQuestions}
                  setQuestionsJson={setQuestionsJson}
                />
              </React.Suspense>
            </ErrorBoundary>

            {/* Add Question Button */}
            <Button
              onClick={() => {
                const copy = [...questions];
                copy.push({
                  question: "",
                  options: ["", "", ""],
                  correct_answer: "",
                });
                setQuestions(copy);
                setQuestionsJson(JSON.stringify(copy, null, 2));
              }}
              variant="outline"
              className="w-full"
            >
              + Add Question
            </Button>
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={() => handleSave(false)} disabled={saving}>
          {saving ? "Saving..." : "Save Draft"}
        </Button>
        <Button
          onClick={() => handleSave(true)}
          variant="default"
          disabled={saving}
        >
          {saving ? "Publishing..." : "Publish"}
        </Button>
        <Button onClick={() => navigate("/admin/quizzes")} variant="outline">
          Cancel
        </Button>
      </div>

      {/* AI Generator Modal */}
      <AIGeneratorModal
        open={aiGeneratorOpen}
        onOpenChange={setAiGeneratorOpen}
        factTypes={factTypes}
        onAcceptQuestions={handleAcceptAIQuestions}
        isLoading={aiGenerating}
      />
    </div>
  );
};

export default QuizEdit;
