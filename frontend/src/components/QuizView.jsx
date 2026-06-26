import { useState, useEffect } from 'react';
import { generateQuiz, submitAttempt } from '../api.js';

export default function QuizView({ noteId, topic }) {
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState(null); // { correct: bool }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!noteId || !topic) return;
    setLoading(true);
    setError(null);
    setIndex(0);
    setResult(null);
    generateQuiz(noteId, topic)
      .then((data) => setQuestions(data ?? []))
      .catch(() => setError('Failed to load quiz.'))
      .finally(() => setLoading(false));
  }, [noteId, topic]);

  async function handleSelect(option) {
    const question = questions[index];
    const data = await submitAttempt(question.id, option);
    setResult({ correct: data.isCorrect });
  }

  function handleNext() {
    setResult(null);
    setIndex((i) => i + 1);
  }

  if (loading) return <p className="quiz__loading">Loading quiz...</p>;
  if (error) return <p className="quiz__error">{error}</p>;
  if (questions.length === 0) return null;
  if (index >= questions.length) return <p className="quiz__complete">Quiz complete!</p>;

  const question = questions[index];

  return (
    <div className="quiz">
      <p className="quiz__counter">{index + 1} / {questions.length}</p>
      <p className="quiz__question">{question.question}</p>
      <ul className="quiz__options">
        {question.options.map((option) => (
          <li key={option} className="quiz__option-item">
            <button
              className="quiz__option-btn"
              onClick={() => handleSelect(option)}
              disabled={result !== null}
            >
              {option}
            </button>
          </li>
        ))}
      </ul>

      {result !== null && (
        <div className={result.correct ? 'quiz__feedback quiz__feedback--correct' : 'quiz__feedback quiz__feedback--incorrect'}>
          {result.correct ? 'Correct!' : 'Incorrect.'}
          <button className="quiz__next-btn" onClick={handleNext}>Next</button>
        </div>
      )}
    </div>
  );
}
