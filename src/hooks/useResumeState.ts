'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ResumeData, ExperienceItem, EducationItem, SkillCategory, ProjectItem, CertificationItem, ResumeBasics } from '@/types/resume';
import { sampleResumeData } from '@/lib/sampleData';
import { generateId } from '@/lib/utils';

const STORAGE_KEY = 'cv-edit-pro-resume';
const MAX_HISTORY = 30;

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

const emptyResume: ResumeData = {
  basics: {
    name: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    portfolio: '',
    github: '',
  },
  summary: '',
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  awards: [],
  languages: [],
  sectionOrder: ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'awards', 'languages'],
  hiddenSections: [],
};

export function useResumeState() {
  const [resume, setResumeRaw] = useState<ResumeData>(emptyResume);
  const [history, setHistory] = useState<ResumeData[]>([]);
  const [future, setFuture] = useState<ResumeData[]>([]);
  const skipSave = useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ResumeData;
        skipSave.current = true;
        setResumeRaw(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  // Autosave to localStorage
  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resume));
    } catch {
      // ignore quota errors
    }
  }, [resume]);

  const setResume = useCallback((updater: ResumeData | ((prev: ResumeData) => ResumeData)) => {
    setResumeRaw((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setHistory((h) => [...h.slice(-MAX_HISTORY), deepClone(prev)]);
      setFuture([]);
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      const newH = h.slice(0, -1);
      setResumeRaw((cur) => {
        setFuture((f) => [deepClone(cur), ...f.slice(0, MAX_HISTORY - 1)]);
        return prev;
      });
      return newH;
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      const newF = f.slice(1);
      setResumeRaw((cur) => {
        setHistory((h) => [...h.slice(-MAX_HISTORY), deepClone(cur)]);
        return next;
      });
      return newF;
    });
  }, []);

  const updateBasics = useCallback((updates: Partial<ResumeBasics>) => {
    setResume((r) => ({ ...r, basics: { ...r.basics, ...updates } }));
  }, [setResume]);

  const updateSummary = useCallback((summary: string) => {
    setResume((r) => ({ ...r, summary }));
  }, [setResume]);

  const updateExperience = useCallback((id: string, updates: Partial<ExperienceItem>) => {
    setResume((r) => ({
      ...r,
      experience: r.experience.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
  }, [setResume]);

  const addExperience = useCallback(() => {
    const newItem: ExperienceItem = {
      id: generateId(),
      jobTitle: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      bullets: [''],
      visible: true,
    };
    setResume((r) => ({ ...r, experience: [...r.experience, newItem] }));
    return newItem.id;
  }, [setResume]);

  const removeExperience = useCallback((id: string) => {
    setResume((r) => ({ ...r, experience: r.experience.filter((e) => e.id !== id) }));
  }, [setResume]);

  const updateEducation = useCallback((id: string, updates: Partial<EducationItem>) => {
    setResume((r) => ({
      ...r,
      education: r.education.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
  }, [setResume]);

  const addEducation = useCallback(() => {
    const newItem: EducationItem = {
      id: generateId(),
      degree: '',
      institution: '',
      location: '',
      startDate: '',
      endDate: '',
      details: [],
      visible: true,
    };
    setResume((r) => ({ ...r, education: [...r.education, newItem] }));
    return newItem.id;
  }, [setResume]);

  const removeEducation = useCallback((id: string) => {
    setResume((r) => ({ ...r, education: r.education.filter((e) => e.id !== id) }));
  }, [setResume]);

  const updateSkills = useCallback((skills: SkillCategory[]) => {
    setResume((r) => ({ ...r, skills }));
  }, [setResume]);

  const updateProjects = useCallback((id: string, updates: Partial<ProjectItem>) => {
    setResume((r) => ({
      ...r,
      projects: r.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  }, [setResume]);

  const addProject = useCallback(() => {
    const newItem: ProjectItem = {
      id: generateId(),
      name: '',
      description: '',
      technologies: [],
      bullets: [''],
      visible: true,
    };
    setResume((r) => ({ ...r, projects: [...r.projects, newItem] }));
    return newItem.id;
  }, [setResume]);

  const removeProject = useCallback((id: string) => {
    setResume((r) => ({ ...r, projects: r.projects.filter((p) => p.id !== id) }));
  }, [setResume]);

  const updateCertifications = useCallback((certifications: CertificationItem[]) => {
    setResume((r) => ({ ...r, certifications }));
  }, [setResume]);

  const updateAwards = useCallback((awards: string[]) => {
    setResume((r) => ({ ...r, awards }));
  }, [setResume]);

  const updateLanguages = useCallback((languages: string[]) => {
    setResume((r) => ({ ...r, languages }));
  }, [setResume]);

  const reorderSections = useCallback((newOrder: string[]) => {
    setResume((r) => ({ ...r, sectionOrder: newOrder }));
  }, [setResume]);

  const toggleSection = useCallback((section: string) => {
    setResume((r) => ({
      ...r,
      hiddenSections: r.hiddenSections.includes(section)
        ? r.hiddenSections.filter((s) => s !== section)
        : [...r.hiddenSections, section],
    }));
  }, [setResume]);

  const loadSampleData = useCallback(() => {
    setResume(() => deepClone(sampleResumeData));
  }, [setResume]);

  const loadParsedResume = useCallback((data: ResumeData) => {
    setResume(() => data);
  }, [setResume]);

  const clearResume = useCallback(() => {
    setResume(() => deepClone(emptyResume));
  }, [setResume]);

  return {
    resume,
    history,
    future,
    undo,
    redo,
    canUndo: history.length > 0,
    canRedo: future.length > 0,
    updateBasics,
    updateSummary,
    updateExperience,
    addExperience,
    removeExperience,
    updateEducation,
    addEducation,
    removeEducation,
    updateSkills,
    updateProjects,
    addProject,
    removeProject,
    updateCertifications,
    updateAwards,
    updateLanguages,
    reorderSections,
    toggleSection,
    loadSampleData,
    loadParsedResume,
    clearResume,
  };
}
