# MCP Website

Public website for Mentoring for Careers in Physics at William & Mary.

**GitHub Pages URL:** `https://mentoring-for-careers-in-physics.github.io/mcp-site/`

**William & Mary production URL:** `https://mcp.physics.wm.edu`

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

Build the static site for GitHub Pages:

```bash
npm run build:github
```

Build the static site for WM GitLab Pages:

```bash
npm run build:gitlab
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
npm run check:gitlab
```

`npm run check` validates the GitHub Pages build. `npm run check:gitlab` runs the same validation with the root-domain GitLab build.

## Data and Assets

Canonical JSON lives in `src/data/`. The build scripts mirror it to `public/data/` so the generated site still ships the content pack as static JSON.

Public assets live in `public/assets/`, preserving the previous `/assets/...` URL shape used throughout the data files.

The largest current assets are retained for content parity and should be optimized only after review:

- `public/assets/images/live-site/news/69c5e75df0aa1403f2ef581b-cdsp-article-about-mcp.jpg`
- `public/assets/images/live-site/clearweb/assets/graham-holtshausen-fUnfEz3VLv4-unsplash.jpeg`
- `public/assets/images/live-site/clearweb/assets/CTFV--Janet86782.png`

## Deployment

The same source tree builds two static outputs:

- GitHub Pages uses `MCP_DEPLOY_TARGET=github`, with `site` set to `https://mentoring-for-careers-in-physics.github.io` and `base` set to `/mcp-site`.
- WM GitLab Pages uses `MCP_DEPLOY_TARGET=gitlab`, with `site` set to `https://mcp.physics.wm.edu` and `base` set to `/`.

Internal navigation, asset URLs, canonical URLs, `robots.txt`, and `sitemap.xml` derive from the active build target.

### GitHub Pages

```
https://mentoring-for-careers-in-physics.github.io/mcp-site/
```

GitHub Pages deployment is handled by `.github/workflows/deploy.yml` using the official Astro GitHub Action.

Manual setup still needed in GitHub:

1. Repository Settings → Pages → Source: GitHub Actions.
2. Push the legacy branch and tag listed in [Legacy Preservation](#legacy-preservation).

### WM GitLab Pages

```
https://mcp.physics.wm.edu/
```

GitLab Pages deployment is handled by `.gitlab-ci.yml`. The CI job builds the Astro site with `npm run build:gitlab`, validates root-domain internal links, then publishes the generated `dist/` directory as the GitLab Pages `public/` artifact.

## Content Notes

The rewrite preserves public content meaning while removing browser React development builds and in-browser Babel from production pages. Contact remains static: the contact form uses `mailto:` and opens an email draft rather than claiming a message was submitted to a backend.
