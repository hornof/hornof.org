# Projects wall — entry schema + convention

The Projects wall (`/projects.html`) is **data-driven**: every card is one object
in `projects.json`. Adding a build to the wall means appending one object — no
HTML, CSS, or JS is touched. `main.js`'s `renderProjects()` turns each object
into a card, and `tests/projects.spec.js` proves a data-only addition renders.

## Entry schema

Each entry in the `projects.json` array:

| Field | Type | Required | Notes |
|---|---|---|---|
| `slug` | string | yes | stable id; becomes the card's `data-slug` |
| `title` | string | yes | the build's name |
| `blurb` | string | yes | one line — what it is |
| `date` | string | yes | `YYYY-MM`; the "as of" for any metrics in `build` |
| `links` | `{label, href}[]` | no | live demo · PR · repo · asset. Every `http(s)` link is checked live by the link-liveness test — no dead links, and no claiming a private repo is public (link the profile instead). |
| `build` | object | no | the loop metadata, below — rendered as the card's "Built with" line |

### `build` object

| Field | Type | Notes |
|---|---|---|
| `stack` | string | e.g. `Plain HTML · one style.css · vanilla JS · Cloudflare Pages` |
| `agents` | string | e.g. `Claude Code` |
| `models` | string | e.g. `Opus 4.8` |
| `tests` | number | count as of `date` |
| `firstPassGreen` | string \| bool | honest note, e.g. `mostly — human review caught the rest` |
| `costNote` | string | durable, honest — **no fabricated figures**; omit rather than invent |

## The no-`fetch` rule (keep them in sync)

`projects.json` is the source of truth, but the page reads its data from an
**inlined** `<script type="application/json" id="projects-data">` block in
`projects.html` — no runtime `fetch`, so the page stays a pure static file and
Lighthouse perf stays at 100. That means the JSON lives in **two places** and
they must match. After editing `projects.json`, copy it into that block.
`tests/projects.spec.js` fails if they drift, so CI catches a missed copy.

## Close-on-merge step (self-documenting)

When a loop build merges, it documents itself here as part of **close-on-merge**
(the mandatory close step in the loop's pipeline). Append its entry:

1. Add one object to `projects.json` following the schema above.
2. Copy `projects.json` into the inlined block in `projects.html` (the no-`fetch`
   rule) — or run the sync check locally.
3. `npx playwright test projects.spec.js` — the render, link-liveness, and sync
   tests gate it. Green = the wall documents the new build; no layout code changed.

This is the v1 **convention**. A later enhancement can automate step 1–2 by
appending to the array from loop state (the F3 `--json` feed); the schema here is
already machine-writable, so that automation just fills in these fields.
