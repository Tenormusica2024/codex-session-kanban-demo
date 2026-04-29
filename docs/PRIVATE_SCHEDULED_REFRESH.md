# Private scheduled refresh

This recipe is for personal/private use. It scans local Codex session logs and writes a local static review surface that is intentionally ignored by git.

Do **not** use this recipe for the public fixture build. Public GitHub Pages output must continue to use synthetic fixture data and `--distribution` checks.

## What it creates

Default private output:

```text
codex_session_review/local_private_review/index.html
codex_session_review/local_private_review/review.bundle.json
codex_session_review/local_private_review/review-pack.md
```

The directory is git-ignored by default.

## Manual private refresh

Fast scheduled-style refresh without browser smoke:

```powershell
npm run private:update
```

Refresh and open the local HTML:

```powershell
npm run private:update:open
```

Fuller manual check with browser smoke:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\codex_session_review\update_private_review.ps1
```

Optional flags:

- `-Days 7`: how far back to scan.
- `-MaxSessions 40`: maximum recent sessions to inspect.
- `-MinUserMessages 4`: ignore very short sessions.
- `-CodexHome <path>`: use a non-default Codex home.
- `-OutputDir <path>`: write the private HTML/JSON/Markdown somewhere else.
- `-SkipBrowserSmoke`: faster scheduled mode.
- `-Open`: open the generated HTML when done.
- `-MobileSmoke`: add a mobile browser smoke check.

## Windows Task Scheduler setup

Recommended low-cost scheduled action:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Tenormusica\codex-session-kanban-demo-public\codex_session_review\update_private_review.ps1" -SkipBrowserSmoke
```

Task Scheduler fields:

- Program/script: `powershell`
- Add arguments:

```text
-NoProfile -ExecutionPolicy Bypass -File "C:\Users\Tenormusica\codex-session-kanban-demo-public\codex_session_review\update_private_review.ps1" -SkipBrowserSmoke
```

- Start in:

```text
C:\Users\Tenormusica\codex-session-kanban-demo-public
```

Suggested cadence:

- once in the morning if this is mainly a daily review board
- every 2-4 hours if active session tracking matters
- avoid very short intervals unless you confirm runtime is acceptable

## Override backup / restore

Manual status moves and order changes live in browser `localStorage` by default. Before replacing browsers, clearing storage, or moving machines:

1. Open the private local `index.html`.
2. Click **手動修正を出力 / Export overrides** or **手動修正JSONをコピー / Copy overrides JSON**.
3. Save the JSON outside the public repo, for example under a private backup folder.
4. To restore, use **手動修正を読み込み / Import overrides**.

Keep override JSON private if it contains real task names or session IDs.

## Safety rules

- Private refresh does not pass `--distribution` because real `.codex` logs can contain local paths and personal task data.
- Never copy files from `codex_session_review/local_private_review/` into `fixture_snapshot/`, `github_pages/`, or a public release artifact.
- Public release checks should still use `npm run release:check` and fixture data only.
- If you need to share a screenshot, check the visible task names and detail panel first.

## Troubleshooting

If the scheduled task fails:

1. Run the same command manually in PowerShell.
2. Confirm `python`, `node`, and `npm install` have been run in the repo if browser smoke is enabled.
3. Use `-SkipBrowserSmoke` for unattended scheduled runs.
4. Check that `C:\Users\Tenormusica\.codex\sessions` exists or pass `-CodexHome`.
