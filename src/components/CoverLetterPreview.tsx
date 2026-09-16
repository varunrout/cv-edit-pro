'use client';

import { useState } from 'react';
import { ResumeData } from '@/types/resume';
import { buildCoverLetterPdf, coverLetterFilename } from '@/lib/coverLetterPdf';

interface Props {
  basics: ResumeData['basics'];
  content: string;
  sessionName: string;
}

export default function CoverLetterPreview({ basics, content, sessionName }: Props) {
  const [exporting, setExporting] = useState(false);

  const contactItems = [basics.email, basics.phone, basics.location, basics.linkedin].filter(Boolean);
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const paragraphs = content.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  const handleDownloadPdf = () => {
    if (exporting || !content.trim()) return;
    try {
      setExporting(true);
      const doc = buildCoverLetterPdf(basics, content);
      doc.save(coverLetterFilename(sessionName));
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <div className="no-print flex items-center gap-3 px-4 py-2 bg-white border-b border-gray-200">
        <span className="text-xs font-medium text-gray-500">Cover Letter Preview</span>
        <div className="flex-1" />
        <button
          onClick={handleDownloadPdf}
          disabled={exporting || !content.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {exporting ? 'Preparing…' : 'Download PDF'}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 flex justify-center">
        <div
          className="w-full max-w-[794px] bg-white shadow-lg ring-1 ring-gray-200"
          style={{ padding: '56px 64px', minHeight: '1123px', boxSizing: 'border-box', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' }}
        >
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
            {basics.name || 'Your Name'}
          </h1>
          {contactItems.length > 0 && (
            <p style={{ fontSize: '11px', color: '#6B7280' }}>{contactItems.join('  •  ')}</p>
          )}
          <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #E5E7EB' }} />
          <p style={{ fontSize: '11px', color: '#6B7280', marginBottom: '20px' }}>{today}</p>

          {paragraphs.length > 0 ? (
            paragraphs.map((para, i) => (
              <p key={i} style={{ fontSize: '13px', color: '#1F2937', lineHeight: 1.65, marginBottom: '14px', whiteSpace: 'pre-wrap' }}>
                {para}
              </p>
            ))
          ) : (
            <p style={{ fontSize: '13px', color: '#9CA3AF', fontStyle: 'italic' }}>
              Paste your cover letter text in the panel to preview it here.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
