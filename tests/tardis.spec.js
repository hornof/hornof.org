// @ts-check
// F4 — Tardis time-machine.
// Acceptance: a subtle (Easter-egg register, not primary nav) control that links
// the three archives; all archives reachable via it; keyboard accessible.
const { test, expect } = require("@playwright/test");

const ARCHIVES = ["/.2013/", "/.2025/"];
const ALL_PAGES = [
  "/",
  "/projects.html",
  "/built-with.html",
  "/eclipse-built.html",
  "/404.html",
];

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

// V2.1 — the Tardis moved from index into MainLayout: it now renders on every page
// and is transition:persist, and its spin is a WAAPI animation whose phase carries
// across a view-transition swap (same technique as the panorama) so it never jumps.
test.describe("V2.1: the Tardis is site-wide and its spin persists", () => {
  for (const path of ALL_PAGES) {
    test(`${path} carries the persisted Tardis (exactly one)`, async ({ page }) => {
      await page.goto(path);
      const tardis = page.locator(".tardis");
      await expect(tardis).toHaveCount(1);
      // transition:persist compiles to a data-astro-transition-persist name — the
      // mechanism that carries the node (and its running spin) across a swap.
      await expect(tardis).toHaveAttribute("data-astro-transition-persist", /.+/);
      await expect(page.locator(".tardis-toggle")).toHaveCount(1);
    });
  }

  test("the spin phase carries across a navigation (no jump)", async ({ page }) => {
    await page.goto("/");
    const phase = () =>
      page.evaluate(() => {
        const svg = document.querySelector(".tardis-svg");
        const a = svg && svg.getAnimations()[0];
        return a ? Number(a.currentTime) : null;
      });
    // The spin runs under normal motion — let it advance well past zero so a
    // restart (phase reset toward 0) would be unmistakable.
    await expect.poll(phase, "tardis is spinning under normal motion").not.toBeNull();
    await page.waitForTimeout(600);
    const before = await phase();
    expect(before, "spin phase advanced before the nav").toBeGreaterThan(300);

    // A real view-transition swap out to the wall.
    await page.locator('#projects a[href="projects.html"]').click();
    await page.waitForURL(/projects/);
    await expect(page.locator(".project-card").first()).toBeVisible();

    const after = await phase();
    expect(after, "tardis still spinning after the nav").not.toBeNull();
    // Continuity: resumes at (roughly) the phase it held, never resetting toward 0.
    expect(
      after,
      "spin phase carried across the nav (no jump)"
    ).toBeGreaterThan(before - 50);
  });

  test("the control works on a subpage too, not just home", async ({ page }) => {
    await page.goto("/projects.html");
    const toggle = page.locator(".tardis-toggle");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    for (const href of ARCHIVES) {
      await expect(page.locator(`.tardis a[href="${href}"]`)).toBeVisible();
    }
  });
});
