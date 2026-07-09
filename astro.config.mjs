import { defineConfig } from "astro/config";

// Static output → Cloudflare Pages serves dist/ verbatim (same host as today,
// just a build command instead of raw files). No adapter needed for pure SSG.
// The archives (2013-archive/2025-archive) and the eclipse app live in public/ as passthrough.
//
// build.format: "file" emits generated pages as flat `.html` files
// (projects.astro → dist/projects.html) so the ported routes keep the exact
// `/projects.html`, `/built-with.html`, `/eclipse-built.html` paths the existing
// pages, links, and Playwright suite depend on.
//
// server.port matches the harness (PORT env, default 8788) so `astro preview`
// serves where playwright.config.js + the Lighthouse audit expect it.
const PORT = Number(process.env.PORT) || 8788;

export default defineConfig({
  site: "https://hornof.org",
  output: "static",
  build: { format: "file" },
  server: { port: PORT },
});
