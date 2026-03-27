import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/sessions/[id]/duplicate — duplicate a session (with its versions)
export async function POST(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const original = await prisma.resumeSession.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!original) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const duplicate = await prisma.resumeSession.create({
    data: {
      userId: session.user.id,
      name: `${original.name} (copy)`,
      resumeData: original.resumeData,
    },
  });

  return NextResponse.json({
    id: duplicate.id,
    name: duplicate.name,
  });
}
