import React, { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useParams, useNavigate } from 'react-router-dom';
import { generateQuizForTopic } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const QuizCountry = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // no-op
  }, [slug]);

  const { toast } = useToast();

  const startQuiz = async () => {
    setLoading(true);
    try {
      toast?.({ title: 'Generating quiz', description: `Generating quiz for ${slug}...` });
      const questions = await generateQuizForTopic(slug, 10);
      localStorage.setItem('currentQuiz', JSON.stringify(questions));
      navigate('/quiz?autoStart=1');
      toast?.({ title: 'Quiz ready', description: 'Quiz generated and starting now.' });
    } catch (e) {
      console.error(e);
      toast?.({ title: 'Error', description: 'Failed to generate quiz. Try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">Go Back</Button>
          <h1 className="text-3xl font-bold mb-6">Quiz: {slug}</h1>
          <Card className="p-6 text-center">
            <p className="mb-4">Start a quiz about {slug}</p>
            <Button variant="hero" onClick={startQuiz} disabled={loading}>{loading ? 'Starting...' : 'Play Quiz'}</Button>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default QuizCountry;
