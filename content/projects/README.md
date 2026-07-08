# Projects wall — entry schema + convention

The Projects wall (`/projects.html`) is **data-driven**: every card is one object
in `projects.json`, loaded as the `projects` content collection
(`src/content.config.ts`) and rendered to a card at build time by
`src/pages/projects.astro`. Adding a build to the wall means appending one object
— no HTML, CSS, or JS is touched. zod type-checks the entry at build, and
`tests/projects.spec.js` proves every entry renders as a card with its fields.

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
| `stack` | string | e.g. `Astro · static HTML · content collections · one style.css · Cloudflare Pages` |
| `agents` | string | e.g. `Claude Code` |
| `models` | string | e.g. `Opus 4.8` |
| `tests` | number | count as of `date` |
| `firstPassGreen` | string \| bool | honest note, e.g. `mostly — human review caught the rest` |
| `costNote` | string | durable, honest — **no fabricated figures**; omit rather than invent |

## Single source of truth (no more sync)

`projects.json` is the **only** copy of the data. The wall reads it through the
`projects` content collection and renders the cards at build time — there is no
inlined `<script>` mirror to keep in step, so the old no-`fetch` sync rule (and
its drift test) are retired. Because rendering is static (build time, no runtime
`fetch`), the page stays a pure static file and Lighthouse perf stays at 100.

## Close-on-merge step (self-documenting)

When a loop build merges, it documents itself here as part of **close-on-merge**
(the mandatory close step in the loop's pipeline). Append its entry:

1. Add one object to `projects.json` following the schema above.
2. `npx playwright test projects.spec.js` — the render + link-liveness tests gate
   it. Green = the wall documents the new build; no layout code changed.

This is the v1 **convention**. A later enhancement can automate step 1 by
appending to the array from loop state (the F3 `--json` feed); the schema here is
already machine-writable, so that automation just fills in these fields.
