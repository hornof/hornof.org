// @ts-check
const { defineConfig, devices } = require("@playwright/test");

const PORT = process.env.PORT || 8788;
const baseURL = `http://localhost:${PORT}`;

module.exports = defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  // Build the Astro site, then serve dist/ with `astro preview` on PORT (8788).
  // The build must run before the suite so both the HTTP tests and the
  // dist/-reading tests (astro-passthrough, the projects sync check) see fresh
  // output. `astro preview` reads server.port from astro.config.mjs.
  webServer: {
    command: "npm run build && npm run preview",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
