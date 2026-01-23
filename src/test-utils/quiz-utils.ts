export function validateQuizPayload(body: unknown) {
  const errors: string[] = [];
  const bodyObj = (body as Record<string, unknown>) ?? {};
  const q = bodyObj.questions;
  if (!Array.isArray(q)) {
    errors.push('questions must be an array');
  } else if (q.length === 0) {
    errors.push('at least one question is required');
  } else {
    q.forEach((item: unknown, idx: number) => {
      const itemObj = (item as Record<string, unknown>) ?? {};
      if (typeof itemObj.q !== 'string' || (String(itemObj.q ?? "")).trim().length === 0) errors.push(`question[${idx}].q must be a non-empty string`);
      if (!Array.isArray(itemObj.options) || itemObj.options.length < 2) errors.push(`question[${idx}].options must be an array with at least 2 items`);
      if (typeof itemObj.answer !== 'number' || Number(itemObj.answer) < 0 || Number(itemObj.answer) >= (Array.isArray(itemObj.options) ? itemObj.options.length : 0)) errors.push(`question[${idx}].answer must be a valid option index`);
    });
  }
  return { ok: errors.length===0, errors };
}
