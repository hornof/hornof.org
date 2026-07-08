// @ts-check
// V1 — Land the no-frost look. Guard test (locks the decision so it can't
// silently regress). The 7/8 look decision removed backdrop-filter site-wide:
// panels are plain translucent (--panel at 0.85) so view-transition snapshots
// cross-fade cleanly. This asserts the four shell panes report
// `backdrop-filter: none` (computed) in BOTH themes.
//
// Selector → page map (each pane lives where it renders):
//   .sidebar, .content → /            (home)
//   .projects          → /projects.html
//   .colophon          → /built-with.html
const { test, expect } = require("@playwright/test");

// Force a theme before first paint by seeding localStorage (the BaseLayout
// pre-paint resolver prefers a stored "light"|"dark" over the OS preference).
function withTheme(theme) {
  return async ({ page }, use) => {
    await page.addInitScript((t) => {
      try {
        localStorage.setItem("theme", t);
      } catch (e) {
        /* storage disabled — OS preference will drive instead */
      }
    }, theme);
    await use(page);
  };
}

const CASES = [
  { path: "/", selectors: [".sidebar", ".content"] },
  { path: "/projects.html", selectors: [".projects"] },
  { path: "/built-with.html", selectors: [".colophon"] },
];

for (const theme of ["light", "dark"]) {
  test.describe(`V1: no backdrop-filter on shell panes (${theme} theme)`, () => {
    test.use({ page: withTheme(theme) });

    for (const { path, selectors } of CASES) {
      test(`${path} → ${selectors.join(", ")} report backdrop-filter: none`, async ({
        page,
      }) => {
        await page.goto(path);
        // Confirm the theme actually resolved to the one under test, so the
        // assertion is genuinely exercising that palette.
        await expect
          .poll(() =>
            page.evaluate(() =>
              document.documentElement.getAttribute("data-theme")
            )
          )
          .toBe(theme);

        for (const sel of selectors) {
          const el = page.locator(sel);
          await expect(el, `${sel} present on ${path}`).toHaveCount(1);
          // Computed backdrop-filter must be exactly "none" — the frost is gone.
          await expect(el, `${sel} has no backdrop-filter`).toHaveCSS(
            "backdrop-filter",
            "none"
          );
        }
      });
    }
  });
}
