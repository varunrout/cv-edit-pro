'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { ResumeData } from '@/types/resume';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  revisedText?: string | null;
  applied?: boolean;
}

interface Props {
  currentText: string;
  basics: ResumeData['basics'];
  onApplyRevision: (text: string) => void;
}

export default function CoverLetterChat({ currentText, basics, onApplyRevision }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/cover-letter-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
          currentText,
          basics,
        }),
      });
      const json = await res.json();

      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: json.reply || json.error || 'No response',
            revisedText: json.revisedText || null,
            applied: false,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'assistant', content: `Error: ${json.error || 'Something went wrong'}` },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: `Error: ${err instanceof Error ? err.message : 'Network error'}` },
      ]);
    }

    setLoading(false);
  }, [input, loading, messages, currentText, basics]);

  const handleApply = useCallback((msgId: string, revisedText: string) => {
    onApplyRevision(revisedText);
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, applied: true } : m)));
  }, [onApplyRevision]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = currentText.trim()
    ? ['Make it more concise', 'Make the tone more enthusiastic', 'Fix grammar and tighten wording', 'Make the opening line stronger']
    : ['Draft an opening paragraph for me'];

  return (
    <div className="flex flex-col h-full min-h-0 border-t border-gray-200 mt-3 pt-3">
      <p className="text-xs font-medium text-gray-500 mb-2">Cover Letter Assistant</p>
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 min-h-[120px] max-h-[260px]">
        {messages.length === 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => { setInput(s); inputRef.current?.focus(); }}
                className="px-2.5 py-1.5 text-xs text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left"
              >
                {s}
              </button>
            ))}
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[90%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === 'user' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                {msg.role === 'assistant' && msg.revisedText && !msg.applied && (
                  <button
                    onClick={() => handleApply(msg.id, msg.revisedText!)}
                    className="mt-2 flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Apply to Cover Letter
                  </button>
                )}
                {msg.applied && (
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

      <div className="flex-shrink-0 pt-2">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the assistant to tweak your letter…"
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
