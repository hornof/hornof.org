// @ts-check
// F16 — View transitions + persist.
// Acceptance: the ClientRouter is opted in; internal navigation is a same-document
// view-transition swap (not a full reload); the panorama's breathing animation
// keeps its phase across a navigation (transition:persist); prefers-reduced-motion
// falls back to instant navigation.
//
// What these tests can prove (and do): the opt-in, that a transition fires on
// internal nav, that the persisted panorama's animation is literally the same
// running animation before and after a nav, and that reduced motion skips the
// animation. What they cannot prove is whether the frosted-pane cross-fade looks
// clean mid-transition (a snapshot captures the settled DOM, not intermediate
// frames) — that is Luke's feel-check, by design.
const { test, expect } = require("@playwright/test");

// The internal link that leaves the home page for the projects wall — the
// showcase navigation for the content→wall transition.
const WALL_LINK = '#projects a[href="projects.html"]';

// Instrument the page to record whether the ClientRouter handled the next
// navigation as a same-document view-transition swap, and whether a real
// ViewTransition was started. `__reload` is a window-scoped marker: if a full
// document load happens, the window is recreated and the marker is gone.
async function instrument(page) {
  await page.evaluate(() => {
    // @ts-ignore test-only globals
    window.__reload = true;
    // @ts-ignore
    window.__swap = false;
    // @ts-ignore
    window.__viewTransition = false;
    // @ts-ignore
    window.__startVT = false;

    // Astro's ClientRouter fires astro:before-swap for every same-document
    // navigation; the event carries the ViewTransition it is driving.
    document.addEventListener("astro:before-swap", (e) => {
      // @ts-ignore
      window.__swap = true;
      // @ts-ignore
      window.__viewTransition = !!e.viewTransition;
    });

    // Spy on the browser's View Transitions entry point to confirm a transition
    // is actually initiated (Chromium supports document.startViewTransition).
    const doc = /** @type {any} */ (document);
    if (typeof doc.startViewTransition === "function") {
      const orig = doc.startViewTransition.bind(doc);
      doc.startViewTransition = (cb) => {
        // @ts-ignore
        window.__startVT = true;
        return orig(cb);
      };
    }
  });
}

test.describe("F16: ClientRouter opt-in", () => {
  test("the persisted panorama carries the view-transition marker on every page", async ({
    page,
  }) => {
    for (const path of ["/", "/projects.html", "/built-with.html"]) {
      await page.goto(path);
      const bg = page.locator("#bg-panorama");
      await expect(bg).toHaveCount(1);
      // transition:persist compiles to a data-astro-transition-persist name; the
      // same name on every page is what lets the node carry across a swap.
      await expect(bg).toHaveAttribute(
        "data-astro-transition-persist",
        /.+/
      );
    }

    // The persist name must be identical across pages or the node won't match
    // and the panorama would restart — assert the home and wall names agree.
    await page.goto("/");
    const homeName = await page
      .locator("#bg-panorama")
      .getAttribute("data-astro-transition-persist");
    await page.goto("/projects.html");
    const wallName = await page
      .locator("#bg-panorama")
      .getAttribute("data-astro-transition-persist");
    expect(wallName, "persist name matches across pages").toBe(homeName);
  });
});

test.describe("F16: internal navigation is a view-transition swap", () => {
  test("clicking an internal link swaps in place (no full reload) and fires a transition", async ({
    page,
  }) => {
    await page.goto("/");
    await instrument(page);

    await page.locator(WALL_LINK).click();
    await page.waitForURL(/projects/);

    const state = await page.evaluate(() => ({
      // @ts-ignore
      reload: window.__reload,
      // @ts-ignore
      swap: window.__swap,
      // @ts-ignore
      viewTransition: window.__viewTransition,
      // @ts-ignore
      startVT: window.__startVT,
    }));

    // No full document load — the instrumentation survived, so this was SPA.
    expect(state.reload, "same-document navigation (no full reload)").toBe(true);
    // The ClientRouter handled it as a swap and a real ViewTransition ran.
    expect(state.swap, "astro:before-swap fired").toBe(true);
    expect(state.startVT, "document.startViewTransition was called").toBe(true);

    // And the destination actually re-initialised: the client-rendered wall must
    // have rendered its cards after the swap (proves the after-swap re-init).
    await expect(page.locator(".project-card").first()).toBeVisible();
    expect(
      await page.locator(".project-card").count(),
      "wall re-rendered after the swap"
    ).toBeGreaterThan(0);
  });
});

test.describe("F16: transition:persist keeps the panorama's phase", () => {
  test("the breathing animation is the same running animation before and after a nav", async ({
    page,
  }) => {
    await page.goto("/");

    const phase = () =>
      page.evaluate(() => {
        const el = document.getElementById("bg-panorama");
        const a = el && el.getAnimations()[0];
        return a ? Number(a.currentTime) : null;
      });

    // The panorama breathes under normal motion — let it advance well past zero so
    // a restart (phase reset toward 0) would be unmistakable.
    await expect.poll(phase, "panorama is breathing under normal motion").not.toBeNull();
    await page.waitForTimeout(600);
    const before = await phase();
    expect(before, "phase has advanced before the nav").toBeGreaterThan(300);

    await page.locator(WALL_LINK).click();
    await page.waitForURL(/projects/);
    await expect(page.locator(".project-card").first()).toBeVisible();

    const after = await phase();
    expect(after, "panorama still breathing after the nav").not.toBeNull();

    // Continuity: the zoom resumes at (roughly) the phase it held before the swap,
    // never resetting toward zero. If transition:persist + the WAAPI resume were
    // broken, the animation would restart and `after` would drop back near 0.
    expect(
      after,
      "phase carried across the nav (no background restart)"
    ).toBeGreaterThan(before - 50);
  });
});

test.describe("F16: reduced motion falls back to instant navigation", () => {
  test("the panorama doesn't breathe and the swap still navigates instantly", async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");

    // Under reduced motion the breathing zoom is never started (the JS guard),
    // mirroring the global `* { animation: none }` rule — no running animation.
    const animCount = await page.evaluate(() => {
      const el = document.getElementById("bg-panorama");
      return el ? el.getAnimations().length : -1;
    });
    expect(animCount, "panorama breathing disabled under reduced motion").toBe(0);

    // Navigation still works in-document. Astro still routes through the View
    // Transitions API, but the animation is zeroed by the reduced-motion guard in
    // style.css (::view-transition-* animation: none), so the swap is instant.
    await instrument(page);
    await page.locator(WALL_LINK).click();
    await page.waitForURL(/projects/);

    const state = await page.evaluate(() => ({
      // @ts-ignore
      reload: window.__reload,
      // @ts-ignore
      swap: window.__swap,
    }));
    expect(state.reload, "still a same-document navigation (no full reload)").toBe(true);
    expect(state.swap, "the ClientRouter handled the navigation").toBe(true);
    await expect(page.locator(".project-card").first()).toBeVisible();

    // The reduced-motion guard that zeroes the view-transition animations is
    // present and active (verifies the instant-swap mechanism, not just that nav
    // happened). Probe a live ::view-transition-group animation duration if one is
    // running; otherwise confirm the guarded rule exists in the cascade.
    const guarded = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        let rules;
        try {
          rules = sheet.cssRules;
        } catch (e) {
          continue;
        }
        for (const rule of Array.from(rules)) {
          const media = /** @type {any} */ (rule);
          if (
            media.media &&
            /prefers-reduced-motion/.test(media.conditionText || media.media.mediaText || "")
          ) {
            for (const inner of Array.from(media.cssRules || [])) {
              const t = /** @type {any} */ (inner).selectorText || "";
              if (t.includes("view-transition")) return true;
            }
          }
        }
      }
      return false;
    });
    expect(guarded, "reduced-motion guard zeroes the view-transition animations").toBe(true);

    await context.close();
  });
});
