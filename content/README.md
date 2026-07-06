# content/

Source copy for the site's real sections (F6), generated from Luke's own
assets in Claude-Cowork:

- `about.md`, `experience.md`, `publications.md`, `contact.md` — from
  `projects/job-search/resume.md` and `about/about-me.md`.
- `talks.md` — from `projects/talks/index.md`.

There is **no build step** (a ROADMAP ground rule), so these files are the
readable source of truth and the same copy is inlined by hand into the matching
`<section>`s in `index.html`. Edit both when copy changes, or wire up an inliner
later if the duplication becomes a burden.

Voice follows `about/anti-ai-style.md` (no "leverage", "robust", "seamless",
etc.). All publication/patent links were verified live before commit.
