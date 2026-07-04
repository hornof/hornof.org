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

### F2 — [ ] DNS cutover runbook
`RUNBOOK-dns.md`: Cloudflare account + Pages project steps, DNS record import, TTL-lowering, nameserver switch at Dotster, rollback, auto-renew checklist. Luke-executable, numbered, no step assumes prior Cloudflare knowledge.
*Accept:* every step has a verification ("you should now see…"); rollback section present.

### F3 — [ ] Minimal core rebuild
Clean one-pager: name · "AI Engineering & Leadership" tagline · one positioning line · social row (LinkedIn, Google Scholar, X, GitHub, SoundCloud). Current earth-tone palette.
*Accept:* Lighthouse ≥95 perf + a11y; renders at 375px and 1440px (Playwright viewport tests); no placeholder text.

### F4 — [ ] Tardis time-machine
Subtle control (Easter-egg register, not primary nav) linking the three archives.
*Accept:* all archives reachable via it; keyboard accessible; Playwright nav test.

### F5 — [ ] Sidebar layout + scroll-spy
Fixed left sidebar, scroll-spy nav lighting up per section, content right; single column on mobile.
*Accept:* scroll-spy tracks section in view; keyboard navigable; mobile collapse tested.

### F6 — [ ] Real sections + reduced-motion
About · Experience · Publications · Talks · Contact, copy generated into `content/` from Luke's real assets (resume, publications, talks index in Claude-Cowork) — flag any thin section in the PR rather than padding it. Site-wide `prefers-reduced-motion` guard.
*Accept:* every publication/talk links somewhere real (link-liveness test); no lorem ipsum; reduced-motion respected. **Luke sign-off on copy in the PR is part of done.**
