import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { generateQuizForTopic } from "@/lib/api";
import { Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (val: boolean) => void;
  topic?: string;
  type?: "fun" | "world";
};
import { log, debug, warn, error } from "@/lib/logger";

type Q = {
  question: string;
  options: string[];
  answer: string;
};

const QuizOverlay: React.FC<Props> = ({ open, onOpenChange, topic }) => {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [lastPlayedQuestions, setLastPlayedQuestions] = useState<Q[] | null>(
    null,
  );

  const fetchQuestions = useCallback(
    async (count = 10) => {
      setLoading(true);
      try {
        let res: unknown;
        if (topic) {
          res = await generateQuizForTopic(topic, count, { force: true });
        } else {
          // random quizzes should be freshly generated
          // import generateRandomQuiz dynamically to avoid cycle
          const mod = (await import("@/lib/api")) as {
            generateRandomQuiz: (n: number) => Promise<unknown>;
          };
          res = await mod.generateRandomQuiz(count);
        }
        // normalize
        const raw = Array.isArray(res) ? (res as unknown[]) : res ? [res] : [];
        const qs = raw.map((q: unknown) => {
          const o = (q || {}) as Record<string, unknown>;
          const question = String(o.question ?? o.title ?? "Question");
          const optsRaw = o.options ?? o.choices ?? o.answers ?? [];
          const options = Array.isArray(optsRaw)
            ? optsRaw.map((x) => String(x))
            : [];
          const answer = String(
            o.answer ??
              o.correctAnswer ??
              o.answerText ??
              o.correct_answer ??
              "",
          );
          return { question, options, answer } as Q;
        });
        setQuestions(qs);
        setSelected(null);
        setScore(0);
        setFinished(false);
        setLastPlayedQuestions((prev) => prev ?? qs);
      } catch (e) {
        error("Quiz fetch failed", e);
      } finally {
        setLoading(false);
      }
    },
    [topic],
  );

  useEffect(() => {
    if (!open) return;
    fetchQuestions(12); // fetch 12 random questions
  }, [open, topic, fetchQuestions]);

  const current = useMemo(() => questions[index], [questions, index]);

  const handleAnswer = (opt: string) => {
    if (selected) return; // prevent changing
    setSelected(opt);
    if (opt === (current?.answer || "")) {
      setScore((s) => s + 1);
    }
    // move to next after short delay
    setTimeout(() => {
      if (index + 1 >= questions.length) {
        // save the completed quiz as last played
        setLastPlayedQuestions(questions);
        setFinished(true);
      } else {
        setIndex((i) => i + 1);
        setSelected(null);
      }
    }, 700);
  };

  const handlePlayAgain = () => {
    // New Quiz: attempt to fetch a fresh set that differs from lastPlayedQuestions
    (async () => {
      const maxAttempts = 3;
      let attempt = 0;
      let qs: Q[] = [];
      try {
        do {
          setLoading(true);
          let res: unknown;
          if (topic) {
            res = await generateQuizForTopic(topic, 12, { force: true });
          } else {
            const mod = (await import("@/lib/api")) as {
              generateRandomQuiz: (n: number) => Promise<unknown>;
            };
            res = await mod.generateRandomQuiz(12);
          }
          const raw2 = Array.isArray(res)
            ? (res as unknown[])
            : res
              ? [res]
              : [];
          qs = raw2.map((q: unknown) => {
            const o = (q || {}) as Record<string, unknown>;
            const question = String(o.question ?? o.title ?? "Question");
            const optsRaw = o.options ?? o.choices ?? o.answers ?? [];
            const options = Array.isArray(optsRaw)
              ? optsRaw.map((x) => String(x))
              : [];
            const answer = String(
              o.answer ??
                o.correctAnswer ??
                o.answerText ??
                o.correct_answer ??
                "",
            );
            return { question, options, answer } as Q;
          });
          if (!lastPlayedQuestions) break;
          if (!areOverlayQuestionSetsEqual(qs, lastPlayedQuestions)) break;
          attempt++;
        } while (attempt < maxAttempts);

        setQuestions(qs);
        setIndex(0);
        setScore(0);
        setFinished(false);
        setLastPlayedQuestions(qs);
      } catch (e) {
        error("Failed to fetch new quiz set", e);
      } finally {
        setLoading(false);
      }
    })();
  };

  const replayLastQuiz = () => {
    if (!lastPlayedQuestions) return;
    setQuestions(lastPlayedQuestions);
    setIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  };

  const areOverlayQuestionSetsEqual = (
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
      if (normalize(qa.answer) !== normalize(qb.answer)) return false;
    }
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Quiz: {topic}</DialogTitle>
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
                  const correct = o === current.answer;
                  const isSelected = selected === o;
                  const bg = selected
                    ? isSelected
                      ? correct
                        ? "bg-green-100 dark:bg-green-900"
                        : "bg-red-100 dark:bg-red-900"
                      : "bg-transparent"
                    : "bg-card";
                  let textColor = "text-foreground";
                  if (selected && isSelected) {
                    textColor = correct
                      ? "text-green-900 dark:text-green-100"
                      : "text-red-900 dark:text-red-100";
                  }
                  // Use unique key combining question index and option index to ensure proper React reconciliation
                  const uniqueKey = `q${index}-opt${i}`;
                  return (
                    <button
                      key={uniqueKey}
                      onClick={() => handleAnswer(o)}
                      className={`text-left p-3 rounded border ${bg} ${textColor}`}
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

export default QuizOverlay;
