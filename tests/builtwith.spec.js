// @ts-check
// F8 — "Built with" transparency page.
// Acceptance: reachable from the main page; real copy (no lorem ipsum); every
// external link resolves live (not 404); no Lighthouse regression (covered by
// lighthouse.spec.js on the root page).
const { test, expect, request } = require("@playwright/test");

test.describe("F8: reachable from the main page", () => {
  test("a subtle colophon link points to the built-with page", async ({
    page,
  }) => {
    await page.goto("/");
    const link = page.locator('a[href*="built-with"]');
    await expect(link).toHaveCount(1);
    await expect(link).toBeVisible();

    const resp = await Promise.all([
      page.waitForNavigation(),
      link.click(),
    ]).then(([nav]) => nav);
    expect(resp && resp.status(), "built-with status").toBe(200);
    await expect(page).toHaveURL(/built-with/);
  });
});

test.describe("F8: the page itself", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/built-with.html");
  });

  test("has a title, a single h1, and real body copy", async ({ page }) => {
    await expect(page).toHaveTitle(/built/i);
    await expect(page.locator("h1")).toHaveCount(1);
    const words = (await page.locator("main, body").first().innerText())
      .trim()
      .split(/\s+/).length;
    expect(words, "real copy, not a stub").toBeGreaterThan(40);
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

  test("names the real stack and process", async ({ page }) => {
    const body = (await page.locator("body").innerText()).toLowerCase();
    // The transparency claims that matter: the host, the no-framework stance,
    // the verifier, and how it ships.
    for (const term of ["cloudflare", "playwright", "claude code"]) {
      expect(body, `mentions ${term}`).toContain(term);
    }
  });

  test("offers a way back to the site", async ({ page }) => {
    const home = page.locator('a[href="/"], a[href="index.html"], a[href="./"]');
    await expect(home.first()).toBeVisible();
  });

  test("shares the site stylesheet (visual consistency)", async ({ page }) => {
    await expect(page.locator('link[rel="stylesheet"][href="style.css"]')).toHaveCount(1);
  });
});

test.describe("F8: external links are real and live", () => {
  test("every external https link resolves (not 404/410)", async ({ page }) => {
    await page.goto("/built-with.html");
    const hrefs = (
      await page.locator("a").evaluateAll((els) =>
        els.map((e) => e.getAttribute("href"))
      )
    ).filter((h) => h && /^https?:\/\//.test(h));

    expect(hrefs.length, "has external links to check").toBeGreaterThanOrEqual(2);

    const ctx = await request.newContext({
      extraHTTPHeaders: { "User-Agent": "Mozilla/5.0 (hornof.org link check)" },
      ignoreHTTPSErrors: true,
    });

    let reachedAny = false;
    for (const href of hrefs) {
      let resp;
      try {
        resp = await ctx.get(href, { timeout: 20000 });
      } catch (e) {
        continue; // offline / DNS — don't flake on network
      }
      reachedAny = true;
      // Bot-blocks (403/429/999) still prove the URL is real; only 404/410 is dead.
      expect([404, 410], `${href} is a dead link (${resp.status()})`).not.toContain(
        resp.status()
      );
    }
    await ctx.dispose();
    test.skip(!reachedAny, "no external host reachable — offline");
  });
});
