# Built with

> Source copy for `built-with.html`. Rendered by `src/pages/built-with.astro`;
> the CV/section content is now data in the `content/` collections.

This site is deliberately small — and still ships no tracking. It's built with
**Astro**: pages and layouts compose from small components, the content —
projects, talks, experience — lives in typed content collections, and a single
`style.css` holds the entire look, so a future re-skin touches nothing else. The
interactivity is a handful of tiny vanilla scripts: the scroll-spy, the
time-machine, the theme toggle, and the breathing panorama. `astro build`
compiles it all to static HTML, hosted on **Cloudflare Pages** and deployed
straight from a `git push`.

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
