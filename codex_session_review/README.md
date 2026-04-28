# Codex Session Kanban Demo

Static HTML Kanban/review surface for recent Codex sessions.

This distribution build uses sample fixture data only. It is intended for GitHub Pages / GitHub Actions artifact distribution and must not include real `.codex` session logs.

## What makes this different

The target is not only "show sessions as cards". The target is a review surface for AI coding workflows:

- infer task-like titles and summaries from session intent
- avoid titles based on preflight phrases such as "progress check" or "content review"
- split genuine topic conflicts while suppressing resolved setup detours
- compare related sessions and avoid showing stale predecessors as separate current tasks
- preserve human override locks when the user manually changes status/order

For competitor notes and product direction, see `../COMPETITIVE_POSITIONING.md`.

## Provider/schema stance

This demo is Codex-first, but the card schema includes lightweight provider hints such as `provider`, `provider_session_type`, and `provider_source`. These fields are for display/import compatibility only. The public demo does not run agents or orchestrate external tools.

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
