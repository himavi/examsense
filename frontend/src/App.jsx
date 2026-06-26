import { useState } from 'react';
import NoteUpload from './components/NoteUpload';
import QuizView from './components/QuizView';
import ProgressDashboard from './components/ProgressDashboard';
import './App.css';

export default function App() {
  const [view, setView] = useState('upload');
  const [noteId, setNoteId] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);

  function handleTopicSelect(id, topic) {
    setNoteId(id);
    setSelectedTopic(topic);
    setView('quiz');
  }

  function handleReset() {
    setNoteId(null);
    setSelectedTopic(null);
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
          <NoteUpload onTopicSelect={handleTopicSelect} />
        )}

        {view === 'quiz' && (
          <>
            <QuizView
              noteId={noteId}
              topic={selectedTopic}
              onFinish={() => setView('dashboard')}
            />
          </>
        )}

        {view === 'dashboard' && (
          <>
            <ProgressDashboard noteId={noteId} />
            <button className="btn-ghost app__nav-btn" onClick={handleReset}>
              ← New Notes
            </button>
          </>
        )}
      </main>
    </div>
  );
}
