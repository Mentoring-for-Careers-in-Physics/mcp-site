import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://mcp.physics.wm.edu",
  output: "static",
  integrations: [sitemap()],
});
