import { useState, useEffect, useRef } from 'react';
import { getWeakTopics } from './api.js';
import NoteUpload from './components/NoteUpload';
import QuizView from './components/QuizView';
import ProgressDashboard from './components/ProgressDashboard';
import UsageAreas from './components/UsageAreas';
import { Icon, LogoMark } from './components/ui';
import './App.css';

export default function App() {
  const [view, setView] = useState('upload');
  const [noteId, setNoteId] = useState(null);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [rawText, setRawText] = useState('');
  const [attempted, setAttempted] = useState({});
  const [adminKey] = useState(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('admin');
    if (fromUrl) {
      localStorage.setItem('examsense_admin_key', fromUrl);
      return fromUrl;
    }
    return localStorage.getItem('examsense_admin_key') || '';
  });
  const isAdmin = !!adminKey;
  const mainRef = useRef(null);
  const prevView = useRef(view);

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

  // On view change, move focus to the main region and scroll to top so keyboard
  // and screen-reader users land at the start of the new screen.
  useEffect(() => {
    if (prevView.current === view) return;
    prevView.current = view;
    window.scrollTo({ top: 0 });
    mainRef.current?.focus({ preventScroll: true });
  }, [view]);

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

  const tabs = [];
  if (noteId) {
    tabs.push(
      { id: 'upload', label: 'Notes', icon: 'doc' },
      { id: 'quiz', label: 'Quiz', icon: 'layers', disabled: !selectedTopic },
      { id: 'dashboard', label: 'Progress', icon: 'chart' },
    );
  }
  if (isAdmin) tabs.push({ id: 'usage', label: 'Areas', icon: 'chart' });

  return (
    <div className="app">
      <a className="skip-link" href="#main">Skip to content</a>

      <header className="app__header">
        <div className="app__header-inner">
          <span className="brand">
            <LogoMark />
            <span className="brand__name">ExamSense</span>
          </span>

          {tabs.length > 0 && (
            <nav className="app__nav" aria-label="Sections">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className="app__nav-tab"
                  aria-current={view === tab.id ? 'page' : undefined}
                  onClick={() => setView(tab.id)}
                  disabled={tab.disabled}
                  title={tab.disabled ? 'Pick a topic first' : undefined}
                >
                  <Icon name={tab.icon} size={16} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>

      <main id="main" className="app__content" ref={mainRef} tabIndex={-1}>
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
            <div className="page-actions">
              <button type="button" className="btn btn--primary" onClick={() => setView('upload')}>
                <Icon name="arrowLeft" size={16} />
                Back to topics
              </button>
              <button type="button" className="btn btn--ghost" onClick={handleReset}>
                Start with new notes
              </button>
            </div>
          </>
        )}

        {view === 'usage' && isAdmin && (
          <UsageAreas adminKey={adminKey} onBack={() => setView('upload')} />
        )}
      </main>

      <footer className="app__footer">
        <div className="app__footer-inner">
          <p>
            Built by{' '}
            <a href="https://hksingh.vercel.app" target="_blank" rel="noopener noreferrer">
              Himanshu Kumar Singh
            </a>
          </p>
          <a
            className="app__footer-gh"
            href="https://github.com/himavi/examsense"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="github" size={16} />
            Source on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
