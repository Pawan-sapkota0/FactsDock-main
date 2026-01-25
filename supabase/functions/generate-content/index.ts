import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ========== UNIQUENESS CHECKING UTILITIES ==========
function normalizeForComparison(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, '').trim();
}

function levenshteinDistance(a: string, b: string): number {
  const aLen = a.length, bLen = b.length;
  const dp: number[][] = Array.from({ length: aLen + 1 }, () => Array(bLen + 1).fill(0));
  for (let i = 0; i <= aLen; i++) dp[i][0] = i;
  for (let j = 0; j <= bLen; j++) dp[0][j] = j;
  for (let i = 1; i <= aLen; i++) {
    for (let j = 1; j <= bLen; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[aLen][bLen];
}

function calculateSimilarity(a: string, b: string): number {
  const normalized1 = normalizeForComparison(a);
  const normalized2 = normalizeForComparison(b);
  const maxLen = Math.max(normalized1.length, normalized2.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(normalized1, normalized2);
  return 1 - (distance / maxLen);
}

async function checkQuizUniqueness(
  question: string,
  supaUrl: string,
  svcKey: string
): Promise<{ isUnique: boolean; duplicateCount: number; potentialMatches: unknown[]; similarity?: number }> {
  try {
    const headers = {
      'apikey': svcKey,
      'Authorization': `Bearer ${svcKey}`,
      'Content-Type': 'application/json'
    };
    
    const url = `${supaUrl}/rest/v1/quizzes?select=questions`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.warn('[checkQuizUniqueness] Failed to fetch existing quizzes');
      return { isUnique: true, duplicateCount: 0, potentialMatches: [] };
    }

    const existingQuizzes = (await res.json()) as unknown[];
    const potentialMatches: unknown[] = [];
    
    for (const quiz of existingQuizzes) {
      const quizRecord = quiz as Record<string, unknown>;
      const questionsJson = quizRecord.questions;
      if (!questionsJson) continue;
      
      try {
        const questions = typeof questionsJson === 'string' ? JSON.parse(questionsJson) : questionsJson;
        if (Array.isArray(questions)) {
          for (const q of questions) {
            const qRecord = q as Record<string, unknown>;
            const existingQuestion = qRecord.question as string;
            if (!existingQuestion) continue;
            
            const similarity = calculateSimilarity(question, existingQuestion);
            if (similarity > 0.8) {
              potentialMatches.push({ similarity, text: existingQuestion.substring(0, 60) });
            }
          }
        }
      } catch (e) {
        console.error('[checkQuizUniqueness] Failed to parse questions:', e);
      }
    }

    return {
      isUnique: potentialMatches.length === 0,
      duplicateCount: potentialMatches.length,
      potentialMatches
    };
  } catch (e) {
    console.error('[checkQuizUniqueness] Error:', e);
    return { isUnique: true, duplicateCount: 0, potentialMatches: [] };
  }
}
// ========== END UNIQUENESS CHECKING =========

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { type, country, category, fact_type_name, subcategory, difficulty = "medium", questionCount = 5, checkUniqueness = false } = await req.json();

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash-lite';
    const supaUrl = Deno.env.get('SUPABASE_URL') as string;
    const svcRole = Deno.env.get('SUPABASE_SERVICE_ROLE') || Deno.env.get('service_role') || Deno.env.get('SERVICE_ROLE');
    
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'Server not configured' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let prompt = '';
    
    if (type === 'quiz') {
      prompt = `Generate ${questionCount} multiple-choice quiz questions about ${country || 'the world'}.

CONTEXT - Generate questions ONLY matching these criteria:
- Fact Type: ${fact_type_name || 'General'}
- Category: ${category || 'General'}
${subcategory ? `- Subcategory: ${subcategory}` : ''}
- Difficulty: ${difficulty || 'medium'}
${country ? `- Country/Region: ${country}` : ''}

REQUIREMENTS:
- Each question MUST match the Fact Type: ${fact_type_name || 'General'}
- Each question MUST match the Category: ${category || 'General'}${subcategory ? ` and Subcategory: ${subcategory}` : ''}${country ? ` and be specific to ${country}` : ''}
- Difficulty level MUST be: ${difficulty || 'medium'}
- Each question must have exactly 4 options (A, B, C, D)
- Only ONE correct answer per question
- The correct answer can be any of the 4 options
- Keep questions concise (under 15 words)
- Make questions challenging but fair according to difficulty:
  - easy: basic knowledge, simple facts
  - medium: requires some thinking or awareness
  - hard: detailed, less-known facts
- Do NOT generate questions about other categories, types, countries, or difficulty levels
- Ensure all questions are unique and not repetitive
- Ensure all questions are human-friendly and use simple words 
- Return ONLY a JSON array, no markdown or explanation

Example format:
[
  {
    "question": "What is the capital of France?",
    "options": ["London", "Paris", "Berlin", "Madrid"],
    "correctAnswer": 1
  }
]`;
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid type. Use: quiz' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let generated: string | null = null;
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY as string);
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SDK response object from Google Generative AI
      const gres: any = await model.generateContent(prompt);
      if (gres?.response && typeof gres.response.text === 'function') {
        generated = await gres.response.text();
      } else if (typeof gres === 'string') {
        generated = gres;
      }
    } catch (e: unknown) {
      console.error('Gemini generation error', e);
      return new Response(JSON.stringify({ error: 'AI generation failed' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!generated) {
      console.error('AI response missing content');
      return new Response(JSON.stringify({ error: 'AI returned no content' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const stripCodeFences = (s: string) => {
      // Remove markdown code fences: ```json ... ``` or ``` ... ```
      return s.replace(/^```(?:json|typescript|javascript)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    };
    const extractJsonLike = (s: string) => {
      // First try to extract from code fences
      const fenceMatch = s.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/i);
      if (fenceMatch && fenceMatch[1]) return fenceMatch[1].trim();
      // Then look for JSON array
      const arrayMatch = s.match(/\[([\s\S]*)\]/);
      if (arrayMatch) return '[' + arrayMatch[1] + ']';
      // Then look for JSON object
      const objMatch = s.match(/\{([\s\S]*)\}/);
      if (objMatch) return '{' + objMatch[1] + '}';
      return s;
    };

    let parsedContent;
    const candidate = extractJsonLike(stripCodeFences(String(generated)));
    try {
      parsedContent = JSON.parse(candidate);
    } catch (parseError) {
      try {
        parsedContent = JSON.parse(generated);
      } catch (e2) {
        console.error('Failed to parse AI response:', generated);
        return new Response(JSON.stringify({ error: 'Invalid AI response format' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Validate parsed content is an array
    if (!Array.isArray(parsedContent) || parsedContent.length === 0) {
      console.error('Parsed content is not a valid array or is empty:', parsedContent);
      return new Response(JSON.stringify({ error: 'No questions generated' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ========== UNIQUENESS CHECKING FOR QUIZZES ==========
    let uniquenessReport = null;
    if (type === 'quiz' && checkUniqueness && Array.isArray(parsedContent) && supaUrl && svcRole) {
      const uniqueQuestions = [];
      const duplicates = [];

      for (const item of parsedContent) {
        const itemRecord = item as Record<string, unknown>;
        const question = itemRecord.question as string || '';
        const result = await checkQuizUniqueness(question, supaUrl, svcRole);

        if (result.isUnique) {
          uniqueQuestions.push(item);
        } else {
          duplicates.push({
            text: question.substring(0, 100),
            duplicateCount: result.duplicateCount,
            matches: result.potentialMatches.map((m) => {
              const matchRecord = m as Record<string, unknown>;
              return { similarity: matchRecord.similarity as number, text: matchRecord.text as string };
            })
          });
        }
      }

      uniquenessReport = {
        totalGenerated: parsedContent.length,
        uniqueCount: uniqueQuestions.length,
        duplicateCount: duplicates.length,
        duplicates,
        timestamp: new Date().toISOString()
      };

      if (uniqueQuestions.length === 0) {
        return new Response(
          JSON.stringify({
            error: 'All generated questions are duplicates',
            uniquenessReport
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      parsedContent = uniqueQuestions;
    }

    // Return format: for quizzes with uniqueness checking, return both quizzes and report
    // Otherwise return standard data format for backward compatibility
    if (type === 'quiz') {
      return new Response(
        JSON.stringify({ quizzes: parsedContent, uniquenessReport }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ data: parsedContent }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in generate-content function:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
