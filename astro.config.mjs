import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

const deployTarget = process.env.MCP_DEPLOY_TARGET || "github";
const isGitLab = deployTarget === "gitlab";

const site =
  process.env.MCP_SITE ||
  (isGitLab
    ? "https://mcp.physics.wm.edu"
    : "https://mentoring-for-careers-in-physics.github.io");

const base = process.env.MCP_BASE || (isGitLab ? "/" : "/mcp-site");

export default defineConfig({
  site,
  base,
  output: "static",
  integrations: [sitemap()],
});
