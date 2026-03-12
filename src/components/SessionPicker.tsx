'use client';

import { useState, useEffect, useCallback } from 'react';

interface SessionItem {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
}

export default function SessionPicker({ currentSessionId, onSelectSession, onNewSession }: Props) {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this session? This cannot be undone.')) return;
    await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
    setSessions((s) => s.filter((item) => item.id !== id));
    if (currentSessionId === id) onNewSession();
  };

  const handleRename = async (id: string) => {
    if (!renameValue.trim()) { setRenaming(null); return; }
    await fetch(`/api/sessions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: renameValue.trim() }),
    });
    setSessions((s) =>
      s.map((item) => (item.id === id ? { ...item, name: renameValue.trim() } : item))
    );
    setRenaming(null);
  };

  const currentName = sessions.find((s) => s.id === currentSessionId)?.name || 'Untitled Resume';

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open) fetchSessions(); }}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors max-w-[200px]"
      >
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <span className="truncate">{currentSessionId ? currentName : 'Sessions'}</span>
        <svg className={`w-3 h-3 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <button
                onClick={() => { onNewSession(); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Resume Session
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {loading ? (
                <p className="px-4 py-3 text-xs text-gray-400 text-center">Loading…</p>
              ) : sessions.length === 0 ? (
                <p className="px-4 py-3 text-xs text-gray-400 text-center">No saved sessions yet</p>
              ) : (
                sessions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => { onSelectSession(s.id); setOpen(false); }}
                    className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                      s.id === currentSessionId ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      {renaming === s.id ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={() => handleRename(s.id)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleRename(s.id); if (e.key === 'Escape') setRenaming(null); }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full text-xs px-1.5 py-0.5 border border-blue-300 rounded focus:outline-none"
                        />
                      ) : (
                        <>
                          <p className="text-xs font-medium text-gray-800 truncate">{s.name}</p>
                          <p className="text-[10px] text-gray-400">{formatDate(s.updatedAt)}</p>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setRenaming(s.id); setRenameValue(s.name); }}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                        title="Rename"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => handleDelete(s.id, e)}
                        className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                        title="Delete"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
