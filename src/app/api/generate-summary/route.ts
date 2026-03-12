import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { resumeData } = await req.json();
    if (!resumeData) {
      return NextResponse.json({ error: 'Missing resume data' }, { status: 400 });
    }

    const name = resumeData.basics?.name ?? 'the candidate';
    const title = resumeData.basics?.title ?? 'professional';
    const companies = resumeData.experience
      ?.slice(0, 3)
      .map((e: { company: string }) => e.company)
      .filter(Boolean)
      .join(', ');
    const skills = resumeData.skills
      ?.flatMap((s: { items: string[] }) => s.items)
      .slice(0, 10)
      .join(', ');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content: `You write compelling professional resume summaries. Return ONLY the summary text — no labels, quotes, or explanation.`,
        },
        {
          role: 'user',
          content: `Write a 3-sentence professional summary (60-80 words) for:

Name: ${name}
Title: ${title}
Recent companies: ${companies || 'various companies'}
Key skills: ${skills || 'various skills'}
Experience entries: ${resumeData.experience?.length ?? 0}

Requirements:
- First sentence: Who they are and their experience level
- Second sentence: Key technical strengths and domain expertise
- Third sentence: Value they bring and career highlights
- Tone: Professional, confident, third-person`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json({ error: 'Empty AI response' }, { status: 500 });
    }

    return NextResponse.json({ summary: content });
  } catch (error: unknown) {
    console.error('Generate summary API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
