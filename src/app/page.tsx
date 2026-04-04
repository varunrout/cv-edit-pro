'use client';

import { Suspense, useState, useRef, useCallback, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useResumeState } from '@/hooks/useResumeState';
import ResumeInputPanel from '@/components/ResumeInputPanel';
import ResumeChat from '@/components/ResumeChat';
import ParsedSectionsEditor from '@/components/ParsedSectionsEditor';
import ResumePreview from '@/components/ResumePreview';
import PrintToolbar from '@/components/PrintToolbar';
import SessionPicker from '@/components/SessionPicker';
import VersionTimeline from '@/components/VersionTimeline';
import LoginPage from '@/app/login/page';
import { ResumeData } from '@/types/resume';

export default function Home() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const { data: authSession, status } = useSession();
  const searchParams = useSearchParams();
  const state = useResumeState();
  const [activeTab, setActiveTab] = useState<'input' | 'editor' | 'preview'>('input');
  const [template, setTemplate] = useState<'classic' | 'modern' | 'compact'>('classic');
  const [showEditor, setShowEditor] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Session management
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentSessionName, setCurrentSessionName] = useState('Resume Session');
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nameUpdateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep session name in sync when user edits basics.name
  useEffect(() => {
    const name = state.resume.basics.name?.trim();
    if (!name || !currentSessionId) return;

    const newSessionName = `${name}'s Resume`;
    if (newSessionName === currentSessionName) return;

    setCurrentSessionName(newSessionName);

    // Debounced persist to server
    if (nameUpdateTimer.current) clearTimeout(nameUpdateTimer.current);
    nameUpdateTimer.current = setTimeout(() => {
      fetch(`/api/sessions/${currentSessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSessionName }),
      }).catch(() => {});
    }, 1500);

    return () => {
      if (nameUpdateTimer.current) clearTimeout(nameUpdateTimer.current);
    };
  }, [state.resume.basics.name, currentSessionId, currentSessionName]);

  // Auto-save resume data to current session (debounced)
  useEffect(() => {
    if (!currentSessionId || !authSession?.user) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        await fetch(`/api/sessions/${currentSessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resumeData: state.resume }),
        });
      } catch { /* ignore save errors */ }
      setSaving(false);
    }, 2000);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state.resume, currentSessionId, authSession?.user]);

  // Load session data when a session is selected
  const handleSelectSession = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/sessions/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.resumeData && Object.keys(data.resumeData).length > 0 && data.resumeData.basics) {
        state.loadParsedResume(data.resumeData);
        setShowEditor(true);
      }
      setCurrentSessionId(id);
      setCurrentSessionName(data.name || 'Resume Session');
    } catch { /* ignore */ }
  }, [state]);

  // Create a new session
  const handleNewSession = useCallback(async () => {
    if (!authSession?.user) return;
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Resume' }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentSessionId(data.id);
        setCurrentSessionName(data.name || 'Resume Session');
        state.clearResume();
        setShowEditor(false);
        setActiveTab('input');
      }
    } catch { /* ignore */ }
  }, [authSession?.user, state]);

  // When user first loads and is authenticated, create or load most recent session
  useEffect(() => {
    if (status !== 'authenticated' || currentSessionId) return;

    const sessionFromUrl = searchParams.get('session');

    (async () => {
      try {
        if (sessionFromUrl) {
          // URL specifies a session — load it directly
          handleSelectSession(sessionFromUrl);
          return;
        }

        const res = await fetch('/api/sessions');
        if (!res.ok) return;
        const data = await res.json();
        if (data.sessions?.length > 0) {
          handleSelectSession(data.sessions[0].id);
        } else {
          handleNewSession();
        }
      } catch { /* ignore */ }
    })();
  }, [status, currentSessionId, handleSelectSession, handleNewSession, searchParams]);

  const handleParsed = useCallback((data: ResumeData) => {
    state.loadParsedResume(data);
    setShowEditor(true);
    setActiveTab('editor');

    // Snapshot on parse (name sync is handled by the basics.name effect)
    if (currentSessionId) {
      fetch(`/api/sessions/${currentSessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData: data,
          snapshotSource: 'parse',
          snapshotLabel: 'Resume uploaded / parsed',
        }),
      }).catch(() => {});
    }
  }, [state, currentSessionId]);

  const handleSample = () => {
    state.loadSampleData();
    setShowEditor(true);
    setActiveTab('preview');
  };

  const handleClear = () => {
    state.clearResume();
    setShowEditor(false);
    setActiveTab('input');
  };

  const handleApplyEdits = useCallback((edits: Partial<ResumeData>) => {
    state.loadParsedResume({ ...state.resume, ...edits });
  }, [state]);

  // Show loading while checking auth
  if (status === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 text-gray-500">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (status === 'unauthenticated') {
    return <LoginPage />;
  }

  const hasContent = state.resume.basics.name || state.resume.summary || state.resume.experience.length > 0;

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Top Bar */}
      <header className="no-print flex items-center gap-3 px-4 py-2.5 bg-white border-b border-gray-200 z-10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-900 rounded-md flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-900 hidden sm:block">CV Edit Pro</span>
        </div>

        {/* Dashboard Link */}
        <Link
          href="/dashboard"
          className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors rounded hover:bg-gray-100"
          title="All Resumes"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </Link>

        {/* Session Picker */}
        <SessionPicker
          currentSessionId={currentSessionId}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
            onRenameSession={(id, newName) => {
              if (id === currentSessionId) setCurrentSessionName(newName);
            }}
          />
        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={state.undo}
            disabled={!state.canUndo}
            className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded hover:bg-gray-100"
            title="Undo"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button
            onClick={state.redo}
            disabled={!state.canRedo}
            className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded hover:bg-gray-100"
            title="Redo"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>

        <span className="text-xs text-gray-400 hidden sm:block">
          {saving ? '● Saving…' : hasContent ? '● Saved' : 'No content yet'}
        </span>

        {/* Version History Toggle */}
        <button
          onClick={() => setShowVersions(!showVersions)}
          className={`p-1.5 transition-colors rounded hover:bg-gray-100 ${
            showVersions ? 'text-blue-600' : 'text-gray-400 hover:text-gray-700'
          }`}
          title="Version History"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* User menu */}
        <div className="flex items-center gap-2 ml-2 border-l border-gray-200 pl-3">
          <span className="text-xs text-gray-500 hidden sm:block">{authSession?.user?.name || authSession?.user?.email}</span>
          <button
            onClick={() => signOut()}
            className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors rounded hover:bg-gray-100"
            title="Sign out"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Tabs */}
      <div className="no-print flex lg:hidden border-b border-gray-200 bg-white flex-shrink-0">
        {(['input', 'editor', 'preview'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel — Input + Editor */}
        <div
          className={[
            'flex flex-col w-full lg:w-[42%] border-r border-gray-200 bg-white overflow-hidden flex-shrink-0',
            activeTab === 'preview' ? 'hidden lg:flex' : 'flex',
          ].join(' ')}
        >
          {/* Left panel tabs (desktop) */}
          <div className="no-print hidden lg:flex border-b border-gray-200 flex-shrink-0">
            <button
              onClick={() => setActiveTab('input')}
              className={`px-4 py-2 text-xs font-medium transition-colors ${
                activeTab !== 'editor' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Input
            </button>
            {showEditor && (
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-4 py-2 text-xs font-medium transition-colors ${
                  activeTab === 'editor' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Editor
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col min-h-0">
            {(activeTab !== 'editor' || !showEditor) ? (
              <div className="flex flex-col h-full min-h-0">
                <ResumeInputPanel
                  onParsed={handleParsed}
                  onSample={handleSample}
                  onClear={handleClear}
                />
                {/* Chat interface */}
                <div className="mt-3 flex-1 min-h-[250px] flex flex-col border border-gray-200 rounded-lg p-3 bg-white">
                  <ResumeChat resume={state.resume} onApplyEdits={handleApplyEdits} sessionId={currentSessionId} />
                </div>
              </div>
            ) : (
              <ParsedSectionsEditor
                resume={state.resume}
                onUpdateBasics={state.updateBasics}
                onUpdateSummary={state.updateSummary}
                onUpdateExperience={state.updateExperience}
                onAddExperience={state.addExperience}
                onRemoveExperience={state.removeExperience}
                onUpdateEducation={state.updateEducation}
                onAddEducation={state.addEducation}
                onRemoveEducation={state.removeEducation}
                onUpdateSkills={state.updateSkills}
                onUpdateProjects={state.updateProjects}
                onAddProject={state.addProject}
                onRemoveProject={state.removeProject}
                onUpdateCertifications={state.updateCertifications}
                onUpdateAwards={state.updateAwards}
                onUpdateLanguages={state.updateLanguages}
                onReorderSections={state.reorderSections}
                onToggleSection={state.toggleSection}
              />
            )}
          </div>
        </div>

        {/* Right Panel — Preview */}
        <div
          className={[
            'flex-1 flex flex-col overflow-hidden bg-gray-100',
            (activeTab === 'input' || activeTab === 'editor') ? 'hidden lg:flex' : 'flex',
          ].join(' ')}
        >
          <PrintToolbar template={template} onTemplateChange={setTemplate} resume={state.resume} sessionName={currentSessionName} />
          <div className="flex-1 overflow-y-auto p-6 flex justify-center">
            <div className="w-full max-w-[794px] shadow-lg ring-1 ring-gray-200">
              <ResumePreview ref={previewRef} resume={state.resume} template={template} />
            </div>
          </div>
        </div>

        {/* Version History Panel */}
        {showVersions && (
          <div className="w-80 border-l border-gray-200 bg-white flex-shrink-0 overflow-hidden hidden lg:flex">
            <VersionTimeline
              sessionId={currentSessionId}
              onRestore={(data) => {
                state.loadParsedResume(data);
              }}
              onClose={() => setShowVersions(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
