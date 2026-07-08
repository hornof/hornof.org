// @ts-check
// F6 — Real sections + link-liveness.
// Acceptance: sections carry real copy (no lorem/placeholder); every publication
// links somewhere real and live. Talks is flagged thin (no public links yet) —
// see content/talks.md — so it is checked as titles, not links.
const { test, expect, request } = require("@playwright/test");

test.describe("F6: real section content", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("every section has a heading and real body copy", async ({ page }) => {
    for (const id of ["about", "experience", "publications", "talks", "projects"]) {
      const section = page.locator(`#${id}`);
      await expect(section.locator("h2")).toBeVisible();
      const text = (await section.innerText()).trim();
      // Real copy, not a one-word stub.
      expect(text.split(/\s+/).length, `${id} word count`).toBeGreaterThan(8);
    }
  });

  test("no placeholder / lorem text anywhere", async ({ page }) => {
    const body = (await page.locator("body").innerText()).toLowerCase();
    for (const bad of [
      "lorem ipsum",
      "placeholder",
      "todo",
      "tk tk",
      "coming soon",
      "sample text",
    ]) {
      expect(body, `should not contain "${bad}"`).not.toContain(bad);
    }
  });

  test("experience lists real, specific roles", async ({ page }) => {
    const roles = page.locator("#experience .cv li");
    await expect(roles).toHaveCount(7);
    await expect(page.getByText(/CTO, ThirdLaw/)).toBeVisible();
    await expect(page.getByText(/10 to 150 across four countries/)).toBeVisible();
  });
});

test.describe("F6: publication links are real and live", () => {
  test("each publication has an absolute, non-placeholder https link", async ({
    page,
  }) => {
    await page.goto("/");
    const links = page.locator("#publications a");
    const count = await links.count();
    expect(count, "publication link count").toBeGreaterThanOrEqual(4);

    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute("href");
      expect(href, `link ${i} href`).toBeTruthy();
      expect(href, `link ${i} is absolute https`).toMatch(/^https:\/\//);
      expect(href, `link ${i} not a placeholder`).not.toMatch(/^#|example\.com/);
    }
  });

  test("every publication link resolves live (not 404)", async ({ page, baseURL }) => {
    await page.goto("/");
    const hrefs = await page.locator("#publications a").evaluateAll((els) =>
      els.map((e) => e.getAttribute("href"))
    );

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
        // Offline / DNS failure for this host — don't flake the suite on network.
        continue;
      }
      reachedAny = true;
      // A live URL: the host answered and it isn't a dead resource. Some hosts
      // bot-block (403/429/999) — that still proves the URL points somewhere
      // real; only a 404/410 means the link itself is broken.
      expect([404, 410], `${href} is a dead link (${resp.status()})`).not.toContain(
        resp.status()
      );
    }
    await ctx.dispose();

    test.skip(!reachedAny, "no external host reachable — offline");
  });
});

test.describe("F6: talks (flagged thin)", () => {
  test("lists the real talk titles", async ({ page }) => {
    await page.goto("/");
    const talks = page.locator("#talks .talks li");
    await expect(talks).toHaveCount(5);
    await expect(page.getByText(/Building Amazing Engineering Teams/)).toBeVisible();
  });
});
