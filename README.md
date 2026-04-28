# Codex Session Kanban Demo

Public fixture demo for **Codex Session Kanban**.

Codex Session Kanban is a static, privacy-aware Kanban review surface for AI coding workflows. Its main goal is not just to list sessions, but to turn messy, long-running AI coding sessions into reviewable task candidates.

## Positioning

The project focuses on:

- **Intent-first task extraction**: infer the real task from session context instead of using raw prompts like "check progress" or "review this".
- **Topic conflict decomposition**: separate setup checks, side quests, resolved blockers, and the current main task.
- **Cross-session task lineage**: suppress stale predecessor sessions when a newer session clearly continues or supersedes the same task.
- **Human override lock**: when a user moves or edits a card, later AI sync should not silently revert that decision.
- **Static/private-safe distribution**: public demos use fixture data only; real `.codex` logs stay local/private.

See [`COMPETITIVE_POSITIONING.md`](./COMPETITIVE_POSITIONING.md) for competitor notes and product direction.

## Public demo

GitHub Pages:

https://tenormusica2024.github.io/codex-session-kanban-demo/

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
