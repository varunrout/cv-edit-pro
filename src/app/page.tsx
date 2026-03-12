'use client';

import { useState, useRef } from 'react';
import { useResumeState } from '@/hooks/useResumeState';
import ResumeInputPanel from '@/components/ResumeInputPanel';
import ParsedSectionsEditor from '@/components/ParsedSectionsEditor';
import ResumePreview from '@/components/ResumePreview';
import PrintToolbar from '@/components/PrintToolbar';
import { ResumeData } from '@/types/resume';

export default function Home() {
  const state = useResumeState();
  const [activeTab, setActiveTab] = useState<'input' | 'editor' | 'preview'>('input');
  const [template, setTemplate] = useState<'classic' | 'modern' | 'compact'>('classic');
  const [showEditor, setShowEditor] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleParsed = (data: ResumeData) => {
    state.loadParsedResume(data);
    setShowEditor(true);
    setActiveTab('editor');
  };

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
          <span className="text-sm font-semibold text-gray-900">CV Edit Pro</span>
        </div>

        <div className="flex-1" />

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
          {hasContent ? '● Autosaved' : 'No content yet'}
        </span>
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

          <div className="flex-1 overflow-y-auto p-4">
            {(activeTab !== 'editor' || !showEditor) ? (
              <ResumeInputPanel
                onParsed={handleParsed}
                onSample={handleSample}
                onClear={handleClear}
              />
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
          <PrintToolbar template={template} onTemplateChange={setTemplate} />
          <div className="flex-1 overflow-y-auto p-6 flex justify-center">
            <div className="w-full max-w-[794px] shadow-lg ring-1 ring-gray-200">
              <ResumePreview ref={previewRef} resume={state.resume} template={template} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
