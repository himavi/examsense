import { useState, useEffect } from 'react';
import { getWeakTopics } from '../api.js';

async function getExplanation(topic) {
  const res = await fetch(`http://localhost:5000/api/quiz/explain/${encodeURIComponent(topic)}`);
  if (!res.ok) throw new Error('Failed to fetch explanation');
  return res.json();
}

function accuracyClass(accuracy) {
  if (accuracy < 0.4) return 'topic-row topic-row--danger';
  if (accuracy < 0.6) return 'topic-row topic-row--warning';
  return 'topic-row';
}

export default function ProgressDashboard({ noteId }) {
  const [topics, setTopics] = useState([]);
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
      .then((data) => {
        const sorted = [...(data ?? [])].sort((a, b) => a.accuracy - b.accuracy);
        setTopics(sorted);
      })
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
  if (topics.length === 0) return <p className="dashboard__empty">No progress data yet. Complete a quiz first.</p>;

  const avg = topics.reduce((sum, t) => sum + t.accuracy, 0) / topics.length;
  const best = [...topics].sort((a, b) => b.accuracy - a.accuracy)[0];
  const weakCount = topics.filter((t) => t.accuracy < 0.6).length;

  return (
    <div className="dashboard">
      <div className="page-heading">
        <h1 className="page-heading__title">Your Progress</h1>
        <p className="page-heading__sub">Based on your quiz attempts across all topics.</p>
      </div>

      <div className="dashboard__stats">
        <div className="stat-card">
          <div className="stat-card__value">{Math.round(avg * 100)}%</div>
          <div className="stat-card__label">Avg Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{topics.length}</div>
          <div className="stat-card__label">Topics</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{weakCount}</div>
          <div className="stat-card__label">Need Work</div>
        </div>
      </div>

      <p className="dashboard__section-label">Topic breakdown</p>
      <ul className="dashboard__list">
        {topics.map((topic) => (
          <li key={topic.topic} className={accuracyClass(topic.accuracy)}>
            <div className="topic-row__top">
              <span className="topic-row__name">{topic.topic}</span>
              <span className="topic-row__accuracy">{Math.round(topic.accuracy * 100)}%</span>
            </div>
            <div className="topic-row__bar-bg">
              <div
                className="topic-row__bar-fill"
                style={{ width: `${Math.round(topic.accuracy * 100)}%` }}
              />
            </div>
            {topic.accuracy < 0.7 && (
              <>
                <button
                  className="topic-row__explain-btn"
                  onClick={() => handleExplain(topic.topic)}
                  disabled={explaining[topic.topic]}
                >
                  {explaining[topic.topic] ? 'Loading…' : 'Why am I struggling?'}
                </button>
                {explanations[topic.topic] && (
                  <p className="topic-row__explanation">{explanations[topic.topic]}</p>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
