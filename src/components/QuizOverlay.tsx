import React, { useEffect, useMemo, useState } from "react";
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
    null
  );

  const fetchQuestions = async (count = 10) => {
    setLoading(true);
    try {
      let res: any;
      if (topic) {
        res = await generateQuizForTopic(
          topic,
          count as any,
          { force: true } as any
        );
      } else {
        // random quizzes should be freshly generated
        // import generateRandomQuiz dynamically to avoid cycle
        const mod = await import("@/lib/api");
        res = await mod.generateRandomQuiz(count as any);
      }
      // normalize
      const qs = (res || []).map(
        (q: any) =>
          ({
            question: q.question || q.title || "Question",
            options: q.options || q.choices || (q.answers ? q.answers : []),
            answer:
              q.answer ||
              q.correctAnswer ||
              q.answerText ||
              q.correct_answer ||
              "",
          } as Q)
      );
      setQuestions(qs);
      setIndex(0);
      setSelected(null);
      setScore(0);
      setFinished(false);
      setLastPlayedQuestions((prev) => prev ?? qs);
    } catch (e) {
      console.error("Quiz fetch failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    fetchQuestions(12); // fetch 12 random questions
  }, [open, topic]);

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
          // eslint-disable-next-line no-await-in-loop
          let res: any;
          if (topic) {
            res = await generateQuizForTopic(
              topic,
              12 as any,
              { force: true } as any
            );
          } else {
            const mod = await import("@/lib/api");
            res = await mod.generateRandomQuiz(12 as any);
          }
          qs = (res || []).map(
            (q: any) =>
              ({
                question: q.question || q.title || "Question",
                options: q.options || q.choices || (q.answers ? q.answers : []),
                answer:
                  q.answer ||
                  q.correctAnswer ||
                  q.answerText ||
                  q.correct_answer ||
                  "",
              } as Q)
          );
          if (!lastPlayedQuestions) break;
          if (!areOverlayQuestionSetsEqual(qs, lastPlayedQuestions)) break;
          attempt++;
        } while (attempt < maxAttempts);

        setQuestions(qs);
        setIndex(0);
        setSelected(null);
        setScore(0);
        setFinished(false);
        setLastPlayedQuestions(qs);
      } catch (e) {
        console.error("Failed to fetch new quiz set", e);
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
    b: Q[] | null | undefined
  ) => {
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    const normalize = (s: any) =>
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
                        ? "bg-green-100"
                        : "bg-red-100"
                      : "bg-transparent"
                    : "bg-card";
                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(o)}
                      className={`text-left p-3 rounded border ${bg}`}
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
