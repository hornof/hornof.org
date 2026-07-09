// @ts-check
// F3 — Minimal core rebuild.
// Acceptance: clean one-pager (name · "AI Engineering Leader" tagline · one
// positioning line · social row); current earth-tone palette; renders at 375px
// and 1440px; no placeholder text. (Lighthouse ≥95 perf+a11y: lighthouse.spec.js.)
const { test, expect } = require("@playwright/test");

// The five social profiles the minimal core must expose (ROADMAP F3).
// The full set from the original hornof.org (Facebook + Instagram were dropped
// in the F3 minimal pass and restored in polish round 1).
const SOCIAL = [
  { label: "LinkedIn", href: "linkedin.com/in/lukehornof" },
  { label: "Google Scholar", href: "scholar.google.com" },
  { label: "X", href: "x.com/hornof" },
  { label: "GitHub", href: "github.com/hornof" },
  { label: "Facebook", href: "facebook.com/lukehornof" },
  { label: "Instagram", href: "instagram.com/lukehornof" },
  { label: "SoundCloud", href: "soundcloud.com/luke-hornof" },
];

test.describe("F3: minimal core content", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("has the right title and single H1 name", async ({ page }) => {
    await expect(page).toHaveTitle(/Luke Hornof/i);
    const h1 = page.locator("h1");
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText(/Luke Hornof/i);
  });

  test("shows the tagline and the hero fragment lines", async ({ page }) => {
    await expect(page.locator(".tagline")).toHaveText(/AI Engineering Leader/i);
    const lines = page.locator(".positioning");
    await expect(lines).toHaveCount(1);
    await expect(lines.first()).toContainText(/Hands-on founder, researcher, agentic engineer/i);
  });

  test("social row exposes exactly the named profiles", async ({ page }) => {
    const links = page.locator("nav.social a");
    await expect(links).toHaveCount(SOCIAL.length);
    for (const { label, href } of SOCIAL) {
      const link = page.locator(`nav.social a[href*="${href}"]`);
      await expect(link, `${label} link present`).toHaveCount(1);
      // Every link must have a discernible accessible name (a11y).
      const name = (await link.getAttribute("aria-label")) ||
        (await link.locator("img").getAttribute("alt"));
      expect(name && name.trim().length, `${label} accessible name`).toBeTruthy();
    }
  });

  test("uses the earth-tone brown palette", async ({ page }) => {
    // The dark-brown ink (#5a3825 = rgb(90,56,37)) is the palette's signature.
    const color = await page
      .locator("h1")
      .evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(90, 56, 37)");
  });

  test("has no placeholder text anywhere", async ({ page }) => {
    const body = (await page.locator("body").innerText()).toLowerCase();
    for (const bad of ["lorem ipsum", "placeholder", "todo", "tk tk", "coming soon"]) {
      expect(body, `should not contain "${bad}"`).not.toContain(bad);
    }
  });
});

test.describe("F3: responsive rendering", () => {
  for (const { name, width, height } of [
    { name: "mobile", width: 375, height: 812 },
    { name: "desktop", width: 1440, height: 900 },
  ]) {
    test(`renders at ${width}px (${name}) with no horizontal overflow`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/");

      // Core content is visible at this width.
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator(".positioning").first()).toBeVisible();
      await expect(page.locator("nav.social a").first()).toBeVisible();

      // No horizontal scrollbar — content fits the viewport.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(1);
    });
  }
});
