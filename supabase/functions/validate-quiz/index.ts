// Supabase Edge Function (Deno) - validate quiz payload
// This is a template you can deploy to Supabase functions. It expects a JSON body:
// { country?, difficulty?, category_id?, subcategory_id?, questions: [ { q: string, options: [string], answer: number } ] }

export default async (req: Request) => {
  try {
    const body = await req.json();
    const errors: string[] = [];
    const q = body.questions;
    if (!Array.isArray(q)) {
      errors.push('questions must be an array');
    } else if (q.length === 0) {
      errors.push('at least one question is required');
    } else {
      q.forEach((item: Record<string, unknown>, idx: number) => {
        if (typeof item.q !== 'string' || item.q.trim().length === 0) errors.push(`question[${idx}].q must be a non-empty string`);
        if (!Array.isArray(item.options) || item.options.length < 2) errors.push(`question[${idx}].options must be an array with at least 2 items`);
        if (typeof item.answer !== 'number' || item.answer < 0 || item.answer >= (Array.isArray(item.options) ? item.options.length : 0)) errors.push(`question[${idx}].answer must be a valid option index`);
      });
    }

    if (errors.length > 0) {
      return new Response(JSON.stringify({ ok: false, errors }), { status: 400, headers: { 'content-type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, errors: [String(e)] }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
};
