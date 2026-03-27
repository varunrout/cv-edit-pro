import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createVersionSnapshot } from '@/lib/versionSnapshot';

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/sessions/[id] — get full session data + chat messages
export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const resumeSession = await prisma.resumeSession.findFirst({
    where: { id, userId: session.user.id },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!resumeSession) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: resumeSession.id,
    name: resumeSession.name,
    resumeData: JSON.parse(resumeSession.resumeData),
    messages: resumeSession.messages.map((m: { id: string; role: string; content: string; edits: string | null }) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      edits: m.edits ? JSON.parse(m.edits) : null,
    })),
    createdAt: resumeSession.createdAt,
    updatedAt: resumeSession.updatedAt,
  });
}

// PUT /api/sessions/[id] — update session name or resume data
export async function PUT(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  // Verify ownership
  const existing = await prisma.resumeSession.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const updateData: Record<string, string> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.resumeData !== undefined) updateData.resumeData = JSON.stringify(body.resumeData);

  // If a snapshot source is provided, create a version snapshot before updating
  if (body.snapshotSource && body.resumeData !== undefined) {
    await createVersionSnapshot(
      id,
      body.snapshotSource,
      body.snapshotLabel || 'Snapshot',
      existing.resumeData,
    );
  }

  const updated = await prisma.resumeSession.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ id: updated.id, name: updated.name, updatedAt: updated.updatedAt });
}

// DELETE /api/sessions/[id] — delete a session
export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.resumeSession.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  await prisma.resumeSession.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
