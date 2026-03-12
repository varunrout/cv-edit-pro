import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/sessions — list all sessions for the current user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessions = await prisma.resumeSession.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, name: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json({ sessions });
}

// POST /api/sessions — create a new session
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const name = body.name || 'Untitled Resume';
  const resumeData = body.resumeData ? JSON.stringify(body.resumeData) : '{}';

  const created = await prisma.resumeSession.create({
    data: { userId: session.user.id, name, resumeData },
  });

  return NextResponse.json({ id: created.id, name: created.name });
}
