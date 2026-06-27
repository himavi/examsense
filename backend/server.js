import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { callAI } from './services/aiClient.js';
import { cleanNotes } from './services/noteProcessor.js';
import { generateQuestions } from './services/quizGenerator.js';
import notesRouter from './routes/notes.js';
import quizRouter from './routes/quiz.js';

dotenv.config();

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ExamSense backend running' });
});

app.use('/api/notes', notesRouter);
app.use('/api/quiz', quizRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
