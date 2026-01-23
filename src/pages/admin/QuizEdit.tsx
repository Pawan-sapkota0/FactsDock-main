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
import logger from "@/lib/logger";

// Dynamic loader for DnD builder with fallback to static UI
function DynamicQuizBuilder(props: {
  questions: unknown[];
  setQuestions: (q: unknown[]) => void;
  setQuestionsJson: (s: string) => void;
}) {
  const { questions, setQuestions, setQuestionsJson } = props;
  const [Comp, setComp] = React.useState<React.ComponentType<
    Record<string, unknown>
  > | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod = await import("./QuizBuilderDnd");
        if (mounted && mod && mod.default) setComp(() => mod.default);
      } catch (e) {
        logger.warn(
          "Failed to load QuizBuilderDnd, falling back to static builder",
          e,
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
      {questions.map((qq, qi: number) => (
        <StaticQuestion
          key={String(
            (qq as Record<string, unknown>)?.id ??
              (qq as Record<string, unknown>)?._localId ??
              qi,
          )}
          qi={qi}
          qq={qq as Record<string, unknown>}
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
  componentDidCatch(error: unknown) {
    logger.error("ErrorBoundary caught", error);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallbackRender ? this.props.fallbackRender() : null;
    }
    return this.props.children;
  }
}

// Helper to move array elements
function arrayMoveLocal(arr: unknown[], from: number, to: number) {
  const copy = arr.slice();
  if (from < 0 || from >= copy.length || to < 0 || to >= copy.length)
    return copy;
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

// Static (non-draggable) question card with up/down buttons
type StaticQuestionProps = {
  qi: number;
  qq: Record<string, unknown>;
  questions: unknown[];
  setQuestions: (q: unknown[]) => void;
  setQuestionsJson: (s: string) => void;
};

function StaticQuestion({
  qi,
  qq,
  questions,
  setQuestions,
  setQuestionsJson,
}: StaticQuestionProps) {
  const updateQuestion = (updater: (q: Record<string, unknown>) => void) => {
    const copy = [...questions];
    updater(copy[qi] as Record<string, unknown>);
    setQuestions(copy);
    setQuestionsJson(JSON.stringify(copy, null, 2));
  };

  const qText = String(qq.question ?? qq.q ?? "");
  const opts = Array.isArray(qq.options) ? (qq.options as unknown[]) : [];
  const correct = qq.correct_answer ?? null;

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
  const [questions, setQuestions] = useState<unknown[]>([]);
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
  // Ensure we have a minimal FactType shape (id + name) so the modal prop typing is satisfied.
  type LocalFactType = { id: string; name: string; [k: string]: unknown };

  const factTypes: LocalFactType[] =
    (factTypesQ?.data as unknown as Record<string, unknown>[])?.map(
      (ft) =>
        ({
          id: String((ft as Record<string, unknown>)?.id ?? ""),
          name: String((ft as Record<string, unknown>)?.name ?? ""),
          ...(ft as Record<string, unknown>),
        }) as LocalFactType,
    ) || [];

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
  const categories =
    (categoriesByFactTypeQ?.data as unknown as Record<string, unknown>[]) || [];

  // Load quiz data when editing
  useEffect(() => {
    if (!quizQ?.data) return;
    const row = quizQ.data as Record<string, unknown>;
    setCountry(String(row.country || ""));
    setDifficulty(String(row.difficulty || "medium"));
    setQuestions((row.questions as unknown[]) || []);
    setQuestionsJson(
      JSON.stringify((row.questions as unknown[]) || [], null, 2),
    );
    setFactTypeId((row.fact_type_id as string) || null);
    setCategoryId((row.category_id as string) || null);
    setStatus(String(row.status || "draft"));
  }, [quizQ?.data]);

  // Load admin user
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = (await supabase.auth.getUser()) as unknown;
        // supabase.auth.getUser() is an SDK call; narrow safely
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SDK return shape
        const user = (resp as any)?.data?.user || null;
        if (mounted && user)
          setAdminUserId(String((user as Record<string, unknown>)?.id ?? ""));
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
        logger.debug("validate-quiz call failed or not available:", e);
      }

      // Determine status and approval metadata.
      const nowIso = new Date().toISOString();
      // Payload is sent to Supabase (DB boundary)
      const payload: Record<string, unknown> = {
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
    onError: (err: unknown) => {
      const getErrorMessage = (e: unknown) => {
        if (!e) return "Failed to save quiz.";
        if (typeof e === "string") return e;
        if (typeof e === "object") {
          const o = e as Record<string, unknown>;
          const m =
            o.message ??
            (o.error as Record<string, unknown> | undefined)?.message;
          if (typeof m === "string") return m;
        }
        return "Failed to save quiz.";
      };
      const message = getErrorMessage(err);
      toast({ title: "Error", description: message, variant: "destructive" });
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
      const res: unknown = await saveMut.mutateAsync({ publish });
      if (!editId && res && typeof res === "object") {
        const r = res as Record<string, unknown>;
        const data = r.data as unknown;
        if (
          Array.isArray(data) &&
          data.length &&
          (data[0] as Record<string, unknown>).id
        ) {
          const newId = String((data[0] as Record<string, unknown>).id);
          toast({
            title: publish ? "Published" : "Created",
            description: publish ? "Quiz published." : "Quiz created.",
          });
          navigate(`/admin/quizzes/${newId}/edit`);
          return;
        }
      }
      toast({
        title: publish ? "Published" : "Saved",
        description: publish ? "Quiz published." : "Quiz saved.",
      });
      navigate("/admin/quizzes");
    } catch (e: unknown) {
      const getErrorMessage = (er: unknown) => {
        if (!er) return "Failed to save quiz.";
        if (typeof er === "string") return er;
        if (typeof er === "object") {
          const o = er as Record<string, unknown>;
          const m =
            o.message ??
            (o.error as Record<string, unknown> | undefined)?.message;
          if (typeof m === "string") return m;
        }
        return "Failed to save quiz.";
      };
      const msg = getErrorMessage(e);
      toast({ title: "Save Error", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Handle accepting AI-generated questions
  const handleAcceptAIQuestions = (aiQuestions: unknown[]) => {
    const normalizedQuestions = aiQuestions.map((item) => {
      const q = (item as Record<string, unknown>) || {};
      const questionText = String(q.question ?? q.q ?? "");
      const opts = Array.isArray(q.options) ? (q.options as unknown[]) : [];
      const optsStrings = opts.map((o) => String(o));
      const correct = q.correct_answer ?? "";
      const idx = optsStrings.indexOf(String(correct));
      return {
        question: questionText,
        options: optsStrings,
        correct_answer: String(correct ?? ""),
        q: questionText,
        answer: idx >= 0 ? idx : 0,
        fact_type_id: q.fact_type_id,
        category_id: q.category_id,
        country: q.country,
        difficulty: q.difficulty,
      };
    });

    setQuestions(normalizedQuestions);
    setQuestionsJson(JSON.stringify(normalizedQuestions, null, 2));
    if (normalizedQuestions.length > 0) {
      const firstQ = normalizedQuestions[0] as Record<string, unknown>;
      if (firstQ.fact_type_id) setFactTypeId(String(firstQ.fact_type_id));
      if (firstQ.category_id) setCategoryId(String(firstQ.category_id));
      if (firstQ.country) setCountry(String(firstQ.country));
      if (firstQ.difficulty) setDifficulty(String(firstQ.difficulty));
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
                  {factTypes.map((ft: Record<string, unknown>) => (
                    <SelectItem key={String(ft.id)} value={String(ft.id)}>
                      {String(ft.name)}
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
                  {categories.map((c: Record<string, unknown>) => (
                    <SelectItem key={String(c.id)} value={String(c.id)}>
                      {String(c.name)}
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
                      key={String(
                        (qq as Record<string, unknown>)?.id ??
                          (qq as Record<string, unknown>)?._localId ??
                          qi,
                      )}
                      qi={qi}
                      qq={qq as Record<string, unknown>}
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
                        key={String(
                          (qq as Record<string, unknown>)?.id ??
                            (qq as Record<string, unknown>)?._localId ??
                            qi,
                        )}
                        qi={qi}
                        qq={qq as Record<string, unknown>}
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
