# LOG — hornof.org on Astro (Phase 6)

Append-only, one line per iteration. Newest at the bottom.

- 2026-07-08 — Gates cleared (PRD + eng doc, Luke). Stashed the abandoned VT/Swup experiment; branched `astro-rebuild` off clean `origin/main` (785d1b3). ROADMAP-astro + LOG created. Starting F14 (scaffold + passthrough proof).
- 2026-07-08 — F14: settled the dot-dir passthrough unknown in an isolated scratch build — Astro v5 copies `.`-prefixed dirs from `public/` to `dist/` intact (`.2013test/index.html` survived). No workaround needed; archives + eclipse can live in `public/` as-is. Proceeding to scaffold the real tree.
- 2026-07-08 — F14 DONE (PR 0). Scaffolded Astro v5.18 (static output, `.mjs` config so the CommonJS Playwright suite stays intact — dropped `type:module`). `git mv` archives + eclipse into `public/`. Real `astro build` → `/.2013/`, `/.2025/`, `/projects/eclipse/`, `/projects/eclipse/PROVENANCE.txt` all 200 with real content; encoded as `tests/astro-passthrough.spec.js` (5/5 green). Next: F15 parity port.
