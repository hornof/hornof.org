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
const URL = `http://localhost:${PORT}/`;
const THRESHOLDS = { performance: 95, accessibility: 95 };

test.describe("F3: Lighthouse budgets", () => {
  test.setTimeout(180_000);

  test("root page scores ≥95 performance and ≥95 accessibility", () => {
    const outPath = path.join(os.tmpdir(), `lh-root-${process.pid}.json`);
    const lhBin = require.resolve("lighthouse/cli/index.js");

    const result = spawnSync(
      process.execPath,
      [
        lhBin,
        URL,
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

    const scores = {
      performance: Math.round(report.categories.performance.score * 100),
      accessibility: Math.round(report.categories.accessibility.score * 100),
    };
    console.log(`Lighthouse scores: ${JSON.stringify(scores)}`);

    expect(scores.performance, "performance score").toBeGreaterThanOrEqual(
      THRESHOLDS.performance
    );
    expect(scores.accessibility, "accessibility score").toBeGreaterThanOrEqual(
      THRESHOLDS.accessibility
    );
  });
});
