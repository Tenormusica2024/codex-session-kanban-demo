# Codex Session Kanban

Static HTML Kanban/review surface for recent Codex sessions.

This distribution build uses sample fixture data only. It is intended for GitHub Pages / GitHub Actions artifact distribution and must not include real `.codex` session logs.

## What makes this different

The target is not only "show sessions as cards". The target is a review surface for AI coding workflows:

- infer task-like titles and summaries from session intent
- avoid titles based on preflight phrases such as "progress check" or "content review"
- split genuine topic conflicts while suppressing resolved setup detours
- compare related sessions and avoid showing stale predecessors as separate current tasks
- preserve human override locks when the user manually changes status/order

For competitor notes and product direction, see `../COMPETITIVE_POSITIONING.md`.

## Title classification guardrails

Session titles must prefer the latest concrete work over older high-signal
words in the same transcript. In particular, LLMWIKI / Research Links /
auto-collect work must not be classified as creative / ChatGPT / CiC image
generation only because stale context contains `ai-character-ip`, `character`,
`grok4_cic`, or `cic`.

The shared deterministic rules live in
`codex_session_review/title_classification_rules.py`. Keep that file identical
between `openclaw-secretary` and the public checkout; the local
sync guard is `tests/test_title_classification_rules_sync.py`.

Treat these as priority signals for `LLMWIKI報告メール誤表示修正` when they
appear in an LLMWIKI / Research Links context:

- `LOCAL_WIKI_FALLBACK`
- `search_local_fallback`
- `Research Links`
- `send_daily_research_links`
- `成功ログ`
- `成功扱い`
- `暫定成功`
- `score`
- `誤表示`
- `要確認`

Expected title shape:

`LLMWIKI Research Links の失敗/score誤表示修正`

## Provider/schema stance

This demo is Codex-first, but the card schema includes lightweight provider hints such as `provider`, `provider_session_type`, and `provider_source`. These fields are for display/import compatibility only. The public demo does not run agents or orchestrate external tools.

## Build fixture locally

```powershell
powershell -ExecutionPolicy Bypass -File .\codex_session_review\build_fixture_snapshot.ps1 -Distribution
```

## Open local fixture

```powershell
powershell -ExecutionPolicy Bypass -File .\codex_session_review\open_distribution_review.ps1
```

## Release checks

Run the full local public-release check before sharing a build:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\codex_session_review\run_public_release_checks.ps1
```

Or:

```powershell
npm run release:check
```

To include the currently deployed GitHub Pages URL:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\codex_session_review\run_public_release_checks.ps1 -PagesSmoke
```

Or:

```powershell
npm run release:check:pages
```

This wraps fixture validation, distribution build, static artifact smoke, Python compile checks, and browser operation smoke.

## GitHub distribution

See `GITHUB_DISTRIBUTION.md`. The GitHub workflow builds with `--distribution`, uploads a Pages artifact, and also provides a downloadable Actions artifact.

## Privacy guard

`--distribution` fails when known private/local markers are detected. Add project-specific markers with `CODEX_REVIEW_PRIVATE_MARKERS`, separated by semicolons.

## Title investigation guard

Scheduled/private builds must not publish shallow titles such as `unknownの...` or topic labels derived only from a stale high-signal word.

- Treat `quality_report.status != ok` as a blocking issue before deploy/publish.
- `unknownの...`, `primary_repo=unknown`, and `topic_key=unknown:*` are title-quality failures.
- `stale_context_topic_risks`, `topic_title_mismatches`, and `project_entity_mismatches` require rule/project-inference fixes, not one-off title overrides.
- If cwd is only a home directory, infer project/repo from session text: URLs, service/project names, project refs, notification mails, and deployment targets.
- Example: Supabase `hzofpqlhrlveqnjsoaae` / `ai-model-tracker` / `rls_disabled_in_public` / `public.benchmarks` must classify as `ai-model-tracker` + `Supabase RLS/security修正`, not dashboard/ranking freshness.
