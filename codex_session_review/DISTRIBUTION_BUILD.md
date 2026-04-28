# Distribution Build

The distribution build uses sample fixture data only. Do not use real `.codex` sessions for public distribution.

## Build

```powershell
powershell -ExecutionPolicy Bypass -File .\codex_session_review\build_fixture_snapshot.ps1 -Distribution
```

Output:

- `codex_session_review/fixture_snapshot/index.html`

## Local preview

```powershell
powershell -ExecutionPolicy Bypass -File .\codex_session_review\open_distribution_review.ps1
```

## Local package

```powershell
powershell -ExecutionPolicy Bypass -File .\codex_session_review\package_distribution_snapshot.ps1
```

The normal distribution path is GitHub Pages / GitHub Actions artifact. Local packaging is only for preflight or fallback.

## Full release check

For normal pre-release validation, prefer the wrapper:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\codex_session_review\run_public_release_checks.ps1
```

Or:

```powershell
npm run release:check
```

It runs:

- fixture JSON validation
- distribution fixture build
- static artifact smoke
- Python compile checks
- Playwright browser smoke against the local fixture

To also verify the deployed Pages URL:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\codex_session_review\run_public_release_checks.ps1 -PagesSmoke
```

Or:

```powershell
npm run release:check:pages
```

## Guard

`-Distribution` fails if the bundle contains local paths, bypass tokens, credentials filenames, or additional private markers supplied through `CODEX_REVIEW_PRIVATE_MARKERS`.

Example:

```powershell
$env:CODEX_REVIEW_PRIVATE_MARKERS = "private-client-name;internal-domain.example"
powershell -ExecutionPolicy Bypass -File .\codex_session_review\build_fixture_snapshot.ps1 -Distribution
```

## Bilingual fixture fields

English UI can prefer these optional fields:

- `title_en`
- `summary_en` / `task_body_summary_en`
- `first_user_message_en`
- `last_assistant_message_en`
- `evidence_messages_en`
- `current_goal_en`
- `deep_summary_en`
- `latest_meaningful_change_en`
- `blocker_en`
- `suggested_reason_en`
