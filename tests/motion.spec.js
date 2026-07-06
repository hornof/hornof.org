// @ts-check
// F6 — prefers-reduced-motion respected site-wide.
// Acceptance: with reduced motion requested, animations/transitions and smooth
// scrolling are disabled.
const { test, expect } = require("@playwright/test");

test.describe("F6: reduced-motion", () => {
  test("disables smooth scroll and transitions under reduced motion", async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");

    // Smooth in-page scrolling is turned off.
    const scrollBehavior = await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior
    );
    expect(scrollBehavior).toBe("auto");

    // The site-wide guard zeroes transition durations (e.g. the social icons).
    const duration = await page
      .locator(".social a img")
      .first()
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(duration).toBe("0s");

    await context.close();
  });

  test("keeps smooth scroll when motion is allowed", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "no-preference" });
    const page = await context.newPage();
    await page.goto("/");
    const scrollBehavior = await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior
    );
    expect(scrollBehavior).toBe("smooth");
    await context.close();
  });
});
