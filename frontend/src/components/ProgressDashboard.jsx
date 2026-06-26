import { useState, useEffect } from 'react';
import { getWeakTopics } from '../api.js';

function accuracyClass(accuracy) {
  if (accuracy < 0.4) return 'topic-row topic-row--danger';
  if (accuracy < 0.6) return 'topic-row topic-row--warning';
  return 'topic-row';
}

export default function ProgressDashboard({ noteId }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
  if (loading) return <p className="dashboard__loading">Loading progress...</p>;
  if (error) return <p className="dashboard__error">{error}</p>;
  if (topics.length === 0) return <p className="dashboard__empty">No progress data yet.</p>;

  return (
    <div className="dashboard">
      <h2 className="dashboard__title">Topic Progress</h2>
      <ul className="dashboard__list">
        {topics.map((topic) => (
          <li key={topic.name} className={accuracyClass(topic.accuracy)}>
            <span className="topic-row__name">{topic.name}</span>
            <span className="topic-row__accuracy">
              {Math.round(topic.accuracy * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
