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

The homepage is intentionally shorter, more visual, and more stable across screen sizes than the earlier draft.

- Mentor headshots appear directly in the hero area
- Organization logos appear both near the top of the page and in the partner grid
- Section titles and supporting copy are deliberately shorter and less wordy
- Homepage cards and counts still come from the JSON files in `data/`

## Design notes

The current visual direction is meant to feel lighter, calmer, and more polished than the previous version.

- Typography uses `Fraunces` for headings and `Public Sans` for interface and body text
- The color palette leans toward soft stone, slate, and champagne tones instead of high-contrast burgundy
- Mentor photos are cropped and framed more intentionally, with more whitespace around them
- Buttons, cards, and logos use a quieter editorial treatment instead of a louder marketing look

## Responsive behavior

The homepage and shared styles were tuned specifically for tablet and mobile layouts.

- The hero and portrait area now collapses cleanly instead of relying on fragile overlapping placement
- Buttons stack more predictably on small screens
- Stats, logos, and card grids rebalance at narrower widths to avoid cramped or broken layouts
- The first screen no longer depends on animation timing to feel complete

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
