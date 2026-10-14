import { describe, expect, it } from 'vitest';
import { describeAge, parsePortfolioRepos, parseRepoActivity, withoutCaseStudy } from './github-repos';

function repo(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    name: 'Context-Compiler',
    html_url: 'https://github.com/TahubCS/Context-Compiler',
    description: 'Scan your codebase.',
    language: 'TypeScript',
    pushed_at: '2026-09-02T14:19:51Z',
    fork: false,
    ...overrides,
  };
}

describe('parseRepoActivity', () => {
  it('returns repositories newest first, up to the limit', () => {
    const result = parseRepoActivity(
      [
        repo({ name: 'old', pushed_at: '2026-01-01T00:00:00Z' }),
        repo({ name: 'new', pushed_at: '2026-10-01T00:00:00Z' }),
        repo({ name: 'mid', pushed_at: '2026-05-01T00:00:00Z' }),
      ],
      2,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.repos.map((r) => r.name)).toEqual(['new', 'mid']);
  });

  it('leaves out forks', () => {
    const result = parseRepoActivity([repo({ name: 'mine' }), repo({ name: 'forked', fork: true })], 5);

    expect(result.ok && result.repos.map((r) => r.name)).toEqual(['mine']);
  });

  it('treats a missing description or language as null', () => {
    const result = parseRepoActivity([repo({ description: null, language: '  ' })], 5);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.repos[0]?.description).toBeNull();
    expect(result.repos[0]?.language).toBeNull();
  });

  it('skips entries with a bad date, a non-GitHub link or the wrong shape', () => {
    const result = parseRepoActivity(
      [
        repo({ name: 'good' }),
        repo({ name: 'bad-date', pushed_at: 'not a date' }),
        repo({ name: 'bad-link', html_url: 'javascript:alert(1)' }),
        'nonsense',
        null,
      ],
      5,
    );

    expect(result.ok && result.repos.map((r) => r.name)).toEqual(['good']);
  });

  it('fails when the response is not a list', () => {
    expect(parseRepoActivity({ message: 'API rate limit exceeded' }, 5)).toEqual({
      ok: false,
      error: 'Expected a list of repositories',
    });
  });

  it('fails when nothing usable is left', () => {
    expect(parseRepoActivity([repo({ fork: true })], 5).ok).toBe(false);
    expect(parseRepoActivity([], 5).ok).toBe(false);
  });
});

describe('parsePortfolioRepos', () => {
  const tagged = (overrides: Record<string, unknown> = {}) =>
    repo({ topics: ['portfolio', 'rag', 'nextjs'], homepage: 'https://example.com', archived: false, ...overrides });

  it('keeps only repositories tagged portfolio, sorted by name', () => {
    const result = parsePortfolioRepos([
      tagged({ name: 'zeta' }),
      repo({ name: 'untagged', topics: ['rag'] }),
      tagged({ name: 'Alpha' }),
    ]);

    expect(result.ok && result.repos.map((r) => r.name)).toEqual(['Alpha', 'zeta']);
  });

  it('keeps topics in a stable sorted order', () => {
    const result = parsePortfolioRepos([tagged()]);

    expect(result.ok && result.repos[0]?.topics).toEqual(['nextjs', 'portfolio', 'rag']);
  });

  it('leaves out forks, archived and private repositories', () => {
    const result = parsePortfolioRepos([
      tagged({ name: 'fork', fork: true }),
      tagged({ name: 'archived', archived: true }),
      tagged({ name: 'private', private: true }),
      tagged({ name: 'kept' }),
    ]);

    expect(result.ok && result.repos.map((r) => r.name)).toEqual(['kept']);
  });

  it('ignores a homepage that is empty or not an http link', () => {
    const result = parsePortfolioRepos([
      tagged({ name: 'a', homepage: '' }),
      tagged({ name: 'b', homepage: 'javascript:alert(1)' }),
      tagged({ name: 'c', homepage: 'https://c.example.com' }),
    ]);

    expect(result.ok && result.repos.map((r) => r.homepage)).toEqual([null, null, 'https://c.example.com']);
  });

  it('skips entries without topics or with a non-GitHub link', () => {
    const result = parsePortfolioRepos([
      tagged({ name: 'no-topics', topics: undefined }),
      tagged({ name: 'bad-link', html_url: 'https://evil.example.com/x' }),
      'nonsense',
    ]);

    expect(result).toEqual({ ok: true, repos: [] });
  });

  it('reads back what it produced, so the synced file uses the same parser', () => {
    const first = parsePortfolioRepos([tagged({ name: 'round-trip' })]);
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    expect(parsePortfolioRepos(JSON.parse(JSON.stringify(first.repos)))).toEqual(first);
  });

  it('treats an empty list as valid and a non-list as an error', () => {
    expect(parsePortfolioRepos([])).toEqual({ ok: true, repos: [] });
    expect(parsePortfolioRepos({ message: 'Bad credentials' }).ok).toBe(false);
  });
});

describe('withoutCaseStudy', () => {
  const repos = [
    { name: 'Reeflect', html_url: 'https://github.com/TahubCS/Reeflect' },
    { name: 'NextBoard', html_url: 'https://github.com/TahubCS/NextBoard' },
  ].map((r) => ({ ...r, description: null, language: null, homepage: null, topics: [] }));

  it('leaves out repositories a case study already links to', () => {
    const missing = withoutCaseStudy(repos, ['https://github.com/TahubCS/Reeflect']);

    expect(missing.map((r) => r.name)).toEqual(['NextBoard']);
  });

  it('matches regardless of letter case or a trailing slash', () => {
    const missing = withoutCaseStudy(repos, ['https://github.com/tahubcs/reeflect/', 'https://github.com/TahubCS/nextboard']);

    expect(missing).toEqual([]);
  });
});

describe('describeAge', () => {
  const now = new Date('2026-10-13T12:00:00Z');
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  it.each([
    [0, 'today'],
    [1, 'yesterday'],
    [5, '5 days ago'],
    [13, '13 days ago'],
    [14, '2 weeks ago'],
    [55, '7 weeks ago'],
  ])('describes %i days as "%s"', (days, expected) => {
    expect(describeAge(daysAgo(days), now)).toBe(expected);
  });

  it('falls back to month and year for older dates', () => {
    expect(describeAge(new Date('2026-01-21T08:07:14Z'), now)).toBe('Jan 2026');
  });

  it('treats a date in the future as today', () => {
    expect(describeAge(daysAgo(-2), now)).toBe('today');
  });
});
