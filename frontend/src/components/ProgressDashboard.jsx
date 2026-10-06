import { useState, useEffect } from 'react';
import { getWeakTopics } from '../api.js';
import { Icon, Meter, Skeleton, Spinner } from './ui';
import { toneFor, toneLabel } from '../utils.js';

async function getExplanation(topic) {
  const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const res = await fetch(`${BASE}/quiz/explain/${encodeURIComponent(topic)}`);
  if (!res.ok) throw new Error('Failed to fetch explanation');
  return res.json();
}

/** Render the model's plain-text answer: paragraphs, bullet lines and **bold**. No HTML injection. */
function RichText({ text }) {
  const inline = (s, key) =>
    s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={`${key}-${i}`}>{part.slice(2, -2)}</strong>
      ) : (
        part
      ),
    );
  return String(text)
    .split(/\n{2,}/)
    .map((block, bi) => {
      const lines = block.split('\n').filter((l) => l.trim());
      if (lines.length > 0 && lines.every((l) => /^\s*(?:[-*•]|\d+[.)])\s+/.test(l))) {
        return (
          <ul key={bi}>
            {lines.map((l, li) => (
              <li key={li}>{inline(l.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, ''), `${bi}-${li}`)}</li>
            ))}
          </ul>
        );
      }
      return <p key={bi}>{inline(lines.join(' '), bi)}</p>;
    });
}

export default function ProgressDashboard({ noteId, topics = [] }) {
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [explanations, setExplanations] = useState({});
  const [explaining, setExplaining] = useState({});
  const [explainErrors, setExplainErrors] = useState({});

  async function handleExplain(topicName) {
    if (explanations[topicName] || explaining[topicName]) return;
    setExplaining((prev) => ({ ...prev, [topicName]: true }));
    setExplainErrors((prev) => ({ ...prev, [topicName]: null }));
    try {
      const data = await getExplanation(topicName);
      const text =
        data.explanation ??
        data.text ??
        (data.explanation === null
          ? 'No incorrect answers are recorded for this topic yet, so there is nothing to explain.'
          : JSON.stringify(data));
      setExplanations((prev) => ({ ...prev, [topicName]: text }));
    } catch {
      setExplainErrors((prev) => ({ ...prev, [topicName]: 'Could not load explanation. Please try again.' }));
    } finally {
      setExplaining((prev) => ({ ...prev, [topicName]: false }));
    }
  }

  useEffect(() => {
    if (!noteId) return;
    setLoading(true);
    setError(null);
    getWeakTopics(noteId)
      .then((data) => setProgress(data ?? []))
      .catch(() => setError('Failed to load progress data.'))
      .finally(() => setLoading(false));
  }, [noteId]);

  if (!noteId) return null;

  const heading = (
    <header className="page-heading">
      <p className="eyebrow">Analytics</p>
      <h1 className="page-heading__title">Your progress</h1>
      <p className="page-heading__sub">Accuracy per topic, based on every quiz answer you have submitted.</p>
    </header>
  );

  if (loading) {
    return (
      <div className="dashboard" aria-busy="true">
        {heading}
        <p className="visually-hidden" role="status">Loading progress…</p>
        <div className="overview card" aria-hidden="true">
          <div className="overview__main">
            <Skeleton width="40%" height={10} />
            <Skeleton width={120} height={44} className="skeleton--title" />
            <Skeleton height={10} />
          </div>
          <div className="overview__stats">
            {[0, 1, 2].map((i) => (
              <div key={i} className="stat">
                <Skeleton width={56} height={26} />
                <Skeleton width="70%" height={10} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        {heading}
        <div className="alert alert--error" role="alert">
          <Icon name="alert" />
          <div>
            <p className="alert__title">Something went wrong</p>
            <p className="alert__body">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Merge the full topic list from the note with attempt-based accuracy.
  const accuracyByTopic = new Map(progress.map((p) => [p.topic, p.accuracy]));
  const titles = topics.length > 0 ? topics.map((t) => t.title) : progress.map((p) => p.topic);

  const rows = titles
    .map((title) => {
      const attempted = accuracyByTopic.has(title);
      return { topic: title, attempted, accuracy: attempted ? accuracyByTopic.get(title) : 0 };
    })
    .sort((a, b) => {
      if (a.attempted !== b.attempted) return a.attempted ? -1 : 1;
      return a.accuracy - b.accuracy;
    });

  if (rows.length === 0) {
    return (
      <div className="dashboard">
        {heading}
        <div className="empty card">
          <Icon name="chart" size={22} />
          <p>No topics yet. Upload notes to get started.</p>
        </div>
      </div>
    );
  }

  const attemptedRows = rows.filter((r) => r.attempted);
  const totalCount = rows.length;
  const completedCount = attemptedRows.length;
  const avg = completedCount > 0 ? attemptedRows.reduce((s, t) => s + t.accuracy, 0) / completedCount : 0;
  const weakCount = attemptedRows.filter((t) => t.accuracy < 0.6).length;

  // Total progress across ALL topics: not-yet-attempted topics count as 0.
  const overall = rows.reduce((s, t) => s + t.accuracy, 0) / totalCount;

  return (
    <div className="dashboard">
      {heading}

      <section className="overview card" aria-label="Summary">
        <div className="overview__main">
          <p className="overview__label">Total progress</p>
          <p className="overview__value">
            {Math.round(overall * 100)}
            <span>%</span>
          </p>
          <Meter value={overall} label="Total progress" size="lg" />
          <p className="overview__sub">
            {completedCount} of {totalCount} topics attempted. Unattempted topics count as 0%.
          </p>
        </div>
        <dl className="overview__stats">
          <div className="stat">
            <dt className="stat__label">Average score</dt>
            <dd className="stat__value">{completedCount > 0 ? `${Math.round(avg * 100)}%` : '—'}</dd>
          </div>
          <div className="stat">
            <dt className="stat__label">Completed</dt>
            <dd className="stat__value">
              {completedCount}
              <span className="stat__of">/{totalCount}</span>
            </dd>
          </div>
          <div className={`stat ${weakCount > 0 ? 'stat--warn' : ''}`}>
            <dt className="stat__label">Need work</dt>
            <dd className="stat__value">{weakCount}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="breakdown-title">
        <div className="section-head">
          <div>
            <h2 id="breakdown-title" className="section-head__title">Topic breakdown</h2>
            <p className="section-head__sub">Weakest first. Topics under 70% can be explained by the AI tutor.</p>
          </div>
          <ul className="legend" aria-label="Legend">
            <li><span className="legend__dot legend__dot--good" />60%+</li>
            <li><span className="legend__dot legend__dot--warning" />40–59%</li>
            <li><span className="legend__dot legend__dot--danger" />Under 40%</li>
          </ul>
        </div>

        <ul className="breakdown">
          {rows.map((row) => {
            const tone = toneFor(row.accuracy, row.attempted);
            const canExplain = row.attempted && row.accuracy < 0.7;
            const explanation = explanations[row.topic];
            const busy = explaining[row.topic];
            const explainError = explainErrors[row.topic];
            const panelId = `explain-${row.topic.replace(/\W+/g, '-')}`;
            return (
              <li key={row.topic} className={`topic-row topic-row--${tone}`}>
                <div className="topic-row__top">
                  <span className="topic-row__name">{row.topic}</span>
                  <span className="topic-row__accuracy">
                    {row.attempted ? (
                      <>
                        <span className="topic-row__pct">{Math.round(row.accuracy * 100)}%</span>
                        <span className={`chip chip--${tone}`}>{toneLabel(tone)}</span>
                      </>
                    ) : (
                      <span className="chip chip--neutral">Not started</span>
                    )}
                  </span>
                </div>
                <Meter value={row.accuracy} tone={tone} label={`${row.topic} accuracy`} />

                {canExplain && (
                  <div className="topic-row__explain">
                    {!explanation && (
                      <button
                        type="button"
                        className="btn btn--soft btn--sm"
                        onClick={() => handleExplain(row.topic)}
                        disabled={busy}
                        aria-controls={panelId}
                      >
                        {busy ? (
                          <>
                            <Spinner size={14} /> Asking the tutor…
                          </>
                        ) : (
                          <>
                            <Icon name="bulb" size={16} /> {explainError ? 'Try again' : 'Why am I struggling?'}
                          </>
                        )}
                      </button>
                    )}
                    <div id={panelId} aria-live="polite">
                      {busy && (
                        <div className="tutor tutor--loading" aria-hidden="true">
                          <Skeleton width="95%" />
                          <Skeleton width="88%" />
                          <Skeleton width="62%" />
                        </div>
                      )}
                      {busy && <span className="visually-hidden">Generating an explanation…</span>}
                      {explainError && !busy && (
                        <p className="inline-error">
                          <Icon name="alert" size={16} /> {explainError}
                        </p>
                      )}
                      {explanation && (
                        <div className="tutor">
                          <p className="tutor__label">
                            <Icon name="bulb" size={14} /> AI tutor · based on the questions you missed
                          </p>
                          <div className="tutor__body">
                            <RichText text={explanation} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
