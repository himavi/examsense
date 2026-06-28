import { useState, useEffect } from 'react';
import { getWeakTopics } from '../api.js';

async function getExplanation(topic) {
  const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const res = await fetch(`${BASE}/quiz/explain/${encodeURIComponent(topic)}`);
  if (!res.ok) throw new Error('Failed to fetch explanation');
  return res.json();
}

function accuracyClass(accuracy, attempted) {
  if (!attempted) return 'topic-row topic-row--pending';
  if (accuracy < 0.4) return 'topic-row topic-row--danger';
  if (accuracy < 0.6) return 'topic-row topic-row--warning';
  return 'topic-row';
}

export default function ProgressDashboard({ noteId, topics = [] }) {
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [explanations, setExplanations] = useState({});
  const [explaining, setExplaining] = useState({});

  async function handleExplain(topicName) {
    if (explanations[topicName] || explaining[topicName]) return;
    setExplaining((prev) => ({ ...prev, [topicName]: true }));
    try {
      const data = await getExplanation(topicName);
      setExplanations((prev) => ({ ...prev, [topicName]: data.explanation ?? data.text ?? JSON.stringify(data) }));
    } catch {
      setExplanations((prev) => ({ ...prev, [topicName]: 'Could not load explanation. Please try again.' }));
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

  if (loading) return (
    <div className="dashboard__loading">
      <p>Loading progress…</p>
    </div>
  );

  if (error) return <p className="dashboard__error">{error}</p>;

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
    return <p className="dashboard__empty">No topics yet. Upload notes to get started.</p>;
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
      <div className="page-heading">
        <h1 className="page-heading__title">Your Progress</h1>
        <p className="page-heading__sub">Based on your quiz attempts across all topics.</p>
      </div>

      <div className="dashboard__stats">
        <div className="stat-card">
          <div className="stat-card__value">{completedCount > 0 ? `${Math.round(avg * 100)}%` : '—'}</div>
          <div className="stat-card__label">Avg Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{completedCount}/{totalCount}</div>
          <div className="stat-card__label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{weakCount}</div>
          <div className="stat-card__label">Need Work</div>
        </div>
      </div>

      <p className="dashboard__section-label">Topic breakdown</p>
      <ul className="dashboard__list">
        {rows.map((row) => (
          <li key={row.topic} className={accuracyClass(row.accuracy, row.attempted)}>
            <div className="topic-row__top">
              <span className="topic-row__name">{row.topic}</span>
              <span className="topic-row__accuracy">
                {row.attempted ? `${Math.round(row.accuracy * 100)}%` : 'Not started'}
              </span>
            </div>
            <div className="topic-row__bar-bg">
              <div
                className="topic-row__bar-fill"
                style={{ width: `${Math.round(row.accuracy * 100)}%` }}
              />
            </div>
            {row.attempted && row.accuracy < 0.7 && (
              <>
                <button
                  className="topic-row__explain-btn"
                  onClick={() => handleExplain(row.topic)}
                  disabled={explaining[row.topic]}
                >
                  {explaining[row.topic] ? 'Loading…' : 'Why am I struggling?'}
                </button>
                {explanations[row.topic] && (
                  <p className="topic-row__explanation">{explanations[row.topic]}</p>
                )}
              </>
            )}
          </li>
        ))}
      </ul>

      <div className="dashboard__total">
        <div className="dashboard__total-head">
          <span className="dashboard__total-label">Total Progress</span>
          <span className="dashboard__total-value">{Math.round(overall * 100)}%</span>
        </div>
        <div className="dashboard__total-bar-bg">
          <div className="dashboard__total-bar-fill" style={{ width: `${Math.round(overall * 100)}%` }} />
        </div>
        <p className="dashboard__total-sub">{completedCount} of {totalCount} topics attempted</p>
      </div>
    </div>
  );
}
