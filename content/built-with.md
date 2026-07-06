# Built with

> Source copy for `built-with.html`, inlined by hand (no build step), same as the
> section content under `content/`.

This site is deliberately small. No framework, no build step, no tracking — just
three files served as static assets: one `index.html`, one `style.css` that holds
the entire look (so a future re-skin touches nothing else), and about a hundred
lines of dependency-free `main.js` for the scroll-spy, the time-machine, and the
theme toggle. It's hosted on **Cloudflare Pages**, deployed straight from a
`git push`.

The more unusual part is how it was built. hornof.org was rebuilt as the first
real lane of an **agentic engineering loop**: an approved product spec and
engineering doc up front, then one pull request per feature. Every feature starts
as **Playwright** tests written from its acceptance criteria — the tests come
first, the implementation follows until they pass. **Lighthouse** budgets
(performance and accessibility both ≥ 95) gate every change, and a human reviews
and merges each PR. The agent is **Claude Code**; a person stays in the loop for
taste, review, and the calls a model shouldn't make alone.

The whole thing — history, tests, and this page — ships one reviewed pull
request at a time. More of Luke's work is on GitHub. (The repository itself is
private for now; it opens up when Luke flips it.)
