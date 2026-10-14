/**
 * Motion 3 — Scrub the history.
 *
 * Pins the milestone section and maps scroll progress through it to one
 * milestone at a time. The progress track fills continuously; the
 * milestone swap is a short anime.js transition (commit card, then the
 * diff lines, then the screen).
 *
 * Wide screens with motion allowed only. Otherwise the section stays a
 * plain vertical timeline.
 */
import { animate, stagger } from 'animejs';

export function initHistoryScrubbers(): void {
  const mq = window.matchMedia('(min-width: 900px) and (prefers-reduced-motion: no-preference)');
  const roots = Array.from(document.querySelectorAll<HTMLElement>('[data-scrubber]'));
  const scrubbers = roots.map((root) => createScrubber(root, mq));

  let ticking = false;
  const render = () => {
    ticking = false;
    for (const s of scrubbers) s.render();
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(render);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  mq.addEventListener('change', () => {
    for (const s of scrubbers) s.apply();
    render();
  });
  for (const s of scrubbers) s.apply();
  render();
}

function createScrubber(root: HTMLElement, mq: MediaQueryList) {
  const items = Array.from(root.querySelectorAll<HTMLElement>('[data-milestone]'));
  const fills = Array.from(root.querySelectorAll<HTMLElement>('[data-track-fill]'));
  const segs = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-track-seg]'));
  const counter = root.querySelector<HTMLElement>('[data-counter]');
  const n = items.length;
  let index = 0;
  let enabled = false;

  function progress(): number {
    const rect = root.getBoundingClientRect();
    const travel = rect.height - window.innerHeight;
    if (travel <= 0) return 0;
    return Math.min(1, Math.max(0, -rect.top / travel));
  }

  function show(next: number) {
    if (next === index) return;
    const prev = items[index];
    const item = items[next];
    if (!item || !prev) return;
    const dir = next > index ? 1 : -1;
    index = next;

    prev.classList.remove('is-active');
    item.classList.add('is-active');
    if (counter) counter.textContent = String(next + 1).padStart(2, '0');
    segs.forEach((s, i) => (i === next ? s.setAttribute('aria-current', 'step') : s.removeAttribute('aria-current')));

    const commit = item.querySelector('.milestone__commit');
    const screen = item.querySelector('.milestone__screen');
    const lines = item.querySelectorAll('[data-diff-line]');

    animate(item, { opacity: [0, 1], duration: 220, ease: 'linear' });
    if (commit) animate(commit, { translateY: [18 * dir, 0], duration: 420, ease: 'outQuart' });
    if (lines.length) animate(lines, { opacity: [0, 1], translateX: [-10, 0], duration: 260, delay: stagger(70, { start: 120 }), ease: 'outQuad' });
    if (screen) animate(screen, { opacity: [0, 1], translateY: [24 * dir, 0], duration: 480, delay: 80, ease: 'outQuart' });
  }

  function render() {
    if (!enabled) return;
    const p = progress();
    const step = p * n;
    fills.forEach((f, i) => {
      f.style.transform = `scaleX(${Math.min(1, Math.max(0, step - i))})`;
    });
    show(Math.min(n - 1, Math.floor(step)));
  }

  function apply() {
    enabled = mq.matches && n > 1;
    root.classList.toggle('is-scrub', enabled);
    if (!enabled) {
      for (const el of root.querySelectorAll<HTMLElement>('.milestone, .milestone__commit, .milestone__screen, [data-diff-line]')) {
        el.style.removeProperty('opacity');
        el.style.removeProperty('transform');
      }
    }
  }

  segs.forEach((seg, i) => {
    seg.addEventListener('click', () => {
      const top = root.getBoundingClientRect().top + window.scrollY;
      const travel = root.offsetHeight - window.innerHeight;
      window.scrollTo({ top: top + ((i + 0.5) / n) * travel, behavior: 'smooth' });
    });
  });

  segs[0]?.setAttribute('aria-current', 'step');
  return { render, apply };
}
