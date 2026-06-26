import { useState, useEffect } from 'react';
import { generateQuiz, submitAttempt } from '../api.js';

export default function QuizView({ noteId, topic, onFinish }) {
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!noteId || !topic) return;
    setLoading(true);
    setError(null);
    setIndex(0);
    setResult(null);
    setSelected(null);
    setScore(0);
    generateQuiz(noteId, topic)
      .then((data) => setQuestions(data ?? []))
      .catch(() => setError('Failed to load quiz. Please try again.'))
      .finally(() => setLoading(false));
  }, [noteId, topic]);

  async function handleSelect(option) {
    if (result !== null) return;
    setSelected(option);
    const question = questions[index];
    const data = await submitAttempt(question.id, option);
    setResult({ correct: data.isCorrect });
    if (data.isCorrect) setScore((s) => s + 1);
  }

  function handleNext() {
    setResult(null);
    setSelected(null);
    setIndex((i) => i + 1);
  }

  if (loading) return (
    <div className="quiz__loading">
      <div className="quiz__spinner" />
      <p>Building your quiz…</p>
    </div>
  );

  if (error) return <p className="quiz__error">{error}</p>;
  if (questions.length === 0) return null;

  if (index >= questions.length) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="quiz__complete">
        <div className="quiz__complete-icon">{pct >= 70 ? '🎯' : '📚'}</div>
        <p className="quiz__complete-title">
          {pct >= 70 ? 'Great work!' : 'Keep studying!'}
        </p>
        <p className="quiz__complete-score">{pct}%</p>
        <p className="quiz__complete-sub">
          {score} of {questions.length} correct on {topic.title}
        </p>
        {onFinish && (
          <button className="btn-primary" onClick={onFinish}>
            View Progress →
          </button>
        )}
      </div>
    );
  }

  const question = questions[index];
  const progress = ((index) / questions.length) * 100;

  return (
    <div className="quiz">
      <div className="page-heading">
        <h1 className="page-heading__title">{topic?.title}</h1>
      </div>

      <div className="quiz__progress-bar">
        <div className="quiz__progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="quiz__meta">
        <span className="quiz__counter">Question {index + 1} of {questions.length}</span>
        <span className="quiz__score-badge">{score} correct</span>
      </div>

      <p className="quiz__question">{question.question}</p>

      <ul className="quiz__options">
        {question.options.map((option) => {
          let cls = 'quiz__option-btn';
          if (result !== null && option === selected) {
            cls += result.correct ? ' correct' : ' incorrect';
          }
          return (
            <li key={option}>
              <button
                className={cls}
                onClick={() => handleSelect(option)}
                disabled={result !== null}
              >
                <span className="quiz__option-dot" />
                {option}
              </button>
            </li>
          );
        })}
      </ul>

      {result !== null && (
        <div className={`quiz__feedback ${result.correct ? 'quiz__feedback--correct' : 'quiz__feedback--incorrect'}`}>
          <span>{result.correct ? '✓ Correct!' : '✗ Incorrect'}</span>
          <button className="quiz__next-btn" onClick={handleNext}>
            {index + 1 < questions.length ? 'Next →' : 'See Results →'}
          </button>
        </div>
      )}
    </div>
  );
}
