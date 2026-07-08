// @ts-check
// V3 — Projects run inside the site (eclipse embedded).
// Acceptance (eng doc): "Run it" opens a modal <dialog> lightbox with an iframe
// of the self-contained sim; Esc / the close button dismiss it and focus returns
// to the trigger; an "Open full screen ↗" link is present and correct; on mobile
// (below the wall breakpoint) "Run it" resolves to the full-screen link, not the
// pane; no Lighthouse regression on the wall (the iframe carries no src until the
// lightbox opens — covered by lighthouse.spec.js on the wall page).
const { test, expect } = require("@playwright/test");

const RUN = "[data-eclipse-run]";
const DIALOG = ".eclipse-lightbox";
const FRAME = ".eclipse-lightbox-frame";
const SIM_SRC = "/projects/eclipse/";

test.describe("V3: eclipse lightbox on desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the wall carries exactly one Run-it trigger and a closed lightbox", async ({
    page,
  }) => {
    await page.goto("/projects.html");
    await expect(page.locator(RUN)).toHaveCount(1);
    await expect(page.locator(RUN)).toHaveAttribute("aria-haspopup", "dialog");
    const dialog = page.locator(DIALOG);
    await expect(dialog).toHaveCount(1);
    // Closed <dialog> is not open and not rendered.
    await expect(dialog).not.toBeVisible();
    // The iframe carries no src on load — the sim never loads with the wall.
    const src = await page.locator(FRAME).getAttribute("src");
    expect(src === null || src === "", "iframe has no src until opened").toBeTruthy();
  });

  test('"Run it" opens the lightbox with the sim iframe', async ({ page }) => {
    await page.goto("/projects.html");
    await page.locator(RUN).click();

    const dialog = page.locator(DIALOG);
    await expect(dialog).toBeVisible();
    // Native modal is open.
    expect(await dialog.evaluate((d) => d.open)).toBe(true);
    // The iframe now points at the self-contained sim.
    await expect(page.locator(FRAME)).toHaveAttribute("src", SIM_SRC);
  });

  test("the close button dismisses the lightbox and returns focus to the trigger", async ({
    page,
  }) => {
    await page.goto("/projects.html");
    await page.locator(RUN).click();
    await expect(page.locator(DIALOG)).toBeVisible();

    await page.locator(".eclipse-lightbox-close").click();
    await expect(page.locator(DIALOG)).not.toBeVisible();
    // Focus returns to the Run-it trigger (dialog accessibility contract).
    await expect(page.locator(RUN)).toBeFocused();
    // The sim is stopped (src dropped) so it isn't running in the background.
    const src = await page.locator(FRAME).getAttribute("src");
    expect(src === null || src === "", "iframe src cleared on close").toBeTruthy();
  });

  test("Escape dismisses the lightbox", async ({ page }) => {
    await page.goto("/projects.html");
    await page.locator(RUN).click();
    await expect(page.locator(DIALOG)).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.locator(DIALOG)).not.toBeVisible();
    await expect(page.locator(RUN)).toBeFocused();
  });

  test('an "Open full screen ↗" link is present and points at the sim', async ({
    page,
  }) => {
    await page.goto("/projects.html");
    const full = page.locator(".eclipse-lightbox-fullscreen");
    await expect(full).toHaveCount(1);
    await expect(full).toHaveAttribute("href", "projects/eclipse/");
    // It's a real, live route (the passthrough opt-out is present so it fully loads).
    await expect(full).toHaveAttribute("data-astro-reload", "");
    const resp = await page.request.get(SIM_SRC);
    expect(resp.status(), "full-screen sim route resolves").toBeLessThan(400);
  });
});

test.describe("V3: mobile falls back to the full-screen link", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('"Run it" navigates to the full-screen sim instead of opening the pane', async ({
    page,
  }) => {
    await page.goto("/projects.html");
    // The lightbox is not opened on mobile — the click resolves to a full-screen
    // navigation to the sim (the honest fallback for a phone-sized pane).
    await page.locator(RUN).click();
    await page.waitForURL(/projects\/eclipse\//);
    expect(page.url()).toMatch(/projects\/eclipse\//);
  });
});
