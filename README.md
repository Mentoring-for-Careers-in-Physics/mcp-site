# MCP Static Site Starter

This folder is a plain `html/css/js` starter for the future public site repository.

## Intended use

When you are ready to create the new public GitHub repository:

1. Create a new public repository named `mcp-site`
2. Copy the contents of this folder into that repository
3. Enable GitHub Pages
4. Point `mcp.physics.wm.edu` at the Pages site when DNS is ready

## Structure

```text
mcp-site/
  index.html
  404.html
  css/
  js/
  assets/
  data/
  pages/
  .nojekyll
  CNAME.example
```

## Content model

The site is designed to start with JSON files:

- `data/site.json`
- `data/news.json`
- `data/mentors.json`
- `data/team.json`

This makes it easy to:
- edit content by hand now
- migrate to a CMS or API later
- keep the public site fully static on GitHub Pages

## Local preview

Because the site loads local JSON, preview it from a simple local web server instead of opening files directly.

Example:

```bash
cd mcp-site
python3 -m http.server 8000
```

Then open `http://localhost:8000`.
