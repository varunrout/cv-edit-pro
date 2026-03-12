'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ResumeData } from '@/types/resume';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  editsApplied?: boolean;
}

interface Props {
  resume: ResumeData;
  onApplyEdits: (edits: Partial<ResumeData>) => void;
  sessionId?: string | null;
}

export default function ResumeChat({ resume, onApplyEdits, sessionId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pendingEditsRef = useRef<Map<string, Partial<ResumeData>>>(new Map());
  const loadedSessionRef = useRef<string | null>(null);

  // Load messages from session when sessionId changes
  useEffect(() => {
    if (!sessionId || sessionId === loadedSessionRef.current) return;
    loadedSessionRef.current = sessionId;

    (async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.messages?.length > 0) {
          const loaded: ChatMessage[] = data.messages.map((m: { id: string; role: string; content: string; edits?: string }) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            editsApplied: true, // previously loaded messages have already been applied
          }));
          setMessages(loaded);
        } else {
          setMessages([]);
        }
      } catch {
        setMessages([]);
      }
    })();
  }, [sessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Save a chat message to the session
  const persistMessage = useCallback(async (role: string, content: string, edits?: Partial<ResumeData>) => {
    if (!sessionId) return;
    try {
      await fetch(`/api/sessions/${sessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, content, edits: edits ? JSON.stringify(edits) : undefined }),
      });
    } catch { /* ignore persistence errors */ }
  }, [sessionId]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Persist user message
    persistMessage('user', text);

    try {
      const apiMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, resumeData: resume }),
      });

      const json = await res.json();

      if (res.ok) {
        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: json.reply || json.error || 'No response',
          editsApplied: false,
        };

        if (json.edits) {
          pendingEditsRef.current.set(assistantMsg.id, json.edits);
        }

        setMessages((prev) => [...prev, assistantMsg]);

        // Persist assistant message
        persistMessage('assistant', assistantMsg.content, json.edits || undefined);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `Error: ${json.error || 'Something went wrong'}`,
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Error: ${err instanceof Error ? err.message : 'Network error'}`,
        },
      ]);
    }

    setLoading(false);
  }, [input, loading, messages, resume, persistMessage]);

  const handleApplyEdits = useCallback(
    (msgId: string) => {
      const edits = pendingEditsRef.current.get(msgId);
      if (!edits) return;
      onApplyEdits(edits);
      pendingEditsRef.current.delete(msgId);
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, editsApplied: true } : m))
      );
    },
    [onApplyEdits]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasContent = resume.basics.name || resume.experience.length > 0;
  const suggestions = hasContent
    ? [
        'Improve my professional summary',
        'Make my bullet points more impactful',
        'What skills should I add?',
        'Rewrite my first job experience bullets',
      ]
    : [
        'What makes a great resume?',
        'How should I structure my experience section?',
      ];

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pb-2 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-6">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">Resume Assistant</p>
            <p className="text-xs text-gray-400 mb-4 max-w-[260px]">
              Ask me anything about your resume. I can explain, suggest improvements, or make edits directly.
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setInput(s);
                    inputRef.current?.focus();
                  }}
                  className="px-2.5 py-1.5 text-xs text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                {msg.role === 'assistant' && pendingEditsRef.current.has(msg.id) && !msg.editsApplied && (
                  <button
                    onClick={() => handleApplyEdits(msg.id)}
                    className="mt-2 flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Apply Changes
                  </button>
                )}
                {msg.editsApplied && (
                  <span className="mt-1.5 inline-flex items-center gap-1 text-xs text-green-600">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Applied
                  </span>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-xl px-3 py-2 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-gray-200 pt-2 mt-1">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your resume…"
            rows={1}
            className="flex-1 resize-none px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 placeholder-gray-400 max-h-24 overflow-y-auto"
            style={{ minHeight: '36px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
