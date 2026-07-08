# ROADMAP — hornof.org v2 refresh (Phase 7)

> Owned by **v2-worker** (single-writer). Acceptance boxes lifted from the eng doc
> (`loop/engdoc-v2-refresh.md`). A box is checked in the SAME commit as the feature
> work that satisfies it. Features run V1 → V2 → V3 → V4 in strict order, one PR each,
> on stacked branches. Nothing merges to main — Luke merges.

## V1 — Land the look decision (branch `v2/v1-land-look` off `polish/live-session`)
- [x] Frost-workaround audit: confirmed nothing in `BaseLayout`/`style.css` exists only to paper over frost. Snapshot already clean — no `backdrop-filter` in shell CSS (only comments); `::view-transition-*{animation:none}` correctly scoped to reduced-motion block; old `@keyframes zoomBackground` retired (F16). Panorama-continuity machinery (WAAPI zoom capture/resume, `transition:persist` bg layers) kept. Nothing to delete.
- [x] `--panel` kept at local 0.85 values; native cross-fade unchanged.
- [x] Existing Playwright suite green against a real `npm run build` + preview (88/88 pass).
- [x] Guard test added (`tests/frost-guard.spec.js`): computed-style asserts `.sidebar`/`.content` (/), `.projects` (/projects.html), `.colophon` (/built-with.html) report `backdrop-filter: none` in both themes (6 tests, all green).
- [x] Lighthouse: root 98 (≥98), wall 99 (≥99).
- [ ] (Deploy-artifact check on pages.dev — Luke/Cowork; flagged in PR body, not verifiable by worker.)
- [ ] (Luke look-check: full-opacity readability bump offered as a one-line option in PR body — NOT baked in; his call.)

## V2 — Persistent sidebar, site-wide (branch `v2/v2-sidebar` off V1)
- [x] New `src/layouts/MainLayout.astro` composes `BaseLayout`, renders persistent sidebar + `<slot />`; all five pages migrate to it.
- [x] Sidebar carries `transition:persist="sidebar"`; SSR'd sidebar byte-identical on every route (verified: build-output diff + SSR-fetch test; no per-page active class in HTML).
- [x] Active state applied client-side via `astro:page-load`: scroll-spy on `/`, current-page marker (Projects) on Projects-area pages, none on 404.
- [x] Nav links absolute (`/#about`…`/#projects`); section link from a subpage navigates home and scrolls to the section (wall reached via the in-content "See all projects →").
- [x] Per-page back-links (`.colophon-back`) retired; sidebar name wraps `<a href="/">` (home link). Subpage titles demoted h1→`h2.page-title` → exactly one h1 per page.
- [x] Mobile: sidebar collapses to a stacked persistent header (same persisted node) — NO drawer.
- [x] Test: persistence by element identity (runtime `data-persist-probe` stamp survives a nav, both directions).
- [x] Test: active state correct per route (home spy / Projects-area current / 404 none).
- [x] Test: section-link-from-subpage lands on the right section on home.
- [x] Test: mobile stacked header present and persisted at the mobile breakpoint.
- [x] Lighthouse holds: root 98 (≥98), wall 100 (≥99). Full suite 104/104 green on real build.
- [ ] (Luke V2 sidebar look-check gate — see LOG design decisions; drawer remains a later option if the stack is disliked.)

## V3 — Projects run inside the site (branch `v3/eclipse-embed` off V2)
- [x] "Run it" opens eclipse sim in a modal `<dialog>` lightbox with an `<iframe>` (src set on open, not at load) over the projects wall.
- [x] "Open full screen ↗" link kept inside the lightbox (also the mobile fallback).
- [x] Mobile (below 880px breakpoint): "Run it" resolves to the full-screen link, not the pane.
- [x] Test: "Run it" opens dialog; iframe present with src `/projects/eclipse/`; Esc/close dismisses; focus returns to trigger.
- [x] Test: full-screen link present and correct (`projects/eclipse/`, passthrough).
- [x] Test: mobile "Run it" navigates to the full-screen sim.
- [x] No Lighthouse regression on the wall page: wall 100 in 3 isolated runs (iframe carries no src until opened). Full suite 116/116 green.
- [ ] (Luke eclipse-pane feel-check gate — screenshot in LOG confirms desktop controls/help-overlay usable inside the pane.)

## V4 — Tech-debt exploration (report only; branch `v2/v4-techdebt-report` off V3)
- [ ] Item 1 — dot-dir archives (`/.2013/`, `/.2025/`): rename-to-non-dot plan + permanent redirects + link inventory + SEO/redirect notes → recommendation in LOG-v2.md.
- [ ] Item 2 — eclipse code copy: ranked options (per-project Pages subdomain / build-time pull / keep snapshot+sync) with costs → recommendation in LOG-v2.md.
- [ ] Item 3 — PROVENANCE/sync-script freshness given (2) → recommendation in LOG-v2.md.
- [ ] Three NEEDS-LUKE entries filed in QUESTIONS.md. Zero execution.

## Halt conditions
Stop cleanly (write reason in LOG-v2.md) when ANY of:
- (a) all four features accepted (V1–V3 branches pushed + tests green; V4 report + NEEDS-LUKE filed), OR
- (b) 3 iterations on one feature with no test progress — stop, write why in LOG + file a QUESTIONS entry, OR
- (c) a hard block that cannot be routed around.
NEVER merge to main — Luke merges.
