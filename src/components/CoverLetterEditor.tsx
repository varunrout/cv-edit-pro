'use client';

import { useState } from 'react';
import { ResumeData } from '@/types/resume';
import { buildCoverLetterPdf, coverLetterFilename } from '@/lib/coverLetterPdf';
import type { TemplateId } from '@/lib/templates';
import CoverLetterChat from '@/components/CoverLetterChat';

interface Props {
  value: string;
  onChange: (value: string) => void;
  basics: ResumeData['basics'];
  sessionName: string;
  template: TemplateId;
}

export default function CoverLetterEditor({ value, onChange, basics, sessionName, template }: Props) {
  const [exporting, setExporting] = useState(false);

  const handleDownloadPdf = () => {
    if (exporting || !value.trim()) return;
    try {
      setExporting(true);
      const doc = buildCoverLetterPdf(basics, value, template);
      doc.save(coverLetterFilename(sessionName));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Cover Letter</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Paste your cover letter text below. It&apos;s saved with this resume session and can be downloaded as a PDF.
          </p>
        </div>
        {/* Desktop has a dedicated preview panel with its own download button;
            this is the mobile-only fallback since the preview panel is hidden there. */}
        <button
          onClick={handleDownloadPdf}
          disabled={exporting || !value.trim()}
          className="lg:hidden flex-shrink-0 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {exporting ? 'Preparing…' : 'Download PDF'}
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Dear Hiring Manager,&#10;&#10;Paste your cover letter here..."
        className="flex-shrink-0 w-full h-[220px] p-3 text-sm text-gray-800 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
      />
      <div className="flex-1 min-h-0">
        <CoverLetterChat currentText={value} basics={basics} onApplyRevision={onChange} />
      </div>
    </div>
  );
}
