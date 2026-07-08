// @ts-check
// F8 — "Built with" transparency page.
// Acceptance: reachable from the main page; real copy (no lorem ipsum); every
// external link resolves live (not 404); no Lighthouse regression (covered by
// lighthouse.spec.js on the root page).
const { test, expect, request } = require("@playwright/test");

test.describe("F8: reachable via the projects wall", () => {
  // The home page no longer carries a direct "how this site was built" link
  // (redundant — the site is the first entry on the projects wall, which links
  // to the built-with page). Reachability now runs through that entry.
  test("the built-with page is linked from the hornof.org projects entry and loads 200", async ({
    page,
  }) => {
    await page.goto("/projects.html");
    const link = page.locator('a[href*="built-with"]').first();
    await expect(link).toBeVisible();
    const href = await link.getAttribute("href");
    const resp = await page.request.get(new URL(href, page.url()).href);
    expect(resp.status(), "built-with status").toBe(200);
  });

  test("the home page no longer carries a direct built-with link", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator('a[href*="built-with"]')).toHaveCount(0);
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

  test("offers a way back to the projects wall it's reached from", async ({ page }) => {
    // This page is only linked from the hornof.org entry on the projects wall,
    // so its back link returns there (matching eclipse-built.html), not home.
    const back = page.locator(".colophon-back a");
    await expect(back).toBeVisible();
    await expect(back).toHaveAttribute("href", "projects.html");
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
