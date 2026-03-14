'use client';

import { forwardRef } from 'react';
import { ResumeData } from '@/types/resume';

interface Props {
  resume: ResumeData;
  template?: 'classic' | 'modern' | 'compact';
}

const ResumePreview = forwardRef<HTMLDivElement, Props>(function ResumePreview(
  { resume, template = 'classic' },
  ref
) {
  const { basics, summary, experience, education, skills, projects, certifications, awards, languages, sectionOrder, hiddenSections } = resume;

  const isHidden = (section: string) => hiddenSections.includes(section);
  const isCompact = template === 'compact';

  const sectionHeaderClass = `resume-section-heading text-[10px] font-bold uppercase tracking-[0.12em] text-gray-800 border-b border-gray-800 pb-0.5 ${isCompact ? 'mb-1' : 'mb-2'}`;
  const sectionClass = `resume-section ${isCompact ? 'mb-2' : 'mb-4'}`;

  const contactItems = [
    basics.email,
    basics.phone,
    basics.location,
    basics.linkedin,
    basics.github,
    basics.portfolio,
  ].filter(Boolean);

  const renderSection = (section: string) => {
    if (isHidden(section)) return null;

    switch (section) {
      case 'summary':
        if (!summary) return null;
        return (
          <div key="summary" className={sectionClass}>
            <h2 className={sectionHeaderClass}>Professional Summary</h2>
            <p className="text-[10.5px] text-gray-700 leading-[1.55]">{summary}</p>
          </div>
        );

      case 'experience': {
        const visibleExp = experience.filter((e) => e.visible);
        if (!visibleExp.length) return null;
        return (
          <div key="experience" className={sectionClass}>
            <h2 className={sectionHeaderClass}>Work Experience</h2>
            <div className={isCompact ? 'space-y-2' : 'space-y-3'}>
              {visibleExp.map((exp) => (
                <div key={exp.id} className="resume-entry experience-item">
                  <div className="flex justify-between items-baseline gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-semibold text-gray-900">{exp.jobTitle}</span>
                      {exp.company && (
                        <>
                          <span className="text-[10.5px] text-gray-600 mx-1">·</span>
                          <span className="text-[10.5px] text-gray-700">{exp.company}</span>
                        </>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500 flex-shrink-0 whitespace-nowrap">
                      {exp.startDate}{exp.endDate ? ` – ${exp.endDate}` : ''}
                    </span>
                  </div>
                  {exp.location && (
                    <p className="text-[10px] text-gray-500 mt-0.5">{exp.location}</p>
                  )}
                  {exp.bullets.filter(Boolean).length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {exp.bullets.filter(Boolean).map((bullet, i) => (
                        <li key={i} className="flex gap-2 text-[10.5px] text-gray-700 leading-[1.5]">
                          <span className="flex-shrink-0 mt-[3px] text-gray-400">•</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'education': {
        const visibleEdu = education.filter((e) => e.visible);
        if (!visibleEdu.length) return null;
        return (
          <div key="education" className={sectionClass}>
            <h2 className={sectionHeaderClass}>Education</h2>
            <div className="space-y-2">
              {visibleEdu.map((edu) => (
                <div key={edu.id} className="resume-entry">
                  <div className="flex justify-between items-baseline gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-semibold text-gray-900">{edu.degree}</span>
                      {edu.institution && (
                        <>
                          <span className="text-[10.5px] text-gray-600 mx-1">·</span>
                          <span className="text-[10.5px] text-gray-700">{edu.institution}</span>
                        </>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500 flex-shrink-0 whitespace-nowrap">
                      {edu.startDate && edu.endDate ? `${edu.startDate} – ${edu.endDate}` : edu.endDate ?? edu.startDate}
                    </span>
                  </div>
                  {edu.location && <p className="text-[10px] text-gray-500 mt-0.5">{edu.location}</p>}
                  {edu.details.filter(Boolean).length > 0 && (
                    <ul className="mt-0.5 space-y-0.5">
                      {edu.details.filter(Boolean).map((d, i) => (
                        <li key={i} className="flex gap-2 text-[10.5px] text-gray-600 leading-[1.5]">
                          <span className="flex-shrink-0 mt-[3px] text-gray-400">•</span>
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'skills': {
        if (!skills.length) return null;
        return (
          <div key="skills" className={sectionClass}>
            <h2 className={sectionHeaderClass}>Skills</h2>
            <div className={isCompact ? 'space-y-0.5' : 'space-y-1'}>
              {skills.map((cat) => (
                <div key={cat.id} className="flex gap-1.5 text-[10.5px] leading-[1.5]">
                  {cat.name && cat.name !== 'Skills' && (
                    <span className="font-semibold text-gray-800 flex-shrink-0">{cat.name}:</span>
                  )}
                  <span className="text-gray-700">{cat.items.join(', ')}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'projects': {
        const visibleProj = projects.filter((p) => p.visible);
        if (!visibleProj.length) return null;
        return (
          <div key="projects" className={sectionClass}>
            <h2 className={sectionHeaderClass}>Projects</h2>
            <div className={isCompact ? 'space-y-1.5' : 'space-y-2.5'}>
              {visibleProj.map((proj) => (
                <div key={proj.id} className="resume-entry">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-[11px] font-semibold text-gray-900">{proj.name}</span>
                    {proj.technologies.length > 0 && (
                      <>
                        <span className="text-[10px] text-gray-400">|</span>
                        <span className="text-[10px] text-gray-500 italic">{proj.technologies.join(', ')}</span>
                      </>
                    )}
                  </div>
                  {proj.description && (
                    <p className="text-[10.5px] text-gray-600 mt-0.5">{proj.description}</p>
                  )}
                  {proj.bullets.filter(Boolean).length > 0 && (
                    <ul className="mt-0.5 space-y-0.5">
                      {proj.bullets.filter(Boolean).map((b, i) => (
                        <li key={i} className="flex gap-2 text-[10.5px] text-gray-700 leading-[1.5]">
                          <span className="flex-shrink-0 mt-[3px] text-gray-400">•</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'certifications': {
        const visibleCerts = certifications.filter((c) => c.visible);
        if (!visibleCerts.length) return null;
        return (
          <div key="certifications" className={sectionClass}>
            <h2 className={sectionHeaderClass}>Certifications</h2>
            <div className="space-y-0.5">
              {visibleCerts.map((cert) => (
                <div key={cert.id} className="flex justify-between items-baseline gap-2">
                  <div className="flex items-baseline gap-1.5 text-[10.5px]">
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-800">{cert.name}</span>
                    {cert.issuer && <span className="text-gray-500">· {cert.issuer}</span>}
                  </div>
                  {cert.date && <span className="text-[10px] text-gray-500 flex-shrink-0">{cert.date}</span>}
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'awards': {
        if (!awards.filter(Boolean).length) return null;
        return (
          <div key="awards" className={sectionClass}>
            <h2 className={sectionHeaderClass}>Awards & Honors</h2>
            <ul className="space-y-0.5">
              {awards.filter(Boolean).map((award, i) => (
                <li key={i} className="flex gap-2 text-[10.5px] text-gray-700 leading-[1.5]">
                  <span className="flex-shrink-0 mt-[3px] text-gray-400">•</span>
                  <span>{award}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      }

      case 'languages': {
        if (!languages.filter(Boolean).length) return null;
        return (
          <div key="languages" className={sectionClass}>
            <h2 className={sectionHeaderClass}>Languages</h2>
            <p className="text-[10.5px] text-gray-700">{languages.filter(Boolean).join(' · ')}</p>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div
      ref={ref}
      className="cv-preview bg-white text-gray-900"
      style={{
        width: '100%',
        maxWidth: '794px',
        minHeight: '1123px',
        padding: isCompact ? '48px 56px' : '56px 64px',
        fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
        boxSizing: 'border-box',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      {/* Header */}
      <div className={isCompact ? 'mb-3' : 'mb-5'}>
        <h1
          style={{
            fontSize: isCompact ? '22px' : '26px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#111827',
            lineHeight: 1.1,
            marginBottom: '4px',
          }}
        >
          {basics.name || 'Your Name'}
        </h1>
        {basics.title && (
          <p
            style={{
              fontSize: '13px',
              color: '#4B5563',
              fontWeight: 500,
              marginBottom: '6px',
              letterSpacing: '0.01em',
            }}
          >
            {basics.title}
          </p>
        )}
        {contactItems.length > 0 && (
          <p style={{ fontSize: '10px', color: '#6B7280', lineHeight: '1.6' }}>
            {contactItems.join('  ·  ')}
          </p>
        )}
      </div>

      {/* Sections */}
      {sectionOrder.map((section) => renderSection(section))}
    </div>
  );
});

export default ResumePreview;
