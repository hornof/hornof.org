# ROADMAP — hornof.org on Astro (Phase 6)

> The spec the loop works from. Approved PRD + eng doc: `Claude-Cowork/projects/fable-5/loop/{prd,engdoc}-astro-rebuild.md` (both gates ✅, Luke 2026-07-07/08). One PR per phase: Playwright tests from the acceptance criteria FIRST, build until green, check the box, PR, never push to `main`. Preserve the *spirit* of the current look; build the Astro way. The existing `ROADMAP.md` stays the record of the static build — its "no framework, no build step" rules do not apply here.

## Ground rules
- Astro static output → Cloudflare Pages (a build command, not raw files). No UI framework; the four vanilla behaviors ship as small islands/scripts.
- Verifier: the existing 76-test Playwright suite, run against the Astro build, stays green — adapt a test only where Astro's structure legitimately changed, never to hide a real break. Lighthouse ≥ today (root 100/100, wall ≥99).
- Archives `.2013`/`.2025` and the eclipse app `/projects/eclipse/` are read-only passthrough — never modify their contents.
- Parity is spirit, not pixels: improve within the character (palette, panes, panorama, register); a ground-up redesign is out of scope.
- Nothing to `main` without Luke. Each phase = its own PR + a Cloudflare Pages preview URL for the look/feel A/B.

## Features (one PR each)

### F14 — [ ] Scaffold + passthrough proof (PR 0, PRD E1.2)
Scaffold Astro (static, TypeScript) on `astro-rebuild`; move the archives + eclipse app into `public/`.
*Accept:* `/.2013/`, `/.2025/`, `/projects/eclipse/`, and `/projects/eclipse/PROVENANCE.txt` all return 200 with real content **after a real `astro build`**; the dev server serves a shell. Settles the dot-dir passthrough unknown before any porting.

### F15 — [ ] Parity port (PR 1, PRD E1.1)
`BaseLayout` + every page + components + the four behaviors; `style.css` global; wall from an interim data source.
*Accept:* the full 76-test suite passes against the Astro build; Lighthouse ≥ today; preview URL for Luke.

### F16 — [ ] Transitions + persist (PR 2, PRD E2.1)
`<ClientRouter />` + `transition:persist` panorama + pane crossfade + reduced-motion.
*Accept:* background phase persists across navigation; no frost flash; tests green; **Luke feel-check**. The pane-frost mechanism is a hypothesis — the outcome is the gate; may need persisting the panes too.

### F17 — [ ] Content as data (PR 3, PRD E3.1 + E3.2)
Content collections; generate wall/colophon from them; retire the sync + its test; `astro:assets`; rewrite the self-description copy (built-with page + hornof.org card stack line) to the Astro stack.
*Accept:* a new project = one data file; every other rendered string byte-identical; the self-description sweep is the one intended change under **Luke sign-off**; tests green; perf 100.
