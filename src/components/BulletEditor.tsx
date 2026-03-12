'use client';

import { useState } from 'react';

interface Props {
  bullets: string[];
  onChange: (bullets: string[]) => void;
  placeholder?: string;
}

export default function BulletEditor({ bullets, onChange, placeholder = 'Add a bullet point…' }: Props) {
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const update = (idx: number, val: string) => {
    const next = [...bullets];
    next[idx] = val;
    onChange(next);
  };

  const addBullet = () => onChange([...bullets, '']);

  const removeBullet = (idx: number) => onChange(bullets.filter((_, i) => i !== idx));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, idx: number) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const next = [...bullets];
      next.splice(idx + 1, 0, '');
      onChange(next);
      setTimeout(() => {
        const inputs = document.querySelectorAll<HTMLTextAreaElement>('[data-bullet-input]');
        inputs[idx + 1]?.focus();
      }, 0);
    }
    if (e.key === 'Backspace' && bullets[idx] === '' && bullets.length > 1) {
      e.preventDefault();
      removeBullet(idx);
      setTimeout(() => {
        const inputs = document.querySelectorAll<HTMLTextAreaElement>('[data-bullet-input]');
        inputs[Math.max(0, idx - 1)]?.focus();
      }, 0);
    }
  };

  const handleDragStart = (idx: number) => setDragging(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOver(idx);
  };
  const handleDrop = (idx: number) => {
    if (dragging === null || dragging === idx) return;
    const next = [...bullets];
    const [moved] = next.splice(dragging, 1);
    next.splice(idx, 0, moved);
    onChange(next);
    setDragging(null);
    setDragOver(null);
  };

  return (
    <div className="space-y-1">
      {bullets.map((bullet, idx) => (
        <div
          key={idx}
          draggable
          onDragStart={() => handleDragStart(idx)}
          onDragOver={(e) => handleDragOver(e, idx)}
          onDrop={() => handleDrop(idx)}
          onDragEnd={() => { setDragging(null); setDragOver(null); }}
          className={`flex items-start gap-1.5 rounded group ${dragOver === idx ? 'ring-1 ring-blue-400 bg-blue-50' : ''}`}
        >
          {/* Drag handle */}
          <div className="mt-2 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="4" r="1.2" /><circle cx="11" cy="4" r="1.2" />
              <circle cx="5" cy="8" r="1.2" /><circle cx="11" cy="8" r="1.2" />
              <circle cx="5" cy="12" r="1.2" /><circle cx="11" cy="12" r="1.2" />
            </svg>
          </div>
          <span className="mt-2 text-gray-400 text-xs flex-shrink-0">•</span>
          <textarea
            data-bullet-input
            value={bullet}
            onChange={(e) => update(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            placeholder={placeholder}
            rows={1}
            className="flex-1 text-xs text-gray-700 bg-transparent border-0 resize-none focus:outline-none focus:ring-0 leading-relaxed py-1.5 min-h-[28px]"
            style={{ overflow: 'hidden' }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = 'auto';
              t.style.height = t.scrollHeight + 'px';
            }}
          />
          <button
            onClick={() => removeBullet(idx)}
            className="mt-1.5 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <button
        onClick={addBullet}
        className="mt-1 flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add bullet
      </button>
    </div>
  );
}
