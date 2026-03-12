'use client';

import { useState } from 'react';
import { jsPDF } from 'jspdf';
import type { ResumeData } from '@/types/resume';

interface Props {
  template: 'classic' | 'modern' | 'compact';
  onTemplateChange: (t: 'classic' | 'modern' | 'compact') => void;
  resume: ResumeData;
  sessionName: string;
}

const TEMPLATES = [
  { id: 'classic' as const, label: 'Classic' },
  { id: 'modern' as const, label: 'Modern' },
  { id: 'compact' as const, label: 'Compact' },
];

type TemplateMetrics = {
  nameSize: number;
  titleSize: number;
  bodySize: number;
  smallSize: number;
  sectionSize: number;
  lineGap: number;
  compactGap: number;
  sectionGap: number;
};

type PdfContext = {
  doc: jsPDF;
  pageWidth: number;
  pageHeight: number;
  marginX: number;
  marginTop: number;
  marginBottom: number;
  contentWidth: number;
  y: number;
  metrics: TemplateMetrics;
};

function getMetrics(template: Props['template']): TemplateMetrics {
  if (template === 'compact') {
    return {
      nameSize: 18,
      titleSize: 10,
      bodySize: 8.7,
      smallSize: 8.1,
      sectionSize: 9,
      lineGap: 4,
      compactGap: 1.2,
      sectionGap: 3.4,
    };
  }

  return {
    nameSize: 20,
    titleSize: 11,
    bodySize: 9.2,
    smallSize: 8.5,
    sectionSize: 9.5,
    lineGap: 4.5,
    compactGap: 1.8,
    sectionGap: 4.2,
  };
}

function sanitizeFilename(value: string) {
  return value.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'resume';
}

function createPdfContext(template: Props['template']): PdfContext {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 10;
  const marginTop = 10;
  const marginBottom = 10;

  return {
    doc,
    pageWidth,
    pageHeight,
    marginX,
    marginTop,
    marginBottom,
    contentWidth: pageWidth - marginX * 2,
    y: marginTop,
    metrics: getMetrics(template),
  };
}

function pageContentHeight(ctx: PdfContext) {
  return ctx.pageHeight - ctx.marginTop - ctx.marginBottom;
}

function ensureSpace(ctx: PdfContext, needed: number) {
  if (ctx.y + needed <= ctx.pageHeight - ctx.marginBottom) return;
  ctx.doc.addPage();
  ctx.y = ctx.marginTop;
}

function getWrappedLines(ctx: PdfContext, text: string, width = ctx.contentWidth) {
  return ctx.doc.splitTextToSize(text || '', width) as string[];
}

function measureWrapped(ctx: PdfContext, text: string, width = ctx.contentWidth, lineGap = ctx.metrics.lineGap) {
  const lines = getWrappedLines(ctx, text, width);
  return Math.max(lines.length, 1) * lineGap;
}

function writeWrapped(
  ctx: PdfContext,
  text: string,
  options?: { x?: number; width?: number; lineGap?: number }
) {
  const x = options?.x ?? ctx.marginX;
  const width = options?.width ?? ctx.contentWidth;
  const lineGap = options?.lineGap ?? ctx.metrics.lineGap;
  const lines = getWrappedLines(ctx, text, width);

  lines.forEach((line) => {
    ensureSpace(ctx, lineGap + 1);
    ctx.doc.text(line, x, ctx.y);
    ctx.y += lineGap;
  });
}

function measureBullet(ctx: PdfContext, text: string) {
  return measureWrapped(ctx, text, ctx.contentWidth - 5, ctx.metrics.lineGap);
}

function writeBullet(ctx: PdfContext, text: string) {
  const bulletX = ctx.marginX + 1;
  const textX = ctx.marginX + 5;
  const lines = getWrappedLines(ctx, text, ctx.contentWidth - 5);
  const bulletHeight = Math.max(lines.length, 1) * ctx.metrics.lineGap;

  if (bulletHeight <= pageContentHeight(ctx)) {
    ensureSpace(ctx, bulletHeight + 0.5);
  }

  lines.forEach((line, index) => {
    ensureSpace(ctx, ctx.metrics.lineGap + 0.5);
    if (index === 0) {
      ctx.doc.text('•', bulletX, ctx.y);
    }
    ctx.doc.text(line, textX, ctx.y);
    ctx.y += ctx.metrics.lineGap;
  });
}

function sectionHeaderHeight(ctx: PdfContext) {
  return ctx.metrics.sectionGap + 2.6;
}

function drawSectionHeader(ctx: PdfContext, title: string) {
  ensureSpace(ctx, sectionHeaderHeight(ctx));
  ctx.y += 1;
  ctx.doc.setFont('helvetica', 'bold');
  ctx.doc.setFontSize(ctx.metrics.sectionSize);
  ctx.doc.setTextColor(31, 41, 55);
  ctx.doc.text(title.toUpperCase(), ctx.marginX, ctx.y);
  ctx.y += 1.6;
  ctx.doc.setDrawColor(55, 65, 81);
  ctx.doc.setLineWidth(0.35);
  ctx.doc.line(ctx.marginX, ctx.y, ctx.pageWidth - ctx.marginX, ctx.y);
  ctx.y += ctx.metrics.sectionGap;
}

function drawHeader(ctx: PdfContext, resume: ResumeData) {
  const { basics } = resume;
  const contactItems = [
    basics.email,
    basics.phone,
    basics.location,
    basics.linkedin,
    basics.github,
    basics.portfolio,
  ].filter(Boolean);

  ctx.doc.setFont('helvetica', 'bold');
  ctx.doc.setFontSize(ctx.metrics.nameSize);
  ctx.doc.setTextColor(17, 24, 39);
  ctx.doc.text(basics.name || 'Your Name', ctx.marginX, ctx.y);
  ctx.y += ctx.metrics.nameSize * 0.35;

  if (basics.title) {
    ctx.doc.setFont('helvetica', 'bold');
    ctx.doc.setFontSize(ctx.metrics.titleSize);
    ctx.doc.setTextColor(75, 85, 99);
    ctx.doc.text(basics.title, ctx.marginX, ctx.y);
    ctx.y += ctx.metrics.titleSize * 0.5;
  }

  if (contactItems.length > 0) {
    ctx.doc.setFont('helvetica', 'normal');
    ctx.doc.setFontSize(ctx.metrics.smallSize);
    ctx.doc.setTextColor(107, 114, 128);
    writeWrapped(ctx, contactItems.join('  •  '), { lineGap: ctx.metrics.lineGap - 0.3 });
  }

  ctx.y += ctx.metrics.compactGap;
}

function estimateSummaryHeight(ctx: PdfContext, summary: string) {
  return sectionHeaderHeight(ctx) + measureWrapped(ctx, summary, ctx.contentWidth, ctx.metrics.lineGap) + 1.5;
}

function remainingPageSpace(ctx: PdfContext) {
  return ctx.pageHeight - ctx.marginBottom - ctx.y;
}

function ensureFitsIfPossible(ctx: PdfContext, height: number) {
  if (height <= pageContentHeight(ctx) && height > remainingPageSpace(ctx)) {
    ctx.doc.addPage();
    ctx.y = ctx.marginTop;
  }
}

function estimateExperienceHeaderHeight(ctx: PdfContext, entry: ResumeData['experience'][number]) {
  let height = measureWrapped(
    ctx,
    [entry.jobTitle, entry.company].filter(Boolean).join(' · '),
    ctx.contentWidth - 34,
    ctx.metrics.lineGap
  );
  if (entry.location) {
    height += ctx.metrics.lineGap - 0.3;
  }
  return height + 0.8;
}

function estimateEducationHeaderHeight(ctx: PdfContext, entry: ResumeData['education'][number]) {
  let height = measureWrapped(
    ctx,
    [entry.degree, entry.institution].filter(Boolean).join(' · '),
    ctx.contentWidth - 34,
    ctx.metrics.lineGap
  );
  if (entry.location) {
    height += ctx.metrics.lineGap - 0.4;
  }
  return height + 0.8;
}

function estimateProjectLeadHeight(ctx: PdfContext, entry: ResumeData['projects'][number]) {
  let height = measureWrapped(ctx, entry.name, ctx.contentWidth, ctx.metrics.lineGap);
  if (entry.technologies.length) {
    height += measureWrapped(ctx, entry.technologies.join(', '), ctx.contentWidth, ctx.metrics.lineGap - 0.4);
  }
  if (entry.description) {
    height += measureWrapped(ctx, entry.description, ctx.contentWidth, ctx.metrics.lineGap - 0.1);
  }
  return height + 0.8;
}

function estimateCertificationLineHeight(ctx: PdfContext, entry: ResumeData['certifications'][number]) {
  return measureWrapped(
    ctx,
    `• ${[entry.name, entry.issuer].filter(Boolean).join(' · ')}`,
    ctx.contentWidth - 24,
    ctx.metrics.lineGap
  ) + 0.8;
}

function drawSummary(ctx: PdfContext, resume: ResumeData) {
  if (!resume.summary || resume.hiddenSections.includes('summary')) return;

  const estimated = estimateSummaryHeight(ctx, resume.summary);
  if (estimated <= pageContentHeight(ctx)) {
    ensureSpace(ctx, estimated);
  }

  drawSectionHeader(ctx, 'Professional Summary');
  ctx.doc.setFont('helvetica', 'normal');
  ctx.doc.setFontSize(ctx.metrics.bodySize);
  ctx.doc.setTextColor(55, 65, 81);
  writeWrapped(ctx, resume.summary, { lineGap: ctx.metrics.lineGap });
  ctx.y += 1.5;
}

function drawExperience(ctx: PdfContext, resume: ResumeData) {
  if (resume.hiddenSections.includes('experience')) return;
  const items = resume.experience.filter((item) => item.visible);
  if (!items.length) return;

  ensureSpace(ctx, sectionHeaderHeight(ctx) + 6);
  drawSectionHeader(ctx, 'Work Experience');

  items.forEach((item) => {
    ensureFitsIfPossible(ctx, estimateExperienceHeaderHeight(ctx, item));

    ctx.doc.setFont('helvetica', 'bold');
    ctx.doc.setFontSize(ctx.metrics.bodySize + 1);
    ctx.doc.setTextColor(17, 24, 39);
    writeWrapped(ctx, [item.jobTitle, item.company].filter(Boolean).join(' · '), {
      width: ctx.contentWidth - 34,
      lineGap: ctx.metrics.lineGap,
    });

    const dateText = [item.startDate, item.endDate].filter(Boolean).join(' – ');
    if (dateText) {
      ctx.doc.setFont('helvetica', 'normal');
      ctx.doc.setFontSize(ctx.metrics.smallSize);
      ctx.doc.setTextColor(107, 114, 128);
      ctx.doc.text(dateText, ctx.pageWidth - ctx.marginX, ctx.y - ctx.metrics.lineGap, { align: 'right' });
    }

    if (item.location) {
      ctx.doc.setFont('helvetica', 'normal');
      ctx.doc.setFontSize(ctx.metrics.smallSize);
      ctx.doc.setTextColor(107, 114, 128);
      writeWrapped(ctx, item.location, { lineGap: ctx.metrics.lineGap - 0.3 });
    }

    ctx.doc.setFont('helvetica', 'normal');
    ctx.doc.setFontSize(ctx.metrics.bodySize);
    ctx.doc.setTextColor(55, 65, 81);
    item.bullets.filter(Boolean).forEach((bullet) => {
      ensureFitsIfPossible(ctx, measureBullet(ctx, bullet));
      writeBullet(ctx, bullet);
    });
    ctx.y += 2;
  });
}

function drawEducation(ctx: PdfContext, resume: ResumeData) {
  if (resume.hiddenSections.includes('education')) return;
  const items = resume.education.filter((item) => item.visible);
  if (!items.length) return;

  ensureSpace(ctx, sectionHeaderHeight(ctx) + 6);
  drawSectionHeader(ctx, 'Education');

  items.forEach((item) => {
    ensureFitsIfPossible(ctx, estimateEducationHeaderHeight(ctx, item));

    ctx.doc.setFont('helvetica', 'bold');
    ctx.doc.setFontSize(ctx.metrics.bodySize + 0.8);
    ctx.doc.setTextColor(17, 24, 39);
    writeWrapped(ctx, [item.degree, item.institution].filter(Boolean).join(' · '), {
      width: ctx.contentWidth - 34,
      lineGap: ctx.metrics.lineGap,
    });

    const dateText = [item.startDate, item.endDate].filter(Boolean).join(' – ');
    if (dateText) {
      ctx.doc.setFont('helvetica', 'normal');
      ctx.doc.setFontSize(ctx.metrics.smallSize);
      ctx.doc.setTextColor(107, 114, 128);
      ctx.doc.text(dateText, ctx.pageWidth - ctx.marginX, ctx.y - ctx.metrics.lineGap, { align: 'right' });
    }

    if (item.location) {
      ctx.doc.setFont('helvetica', 'normal');
      ctx.doc.setFontSize(ctx.metrics.smallSize);
      ctx.doc.setTextColor(107, 114, 128);
      writeWrapped(ctx, item.location, { lineGap: ctx.metrics.lineGap - 0.4 });
    }

    ctx.doc.setFont('helvetica', 'normal');
    ctx.doc.setFontSize(ctx.metrics.bodySize);
    ctx.doc.setTextColor(55, 65, 81);
    item.details.filter(Boolean).forEach((detail) => {
      ensureFitsIfPossible(ctx, measureBullet(ctx, detail));
      writeBullet(ctx, detail);
    });
    ctx.y += 1.8;
  });
}

function estimateSkillsHeight(ctx: PdfContext, skills: ResumeData['skills']) {
  return sectionHeaderHeight(ctx) + skills.reduce((sum, skill) => {
    const prefix = skill.name && skill.name !== 'Skills' ? `${skill.name}: ` : '';
    return sum + measureWrapped(ctx, `${prefix}${skill.items.join(', ')}`);
  }, 0) + 1.5;
}

function drawSkills(ctx: PdfContext, resume: ResumeData) {
  if (resume.hiddenSections.includes('skills') || !resume.skills.length) return;
  const estimated = estimateSkillsHeight(ctx, resume.skills);
  if (estimated <= pageContentHeight(ctx)) {
    ensureSpace(ctx, estimated);
  }

  drawSectionHeader(ctx, 'Skills');
  ctx.doc.setFont('helvetica', 'normal');
  ctx.doc.setFontSize(ctx.metrics.bodySize);
  ctx.doc.setTextColor(55, 65, 81);

  resume.skills.forEach((skill) => {
    const prefix = skill.name && skill.name !== 'Skills' ? `${skill.name}: ` : '';
    writeWrapped(ctx, `${prefix}${skill.items.join(', ')}`, { lineGap: ctx.metrics.lineGap });
  });

  ctx.y += 1.5;
}

function drawProjects(ctx: PdfContext, resume: ResumeData) {
  if (resume.hiddenSections.includes('projects')) return;
  const items = resume.projects.filter((item) => item.visible);
  if (!items.length) return;

  ensureSpace(ctx, sectionHeaderHeight(ctx) + 6);
  drawSectionHeader(ctx, 'Projects');

  items.forEach((item) => {
    ensureFitsIfPossible(ctx, estimateProjectLeadHeight(ctx, item));

    ctx.doc.setFont('helvetica', 'bold');
    ctx.doc.setFontSize(ctx.metrics.bodySize + 0.8);
    ctx.doc.setTextColor(17, 24, 39);
    writeWrapped(ctx, item.name, { lineGap: ctx.metrics.lineGap });

    if (item.technologies.length) {
      ctx.doc.setFont('helvetica', 'italic');
      ctx.doc.setFontSize(ctx.metrics.smallSize);
      ctx.doc.setTextColor(107, 114, 128);
      writeWrapped(ctx, item.technologies.join(', '), { lineGap: ctx.metrics.lineGap - 0.4 });
    }

    if (item.description) {
      ctx.doc.setFont('helvetica', 'normal');
      ctx.doc.setFontSize(ctx.metrics.bodySize);
      ctx.doc.setTextColor(75, 85, 99);
      writeWrapped(ctx, item.description, { lineGap: ctx.metrics.lineGap - 0.1 });
    }

    ctx.doc.setFont('helvetica', 'normal');
    ctx.doc.setFontSize(ctx.metrics.bodySize);
    ctx.doc.setTextColor(55, 65, 81);
    item.bullets.filter(Boolean).forEach((bullet) => {
      ensureFitsIfPossible(ctx, measureBullet(ctx, bullet));
      writeBullet(ctx, bullet);
    });
    ctx.y += 1.8;
  });
}

function drawCertifications(ctx: PdfContext, resume: ResumeData) {
  if (resume.hiddenSections.includes('certifications')) return;
  const items = resume.certifications.filter((item) => item.visible);
  if (!items.length) return;

  ensureSpace(ctx, sectionHeaderHeight(ctx) + 6);
  drawSectionHeader(ctx, 'Certifications');

  items.forEach((item) => {
    ensureFitsIfPossible(ctx, estimateCertificationLineHeight(ctx, item));

    ctx.doc.setFont('helvetica', 'normal');
    ctx.doc.setFontSize(ctx.metrics.bodySize);
    ctx.doc.setTextColor(55, 65, 81);
    writeWrapped(ctx, `• ${[item.name, item.issuer].filter(Boolean).join(' · ')}`, {
      width: ctx.contentWidth - 24,
      lineGap: ctx.metrics.lineGap,
    });

    if (item.date) {
      ctx.doc.setFont('helvetica', 'normal');
      ctx.doc.setFontSize(ctx.metrics.smallSize);
      ctx.doc.setTextColor(107, 114, 128);
      ctx.doc.text(item.date, ctx.pageWidth - ctx.marginX, ctx.y - ctx.metrics.lineGap, { align: 'right' });
    }
  });

  ctx.y += 1.2;
}

function estimateSimpleListHeight(ctx: PdfContext, items: string[]) {
  return sectionHeaderHeight(ctx) + items.filter(Boolean).reduce((sum, item) => sum + measureBullet(ctx, item), 0) + 1.2;
}

function drawSimpleListSection(ctx: PdfContext, title: string, items: string[]) {
  const filtered = items.filter(Boolean);
  if (!filtered.length) return;

  const estimated = estimateSimpleListHeight(ctx, filtered);
  if (estimated <= pageContentHeight(ctx)) {
    ensureSpace(ctx, estimated);
  }

  drawSectionHeader(ctx, title);
  ctx.doc.setFont('helvetica', 'normal');
  ctx.doc.setFontSize(ctx.metrics.bodySize);
  ctx.doc.setTextColor(55, 65, 81);
  filtered.forEach((item) => writeBullet(ctx, item));
  ctx.y += 1.2;
}

function drawLanguages(ctx: PdfContext, resume: ResumeData) {
  if (resume.hiddenSections.includes('languages')) return;
  const items = resume.languages.filter(Boolean);
  if (!items.length) return;

  const estimated = sectionHeaderHeight(ctx) + measureWrapped(ctx, items.join(' • ')) + 1.2;
  if (estimated <= pageContentHeight(ctx)) {
    ensureSpace(ctx, estimated);
  }

  drawSectionHeader(ctx, 'Languages');
  ctx.doc.setFont('helvetica', 'normal');
  ctx.doc.setFontSize(ctx.metrics.bodySize);
  ctx.doc.setTextColor(55, 65, 81);
  writeWrapped(ctx, items.join(' • '), { lineGap: ctx.metrics.lineGap });
  ctx.y += 1.2;
}

function buildResumePdf(resume: ResumeData, template: Props['template']) {
  const ctx = createPdfContext(template);
  drawHeader(ctx, resume);

  resume.sectionOrder.forEach((section) => {
    switch (section) {
      case 'summary':
        drawSummary(ctx, resume);
        break;
      case 'experience':
        drawExperience(ctx, resume);
        break;
      case 'education':
        drawEducation(ctx, resume);
        break;
      case 'skills':
        drawSkills(ctx, resume);
        break;
      case 'projects':
        drawProjects(ctx, resume);
        break;
      case 'certifications':
        drawCertifications(ctx, resume);
        break;
      case 'awards':
        if (!resume.hiddenSections.includes('awards')) {
          drawSimpleListSection(ctx, 'Awards & Honors', resume.awards);
        }
        break;
      case 'languages':
        drawLanguages(ctx, resume);
        break;
      default:
        break;
    }
  });

  return ctx.doc;
}

function createPrintableClone(preview: HTMLElement) {
  const clone = preview.cloneNode(true) as HTMLElement;
  clone.style.width = 'auto';
  clone.style.maxWidth = 'none';
  clone.style.minHeight = '0';
  clone.style.height = 'auto';
  clone.style.margin = '0';
  clone.style.padding = '8mm 10mm';
  clone.style.boxShadow = 'none';
  clone.style.overflow = 'visible';
  clone.style.background = '#ffffff';
  clone.style.border = 'none';
  return clone;
}

function getPrintHeadMarkup() {
  const styleNodes = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((node) => node.outerHTML)
    .join('\n');

  return `
    ${styleNodes}
    <style>
      @page {
        size: A4;
        margin: 8mm 10mm;
      }

      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
        overflow: visible !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      body {
        font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      }

      .cv-preview {
        width: auto !important;
        max-width: none !important;
        min-height: 0 !important;
        height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        overflow: visible !important;
        background: #fff !important;
      }

      .cv-preview p,
      .cv-preview li,
      .cv-preview h2,
      .cv-preview h3,
      .cv-preview .experience-item {
        break-inside: avoid-page;
        page-break-inside: avoid;
      }
    </style>
  `;
}

export default function PrintToolbar({ template, onTemplateChange, resume, sessionName }: Props) {
  const [exporting, setExporting] = useState(false);

  const handlePrint = () => {
    if (exporting) return;

    try {
      setExporting(true);
      const doc = buildResumePdf(resume, template);
      doc.autoPrint({ variant: 'non-conform' });
      const blobUrl = doc.output('bloburl');
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadPdf = () => {
    if (exporting) return;

    try {
      setExporting(true);
      const doc = buildResumePdf(resume, template);
      doc.save(`${sanitizeFilename(sessionName || 'Resume Session')}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="no-print flex items-center gap-3 px-4 py-2 bg-white border-b border-gray-200">
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => onTemplateChange(t.id)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              template === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      <button
        onClick={handlePrint}
        disabled={exporting}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-wait"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        {exporting ? 'Preparing…' : 'Print'}
      </button>

      <button
        onClick={handleDownloadPdf}
        disabled={exporting}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-wait"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {exporting ? 'Preparing…' : 'Download PDF'}
      </button>
    </div>
  );
}
