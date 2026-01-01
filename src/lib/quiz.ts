import { generateQuizForTopic } from './api';

export async function generateQuiz(topic: string | undefined, questionCount = 10) {
  // Always request a fresh quiz set when generating
  const normalized = await generateQuizForTopic(topic, questionCount, { force: true });
  return normalized;
}
