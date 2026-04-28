# Codex Session Kanban Demo

Public fixture demo for **Codex Session Kanban**.

Codex Session Kanban is a static, privacy-aware Kanban review surface for AI coding workflows. Its main goal is not just to list sessions, but to turn messy, long-running AI coding sessions into reviewable task candidates.

## Public demo

https://tenormusica2024.github.io/codex-session-kanban-demo/

This repository is fixture-only:

- no real `.codex` session logs
- no local user paths
- no private repository data
- no Vercel bypass tokens

## Core differentiation

- **Intent-first task extraction**: infer the real task from session context instead of using raw prompts like "check progress" or "review this".
- **Topic conflict decomposition**: separate setup checks, side quests, resolved blockers, and the current main task.
- **Cross-session task lineage**: suppress stale predecessor sessions when a newer session clearly continues or supersedes the same task.
- **Human override lock**: when a user moves or edits a card, later AI sync should not silently revert that decision.
- **Inspectable extraction**: detail panels expose evidence categories, extraction timeline, suppressed predecessor sessions, and extraction debug hints.
- **Static/private-safe distribution**: public demos use fixture data only; real `.codex` logs stay local/private.

## Docs

- [Demo usage guide](./docs/DEMO_USAGE.md)
- [Import schema](./docs/IMPORT_SCHEMA.md)
- [Public release checklist](./docs/PUBLIC_RELEASE_CHECKLIST.md)
- [Competitive positioning](./COMPETITIVE_POSITIONING.md)
- [Product TODO / adoption policy](./PRODUCT_TODO.md)

## Local build

```powershell
powershell -ExecutionPolicy Bypass -File .\codex_session_review\build_fixture_snapshot.ps1 -Distribution
```

Output:

```text
codex_session_review/fixture_snapshot/index.html
```

## GitHub Pages

The workflow `.github/workflows/codex-session-kanban-pages.yml` builds the fixture with `--distribution` and can deploy to GitHub Pages.

For public repositories, set:

- Settings → Pages → Source: GitHub Actions

Then push to `master` or run the workflow manually with `deploy_pages=true`.
