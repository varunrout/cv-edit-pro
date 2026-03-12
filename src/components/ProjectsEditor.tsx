'use client';

import { useState } from 'react';
import { ProjectItem } from '@/types/resume';
import BulletEditor from './BulletEditor';

interface Props {
  projects: ProjectItem[];
  onChange: (id: string, updates: Partial<ProjectItem>) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

function ProjectEntry({
  item,
  onChange,
  onRemove,
}: {
  item: ProjectItem;
  onChange: (updates: Partial<ProjectItem>) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [newTech, setNewTech] = useState('');

  const addTech = () => {
    const trimmed = newTech.trim();
    if (!trimmed) return;
    const techs = trimmed.split(',').map((t) => t.trim()).filter(Boolean);
    onChange({ technologies: [...item.technologies, ...techs] });
    setNewTech('');
  };

  const removeTech = (idx: number) => {
    onChange({ technologies: item.technologies.filter((_, i) => i !== idx) });
  };

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${!item.visible ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200">
        <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600">
          <svg className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <span className="flex-1 text-xs font-medium text-gray-700 truncate">
          {item.name || 'New Project'}
        </span>
        <button
          onClick={() => onChange({ visible: !item.visible })}
          className="text-gray-400 hover:text-gray-600"
        >
          {item.visible ? (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          )}
        </button>
        <button onClick={onRemove} className="text-gray-300 hover:text-red-400 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="p-3 space-y-2">
          <input
            type="text"
            value={item.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Project Name"
            className="w-full text-xs font-medium border-0 border-b border-transparent focus:border-gray-300 focus:outline-none bg-transparent py-0.5 text-gray-700 placeholder-gray-400"
          />
          <input
            type="text"
            value={item.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Short description"
            className="w-full text-xs border-0 border-b border-transparent focus:border-gray-300 focus:outline-none bg-transparent py-0.5 text-gray-600 placeholder-gray-400"
          />

          <div>
            <p className="text-xs text-gray-400 mb-1.5">Technologies</p>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {item.technologies.map((tech, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                  {tech}
                  <button onClick={() => removeTech(idx)} className="hover:text-red-400">
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
                value={newTech}
                onChange={(e) => setNewTech(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTech()}
                placeholder="Add technology…"
                className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-400 bg-white placeholder-gray-400"
              />
              <button onClick={addTech} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200">
                Add
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-1.5">Highlights</p>
            <BulletEditor
              bullets={item.bullets.length > 0 ? item.bullets : ['']}
              onChange={(bullets) => onChange({ bullets })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectsEditor({ projects, onChange, onAdd, onRemove }: Props) {
  return (
    <div className="space-y-2">
      {projects.map((item) => (
        <ProjectEntry
          key={item.id}
          item={item}
          onChange={(updates) => onChange(item.id, updates)}
          onRemove={() => onRemove(item.id)}
        />
      ))}
      <button
        onClick={onAdd}
        className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-1.5"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Project
      </button>
    </div>
  );
}
