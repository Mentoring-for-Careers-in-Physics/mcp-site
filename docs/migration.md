# Astro Migration Notes

This repository now preserves the pre-Astro static site with git refs and uses Astro for the current static build.

## Legacy Preservation

The pre-Astro static site should be preserved at:

- Branch: `legacy_static_site`
- Tag: `pre_astro_static_site`

These refs were created locally before the Astro rewrite at commit `31080c654d3056a4f78f8a9e0ca1479a2a79acba`.

Maintainers should push them once they are ready:

```bash
git push origin legacy_static_site
git push origin pre_astro_static_site
```

If the refs ever need to be recreated from a fresh clone, run:

```bash
git checkout main
git pull
git branch legacy_static_site
git tag pre_astro_static_site
git push origin legacy_static_site
git push origin pre_astro_static_site
```

## New Static Site

The current site is an Astro static build. It does not use a server adapter, backend, database, authentication, Docker, Supabase, or runtime environment variables.

Data is canonical in `src/data/` and mirrored to `public/data/` before development and production builds. Assets live in `public/assets/`, preserving the previous `/assets/...` paths used by the JSON data.

## Deployment Model

The deployment target is GitHub Pages with a custom domain:

- `public/CNAME` contains `mcp.physics.wm.edu`
- `astro.config.mjs` sets `site: "https://mcp.physics.wm.edu"`
- No `base` path is configured
- `.github/workflows/deploy.yml` builds and deploys `dist/` through GitHub Actions

Manual GitHub setup still required:

1. In repository settings, set Pages source to GitHub Actions.
2. Configure DNS for `mcp.physics.wm.edu` to point at GitHub Pages according to William & Mary DNS policy.
3. Push the `legacy_static_site` branch and `pre_astro_static_site` tag to origin.
