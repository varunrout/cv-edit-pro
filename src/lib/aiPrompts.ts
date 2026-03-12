import { ResumeData } from '@/types/resume';

/**
 * Mock AI prompts — illustrates what would be sent to an LLM API.
 * These are purely illustrative; no external API calls are made.
 */

export function buildParsePrompt(rawText: string): string {
  return `You are an expert resume parser. Given the following raw resume text, extract all information and return a structured JSON object matching this schema:

{
  "basics": { "name": "", "title": "", "email": "", "phone": "", "location": "", "linkedin": "", "github": "", "portfolio": "" },
  "summary": "",
  "experience": [{ "id": "", "jobTitle": "", "company": "", "location": "", "startDate": "", "endDate": "", "bullets": [], "visible": true }],
  "education": [{ "id": "", "degree": "", "institution": "", "location": "", "startDate": "", "endDate": "", "details": [], "visible": true }],
  "skills": [{ "id": "", "name": "", "items": [] }],
  "projects": [{ "id": "", "name": "", "description": "", "technologies": [], "bullets": [], "visible": true }],
  "certifications": [{ "id": "", "name": "", "issuer": "", "date": "", "visible": true }],
  "awards": [],
  "languages": [],
  "sectionOrder": ["summary", "experience", "education", "skills", "projects", "certifications", "awards", "languages"],
  "hiddenSections": []
}

Rules:
- Extract the full name (usually the first prominent line)
- Infer job title from most recent experience if not explicitly stated
- Parse all date ranges into "Month YYYY" format when possible
- Convert paragraph descriptions into concise bullet points
- Categorize skills logically
- Return only valid JSON, no markdown

Resume text:
---
${rawText.slice(0, 3000)}
---`;
}

export function buildEnhanceBulletPrompt(bullet: string, jobTitle: string): string {
  return `You are a professional resume writer. Improve the following resume bullet point for a ${jobTitle} role.

Original bullet:
"${bullet}"

Requirements:
- Start with a strong action verb
- Include specific metrics or outcomes if possible
- Keep it under 2 lines (max ~150 characters)
- Use professional, concise language
- Do not fabricate specific numbers unless present in the original

Return only the improved bullet point text, no explanation.`;
}

export function buildSummaryPrompt(resumeData: Partial<ResumeData>): string {
  const name = resumeData.basics?.name ?? 'the candidate';
  const title = resumeData.basics?.title ?? 'professional';
  const yearsExp = resumeData.experience?.length
    ? `${resumeData.experience.length * 2}+`
    : 'several';
  const companies = resumeData.experience
    ?.slice(0, 3)
    .map((e) => e.company)
    .join(', ');

  return `Write a compelling 3-sentence professional summary for a resume.

Candidate info:
- Name: ${name}
- Current/Most recent title: ${title}
- Years of experience: ${yearsExp} years
- Recent companies: ${companies ?? 'various companies'}
- Key skills: ${resumeData.skills?.flatMap((s) => s.items).slice(0, 8).join(', ') ?? 'various skills'}

Requirements:
- First sentence: Who they are and years of experience
- Second sentence: Key technical strengths and domain expertise
- Third sentence: What value they bring / career highlights
- Tone: Professional, confident, third-person
- Length: 60–80 words total

Return only the summary text, no labels or explanation.`;
}

export function buildKeywordsPrompt(jobDescription: string, resumeData: ResumeData): string {
  return `Analyze the following job description and identify keywords that should be added to the resume to improve ATS (Applicant Tracking System) match rate.

Job Description:
---
${jobDescription.slice(0, 2000)}
---

Current Resume Skills: ${resumeData.skills.flatMap((s) => s.items).join(', ')}

Return a JSON array of missing keywords to add, grouped by category:
{
  "technicalSkills": [],
  "softSkills": [],
  "certifications": [],
  "industryTerms": []
}`;
}
