# hornof.org

Personal site for Luke Hornof — plain HTML + one CSS file + minimal vanilla JS, no
build step, no framework. Hosted on Cloudflare Pages. See `ROADMAP.md` for the
phased rebuild plan.

## Layout

```
index.html            # the site — F3 minimal-core one-pager
style.css             # all styling, isolated here (a skin swap touches only this file)
work/img/             # brown social icons + favicon (still referenced by index.html)
work/                 # legacy current-site assets (css/fonts/js) — kept for the /.2025 archive
.2013/                # archive: the original Homestead multi-page site (2013 snapshot)
.2024/                # archive: same original site, 2024 snapshot
.2025/                # archive: the current GenAI rebuild, 2025 snapshot
server.js             # zero-dep static server for local dev + tests (serves dot-dirs)
tests/                # Playwright acceptance tests
playwright.config.js
wrangler.toml         # Cloudflare Pages config
```

The archives are **read-only** — never modify their contents. They were captured
from production (current site) and the Wayback Machine (2013/2024 snapshots), and
are committed verbatim.

## Local development

```bash
npm install                 # first time only (Playwright)
npm run test:install        # first time only — install the Chromium browser
npm run serve               # http://localhost:8788
npm test                    # run the Playwright acceptance suite
```

`server.js` serves the repo root including the dot-prefixed archive directories,
which `python -m http.server` and some hosts skip.

## Deploy (Cloudflare Pages)

No build command. Settings:

- **Build command:** _(none)_
- **Build output directory:** `/` (repo root)
- **Production branch:** `main` — every PR gets a preview URL automatically.

`wrangler.toml` captures this (`pages_build_output_dir = "."`).

### Go-live

`RUNBOOK-dns.md` is the numbered, no-prior-Cloudflare-knowledge guide for the
cutover from Dotster to Cloudflare Pages: create the account + Pages project,
stage the DNS move (nameservers first, content second), roll back, and confirm
registrar auto-renew. Every step has a verification; it's docs-only — Luke runs
the registrar steps.

### ⚠️ Archive dot-directory caveat

The archives sit in dot-prefixed folders (`.2013/ .2024/ .2025/`), and it's
unverified whether Cloudflare Pages serves dot-directories (its docs only
document excluding `.git`/`node_modules`, and it *does* serve `.well-known`). So
the runbook **verifies the archives on the preview URL** and, only if they 404,
applies a fallback (`RUNBOOK-dns.md` → Appendix A: a deploy-time copy to dot-free
folders plus a `_redirects` rewrite, keeping `/.2013/` as the canonical URL). The
on-disk `.2013/.2024/.2025` layout is never renamed — the `ROADMAP.md` ground
rules fix it, and the local `server.js` + Playwright tests exercise those exact
paths.
