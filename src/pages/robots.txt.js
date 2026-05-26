const siteOrigin = (import.meta.env.SITE || "").replace(/\/$/, "");
const basePath = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
const siteRoot = `${siteOrigin}${basePath}`;

export function GET() {
  return new Response(
    `User-agent: *
Allow: /

Sitemap: ${siteRoot}/sitemap.xml
`,
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
}
