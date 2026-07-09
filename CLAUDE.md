# hornof.org — working notes for Claude

Personal site. Astro static build, one `style.css` (the whole skin lives there), deployed to Cloudflare Pages from `main`.

## Commands
- `npm run dev` — dev server on :8788 (HMR). Caveat: the archives (`/.20xx/`) and the embedded eclipse app **404 in dev** — they only serve from a real build, so use a build/preview (or a Cloudflare preview deploy) to check those.
- `npm test` — Playwright suite against a real build (`npm run build && npm run preview`). Run this before locking anything in.
- `npm run build` / `npm run preview` — production build, then preview it.

## Branching & PRs — standing rule (flat history)
Keep history flat so that **"merged" always means "on `main`"**:
- Branch off **freshly-fetched `main`**: `git fetch && git checkout -b <name> origin/main`.
- **One PR per unit of work, straight to `main`.** Never stack PRs into intermediate branches.
- Merge, then **delete the branch**.

Do NOT stack PRs into each other. On 2026-07-08 a stacked chain (V4 → V3 → V2 merging up the stack, then a reconciliation PR to `main`) caused a push rejection, a divergence rebase, and a stale-state mixup where "merged" didn't mean "on `main`." Flat branches remove that whole class of problem.

## Verify repo state before asserting it
Before any claim about branches / open PRs / what's on `main` / what's deployed — and before opening or merging anything — run **`/gitstate`** (fetch + read origin). Never state repo state from memory; it goes stale as others merge and push. **"Merged" is only true once the change is in `origin/main`'s log.**

**Enforced mechanically:** `.githooks/pre-push` runs the fetch + state check on every push and **blocks** it if the current branch's PR is already merged, or if the branch is behind `origin/main` (stale — rebase first). One-time setup per clone (the hook lives in a tracked dir, not `.git/hooks`):

    git config core.hooksPath .githooks

Overrides: `GITSTATE_ALLOW_STALE=1 git push …` (push a behind-main branch on purpose) or `git push --no-verify` (skip the guard — sparingly).

## Verifying UI / layout changes
Measure across all pages, both axes (vertical *and* horizontal), both themes, and both breakpoints — don't eyeball, and don't just confirm the one thing you changed. Use **`/uicheck <target>`** and report a measured evidence table, not "looks good."
