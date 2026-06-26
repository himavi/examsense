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
      <div className="page-heading">
        <h1 className="page-heading__title">Upload Notes</h1>
        <p className="page-heading__sub">Paste your study material and we'll extract topics to quiz you on.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          className="note-upload__textarea"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Paste your notes, textbook content, or any study material here..."
          rows={10}
        />
        <div className="note-upload__actions">
          <button className="btn-primary note-upload__submit" type="submit" disabled={loading || !rawText.trim()}>
            {loading ? 'Analyzing…' : 'Analyze Notes →'}
          </button>
        </div>
      </form>

      {topics.length > 0 && (
        <>
          <p className="note-upload__topics-heading">Topics found — pick one to start</p>
          <ul className="note-upload__topics">
            {topics.map((topic) => (
              <li key={topic.title}>
                <button
                  className="note-upload__topic-btn"
                  onClick={() => onTopicSelect(noteId, topic)}
                >
                  {topic.title}
                  <span className="note-upload__topic-arrow">→</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
