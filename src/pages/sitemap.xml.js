const routes = [
  "/",
  "/mentors/",
  "/industry/",
  "/team/",
  "/news/",
  "/videos/",
  "/contact/",
  "/give/",
];
const site = "https://mcp.physics.wm.edu";

export function GET() {
  const urls = routes
    .map(
      (route) => `
  <url>
    <loc>${site}${route}</loc>
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
