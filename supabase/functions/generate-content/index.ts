import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { type, country, category, questionCount = 5 } = await req.json();
    console.log('Generating content:', { type, country, category, questionCount });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let prompt = '';
    
    if (type === 'quiz') {
      prompt = `Generate ${questionCount} multiple-choice quiz questions about ${country || 'world geography'}. 
      Each question should have 4 options and indicate the correct answer.
      Return the response as a JSON array with this structure:
      [
        {
          "question": "Question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0
        }
      ]
      Make the questions challenging but fair. Cover diverse topics like geography, culture, history, and facts.`;
    } else if (type === 'fun-facts') {
      prompt = `Generate 5 interesting and surprising fun facts about ${category || 'world'}. 
      Return the response as a JSON array with this structure:
      [
        {
          "title": "Short catchy title",
          "fact": "The full interesting fact",
          "category": "${category || 'general'}"
        }
      ]
      Make the facts educational, entertaining, and verified.`;
    } else if (type === 'world-facts') {
      prompt = `Generate 5 important and educational facts about world ${category || 'geography'}.
      Return the response as a JSON array with this structure:
      [
        {
          "title": "Fact title",
          "description": "Detailed description",
          "category": "${category || 'geography'}"
        }
      ]
      Focus on educational content that's globally relevant.`;
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid type. Use: quiz, fun-facts, or world-facts' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful assistant that generates educational content. Always respond with valid JSON only, no additional text.' 
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error('AI generation failed');
    }

    const aiResponse = await response.json();
    const generatedContent = aiResponse.choices[0].message.content;
    
    // Parse the JSON response
    let parsedContent;
    try {
      parsedContent = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', generatedContent);
      throw new Error('Invalid AI response format');
    }

    console.log('Successfully generated content');

    return new Response(
      JSON.stringify({ data: parsedContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-content function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
