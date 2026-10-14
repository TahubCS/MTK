/**
 * Motion 2 — Exploded stack.
 *
 * Scroll position drives one anime.js timeline (0–1000 "ms"):
 *   0–350     the assembled stack explodes into three layers
 *   350–850   hold while the projects scroll past; the layer that belongs
 *             to the project in the middle of the viewport lights up
 *   850–1000  the stack re-assembles, fades, and docks as the header mark
 *
 * Only runs on wide screens with motion allowed. Everywhere else the stack
 * is a static exploded drawing and only the highlight changes.
 */
import { createTimeline, stagger, type Timeline } from 'animejs';

type Layer = 'ui' | 'api' | 'data';

const EXPLODE_END = 350;
const HOLD_END = 850;
const TOTAL = 1000;
const SHIFT = 126;

export function initExplodedStack(): void {
  const stack = document.querySelector<HTMLElement>('[data-stack]');
  const work = document.querySelector<HTMLElement>('[data-stack-work]');
  if (!stack || !work) return;

  const svg = stack.querySelector('svg');
  const layer = (l: Layer) => stack.querySelector<SVGGElement>(`[data-layer="${l}"]`);
  const guides = stack.querySelector<SVGGElement>('[data-stack-guides]');
  const callouts = Array.from(stack.querySelectorAll<SVGGElement>('[data-callout]'));
  const subs = Array.from(stack.querySelectorAll<SVGTextElement>('[data-callout-sub]'));
  const mark = document.querySelector<SVGElement>('[data-header-mark]');
  const sheets = Array.from(document.querySelectorAll<HTMLElement>('[data-project-layer]'));

  const mq = window.matchMedia('(min-width: 900px) and (prefers-reduced-motion: no-preference)');

  let tl: Timeline | null = null;
  let y1 = 1;
  let y2 = 2;
  let y3 = 3;
  let active: Layer | '' = '';
  let activeName = '';
  let ticking = false;

  /* ---------- highlight (every mode) ---------- */

  // Several projects can share a layer, so the callout names the project
  // on screen, not the layer's only project.
  function setActive(next: Layer | '', name: string) {
    if (next === active && name === activeName) return;
    active = next;
    activeName = name;
    stack!.dataset.active = next;
    for (const sub of subs) {
      const l = (sub.closest('[data-callout]') as HTMLElement | null)?.dataset.callout as Layer | undefined;
      sub.textContent = l === next && name ? `→ ${name}` : (sub.dataset.default ?? '');
    }
  }

  function updateActive() {
    const mid = window.innerHeight / 2;
    let found: Layer | '' = '';
    let name = '';
    for (const s of sheets) {
      const r = s.getBoundingClientRect();
      if (r.top <= mid && r.bottom >= mid) {
        found = s.dataset.projectLayer as Layer;
        name = s.dataset.projectName ?? '';
        break;
      }
    }
    setActive(found, name);
  }

  /* ---------- scroll-scrubbed timeline (wide + motion only) ---------- */

  function build() {
    const ui = layer('ui');
    const data = layer('data');
    if (!ui || !data || !guides || !svg) return;

    tl = createTimeline({ autoplay: false, defaults: { ease: 'outQuart' } })
      // explode
      .add(ui, { translateY: [SHIFT, 0], duration: EXPLODE_END }, 0)
      .add(data, { translateY: [-SHIFT, 0], duration: EXPLODE_END }, 0)
      .add(guides, { opacity: [0, 1], duration: 160, ease: 'linear' }, 190)
      .add(callouts, { opacity: [0, 1], translateX: [-12, 0], duration: 120, delay: stagger(40) }, 230)
      // collapse and dock
      .add(callouts, { opacity: [1, 0], duration: 50, ease: 'linear' }, HOLD_END)
      .add(guides, { opacity: [1, 0], duration: 50, ease: 'linear' }, HOLD_END)
      .add(ui, { translateY: [0, SHIFT], duration: 110, ease: 'inOutQuart' }, HOLD_END + 10)
      .add(data, { translateY: [0, -SHIFT], duration: 110, ease: 'inOutQuart' }, HOLD_END + 10);

    tl.add(stack!, { opacity: [1, 0], scale: [1, 0.86], translateY: [0, -40], duration: 70, ease: 'inQuad' }, TOTAL - 70);
    if (mark) tl.add(mark, { opacity: [0, 1], scale: [0.6, 1], duration: 70, ease: 'outBack' }, TOTAL - 70);

    measure();
    render();
  }

  function teardown() {
    tl?.revert();
    tl = null;
    for (const el of [layer('ui'), layer('data'), guides, stack, mark, ...callouts]) {
      el?.style.removeProperty('transform');
      el?.style.removeProperty('opacity');
    }
    stack!.dataset.motion = 'off';
  }

  function measure() {
    const vh = window.innerHeight;
    const top = (el: Element) => el.getBoundingClientRect().top + window.scrollY;
    const last = sheets[sheets.length - 1] ?? work!;
    const workEnd = last.getBoundingClientRect().bottom + window.scrollY;

    y1 = Math.max(200, top(work!) - vh * 0.45);
    y2 = Math.max(y1 + 1, workEnd - vh * 0.85);
    y3 = Math.max(y2 + 1, workEnd - vh * 0.3);
  }

  function timeAt(y: number): number {
    if (y <= 0) return 0;
    if (y < y1) return (EXPLODE_END * y) / y1;
    if (y < y2) return EXPLODE_END + ((HOLD_END - EXPLODE_END) * (y - y1)) / (y2 - y1);
    if (y < y3) return HOLD_END + ((TOTAL - HOLD_END) * (y - y2)) / (y3 - y2);
    return TOTAL;
  }

  function render() {
    ticking = false;
    if (tl) tl.seek(timeAt(window.scrollY));
    updateActive();
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(render);
  }

  function apply() {
    if (mq.matches) {
      stack!.dataset.motion = 'on';
      if (!tl) build();
    } else if (tl || stack!.dataset.motion !== 'off') {
      teardown();
    }
    render();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    if (tl) measure();
    onScroll();
  });
  mq.addEventListener('change', apply);
  document.fonts?.ready.then(() => {
    if (tl) measure();
    render();
  });

  apply();
}
