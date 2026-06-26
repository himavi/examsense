import { Router } from 'express';
import db from '../db/db.js';
import { cleanNotes } from '../services/noteProcessor.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { rawText } = req.body;
    const topics = await cleanNotes(rawText);
    const { lastInsertRowid } = db.prepare(
      'INSERT INTO notes (raw_text, topics_json) VALUES (?, ?)'
    ).run(rawText, JSON.stringify(topics));
    res.json({ noteId: lastInsertRowid, topics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
