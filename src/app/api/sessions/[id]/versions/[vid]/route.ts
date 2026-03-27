import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface Params {
  params: Promise<{ id: string; vid: string }>;
}

// GET /api/sessions/[id]/versions/[vid] — get a specific version's full data
export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, vid } = await params;

  // Verify ownership
  const resumeSession = await prisma.resumeSession.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!resumeSession) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const version = await prisma.resumeVersion.findFirst({
    where: { id: vid, sessionId: id },
  });
  if (!version) {
    return NextResponse.json({ error: 'Version not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: version.id,
    source: version.source,
    label: version.label,
    resumeData: JSON.parse(version.resumeData),
    createdAt: version.createdAt,
  });
}

// DELETE /api/sessions/[id]/versions/[vid] — delete a version
export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, vid } = await params;

  const resumeSession = await prisma.resumeSession.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!resumeSession) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const version = await prisma.resumeVersion.findFirst({
    where: { id: vid, sessionId: id },
  });
  if (!version) {
    return NextResponse.json({ error: 'Version not found' }, { status: 404 });
  }

  await prisma.resumeVersion.delete({ where: { id: vid } });
  return NextResponse.json({ success: true });
}
