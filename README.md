# hornof.org

Personal site for Luke Hornof — built with [Astro](https://astro.build/) (static
output), one global `style.css` for the whole look, typed content collections for
the data, and a handful of tiny vanilla scripts for the interactivity. `astro
build` compiles it to static HTML, hosted on Cloudflare Pages. See `ROADMAP.md`
for the record of the original static build and `ROADMAP-astro.md` for the Astro
rebuild (Phase 6).

## Layout

```
astro.config.mjs      # Astro static build, flat .html routes, preview port
src/
  layouts/            # BaseLayout — <head>, panorama, theme toggle, ClientRouter
  pages/              # index / projects / built-with / eclipse-built / 404
  content.config.ts   # zod-typed content collections (projects, experience, …)
content/              # the site's data: projects.json + experience/publications/talks
public/               # copied to dist/ verbatim — the passthrough zone
  style.css           # all styling, isolated here (a skin swap touches only this file)
  work/img/           # brown social icons + favicon + panorama
  .2013/              # archive: the original Homestead multi-page site (2013 snapshot)
  .2025/              # archive: the current GenAI rebuild, 2025 snapshot
  projects/eclipse/   # the eclipse-sim Three.js app (static passthrough)
tests/                # Playwright acceptance tests (run against the built site)
playwright.config.js
wrangler.toml         # Cloudflare Pages config
```

The archives are **read-only** — never modify their contents. They were captured
from production (current site) and the Wayback Machine (2013 snapshot), and
are committed verbatim.

## Local development

```bash
npm install                 # first time only (Astro + Playwright)
npm run test:install        # first time only — install the Chromium browser
npm run dev                 # Astro dev server (hot reload)
npm run build               # compile to dist/
npm run preview             # serve the built dist/ at http://localhost:8788
npm test                    # run the Playwright acceptance suite (builds + previews first)
```

Astro copies `public/` to `dist/` verbatim — including the dot-prefixed archive
directories (`.2013/ .2025/`), which `python -m http.server` and some hosts skip.
The Playwright suite runs against the built site via `npm run preview`.

## Deploy (Cloudflare Pages)

Astro is a static build, so Cloudflare Pages runs the build command and publishes
`dist/`. Settings:

- **Build command:** `npm run build`
- **Build output directory:** `dist/`
- **Production branch:** `main` — every PR gets a preview URL automatically.

> Merge-time ordering (Luke's infra step): flip the Pages build command to
> `npm run build` / publish `dist/` **before** merging the Astro rebuild to
> `main`. Merge-first would have Pages build `main` with the old no-build config
> and publish raw `src/` to the live URL. See `LOG-astro.md`.

### Go-live

`RUNBOOK-dns.md` is the numbered, no-prior-Cloudflare-knowledge guide for the
cutover from Dotster to Cloudflare Pages: create the account + Pages project,
stage the DNS move (nameservers first, content second), roll back, and confirm
registrar auto-renew. Every step has a verification; it's docs-only — Luke runs
the registrar steps.

### ⚠️ Archive dot-directory caveat

The archives sit in dot-prefixed folders (`.2013/ .2025/`), and it's
unverified whether Cloudflare Pages serves dot-directories (its docs only
document excluding `.git`/`node_modules`, and it *does* serve `.well-known`). So
the runbook **verifies the archives on the preview URL** and, only if they 404,
applies a fallback (`RUNBOOK-dns.md` → Appendix A: a deploy-time copy to dot-free
folders plus a `_redirects` rewrite, keeping `/.2013/` as the canonical URL). The
on-disk `.2013/.2025` layout is never renamed — the `ROADMAP.md` ground
rules fix it, and the local `server.js` + Playwright tests exercise those exact
paths.
