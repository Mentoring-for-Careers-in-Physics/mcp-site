import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(
  fileURLToPath(new URL("../package.json", import.meta.url)),
);
const distDir = join(root, "dist");

// Must match astro.config.mjs `base`. When migrating to the custom domain
// (no base path), set this to "" and remove it from astro.config.mjs too.
const BASE_PATH = "/mcp-site";

const requiredPages = [
  "index.html",
  "mentors/index.html",
  "industry/index.html",
  "team/index.html",
  "news/index.html",
  "videos/index.html",
  "contact/index.html",
  "give/index.html",
  "404.html",
];

function walk(dir, extension, files = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      walk(path, extension, files);
    } else if (extname(path) === extension) {
      files.push(path);
    }
  }
  return files;
}

function stripHashAndQuery(value) {
  return value.split("#")[0].split("?")[0];
}

function pathExistsForUrl(urlPath) {
  const clean = decodeURI(stripHashAndQuery(urlPath));
  if (!clean || clean === "/") {
    return existsSync(join(distDir, "index.html"));
  }

  // Strip the base prefix so the path maps to the actual dist/ layout.
  // A link without the base prefix is an absolute URL that won't resolve on
  // the GitHub Pages deployment, so treat it as broken.
  let distPath = clean;
  if (BASE_PATH) {
    if (distPath === BASE_PATH || distPath.startsWith(BASE_PATH + "/")) {
      distPath = distPath.slice(BASE_PATH.length) || "/";
    } else if (distPath.startsWith("/")) {
      return false;
    }
  }

  if (!distPath || distPath === "/") {
    return existsSync(join(distDir, "index.html"));
  }

  const withoutSlash = distPath.replace(/^\/+/, "");
  const direct = join(distDir, withoutSlash);
  const asHtml = join(distDir, `${withoutSlash}.html`);
  const asIndex = join(distDir, withoutSlash, "index.html");

  return existsSync(direct) || existsSync(asHtml) || existsSync(asIndex);
}

function resolveRelative(baseFile, value) {
  const relativeFrom = dirname(`/${relative(distDir, baseFile)}`);
  // Resolve against the base-aware URL so relative paths from dist files
  // produce the same absolute paths that Astro generates with BASE_PATH.
  return new URL(value, `https://site.local${BASE_PATH}${relativeFrom}/`)
    .pathname;
}

if (!existsSync(distDir)) {
  throw new Error(
    "dist/ does not exist. Run npm run build before npm run check:links.",
  );
}

for (const page of requiredPages) {
  const path = join(distDir, page);
  if (!existsSync(path)) {
    throw new Error(`Required built page missing: ${page}`);
  }
}

const htmlFiles = walk(distDir, ".html");
const problems = [];
const pattern = /\b(?:href|src)=["']([^"']+)["']/gi;

for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  for (const match of html.matchAll(pattern)) {
    const value = match[1].trim();
    if (
      !value ||
      value.startsWith("#") ||
      /^(https?:)?\/\//i.test(value) ||
      /^(mailto:|tel:|data:|javascript:)/i.test(value)
    ) {
      continue;
    }

    const urlPath = value.startsWith("/")
      ? value
      : resolveRelative(file, value);
    if (!pathExistsForUrl(urlPath)) {
      problems.push(`${relative(distDir, file)} -> ${value}`);
    }
  }
}

if (problems.length) {
  throw new Error(`Broken internal links found:\n${problems.join("\n")}`);
}

console.log(`Checked ${htmlFiles.length} HTML files. Internal links passed.`);
