# Provider adapter review

Codex Session Kanban intentionally treats provider support as **import/display compatibility**, not as agent execution or orchestration.

Use this checklist when a real Claude Code, Cursor, Gemini, or other AI-coding-session export appears.

## Review principle

Do not add a broad adapter from assumptions. First diagnose the observed export shape, then normalize only stable aliases that are actually present.

## Diagnostic command

```powershell
python .\codex_session_review\diagnose_provider_import.py .\path\to\provider-export.json --report-json .\codex_session_review\fixture_snapshot\provider-diagnosis.json --normalized-json .\codex_session_review\fixture_snapshot\provider.normalized.json
```

For the bundled sample:

```powershell
npm run provider:diagnose
```

The diagnosis reports:

- raw session count
- normalized session count
- inferred providers
- mapped statuses
- missing required normalized fields
- generic-provider fallbacks
- unknown repo/project labels
- weak evidence/message extraction
- possible private-data markers

## When to add a new mapping

Add or adjust a mapping only when a real sample shows a stable field name, for example:

- a provider uses a new stable session id field
- a provider uses a new stable message array field
- role/content fields differ but are consistent
- timestamps or workspace/repo fields need a stable alias
- status values need a deterministic board-status mapping

Do not add mappings for one-off transformed data that can be preprocessed outside this tool.

## Acceptance checks

Before calling a provider shape supported:

1. `diagnose_provider_import.py` reports no errors.
2. The normalized JSON has stable `session_id`, `primary_repo`, `start_at`, `end_at`, and `suggested_status`.
3. At least one useful user/assistant message or evidence snippet survives normalization.
4. The generated board is not empty.
5. Public fixture builds still pass with `--distribution`.
6. No real private logs are added to the public repository.

## Privacy stance

Real exports can contain local paths, client names, private task details, and secrets. Keep real provider samples local/private unless they are fully sanitized into fixture data.

If a sample is sanitized and committed, it should demonstrate a distinct compatibility behavior, not just increase fixture volume.
