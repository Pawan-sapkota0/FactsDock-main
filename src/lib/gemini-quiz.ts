/**
 * Gemini-based quiz generation helper
 * Generates quiz questions using Google Gemini API
 */

interface QuizGenerationConfig {
  factTypeId: string;
  factTypeName: string;
  categoryId?: string;
  categoryName?: string;
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
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY as string;
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured');
  }

  // Build the prompt based on selected fields
  let contextParts = [
    `Fact Type: ${config.factTypeName}`,
  ];

  if (config.categoryName) {
    contextParts.push(`Category: ${config.categoryName}`);
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
- Each question must be unique and educational
- Each question must have exactly 4 options (A, B, C, D)
- Exactly one option must be the correct answer
- The correct answer can be any of the 4 options
- Content must strictly match the fact type${config.categoryName ? ', category' : ''}${config.country ? ', and country' : ''} specified
- Difficulty level must be ${config.difficulty}
- Questions must be factual and accurate

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
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + geminiApiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Gemini API error');
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text) {
      throw new Error('No response from Gemini');
    }

    // Parse the JSON response (strip markdown code blocks if present)
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonStr);
    const questions = parsed.questions || [];

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('No valid questions in Gemini response');
    }

    // Validate and transform questions
    const validQuestions: GeneratedQuiz[] = questions
      .filter((q: any) => {
        return (
          q.question &&
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          q.correct_answer &&
          q.options.includes(q.correct_answer)
        );
      })
      .map((q: any) => ({
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
        fact_type_id: config.factTypeId,
        category_id: config.categoryId,
        country: config.country,
        difficulty: config.difficulty,
      }));

    if (validQuestions.length === 0) {
      throw new Error('No valid questions generated');
    }

    return validQuestions;
  } catch (error: any) {
    console.error('Gemini quiz generation error:', error);
    throw error;
  }
}
