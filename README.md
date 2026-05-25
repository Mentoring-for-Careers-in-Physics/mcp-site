# MCP Website

Public website for Mentoring for Careers in Physics at William & Mary.

**Current live URL (temporary):** `https://mentoring-for-careers-in-physics.github.io/mcp-site/`

**Future production domain (pending W&M IT DNS):** `https://mcp.physics.wm.edu`

This repository now builds a fully static Astro site. The deployed output is HTML, CSS, JavaScript, JSON, images, and static assets only. There is no backend, database, authentication, server runtime, Docker setup, or container requirement.

## Legacy Preservation

The pre-Astro static site is preserved with:

- Branch: `legacy_static_site`
- Tag: `pre_astro_static_site`

Both were created locally before the rewrite at commit `31080c654d3056a4f78f8a9e0ca1479a2a79acba`.

Push the preservation refs when ready:

```bash
git push origin legacy_static_site
git push origin pre_astro_static_site
```

More detail is in `docs/migration.md`.

## Public Pages

- `/`
  Homepage
- `/mentors/`
  Mentor directory
- `/industry/`
  Partner organization and industry page
- `/team/`
  Leadership and advisor page
- `/news/`
  News and announcements
- `/videos/`
  Video archive
- `/contact/`
  Contact and engagement page
- `/give/`
  Giving and support page
- `/404.html`
  Static not-found page

## Project Structure

```text
mcp-site/
  astro.config.mjs
  package.json
  src/
    layouts/
      BaseLayout.astro
    components/
      Nav.astro
      Footer.astro
      Hero.astro
      MentorCard.astro
      NewsCard.astro
      VideoCard.astro
      CompanyCard.astro
    pages/
      index.astro
      mentors.astro
      industry.astro
      team.astro
      news.astro
      videos.astro
      contact.astro
      give.astro
      404.astro
    data/
      site.json
      mentors.json
      team.json
      retired-team.json
      companies.json
      news.json
      videos.json
      events.json
      routes.json
      link-inventory.json
  public/
    assets/
    data/
    CNAME
    robots.txt
    .nojekyll
  scripts/
    import-live-site-content.mjs
    sync-public-data.mjs
    validate-data.mjs
    check-links.mjs
  docs/
    migration.md
```

## Local Development

Install dependencies:

```bash
npm install
```

Run the local dev server:

```bash
npm run dev
```

Build the static site:

```bash
npm run build
```

Preview the built site:

```bash
npm run preview
```

## Quality Checks

```bash
npm run format
npm run format:check
npm run lint
npm run validate:data
npm run check:links
npm run check
```

`npm run check` validates data, lints JavaScript support files, runs `astro check`, builds `dist/`, and checks required built pages plus internal links.

## Data and Assets

Canonical JSON lives in `src/data/`. The build scripts mirror it to `public/data/` so the generated site still ships the content pack as static JSON.

Public assets live in `public/assets/`, preserving the previous `/assets/...` URL shape used throughout the data files.

The largest current assets are retained for content parity and should be optimized only after review:

- `public/assets/images/live-site/news/69c5e75df0aa1403f2ef581b-cdsp-article-about-mcp.jpg`
- `public/assets/images/live-site/clearweb/assets/graham-holtshausen-fUnfEz3VLv4-unsplash.jpeg`
- `public/assets/images/live-site/clearweb/assets/CTFV--Janet86782.png`

## Deployment

GitHub Pages deployment is handled by `.github/workflows/deploy.yml` using the official Astro GitHub Action.

### Current deployment (GitHub Pages project URL)

```
https://mentoring-for-careers-in-physics.github.io/mcp-site/
```

Current `astro.config.mjs` settings:

```js
site: "https://mentoring-for-careers-in-physics.github.io",
base: "/mcp-site",
```

- No `public/CNAME` file — leave it absent while the custom domain is not yet active.
- `scripts/check-links.mjs` uses `BASE_PATH = "/mcp-site"` to validate built links correctly.
- `public/robots.txt` points the sitemap at the GitHub Pages URL.

Manual setup still needed in GitHub:

1. Repository Settings → Pages → Source: GitHub Actions.
2. Push the legacy branch and tag listed in [Legacy Preservation](#legacy-preservation).

### Migrating to the custom domain (mcp.physics.wm.edu)

When W&M IT DNS for `mcp.physics.wm.edu` is confirmed live, make these four changes together:

1. **`astro.config.mjs`** — remove `base` and update `site`:
   ```js
   site: "https://mcp.physics.wm.edu",
   // base line removed
   ```
2. **`public/CNAME`** — create with content:
   ```
   mcp.physics.wm.edu
   ```
3. **`public/robots.txt`** — update the `Sitemap:` line:
   ```
   Sitemap: https://mcp.physics.wm.edu/sitemap.xml
   ```
4. **`scripts/check-links.mjs`** — set `BASE_PATH = ""`.

The rest of the codebase (all internal hrefs, canonical URLs, OG image URLs, sitemap.xml.js) derives paths from `import.meta.env.BASE_URL` and `import.meta.env.SITE`, so those four changes are all that is needed.

## Content Notes

The rewrite preserves public content meaning while removing browser React development builds and in-browser Babel from production pages. Contact remains static: the contact form uses `mailto:` and opens an email draft rather than claiming a message was submitted to a backend.
