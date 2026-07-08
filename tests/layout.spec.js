// @ts-check
// F5 — Sidebar layout + scroll-spy.
// Acceptance: fixed left sidebar + content right; scroll-spy nav tracks the
// section in view; keyboard navigable; single column on mobile.
const { test, expect } = require("@playwright/test");

const SECTIONS = ["about", "experience", "publications", "talks", "projects"];

test.describe("F5: sidebar layout", () => {
  test("desktop: sidebar sits left of the content and stays put on scroll", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    const sidebar = page.locator(".sidebar");
    const content = page.locator(".content");
    const sb = await sidebar.boundingBox();
    const ct = await content.boundingBox();
    expect(sb && ct).toBeTruthy();
    // Content is to the right of the sidebar (side-by-side, not stacked).
    expect(ct.x).toBeGreaterThanOrEqual(sb.x + sb.width - 2);
    // They overlap vertically (same row).
    expect(sb.y).toBeLessThan(ct.y + ct.height);

    // Sidebar is fixed/sticky: after scrolling the content it stays near the top.
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForTimeout(100);
    const sbAfter = await sidebar.boundingBox();
    expect(Math.abs(sbAfter.y)).toBeLessThan(80);
  });

  test("mobile: layout collapses to a single stacked column", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    const sb = await page.locator(".sidebar").boundingBox();
    const ct = await page.locator(".content").boundingBox();
    expect(sb && ct).toBeTruthy();
    // Stacked: content begins at/after the sidebar's bottom.
    expect(ct.y).toBeGreaterThanOrEqual(sb.y + sb.height - 2);
    // Sidebar spans (nearly) the full width.
    expect(sb.width).toBeGreaterThan(375 * 0.8);
  });
});

test.describe("F5: scroll-spy nav", () => {
  test("nav exposes a link per section", async ({ page }) => {
    await page.goto("/");
    for (const id of SECTIONS) {
      await expect(page.locator(`.section-nav a[href="#${id}"]`)).toHaveCount(1);
    }
  });

  test("first section is active on load", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(`.section-nav a[href="#${SECTIONS[0]}"]`)).toHaveAttribute(
      "aria-current",
      "true"
    );
  });

  test("scrolling a section into view lights up exactly its nav link", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    for (const id of ["talks", "publications", "projects"]) {
      // Drive by real scrolling — active state must come from scroll position,
      // not from any click handler.
      await page.evaluate((sid) => {
        document.getElementById(sid).scrollIntoView({ block: "start" });
      }, id);

      const activeLink = page.locator(`.section-nav a[href="#${id}"]`);
      await expect(activeLink).toHaveAttribute("aria-current", "true");
      // Exactly one nav link is active at a time.
      await expect(page.locator('.section-nav a[aria-current="true"]')).toHaveCount(1);
    }
  });

  test("keyboard: nav links are focusable and activate to their section", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    const talks = page.locator('.section-nav a[href="#talks"]');
    await talks.focus();
    await expect(talks).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/#talks$/);
    // The target section is scrolled into the viewport and its link lights up.
    await expect(page.locator("#talks")).toBeInViewport();
    await expect(talks).toHaveAttribute("aria-current", "true");
  });
});
