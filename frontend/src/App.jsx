import { useState, useEffect } from 'react';
import { getWeakTopics } from './api.js';
import NoteUpload from './components/NoteUpload';
import QuizView from './components/QuizView';
import ProgressDashboard from './components/ProgressDashboard';
import './App.css';

export default function App() {
  const [view, setView] = useState('upload');
  const [noteId, setNoteId] = useState(null);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [rawText, setRawText] = useState('');
  const [attempted, setAttempted] = useState({});

  // Refresh attempted-topic markers from the backend whenever the Notes list is shown.
  useEffect(() => {
    if (view !== 'upload' || !noteId) return;
    let active = true;
    getWeakTopics(noteId)
      .then((data) => {
        if (!active) return;
        const map = {};
        (data ?? []).forEach((t) => { map[t.topic] = t.accuracy; });
        setAttempted(map);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [view, noteId]);

  function handleAnalyzed(id, foundTopics) {
    setNoteId(id);
    setTopics(foundTopics ?? []);
    setSelectedTopic(null);
    setAttempted({});
  }

  function handleTopicSelect(topic) {
    setSelectedTopic(topic);
    setView('quiz');
  }

  function handleReset() {
    setNoteId(null);
    setTopics([]);
    setSelectedTopic(null);
    setRawText('');
    setAttempted({});
    setView('upload');
  }

  return (
    <div className="app">
      <header className="app__header">
        <span className="app__logo">ExamSense</span>
        {noteId && (
          <nav className="app__nav">
            <button
              className={`app__nav-tab ${view === 'upload' ? 'active' : ''}`}
              onClick={() => setView('upload')}
            >
              Notes
            </button>
            <button
              className={`app__nav-tab ${view === 'quiz' ? 'active' : ''}`}
              onClick={() => setView('quiz')}
              disabled={!selectedTopic}
            >
              Quiz
            </button>
            <button
              className={`app__nav-tab ${view === 'dashboard' ? 'active' : ''}`}
              onClick={() => setView('dashboard')}
            >
              Progress
            </button>
          </nav>
        )}
      </header>

      <main className="app__content">
        {view === 'upload' && (
          <NoteUpload
            topics={topics}
            selectedTopic={selectedTopic}
            attempted={attempted}
            rawText={rawText}
            onRawTextChange={setRawText}
            onAnalyzed={handleAnalyzed}
            onTopicSelect={handleTopicSelect}
          />
        )}

        {view === 'quiz' && (
          <QuizView
            noteId={noteId}
            topic={selectedTopic}
            onFinish={() => setView('dashboard')}
            onPickAnother={() => setView('upload')}
          />
        )}

        {view === 'dashboard' && (
          <>
            <ProgressDashboard noteId={noteId} topics={topics} />
            <div className="dashboard__actions">
              <button className="btn-primary" onClick={() => setView('upload')}>
                ← Back to Topics
              </button>
              <button className="btn-ghost" onClick={handleReset}>
                New Notes
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
