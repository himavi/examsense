import { useState } from 'react';
import { createNote } from '../api.js';

export default function NoteUpload({ onTopicSelect }) {
  const [rawText, setRawText] = useState('');
  const [noteId, setNoteId] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rawText.trim()) return;
    setLoading(true);
    try {
      const data = await createNote(rawText);
      setNoteId(data.noteId);
      setTopics(data.topics ?? []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="note-upload">
      <form onSubmit={handleSubmit}>
        <textarea
          className="note-upload__textarea"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Paste your notes here..."
          rows={10}
        />
        <button className="note-upload__submit" type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>

      {topics.length > 0 && (
        <ul className="note-upload__topics">
          {topics.map((topic) => (
            <li key={topic.title} className="note-upload__topic-item">
              <button
                className="note-upload__topic-btn"
                onClick={() => onTopicSelect(noteId, topic)}
              >
                {topic.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
