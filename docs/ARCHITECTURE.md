# Architecture / Data Flow

Codex Session Kanban is intentionally static-first. The public repository contains the app, docs, and fixture data. Real personal session data should stay local or private.

## Data flow

```text
raw AI session logs or exported session JSON
  -> session summarization / fixture JSON
  -> build_review_surface.py
  -> enriched review bundle
       - sessions
       - task_clusters
       - suggested_tasks
       - quality_report
  -> static index.html
  -> browser review surface
       - candidate staging
       - board columns
       - detail/evidence/debug panels
       - localStorage human overrides
```

## Public repository boundary

Public repository includes:

- static UI assets
- build scripts
- validation script
- docs
- synthetic/sample fixture data
- generated screenshots from fixture data

Public repository must not include:

- real `.codex` logs
- private task JSON
- local user paths
- client/family/private project details
- tokens, cookies, bypass URLs, API keys, credentials, passwords, or secrets

## Personal/private workflow

A private/local workflow can use real session summaries, but should keep them outside this public repository. The browser can import local session JSON for inspection, but imported data is not uploaded by the static app.

Manual decisions are separate from source session data:

```text
session JSON = source task/session evidence
override JSON = human review decisions
```

This separation is what allows later AI sync to update extracted candidates while preserving human status/order locks.

## Build modes

### Public fixture build

```powershell
powershell -ExecutionPolicy Bypass -File .\codex_session_review\build_fixture_snapshot.ps1 -Distribution
```

- uses `sample_data/recent_sessions.sample.json`
- enriches missing cluster/candidate structures at build time
- copies public `docs/` into the output
- runs distribution guards

### GitHub Pages build

The workflow validates fixture data, builds static HTML, copies docs, uploads an artifact, and deploys to GitHub Pages when available.

### Artifact fallback

If Pages is unavailable, download the Actions artifact and open `index.html` locally. See `ARTIFACT_USAGE.md`.

## Why not a backend first?

The current wedge is review quality, lineage clarity, and human override safety. A static-first build keeps distribution and privacy simple while the extraction model is still evolving.

Backend/cloud sync can be added later, but should not weaken the public/private boundary.
