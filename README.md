# muhammadtahubkhatri.dev

Personal portfolio of Muhammad Tahub Khatri. Built with [Astro](https://astro.build) and [anime.js](https://animejs.com), styled like an engineering drawing set: one ink, one paper, one blueprint-blue accent, and lines instead of shadows.

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # static site in dist/
npm run preview   # serve dist/ locally
```

Requires Node 22.12 or newer.

## What's where

| Path | What it is |
|---|---|
| `src/data/site.ts` | Your name, statement, status and links. Empty links are hidden. |
| `src/data/projects.ts` | Every word about every project: homepage sheet, case study, decision log, build history. |
| `src/pages/index.astro` | Homepage: hero, exploded stack, selected systems, bench, notes, contact. |
| `src/pages/projects/[slug].astro` | One case-study page per project in `projects.ts`. |
| `src/components/ExplodedStack.astro` | FIG. 00, the three-layer stack drawing. |
| `src/components/HistoryScrubber.astro` | The "How it came together" timeline on case studies. |
| `src/scripts/exploded-stack.ts` | Motion 2 (homepage). |
| `src/scripts/history-scrubber.ts` | Motion 3 (case studies). |
| `src/styles/global.css` | Design tokens and shared styles. |
| `vercel.json` | Redirects from the old `/work/*` URLs to `/projects/*`. |

## Motion

Both motions only run on screens at least 900px wide with **Reduce motion** turned off. Everywhere else the same content is shown as static drawings, so nothing is hidden from phones, screen readers or people who turn motion off.

- **Motion 2: exploded stack (homepage).** The stack in the hero is pinned while you scroll. It separates into interface, API and data layers, the layer for the project in the middle of the screen lights up, and at the end of the work section it re-assembles and docks in the header as the logo.
- **Motion 3: build history (case studies).** The section pins and scroll steps through the project's milestones: change summary on the left, the product at that point on the right. Milestones tagged **Mine** are your work. The progress track at the bottom is clickable.

## Before you share it: fill these in

| Where | What |
|---|---|
| `site.ts → links.email` | e.g. `mailto:you@example.com` |
| `site.ts → links.linkedin` | Your LinkedIn URL |
| `site.ts → links.resume` | Put `resume.pdf` in `public/`, then set `/resume.pdf` |
| `projects.ts → bench → SpecThread` | One sentence on what it does and who it's for |
| `projects.ts → each project → live` | Switch to the subdomain once it's set up (see below) |
| `projects.ts → each project → history` | Add `sha`, `date` and `href` from `git log`; check `mine: true` is only on your work |
| `projects.ts → each milestone → image` | Optional real screenshot (`/shots/name.webp` in `public/`) to replace the drawn one |
| `projects.ts → team / timeline` | Optional; shown in the case-study title block when set |

## Deploy on Vercel

1. In Vercel: **Add New → Project**, import this repository. Vercel detects Astro; no settings to change.
2. In the new project: **Settings → Domains**, add `muhammadtahubkhatri.dev`, then add `www.muhammadtahubkhatri.dev` and set it to redirect to the root.
3. Give each live app its own subdomain from **that app's** Vercel project:

| App | Subdomain |
|---|---|
| Context Compiler | `context-compiler.muhammadtahubkhatri.dev` |
| Supo | `supo.muhammadtahubkhatri.dev` |
| CrowsNest | `crowsnest.muhammadtahubkhatri.dev` (team project: whoever owns its Vercel project adds it) |

After moving an app, update its own URL settings (auth callback URLs, Supabase redirect URLs, `NEXT_PUBLIC_APP_URL`-style variables, the Context Compiler MCP bridge's base URL) and then the `live` field in `projects.ts`.

## Adding a project

Add an object to `projects` in `src/data/projects.ts`. Pick its `layer` (`ui`, `api` or `data`) so the homepage stack lights the right layer. The case-study page at `/projects/<slug>` is generated automatically, and sheet numbers update themselves.
