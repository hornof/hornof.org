// @ts-check
// F9 — France/Brittany Easter egg.
// Acceptance: a subtle flourish in the same register as the Tardis (not primary
// nav); hidden until invoked; click OR keyboard reveals it; Escape/dismiss works;
// keyboard operable.
const { test, expect } = require("@playwright/test");

test.describe("F9: Breton Easter egg", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("control is a real, accessibly-named button — not primary nav", async ({
    page,
  }) => {
    const toggle = page.locator(".breton-toggle");
    await expect(toggle).toHaveCount(1);
    await expect(toggle).toHaveRole("button");
    const name = (await toggle.getAttribute("aria-label")) || "";
    expect(name.trim().length, "toggle accessible name").toBeTruthy();
    // Not in the primary section nav.
    await expect(page.locator(".section-nav .breton-toggle")).toHaveCount(0);
  });

  test("Easter-egg register: the payload is hidden until invoked", async ({
    page,
  }) => {
    await expect(page.locator("#breton-panel")).toBeHidden();
    await expect(page.locator(".breton-toggle")).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  test("clicking reveals the Brittany nod", async ({ page }) => {
    await page.locator(".breton-toggle").click();
    await expect(page.locator(".breton-toggle")).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    await expect(page.locator("#breton-panel")).toBeVisible();
    // Carries a real Brittany/France reference, not an empty box.
    const text = (await page.locator("#breton-panel").innerText()).trim();
    expect(text.length, "panel has copy").toBeGreaterThan(0);
    expect(text).toMatch(/breizh|bretagne|brittany|breton/i);
    // And the flag of Brittany, exposed to AT with a name.
    await expect(page.locator("#breton-panel [role='img']")).toHaveCount(1);
  });

  test("keyboard: focusable, Enter opens, Escape closes and returns focus", async ({
    page,
  }) => {
    const toggle = page.locator(".breton-toggle");
    await toggle.focus();
    await expect(toggle).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#breton-panel")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#breton-panel")).toBeHidden();
    await expect(toggle).toBeFocused();
  });

  test("clicking outside dismisses it", async ({ page }) => {
    await page.locator(".breton-toggle").click();
    await expect(page.locator("#breton-panel")).toBeVisible();
    // Click far away from the control.
    await page.mouse.click(5, 5);
    await expect(page.locator("#breton-panel")).toBeHidden();
  });
});
