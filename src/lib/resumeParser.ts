import {
  ResumeData,
  ExperienceItem,
  EducationItem,
  SkillCategory,
  ProjectItem,
  CertificationItem,
} from '@/types/resume';
import { generateId } from '@/lib/utils';

const SECTION_PATTERNS: Record<string, RegExp> = {
  experience: /\b(work\s+)?experience\b|\bemployment\b|\bcareer\s+history\b|\bprofessional\s+experience\b/i,
  education: /\beducation\b|\bacademic\s+background\b|\bqualifications\b/i,
  skills: /\b(technical\s+)?skills\b|\bcore\s+competencies\b|\bexpertise\b|\btechnologies\b/i,
  summary: /\b(professional\s+)?summary\b|\bprofile\b|\bobjective\b|\babout(\s+me)?\b/i,
  projects: /\bprojects\b/i,
  certifications: /\bcertifications?\b|\bcertificates?\b|\bcredentials\b|\blicenses?\b/i,
  awards: /\bawards?\b|\bhonors?\b|\bachievements?\b|\baccomplishments?\b/i,
  languages: /\blanguages?\b/i,
};

const DATE_RANGE_RE =
  /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{4})\s*[-–—]\s*((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{4}|present|current|now)/i;

/** Matches a proper name: 2–4 space-separated words each starting with a capital letter. */
const NAME_PATTERN = /^[A-Z][a-zÀ-ÖØ-öø-ÿ'-]+(\s+[A-Z][a-zÀ-ÖØ-öø-ÿ'-]*){1,3}$/;

function detectSectionType(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 80) return null;
  for (const [key, pattern] of Object.entries(SECTION_PATTERNS)) {
    if (pattern.test(trimmed)) return key;
  }
  return null;
}

function isSectionHeader(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 80) return false;
  if (detectSectionType(trimmed)) return true;
  // All-caps line that looks like a header
  if (trimmed === trimmed.toUpperCase() && trimmed.length > 2 && /^[A-Z\s&/-]+$/.test(trimmed)) {
    return true;
  }
  return false;
}

function splitIntoSections(lines: string[]): Map<string, string[]> {
  const sections = new Map<string, string[]>();
  let currentSection = 'header';
  let currentLines: string[] = [];

  for (const line of lines) {
    if (isSectionHeader(line)) {
      sections.set(currentSection, currentLines);
      currentSection = detectSectionType(line) ?? line.trim().toLowerCase().replace(/\s+/g, '_');
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  sections.set(currentSection, currentLines);
  return sections;
}

function parseHeader(lines: string[]): {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
} {
  const text = lines.join('\n');

  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  const phoneMatch = text.match(/[\+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}/);
  const linkedinMatch = text.match(/(?:linkedin\.com\/in\/|linkedin:\s*)([^\s|,\n]+)/i);
  const githubMatch = text.match(/(?:github\.com\/|github:\s*)([^\s|,\n]+)/i);
  const portfolioMatch = text.match(/(?:https?:\/\/(?!linkedin|github)[\w.-]+\.[\w]{2,}[^\s|,\n]*)/i);

  // Name: first non-empty, non-url line that looks like a proper name
  let name = '';
  let title = '';
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    if (t.match(/@|https?:|linkedin\.com|github\.com/i)) continue;
    if (t.match(/[\+]?[(]?[0-9]{3}[)]?[-\s.]/)) continue;
    if (!name && NAME_PATTERN.test(t)) {
      name = t;
      continue;
    }
    if (name && !title && t.length < 80 && !t.match(/[@(|]/)) {
      title = t;
      break;
    }
  }

  return {
    name,
    title,
    email: emailMatch?.[0] ?? '',
    phone: phoneMatch?.[0] ?? '',
    location: '',
    linkedin: linkedinMatch ? `linkedin.com/in/${linkedinMatch[1]}` : '',
    github: githubMatch ? `github.com/${githubMatch[1]}` : '',
    portfolio: portfolioMatch?.[0] ?? '',
  };
}

function extractBullets(lines: string[]): string[] {
  const bullets: string[] = [];
  let current = '';
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    if (/^[•\-*▪►✓✔]/.test(t)) {
      if (current) bullets.push(current);
      current = t.replace(/^[•\-*▪►✓✔]\s*/, '');
    } else if (current) {
      current += ' ' + t;
    } else {
      bullets.push(t);
    }
  }
  if (current) bullets.push(current);
  return bullets.filter(Boolean);
}

function parseExperience(lines: string[]): ExperienceItem[] {
  const items: ExperienceItem[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]?.trim() ?? '';
    if (!line) { i++; continue; }

    const dateMatch = line.match(DATE_RANGE_RE) ?? lines[i + 1]?.match(DATE_RANGE_RE);
    if (dateMatch) {
      const dateIndex = line.match(DATE_RANGE_RE) ? i : i + 1;
      const headerLine = lines[dateIndex].trim();
      const dateLine = lines[dateIndex].trim();

      // Try to extract job title and company from surrounding lines
      let jobTitle = '';
      let company = '';
      let location = '';

      const titleLine = lines[i]?.trim() ?? '';
      const nextLine = lines[i + 1]?.trim() ?? '';

      // Pattern: "Job Title | Company | Location" or "Job Title at Company" or two separate lines
      if (titleLine.includes('|')) {
        const parts = titleLine.split(/\s*\|\s*/);
        jobTitle = parts[0]?.trim() ?? '';
        company = parts[1]?.trim() ?? '';
        location = parts[2]?.trim() ?? '';
        i++;
      } else if (titleLine.includes(' at ')) {
        const parts = titleLine.split(/\s+at\s+/i);
        jobTitle = parts[0]?.trim() ?? '';
        company = parts[1]?.trim() ?? '';
        i++;
      } else if (!titleLine.match(DATE_RANGE_RE) && nextLine.match(DATE_RANGE_RE)) {
        jobTitle = titleLine;
        i++;
      } else if (titleLine.match(DATE_RANGE_RE)) {
        // Date is on same line, try to split
        jobTitle = titleLine.replace(DATE_RANGE_RE, '').trim();
        i++;
      } else {
        jobTitle = titleLine;
        if (nextLine && !nextLine.match(DATE_RANGE_RE) && !nextLine.match(/^[•\-*]/)) {
          company = nextLine;
          i += 2;
        } else {
          i++;
        }
      }

      // Extract date range
      const fullDateMatch = dateLine.match(DATE_RANGE_RE) ?? lines[dateIndex]?.match(DATE_RANGE_RE);
      const startDate = fullDateMatch?.[1] ?? '';
      const endDate = fullDateMatch?.[2] ?? '';

      // Advance past date line if needed
      if (dateIndex > i - 1) i = dateIndex + 1;

      // Collect bullets — stop when we hit a new job entry or section header
      const bulletLines: string[] = [];
      while (i < lines.length) {
        const bl = lines[i]?.trim() ?? '';
        if (!bl) { i++; continue; }
        if (isSectionHeader(bl)) break;
        // A non-bullet line that is followed by a date line signals a new job entry;
        // check only the next two non-empty lines to avoid creating a new array each iteration
        if (!bl.match(/^[•\-*▪►✓✔]/) && bulletLines.length > 0) {
          let nextNonEmpty: string | undefined;
          for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
            const candidate = lines[j]?.trim();
            if (candidate) { nextNonEmpty = candidate; break; }
          }
          if (nextNonEmpty?.match(DATE_RANGE_RE)) break;
        }
        if (bl.match(DATE_RANGE_RE) && bulletLines.length > 0) break;
        // A pipe-separated line without a leading bullet looks like "Title | Company"
        if (!bl.match(/^[•\-*▪►✓✔]/) && bl.includes('|') && bulletLines.length > 0) break;
        bulletLines.push(lines[i]);
        i++;
      }

      items.push({
        id: generateId(),
        jobTitle,
        company,
        location,
        startDate,
        endDate,
        bullets: extractBullets(bulletLines),
        visible: true,
      });
    } else {
      i++;
    }
  }

  return items;
}

function parseEducation(lines: string[]): EducationItem[] {
  const items: EducationItem[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]?.trim() ?? '';
    if (!line) { i++; continue; }

    const dateMatch = line.match(/\b\d{4}\b/) ?? lines[i + 1]?.match(/\b\d{4}\b/);
    if (dateMatch) {
      let degree = line;
      let institution = '';
      let location = '';
      let startDate = '';
      let endDate = '';

      // If line has a pipe separator, split into degree | institution
      if (line.includes('|') && !line.match(DATE_RANGE_RE)) {
        const parts = line.split(/\s*\|\s*/);
        degree = parts[0]?.trim() ?? line;
        institution = parts[1]?.trim() ?? '';
        location = parts[2]?.trim() ?? '';
        i++;
        // Next line may be the date range
        const nextLine = lines[i]?.trim() ?? '';
        const nextRangeMatch = nextLine.match(DATE_RANGE_RE);
        if (nextRangeMatch) {
          startDate = nextRangeMatch[1];
          endDate = nextRangeMatch[2];
          i++;
        } else if (nextLine.match(/\b(\d{4})\b/)) {
          endDate = nextLine.match(/\b(\d{4})\b/)![1];
          i++;
        }
      } else {
        // Look for year range or single year in the current line
        const rangeMatch = line.match(DATE_RANGE_RE);
        const yearMatch = line.match(/\b(\d{4})\b/);

        if (rangeMatch) {
          startDate = rangeMatch[1];
          endDate = rangeMatch[2];
          degree = line.replace(DATE_RANGE_RE, '').trim().replace(/[-–—|,]+$/, '').trim();
        } else if (yearMatch) {
          endDate = yearMatch[1];
          degree = line.replace(/\b\d{4}\b/, '').trim().replace(/[-–—|,]+$/, '').trim();
        }

        const next = lines[i + 1]?.trim() ?? '';
        if (next && !next.match(/\b\d{4}\b/) && !next.match(/^[•\-*]/)) {
          institution = next;
          i += 2;
        } else {
          i++;
        }
      }

      const detailLines: string[] = [];
      while (i < lines.length) {
        const bl = lines[i]?.trim() ?? '';
        if (!bl) { i++; continue; }
        if (isSectionHeader(bl) || bl.match(/\b\d{4}\b/)) break;
        detailLines.push(lines[i]);
        i++;
      }

      items.push({
        id: generateId(),
        degree,
        institution,
        location,
        startDate,
        endDate,
        details: extractBullets(detailLines),
        visible: true,
      });
    } else {
      i++;
    }
  }

  return items;
}

function parseSkills(lines: string[]): SkillCategory[] {
  const categories: SkillCategory[] = [];
  let current: SkillCategory | null = null;

  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;

    // Pattern: "Category: skill1, skill2"
    const colonSplit = t.match(/^([^:]{2,40}):\s*(.+)/);
    if (colonSplit) {
      if (current) categories.push(current);
      current = {
        id: generateId(),
        name: colonSplit[1].trim(),
        items: colonSplit[2].split(/[,;|]/).map((s) => s.trim()).filter(Boolean),
      };
    } else if (current) {
      // continuation line
      const more = t.split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
      current.items.push(...more);
    } else {
      // Flat list
      const items = t.split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
      if (items.length > 1) {
        categories.push({ id: generateId(), name: 'Skills', items });
        return categories;
      }
    }
  }
  if (current) categories.push(current);
  if (categories.length === 0 && lines.length > 0) {
    const allItems = lines
      .join(', ')
      .split(/[,;|\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    categories.push({ id: generateId(), name: 'Skills', items: allItems });
  }
  return categories;
}

function parseProjects(lines: string[]): ProjectItem[] {
  const items: ProjectItem[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]?.trim() ?? '';
    if (!line) { i++; continue; }

    // Project name line (not a bullet)
    if (!line.match(/^[•\-*]/)) {
      const name = line.replace(/[|–—].*$/, '').trim();
      const techMatch = line.match(/[|–—]\s*(.+)$/);
      const technologies = techMatch
        ? techMatch[1].split(/[,;]/).map((s) => s.trim()).filter(Boolean)
        : [];
      i++;

      const bulletLines: string[] = [];
      let description = '';
      while (i < lines.length) {
        const bl = lines[i]?.trim() ?? '';
        if (!bl) { i++; continue; }
        if (isSectionHeader(bl)) break;
        if (!bl.match(/^[•\-*]/) && bulletLines.length === 0 && !description) {
          description = bl;
          i++;
          continue;
        }
        bulletLines.push(lines[i]);
        i++;
      }

      items.push({
        id: generateId(),
        name,
        description,
        technologies,
        bullets: extractBullets(bulletLines),
        visible: true,
      });
    } else {
      i++;
    }
  }

  return items;
}

function parseCertifications(lines: string[]): CertificationItem[] {
  return lines
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const parts = l.replace(/^[•\-*]\s*/, '').split(/[|–—,]/).map((s) => s.trim());
      return {
        id: generateId(),
        name: parts[0] ?? l,
        issuer: parts[1] ?? '',
        date: parts[2] ?? '',
        visible: true,
      };
    });
}

export function parseResume(rawText: string): ResumeData {
  const lines = rawText.split('\n');
  const sections = splitIntoSections(lines);

  const headerLines = sections.get('header') ?? [];
  const headerData = parseHeader(headerLines);

  const summaryLines = sections.get('summary') ?? [];
  const summary = summaryLines
    .map((l) => l.trim())
    .filter(Boolean)
    .join(' ');

  const experienceLines = sections.get('experience') ?? [];
  const experience = parseExperience(experienceLines);

  const educationLines = sections.get('education') ?? [];
  const education = parseEducation(educationLines);

  const skillLines = sections.get('skills') ?? [];
  const skills = parseSkills(skillLines);

  const projectLines = sections.get('projects') ?? [];
  const projects = parseProjects(projectLines);

  const certLines = sections.get('certifications') ?? [];
  const certifications = parseCertifications(certLines);

  const awardLines = sections.get('awards') ?? [];
  const awards = awardLines
    .map((l) => l.trim().replace(/^[•\-*]\s*/, ''))
    .filter(Boolean);

  const langLines = sections.get('languages') ?? [];
  const languages = langLines
    .flatMap((l) => l.split(/[,;|]/))
    .map((l) => l.trim().replace(/^[•\-*]\s*/, ''))
    .filter(Boolean);

  const sectionOrder = ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'awards', 'languages'];

  return {
    basics: headerData,
    summary,
    experience,
    education,
    skills,
    projects,
    certifications,
    awards,
    languages,
    sectionOrder,
    hiddenSections: [],
  };
}
