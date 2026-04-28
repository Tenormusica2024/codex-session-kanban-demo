# GitHub Distribution

The public/demo distribution path is GitHub Pages plus a downloadable GitHub Actions artifact. Vercel is not required.

## Workflow

Workflow file:

- `.github/workflows/codex-session-kanban-pages.yml`

The workflow:

1. Uses `sample_data/recent_sessions.sample.json` only.
2. Runs `build_review_surface.py --distribution`.
3. Generates `codex_session_review/github_pages/index.html`.
4. Copies public `docs/` into the Pages/artifact output so in-app schema links work.
5. Uploads a GitHub Pages artifact.
6. Uploads the same output as a downloadable Actions artifact.
7. Uploads the downloadable artifact on every run.
8. Runs strict fixture validation before building.
9. Deploys to GitHub Pages on `master` push when Pages is available. Manual `deploy_pages=true` remains available.

The push trigger targets `master`, matching this repository default branch. Manual execution is available via `workflow_dispatch`.

Current note: private repositories may not support GitHub Pages on the user's plan. The public demo repository is intended to use GitHub Pages; if Pages is unavailable, use the Actions artifact instead.

## Required GitHub setting

Repository Settings:

1. Settings → Pages
2. Build and deployment
3. Source: GitHub Actions
4. Push to `master`, or run the workflow manually with `deploy_pages=true` if Pages is supported

If Pages is not available for the repository visibility/plan, use the Actions artifact or move the demo-only files to a public repository. The workflow also uploads a downloadable artifact so distribution still works when Pages is unsupported.

## Privacy rule

Do not distribute real `.codex` logs, local paths, private repository data, credentials, or bypass tokens. The workflow uses `--distribution` so known private markers fail the build. Add project-specific markers with `CODEX_REVIEW_PRIVATE_MARKERS` when needed.
