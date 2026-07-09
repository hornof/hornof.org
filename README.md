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
  2013-archive/       # archive: the original Homestead multi-page site (2013 snapshot)
  2025-archive/       # archive: the current GenAI rebuild, 2025 snapshot
  _redirects          # 301s from the old /.2013/ /.2025/ URLs to the renamed folders
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

Astro copies `public/` to `dist/` verbatim, including the archive directories
(`2013-archive/ 2025-archive/`). The Playwright suite runs against the built site
via `npm run preview`.

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

### Archives

The archives live at `/2013-archive/` and `/2025-archive/` — renamed off the old
dot-prefixed folders in 2026-07 (dot-dirs are skipped by `python -m http.server`
and were unverified on Cloudflare Pages). `public/_redirects` issues **301**s from
the old `/.2013/ /.2025/` URLs, so external and Wayback inbound links still resolve.
The Playwright suite exercises the new paths; the 301s are verified on the Cloudflare
deploy (`astro preview` doesn't process `_redirects`).
