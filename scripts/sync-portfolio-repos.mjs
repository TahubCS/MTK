/**
 * Refreshes src/data/portfolio-repos.json from GitHub and reports which
 * portfolio repositories still have no case study.
 *
 * Run by .github/workflows/portfolio-sync.yml (Node 24, which loads the
 * .ts modules below directly). Locally: `node scripts/sync-portfolio-repos.mjs`.
 *
 * Env:
 *   GITHUB_TOKEN   optional; raises the API rate limit
 *   GITHUB_OUTPUT  set by Actions; receives `changed` and `missing`
 *
 * Exits non-zero, without touching the file, if GitHub cannot be read or
 * the response is not a repository list.
 */
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { parsePortfolioRepos, withoutCaseStudy } from '../src/lib/github-repos.ts';
import { projects } from '../src/data/projects.ts';
import { site } from '../src/data/site.ts';

const DATA_FILE = fileURLToPath(new URL('../src/data/portfolio-repos.json', import.meta.url));
const PAGE_SIZE = 100;
const MAX_PAGES = 10;

const user = new URL(site.links.github).pathname.replace(/^\/|\/$/g, '');

async function fetchAllRepos() {
  const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const all = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `https://api.github.com/users/${encodeURIComponent(user)}/repos?type=owner&per_page=${PAGE_SIZE}&page=${page}`;
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(20_000) });
    if (!response.ok) throw new Error(`GitHub responded with ${response.status} for page ${page}`);

    const body = await response.json();
    if (!Array.isArray(body)) throw new Error('GitHub did not return a list of repositories');
    all.push(...body);
    if (body.length < PAGE_SIZE) return all;
  }
  throw new Error(`More than ${MAX_PAGES * PAGE_SIZE} repositories; raise MAX_PAGES`);
}

const result = parsePortfolioRepos(await fetchAllRepos());
if (!result.ok) throw new Error(result.error);

const next = `${JSON.stringify(result.repos, null, 2)}\n`;
const changed = readFileSync(DATA_FILE, 'utf8').replace(/\r\n/g, '\n') !== next;
if (changed) writeFileSync(DATA_FILE, next);

const caseStudySources = projects.flatMap((p) => (p.source ? [p.source] : []));
const missing = withoutCaseStudy(result.repos, caseStudySources).map((repo) => repo.name);

console.log(`${user}: ${result.repos.length} portfolio repositories, ${changed ? 'file updated' : 'no change'}.`);
console.log(`Without a case study: ${missing.length ? missing.join(', ') : 'none'}`);

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\nmissing=${JSON.stringify(missing)}\n`);
}
