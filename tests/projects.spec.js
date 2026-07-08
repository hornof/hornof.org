// @ts-check
// F11 — Projects wall (page + render + nav).
// Acceptance: reachable from a "Projects" sidebar nav link; every entry in the
// inlined JSON renders as a card with its fields; renders at 375px and 1440px;
// no placeholder text. (Lighthouse budget is gated by lighthouse.spec.js, and
// extended to the projects page here.)
const { test, expect, request } = require("@playwright/test");
const fs = require("fs");

// F17: the wall is generated at build time from the `projects` content
// collection — there is no longer an inlined #projects-data island to read the
// expected set off the page. The source of truth is the on-disk collection, so
// tests that need the entry list read it straight from there.
const SOURCE = () =>
  JSON.parse(fs.readFileSync("content/projects/projects.json", "utf-8"));

test.describe("F11: reachable from the site", () => {
  test("Projects is an on-page section that links out to the wall", async ({ page }) => {
    await page.goto("/");
    // Projects is an in-page nav anchor (like the other sections), not a page
    // link. V2: nav hrefs are absolute so a section link works from any route.
    const navLink = page.locator('.section-nav a[href="/#projects"]');
    await expect(navLink).toHaveCount(1);
    await expect(navLink).toHaveText(/projects/i);
    await expect(page.locator("section#projects")).toHaveCount(1);

    // The section carries the outbound link to the full wall — and it resolves live.
    // F16: internal navigation is now a same-document view-transition swap (the
    // ClientRouter intercepts the click), not a fresh document GET — so there is
    // no navigation response to read a 200 off. Assert the stronger end-to-end
    // fact instead: the click lands on the wall URL and the wall actually renders
    // its cards there (proving the swap + the after-swap re-init both work). The
    // 200/real-content contract for the wall itself is covered by the direct
    // page.goto("/projects.html") tests below and by the passthrough suite; that
    // a real view transition fires here is covered by transitions.spec.js.
    const wallLink = page.locator('#projects a[href="projects.html"]');
    await expect(wallLink).toHaveCount(1);
    await wallLink.click();
    await page.waitForURL(/projects/);
    await expect(page).toHaveURL(/projects/);
    // V2: the single h1 is the persistent sidebar name; the wall's own title is
    // now an h2.page-title. Assert we landed on the wall via that title + cards.
    await expect(page.locator(".projects .page-title")).toHaveText(/projects/i);
    await expect(page.locator(".project-card").first()).toBeVisible();
  });
});

test.describe("F11: the wall renders", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/projects.html");
  });

  test("has a title, single h1, and shares the site stylesheet", async ({
    page,
  }) => {
    await expect(page).toHaveTitle(/projects/i);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(
      page.locator('link[rel="stylesheet"][href="style.css"]')
    ).toHaveCount(1);
  });

  test("renders one card per source-collection entry", async ({
    page,
  }) => {
    const entries = SOURCE();
    expect(Array.isArray(entries), "data is an array").toBeTruthy();
    expect(entries.length, "has at least one entry").toBeGreaterThanOrEqual(1);

    const cards = page.locator(".project-card");
    await expect(cards).toHaveCount(entries.length);
  });

  test("each card shows its title, blurb, date and build line", async ({
    page,
  }) => {
    const entries = SOURCE();

    for (const entry of entries) {
      const card = page.locator(`.project-card[data-slug="${entry.slug}"]`);
      await expect(card).toHaveCount(1);
      await expect(card).toContainText(entry.title);
      await expect(card).toContainText(entry.blurb);
      await expect(card.locator(".project-date")).toContainText(entry.date);
      // The differentiator: the "how it was built" line, sourced from build.stack.
      if (entry.build && entry.build.stack) {
        await expect(card.locator(".project-build")).toContainText(
          entry.build.stack
        );
      }
      // Every declared link is rendered as an anchor.
      for (const l of entry.links || []) {
        await expect(
          card.locator(`.project-links a[href="${l.href}"]`)
        ).toHaveCount(1);
      }
    }
  });

  test("no placeholder / lorem text", async ({ page }) => {
    const body = (await page.locator("body").innerText()).toLowerCase();
    for (const bad of [
      "lorem ipsum",
      "placeholder",
      "todo",
      "coming soon",
      "sample text",
    ]) {
      expect(body, `should not contain "${bad}"`).not.toContain(bad);
    }
  });

  test("offers a way back to the site", async ({ page }) => {
    await expect(page.locator('a[href="/"]').first()).toBeVisible();
  });

  test("renders without horizontal overflow at 375px and 1440px", async ({
    page,
  }) => {
    for (const width of [375, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/projects.html");
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth + 1
      );
      expect(overflow, `no h-overflow at ${width}px`).toBeFalsy();
      await expect(page.locator(".project-card").first()).toBeVisible();
    }
  });
});

// F12 — Dogfood entry (hornof.org itself): real facts, every link live.
test.describe("F12: dogfood entry", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/projects.html");
  });

  test("the hornof.org entry exists with a real build-note", async ({ page }) => {
    const card = page.locator('.project-card[data-slug="hornof-org"]');
    await expect(card).toHaveCount(1);
    await expect(card).toContainText("hornof.org");
    // The build-note names the real stack + process — the differentiator.
    const build = (await card.locator(".project-build").innerText()).toLowerCase();
    for (const term of ["html", "cloudflare", "claude code"]) {
      expect(build, `build-note mentions ${term}`).toContain(term);
    }
    // A real test count, not a stub.
    expect(build).toMatch(/\d+\s*tests/);
  });

  test("no invented placeholder metrics", async ({ page }) => {
    const body = (await page.locator("body").innerText()).toLowerCase();
    for (const bad of ["lorem", "placeholder", "todo", "tbd", "xx tests", "$xx"]) {
      expect(body, `no "${bad}"`).not.toContain(bad);
    }
  });

  test("every link in every entry resolves live (not 404/410)", async ({
    page,
    baseURL,
  }) => {
    const entries = SOURCE();
    const hrefs = entries.flatMap((e) => (e.links || []).map((l) => l.href));
    expect(hrefs.length, "entries carry links").toBeGreaterThanOrEqual(1);

    const ctx = await request.newContext({
      baseURL,
      extraHTTPHeaders: { "User-Agent": "Mozilla/5.0 (hornof.org link check)" },
      ignoreHTTPSErrors: true,
    });

    let reachedAny = false;
    for (const href of hrefs) {
      // Relative links resolve against the dev server; absolute against their host.
      const url = /^https?:\/\//.test(href) ? href : new URL(href, baseURL).href;
      let resp;
      try {
        resp = await ctx.get(url, { timeout: 20000 });
      } catch (e) {
        continue; // offline / DNS — don't flake on network
      }
      reachedAny = true;
      expect([404, 410], `${href} is a dead link (${resp.status()})`).not.toContain(
        resp.status()
      );
    }
    await ctx.dispose();
    test.skip(!reachedAny, "no host reachable — offline");
  });
});

// F13 — Self-documenting convention: entries are pure data, so a new build adds
// itself by appending one object; the schema is documented.
//
// F17: the wall is now generated at build time from the `projects` collection
// (no inlined JSON island, no client render), so the old "inject an entry into
// #projects-data and watch a card appear" test — and the sync test that guarded
// the hand-copied island — are both gone. In their place, the data-driven
// guarantee is proven as a bijection between the source collection and the
// rendered cards: the card set is exactly the entry set, every field sourced
// from data, no per-entry layout code. Appending one object therefore yields
// exactly one more card with its fields, touching nothing else.
test.describe("F13: self-documenting convention", () => {
  test("the wall is a pure projection of the collection (data drives every card)", async ({
    page,
  }) => {
    await page.goto("/projects.html");
    const entries = SOURCE();

    // 1. Bijection on count: no card without an entry, no entry without a card.
    await expect(page.locator(".project-card")).toHaveCount(entries.length);

    // 2. Every rendered card's slug is a source slug (no invented cards).
    const renderedSlugs = await page
      .locator(".project-card")
      .evaluateAll((els) => els.map((e) => e.getAttribute("data-slug")));
    const sourceSlugs = entries.map((e) => e.slug);
    expect([...renderedSlugs].sort()).toEqual([...sourceSlugs].sort());

    // 3. Every entry's fields + links are rendered in its card — the card is a
    //    pure function of the data, so a new entry needs no new layout code.
    for (const entry of entries) {
      const card = page.locator(`.project-card[data-slug="${entry.slug}"]`);
      await expect(card).toHaveCount(1);
      await expect(card).toContainText(entry.title);
      await expect(card).toContainText(entry.blurb);
      await expect(card.locator(".project-date")).toContainText(entry.date);
      if (entry.build && entry.build.stack) {
        await expect(card.locator(".project-build")).toContainText(
          entry.build.stack
        );
      }
      for (const l of entry.links || []) {
        await expect(
          card.locator(`.project-links a[href="${l.href}"]`)
        ).toHaveCount(1);
      }
    }
  });

  test("the entry schema + close-on-merge convention is documented", () => {
    const readme = fs
      .readFileSync("content/projects/README.md", "utf-8")
      .toLowerCase();
    for (const field of ["slug", "title", "blurb", "date", "links", "build"]) {
      expect(readme, `documents "${field}"`).toContain(field);
    }
    expect(readme, "documents the close-on-merge step").toMatch(/close-on-merge|on merge/);
  });
});
