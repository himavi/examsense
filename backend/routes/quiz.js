import { Router } from 'express';
import db, { rowId, plainRows } from '../db/db.js';
import { generateQuestions, explainWeakTopic } from '../services/quizGenerator.js';

const router = Router();

router.post('/generate', async (req, res) => {
  try {
    const { noteId, topic } = req.body;
    const existing = await db.execute({
      sql: 'SELECT question_text FROM questions WHERE note_id = ? AND topic_title = ?',
      args: [noteId, topic.title],
    });
    const existingQuestionTexts = existing.rows.map(r => r.question_text);

    const questions = await generateQuestions(topic, existingQuestionTexts);

    const results = await db.batch(
      questions.map(q => ({
        sql: 'INSERT INTO questions (note_id, topic_title, question_text, options_json, correct_answer) VALUES (?, ?, ?, ?, ?)',
        args: [noteId, topic.title, q.question, JSON.stringify(q.options), q.correctAnswer],
      })),
      'write'
    );
    const inserted = questions.map((q, i) => ({ id: rowId(results[i]), ...q }));

    res.json(inserted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/attempt', async (req, res) => {
  try {
    const { questionId, userAnswer } = req.body;
    const { rows: [question] } = await db.execute({
      sql: 'SELECT correct_answer FROM questions WHERE id = ?',
      args: [questionId],
    });

    const isCorrect = question.correct_answer === userAnswer ? 1 : 0;
    await db.execute({
      sql: 'INSERT INTO attempts (question_id, user_answer, is_correct) VALUES (?, ?, ?)',
      args: [questionId, userAnswer, isCorrect],
    });

    res.json({ isCorrect: isCorrect === 1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/weak-topics/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    const { rows } = await db.execute({
      sql: `
      SELECT q.topic_title AS topic,
             COUNT(a.id) AS total,
             SUM(CASE WHEN a.is_correct = 0 THEN 1 ELSE 0 END) AS wrong
      FROM questions q
      JOIN attempts a ON a.question_id = q.id
      WHERE q.note_id = ?
      GROUP BY q.topic_title
    `,
      args: [noteId],
    });

    const result = rows.map(r => ({
      topic: r.topic,
      accuracy: r.total > 0 ? (r.total - r.wrong) / r.total : 1,
    })).sort((a, b) => a.accuracy - b.accuracy);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/explain/:topic', async (req, res) => {
  try {
    const { topic: topicTitle } = req.params;
    const wrongQuestions = plainRows(await db.execute({
      sql: `
      SELECT q.question_text, q.correct_answer
      FROM questions q
      JOIN attempts a ON a.question_id = q.id
      WHERE a.is_correct = 0 AND q.topic_title = ?
    `,
      args: [topicTitle],
    }));

    if (wrongQuestions.length === 0) {
      return res.json({ explanation: null });
    }

    const explanation = await explainWeakTopic(topicTitle, wrongQuestions);
    res.json({ explanation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;