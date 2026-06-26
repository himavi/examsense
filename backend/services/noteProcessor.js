import { callAI } from './aiClient.js';

export async function cleanNotes(rawText) {
  const prompt = `You are a note-cleaning assistant. Take the following messy lecture notes and return ONLY a valid JSON array with no markdown, no code fences, and no preamble. Each item must have exactly two fields: "title" (a short topic name) and "summary" (a cleaned bullet-point style summary of that topic). Output nothing except the JSON array.

Notes:
${rawText}`;

  const raw = await callAI(prompt);
  const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to parse AI response into topics');
  }
}
