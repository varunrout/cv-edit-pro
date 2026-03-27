'use client';

import { useState, useEffect, useCallback } from 'react';
import { ResumeData } from '@/types/resume';

interface VersionItem {
  id: string;
  source: string;
  label: string;
  createdAt: string;
}

interface Props {
  sessionId: string | null;
  onRestore: (resumeData: ResumeData) => void;
  onClose: () => void;
}

const SOURCE_CONFIG: Record<string, { color: string; bgColor: string; label: string }> = {
  'ai-edit': { color: 'text-blue-700', bgColor: 'bg-blue-100', label: 'AI' },
  parse: { color: 'text-green-700', bgColor: 'bg-green-100', label: 'Upload' },
  manual: { color: 'text-purple-700', bgColor: 'bg-purple-100', label: 'Manual' },
  auto: { color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Auto' },
};

export default function VersionTimeline({ sessionId, onRestore, onClose }: Props) {
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{ id: string; data: ResumeData } | null>(null);
  const [savingCheckpoint, setSavingCheckpoint] = useState(false);

  const fetchVersions = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const handleRestore = async (vid: string) => {
    if (!sessionId || restoring) return;
    setRestoring(vid);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/restore/${vid}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        onRestore(data.resumeData);
        fetchVersions(); // refresh list (new "Before restore" version added)
      }
    } catch { /* ignore */ }
    setRestoring(null);
  };

  const handlePreview = async (vid: string) => {
    if (!sessionId) return;
    if (previewData?.id === vid) {
      setPreviewData(null);
      return;
    }
    try {
      const res = await fetch(`/api/sessions/${sessionId}/versions/${vid}`);
      if (res.ok) {
        const data = await res.json();
        setPreviewData({ id: vid, data: data.resumeData });
      }
    } catch { /* ignore */ }
  };

  const handleSaveCheckpoint = async () => {
    if (!sessionId || savingCheckpoint) return;
    setSavingCheckpoint(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'manual', label: 'Manual checkpoint' }),
      });
      if (res.ok) fetchVersions();
    } catch { /* ignore */ }
    setSavingCheckpoint(false);
  };

  const handleDelete = async (vid: string) => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/sessions/${sessionId}/versions/${vid}`, { method: 'DELETE' });
      if (res.ok) {
        setVersions((v) => v.filter((item) => item.id !== vid));
        if (previewData?.id === vid) setPreviewData(null);
      }
    } catch { /* ignore */ }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Version History</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {versions.length} version{versions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveCheckpoint}
            disabled={savingCheckpoint}
            className="px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            {savingCheckpoint ? 'Saving...' : 'Save Checkpoint'}
          </button>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 mb-1">No versions yet</p>
            <p className="text-xs text-gray-400">
              Versions are created when you upload a resume or when AI makes edits
            </p>
          </div>
        ) : (
          <div className="relative px-4 py-3">
            {/* Timeline line */}
            <div className="absolute left-[27px] top-6 bottom-3 w-px bg-gray-200" />

            <div className="space-y-1">
              {versions.map((v, i) => {
                const config = SOURCE_CONFIG[v.source] || SOURCE_CONFIG.auto;
                const isExpanded = previewData?.id === v.id;

                return (
                  <div key={v.id} className="relative">
                    {/* Timeline dot */}
                    <div className="flex items-start gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ring-2 ring-white ${
                        i === 0 ? 'bg-blue-500' : 'bg-gray-300'
                      }`} />

                      <div className="flex-1 min-w-0 pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${config.bgColor} ${config.color}`}>
                                {config.label}
                              </span>
                              <span className="text-[11px] text-gray-400">{formatDate(v.createdAt)}</span>
                            </div>
                            <p className="text-xs text-gray-700 truncate">{v.label}</p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => handlePreview(v.id)}
                              className="px-1.5 py-0.5 text-[10px] text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                              title="Preview"
                            >
                              {isExpanded ? 'Hide' : 'Preview'}
                            </button>
                            <button
                              onClick={() => handleRestore(v.id)}
                              disabled={restoring === v.id}
                              className="px-1.5 py-0.5 text-[10px] text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                              title="Restore this version"
                            >
                              {restoring === v.id ? '...' : 'Restore'}
                            </button>
                            <button
                              onClick={() => handleDelete(v.id)}
                              className="px-1 py-0.5 text-[10px] text-gray-400 hover:text-red-500 rounded transition-colors"
                              title="Delete"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Preview panel */}
                        {isExpanded && previewData && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                            <div className="space-y-1.5">
                              {previewData.data.basics?.name && (
                                <p><span className="font-medium text-gray-600">Name:</span> {previewData.data.basics.name}</p>
                              )}
                              {previewData.data.basics?.title && (
                                <p><span className="font-medium text-gray-600">Title:</span> {previewData.data.basics.title}</p>
                              )}
                              {previewData.data.summary && (
                                <p><span className="font-medium text-gray-600">Summary:</span> {previewData.data.summary.slice(0, 120)}...</p>
                              )}
                              <p className="text-gray-400">
                                {previewData.data.experience?.length || 0} experience{' '}
                                &bull; {previewData.data.education?.length || 0} education{' '}
                                &bull; {previewData.data.skills?.length || 0} skill groups
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
