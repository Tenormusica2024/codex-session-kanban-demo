# Contributing

Thanks for considering a contribution.

This project is a static, privacy-aware review surface for AI coding sessions. Contributions should protect the core wedge:

- intent-first task extraction
- lineage-aware deduplication
- human override locks
- fixture-only public demos
- local/private handling of real session data

## Before opening a change

Check:

- [PRODUCT_TODO.md](./PRODUCT_TODO.md)
- [COMPETITIVE_POSITIONING.md](./COMPETITIVE_POSITIONING.md)
- [docs/ROADMAP.md](./docs/ROADMAP.md)
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- [docs/TESTING.md](./docs/TESTING.md)

## Data safety rules

Do not commit:

- real `.codex` session logs
- local user paths
- private repository or client data
- family/personal private data
- tokens, cookies, API keys, credentials, passwords, secrets, or bypass URLs

Public fixture changes should stay synthetic and should pass:

```powershell
python .\codex_session_review\validate_session_data.py .\codex_session_review\sample_data\recent_sessions.sample.json --distribution
```

## Local verification

Recommended:

```powershell
npm install
npm run release:check
```

For Pages verification:

```powershell
npm run release:check:pages
```

If you cannot run browser tests, at least run:

```powershell
npm run release:check -- -SkipBrowserSmoke
```

## Pull request checklist

Pull requests should use the repository PR template. In short, confirm:

- the change strengthens task review, extraction quality, lineage clarity, or human override safety
- static/local mode still works
- public fixture mode remains safe
- no private logs, local paths, credentials, or personal/client data are included
- release checks were run, or the reason for skipping them is documented
- screenshots are refreshed if visible UI changed

## Scope guidance

Prefer small changes that improve:

- extraction clarity
- candidate review speed
- evidence/debug visibility
- lineage/suppression explanations
- local/static distribution safety

Avoid turning this into:

- a generic project-management tool
- a live agent orchestrator
- a cloud sync service
- a credential-heavy deployment product

Those may be useful later, but they are not the current public-demo wedge.
