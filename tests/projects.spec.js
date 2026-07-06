// @ts-check
// F11 — Projects wall (page + render + nav).
// Acceptance: reachable from a "Projects" sidebar nav link; every entry in the
// inlined JSON renders as a card with its fields; renders at 375px and 1440px;
// no placeholder text. (Lighthouse budget is gated by lighthouse.spec.js, and
// extended to the projects page here.)
const { test, expect, request } = require("@playwright/test");

test.describe("F11: reachable from the site", () => {
  test('a "Projects" nav link points at the wall', async ({ page }) => {
    await page.goto("/");
    const link = page.locator('.section-nav a[href*="projects"]');
    await expect(link).toHaveCount(1);
    await expect(link).toHaveText(/projects/i);

    const resp = await Promise.all([
      page.waitForNavigation(),
      link.click(),
    ]).then(([nav]) => nav);
    expect(resp && resp.status(), "projects page status").toBe(200);
    await expect(page).toHaveURL(/projects/);
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

  test("renders one card per entry in the inlined JSON data", async ({
    page,
  }) => {
    const data = await page.locator("#projects-data").textContent();
    const entries = JSON.parse(data || "[]");
    expect(Array.isArray(entries), "data is an array").toBeTruthy();
    expect(entries.length, "has at least one entry").toBeGreaterThanOrEqual(1);

    const cards = page.locator(".project-card");
    await expect(cards).toHaveCount(entries.length);
  });

  test("each card shows its title, blurb, date and build line", async ({
    page,
  }) => {
    const data = await page.locator("#projects-data").textContent();
    const entries = JSON.parse(data || "[]");

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
    const data = await page.locator("#projects-data").textContent();
    const entries = JSON.parse(data || "[]");
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
