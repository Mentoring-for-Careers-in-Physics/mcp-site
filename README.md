# MCP Website

Public website for `Mentoring for Careers in Physics` at William & Mary.

This repo contains the new static MCP site built with plain HTML, CSS, and JavaScript. It replaces the old live site with a simpler structure that is easier to host on GitHub Pages, easier to edit, and easier to preserve.

## What is in this repo

- A simplified public homepage that foregrounds mentor photos and organization logos
- A searchable mentor directory
- Leadership and supporters pages
- A public news archive
- Contact and giving pathways
- Imported assets and content recovered from the live MCP website and backup files

## Homepage notes

The homepage is intentionally shorter and more visual than the earlier draft.

- Mentor headshots appear directly in the hero area
- Organization logos appear both near the top of the page and in the partner grid
- The page keeps the main calls to action, but removes much of the long-form marketing copy
- Content still comes from the JSON files in `data/`, so homepage cards and counts stay data-driven

## Site structure

```text
mcp-site/
  index.html
  404.html
  css/
    styles.css
  js/
    main.js
  pages/
    mentors.html
    team.html
    news.html
    contact.html
  data/
    site.json
    mentors.json
    team.json
    retired-team.json
    companies.json
    news.json
    events.json
    routes.json
    link-inventory.json
  assets/
    images/live-site/
    icons/live-site/
  scripts/
    import-live-site-content.mjs
  .nojekyll
```

## Content model

The site is driven by JSON files in `data/`.

- `data/site.json`
  General site settings, social links, public action links, and event metadata
- `data/mentors.json`
  Mentor names, roles, bios, LinkedIn links, and images
- `data/team.json`
  Current MCP leadership/team members
- `data/retired-team.json`
  Previous MCP team members
- `data/companies.json`
  Mentor company logos and links
- `data/news.json`
  Public news archive with article bodies and images
- `data/events.json`
  Recovered event materials

This keeps the public site fully static while still making the content easy to update.

## Asset provenance

Not every local asset was downloaded directly from `https://mcp.physics.wm.edu`.

- Mentor headshots and most company logos in `assets/images/live-site/clearweb/` are copied from the recovered `MCP-Website-BACKUP` source tree
- News images in `assets/images/live-site/news/` are downloaded from the live MCP site APIs
- Site icons in `assets/icons/live-site/` are downloaded from the live site

The import script combines both sources so the static site can run without depending on the old React app.

## Local preview

Because the pages load local JSON, preview the site from a local web server instead of opening files directly.

```bash
cd mcp-site
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Reimporting live content

The import script pulls content from the live MCP site and recovered backup assets, then rewrites the JSON content pack used by the static site.

```bash
node scripts/import-live-site-content.mjs
```

That refreshes:

- `data/site.json`
- `data/mentors.json`
- `data/team.json`
- `data/retired-team.json`
- `data/companies.json`
- `data/news.json`
- `data/events.json`
- `data/routes.json`
- `data/link-inventory.json`
- `assets/images/live-site/`
- `assets/icons/live-site/`

It also keeps local image paths aligned with the static site layout so the imported mentor photos, logos, and news media can be served directly from this repo.

## Current action links

As of April 19, 2026:

- `menteeInterestFormUrl` points to the live Google Form
- `givingUrl` points to the direct William & Mary giving page
- `mentorInterestFormUrl` currently uses a `mailto:` fallback until a dedicated mentor Google Form is finalized

## Deployment

This repo is intended to be deployed as a static site from the repository root, including GitHub Pages if desired.

If custom domain setup is used again, place the final domain in `CNAME`.
