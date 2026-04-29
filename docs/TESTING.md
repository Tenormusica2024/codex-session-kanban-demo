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

This runs fixture validation, distribution build, static artifact smoke, fixture coverage diagnosis, provider import diagnosis, Python compile checks, downloadable package smoke, and local desktop/mobile browser smoke.

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
npm run smoke:browser:narrow:local
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
- `/` focuses search and filters both board cards and candidates, the filter summary updates, attention filters can isolate quality-review cards, `x` clears filters, `?` opens/closes the workflow guide, and `Esc` closes it
- keyboard triage can move the selected card to `In Progress`
- keyboard copy shortcut targets the selected `session_id`, selected cards update the `#session=...` hash, and detail copy-card-link / copy-card-brief actions copy resumable URLs and compact card handoff text when clipboard access is available

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
- desktop browser smoke on the built artifact
- mobile browser smoke on the built artifact
- narrow 320px browser smoke on the built artifact

Manual workflow runs can also run the browser smoke path without a push by setting:

- `run_browser_smoke=true`

The manual browser smoke covers desktop, mobile, and narrow viewport checks.

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

See [Local update helper](./LOCAL_UPDATE_HELPER.md) for direct PowerShell flags and public-fixture Task Scheduler examples.

For private real-session refresh checks, use:

```powershell
npm run private:update
npm run private:update:full
```

See [Private scheduled refresh](./PRIVATE_SCHEDULED_REFRESH.md) before scheduling real `.codex` data.


## Fixture coverage diagnosis

The one-command release check verifies that the public fixture still covers the main session-to-task behaviors without adding sample sessions just for volume.

```powershell
npm run fixture:coverage
```

This produces `fixture-coverage.json` and `fixture-coverage.normalized.json` under `codex_session_review/fixture_snapshot/`. See [Fixture coverage diagnosis](./FIXTURE_COVERAGE.md).

## Provider import diagnosis and normalization smoke

The one-command release check runs the provider diagnosis and normalization smoke automatically.

```powershell
npm run provider:diagnose
```

The smoke test also builds a normalized HTML artifact. Browser smoke also verifies that lightweight prioritization stats are visible after candidate promotion. To verify lightweight Claude Code / Cursor / Gemini-style imports normalize into the common session schema manually:

```powershell
python .\codex_session_review\build_review_surface.py --input-json .\codex_session_review\sample_data\provider_imports.sample.json --output .\codex_session_review\fixture_snapshot\provider-import.html --json-output .\codex_session_review\fixture_snapshot\provider-import.normalized.json --distribution
python .\codex_session_review\smoke_public_build.py .\codex_session_review\fixture_snapshot\provider-import.html --distribution
```

This does not run external agents. It only verifies import/display compatibility.

## Keyboard triage smoke coverage

Browser smoke covers both board-card and candidate-list shortcuts:

- global: `/` search focus, `x` clear filters, `?` guide toggle, `Esc` guide close
- candidate list: focus candidate, `j/k` movement, `Enter` preview, `a` promote to recommended column, and candidate-review quick filters
- board cards: `1-6` status movement and `c` session-id copy

These checks protect the no-drag fallback path for dense boards and mobile/narrow review workflows.

## Narrow viewport smoke

Use the narrow smoke when checking very small phone-width layouts:

```powershell
npm run smoke:browser:narrow:local
npm run smoke:browser:narrow
```

The narrow profile uses a 320px-wide viewport and checks the same candidate, detail, status, keyboard, and horizontal-overflow assertions as the desktop/mobile smoke.

## Regenerate README screenshots

Screenshots are generated from the public fixture snapshot only. Rebuild the fixture first, then capture the desktop and mobile README images:

```powershell
npm run local:update
npm run screenshots:update
```

This updates:

- `docs/assets/board-overview.png`
- `docs/assets/card-detail.png`
- `docs/assets/mobile-overview.png`
- `docs/assets/mobile-detail.png`

Do not run the screenshot command against private real-session output.

