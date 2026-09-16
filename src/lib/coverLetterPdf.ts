import { jsPDF } from 'jspdf';
import type { ResumeData } from '@/types/resume';

function sanitizeFilename(value: string) {
  return value.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').toLowerCase() || 'cover_letter';
}

/** Splits pasted text into paragraphs on blank lines, trimming each. */
function toParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function buildCoverLetterPdf(basics: ResumeData['basics'], content: string): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 20;
  const marginTop = 20;
  const marginBottom = 20;
  const contentWidth = pageWidth - marginX * 2;
  const lineGap = 5.2;
  let y = marginTop;

  const ensureSpace = (needed: number) => {
    if (y + needed <= pageHeight - marginBottom) return;
    doc.addPage();
    y = marginTop;
  };

  const writeWrapped = (text: string, options?: { fontSize?: number; bold?: boolean }) => {
    doc.setFont('helvetica', options?.bold ? 'bold' : 'normal');
    doc.setFontSize(options?.fontSize ?? 10.5);
    const lines = doc.splitTextToSize(text, contentWidth) as string[];
    lines.forEach((line) => {
      ensureSpace(lineGap);
      doc.text(line, marginX, y);
      y += lineGap;
    });
  };

  // Header — name + contact line, same info as the resume.
  doc.setTextColor(17, 24, 39);
  writeWrapped(basics.name || 'Your Name', { fontSize: 16, bold: true });
  y += 1;

  const contactItems = [basics.email, basics.phone, basics.location, basics.linkedin].filter(Boolean);
  if (contactItems.length) {
    doc.setTextColor(107, 114, 128);
    writeWrapped(contactItems.join('  •  '), { fontSize: 9 });
  }
  y += 3;

  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.3);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 6;

  // Date
  doc.setTextColor(107, 114, 128);
  writeWrapped(
    new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    { fontSize: 9.5 }
  );
  y += 6;

  // Body
  doc.setTextColor(31, 41, 55);
  const paragraphs = toParagraphs(content);
  paragraphs.forEach((para, i) => {
    writeWrapped(para, { fontSize: 10.5 });
    if (i < paragraphs.length - 1) y += 3.5;
  });

  return doc;
}

export function coverLetterFilename(sessionName: string) {
  return `${sanitizeFilename(sessionName)}_cover_letter.pdf`;
}
