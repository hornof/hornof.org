// @ts-check
// F10 — SoundCloud now-playing embed.
// Acceptance: embed present, pointing at Luke's SoundCloud; deferred so it does
// not block first paint (click-to-load façade — zero external requests until the
// user asks for it); Lighthouse perf ≥95 + a11y ≥95 still hold (gated by
// lighthouse.spec.js on the root page). This spec proves presence + the deferral.
const { test, expect } = require("@playwright/test");

const SC = "soundcloud.com/luke-hornof";

test.describe("F10: SoundCloud embed", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("a play control is present and points at Luke's SoundCloud", async ({
    page,
  }) => {
    const facade = page.locator(".soundcloud");
    await expect(facade).toHaveCount(1);
    // The account is declared on the façade (data attr or a link).
    const scRef = await facade.evaluate((el, sc) => {
      const attr = el.getAttribute("data-sc-url") || "";
      const link = el.querySelector("a")?.getAttribute("href") || "";
      return (attr + " " + link).includes(sc);
    }, SC);
    expect(scRef, "façade references luke-hornof").toBeTruthy();

    const btn = page.locator(".sc-play");
    await expect(btn).toHaveRole("button");
    const name = (await btn.getAttribute("aria-label")) || (await btn.innerText());
    expect(name && name.trim().length, "play control accessible name").toBeTruthy();
  });

  test("no iframe / no external request until invoked (protects the budget)", async ({
    page,
  }) => {
    // Nothing embedded on load.
    await expect(page.locator(".soundcloud iframe")).toHaveCount(0);

    // And nothing reached out to SoundCloud during initial load.
    const scRequests = [];
    page.on("request", (req) => {
      if (/soundcloud\.com/.test(req.url())) scRequests.push(req.url());
    });
    await page.reload({ waitUntil: "networkidle" });
    expect(scRequests, "no SoundCloud requests before click").toHaveLength(0);
  });

  test("clicking injects a lazy SoundCloud player iframe", async ({ page }) => {
    await page.locator(".sc-play").click();
    const frame = page.locator(".soundcloud iframe");
    await expect(frame).toHaveCount(1);

    const src = await frame.getAttribute("src");
    expect(src, "iframe src").toBeTruthy();
    expect(src, "uses the SoundCloud player").toContain("w.soundcloud.com/player");
    expect(decodeURIComponent(src || ""), "targets luke-hornof").toContain(SC);

    // Deferred loading + an accessible title on the frame.
    await expect(frame).toHaveAttribute("loading", "lazy");
    const title = await frame.getAttribute("title");
    expect(title && title.trim().length, "iframe title").toBeTruthy();
  });

  test("play control is keyboard operable", async ({ page }) => {
    const btn = page.locator(".sc-play");
    await btn.focus();
    await expect(btn).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator(".soundcloud iframe")).toHaveCount(1);
  });
});
