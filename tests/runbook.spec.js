// @ts-check
// F2 — DNS cutover runbook.
// Acceptance: every step has a verification ("you should now see…"); a rollback
// section is present. The runbook is prose, so this checks its STRUCTURE — that
// the acceptance-shape holds and can't silently regress.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const RUNBOOK = path.join(__dirname, "..", "RUNBOOK-dns.md");

/** Split the doc into `### N. Title` step sections with their body text. */
function parseSteps(md) {
  const lines = md.split("\n");
  const steps = [];
  let current = null;
  for (const line of lines) {
    const stepHeading = line.match(/^###\s+(\d+)\.\s+(.+)/);
    const otherHeading = /^#{1,3}\s+(?!\d+\.)/.test(line); // any non-step heading
    if (stepHeading) {
      current = { num: Number(stepHeading[1]), title: stepHeading[2], body: "" };
      steps.push(current);
    } else if (otherHeading) {
      current = null; // left the step section
    } else if (current) {
      current.body += line + "\n";
    }
  }
  return steps;
}

test.describe("F2: DNS runbook structure", () => {
  const md = fs.readFileSync(RUNBOOK, "utf-8");

  test("has real, sequentially numbered steps", () => {
    const steps = parseSteps(md);
    expect(steps.length, "step count").toBeGreaterThanOrEqual(10);
    steps.forEach((s, i) => {
      expect(s.num, `step ${i + 1} numbering`).toBe(i + 1);
    });
  });

  test("every step carries a verification", () => {
    const steps = parseSteps(md);
    const missing = steps
      .filter((s) => !/\*\*Verify\b/i.test(s.body))
      .map((s) => `#${s.num} ${s.title}`);
    expect(missing, `steps with no Verify:\n${missing.join("\n")}`).toEqual([]);
  });

  test("has a rollback section", () => {
    expect(md).toMatch(/^##\s+Rollback/im);
    // Rollback must itself tell you how to confirm it worked.
    const rollback = md.slice(md.search(/^##\s+Rollback/im));
    expect(rollback, "rollback verification").toMatch(/verify/i);
  });

  test("covers every required topic", () => {
    const required = [
      /cloudflare/i,
      /pages/i,
      /\bTTL\b/,
      /nameserver/i,
      /dotster/i,
      /auto-?renew/i,
      /DNSSEC/i,
      /\.2013|archive/i, // the dot-directory archives
    ];
    for (const re of required) {
      expect(md, `runbook should cover ${re}`).toMatch(re);
    }
  });

  test("does not execute anything — it's a doc, not automation", () => {
    // Guards the ground rule: DNS/registrar steps are Luke's to run.
    expect(md).toMatch(/you run every step/i);
  });
});
