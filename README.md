# Codex Session Kanban Demo

Public demo repository for the Codex Session Kanban static review surface.

This repository is fixture-only:

- no real `.codex` session logs
- no local user paths
- no private repository data
- no Vercel bypass tokens

## Local build

```powershell
powershell -ExecutionPolicy Bypass -File .\codex_session_review\build_fixture_snapshot.ps1 -Distribution
```

## GitHub Pages

The workflow `.github/workflows/codex-session-kanban-pages.yml` builds the fixture with `--distribution` and can deploy to GitHub Pages when manually run with `deploy_pages=true`.

For public repositories, set:

- Settings → Pages → Source: GitHub Actions

Then run the workflow.
