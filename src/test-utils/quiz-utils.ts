export function validateQuizPayload(body:any) {
  const errors: string[] = [];
  const q = body.questions;
  if (!Array.isArray(q)) {
    errors.push('questions must be an array');
  } else if (q.length === 0) {
    errors.push('at least one question is required');
  } else {
    q.forEach((item: any, idx: number) => {
      if (typeof item.q !== 'string' || item.q.trim().length === 0) errors.push(`question[${idx}].q must be a non-empty string`);
      if (!Array.isArray(item.options) || item.options.length < 2) errors.push(`question[${idx}].options must be an array with at least 2 items`);
      if (typeof item.answer !== 'number' || item.answer < 0 || item.answer >= (Array.isArray(item.options) ? item.options.length : 0)) errors.push(`question[${idx}].answer must be a valid option index`);
    });
  }
  return { ok: errors.length===0, errors };
}
