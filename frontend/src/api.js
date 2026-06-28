const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function createNote(rawText) {
  const res = await fetch(`${BASE}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawText }),
  });
  return res.json();
}

export async function generateQuiz(noteId, topic) {
  const res = await fetch(`${BASE}/quiz/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ noteId, topic }),
  });
  return res.json();
}

export async function submitAttempt(questionId, userAnswer) {
  const res = await fetch(`${BASE}/quiz/attempt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questionId, userAnswer }),
  });
  return res.json();
}

export async function getWeakTopics(noteId) {
  const res = await fetch(`${BASE}/quiz/weak-topics/${noteId}`);
  return res.json();
}

export async function getUsageAreas() {
  const res = await fetch(`${BASE}/geo/areas`);
  return res.json();
}
