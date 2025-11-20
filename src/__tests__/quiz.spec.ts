import { describe, it, expect } from 'vitest';

import { validateQuizPayload } from '../test-utils/quiz-utils';

describe('quiz payload validation helper', () => {
  it('rejects empty questions array', () => {
    const payload = { questions: [] };
    const res = validateQuizPayload(payload);
    expect(res.ok).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
  });

  it('accepts a minimal valid question', () => {
    const payload = { questions: [{ q: 'X', options: ['a','b'], answer: 0 }] };
    const res = validateQuizPayload(payload);
    expect(res.ok).toBe(true);
  });
});
