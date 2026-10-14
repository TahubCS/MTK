/**
 * Repositories tagged `portfolio` on GitHub that have no case study yet.
 *
 * portfolio-repos.json is written by scripts/sync-portfolio-repos.mjs in
 * the "Portfolio sync" GitHub Action. Do not edit it by hand: tag or untag
 * the repository on GitHub instead. The file is checked here before use,
 * and a bad file fails the build.
 */
import { PORTFOLIO_TOPIC, parsePortfolioRepos, withoutCaseStudy } from '../lib/github-repos';
import { bench, projects, type BenchItem } from './projects';
import stored from './portfolio-repos.json';

const parsed = parsePortfolioRepos(stored);
if (!parsed.ok) throw new Error(`src/data/portfolio-repos.json is invalid: ${parsed.error}`);

const caseStudySources = projects.flatMap((p) => (p.source ? [p.source] : []));
const benchNames = new Set(bench.map((b) => b.name.toLowerCase()));

/** Shown under the hand-written bench entries, in the same list. */
export const syncedBench: BenchItem[] = withoutCaseStudy(parsed.repos, caseStudySources)
  .filter((repo) => !benchNames.has(repo.name.toLowerCase()))
  .map((repo) => ({
    name: repo.name,
    summary: repo.description ?? 'No description on GitHub yet.',
    stack:
      [repo.language, ...repo.topics.filter((topic) => topic !== PORTFOLIO_TOPIC)]
        .filter((part): part is string => part !== null)
        .slice(0, 4)
        .join(' / ') || 'Repository',
    status: 'Synced from GitHub',
    href: repo.homepage ?? repo.html_url,
  }));
