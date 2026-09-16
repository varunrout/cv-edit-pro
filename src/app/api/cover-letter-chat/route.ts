import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import type { ResumeData } from '@/types/resume';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function repairJSON(raw: string): string {
  let s = raw.trim();
  const quotes = (s.match(/(?<!\\)"/g) || []).length;
  if (quotes % 2 !== 0) s += '"';
  const opens: string[] = [];
  let inString = false;
  let escape = false;
  for (const ch of s) {
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{' || ch === '[') opens.push(ch);
    if (ch === '}' && opens.length && opens[opens.length - 1] === '{') opens.pop();
    if (ch === ']' && opens.length && opens[opens.length - 1] === '[') opens.pop();
  }
  for (let i = opens.length - 1; i >= 0; i--) {
    s += opens[i] === '{' ? '}' : ']';
  }
  return s;
}

function tryParseJSON(raw: string): { reply: string; revisedText?: string | null } | null {
  try {
    return JSON.parse(raw);
  } catch {
    try {
      return JSON.parse(repairJSON(raw));
    } catch {
      return null;
    }
  }
}

export async function POST(req: Request) {
  try {
    const { messages, currentText, basics } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Missing messages' }, { status: 400 });
    }

    const basicsContext = basics
      ? `\n\nFor tone/context, the candidate's resume basics: ${JSON.stringify(basics as ResumeData['basics'])}`
      : '';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.6,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a cover letter writing assistant embedded in a resume editor. The user has already pasted their own cover letter text — you help them improve or rewrite it based on their instructions (tone, length, emphasis, grammar, etc). You do not generate a cover letter from scratch unless the current text is empty and they explicitly ask you to draft one.

Current cover letter text:
"""
${currentText || '(empty)'}
"""${basicsContext}

ALWAYS respond with a JSON object in this exact format:
{
  "reply": "Short, conversational response describing what you did or answering their question",
  "revisedText": "the FULL revised cover letter text" | null
}

Rules:
- Set "revisedText" to the complete rewritten letter (not a diff/snippet) whenever the user asks for a change. Preserve the parts they didn't ask to change.
- Set "revisedText" to null when the user is just asking a question or chatting (no edit requested).
- In ALL string values, use only standard ASCII characters — replace em dashes with ' - ', curly quotes with straight quotes, etc.
- Keep "reply" brief (1-2 sentences).`,
        },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ reply: 'Sorry, I got an empty response. Please try again.', revisedText: null });
    }

    const parsed = tryParseJSON(content);
    if (!parsed) {
      return NextResponse.json({
        reply: 'I had trouble formatting my response. Here\'s what I tried to say:\n\n' + content.slice(0, 2000),
        revisedText: null,
      });
    }

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error('Cover letter chat API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
