import { generateQuizForTopic } from './api';

export async function generateQuiz(topic: string | undefined, questionCount = 10) {
  const normalized = await generateQuizForTopic(topic, questionCount);
  return normalized;
}
