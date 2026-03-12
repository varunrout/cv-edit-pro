import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Attempt to repair truncated JSON by closing open strings, arrays, objects.
 */
function repairJSON(raw: string): string {
  let s = raw.trim();
  // If it ends mid-string, close the string
  const quotes = (s.match(/(?<!\\)"/g) || []).length;
  if (quotes % 2 !== 0) s += '"';
  // Close open brackets/braces
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

function tryParseJSON(raw: string): { reply: string; edits?: Record<string, unknown> | null } | null {
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
    const { messages, resumeData } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Missing messages' }, { status: 400 });
    }

    const resumeContext = resumeData
      ? `\n\nCurrent resume JSON:\n${JSON.stringify(resumeData, null, 2)}`
      : '';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      max_tokens: 8192,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are an expert resume assistant embedded in a CV editing application. You help users understand, improve, and edit their resume content.

You have access to the user's current resume data. You can:
1. Answer questions about the resume content
2. Suggest improvements to bullets, summary, skills, etc.
3. Make direct edits to the resume when the user asks

ALWAYS respond with a JSON object in this exact format:
{
  "reply": "Your conversational response to the user",
  "edits": null
}

IMPORTANT OUTPUT RULES:
- In ALL string values inside your JSON, use only standard ASCII characters. Replace em dashes (\u2014) with ' - ', en dashes (\u2013) with '-', curly quotes with straight quotes, and any other non-ASCII punctuation with ASCII equivalents.
- Keep strings as short as possible. Do not add unnecessary whitespace.

When the user asks you to EDIT or CHANGE something in the resume, include an "edits" object with ONLY the fields that changed. The edits object can contain any subset of these fields:
{
  "reply": "Description of what you changed",
  "edits": {
    "basics": { "name": "...", "title": "...", "email": "...", "phone": "...", "location": "...", "linkedin": "...", "github": "...", "portfolio": "..." },
    "summary": "new summary text",
    "experience": [full array of experience items if modified],
    "education": [full array of education items if modified],
    "skills": [full array of skill categories if modified],
    "projects": [full array of project items if modified],
    "certifications": [full array of certification items if modified],
    "awards": ["award1", "award2"],
    "languages": ["lang1", "lang2"]
  }
}

Rules for edits:
- Only include fields in "edits" that the user asked to change
- When editing an array (experience, education, etc.), return the FULL array with all items, not just the changed ones
- Preserve all existing IDs when editing items — do not generate new IDs
- When editing a single bullet in experience, keep all other bullets and fields unchanged
- Set "edits" to null when the user is just asking questions or chatting
- Keep the "reply" field conversational and helpful — explain what you changed or answered
- For experience/education/projects/certifications items, always preserve the "id" and "visible" fields from the original data${resumeContext}`,
        },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ reply: 'Sorry, I got an empty response. Please try again.', edits: null });
    }

    const parsed = tryParseJSON(content);
    if (!parsed) {
      // If JSON is completely unrecoverable, return the raw text as a reply
      return NextResponse.json({
        reply: 'I had trouble formatting my response. Here\'s what I tried to say:\n\n' + content.slice(0, 2000),
        edits: null,
      });
    }

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error('Chat API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
