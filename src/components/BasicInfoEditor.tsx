'use client';

import { ResumeBasics } from '@/types/resume';

interface Props {
  basics: ResumeBasics;
  onChange: (updates: Partial<ResumeBasics>) => void;
}

type FieldKey = keyof ResumeBasics;

const FIELDS: { key: FieldKey; label: string; placeholder: string; type?: string }[] = [
  { key: 'name', label: 'Full Name', placeholder: 'Jane Smith' },
  { key: 'title', label: 'Job Title', placeholder: 'Senior Software Engineer' },
  { key: 'email', label: 'Email', placeholder: 'jane@example.com', type: 'email' },
  { key: 'phone', label: 'Phone', placeholder: '+1 (555) 000-0000', type: 'tel' },
  { key: 'location', label: 'Location', placeholder: 'San Francisco, CA' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/in/janesmith' },
  { key: 'github', label: 'GitHub', placeholder: 'github.com/janesmith' },
  { key: 'portfolio', label: 'Portfolio / Website', placeholder: 'https://janesmith.dev' },
];

export default function BasicInfoEditor({ basics, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
      {FIELDS.map(({ key, label, placeholder, type }) => (
        <div key={key} className={key === 'name' || key === 'title' || key === 'portfolio' ? 'col-span-2' : ''}>
          <label className="block text-xs text-gray-400 mb-0.5">{label}</label>
          <input
            type={type ?? 'text'}
            value={basics[key]}
            onChange={(e) => onChange({ [key]: e.target.value })}
            placeholder={placeholder}
            className="w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white text-gray-700 placeholder-gray-400 transition-colors"
          />
        </div>
      ))}
    </div>
  );
}
