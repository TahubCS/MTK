/**
 * Fills the "Recent activity" list from the public GitHub API.
 *
 * The request runs in the visitor's browser, so the list is current on
 * every visit. If it fails (offline, rate limit, bad response) the section
 * says so and keeps its link to GitHub.
 */
import { describeAge, parseRepoActivity, type RepoActivity } from '../lib/github-repos';

const LIMIT = 5;
const TIMEOUT_MS = 8000;

function row(repo: RepoActivity, now: Date): HTMLLIElement {
  const li = document.createElement('li');
  li.className = 'activity__item';

  const link = document.createElement('a');
  link.className = 'activity__name';
  link.href = repo.url;
  link.rel = 'noopener';
  link.textContent = repo.name;

  const summary = document.createElement('span');
  summary.className = 'activity__summary';
  summary.textContent = repo.description ?? 'No description yet.';

  const meta = document.createElement('span');
  meta.className = 'activity__meta';
  const time = document.createElement('time');
  time.dateTime = repo.pushedAt.toISOString();
  time.textContent = `pushed ${describeAge(repo.pushedAt, now)}`;
  meta.append(repo.language ? `${repo.language} · ` : '', time);

  li.append(link, summary, meta);
  return li;
}

export async function initGithubActivity(): Promise<void> {
  const root = document.querySelector<HTMLElement>('[data-github-activity]');
  const list = root?.querySelector<HTMLElement>('[data-activity-list]');
  const status = root?.querySelector<HTMLElement>('[data-activity-status]');
  const user = root?.dataset.githubUser;
  if (!root || !list || !status || !user) return;

  const fail = (reason: string) => {
    console.warn(`[github-activity] ${reason}`);
    status.textContent = 'Could not load recent activity from GitHub right now.';
  };

  let body: unknown;
  try {
    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(user)}/repos?sort=pushed&per_page=20`,
      { headers: { Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(TIMEOUT_MS) },
    );
    if (!response.ok) return fail(`GitHub responded with ${response.status}`);
    body = await response.json();
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Request failed');
  }

  const result = parseRepoActivity(body, LIMIT);
  if (!result.ok) return fail(result.error);

  const now = new Date();
  list.replaceChildren(...result.repos.map((repo) => row(repo, now)));
  list.hidden = false;
  status.hidden = true;
}
