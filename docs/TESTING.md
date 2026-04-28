# Testing Guide

This project has two levels of public-demo smoke tests.

## Recommended one-command local check

Before sharing a release, run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\codex_session_review\run_public_release_checks.ps1
```

Equivalent npm shortcut:

```powershell
npm run release:check
```

This runs fixture validation, distribution build, static artifact smoke, Python compile checks, downloadable package smoke, and local desktop/mobile browser smoke.

To also verify the deployed GitHub Pages URL:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\codex_session_review\run_public_release_checks.ps1 -PagesSmoke
```

Equivalent npm shortcut:

```powershell
npm run release:check:pages
```

If Playwright/browser dependencies are not available and you only want the cheap checks:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\codex_session_review\run_public_release_checks.ps1 -SkipBrowserSmoke
```

## 1. Static artifact smoke

Use this for every public/distribution build.

```powershell
python .\codex_session_review\smoke_public_build.py .\codex_session_review\fixture_snapshot\index.html --docs-dir .\codex_session_review\fixture_snapshot\docs --distribution
```

It checks that the generated HTML contains:

- embedded `sessions`
- embedded `task_clusters`
- embedded `suggested_tasks`
- key UI mount points such as `candidate-list` and `detail-panel`
- bundled public docs
- distribution mode
- no obvious private-data signals in the embedded payload

This catches regressions where fixture JSON is valid but the public demo would render as an empty board.

## 2. Browser operation and visible text smoke

Use this before release, after UI changes, or when a Pages deployment needs verification.

Install dependencies once:

```powershell
npm install
```

Run against the public Pages URL:

```powershell
npm run smoke:browser
```

Run against a local fixture build:

```powershell
npm run smoke:browser:local
```

Run the same checks in a narrow mobile viewport:

```powershell
npm run smoke:browser:mobile
npm run smoke:browser:mobile:local
```

The browser smoke test checks:

- the page loads without JavaScript errors
- candidate cards are visible
- Kanban columns are rendered
- the viewport has no horizontal overflow, including in mobile mode
- the detail panel exists
- English mode translates common static UI labels
- a candidate can be promoted into the board
- promotion creates a human-lock marker
- `session_id` is visible in the detail panel
- status controls are present after promotion
- keyboard triage can move the selected card to `In Progress`
- keyboard copy shortcut targets the selected `session_id` when clipboard access is available

Japanese may still appear in source/session data. The English check is scoped to static UI labels, not arbitrary user-authored content.

## 3. Downloadable package smoke

Use this when changing artifact packaging or fallback distribution docs:

```powershell
npm run package:distribution
npm run smoke:package
```

The package smoke checks that the zip contains `index.html`, `README_LOCAL_DEMO.txt`, bundled public docs, a valid bootstrap payload, derived task candidates, distribution mode, and no obvious private-data signals.

## GitHub Actions

The normal Pages workflow always runs:

- fixture JSON validation
- public fixture build
- static artifact smoke
- downloadable zip package smoke

The heavier browser smoke is optional. Run the workflow manually with:

- `run_browser_smoke=true`

That manual browser smoke runs both desktop and mobile viewport checks.

This keeps push deployments fast while still allowing a reproducible browser check without CiC.

## When CiC is still useful

Use CiC for:

- logged-in UI checks
- subjective visual review
- browser state that depends on a user profile
- external services that require authentication

Use Playwright smoke for repeatable public URL, local HTML, and text/operation regressions.

## Local update helper

For a lightweight fixture refresh plus smoke checks, run:

```powershell
npm run local:update
```

Open the generated snapshot after checks pass:

```powershell
npm run local:update:open
```

Run the fuller local update path including mobile smoke and package smoke:

```powershell
npm run local:update:full
```

See [Local update helper](./LOCAL_UPDATE_HELPER.md) for direct PowerShell flags and Task Scheduler examples.

## Provider import normalization smoke

The one-command release check runs this smoke test automatically. To verify lightweight Claude Code / Cursor / Gemini-style imports normalize into the common session schema manually:

```powershell
python .\codex_session_review\build_review_surface.py --input-json .\codex_session_review\sample_data\provider_imports.sample.json --output .\codex_session_review\fixture_snapshot\provider-import.html --json-output .\codex_session_review\fixture_snapshot\provider-import.normalized.json --distribution
python .\codex_session_review\smoke_public_build.py .\codex_session_review\fixture_snapshot\provider-import.html --distribution
```

This does not run external agents. It only verifies import/display compatibility.
