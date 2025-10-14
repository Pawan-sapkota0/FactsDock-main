import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { generateQuizForTopic } from '@/lib/api';
import { Loader2 } from 'lucide-react';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  topic?: string;
  sourceType?: 'fun' | 'world' | 'country' | 'global';
  questionCount?: number;
};

type Q = { question: string; options: string[]; answer: string };

// Simple in-memory cache with optional TTL
const CACHE = new Map<string, { ts: number; data: Q[] }>();
const DEFAULT_TTL = 1000 * 60 * 5; // 5 minutes

async function fetchAndCache(topic: string | undefined, count: number) {
  const key = `${topic || '__global__'}:${count}`;
  const now = Date.now();
  const cached = CACHE.get(key);
  if (cached && now - cached.ts < DEFAULT_TTL) return cached.data;
  const res = await generateQuizForTopic(topic, count);
  const qs: Q[] = (res || []).map((q: any) => ({
    question: q.question || q.title || 'Question',
    options: q.options || q.choices || q.answers || [],
    answer: q.answer || q.correctAnswer || q.answerText || '',
  }));
  CACHE.set(key, { ts: now, data: qs });
  return qs;
}

const QuizModal: React.FC<Props> = ({ open, onOpenChange, topic, questionCount = 10 }) => {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
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
        const qs = await fetchAndCache(topic, questionCount);
        if (!mounted) return;
        setQuestions(qs);
        setIndex(0);
        setSelected(null);
        setScore(0);
        setFinished(false);
        setFocusedIndex(null);
      } catch (e) {
        console.error('Failed to generate quiz', e);
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [open, topic, questionCount]);

  const current = useMemo(() => questions[index], [questions, index]);

  const handleAnswer = (opt: string) => {
    if (selected) return;
    setSelected(opt);
    if (opt === (current?.answer || '')) setScore((s) => s + 1);
    setTimeout(() => {
      if (index + 1 >= questions.length) setFinished(true);
      else { setIndex((i) => i + 1); setSelected(null); setFocusedIndex(null); }
    }, 600);
  };

  const handlePlayAgain = () => {
    // clear cached entry for this topic so Play Again may regenerate
    const key = `${topic || '__global__'}:${questionCount}`;
    CACHE.delete(key);
    // reopen will trigger new fetch
    setLoading(true);
    fetchAndCache(topic, questionCount).then((qs) => {
      setQuestions(qs);
      setIndex(0);
      setSelected(null);
      setScore(0);
      setFinished(false);
    }).finally(() => setLoading(false));
  };

  // keyboard navigation for options: ArrowUp/ArrowDown/Home/End/Enter
  useEffect(() => {
    if (!open || !current) return;
    const handler = (e: KeyboardEvent) => {
      const opts = current.options || [];
      if (opts.length === 0) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        setFocusedIndex((f) => (f === null ? 0 : Math.min(opts.length - 1, f + 1)));
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setFocusedIndex((f) => (f === null ? opts.length - 1 : Math.max(0, f - 1)));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setFocusedIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setFocusedIndex(opts.length - 1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (focusedIndex !== null) {
          e.preventDefault();
          handleAnswer(opts[focusedIndex]);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
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
          <DialogTitle>Quiz{topic ? `: ${topic}` : ''}</DialogTitle>
        </DialogHeader>

        <div className="p-4">
          {loading && (
            <div className="flex items-center gap-2"><Loader2 className="animate-spin" /> Generating questions...</div>
          )}

          {!loading && !finished && current && (
            <div>
              <div className="mb-4 font-semibold">Q{index + 1}/{questions.length}: {current.question}</div>
              <div className="grid gap-2">
                {current.options.map((o, i) => {
                  const correct = o === current.answer;
                  const isSelected = selected === o;
                  const bg = selected ? (isSelected ? (correct ? 'bg-green-100' : 'bg-red-100') : 'bg-transparent') : 'bg-card';
                  return (
                    <button
                      key={i}
                      ref={(el) => (optionsRef.current[i] = el)}
                      onClick={() => handleAnswer(o)}
                      className={`text-left p-3 rounded border ${bg}`}
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
              <div className="text-2xl font-bold mb-2">You scored {score} / {questions.length}</div>
              <div className="mb-4">{score >= Math.ceil(questions.length * 0.7) ? 'Great job!' : 'Nice try — practice more to improve.'}</div>
              <div className="flex gap-2 justify-center">
                <Button onClick={handlePlayAgain}>Play Again</Button>
                <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
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
