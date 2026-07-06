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

### ⚠️ Archive dot-directory caveat

Cloudflare Pages **excludes files and directories whose names begin with a dot**
from the default upload, so `.2013/ .2024/ .2025/` will not serve as-is. The
literal `/.2013/` paths are the spec's source of truth (`ROADMAP.md` ground rules)
and are what the local server and Playwright tests exercise. Resolving this for the
live host is deferred to **F2 (DNS cutover / deploy)**; the options are:

1. A Pages `_redirects` / Function that aliases `/.2013/*` to a dot-free build path
   populated at deploy time, or
2. A deploy step (`wrangler pages deploy`) that copies the archives to dot-free
   directories and adds redirect rules.

This is called out here rather than silently changing the on-disk layout, which the
ROADMAP fixes as `.2013/.2024/.2025`.
