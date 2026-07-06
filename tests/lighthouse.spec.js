// @ts-check
// F3 — Lighthouse budgets: performance ≥95 and accessibility ≥95 on the root
// page. Runs a real Lighthouse audit (mobile profile) against the dev server.
//
// Lighthouse runs in a CHILD PROCESS on purpose: Playwright registers a `.ts`
// require hook, and Lighthouse's csp_evaluator dependency ships a stray root
// `.ts` source file that the hook would load instead of its compiled `.js`
// (crashing with "Cannot read properties of undefined (reading 'SCRIPT_SRC')").
// A plain Node child process resolves the `.js` normally, exactly as the
// Lighthouse CLI does everywhere else.
const { test, expect, chromium } = require("@playwright/test");
const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const PORT = process.env.PORT || 8788;
const BASE = `http://localhost:${PORT}`;
const THRESHOLDS = { performance: 95, accessibility: 95 };

// Run a real Lighthouse audit (child process — see header) and return the scores.
function audit(pageUrl, tag) {
  const outPath = path.join(os.tmpdir(), `lh-${tag}-${process.pid}.json`);
  const lhBin = require.resolve("lighthouse/cli/index.js");

  const result = spawnSync(
    process.execPath,
    [
      lhBin,
      pageUrl,
      "--only-categories=performance,accessibility",
      "--output=json",
      `--output-path=${outPath}`,
      "--chrome-flags=--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage",
      "--quiet",
    ],
    {
      encoding: "utf-8",
      timeout: 150_000,
      // Point chrome-launcher at the Chromium Playwright already installed,
      // so this works in CI without a separate system Chrome.
      env: { ...process.env, CHROME_PATH: chromium.executablePath() },
    }
  );

  if (result.status !== 0) {
    throw new Error(
      `Lighthouse CLI failed (status ${result.status}):\n${result.stderr || result.stdout}`
    );
  }

  const report = JSON.parse(fs.readFileSync(outPath, "utf-8"));
  fs.rmSync(outPath, { force: true });
  return {
    performance: Math.round(report.categories.performance.score * 100),
    accessibility: Math.round(report.categories.accessibility.score * 100),
  };
}

// F3 gates the root page; F11 extends the same budget to the Projects wall.
const PAGES = [
  { tag: "root", path: "/", label: "root page" },
  { tag: "projects", path: "/projects.html", label: "projects wall" },
];

test.describe("F3/F11: Lighthouse budgets", () => {
  test.setTimeout(180_000);

  for (const p of PAGES) {
    test(`${p.label} scores ≥95 performance and ≥95 accessibility`, () => {
      const scores = audit(BASE + p.path, p.tag);
      console.log(`Lighthouse ${p.label}: ${JSON.stringify(scores)}`);
      expect(scores.performance, `${p.label} performance`).toBeGreaterThanOrEqual(
        THRESHOLDS.performance
      );
      expect(
        scores.accessibility,
        `${p.label} accessibility`
      ).toBeGreaterThanOrEqual(THRESHOLDS.accessibility);
    });
  }
});
