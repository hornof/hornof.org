// @ts-check
// F1 — Port the current site + archives (archive half — still load-bearing).
// The root page is now the F3 minimal-core rebuild (see core.spec.js), so the
// old "root byte-matches production" parity tests were removed: the root
// intentionally diverges from the ported one-pager, which lives on verbatim in
// the /2025-archive/ archive. The archive guarantees below remain in force forever.
const { test, expect, request } = require("@playwright/test");

// Every page that must render: the (rebuilt) root + three read-only archives.
const PAGES = [
  { path: "/", label: "current site" },
  { path: "/2013-archive/", label: "2013 archive" },
  { path: "/2025-archive/", label: "2025 archive" },
];

test.describe("F1: site + archives render", () => {
  for (const { path, label } of PAGES) {
    test(`${label} (${path}) loads with 200 and visible content`, async ({ page }) => {
      const resp = await page.goto(path);
      expect(resp, `no response for ${path}`).toBeTruthy();
      expect(resp.status(), `${path} status`).toBe(200);
      // Renders real content, not an empty/error page.
      const bodyText = (await page.locator("body").innerText()).trim();
      expect(bodyText.length, `${path} body text`).toBeGreaterThan(0);
      await expect(page).toHaveTitle(/Luke Hornof/i);
    });
  }
});

test.describe("F1: no broken same-origin assets on any page", () => {
  for (const { path, label } of PAGES) {
    test(`${label} (${path}) loads every referenced asset without 4xx/5xx`, async ({ page }) => {
      const bad = [];
      page.on("response", (resp) => {
        const url = resp.url();
        if (url.startsWith("http://localhost") && resp.status() >= 400) {
          bad.push(`${resp.status()} ${url}`);
        }
      });
      await page.goto(path, { waitUntil: "networkidle" });
      expect(bad, `broken assets on ${path}:\n${bad.join("\n")}`).toEqual([]);
    });
  }
});

test.describe("F1: archive links resolve", () => {
  test("each archive path returns 200 via direct request", async ({ baseURL }) => {
    const ctx = await request.newContext({ baseURL });
    for (const path of ["/2013-archive/", "/2025-archive/"]) {
      const resp = await ctx.get(path);
      expect(resp.status(), `${path} should resolve`).toBe(200);
      const html = await resp.text();
      expect(html.toLowerCase(), `${path} should be HTML`).toContain("<html");
    }
    await ctx.dispose();
  });
});
