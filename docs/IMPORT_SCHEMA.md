# Session Import Schema

Codex Session Kanban is designed around **session-to-task extraction**. Import data should preserve enough evidence for a reviewer to understand why a card exists, while keeping real logs private.

## Top-level shape

```json
{
  "generated_at": "2026-04-28T00:00:00+09:00",
  "source": "sample-fixture-public",
  "schema_version": "0.1",
  "surface_mode": "distribution",
  "supported_providers": ["codex"],
  "sessions": []
}
```

## Required session fields

| Field | Type | Purpose |
| --- | --- | --- |
| `session_id` | string | Stable unique id. Used for human overrides and copy actions. |
| `title` | string | Human-facing Japanese title, preferably task-oriented. |
| `summary` | string | Human-facing Japanese task summary. Do not dump raw prompts. |
| `suggested_status` | string | One of `Need Review`, `Pending`, `In Progress`, `Blocked`, `Done`, `Dropped`. |
| `primary_repo` | string | Main repo/project label. |
| `start_at` / `end_at` | string | ISO-ish timestamps for recency and lineage sorting. |

## Strongly recommended fields

| Field | Type | Purpose |
| --- | --- | --- |
| `title_en` / `summary_en` | string | Public/demo English UI without translating private logs at runtime. |
| `current_goal` / `current_goal_en` | string | What the session was actually trying to accomplish. |
| `deep_summary` / `deep_summary_en` | string | More detailed task summary for the detail panel. |
| `latest_meaningful_change` / `_en` | string | Latest decisive state change. |
| `blocker` / `blocker_en` | string | Blocker or `none`. Used by attention filters. |
| `evidence_messages` / `_en` | string[] | Compact evidence snippets. These power evidence categories and search. |
| `suggested_reason` / `_en` | string | Why the status was recommended. |
| `user_message_count` | number | Review signal. |
| `assistant_message_count` | number | Review signal. |
| `command_count` | number | Review signal. |
| `activity_score` | number | Ranking signal. |

## Lineage / dedup fields

These fields are what make the project different from a generic Kanban board.

| Field | Type | Purpose |
| --- | --- | --- |
| `task_cluster_key` | string | Machine-ish task cluster id. |
| `task_cluster_label` | string | Human-readable cluster label. |
| `task_cluster_family` | string | Larger lineage family. Used to find related tasks. |
| `lineage_key` | string | Same-task predecessor/successor key. |
| `topic_key` | string | Topic inside a larger project. |
| `related_session_count` | number | Number of represented sessions. |
| `related_session_ids` | string[] | Sessions suppressed/represented by this card. |
| `task_shift_signal` | boolean | Indicates possible topic conflict inside a session. |
| `doneish_signal` | boolean | Indicates completion-ish language. |
| `pendingish_signal` | boolean | Indicates pending/waiting language. |

## Validation script

Before publishing fixture data, run:

```powershell
python codex_session_review\validate_session_data.py codex_session_review\sample_data\recent_sessions.sample.json --distribution
```

The validator checks:

- required fields
- status enum values
- duplicate `session_id`
- timestamp parse errors
- broken `related_session_ids` references
- private-data-like signals such as local user paths, tokens, cookies, secrets, passwords, credentials, and bypass markers

In `--distribution` mode, privacy-like signals fail the build. Without `--distribution`, they are warnings for local review.

## Public fixture safety rules

Public/demo data must not contain:

- real `.codex` logs
- local Windows/macOS user paths
- private repository names if not intentionally disclosed
- bypass tokens, cookies, API keys, auth URLs, or credentials
- client/family/personal private content

Use `--distribution` builds for public Pages output.

## Minimal session example

```json
{
  "session_id": "sample-session-001",
  "title": "候補カードの抽出品質を確認",
  "summary": "長いAI作業セッションから作った候補カードのタイトル、本文、前後関係を確認する。",
  "title_en": "Review Candidate Card Extraction Quality",
  "summary_en": "Review whether generated candidate cards have task-oriented titles, concise bodies, and correct lineage.",
  "suggested_status": "Need Review",
  "primary_repo": "codex-session-kanban-demo",
  "start_at": "2026-04-28T10:00:00+09:00",
  "end_at": "2026-04-28T11:00:00+09:00",
  "evidence_messages": [
    "タイトルが前置き語に寄りすぎていないか確認する。",
    "古いセッションが新しい代表カードに統合されているか確認する。"
  ],
  "task_cluster_key": "candidate-extraction-quality",
  "task_cluster_label": "候補抽出品質",
  "related_session_count": 1
}
```
