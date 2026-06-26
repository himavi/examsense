import { callAI } from './aiClient.js';

export async function generateQuestions(topic, existingQuestionTexts = []) {
  const avoidSection = existingQuestionTexts.length > 0
    ? `\nAvoid duplicating or closely rephrasing these existing questions:\n${existingQuestionTexts.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n`
    : '';

  const prompt = `You are a quiz generator. Generate exactly 5 multiple-choice questions based on the topic below. Return ONLY a valid JSON array with no markdown, no code fences, and no preamble. Each item must have exactly three fields: "question" (string), "options" (array of exactly 4 strings), and "correctAnswer" (string that matches one of the options exactly).${avoidSection}

Topic: ${topic.title}
${topic.summary}`;

  const raw = await callAI(prompt);
  let cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start !== -1 && end !== -1) cleaned = cleaned.slice(start, end + 1);

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to parse quiz questions');
  }
}
