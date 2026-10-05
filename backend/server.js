import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { callAI } from './services/aiClient.js';
import { cleanNotes } from './services/noteProcessor.js';
import { generateQuestions } from './services/quizGenerator.js';
import notesRouter from './routes/notes.js';
import quizRouter from './routes/quiz.js';
import geoRouter from './routes/geo.js';
import { initDb } from './db/db.js';

dotenv.config();

const app = express();

app.set('trust proxy', true);
app.use(cors({ origin: "*" }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ExamSense backend running' });
});

app.use('/api/notes', notesRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/geo', geoRouter);

const PORT = process.env.PORT || 5000;

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      keepAwake();
    });
  })
  .catch((err) => {
    console.error('Database initialisation failed:', err);
    process.exit(1);
  });

// Render's free plan sleeps a service after 15 minutes without inbound traffic.
// A request to our own public URL counts as traffic, so once awake we stay awake.
// RENDER_EXTERNAL_URL is set by Render automatically; locally this does nothing.
function keepAwake() {
  const url = process.env.RENDER_EXTERNAL_URL;
  if (!url) return;
  setInterval(() => {
    fetch(url).catch(() => {});
  }, 10 * 60 * 1000);
}
