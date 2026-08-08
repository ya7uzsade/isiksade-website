# Işık & Sade Website Architecture

## Current delivery model

- Static HTML deployed on Vercel.
- Extensionless routes are provided by `cleanUrls` in `vercel.json`.
- Turkish and English copy currently live in the same documents as `data-tr` and `data-en` values.
- Page-specific CSS, JavaScript and structured data are embedded in each HTML document.
- `preview.command` reproduces Vercel's clean URL behavior for local review.

## Safe-change rules

1. Run `npm run check` before and after every structural change.
2. Keep existing public Turkish URLs stable; use redirects if a URL must change.
3. Preserve canonical URLs, structured data, calculator formulas and form behavior during refactors.
4. Move repeated code to shared assets incrementally, one page family at a time.
5. Add English and Arabic as separately indexable routes rather than relying only on client-side text switching.
6. Treat legal claims, team size, credentials, rankings and case outcomes as verified content fields.

## Planned target structure

```text
assets/
  css/       shared design tokens, layout and components
  js/        navigation, forms, calculators and language helpers
  images/    reusable optimized images
content/
  tr/        Turkish source content
  en/        English source content
  ar/        Arabic source content
data/        people, practices, publications and current legal parameters
scripts/     build and quality checks
```

The current static pages remain the production source until each page family has been migrated and visually verified.
