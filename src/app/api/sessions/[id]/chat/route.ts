import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/sessions/[id]/chat — save a chat message to the session
export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  // Verify ownership
  const resumeSession = await prisma.resumeSession.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!resumeSession) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const { role, content, edits } = await req.json();
  if (!role || !content) {
    return NextResponse.json({ error: 'Missing role or content' }, { status: 400 });
  }

  const message = await prisma.chatMessage.create({
    data: {
      sessionId: id,
      role,
      content,
      edits: edits ? JSON.stringify(edits) : null,
    },
  });

  return NextResponse.json({
    id: message.id,
    role: message.role,
    content: message.content,
    edits: edits || null,
  });
}
