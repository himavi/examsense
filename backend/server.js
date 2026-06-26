import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { callAI } from './services/aiClient.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ExamSense backend running' });
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
});
