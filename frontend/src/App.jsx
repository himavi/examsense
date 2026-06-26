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
      {view === 'upload' && (
        <NoteUpload onTopicSelect={handleTopicSelect} />
      )}

      {view === 'quiz' && (
        <>
          <QuizView noteId={noteId} topic={selectedTopic} />
          <button className="app__nav-btn" onClick={() => setView('dashboard')}>
            View Progress
          </button>
        </>
      )}

      {view === 'dashboard' && (
        <>
          <ProgressDashboard noteId={noteId} />
          <button className="app__nav-btn" onClick={handleReset}>
            Back to Upload
          </button>
        </>
      )}
    </div>
  );
}
