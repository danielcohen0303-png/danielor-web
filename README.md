# Danielor web

Public web assets for Danielor (דניאלור).

- `brief/` – the personal brief page served at brief.danielor.ai
- `media/trends/` – short, muted preview loops and posters for the trend examples (served via jsDelivr)

## Deploying

The Vercel project serves the `site/` folder (`tools/build_site.py` builds it). Pushing to `main` does not always start a deploy, so:

1. Push to `main`.
2. Create a Vercel deployment from Git for this repo **with `projectSettings.rootDirectory = "site"`**. A deploy without it serves the repo root and danielor.ai answers 404.
3. Build a preview first, check `/`, `/app/`, `/inbox/`, `/trends` and `/videos` on the preview URL, then deploy the same commit to production.

- `app/` – Daniel's control center at brief.danielor.ai/app (installable). Its content media for approval lives only in `site/app/c/<token>/`.

**Warning:** since 23.10.2026 the homepage has been edited directly in `site/index.html`. The artifact source that `tools/build_site.py` reads (`SRC`) is older, so running the build would undo those edits. Edit `site/index.html` directly until the source is synced.
