import { supabase } from '@/integrations/supabase/client';

export async function fetchCountryByName(countryName: string) {
  const { data, error } = await supabase.functions.invoke('fetch-country-data', {
    body: { countryName }
  });
  if (error) throw error;
  return data?.data || [];
}

export async function fetchFactsByCategory(type: 'fun-facts' | 'world-facts', category: string) {
  const { data, error } = await supabase.functions.invoke('generate-content', {
    body: { type, category }
  });
  if (error) throw error;
  return data?.data || [];
}

export async function generateQuizForTopic(topic?: string, questionCount = 10) {
  const { data, error } = await supabase.functions.invoke('generate-content', {
    body: { type: 'quiz', country: topic || 'world geography', questionCount }
  });
  if (error) throw error;
  return data?.data || [];
}
