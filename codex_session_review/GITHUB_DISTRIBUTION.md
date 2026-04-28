# GitHub Distribution

The public/demo distribution path is GitHub Pages plus a downloadable GitHub Actions artifact. Vercel is not required.

## Workflow

Workflow file:

- `.github/workflows/codex-session-kanban-pages.yml`

The workflow:

1. Uses `sample_data/recent_sessions.sample.json` only.
2. Runs `build_review_surface.py --distribution`.
3. Generates `codex_session_review/github_pages/index.html`.
4. Uploads a GitHub Pages artifact.
5. Uploads the same output as a downloadable Actions artifact.
6. Uploads the downloadable artifact on every run.
7. Deploys to GitHub Pages only when manually requested with `deploy_pages=true`.

The push trigger targets `master`, matching this repository default branch. Manual execution is available via `workflow_dispatch`.

Current note: the repository API returned `Your current plan does not support GitHub Pages for this repository.` Therefore the default distribution path is the Actions artifact. Pages deploy is optional and should be enabled only if repository visibility/plan supports Pages.

## Required GitHub setting

Repository Settings:

1. Settings → Pages
2. Build and deployment
3. Source: GitHub Actions
4. Run the workflow manually with `deploy_pages=true` only if Pages is supported

If Pages is not available for the repository visibility/plan, use the Actions artifact or move the demo-only files to a public repository. The workflow defaults to artifact-only distribution so it can stay green even when Pages is unsupported.

## Privacy rule

Do not distribute real `.codex` logs, local paths, private repository data, credentials, or bypass tokens. The workflow uses `--distribution` so known private markers fail the build. Add project-specific markers with `CODEX_REVIEW_PRIVATE_MARKERS` when needed.
