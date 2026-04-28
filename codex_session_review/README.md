# Codex Session Kanban Demo

Static HTML Kanban/review surface for recent Codex sessions.

This distribution build uses sample fixture data only. It is intended for GitHub Pages / GitHub Actions artifact distribution and must not include real `.codex` session logs.

## Build fixture locally

```powershell
powershell -ExecutionPolicy Bypass -File .\codex_session_review\build_fixture_snapshot.ps1 -Distribution
```

## Open local fixture

```powershell
powershell -ExecutionPolicy Bypass -File .\codex_session_review\open_distribution_review.ps1
```

## GitHub distribution

See `GITHUB_DISTRIBUTION.md`. The GitHub workflow builds with `--distribution`, uploads a Pages artifact, and also provides a downloadable Actions artifact.

## Privacy guard

`--distribution` fails when known private/local markers are detected. Add project-specific markers with `CODEX_REVIEW_PRIVATE_MARKERS`, separated by semicolons.
