import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { bullet, jobTitle } = await req.json();
    if (!bullet || typeof bullet !== 'string') {
      return NextResponse.json({ error: 'Missing bullet text' }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 200,
      messages: [
        {
          role: 'system',
          content: `You are a professional resume writer. Improve resume bullet points to be more impactful.

Rules:
- Start with a strong action verb
- Include specific metrics or outcomes if possible
- Keep it under 2 lines (max ~150 characters)
- Use professional, concise language
- Do not fabricate specific numbers unless present in the original
- Return ONLY the improved bullet point text, no explanation or quotes`,
        },
        {
          role: 'user',
          content: `Improve this bullet point for a ${jobTitle || 'professional'} role:\n\n"${bullet}"`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json({ error: 'Empty AI response' }, { status: 500 });
    }

    return NextResponse.json({ enhanced: content });
  } catch (error: unknown) {
    console.error('Enhance bullet API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
