import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { generateQuizForTopic, generateRandomQuiz } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { log, debug, warn, error } from "@/lib/logger";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  topic?: string;
  sourceType?: "fun" | "world" | "country" | "global";
  questionCount?: number;
};

type Q = { question: string; options: unknown[]; answer: unknown };

// No client-side caching for quizzes to ensure fresh sets per request

async function fetchAndCache(
  topic: string | undefined,
  count: number,
  sourceType?: string,
) {
  const key = `${topic || "__global__"}:${count}:${sourceType || ""}`;
  // If a sourceType is provided (e.g., 'fun', 'world', 'country'), always fetch
  // using generateQuizForTopic so results are filtered by fact_type. Only fall
  // back to generateRandomQuiz when neither topic nor sourceType is given.
  let res;
  if (sourceType) {
    // request fresh set
    res = await generateQuizForTopic(topic, count, { sourceType, force: true });
  } else if (topic) {
    // topic-specific quiz - request fresh set
    res = await generateQuizForTopic(topic, count, { force: true });
  } else {
    // random quiz - always fresh
    res = await generateRandomQuiz(count);
  }
  const qs: Q[] = (res || []).map((q: unknown) => {
    const rec = (q || {}) as Record<string, unknown>;
    const questionRaw = rec.question ?? rec.title ?? "Question";
    const question = String(questionRaw ?? "");

    const optionsRaw = rec.options ?? rec.choices ?? rec.answers ?? [];
    const options = Array.isArray(optionsRaw) ? (optionsRaw as unknown[]) : [];

    const answer =
      rec.answer ??
      rec.correctAnswer ??
      rec.answerText ??
      rec.correct_answer ??
      "";

    return {
      question,
      options,
      answer,
    } as Q;
  });
  return qs;
}

const QuizModal: React.FC<Props> = ({
  open,
  onOpenChange,
  topic,
  sourceType,
  questionCount = 10,
}) => {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [index, setIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [lastPlayedQuestions, setLastPlayedQuestions] = useState<Q[] | null>(
    null,
  );
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const optionsRef = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const qs = await fetchAndCache(topic, questionCount, sourceType);
        if (!mounted) return;
        setQuestions(qs);
        setIndex(0);
        setSelectedIndex(null);
        setScore(0);
        setFinished(false);
        setFocusedIndex(null);
        // store the initially loaded quiz set if not already set
        setLastPlayedQuestions((prev) => prev ?? qs);
      } catch (e) {
        error("Failed to generate quiz", e);
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [open, topic, questionCount, sourceType]);

  const current = useMemo(() => questions[index], [questions, index]);
  const isCountryQuiz = sourceType === "country";

  const normalizeStr = (v: unknown) =>
    String(v ?? "")
      .trim()
      .toLowerCase();

  const optionId = (o: unknown) => {
    if (o == null) return undefined;
    if (typeof o === "string" || typeof o === "number") return undefined;
    // treat as record
    const rec = o as Record<string, unknown>;
    return rec.id ?? rec._id ?? rec.value ?? rec.key ?? undefined;
  };

  const optionLabel = (o: unknown) => {
    if (o == null) return "";
    if (typeof o === "string" || typeof o === "number") return normalizeStr(o);
    const rec = o as Record<string, unknown>;
    return normalizeStr(rec.label ?? rec.text ?? rec.name ?? rec.value ?? "");
  };

  const resolveAnswerValue = (q: Q) => {
    // If the stored answer is an index, resolve to the option value
    if (typeof q?.answer === "number" && Array.isArray(q.options)) {
      return q.options[q.answer];
    }
    return q?.answer;
  };

  const answersEqual = (opt: unknown, ansRaw: unknown) => {
    const ans = resolveAnswerValue(current as Q) ?? ansRaw;
    // If both have id-like properties, compare ids
    const optId = optionId(opt);
    const ansId = optionId(ans);
    if (optId !== undefined && ansId !== undefined)
      return String(optId) === String(ansId);
    if (
      optId !== undefined &&
      (typeof ans === "string" || typeof ans === "number")
    )
      return String(optId) === String(ans);
    if (
      ansId !== undefined &&
      (typeof opt === "string" || typeof opt === "number")
    )
      return String(ansId) === String(opt);

    // Fall back to normalized label comparison
    return optionLabel(opt) === optionLabel(ans);
  };

  const handleAnswer = (opt: unknown, idx: number) => {
    if (selectedIndex !== null) return;
    setSelectedIndex(idx);
    // Apply robust comparison for all quiz types (country, fun, world, global)
    const correct = answersEqual(opt, current?.answer);
    if (correct) setScore((s) => s + 1);
    setTimeout(() => {
      if (index + 1 >= questions.length) {
        // mark the just-played set as last played so Replay returns the most recent quiz
        setLastPlayedQuestions(questions);
        setFinished(true);
      } else {
        setIndex((i) => i + 1);
        setSelectedIndex(null);
        setFocusedIndex(null);
      }
    }, 600);
  };

  const handlePlayAgain = () => {
    // Attempt to fetch a fresh distinct quiz set (up to N tries)
    (async () => {
      const key = `${topic || "__global__"}:${questionCount}:${
        sourceType || ""
      }`;
      const maxAttempts = 3;
      let attempt = 0;
      let qs: Q[] = [];
      try {
        do {
          setLoading(true);
          // fetch
          // eslint-disable-next-line no-await-in-loop
          qs = (await fetchAndCache(topic, questionCount, sourceType)) || [];
          // if we don't have a lastPlayedQuestions or sets differ, accept
          if (!lastPlayedQuestions) break;
          const same = areQuestionSetsEqual(qs, lastPlayedQuestions);
          if (!same) break;
          attempt++;
        } while (attempt < maxAttempts);

        setQuestions(qs);
        setIndex(0);
        setSelectedIndex(null);
        setScore(0);
        setFinished(false);
        // overwrite lastPlayedQuestions when user requests a new quiz
        setLastPlayedQuestions(qs);
      } catch (e) {
        error("Failed to fetch new quiz set", e);
      } finally {
        setLoading(false);
      }
    })();
  };

  // Compare two question sets by normalized question text and option counts
  const areQuestionSetsEqual = (
    a: Q[] | null | undefined,
    b: Q[] | null | undefined,
  ) => {
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    const normalize = (s: unknown) =>
      String(s ?? "")
        .trim()
        .toLowerCase();
    for (let i = 0; i < a.length; i++) {
      const qa = a[i];
      const qb = b[i];
      if (normalize(qa.question) !== normalize(qb.question)) return false;
      if ((qa.options || []).length !== (qb.options || []).length) return false;
      // compare normalized answers
      if (
        normalize(resolveAnswerValue(qa)) !== normalize(resolveAnswerValue(qb))
      )
        return false;
    }
    return true;
  };

  const replayLastQuiz = () => {
    if (!lastPlayedQuestions) return;
    setQuestions(lastPlayedQuestions);
    setIndex(0);
    setSelectedIndex(null);
    setScore(0);
    setFinished(false);
    setFocusedIndex(null);
  };

  // keyboard navigation for options: ArrowUp/ArrowDown/Home/End/Enter
  useEffect(() => {
    if (!open || !current) return;
    const handler = (e: KeyboardEvent) => {
      const opts = current.options || [];
      if (opts.length === 0) return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        setFocusedIndex((f) =>
          f === null ? 0 : Math.min(opts.length - 1, f + 1),
        );
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        setFocusedIndex((f) =>
          f === null ? opts.length - 1 : Math.max(0, f - 1),
        );
      } else if (e.key === "Home") {
        e.preventDefault();
        setFocusedIndex(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setFocusedIndex(opts.length - 1);
      } else if (e.key === "Enter" || e.key === " ") {
        if (focusedIndex !== null) {
          e.preventDefault();
          handleAnswer(opts[focusedIndex], focusedIndex);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, current, focusedIndex]);

  useEffect(() => {
    if (focusedIndex === null) return;
    const btn = optionsRef.current[focusedIndex];
    if (btn) btn.focus();
  }, [focusedIndex]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Quiz{topic ? `: ${topic}` : ""}</DialogTitle>
        </DialogHeader>

        <div className="p-4">
          {loading && (
            <div className="flex items-center gap-2">
              <Loader2 className="animate-spin" /> Generating questions...
            </div>
          )}

          {!loading && !finished && current && (
            <div>
              <div className="mb-4 font-semibold">
                Q{index + 1}/{questions.length}: {current.question}
              </div>
              <div className="grid gap-2">
                {current.options.map((o, i) => {
                  // Track selection by index (not value) to avoid comparison bugs
                  const isSelected = selectedIndex === i;
                  const isCorrectAnswer = answersEqual(o, current.answer);

                  let bgColor = "bg-card";

                  if (isSelected) {
                    bgColor = isCorrectAnswer ? "bg-green-100" : "bg-red-100";
                  }

                  return (
                    <button
                      key={i}
                      ref={(el) => (optionsRef.current[i] = el)}
                      onClick={() => handleAnswer(o, i)}
                      disabled={selectedIndex !== null}
                      className={`text-left p-3 rounded border ${bgColor} ${
                        selectedIndex === null ? "hover:bg-muted" : ""
                      }`}
                      tabIndex={0}
                      aria-pressed={isSelected}
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!loading && finished && (
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">
                You scored {score} / {questions.length}
              </div>
              <div className="mb-4">
                {score === questions.length
                  ? "🎉 Excellent! Perfect Score! 🎉"
                  : score >= Math.ceil(questions.length * 0.8)
                    ? "👏 Great job! Keep it up!"
                    : score >= Math.ceil(questions.length * 0.6)
                      ? "👍 Good effort! Practice more to improve."
                      : "💪 Nice try — practice more to improve."}
              </div>
              <div className="flex gap-2 justify-center">
                <Button onClick={replayLastQuiz}>Replay Last Quiz</Button>
                <Button onClick={handlePlayAgain}>New Quiz</Button>
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}

          {!loading && !finished && !current && <div>No quiz available.</div>}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuizModal;
