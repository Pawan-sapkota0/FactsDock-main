import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { generateQuiz } from '@/lib/quiz';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export default function QuizButton({ country }: { country?: string }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const start = async () => {
    setLoading(true);
    try {
      toast({ title: 'Generating quiz', description: `Generating quiz for ${country || 'world'}...` });
      const questions = await generateQuiz(country, 10);
      localStorage.setItem('currentQuiz', JSON.stringify(questions));
      navigate('/quiz?autoStart=1');
      toast({ title: 'Quiz ready', description: 'Quiz generated and starting now.' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to generate quiz.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return <Button variant="hero" onClick={start} disabled={loading}>{loading ? 'Starting...' : `Play Quiz about ${country || 'this country'}`}</Button>;
}
