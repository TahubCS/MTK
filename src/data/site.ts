/**
 * Site-wide facts. Edit these first.
 *
 * Any link left as an empty string is hidden everywhere on the site,
 * so nothing ships pointing at a placeholder.
 */
export const site = {
  name: 'Muhammad Tahub Khatri',
  shortName: 'MTK',
  url: 'https://muhammadtahubkhatri.dev',
  title: 'Muhammad Tahub Khatri — Software & Applied AI',
  description:
    'Software engineering and applied AI. Retrieval systems, embeddable SDKs and streaming interfaces by Muhammad Tahub Khatri, East Carolina University.',
  statement:
    'I build the systems that hand AI agents the right context — and the interfaces that show people where it came from.',
  location: 'Greenville, NC',
  institution: 'East Carolina University',
  discipline: 'Software engineering / Applied AI',
  status: 'Open to SWE & ML internships',
  /** Shown as REV in the header. Update when you make a meaningful change. */
  revision: '2026.10',

  links: {
    github: 'https://github.com/TahubCS',
    /** e.g. 'mailto:you@example.com' */
    email: 'mailto:muhammadtahubkhatri@gmail.com',
    /** e.g. 'https://www.linkedin.com/in/your-handle' */
    linkedin: 'https://www.linkedin.com/in/muhammad-tahub-khatri-a58580340/',
    /** Put your résumé at public/resume.pdf, then set this to '/resume.pdf'. */
    resume: '/resume.pdf',
  },
} as const;

export type Site = typeof site;
