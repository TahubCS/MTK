/**
 * Parsing for the GitHub "list user repositories" response.
 *
 * The response is untrusted: everything is checked here and turned into
 * `RepoActivity` or `PortfolioRepo` before any of it reaches the page.
 *
 * Also loaded directly by Node in scripts/sync-portfolio-repos.mjs, so it
 * must stay free of imports and of syntax that needs compiling (no enums).
 */

export interface RepoActivity {
  readonly name: string;
  readonly url: string;
  readonly description: string | null;
  readonly language: string | null;
  readonly pushedAt: Date;
}

export type ParseResult =
  | { readonly ok: true; readonly repos: readonly RepoActivity[] }
  | { readonly ok: false; readonly error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function textOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function parseRepo(raw: unknown): RepoActivity | null {
  if (!isRecord(raw)) return null;
  const { name, html_url: url, pushed_at: pushed } = raw;
  if (typeof name !== 'string' || typeof url !== 'string' || typeof pushed !== 'string') return null;
  if (!url.startsWith('https://github.com/')) return null;

  const pushedAt = new Date(pushed);
  if (Number.isNaN(pushedAt.getTime())) return null;

  return {
    name,
    url,
    description: textOrNull(raw.description),
    language: textOrNull(raw.language),
    pushedAt,
  };
}

/** Most recently pushed first. Forks and malformed entries are left out. */
export function parseRepoActivity(raw: unknown, limit: number): ParseResult {
  if (!Array.isArray(raw)) return { ok: false, error: 'Expected a list of repositories' };

  const repos = raw
    .filter((entry) => !(isRecord(entry) && entry.fork === true))
    .map(parseRepo)
    .filter((repo): repo is RepoActivity => repo !== null)
    .sort((a, b) => b.pushedAt.getTime() - a.pushedAt.getTime())
    .slice(0, limit);

  if (repos.length === 0) return { ok: false, error: 'No usable repositories in the response' };
  return { ok: true, repos };
}

/* ---------- portfolio repositories ---------- */

/** A repository is a portfolio project when it carries this GitHub topic. */
export const PORTFOLIO_TOPIC = 'portfolio';

/**
 * The fields the site keeps for a portfolio repository. Field names match
 * GitHub's, so the same parser reads the API response and the synced file
 * (src/data/portfolio-repos.json).
 */
export interface PortfolioRepo {
  readonly name: string;
  readonly html_url: string;
  readonly description: string | null;
  readonly language: string | null;
  /** The repository's Website field, when it is an http(s) link. */
  readonly homepage: string | null;
  readonly topics: readonly string[];
}

export type PortfolioParseResult =
  | { readonly ok: true; readonly repos: readonly PortfolioRepo[] }
  | { readonly ok: false; readonly error: string };

function httpUrlOrNull(value: unknown): string | null {
  const text = textOrNull(value);
  return text !== null && /^https?:\/\//.test(text) ? text : null;
}

function parsePortfolioRepo(raw: unknown): PortfolioRepo | null {
  if (!isRecord(raw)) return null;
  if (raw.fork === true || raw.archived === true || raw.private === true) return null;

  const { name, html_url: url, topics } = raw;
  if (typeof name !== 'string' || typeof url !== 'string') return null;
  if (!url.startsWith('https://github.com/')) return null;
  if (!Array.isArray(topics)) return null;

  const tags = topics.filter((topic): topic is string => typeof topic === 'string');
  if (!tags.includes(PORTFOLIO_TOPIC)) return null;

  return {
    name,
    html_url: url,
    description: textOrNull(raw.description),
    language: textOrNull(raw.language),
    homepage: httpUrlOrNull(raw.homepage),
    topics: [...tags].sort(),
  };
}

/**
 * Public, non-fork, non-archived repositories tagged `portfolio`, sorted by
 * name. An empty list is a valid result: nothing is tagged yet.
 */
export function parsePortfolioRepos(raw: unknown): PortfolioParseResult {
  if (!Array.isArray(raw)) return { ok: false, error: 'Expected a list of repositories' };

  const repos = raw
    .map(parsePortfolioRepo)
    .filter((repo): repo is PortfolioRepo => repo !== null)
    .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));

  return { ok: true, repos };
}

function sameRepoUrl(a: string, b: string): boolean {
  const normalize = (url: string) => url.replace(/\/+$/, '').toLowerCase();
  return normalize(a) === normalize(b);
}

/** Portfolio repositories that do not have a written case study yet. */
export function withoutCaseStudy(
  repos: readonly PortfolioRepo[],
  caseStudySources: readonly string[],
): readonly PortfolioRepo[] {
  return repos.filter((repo) => !caseStudySources.some((source) => sameRepoUrl(source, repo.html_url)));
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "today", "yesterday", "5 days ago", "3 weeks ago", then a month and year. */
export function describeAge(then: Date, now: Date): string {
  const days = Math.floor((now.getTime() - then.getTime()) / DAY);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 14) return `${days} days ago`;
  if (days < 56) return `${Math.floor(days / 7)} weeks ago`;
  return then.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}
