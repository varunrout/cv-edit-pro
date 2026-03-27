import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface Params {
  params: Promise<{ id: string; vid: string }>;
}

// POST /api/sessions/[id]/restore/[vid] — restore a version (creates a new version first)
export async function POST(_req: Request, { params }: Params) {
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

  const versionToRestore = await prisma.resumeVersion.findFirst({
    where: { id: vid, sessionId: id },
  });
  if (!versionToRestore) {
    return NextResponse.json({ error: 'Version not found' }, { status: 404 });
  }

  // Save current state as a version before overwriting
  await prisma.resumeVersion.create({
    data: {
      sessionId: id,
      resumeData: resumeSession.resumeData,
      source: 'auto',
      label: 'Before restore',
    },
  });

  // Overwrite the session with the version's data
  await prisma.resumeSession.update({
    where: { id },
    data: { resumeData: versionToRestore.resumeData },
  });

  return NextResponse.json({
    success: true,
    resumeData: JSON.parse(versionToRestore.resumeData),
  });
}
