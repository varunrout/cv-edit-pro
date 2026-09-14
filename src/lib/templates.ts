export type TemplateId = 'classic' | 'modern' | 'compact' | 'classical';

export const TEMPLATES: { id: TemplateId; label: string }[] = [
  { id: 'classic', label: 'Classic' },
  { id: 'modern', label: 'Modern' },
  { id: 'compact', label: 'Compact' },
  { id: 'classical', label: 'Classical' },
];

export type TemplateMetrics = {
  nameSize: number;
  titleSize: number;
  bodySize: number;
  smallSize: number;
  sectionSize: number;
  lineGap: number;
  compactGap: number;
  sectionGap: number;
  /** jsPDF font family for this template's body/heading text. */
  font: 'helvetica' | 'times';
  /** Accent color (used for the section-header rule and dates) as [r,g,b]. */
  accentColor: [number, number, number];
};

const BASE_METRICS: TemplateMetrics = {
  nameSize: 20,
  titleSize: 11,
  bodySize: 9.2,
  smallSize: 8.5,
  sectionSize: 9.5,
  lineGap: 4.5,
  compactGap: 1.8,
  sectionGap: 4.2,
  font: 'helvetica',
  accentColor: [55, 65, 81],
};

export function getTemplateMetrics(template: TemplateId): TemplateMetrics {
  if (template === 'compact') {
    return {
      ...BASE_METRICS,
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

  if (template === 'classical') {
    // Serif, uppercase headings with a navy accent — ported from the
    // "classical" CV design (cv_template.html).
    return {
      ...BASE_METRICS,
      nameSize: 21,
      titleSize: 11,
      bodySize: 9.4,
      smallSize: 8.4,
      sectionSize: 9.5,
      font: 'times',
      accentColor: [26, 79, 139], // navy, matches --color-link: #1A4F8B
    };
  }

  return BASE_METRICS;
}
