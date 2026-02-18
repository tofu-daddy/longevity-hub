# Longevity Hub Static (GitHub Pages)

This folder is a static rebuild of your WordPress experience designed for GitHub Pages.

## What is included

- `index.html`: hero + featured + latest.
- `articles/`: category + explanation filters with client-side pagination.
- `article/<slug>/`: article detail pages (key takeaways first, then plain-language explanation).
- `category/<slug>/`: category hero with stats + category article list.
- `data/articles.json`: content store for the UI.
- `scripts/update-content.mjs`: automation script to fetch from PubMed, medRxiv, ClinicalTrials.gov and generate summaries.
- `scripts/build-pretty-urls.mjs`: generates static pretty URL pages from `articles.json`.
- `llms.txt`, `robots.txt`, `sitemap.xml` for AI/SEO readiness.

## Local preview

From repo root:

```bash
cd gh-pages-site
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. In GitHub repo settings:
   - `Pages` -> Source: `GitHub Actions`.
3. The workflow `.github/workflows/deploy-pages.yml` deploys `gh-pages-site/`.

## Content automation (daily)

Workflow: `.github/workflows/refresh-content.yml`

- Runs daily and on manual trigger.
- Updates `gh-pages-site/data/articles.json`.
- Regenerates `article/<slug>/` and `category/<slug>/` pages.
- Commits dataset changes back to `main`.

### Required secret

- `OPENAI_API_KEY` (optional but recommended).

If missing, the script uses fallback non-LLM summaries.

## Important placeholders to update

Replace placeholders in:

- `llms.txt`
- `robots.txt`
- `sitemap.xml`

with your GitHub Pages domain/repo path.
