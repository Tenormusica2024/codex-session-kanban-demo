# Local update helper

`update_local_review.ps1` is the small local workflow for refreshing the static review surface without running the whole release pipeline.

It is intended for:

- manual local review before publishing
- a lightweight Windows Task Scheduler job
- quick fixture regeneration after changing extraction rules, sample data, docs, or UI copy

The helper keeps the public repository fixture-only. It reads `codex_session_review/sample_data/recent_sessions.sample.json` and builds a distribution-safe snapshot.

## Quick commands

Build, validate, and run the desktop browser smoke:

```powershell
npm run local:update
```

Build, validate, smoke, and open the generated HTML:

```powershell
npm run local:update:open
```

Run the fuller local check, including mobile smoke and downloadable package smoke:

```powershell
npm run local:update:full
```

## Direct PowerShell usage

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\codex_session_review\update_local_review.ps1
```

Useful flags:

- `-Open`: open the generated `index.html` after the checks pass
- `-Package`: also build and smoke-test the downloadable zip
- `-MobileSmoke`: also run the mobile browser smoke
- `-SkipBrowserSmoke`: skip Playwright/browser checks for a faster scheduled refresh
- `-OutputDir <path>`: write the generated snapshot somewhere else

## Output

Default output:

```text
codex_session_review/fixture_snapshot/index.html
codex_session_review/fixture_snapshot/docs/
```

The output directory is generated and ignored by git.

## Task Scheduler example

Use this as the action command if you want a low-cost periodic local refresh:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Tenormusica\codex-session-kanban-demo-public\codex_session_review\update_local_review.ps1" -SkipBrowserSmoke
```

For an interactive manual shortcut, prefer:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Tenormusica\codex-session-kanban-demo-public\codex_session_review\update_local_review.ps1" -Open
```

## When to use release checks instead

Use `npm run release:check` before tagging a release. The release check includes packaging and both desktop/mobile browser smokes by default.

Use `npm run release:check:pages` after GitHub Pages deployment when the public URL should also be verified.
