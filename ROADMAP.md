# hornof.org rebuild — roadmap (Phases 0–2)

> The spec the loop works from. Approved PRD + eng doc: `Claude-Cowork/projects/fable-5/loop/{prd,engdoc}-hornof-org.md` (read both before F1). One feature per iteration: Playwright tests from acceptance criteria FIRST, implement until green, check the box, commit on a feature branch, push, open a PR. Never push to main. Note ambiguity choices in the PR description.

## Ground rules
- Plain HTML + one `style.css` + minimal vanilla `main.js`. No frameworks, no build step. Styling isolated in style.css (a future skin swap must touch only that file).
- Verifier: Playwright (tests/) + GitHub Actions CI. Lighthouse budgets from F3 on: performance ≥95, accessibility ≥95.
- Archives `.2013/.2024/.2025` are read-only — never modify their contents.
- Anything touching DNS/registrar: write runbooks, don't execute — those steps are Luke's.

## Features (ranked)

### F1 — [x] Port the current site + archives
Fetch the live hornof.org (current one-pager) and its archive versions; commit verbatim into the repo layout. Cloudflare Pages config ready (`wrangler.toml` or Pages defaults documented in README).
*Accept:* local serve renders identically to production; archive paths `/.2013/ /.2024/ /.2025/` load; Playwright test proves all four render + archive links resolve.

### F2 — [x] DNS cutover runbook
`RUNBOOK-dns.md`: Cloudflare account + Pages project steps, DNS record import, TTL-lowering, nameserver switch at Dotster, rollback, auto-renew checklist. Luke-executable, numbered, no step assumes prior Cloudflare knowledge.
*Accept:* every step has a verification ("you should now see…"); rollback section present.

### F3 — [x] Minimal core rebuild
Clean one-pager: name · "AI Engineering & Leadership" tagline · one positioning line · social row (LinkedIn, Google Scholar, X, GitHub, SoundCloud). Current earth-tone palette.
*Accept:* Lighthouse ≥95 perf + a11y; renders at 375px and 1440px (Playwright viewport tests); no placeholder text.

### F4 — [x] Tardis time-machine
Subtle control (Easter-egg register, not primary nav) linking the three archives.
*Accept:* all archives reachable via it; keyboard accessible; Playwright nav test.

### F5 — [x] Sidebar layout + scroll-spy
Fixed left sidebar, scroll-spy nav lighting up per section, content right; single column on mobile.
*Accept:* scroll-spy tracks section in view; keyboard navigable; mobile collapse tested.

### F6 — [x] Real sections + reduced-motion
About · Experience · Publications · Talks · Contact, copy generated into `content/` from Luke's real assets (resume, publications, talks index in Claude-Cowork) — flag any thin section in the PR rather than padding it. Site-wide `prefers-reduced-motion` guard.
*Accept:* every publication/talk links somewhere real (link-liveness test); no lorem ipsum; reduced-motion respected. **Luke sign-off on copy in the PR is part of done.**

## Phase 3 — polish (backlog-promoted)

> F1–F6 completed the approved Phases 0–2 PRD/engdoc in full. These items are promoted from `product-backlog.md`'s idea inbox (Luke green-lit the batch 2026-07-06). They stay inside the locked architecture — plain HTML + one `style.css` + vanilla `main.js`, no framework, no skin change — and must not regress the F3 Lighthouse budgets (perf ≥95, a11y ≥95).

### F7 — [x] Dark/light theme toggle
A control that switches between the earth-tone (light) palette and a dark variant. Defaults to the OS `prefers-color-scheme`; user choice persists across reloads (localStorage). All colour values stay isolated in `style.css` (the skin-swap rule).
*Accept:* toggle flips the theme and updates its `aria-pressed`/label; choice persists across reload; with no stored choice the OS preference wins; keyboard accessible; Lighthouse a11y ≥95 holds in both themes. Playwright proves each.

### F8 — [x] "Built with" transparency page
A subtle section/page documenting how the site was built — the agentic engineering loop, the stack (plain HTML/CSS/JS on Cloudflare Pages), and that it ships PR-per-feature with Playwright gates. Credibility piece, not padding.
*Accept:* reachable from the page; renders real copy (no lorem ipsum); every external link it carries resolves live (link-liveness test); no Lighthouse regression.

### F9 — [x] France/Brittany Easter egg
A subtle flourish in the same Easter-egg register as the Tardis (not primary nav) — a nod to France/Brittany. Hidden until invoked; keyboard accessible.
*Accept:* not visible on load; invoking it (click or keyboard) reveals it; Escape/dismiss works; keyboard operable; no Lighthouse regression. Playwright nav test.

### F10 — [x] SoundCloud now-playing embed
Surface Luke's SoundCloud from the music thread. The embed is an external iframe, so it must be lazy/deferred and must not regress the F3 perf budget.
*Accept:* embed present and pointing at Luke's SoundCloud; loaded with `loading="lazy"` (or click-to-load) so it doesn't block first paint; Lighthouse perf ≥95 and a11y ≥95 still hold with it on the page. Playwright proves presence + budget.
