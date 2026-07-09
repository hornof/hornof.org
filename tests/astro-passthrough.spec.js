// @ts-check
// F14 (PR 0) — the archives (.2013/.2025) and the eclipse app survive the Astro
// build as static passthrough. Asserts the build output in dist/ after
// `astro build`, which settles the dot-dir-in-public/ unknown durably: Vite/Astro
// copies dot-prefixed dirs from public/ to dist/ verbatim. Run order: build first
// (`npm run build`), then this test. dist/ is gitignored, so CI builds before testing.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const DIST = path.join(__dirname, "..", "dist");
const TARGETS = [
  "2013-archive/index.html",
  "2025-archive/index.html",
  "projects/eclipse/index.html",
  "projects/eclipse/PROVENANCE.txt",
];

test.describe("F14: archives + eclipse pass through the Astro build", () => {
  test.beforeAll(() => {
    if (!fs.existsSync(DIST)) {
      throw new Error("dist/ missing — run `npm run build` before this test");
    }
  });

  for (const rel of TARGETS) {
    test(`${rel} lands in dist/ with real content`, () => {
      const p = path.join(DIST, rel);
      expect(fs.existsSync(p), `${rel} exists in dist/`).toBe(true);
      expect(
        fs.readFileSync(p, "utf8").trim().length,
        `${rel} is non-empty`
      ).toBeGreaterThan(0);
    });
  }

  test("the 2013 archive keeps its real markup", () => {
    const html = fs.readFileSync(path.join(DIST, "2013-archive/index.html"), "utf8");
    expect(html).toMatch(/Luke Hornof/i);
  });
});
