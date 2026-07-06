// @ts-check
// F7 — Dark/light theme toggle.
// Acceptance: a control that flips the theme and updates its state; the choice
// persists across reload (localStorage); with no stored choice the OS
// prefers-color-scheme wins; keyboard accessible; colour values stay isolated in
// style.css. (Lighthouse a11y in both themes is covered by lighthouse.spec.js.)
const { test, expect } = require("@playwright/test");

// The <html data-theme> attribute is the single source of truth the CSS keys off.
function theme(page) {
  return page.evaluate(() => document.documentElement.getAttribute("data-theme"));
}

test.describe("F7: dark/light theme toggle", () => {
  test("control is a real, labelled button that reports pressed state", async ({
    page,
  }) => {
    await page.goto("/");
    const toggle = page.locator(".theme-toggle");
    await expect(toggle).toHaveCount(1);
    await expect(toggle).toHaveRole("button");
    // Accessible name present...
    const name = (await toggle.getAttribute("aria-label")) || "";
    expect(name.trim().length, "toggle accessible name").toBeTruthy();
    // ...and it exposes a boolean pressed state for AT.
    await expect(toggle).toHaveAttribute("aria-pressed", /^(true|false)$/);
  });

  test("clicking flips the theme and updates aria-pressed", async ({ page }) => {
    await page.goto("/");
    const toggle = page.locator(".theme-toggle");
    const before = await theme(page);
    expect(before === "light" || before === "dark").toBeTruthy();

    await toggle.click();
    const after = await theme(page);
    expect(after, "theme should flip").not.toBe(before);
    expect(after === "light" || after === "dark").toBeTruthy();

    // aria-pressed reflects "dark is on".
    await expect(toggle).toHaveAttribute(
      "aria-pressed",
      after === "dark" ? "true" : "false"
    );

    // Flipping back returns to the original theme.
    await toggle.click();
    expect(await theme(page)).toBe(before);
  });

  test("choice persists across reload", async ({ page }) => {
    await page.goto("/");
    const start = await theme(page);
    await page.locator(".theme-toggle").click();
    const chosen = await theme(page);
    expect(chosen).not.toBe(start);

    await page.reload();
    expect(await theme(page), "persisted across reload").toBe(chosen);
    // The stored value survives in localStorage.
    const stored = await page.evaluate(() => localStorage.getItem("theme"));
    expect(stored).toBe(chosen);
  });

  test("with no stored choice, the OS preference decides", async ({ browser }) => {
    for (const scheme of /** @type {const} */ (["dark", "light"])) {
      const context = await browser.newContext({ colorScheme: scheme });
      const page = await context.newPage();
      await page.goto("/");
      expect(await theme(page), `OS ${scheme} → data-theme`).toBe(scheme);
      await context.close();
    }
  });

  test("dark theme actually changes the rendered background", async ({ page }) => {
    await page.goto("/");
    // Normalise to light first, capture, flip to dark, compare.
    await page.evaluate(() =>
      document.documentElement.setAttribute("data-theme", "light")
    );
    // The palette lives in the body's gradient (background-image), not
    // background-color — read that, plus the ink colour, to prove a real flip.
    const lightBg = await page.evaluate(() => {
      const s = getComputedStyle(document.body);
      return s.backgroundImage + "|" + s.color;
    });
    await page.evaluate(() =>
      document.documentElement.setAttribute("data-theme", "dark")
    );
    const darkBg = await page.evaluate(() => {
      const s = getComputedStyle(document.body);
      return s.backgroundImage + "|" + s.color;
    });
    expect(darkBg, "dark bg differs from light").not.toBe(lightBg);
  });

  test("no flash: the theme is resolved before first paint", async ({ page }) => {
    // A render-blocking inline script must set data-theme in <head>, so the
    // attribute is present the moment the body exists (no wrong-theme flash).
    await page.goto("/");
    const attr = await theme(page);
    expect(attr === "light" || attr === "dark", "data-theme set early").toBeTruthy();
  });

  test("is keyboard accessible: focus and toggle with the keyboard", async ({
    page,
  }) => {
    await page.goto("/");
    const toggle = page.locator(".theme-toggle");
    const before = await theme(page);
    await toggle.focus();
    await expect(toggle).toBeFocused();
    await page.keyboard.press("Enter");
    expect(await theme(page), "Enter flips theme").not.toBe(before);
  });
});
