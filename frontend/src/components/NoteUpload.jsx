import { useState } from 'react';
import { createNote } from '../api.js';

function scoreClass(accuracy) {
  if (accuracy < 0.4) return 'note-upload__topic-score note-upload__topic-score--danger';
  if (accuracy < 0.6) return 'note-upload__topic-score note-upload__topic-score--warning';
  return 'note-upload__topic-score';
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

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rawText.trim()) return;
    setLoading(true);
    try {
      const data = await createNote(rawText);
      onAnalyzed(data.noteId, data.topics ?? []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="note-upload">
      <div className="page-heading">
        <h1 className="page-heading__title">Upload Notes</h1>
        <p className="page-heading__sub">Paste your study material and we'll extract topics to quiz you on.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          className="note-upload__textarea"
          value={rawText}
          onChange={(e) => onRawTextChange(e.target.value)}
          placeholder="Paste your notes, textbook content, or any study material here..."
          rows={10}
        />
        <div className="note-upload__actions">
          <button className="btn-primary note-upload__submit" type="submit" disabled={loading || !rawText.trim()}>
            {loading ? 'Analyzing…' : topics.length > 0 ? 'Re-analyze →' : 'Analyze Notes →'}
          </button>
        </div>
      </form>

      {topics.length > 0 && (
        <>
          <p className="note-upload__topics-heading">Topics found — pick one to start</p>
          <ul className="note-upload__topics">
            {topics.map((topic) => {
              const isActive = selectedTopic && selectedTopic.title === topic.title;
              const isAttempted = Object.prototype.hasOwnProperty.call(attempted, topic.title);
              const accuracy = attempted[topic.title];
              return (
                <li key={topic.title}>
                  <button
                    className={`note-upload__topic-btn ${isActive ? 'active' : ''} ${isAttempted ? 'note-upload__topic-btn--done' : ''}`}
                    onClick={() => onTopicSelect(topic)}
                  >
                    <span className="note-upload__topic-title">{topic.title}</span>
                    <span className="note-upload__topic-meta">
                      {isAttempted && (
                        <span className={scoreClass(accuracy)}>{Math.round(accuracy * 100)}%</span>
                      )}
                      <span className="note-upload__topic-arrow">{isAttempted ? '✓' : '→'}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
