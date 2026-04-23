# MCP Website

Public website for `Mentoring for Careers in Physics` at William & Mary.

This repo hosts the current static MCP site from the repository root. It is designed to run on a simple static host such as GitHub Pages without a build step.

## Public pages

- `index.html`
  Homepage
- `pages/mentors.html`
  Mentor directory
- `pages/industry.html`
  Partner organization / industry page
- `pages/team.html`
  Leadership and advisor page
- `pages/news.html`
  News and announcements
- `pages/contact.html`
  Contact and engagement page
- `404.html`
  Static not-found page

## How the site is built

The site is currently a hybrid static setup:

- `index.html` uses plain HTML plus `js/main.js`
- `js/main.js` loads JSON from `data/` and fills the homepage, footer links, news cards, company grids, and other shared content blocks
- `css/styles.css` styles the homepage and shared home components
- `pages/*.html` are redesigned inner pages that render self-contained React components in the browser
- `css/mcp-shared.css` provides the shared design system used by those inner pages

Important note:

- The homepage is data-driven from `data/`
- The redesigned inner pages currently keep their content directly inside each page file
- Running the import script updates the JSON content pack and assets, but it does not automatically rewrite the React page content in `pages/*.html`

## Repo structure

```text
mcp-site/
  index.html
  404.html
  README.md
  css/
    styles.css
    mcp-shared.css
  js/
    main.js
  pages/
    mentors.html
    industry.html
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
    images/
    icons/
  scripts/
    import-live-site-content.mjs
  .nojekyll
```

## Data and content

Files in `data/` still matter, especially for the homepage and imported asset inventory:

- `data/site.json`
  Global summary text, public action links, social links, and event metadata
- `data/mentors.json`
  Imported mentor dataset used by the data-driven homepage flows
- `data/team.json`
  Current team dataset from the imported content pack
- `data/retired-team.json`
  Former team dataset
- `data/companies.json`
  Imported organization dataset and logo metadata
- `data/news.json`
  Imported news archive
- `data/events.json`
  Event materials and public archive content

For the current redesigned subpages, content edits usually happen directly in:

- `pages/mentors.html`
- `pages/industry.html`
- `pages/team.html`
- `pages/news.html`
- `pages/contact.html`

## Local preview

Because the homepage fetches local JSON, serve the site from a local web server instead of opening the files directly.

```bash
cd mcp-site
python3 -m http.server 8000
```

Then open `http://127.0.0.1:8000`.

## Testing

Recommended smoke test before pushing:

1. Start the local server.
2. Load:
   `/`
   `/pages/mentors.html`
   `/pages/industry.html`
   `/pages/team.html`
   `/pages/news.html`
   `/pages/contact.html`
3. Confirm the mentor modal opens and closes on `pages/mentors.html`.
4. Confirm the contact form reaches its confirmation state on `pages/contact.html`.
5. Check a phone-sized viewport to make sure there is no horizontal scrolling.

Latest verified locally on April 22, 2026:

- Desktop smoke test passed for all public pages
- Mentor modal open/close interaction passed
- Contact form confirmation flow passed
- Mobile checks passed for home, mentors, and contact without horizontal overflow

Current known implementation note:

- The inner React pages use in-browser Babel from a CDN, which produces a console warning in development and static hosting. The pages still render correctly, but this is a future cleanup opportunity if the site moves to a build step

## Reimporting content

The import script pulls content from the live MCP site and recovered backup assets, then refreshes the local JSON and downloaded media used by this repo.

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
- downloaded assets inside `assets/images/live-site/`
- downloaded icons inside `assets/icons/live-site/`

## External action links

The current public actions point to:

- student interest form:
  `https://forms.gle/zkuoy8HGdec81Y5o8`
- mentor interest:
  `mailto:mcp.superuser@gmail.com?subject=MCP%20Mentor%20Interest`
- giving page:
  `https://donate.wm.edu/mentoring-for-careers-in-physics-green-space-renovation`
- Instagram:
  `https://www.instagram.com/wm_mcp`
- LinkedIn:
  `https://www.linkedin.com/company/wmmcp`

## Deployment

Deploy from the repository root as a static site.

If a custom domain is used again, add the final value to `CNAME`.
