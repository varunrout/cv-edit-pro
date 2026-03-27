import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/sessions/[id]/versions — list all versions for this session
export async function GET(_req: Request, { params }: Params) {
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

  const versions = await prisma.resumeVersion.findMany({
    where: { sessionId: id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, source: true, label: true, createdAt: true },
  });

  return NextResponse.json({ versions });
}

// POST /api/sessions/[id]/versions — create a manual checkpoint
export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const resumeSession = await prisma.resumeSession.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!resumeSession) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const source = body.source || 'manual';
  const label = body.label || 'Manual checkpoint';
  const resumeData = body.resumeData
    ? JSON.stringify(body.resumeData)
    : resumeSession.resumeData;

  const version = await prisma.resumeVersion.create({
    data: { sessionId: id, resumeData, source, label },
  });

  return NextResponse.json({
    id: version.id,
    source: version.source,
    label: version.label,
    createdAt: version.createdAt,
  });
}
