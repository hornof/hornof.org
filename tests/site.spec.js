// @ts-check
// F1 — Port the current site + archives.
// Acceptance: local serve renders identically to production; archive paths
// /.2013/ /.2024/ /.2025/ load; all four render + archive links resolve.
const { test, expect, request } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

// The four pages that must render: current site + three archives.
const PAGES = [
  { path: "/", label: "current site" },
  { path: "/.2013/", label: "2013 archive" },
  { path: "/.2024/", label: "2024 archive" },
  { path: "/.2025/", label: "2025 archive" },
];

const PRODUCTION = "https://hornof.org/";

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

test.describe("F1: current site content (production parity markers)", () => {
  test("renders name, tagline, positioning, and full social row", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("p.myname")).toHaveText(/LUKE HORNOF/i);
    await expect(page.locator("p.mytitle")).toHaveText(/AI Engineering & Leadership/i);
    await expect(page.getByText(/Founder, researcher, software engineer/i)).toBeVisible();

    // Social row: every icon links to the right destination.
    const expectedLinks = [
      "linkedin.com/in/lukehornof",
      "scholar.google.com",
      "x.com/hornof",
      "github.com/hornof",
      "facebook.com/lukehornof",
      "instagram.com/lukehornof",
      "soundcloud.com/luke-hornof",
    ];
    for (const href of expectedLinks) {
      await expect(page.locator(`.social-icons a[href*="${href}"]`)).toHaveCount(1);
    }
  });
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
    for (const path of ["/.2013/", "/.2024/", "/.2025/"]) {
      const resp = await ctx.get(path);
      expect(resp.status(), `${path} should resolve`).toBe(200);
      const html = await resp.text();
      expect(html.toLowerCase(), `${path} should be HTML`).toContain("<html");
    }
    await ctx.dispose();
  });
});

test.describe("F1: verbatim port — root matches production", () => {
  // Deterministic, offline: the served root must byte-match the production
  // snapshot captured at port time. Guards against any drift from verbatim.
  test("served root HTML byte-matches the committed production snapshot", async ({
    baseURL,
  }) => {
    const snapshot = fs.readFileSync(
      path.join(__dirname, "fixtures", "production-index.snapshot.html"),
      "utf-8"
    );
    const ctx = await request.newContext({ baseURL });
    const served = await (await ctx.get("/")).text();
    await ctx.dispose();
    expect(served).toBe(snapshot);
  });

  // Freshness bonus: compare against live production when reachable; skips
  // gracefully offline / under rate-limiting so CI never flakes on network.
  test("served root HTML is byte-identical to live hornof.org", async ({ baseURL }) => {
    let liveHtml;
    try {
      const live = await request.newContext();
      const resp = await live.get(PRODUCTION, { timeout: 15000 });
      if (!resp.ok()) test.skip(true, `production returned ${resp.status()}`);
      liveHtml = await resp.text();
      await live.dispose();
    } catch (e) {
      test.skip(true, `could not reach production: ${e.message}`);
    }
    const localCtx = await request.newContext({ baseURL });
    const localResp = await localCtx.get("/");
    const localHtml = await localResp.text();
    await localCtx.dispose();
    expect(localHtml).toBe(liveHtml);
  });
});
