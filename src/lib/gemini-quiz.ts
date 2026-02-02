/**
 * Gemini-based quiz generation helper
 * Generates quiz questions using Google Gemini API
 */

interface QuizGenerationConfig {
  factTypeId: string;
  factTypeName: string;
  categoryId?: string;
  categoryName?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  country?: string;
  difficulty: string;
  questionCount: number;
}

interface GeneratedQuestion {
  question: string;
  options: string[];
  correct_answer: string;
}

interface GeneratedQuiz {
  question: string;
  options: string[];
  correct_answer: string;
  fact_type_id: string;
  category_id?: string;
  country?: string;
  difficulty: string;
}

/**
 * Generate quiz questions using Gemini API
 * Returns an array of questions in the required format
 */
export async function generateQuizWithGemini(
  config: QuizGenerationConfig
): Promise<GeneratedQuiz[]> {
  // Gemini API key is no longer used client-side. Use the Edge Function instead.

  // Build the prompt based on selected fields
  const contextParts: string[] = [`Fact Type: ${config.factTypeName}`];

  if (config.categoryName) {
    contextParts.push(`Category: ${config.categoryName}`);
  }

  if (config.subcategoryName) {
    contextParts.push(`Subcategory: ${config.subcategoryName}`);
  }

  if (config.country) {
    contextParts.push(`Country: ${config.country}`);
  }

  contextParts.push(`Difficulty: ${config.difficulty}`);
  contextParts.push(`Number of Questions: ${config.questionCount}`);

  const context = contextParts.join('\n');

  const prompt = `You are an expert quiz generator. Generate exactly ${config.questionCount} multiple-choice quiz questions based on the following context:

${context}

REQUIREMENTS:

RESPONSE FORMAT (JSON ONLY, no markdown):
{
  "questions": [
    {
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A"
    }
  ]
}

Generate the quiz now:`;

  try {
    // Gemini API fetch removed. Use the Edge Function instead.
  } catch (error: unknown) {
    try { const { default: log } = await import('@/lib/logger'); log.error('Gemini quiz generation error:', error); } catch (_e) { /* ignored - logging best-effort */ }
    throw error;
  }
    // Gemini API calls must now be made via the Edge Function (generate-content)
    // This function is deprecated and will throw if called directly.
    throw new Error('generateQuizWithGemini is deprecated. Use the Edge Function (generate-content) via generateQuizzesWithUniqueness in api.ts.');
}
