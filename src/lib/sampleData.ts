import { ResumeData } from '@/types/resume';

export const sampleResumeData: ResumeData = {
  basics: {
    name: 'Alexandra Chen',
    title: 'Senior Software Engineer',
    email: 'alexandra.chen@email.com',
    phone: '+1 (415) 555-0192',
    location: 'San Francisco, CA',
    linkedin: 'linkedin.com/in/alexandrachen',
    github: 'github.com/alexchen-dev',
    portfolio: 'https://alexchen.dev',
  },
  summary:
    'Senior Software Engineer with 8+ years of experience designing and building scalable distributed systems and full-stack web applications. Proven track record of leading cross-functional teams, reducing infrastructure costs, and delivering high-impact features used by millions of users. Passionate about clean architecture, developer experience, and mentoring junior engineers.',
  experience: [
    {
      id: '1',
      jobTitle: 'Senior Software Engineer',
      company: 'Stripe',
      location: 'San Francisco, CA',
      startDate: 'Jan 2021',
      endDate: 'Present',
      bullets: [
        'Led architecture and implementation of a new payment reconciliation service handling $2B+ in monthly transactions, reducing discrepancies by 94%',
        'Designed and shipped a real-time fraud detection pipeline using Kafka and ML models, preventing $12M in fraudulent charges annually',
        'Mentored a team of 6 engineers, conducting weekly 1:1s, code reviews, and quarterly career development planning',
        'Reduced CI/CD pipeline build times by 58% through parallelization and intelligent caching strategies',
        'Collaborated with Product and Design to redesign the merchant dashboard, increasing user engagement by 37%',
      ],
      visible: true,
    },
    {
      id: '2',
      jobTitle: 'Software Engineer II',
      company: 'Airbnb',
      location: 'San Francisco, CA',
      startDate: 'Mar 2018',
      endDate: 'Dec 2020',
      bullets: [
        'Built and maintained core booking flow APIs serving 150M+ requests per day with 99.98% uptime',
        'Implemented A/B testing infrastructure that enabled the team to run 40+ concurrent experiments',
        'Migrated legacy monolith services to microservices architecture, improving deployment frequency by 5×',
        'Developed internal tooling for on-call engineers that reduced mean time to resolution by 45%',
        'Contributed to open-source projects including React hooks library with 3k+ GitHub stars',
      ],
      visible: true,
    },
    {
      id: '3',
      jobTitle: 'Software Engineer',
      company: 'Dropbox',
      location: 'San Francisco, CA',
      startDate: 'Jun 2016',
      endDate: 'Feb 2018',
      bullets: [
        'Developed core file sync algorithms in Python and Go, improving sync reliability by 23%',
        'Implemented end-to-end encryption for the Business tier product serving 500k+ enterprise customers',
        'Built internal dashboards and alerting systems using React and Grafana',
        'Participated in on-call rotation and resolved P0/P1 incidents with average resolution time under 30 minutes',
      ],
      visible: true,
    },
  ],
  education: [
    {
      id: '1',
      degree: 'B.S. Computer Science',
      institution: 'University of California, Berkeley',
      location: 'Berkeley, CA',
      startDate: '2012',
      endDate: '2016',
      details: ['GPA: 3.8/4.0', 'Dean\'s List (all semesters)', 'Teaching Assistant — Data Structures & Algorithms'],
      visible: true,
    },
  ],
  skills: [
    {
      id: '1',
      name: 'Languages',
      items: ['Python', 'TypeScript', 'Go', 'Java', 'SQL', 'Bash'],
    },
    {
      id: '2',
      name: 'Frameworks & Libraries',
      items: ['React', 'Next.js', 'Node.js', 'FastAPI', 'gRPC', 'GraphQL'],
    },
    {
      id: '3',
      name: 'Infrastructure & Cloud',
      items: ['AWS', 'GCP', 'Kubernetes', 'Terraform', 'Docker', 'Kafka'],
    },
    {
      id: '4',
      name: 'Databases',
      items: ['PostgreSQL', 'MySQL', 'Redis', 'DynamoDB', 'Elasticsearch'],
    },
    {
      id: '5',
      name: 'Tools & Practices',
      items: ['Git', 'CI/CD', 'Agile/Scrum', 'TDD', 'System Design', 'Code Review'],
    },
  ],
  projects: [
    {
      id: '1',
      name: 'OpenTrace — Distributed Tracing Library',
      description: 'Open-source distributed tracing library for Node.js microservices',
      technologies: ['TypeScript', 'Node.js', 'OpenTelemetry'],
      bullets: [
        'Built a zero-dependency distributed tracing SDK adopted by 200+ companies',
        'Achieved 2k+ GitHub stars and 50k+ weekly npm downloads within 6 months of launch',
      ],
      visible: true,
    },
    {
      id: '2',
      name: 'QuickDeploy — Internal DevOps Platform',
      description: 'Internal platform for one-click deployment and environment management',
      technologies: ['React', 'Go', 'Kubernetes', 'Terraform'],
      bullets: [
        'Reduced environment provisioning time from 2 hours to under 5 minutes',
        'Adopted by 4 engineering teams totaling 80+ engineers',
      ],
      visible: true,
    },
  ],
  certifications: [
    {
      id: '1',
      name: 'AWS Solutions Architect – Professional',
      issuer: 'Amazon Web Services',
      date: '2022',
      visible: true,
    },
    {
      id: '2',
      name: 'Google Cloud Professional Data Engineer',
      issuer: 'Google',
      date: '2021',
      visible: true,
    },
    {
      id: '3',
      name: 'Certified Kubernetes Administrator (CKA)',
      issuer: 'CNCF',
      date: '2020',
      visible: true,
    },
  ],
  awards: [
    'Stripe Hack Week Winner — Best Infrastructure Improvement (2022)',
    'Airbnb Golden Ticket Award for cross-team impact (2019)',
    'UC Berkeley Outstanding Senior in Computer Science (2016)',
  ],
  languages: ['English (Native)', 'Mandarin Chinese (Fluent)', 'Spanish (Conversational)'],
  sectionOrder: [
    'summary',
    'experience',
    'education',
    'skills',
    'projects',
    'certifications',
    'awards',
    'languages',
  ],
  hiddenSections: [],
};

export const sampleResumeText = `Alexandra Chen
Senior Software Engineer
alexandra.chen@email.com | +1 (415) 555-0192 | San Francisco, CA
linkedin.com/in/alexandrachen | github.com/alexchen-dev

PROFESSIONAL SUMMARY
Senior Software Engineer with 8+ years of experience designing and building scalable distributed systems and full-stack web applications. Proven track record of leading cross-functional teams, reducing infrastructure costs, and delivering high-impact features used by millions of users.

WORK EXPERIENCE

Senior Software Engineer | Stripe | San Francisco, CA
Jan 2021 – Present
• Led architecture and implementation of a new payment reconciliation service handling $2B+ in monthly transactions
• Designed and shipped a real-time fraud detection pipeline using Kafka and ML models, preventing $12M in fraudulent charges annually
• Mentored a team of 6 engineers, conducting weekly 1:1s and code reviews
• Reduced CI/CD pipeline build times by 58% through parallelization and intelligent caching

Software Engineer II | Airbnb | San Francisco, CA
Mar 2018 – Dec 2020
• Built and maintained core booking flow APIs serving 150M+ requests per day with 99.98% uptime
• Implemented A/B testing infrastructure enabling 40+ concurrent experiments
• Migrated legacy monolith services to microservices architecture, improving deployment frequency by 5×

Software Engineer | Dropbox | San Francisco, CA
Jun 2016 – Feb 2018
• Developed core file sync algorithms in Python and Go, improving sync reliability by 23%
• Implemented end-to-end encryption for the Business tier product serving 500k+ enterprise customers
• Built internal dashboards and alerting systems using React and Grafana

EDUCATION

B.S. Computer Science | University of California, Berkeley
2012 – 2016
GPA: 3.8/4.0, Dean's List (all semesters)

TECHNICAL SKILLS
Languages: Python, TypeScript, Go, Java, SQL, Bash
Frameworks & Libraries: React, Next.js, Node.js, FastAPI, gRPC, GraphQL
Infrastructure & Cloud: AWS, GCP, Kubernetes, Terraform, Docker, Kafka
Databases: PostgreSQL, MySQL, Redis, DynamoDB, Elasticsearch

PROJECTS

OpenTrace — Distributed Tracing Library | TypeScript, Node.js, OpenTelemetry
Open-source distributed tracing library for Node.js microservices
• Built a zero-dependency distributed tracing SDK adopted by 200+ companies
• Achieved 2k+ GitHub stars and 50k+ weekly npm downloads within 6 months

CERTIFICATIONS
• AWS Solutions Architect – Professional | Amazon Web Services | 2022
• Google Cloud Professional Data Engineer | Google | 2021
• Certified Kubernetes Administrator (CKA) | CNCF | 2020

AWARDS
• Stripe Hack Week Winner — Best Infrastructure Improvement (2022)
• Airbnb Golden Ticket Award for cross-team impact (2019)

LANGUAGES
English (Native), Mandarin Chinese (Fluent), Spanish (Conversational)
`;
