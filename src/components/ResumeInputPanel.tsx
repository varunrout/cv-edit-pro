'use client';

import { useState, useRef } from 'react';
import { parseResume } from '@/lib/resumeParser';
import { normalizeAIResponse } from '@/lib/normalizeAI';
import { sampleResumeText } from '@/lib/sampleData';
import { ResumeData } from '@/types/resume';

interface Props {
  onParsed: (data: ResumeData) => void;
  onSample: () => void;
  onClear: () => void;
}

export default function ResumeInputPanel({ onParsed, onSample, onClear }: Props) {
  const [text, setText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [message, setMessage] = useState('');
  const [useAI, setUseAI] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleParse = async () => {
    if (!text.trim()) {
      setMessage('Please paste your resume text first.');
      return;
    }
    setParsing(true);
    setMessage('');

    if (useAI) {
      try {
        setMessage('🤖 AI is parsing your resume…');
        const res = await fetch('/api/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        const json = await res.json();
        if (res.ok && json.data) {
          const data = normalizeAIResponse(json.data);
          onParsed(data);
          setMessage('✓ Resume parsed with AI. Review and edit below.');
          setParsing(false);
          return;
        }
        // AI failed — fall through to local parser
        console.warn('AI parse failed, falling back to local parser:', json.error);
      } catch (err) {
        console.warn('AI parse request failed, falling back to local parser:', err);
      }
    }

    // Local regex fallback
    try {
      const data = parseResume(text);
      onParsed(data);
      setMessage(useAI
        ? '⚠ AI unavailable — parsed with local parser. Some fields may need manual editing.'
        : '✓ Resume parsed successfully. Review and edit below.');
    } catch {
      setMessage('Parse error — please check your text format.');
    }
    setParsing(false);
  };

  const handleSample = () => {
    setText(sampleResumeText);
    onSample();
    setMessage('');
  };

  const handleClear = () => {
    setText('');
    onClear();
    setMessage('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setText(ev.target?.result as string ?? '');
        setMessage('File loaded. Click "Parse Resume" to process.');
      };
      reader.readAsText(file);
    } else {
      setMessage('Only .txt files are supported for direct upload. Paste text from PDF/Word documents.');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Resume Input</h2>
        <div className="flex gap-1.5">
          <button
            onClick={handleSample}
            className="px-2.5 py-1 text-xs font-medium text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
          >
            Load Sample
          </button>
          <button
            onClick={handleClear}
            className="px-2.5 py-1 text-xs font-medium text-gray-500 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your resume text here…&#10;&#10;Include your contact info, work experience, education, skills, etc."
        className="w-full h-56 px-3 py-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 placeholder-gray-400 font-mono leading-relaxed"
        spellCheck={false}
      />

      <div className="flex gap-2">
        <button
          onClick={handleParse}
          disabled={parsing}
          className="flex-1 py-2.5 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {parsing ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Parsing…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Parse Resume
            </>
          )}
        </button>

        <label className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload
          <input ref={fileRef} type="file" accept=".txt" className="hidden" onChange={handleFileUpload} />
        </label>
      </div>

      {message && (
        <p className={`text-xs px-3 py-2 rounded-md ${message.startsWith('✓') ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
          {message}
        </p>
      )}

      <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-100">
        <p className="text-xs text-gray-500 font-medium mb-1">AI Enhancement</p>
        <button
          type="button"
          onClick={() => setUseAI((v) => !v)}
          className="flex items-center gap-2"
        >
          <div className={`w-8 h-4 rounded-full relative transition-colors ${useAI ? 'bg-blue-500' : 'bg-gray-300'}`}>
            <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${useAI ? 'left-[18px]' : 'left-0.5'}`} />
          </div>
          <span className="text-xs text-gray-600">{useAI ? 'AI parsing enabled' : 'Local parsing only'}</span>
        </button>
        <p className="text-xs text-gray-400 mt-1">
          {useAI
            ? 'GPT-4o-mini will parse your resume for best accuracy. Falls back to local parser if unavailable.'
            : 'Using regex-based local parser. Toggle on for AI-powered parsing.'}
        </p>
      </div>
    </div>
  );
}
