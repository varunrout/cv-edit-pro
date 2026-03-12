import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing resume text' }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.1,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are an expert resume parser. You extract structured data from raw resume text and return JSON.

Return a JSON object with EXACTLY this structure:
{
  "basics": {
    "name": "Full Name",
    "title": "Most recent job title or professional title",
    "email": "email@example.com",
    "phone": "+1 (555) 123-4567",
    "location": "City, State",
    "linkedin": "linkedin.com/in/username",
    "github": "github.com/username",
    "portfolio": "https://portfolio.com"
  },
  "summary": "Professional summary text if present, otherwise empty string",
  "experience": [
    {
      "jobTitle": "Job Title",
      "company": "Company Name",
      "location": "City, State",
      "startDate": "Month YYYY",
      "endDate": "Month YYYY or Present",
      "bullets": ["Achievement or responsibility 1", "Achievement 2"]
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "University Name",
      "location": "City, State",
      "startDate": "YYYY",
      "endDate": "YYYY",
      "details": ["GPA: X.X", "Relevant coursework", "Honors"]
    }
  ],
  "skills": [
    {
      "name": "Category Name",
      "items": ["Skill1", "Skill2"]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Brief description",
      "technologies": ["Tech1", "Tech2"],
      "bullets": ["What was built/achieved"]
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "date": "Month YYYY"
    }
  ],
  "awards": ["Award description"],
  "languages": ["English", "Spanish"]
}

Rules:
- Extract ALL information from the resume, do not skip any sections
- Sections may have non-standard names (e.g. "Selected Sports Analytics Projects" is a projects section, "Technical Skills" is skills)
- Parse date ranges into "Month YYYY" format when possible
- If a section is not present in the resume, return an empty array or empty string
- For experience bullets, keep the original wording — do not rephrase
- Categorize skills logically (e.g. "Languages", "Frameworks", "Tools")
- If the person's title is not explicitly stated, infer it from the most recent job
- Personal projects, side projects, academic projects, and portfolio projects all go in the "projects" array
- Return ONLY valid JSON`,
        },
        {
          role: 'user',
          content: `Parse this resume:\n\n${text.slice(0, 15000)}`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'Empty AI response' }, { status: 500 });
    }

    const parsed = JSON.parse(content);
    return NextResponse.json({ data: parsed });
  } catch (error: unknown) {
    console.error('Parse API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
