// Simple mock data generator for local development when Supabase is not configured
export function generateMockFacts(category: string, count = 50) {
  const items = [];
  for (let i = 1; i <= count; i++) {
    items.push({
      title: `${category} Fact #${i}`,
      fact: `This is a mock fact for ${category}. Example detail ${i}.`,
      description: `Detailed mock description for ${category} fact ${i}.`,
    });
  }
  return items;
}

export function generateMockQuiz(topic = 'General', count = 10) {
  const qs = [];
  for (let i = 1; i <= count; i++) {
    const options = [`Option A${i}`, `Option B${i}`, `Option C${i}`, `Option D${i}`];
    qs.push({ question: `${topic} mock question ${i}?`, options, answer: options[i % options.length] });
  }
  return qs;
}

export default {
  generateMockFacts,
  generateMockQuiz,
};
