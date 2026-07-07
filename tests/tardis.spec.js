// @ts-check
// F4 — Tardis time-machine.
// Acceptance: a subtle (Easter-egg register, not primary nav) control that links
// the three archives; all archives reachable via it; keyboard accessible.
const { test, expect } = require("@playwright/test");

const ARCHIVES = ["/.2013/", "/.2025/"];

test.describe("F4: Tardis time-machine", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("control has an accessible name and is a real button", async ({ page }) => {
    const toggle = page.locator(".tardis-toggle");
    await expect(toggle).toHaveCount(1);
    await expect(toggle).toHaveRole("button");
    const name =
      (await toggle.getAttribute("aria-label")) ||
      (await toggle.innerText());
    expect(name && name.trim().length, "toggle accessible name").toBeTruthy();
  });

  test("is Easter-egg register: archive links are hidden until invoked", async ({
    page,
  }) => {
    // Not primary nav — the archive links are not visible on load.
    for (const href of ARCHIVES) {
      await expect(page.locator(`.tardis a[href="${href}"]`)).toBeHidden();
    }
    await expect(page.locator(".tardis-toggle")).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  test("invoking the control reveals links to all archives", async ({
    page,
  }) => {
    await page.locator(".tardis-toggle").click();
    await expect(page.locator(".tardis-toggle")).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    for (const href of ARCHIVES) {
      await expect(page.locator(`.tardis a[href="${href}"]`)).toBeVisible();
    }
  });

  test("every archive is reachable via the control (loads 200 + real content)", async ({
    page,
  }) => {
    for (const href of ARCHIVES) {
      await page.goto("/");
      await page.locator(".tardis-toggle").click();
      const link = page.locator(`.tardis a[href="${href}"]`);
      await expect(link).toBeVisible();
      const resp = await Promise.all([
        page.waitForNavigation(),
        link.click(),
      ]).then(([nav]) => nav);
      expect(resp && resp.status(), `${href} status`).toBe(200);
      await expect(page).toHaveTitle(/Luke Hornof/i);
      const body = (await page.locator("body").innerText()).trim();
      expect(body.length, `${href} body`).toBeGreaterThan(0);
    }
  });

  test("is keyboard accessible: focus, Enter to open, Escape to close", async ({
    page,
  }) => {
    const toggle = page.locator(".tardis-toggle");
    // Reachable by keyboard focus and operable with Enter.
    await toggle.focus();
    await expect(toggle).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");

    // Archive links are in the tab order once open.
    await page.keyboard.press("Tab");
    await expect(page.locator(`.tardis a[href="${ARCHIVES[0]}"]`)).toBeFocused();

    // Escape closes and returns focus to the toggle.
    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator(`.tardis a[href="${ARCHIVES[0]}"]`)).toBeHidden();
  });
});
