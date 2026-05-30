const routes = [
  "/",
  "/about/",
  "/mentors/",
  "/industry/",
  "/team/",
  "/news/",
  "/videos/",
  "/contact/",
  "/give/",
];

// Build the canonical site root from Astro config values so this file stays
// correct after the custom domain migration (just update astro.config.mjs).
const siteOrigin = (import.meta.env.SITE || "").replace(/\/$/, "");
const basePath = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
const siteRoot = siteOrigin + basePath;

export function GET() {
  const urls = routes
    .map(
      (route) => `
  <url>
    <loc>${siteRoot}${route}</loc>
  </url>`,
    )
    .join("");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>
`,
    {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
      },
    },
  );
}
