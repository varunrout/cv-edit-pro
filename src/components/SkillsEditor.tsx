'use client';

import { useState } from 'react';
import { SkillCategory } from '@/types/resume';

interface Props {
  skills: SkillCategory[];
  onChange: (skills: SkillCategory[]) => void;
}

function SkillCategoryEditor({
  category,
  onChange,
  onRemove,
}: {
  category: SkillCategory;
  onChange: (updates: Partial<SkillCategory>) => void;
  onRemove: () => void;
}) {
  const [newSkill, setNewSkill] = useState('');

  const addSkill = () => {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    // Support comma-separated input
    const skills = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
    onChange({ items: [...category.items, ...skills] });
    setNewSkill('');
  };

  const removeSkill = (idx: number) => {
    onChange({ items: category.items.filter((_, i) => i !== idx) });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={category.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Category name"
          className="flex-1 text-xs font-medium text-gray-700 border-0 border-b border-transparent focus:border-gray-300 focus:outline-none bg-transparent py-0.5 placeholder-gray-400"
        />
        <button onClick={onRemove} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {category.items.map((skill, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full group"
          >
            {skill}
            <button
              onClick={() => removeSkill(idx)}
              className="text-gray-400 hover:text-red-400 transition-colors"
            >
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
      </div>

      <div className="flex gap-1.5">
        <input
          type="text"
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addSkill()}
          placeholder="Add skill (comma-separated)…"
          className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-400 bg-white placeholder-gray-400"
        />
        <button
          onClick={addSkill}
          className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}

export default function SkillsEditor({ skills, onChange }: Props) {
  const update = (id: string, updates: Partial<SkillCategory>) => {
    onChange(skills.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const remove = (id: string) => {
    onChange(skills.filter((s) => s.id !== id));
  };

  const addCategory = () => {
    onChange([
      ...skills,
      { id: crypto.randomUUID(), name: 'New Category', items: [] },
    ]);
  };

  return (
    <div className="space-y-2">
      {skills.map((category) => (
        <SkillCategoryEditor
          key={category.id}
          category={category}
          onChange={(updates) => update(category.id, updates)}
          onRemove={() => remove(category.id)}
        />
      ))}
      <button
        onClick={addCategory}
        className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-1.5"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Skill Category
      </button>
    </div>
  );
}
