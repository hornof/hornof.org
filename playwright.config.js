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
  webServer: {
    command: "node server.js",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
