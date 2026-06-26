import { Router } from 'express';
import db from '../db/db.js';
import { generateQuestions } from '../services/quizGenerator.js';

const router = Router();

router.post('/generate', async (req, res) => {
  try {
    const { noteId, topic } = req.body;
    const existing = db.prepare(
      'SELECT question_text FROM questions WHERE note_id = ? AND topic_title = ?'
    ).all(noteId, topic.title);
    const existingQuestionTexts = existing.map(r => r.question_text);

    const questions = await generateQuestions(topic, existingQuestionTexts);

    const insert = db.prepare(
      'INSERT INTO questions (note_id, topic_title, question_text, options_json, correct_answer) VALUES (?, ?, ?, ?, ?)'
    );
    const inserted = questions.map(q => {
      const { lastInsertRowid } = insert.run(
        noteId,
        topic.title,
        q.question,
        JSON.stringify(q.options),
        q.correctAnswer
      );
      return { id: lastInsertRowid, ...q };
    });

    res.json(inserted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/attempt', async (req, res) => {
  try {
    const { questionId, userAnswer } = req.body;
    const question = db.prepare(
      'SELECT correct_answer FROM questions WHERE id = ?'
    ).get(questionId);

    const isCorrect = question.correct_answer === userAnswer ? 1 : 0;
    db.prepare(
      'INSERT INTO attempts (question_id, user_answer, is_correct) VALUES (?, ?, ?)'
    ).run(questionId, userAnswer, isCorrect);

    res.json({ isCorrect: isCorrect === 1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/weak-topics/:noteId', (req, res) => {
  try {
    const { noteId } = req.params;
    const rows = db.prepare(`
      SELECT q.topic_title AS topic,
             COUNT(a.id) AS total,
             SUM(CASE WHEN a.is_correct = 0 THEN 1 ELSE 0 END) AS wrong
      FROM questions q
      JOIN attempts a ON a.question_id = q.id
      WHERE q.note_id = ?
      GROUP BY q.topic_title
    `).all(noteId);

    const result = rows.map(r => ({
      topic: r.topic,
      accuracy: r.total > 0 ? (r.total - r.wrong) / r.total : 1,
    })).sort((a, b) => a.accuracy - b.accuracy);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
