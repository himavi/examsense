import { useState, useEffect, useRef } from 'react';
import { generateQuiz, submitAttempt } from '../api.js';
import { AiWorking, Icon, Skeleton, Spinner } from './ui';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

function ScoreRing({ pct }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const tone = pct >= 70 ? 'good' : pct >= 40 ? 'warning' : 'danger';
  return (
    <div className={`score-ring score-ring--${tone}`}>
      <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
        <circle className="score-ring__track" cx="60" cy="60" r={r} />
        <circle
          className="score-ring__value"
          cx="60"
          cy="60"
          r={r}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
        />
      </svg>
      <span className="score-ring__label">
        <span className="score-ring__pct">{pct}%</span>
        <span className="score-ring__caption">score</span>
      </span>
    </div>
  );
}

export default function QuizView({ noteId, topic, onFinish, onPickAnother }) {
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);
  const [attemptError, setAttemptError] = useState(null);
  const [history, setHistory] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);

  const questionRef = useRef(null);
  const nextRef = useRef(null);
  const optionRefs = useRef([]);

  useEffect(() => {
    if (!noteId || !topic) return;
    setLoading(true);
    setError(null);
    setIndex(0);
    setResult(null);
    setSelected(null);
    setScore(0);
    setHistory([]);
    setAttemptError(null);
    generateQuiz(noteId, topic)
      .then((data) => {
        if (Array.isArray(data)) setQuestions(data);
        else {
          setQuestions([]);
          setError(data?.error ? `The quiz generator returned an error: ${data.error}` : 'Failed to load quiz. Please try again.');
        }
      })
      .catch(() => setError('Failed to load quiz. Please try again.'))
      .finally(() => setLoading(false));
  }, [noteId, topic, reloadKey]);

  // Move focus to the question whenever a new one is shown, so it is announced.
  useEffect(() => {
    if (!loading && questions.length > 0 && index < questions.length) {
      questionRef.current?.focus({ preventScroll: true });
    }
  }, [index, loading, questions.length]);

  // After answering, hand focus to the "Next" button so Enter continues.
  useEffect(() => {
    if (result !== null) nextRef.current?.focus({ preventScroll: true });
  }, [result]);

  async function handleSelect(option) {
    if (result !== null || checking) return;
    setSelected(option);
    setChecking(true);
    setAttemptError(null);
    const question = questions[index];
    try {
      const data = await submitAttempt(question.id, option);
      if (!data || typeof data.isCorrect !== 'boolean') throw new Error('bad response');
      setResult({ correct: data.isCorrect });
      if (data.isCorrect) setScore((s) => s + 1);
      setHistory((h) => [
        ...h,
        { question: question.question, selected: option, correct: data.isCorrect, answer: question.correctAnswer },
      ]);
    } catch {
      setSelected(null);
      setAttemptError('Your answer could not be saved. Please choose again.');
    } finally {
      setChecking(false);
    }
  }

  function handleNext() {
    setResult(null);
    setSelected(null);
    setIndex((i) => i + 1);
  }

  // Keyboard: 1–4 or A–D picks an option; arrow keys move between options.
  useEffect(() => {
    function onKey(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const q = questions[index];
      if (!q || result !== null || checking) return;
      const key = e.key.toUpperCase();
      let i = -1;
      if (/^[1-9]$/.test(key)) i = Number(key) - 1;
      else if (LETTERS.includes(key)) i = LETTERS.indexOf(key);
      if (i >= 0 && i < q.options.length) {
        e.preventDefault();
        optionRefs.current[i]?.focus();
        handleSelect(q.options[i]);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function onOptionKeyDown(e, i, count) {
    let next = null;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (i + 1) % count;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (i - 1 + count) % count;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = count - 1;
    if (next !== null) {
      e.preventDefault();
      optionRefs.current[next]?.focus();
    }
  }

  if (loading) {
    return (
      <div className="quiz" aria-busy="true">
        <header className="page-heading">
          <p className="eyebrow">Quiz</p>
          <h1 className="page-heading__title">{topic?.title}</h1>
        </header>
        <AiWorking
          announce={`Writing five questions on ${topic?.title ?? 'this topic'}. This usually takes a few seconds.`}
          steps={['Reading the topic summary…', 'Drafting questions…', 'Checking answer options…']}
        />
        <div className="quiz-card card" aria-hidden="true">
          <Skeleton width="30%" height={10} />
          <Skeleton width="85%" height={22} className="skeleton--title" />
          <Skeleton width="60%" height={22} />
          <div className="quiz-card__options">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="option option--skeleton">
                <Skeleton width={28} height={28} />
                <Skeleton width={`${60 - i * 8}%`} />
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz">
        <header className="page-heading">
          <p className="eyebrow">Quiz</p>
          <h1 className="page-heading__title">{topic?.title}</h1>
        </header>
        <div className="alert alert--error" role="alert">
          <Icon name="alert" />
          <div>
            <p className="alert__title">We couldn’t build this quiz</p>
            <p className="alert__body">{error}</p>
            <div className="alert__actions">
              <button type="button" className="btn btn--primary btn--sm" onClick={() => setReloadKey((k) => k + 1)}>
                <Icon name="refresh" size={16} /> Try again
              </button>
              {onPickAnother && (
                <button type="button" className="btn btn--ghost btn--sm" onClick={onPickAnother}>
                  Choose another topic
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) return null;

  if (index >= questions.length) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="quiz quiz--done">
        <section className="result card" aria-labelledby="result-title">
          <ScoreRing pct={pct} />
          <div className="result__text">
            <p className="eyebrow">Quiz complete</p>
            <h1 id="result-title" className="result__title" tabIndex={-1} ref={questionRef}>
              {pct >= 70 ? 'Great work.' : pct >= 40 ? 'Good start. Keep going.' : 'Worth another look.'}
            </h1>
            <p className="result__sub" role="status">
              You got {score} of {questions.length} correct on <strong>{topic.title}</strong>.
            </p>
            <div className="result__actions">
              {onFinish && (
                <button type="button" className="btn btn--primary" onClick={onFinish}>
                  View progress <Icon name="arrowRight" size={16} />
                </button>
              )}
              {onPickAnother && (
                <button type="button" className="btn btn--ghost" onClick={onPickAnother}>
                  Choose another topic
                </button>
              )}
            </div>
          </div>
        </section>

        {history.length > 0 && (
          <section className="recap" aria-labelledby="recap-title">
            <h2 id="recap-title" className="section-head__title">Question review</h2>
            <ol className="recap__list">
              {history.map((h, i) => (
                <li key={i} className={`recap__item ${h.correct ? 'is-correct' : 'is-incorrect'}`}>
                  <span className="recap__mark" aria-hidden="true">
                    <Icon name={h.correct ? 'check' : 'x'} size={14} />
                  </span>
                  <div className="recap__body">
                    <p className="recap__q">{h.question}</p>
                    <p className="recap__a">
                      <span className="visually-hidden">{h.correct ? 'Correct. ' : 'Incorrect. '}</span>
                      Your answer: <strong>{h.selected}</strong>
                      {!h.correct && h.answer && (
                        <>
                          {' '}· Correct: <strong>{h.answer}</strong>
                        </>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    );
  }

  const question = questions[index];
  const revealAnswer =
    result !== null && !result.correct && question.correctAnswer && question.options.includes(question.correctAnswer);
  const isLast = index + 1 >= questions.length;

  return (
    <div className="quiz">
      <header className="page-heading page-heading--quiz">
        <p className="eyebrow">Quiz</p>
        <h1 className="page-heading__title">{topic?.title}</h1>
      </header>

      <div className="quiz__meta">
        <ol className="steps" aria-label={`Question ${index + 1} of ${questions.length}`}>
          {questions.map((q, i) => {
            const h = history[i];
            const state = h ? (h.correct ? 'correct' : 'incorrect') : i === index ? 'current' : 'todo';
            return <li key={q.id ?? i} className={`steps__seg steps__seg--${state}`} />;
          })}
        </ol>
        <span className="quiz__score">
          <span className="quiz__score-num">{score}</span> correct
        </span>
      </div>

      <section className="quiz-card card" aria-labelledby="question-text">
        <p className="quiz-card__count">
          Question {index + 1} <span aria-hidden="true">/</span>
          <span className="visually-hidden">of</span> {questions.length}
        </p>
        <h2 id="question-text" className="quiz-card__question" tabIndex={-1} ref={questionRef}>
          {question.question}
        </h2>

        <div className="quiz-card__options" role="group" aria-labelledby="question-text">
          {question.options.map((option, i) => {
            const isSelected = option === selected;
            let state = '';
            if (result !== null && isSelected) state = result.correct ? 'is-correct' : 'is-incorrect';
            else if (revealAnswer && option === question.correctAnswer) state = 'is-answer';
            else if (isSelected && checking) state = 'is-checking';
            else if (result !== null) state = 'is-dimmed';
            return (
              <button
                key={option}
                type="button"
                ref={(el) => { optionRefs.current[i] = el; }}
                className={`option ${state}`}
                onClick={() => handleSelect(option)}
                onKeyDown={(e) => onOptionKeyDown(e, i, question.options.length)}
                aria-disabled={result !== null || checking ? 'true' : undefined}
              >
                <span className="option__key" aria-hidden="true">
                  {state === 'is-correct' || state === 'is-answer' ? (
                    <Icon name="check" size={16} />
                  ) : state === 'is-incorrect' ? (
                    <Icon name="x" size={16} />
                  ) : state === 'is-checking' ? (
                    <Spinner size={14} />
                  ) : (
                    LETTERS[i]
                  )}
                </span>
                <span className="option__text">
                  {option}
                  {state === 'is-correct' && <span className="visually-hidden"> (your answer, correct)</span>}
                  {state === 'is-incorrect' && <span className="visually-hidden"> (your answer, incorrect)</span>}
                </span>
                {state === 'is-answer' && <span className="option__tag">Correct answer</span>}
              </button>
            );
          })}
        </div>

        <div className="quiz-card__foot" aria-live="polite">
          {attemptError && (
            <p className="inline-error" role="alert">
              <Icon name="alert" size={16} /> {attemptError}
            </p>
          )}
          {checking && <p className="visually-hidden">Checking your answer…</p>}
          {result !== null ? (
            <div className={`feedback ${result.correct ? 'feedback--correct' : 'feedback--incorrect'}`}>
              <span className="feedback__icon" aria-hidden="true">
                <Icon name={result.correct ? 'check' : 'x'} size={18} />
              </span>
              <p className="feedback__text">
                <strong>{result.correct ? 'Correct.' : 'Not quite.'}</strong>{' '}
                {result.correct
                  ? 'Nice, that one is locked in.'
                  : revealAnswer
                    ? <>The answer is <strong>{question.correctAnswer}</strong>.</>
                    : 'This topic will show up in your weak spots.'}
              </p>
              <button type="button" ref={nextRef} className="btn btn--primary feedback__next" onClick={handleNext}>
                {isLast ? 'See results' : 'Next question'}
                <Icon name="arrowRight" size={16} />
              </button>
            </div>
          ) : (
            <p className="quiz-card__hint" aria-hidden="true">
              Press <kbd>1</kbd>–<kbd>{question.options.length}</kbd> to answer, or use <kbd>↑</kbd> <kbd>↓</kbd> and{' '}
              <kbd>Enter</kbd>.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
