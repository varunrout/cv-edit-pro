'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { ResumeData, CertificationItem, ResumeBasics, ExperienceItem, EducationItem, SkillCategory, ProjectItem } from '@/types/resume';
import BasicInfoEditor from './BasicInfoEditor';
import ExperienceEditor from './ExperienceEditor';
import EducationEditor from './EducationEditor';
import SkillsEditor from './SkillsEditor';
import ProjectsEditor from './ProjectsEditor';

interface Props {
  resume: ResumeData;
  onUpdateBasics: (updates: Partial<ResumeBasics>) => void;
  onUpdateSummary: (s: string) => void;
  onUpdateExperience: (id: string, u: Partial<ExperienceItem>) => void;
  onAddExperience: () => void;
  onRemoveExperience: (id: string) => void;
  onUpdateEducation: (id: string, u: Partial<EducationItem>) => void;
  onAddEducation: () => void;
  onRemoveEducation: (id: string) => void;
  onUpdateSkills: (skills: SkillCategory[]) => void;
  onUpdateProjects: (id: string, u: Partial<ProjectItem>) => void;
  onAddProject: () => void;
  onRemoveProject: (id: string) => void;
  onUpdateCertifications: (certs: CertificationItem[]) => void;
  onUpdateAwards: (awards: string[]) => void;
  onUpdateLanguages: (langs: string[]) => void;
  onReorderSections: (order: string[]) => void;
  onToggleSection: (section: string) => void;
}

const SECTION_LABELS: Record<string, string> = {
  summary: 'Summary',
  experience: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  awards: 'Awards',
  languages: 'Languages',
};

function SortableSectionCard({
  id,
  label,
  hidden,
  children,
  onToggle,
}: {
  id: string;
  label: string;
  hidden: boolean;
  children: React.ReactNode;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const [open, setOpen] = useState(true);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`bg-white border border-gray-200 rounded-xl overflow-hidden ${hidden ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border-b border-gray-100">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="5" cy="4" r="1.2" /><circle cx="11" cy="4" r="1.2" />
            <circle cx="5" cy="8" r="1.2" /><circle cx="11" cy="8" r="1.2" />
            <circle cx="5" cy="12" r="1.2" /><circle cx="11" cy="12" r="1.2" />
          </svg>
        </button>
        <button onClick={() => setOpen(!open)} className="flex-1 flex items-center gap-2 text-left">
          <span className="text-xs font-semibold text-gray-700">{label}</span>
          <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button
          onClick={onToggle}
          className={`text-xs px-1.5 py-0.5 rounded transition-colors ${hidden ? 'text-gray-300 hover:text-gray-500' : 'text-gray-400 hover:text-gray-600'}`}
          title={hidden ? 'Show section' : 'Hide section'}
        >
          {hidden ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
      {open && <div className="p-3">{children}</div>}
    </div>
  );
}

export default function ParsedSectionsEditor(props: Props) {
  const { resume } = props;
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = resume.sectionOrder.indexOf(active.id as string);
      const newIndex = resume.sectionOrder.indexOf(over.id as string);
      props.onReorderSections(arrayMove(resume.sectionOrder, oldIndex, newIndex));
    }
  };

  const renderSectionContent = (section: string) => {
    switch (section) {
      case 'summary':
        return (
          <textarea
            value={resume.summary}
            onChange={(e) => props.onUpdateSummary(e.target.value)}
            placeholder="Write a professional summary…"
            rows={4}
            className="w-full text-xs text-gray-700 border border-gray-200 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 leading-relaxed"
          />
        );
      case 'experience':
        return (
          <ExperienceEditor
            experience={resume.experience}
            onChange={props.onUpdateExperience}
            onAdd={props.onAddExperience}
            onRemove={props.onRemoveExperience}
          />
        );
      case 'education':
        return (
          <EducationEditor
            education={resume.education}
            onChange={props.onUpdateEducation}
            onAdd={props.onAddEducation}
            onRemove={props.onRemoveEducation}
          />
        );
      case 'skills':
        return <SkillsEditor skills={resume.skills} onChange={props.onUpdateSkills} />;
      case 'projects':
        return (
          <ProjectsEditor
            projects={resume.projects}
            onChange={props.onUpdateProjects}
            onAdd={props.onAddProject}
            onRemove={props.onRemoveProject}
          />
        );
      case 'certifications':
        return (
          <div className="space-y-2">
            {resume.certifications.map((cert, idx) => (
              <div key={cert.id} className="flex gap-2 items-center">
                <div className="flex-1 grid grid-cols-3 gap-1">
                  <input
                    value={cert.name}
                    onChange={(e) => {
                      const c = [...resume.certifications];
                      c[idx] = { ...c[idx], name: e.target.value };
                      props.onUpdateCertifications(c);
                    }}
                    placeholder="Certification name"
                    className="col-span-3 text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-400 text-gray-700 placeholder-gray-400"
                  />
                  <input
                    value={cert.issuer}
                    onChange={(e) => {
                      const c = [...resume.certifications];
                      c[idx] = { ...c[idx], issuer: e.target.value };
                      props.onUpdateCertifications(c);
                    }}
                    placeholder="Issuer"
                    className="col-span-2 text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-400 text-gray-700 placeholder-gray-400"
                  />
                  <input
                    value={cert.date}
                    onChange={(e) => {
                      const c = [...resume.certifications];
                      c[idx] = { ...c[idx], date: e.target.value };
                      props.onUpdateCertifications(c);
                    }}
                    placeholder="Year"
                    className="text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-400 text-gray-700 placeholder-gray-400"
                  />
                </div>
                <button
                  onClick={() => props.onUpdateCertifications(resume.certifications.filter((_, i) => i !== idx))}
                  className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              onClick={() => props.onUpdateCertifications([...resume.certifications, { id: crypto.randomUUID(), name: '', issuer: '', date: '', visible: true }])}
              className="w-full py-1.5 border border-dashed border-gray-300 rounded text-xs text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              + Add Certification
            </button>
          </div>
        );
      case 'awards':
        return (
          <div className="space-y-1.5">
            {resume.awards.map((award, idx) => (
              <div key={idx} className="flex gap-1.5 items-center">
                <span className="text-gray-400 text-xs flex-shrink-0">•</span>
                <input
                  value={award}
                  onChange={(e) => {
                    const a = [...resume.awards];
                    a[idx] = e.target.value;
                    props.onUpdateAwards(a);
                  }}
                  placeholder="Award or achievement"
                  className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-400 text-gray-700 placeholder-gray-400"
                />
                <button
                  onClick={() => props.onUpdateAwards(resume.awards.filter((_, i) => i !== idx))}
                  className="text-gray-300 hover:text-red-400 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              onClick={() => props.onUpdateAwards([...resume.awards, ''])}
              className="text-xs text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Award
            </button>
          </div>
        );
      case 'languages':
        return (
          <div className="space-y-1.5">
            <div className="flex flex-wrap gap-1.5">
              {resume.languages.map((lang, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                  <input
                    value={lang}
                    onChange={(e) => {
                      const l = [...resume.languages];
                      l[idx] = e.target.value;
                      props.onUpdateLanguages(l);
                    }}
                    className="bg-transparent border-0 focus:outline-none text-xs w-28"
                  />
                  <button
                    onClick={() => props.onUpdateLanguages(resume.languages.filter((_, i) => i !== idx))}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
            <button
              onClick={() => props.onUpdateLanguages([...resume.languages, ''])}
              className="text-xs text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Language
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {/* Basic Info — always on top */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-3 py-2.5 bg-gray-50 border-b border-gray-100">
          <span className="text-xs font-semibold text-gray-700">Contact Information</span>
        </div>
        <div className="p-3">
          <BasicInfoEditor basics={resume.basics} onChange={props.onUpdateBasics} />
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={resume.sectionOrder} strategy={verticalListSortingStrategy}>
          {resume.sectionOrder.map((section) => (
            <SortableSectionCard
              key={section}
              id={section}
              label={SECTION_LABELS[section] ?? section}
              hidden={resume.hiddenSections.includes(section)}
              onToggle={() => props.onToggleSection(section)}
            >
              {renderSectionContent(section)}
            </SortableSectionCard>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
