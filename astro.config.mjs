import { defineConfig } from "astro/config";

// Static output → Cloudflare Pages serves dist/ verbatim (same host as today,
// just a build command instead of raw files). No adapter needed for pure SSG.
// The archives (.2013/.2025) and the eclipse app live in public/ as passthrough.
export default defineConfig({
  site: "https://hornof.org",
  output: "static",
  build: { format: "directory" },
});
