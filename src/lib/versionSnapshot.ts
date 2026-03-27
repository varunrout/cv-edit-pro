import { prisma } from '@/lib/prisma';

/**
 * Create a snapshot of the current resume data as a ResumeVersion.
 *
 * @param sessionId - The resume session ID
 * @param source    - "parse" | "ai-edit" | "manual" | "auto"
 * @param label     - Human-readable description of the snapshot
 * @param resumeData - Optional: explicit JSON string, otherwise reads from session
 */
export async function createVersionSnapshot(
  sessionId: string,
  source: string,
  label: string,
  resumeData?: string,
) {
  let data = resumeData;

  if (!data) {
    const session = await prisma.resumeSession.findUnique({
      where: { id: sessionId },
      select: { resumeData: true },
    });
    data = session?.resumeData || '{}';
  }

  // Don't snapshot empty resumes
  if (data === '{}') return null;

  return prisma.resumeVersion.create({
    data: { sessionId, resumeData: data, source, label },
  });
}
