# Codex Session Kanban Demo

Public fixture demo for **Codex Session Kanban**.

Codex Session Kanban is a static, privacy-aware Kanban review surface for AI coding workflows. Its main goal is not just to list sessions, but to turn messy, long-running AI coding sessions into reviewable task candidates.

## License

MIT. See [LICENSE](./LICENSE).

## Contributing / security

- [Contributing guide](./CONTRIBUTING.md)
- [Security policy](./SECURITY.md)

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

## Screenshots

### Board overview

![Board overview](./docs/assets/board-overview.png)

### Card detail with extraction evidence

![Card detail](./docs/assets/card-detail.png)

## Docs

- [Demo usage guide](./docs/DEMO_USAGE.md)
- [Downloadable artifact usage](./docs/ARTIFACT_USAGE.md)
- [Architecture / data flow](./docs/ARCHITECTURE.md)
- [Import schema](./docs/IMPORT_SCHEMA.md)
- [Testing guide](./docs/TESTING.md)
- [Public release checklist](./docs/PUBLIC_RELEASE_CHECKLIST.md)
- [Competitive positioning](./COMPETITIVE_POSITIONING.md)
- [Product TODO / adoption policy](./PRODUCT_TODO.md)
- [Distribution build notes](./codex_session_review/DISTRIBUTION_BUILD.md)
- [GitHub distribution notes](./codex_session_review/GITHUB_DISTRIBUTION.md)

## Local build

```powershell
powershell -ExecutionPolicy Bypass -File .\codex_session_review\build_fixture_snapshot.ps1 -Distribution
```

Output:

```text
codex_session_review/fixture_snapshot/index.html
```

## Smoke tests

Recommended full local check:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\codex_session_review\run_public_release_checks.ps1
```

Or via npm:

```powershell
npm run release:check
```

Static artifact check:

```powershell
python .\codex_session_review\smoke_public_build.py .\codex_session_review\fixture_snapshot\index.html --docs-dir .\codex_session_review\fixture_snapshot\docs --distribution
```

Browser operation and visible-text check:

```powershell
npm install
npm run smoke:browser:local
```

To verify the public Pages URL:

```powershell
npm run smoke:browser
```

For the full release check including the deployed Pages URL:

```powershell
npm run release:check:pages
```

See [Testing guide](./docs/TESTING.md) for details.

## GitHub Pages

The workflow `.github/workflows/codex-session-kanban-pages.yml` builds the fixture with `--distribution` and can deploy to GitHub Pages.

For public repositories, set:

- Settings → Pages → Source: GitHub Actions

Then push to `master` or run the workflow manually with `deploy_pages=true`.
