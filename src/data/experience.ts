/**
 * Paid work, newest first. Same rule as projects.ts: only claims you can
 * stand behind, no invented metrics. `source` is optional and hidden when
 * left out.
 */

export interface Role {
  title: string;
  org: string;
  /** e.g. '2026 — Present' */
  period: string;
  points: string[];
  source?: { label: string; href: string };
}

export const experience: Role[] = [
  {
    title: 'Software Developer (Contract)',
    org: 'Al-Hamd Printers',
    period: '2026 — Present',
    points: [
      'Building a full-stack management system for PVC manufacturing operations: order processing, inventory, workflow automation, payroll and expense tracking, customer records and financial reporting.',
      'Designing the backend data models and API layers behind the admin dashboards and day-to-day operational workflows.',
      'Translating manual business processes into structured software for a real operating business.',
    ],
    source: { label: 'Source ↗', href: 'https://github.com/TahubCS/alhamd-printers' },
  },
  {
    title: 'Freelance SEO & Data Consultant',
    org: 'Fiverr',
    period: '2020 — 2023',
    points: [
      'Analyzed client performance data and delivered optimization recommendations for international businesses.',
      'Wrote structured reports that turned raw metrics into clear, action-oriented insights for non-technical stakeholders.',
    ],
  },
];
