import { useState, useRef } from 'react';
import { createNote } from '../api.js';
import { AiWorking, Icon, Skeleton, Spinner } from './ui';
import { summaryLines, toneFor, toneLabel } from '../utils.js';

const EXAMPLE_NOTES =
  'Photosynthesis converts light energy into chemical energy in chloroplasts. The light-dependent reactions occur in the thylakoid membranes and produce ATP and NADPH. The Calvin cycle in the stroma uses ATP and NADPH to fix carbon dioxide into glucose. Cellular respiration breaks down glucose in mitochondria to release ATP; glycolysis happens in the cytoplasm, the Krebs cycle in the mitochondrial matrix, and the electron transport chain on the inner membrane.';

const STEPS = [
  { icon: 'doc', title: 'Paste your notes', body: 'Lecture notes, textbook passages, anything unstructured.' },
  { icon: 'layers', title: 'Get topic quizzes', body: 'AI splits them into topics and writes questions for each.' },
  { icon: 'chart', title: 'See weak spots', body: 'Track accuracy per topic and get explanations where you slip.' },
];

function wordCount(text) {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

export default function NoteUpload({
  topics = [],
  selectedTopic,
  attempted = {},
  rawText,
  onRawTextChange,
  onAnalyzed,
  onTopicSelect,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const textareaRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rawText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await createNote(rawText);
      if (!data || data.error || data.noteId == null) {
        setError(data?.error || 'The server did not return any topics.');
        return;
      }
      onAnalyzed(data.noteId, data.topics ?? []);
    } catch {
      setError('Could not reach the ExamSense server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  function fillExample() {
    onRawTextChange(EXAMPLE_NOTES);
    textareaRef.current?.focus();
  }

  const hasTopics = topics.length > 0;
  const words = wordCount(rawText);
  const attemptedCount = topics.filter((t) => Object.prototype.hasOwnProperty.call(attempted, t.title)).length;

  return (
    <div className={`notes ${hasTopics || loading ? 'notes--split' : ''}`}>
      <section className="notes__compose" aria-labelledby="compose-title">
        <header className="page-heading">
          <p className="eyebrow">Study notes</p>
          <h1 id="compose-title" className="page-heading__title">
            {hasTopics ? 'Your notes' : 'Turn messy notes into a focused quiz'}
          </h1>
          {!hasTopics && (
            <p className="page-heading__sub">
              Paste anything you are revising. ExamSense finds the topics, quizzes you on each one and shows
              where to spend your next study session.
            </p>
          )}
        </header>

        <form className="composer card" onSubmit={handleSubmit}>
          <label htmlFor="notes-input" className="visually-hidden">
            Study notes
          </label>
          <textarea
            id="notes-input"
            ref={textareaRef}
            className="composer__textarea"
            value={rawText}
            onChange={(e) => onRawTextChange(e.target.value)}
            placeholder="Paste your notes, textbook content, or any study material here…"
            rows={hasTopics ? 9 : 10}
            readOnly={loading}
            aria-describedby="notes-meta"
          />
          <div className="composer__bar">
            <span id="notes-meta" className="composer__meta">
              {words > 0 ? `${words} ${words === 1 ? 'word' : 'words'}` : 'Plain text works best'}
            </span>
            <div className="composer__actions">
              {!rawText.trim() && (
                <button type="button" className="btn btn--ghost btn--sm" onClick={fillExample}>
                  Try example notes
                </button>
              )}
              <button className="btn btn--primary" type="submit" disabled={loading || !rawText.trim()}>
                {loading ? (
                  <>
                    <Spinner /> Analyzing…
                  </>
                ) : (
                  <>
                    {hasTopics ? 'Re-analyze' : 'Analyze notes'}
                    <Icon name={hasTopics ? 'refresh' : 'arrowRight'} size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="alert alert--error" role="alert">
            <Icon name="alert" />
            <div>
              <p className="alert__title">We couldn’t analyze those notes</p>
              <p className="alert__body">{error}</p>
            </div>
          </div>
        )}

        {!hasTopics && !loading && (
          <ol className="how" aria-label="How it works">
            {STEPS.map((s, i) => (
              <li key={s.title} className="how__step">
                <span className="how__icon">
                  <Icon name={s.icon} />
                </span>
                <span className="how__num" aria-hidden="true">
                  0{i + 1}
                </span>
                <p className="how__title">{s.title}</p>
                <p className="how__body">{s.body}</p>
              </li>
            ))}
          </ol>
        )}
      </section>

      {loading && (
        <section className="notes__topics" aria-label="Finding topics" aria-busy="true">
          <AiWorking
            announce="Analyzing your notes. This usually takes a few seconds."
            steps={['Reading your notes…', 'Grouping ideas into topics…', 'Writing topic summaries…']}
          />
          <ul className="topic-grid" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="topic-card topic-card--skeleton">
                <Skeleton width="38%" height={10} />
                <Skeleton width="72%" height={18} className="skeleton--title" />
                <Skeleton width="92%" />
                <Skeleton width="80%" />
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasTopics && !loading && (
        <section className="notes__topics" aria-labelledby="topics-title">
          <div className="section-head">
            <div>
              <h2 id="topics-title" className="section-head__title">
                {topics.length} {topics.length === 1 ? 'topic' : 'topics'} found
              </h2>
              <p className="section-head__sub">
                {attemptedCount > 0
                  ? `${attemptedCount} of ${topics.length} practised. Pick a topic to quiz yourself.`
                  : 'Pick a topic to start a five-question quiz.'}
              </p>
            </div>
          </div>

          <ul className="topic-grid">
            {topics.map((topic, i) => {
              const isActive = selectedTopic && selectedTopic.title === topic.title;
              const isAttempted = Object.prototype.hasOwnProperty.call(attempted, topic.title);
              const accuracy = attempted[topic.title];
              const tone = toneFor(accuracy, isAttempted);
              const lines = summaryLines(topic.summary).slice(0, 3);
              return (
                <li key={topic.title}>
                  <button
                    type="button"
                    className={`topic-card ${isActive ? 'is-active' : ''}`}
                    onClick={() => onTopicSelect(topic)}
                    aria-describedby={`topic-status-${i}`}
                  >
                    <span className="topic-card__top">
                      <span className="topic-card__index">Topic {String(i + 1).padStart(2, '0')}</span>
                      <span id={`topic-status-${i}`} className={`chip chip--${tone}`}>
                        {isAttempted ? (
                          <>
                            <span className="chip__value">{Math.round(accuracy * 100)}%</span>
                            <span className="chip__label">{toneLabel(tone)}</span>
                          </>
                        ) : (
                          'Not started'
                        )}
                      </span>
                    </span>
                    <span className="topic-card__title">{topic.title}</span>
                    {lines.length > 0 && (
                      <span className="topic-card__summary">
                        {lines.map((l) => (
                          <span key={l} className="topic-card__line">
                            {l}
                          </span>
                        ))}
                      </span>
                    )}
                    <span className="topic-card__cta">
                      {isAttempted ? 'Practise again' : 'Start quiz'}
                      <Icon name="arrowRight" size={16} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
