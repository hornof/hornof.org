// @ts-check
// V2 — Persistent sidebar, site-wide.
// Acceptance (eng doc): the sidebar is visually identical and stable across all
// navigations (verified by ELEMENT IDENTITY, not looks — a re-mount would drop a
// runtime stamp); correct active state per route (scroll-spy on home, current-page
// marker elsewhere); a section link from a subpage navigates home and scrolls to
// the section; mobile shows a stacked persistent header (same node), no drawer.
const { test, expect } = require("@playwright/test");

const ALL_PAGES = [
  "/",
  "/projects.html",
  "/built-with.html",
  "/eclipse-built.html",
  "/404.html",
];

// The in-content link from the home Projects section out to the wall — the
// cross-page navigation that fires a real view-transition swap.
const WALL_LINK = '#projects a[href="projects.html"]';

test.describe("V2: the sidebar renders on every route", () => {
  for (const path of ALL_PAGES) {
    test(`${path} carries the persistent sidebar node`, async ({ page }) => {
      await page.goto(path);
      const sidebar = page.locator(".sidebar");
      await expect(sidebar).toHaveCount(1);
      // Marked transition:persist (compiles to a data-astro-transition-persist
      // name) — the mechanism that carries the node across a swap.
      await expect(sidebar).toHaveAttribute("data-astro-transition-persist", /.+/);
      // The name is the home link; the section nav + socials are present.
      await expect(page.locator(".sidebar .name a")).toHaveAttribute("href", "/");
      await expect(page.locator(".sidebar .section-nav a")).toHaveCount(5);
      await expect(page.locator(".sidebar nav.social a")).toHaveCount(7);
      // No per-page back-link survives anywhere.
      await expect(page.locator(".colophon-back")).toHaveCount(0);
    });
  }

  test("the SSR sidebar markup is byte-identical across routes (persist needs it)", async ({
    page,
  }) => {
    // Compare the SERVER-rendered HTML, not the live DOM — the client active-state
    // script legitimately stamps class="active"/aria-current after load, which
    // differs per route. Persist matching keys off the SSR markup, so that is what
    // must be identical.
    async function ssrSidebar(path) {
      const resp = await page.request.get(path);
      const html = await resp.text();
      const m = html.match(/<header class="sidebar"[\s\S]*?<\/header>/);
      expect(m, `sidebar present in SSR of ${path}`).not.toBeNull();
      return m[0];
    }
    const home = await ssrSidebar("/");
    for (const path of ALL_PAGES.slice(1)) {
      expect(await ssrSidebar(path), `sidebar identical on ${path}`).toBe(home);
    }
  });
});

test.describe("V2: persistence by element identity (not looks)", () => {
  test("the same sidebar node survives a home → wall navigation", async ({ page }) => {
    await page.goto("/");
    // Stamp the live node at runtime. SSR never emits this attribute, so if the
    // sidebar re-mounts from the new page's HTML the stamp is gone.
    await page.locator(".sidebar").evaluate((el) => {
      el.dataset.persistProbe = "home-stamp";
    });

    await page.locator(WALL_LINK).click();
    await page.waitForURL(/projects/);
    await expect(page.locator(".project-card").first()).toBeVisible();

    // Same node → the runtime stamp is still on the sidebar after the swap.
    await expect(page.locator(".sidebar")).toHaveAttribute(
      "data-persist-probe",
      "home-stamp"
    );
  });

  test("the same sidebar node survives a wall → home navigation", async ({ page }) => {
    await page.goto("/projects.html");
    await page.locator(".sidebar").evaluate((el) => {
      el.dataset.persistProbe = "wall-stamp";
    });

    // The sidebar name is the home link — navigate back through it.
    await page.locator(".sidebar .name a").click();
    await page.waitForURL(/\/$|index/);
    await expect(page.locator(".content")).toBeVisible();

    await expect(page.locator(".sidebar")).toHaveAttribute(
      "data-persist-probe",
      "wall-stamp"
    );
  });
});

test.describe("V2: active state per route", () => {
  test("home: scroll-spy marks the first section on load", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('.section-nav a[href="/#about"]')).toHaveAttribute(
      "aria-current",
      "true"
    );
    await expect(page.locator('.section-nav a[aria-current="true"]')).toHaveCount(1);
  });

  for (const path of ["/projects.html", "/built-with.html", "/eclipse-built.html"]) {
    test(`${path}: the Projects nav link is marked current`, async ({ page }) => {
      await page.goto(path);
      await expect(
        page.locator('.section-nav a[href="/#projects"]')
      ).toHaveAttribute("aria-current", "true");
      // Exactly one link marked (the current-page marker, not scroll-spy).
      await expect(page.locator('.section-nav a[aria-current="true"]')).toHaveCount(1);
    });
  }

  test("404: no nav link is marked current", async ({ page }) => {
    await page.goto("/404.html");
    // Give astro:page-load a beat to run its (no-op) active-state pass.
    await expect(page.locator(".sidebar")).toBeVisible();
    await expect(page.locator('.section-nav a[aria-current="true"]')).toHaveCount(0);
  });
});

test.describe("V2: a section link from a subpage navigates home and scrolls", () => {
  test("clicking Talks on the wall lands on home with #talks in view", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/projects.html");

    await page.locator('.section-nav a[href="/#talks"]').click();
    await page.waitForURL(/#talks$/);
    // Landed on home (the content column exists) and the section is in view.
    await expect(page.locator(".content")).toBeVisible();
    await expect(page.locator("#talks")).toBeInViewport();
  });
});

test.describe("V2: mobile is a stacked persistent header (no drawer)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("the sidebar stacks above the content on a subpage", async ({ page }) => {
    await page.goto("/projects.html");
    const sb = await page.locator(".sidebar").boundingBox();
    const main = await page.locator(".projects").boundingBox();
    expect(sb && main).toBeTruthy();
    // Stacked: the wall content begins at/after the sidebar's bottom.
    expect(main.y).toBeGreaterThanOrEqual(sb.y + sb.height - 2);
    // Full-width header, not an off-canvas drawer.
    expect(sb.width).toBeGreaterThan(375 * 0.8);
    // No drawer toggle button was introduced.
    await expect(page.locator("[aria-controls~='sidebar'], .nav-drawer-toggle")).toHaveCount(0);
  });

  test("the stacked header persists across a navigation at the mobile breakpoint", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator(".sidebar").evaluate((el) => {
      el.dataset.persistProbe = "mobile-stamp";
    });
    await page.locator(WALL_LINK).click();
    await page.waitForURL(/projects/);
    await expect(page.locator(".project-card").first()).toBeVisible();
    await expect(page.locator(".sidebar")).toHaveAttribute(
      "data-persist-probe",
      "mobile-stamp"
    );
    // Still a full-width stacked header after the nav.
    const sb = await page.locator(".sidebar").boundingBox();
    expect(sb.width).toBeGreaterThan(375 * 0.8);
  });
});
