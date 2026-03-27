-- CreateTable
CREATE TABLE "ResumeVersion" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "resumeData" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Snapshot',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResumeVersion_sessionId_idx" ON "ResumeVersion"("sessionId");

-- AddForeignKey
ALTER TABLE "ResumeVersion" ADD CONSTRAINT "ResumeVersion_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ResumeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
