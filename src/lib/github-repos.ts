/**
 * Parsing for the GitHub "list user repositories" response.
 *
 * The response is untrusted: everything is checked here and turned into
 * `RepoActivity` before any of it reaches the page.
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
