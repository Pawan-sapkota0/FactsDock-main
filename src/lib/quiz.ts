import { supabase } from '@/integrations/supabase/client';

export async function generateQuiz(topic: string | undefined, questionCount = 10) {
  const body: any = {
    type: 'quiz',
    // backend expects a 'country' field for quiz generation; pass topic as a best-effort
    country: topic || 'world geography',
    questionCount,
  };

  const { data, error } = await supabase.functions.invoke('generate-content', {
    body,
  });

  if (error) throw error;
  return data?.data || [];
}
