import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://mentoring-for-careers-in-physics.github.io",
  base: "/mcp-site",
  output: "static",
  integrations: [sitemap()],
});
