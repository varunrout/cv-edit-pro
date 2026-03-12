import { ResumeData } from '@/types/resume';
import { generateId } from '@/lib/utils';

/**
 * Normalizes a raw parsed object (from the AI API) into a full ResumeData,
 * ensuring every item has an id, visible flag, and the correct shape.
 */
export function normalizeAIResponse(raw: Record<string, unknown>): ResumeData {
  const basics = (raw.basics ?? {}) as Record<string, string>;
  const experience = Array.isArray(raw.experience) ? raw.experience : [];
  const education = Array.isArray(raw.education) ? raw.education : [];
  const skills = Array.isArray(raw.skills) ? raw.skills : [];
  const projects = Array.isArray(raw.projects) ? raw.projects : [];
  const certifications = Array.isArray(raw.certifications) ? raw.certifications : [];
  const awards = Array.isArray(raw.awards) ? raw.awards : [];
  const languages = Array.isArray(raw.languages) ? raw.languages : [];

  return {
    basics: {
      name: basics.name ?? '',
      title: basics.title ?? '',
      email: basics.email ?? '',
      phone: basics.phone ?? '',
      location: basics.location ?? '',
      linkedin: basics.linkedin ?? '',
      github: basics.github ?? '',
      portfolio: basics.portfolio ?? '',
    },
    summary: typeof raw.summary === 'string' ? raw.summary : '',
    experience: experience.map((e: Record<string, unknown>) => ({
      id: generateId(),
      jobTitle: String(e.jobTitle ?? e.title ?? ''),
      company: String(e.company ?? ''),
      location: String(e.location ?? ''),
      startDate: String(e.startDate ?? ''),
      endDate: String(e.endDate ?? ''),
      bullets: Array.isArray(e.bullets) ? e.bullets.map(String) : [],
      visible: true,
    })),
    education: education.map((e: Record<string, unknown>) => ({
      id: generateId(),
      degree: String(e.degree ?? ''),
      institution: String(e.institution ?? ''),
      location: String(e.location ?? ''),
      startDate: String(e.startDate ?? ''),
      endDate: String(e.endDate ?? ''),
      details: Array.isArray(e.details) ? e.details.map(String) : [],
      visible: true,
    })),
    skills: skills.map((s: Record<string, unknown>) => ({
      id: generateId(),
      name: String(s.name ?? s.category ?? 'Skills'),
      items: Array.isArray(s.items) ? s.items.map(String) : [],
    })),
    projects: projects.map((p: Record<string, unknown>) => ({
      id: generateId(),
      name: String(p.name ?? ''),
      description: String(p.description ?? ''),
      technologies: Array.isArray(p.technologies) ? p.technologies.map(String) : [],
      bullets: Array.isArray(p.bullets) ? p.bullets.map(String) : [],
      visible: true,
    })),
    certifications: certifications.map((c: Record<string, unknown>) => ({
      id: generateId(),
      name: String(c.name ?? ''),
      issuer: String(c.issuer ?? ''),
      date: String(c.date ?? ''),
      visible: true,
    })),
    awards: awards.map(String),
    languages: languages.map(String),
    sectionOrder: [
      'summary', 'experience', 'education', 'skills',
      'projects', 'certifications', 'awards', 'languages',
    ],
    hiddenSections: [],
  };
}
