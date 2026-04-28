# Product TODO / Adoption Policy

This project should grow by borrowing useful affordances from AI-agent Kanban tools while protecting its core wedge:

> turn long AI coding sessions into deduplicated, reviewable task candidates with human override locks.

Do not add features just because a competitor has them. Add them only when they improve fast task review, session-to-task extraction, lineage clarity, or safe human curation.

## Core principles to preserve

1. **Session-to-task, not session-to-card**
   - The visible card should represent the current task candidate.
   - Raw sessions are evidence, not always one card each.

2. **Intent-first extraction**
   - Avoid titles based on preflight phrases: "progress check", "content review", "difference check", "confirm status".
   - Prefer the actual project task inferred from the useful part of the session.

3. **Lineage-aware deduplication**
   - If a newer session continues or supersedes an older one, the older one should be suppressed or linked, not duplicated as an active candidate.
   - Old information is safe to suppress only when it is reconciled with newer information in the same task lineage.

4. **Human override is authoritative**
   - User status/order/manual edits are not silently reverted by AI sync.
   - AI can recommend, explain, or warn, but should not overwrite a human lock without an explicit user action.

5. **Static/private-safe by default**
   - Public builds use fixture data only.
   - Real `.codex` logs remain local/private.

## Adoption checklist for each competitor-inspired feature

Before implementing, answer these briefly in the PR/commit note or design note:

- Does this improve task review, extraction quality, lineage clarity, or human override safety?
- Could it push the product toward a generic agent runner / heavy PM tool?
- Does it make the UI noisier than the current review task requires?
- Can it work in static HTML / localStorage mode?
- Does public fixture mode remain safe?
- Is the feature explainable to a user in one sentence?

If the answer is unclear, keep the feature as a backlog idea rather than implementing it immediately.

## P0 TODOs

### 1. Candidate backlog cleanup

Goal:
- Treat "Kanban追加候補" as a staging backlog.
- Cards already fixed or placed on the board should disappear from candidate list.
- Candidate cards should have explicit "promote to status" behavior.

Why:
- Avoid duplicate display between candidate list and board.
- Borrow the good part of Kangentic/Vibe backlog flow without becoming a full issue tracker.

Risk to avoid:
- Do not create a second competing Kanban inside the candidate panel.

### 2. Card existence / inference explanation

Status:
- Initial implementation added: the detail panel now shows `Why this card exists`, including inferred task intent, compact evidence, source-session/lineage notes, and human override notes when applicable.

Goal:
- Each card should explain why it exists:
  - source sessions
  - key evidence
  - inferred task intent
  - suggested status reason
  - why older related sessions were merged/suppressed

Why:
- Makes intent-first extraction and lineage trustworthy.

Risk to avoid:
- Do not dump raw transcripts into the card body. Keep evidence concise and inspectable.

### 3. Needs-input badge/filter

Status:
- Initial implementation added: cards with blocker/auth/login/credential/manual-action/deploy/budget/rate-limit signals get a `needs input` badge and can be filtered from the toolbar. This stays as a badge/filter, not a new column.

Goal:
- Distinguish ordinary review from true user/input blockers:
  - user answer needed
  - login/browser action needed
  - credential/deployment action needed
  - external service decision needed

Why:
- Borrow Claudine-style needs-input value while preserving the current columns.

Risk to avoid:
- Do not over-split columns unless the badge/filter proves insufficient.

### 4. Done/Dropped archive collapse

Status:
- Implemented in the static UI: `Done` and `Dropped` are archive columns, collapsed by default, expandable on demand, with counts visible.

Goal:
- Done and Dropped should be compact by default.
- Expand on demand.
- Counts remain visible.

Why:
- Prevent completed history from dominating the active board.

Risk to avoid:
- Do not hide human-fixed cards so completely that override state becomes hard to recover.

### 5. Evidence-aware search

Status:
- Initial implementation added: search now covers title/summary, task body, repo, session id, source file, cluster keys, current goal, deep summary, latest change, blocker, suggested reason, first/last messages, evidence messages, and related session evidence.

Goal:
- Search should cover:
  - title
  - summary
  - repo/project
  - cluster/topic
  - session id
  - evidence snippets
  - lineage/suppression notes

Why:
- High-value, low-concept-risk improvement inspired by full-text search in competing dashboards.

Risk to avoid:
- Do not make hidden personal/private evidence searchable in public fixture mode.

### 6. Stale predecessor / successor display

Status:
- Initial implementation added: representative cards with multiple related sessions now show a lineage badge and detail-panel lineage note. This is conservative: it exposes merged/represented sessions from existing cluster data without inventing hidden successor links.

Goal:
- Show when a task candidate includes or supersedes older sessions.
- Add badges/links such as:
  - "supersedes 2 older sessions"
  - "merged into newer task"
  - "successor: ..."

Why:
- This is one of the strongest differentiators and should be visible.

Risk to avoid:
- Do not suppress old sessions unless there is enough newer context to reconcile them.

## P1 TODOs

### 6.5 Extraction quality self-audit

Status:
- Initial implementation added: each card gets a heuristic quality badge and detail-panel audit. It flags generic titles, raw-message-like bodies, weak evidence, topic-shift risk, and multi-session lineage review risk.

Goal:
- Detect extraction problems before the user has to spot them visually:
  - generic title
  - raw message body
  - weak evidence
  - topic conflict
  - stale/merged lineage risk

Why:
- This directly strengthens the product wedge: session-to-task extraction quality.

Risk to avoid:
- Do not treat the audit as ground truth. It is a review hint, not an automatic correction.

### 7. Parent/child or related task display

Status:
- Initial implementation added: detail view now shows a lightweight related task map split into same-lineage sessions and other tasks in the same repo. This intentionally avoids a full PM dependency graph.

Goal:
- Show legitimate parallel tasks inside a larger project without merging them incorrectly.

Why:
- Helps distinguish "same project, different task" from duplicate lineage.

Risk to avoid:
- Do not become a full PM dependency graph.

### 8. Card extraction timeline

Goal:
- Show how the card was derived over time:
  - first seen
  - merged/suppressed sessions
  - latest decisive evidence
  - manual override events

Why:
- Helps debug misclassification without rereading full transcripts.

Risk to avoid:
- Keep it collapsed or detail-only; main card must stay readable.

### 9. Keyboard triage shortcuts

Status:
- Initial implementation added: selected card can be triaged with `j/k` selection movement, `Alt+↑/↓` rank movement, `1-6` status changes, and `c` session-id copy. Shortcuts are disabled while typing in form controls.

Goal:
- Fast operations for personal review:
  - move status left/right
  - move rank up/down
  - copy session id
  - promote candidate
  - archive/done/dropped

Why:
- Faster than drag for dense boards.

Risk to avoid:
- Avoid conflicting with browser/system shortcuts.

### 10. Override export/import UX

Status:
- Initial implementation added: toolbar now explains localStorage/export JSON behavior and shows the current stored override count.

Goal:
- Make manual override backup/restore obvious.
- Clarify what is stored in localStorage and what can be copied/exported.

Why:
- Strengthens human override lock trust.

Risk to avoid:
- Do not imply cloud sync exists unless implemented.

### 11. Provider/schema extensibility

Status:
- Initial implementation added: sample data now includes provider/schema hints, cards display provider badges, and docs clarify that provider support is display/import compatibility only, not agent execution.

Goal:
- Keep Codex-first while making fields extensible for Claude Code, Gemini, Cursor, etc.

Why:
- Competitors support many agents; this project can borrow schema flexibility without becoming a runner.

Risk to avoid:
- Do not add agent execution/orchestration scope yet.

## P2 / defer unless clearly needed

- Built-in code diff review
- Agent spawn/resume from Kanban
- SSH/multi-server monitoring
- Heavy token/cost analytics
- Account-based cloud sync
- Team/multiplayer features

These are valuable in competing products but can dilute the current positioning.

## Implementation workflow

For each feature:

1. Start from the review workflow problem, not from competitor parity.
2. Implement the smallest static/local version first.
3. Verify it does not break:
   - intent-first task extraction
   - lineage deduplication
   - human override lock
   - fixture-only public demo
4. Add a short note to this TODO when the feature becomes implemented or intentionally deferred.

## Current recommended order

1. Candidate backlog cleanup
2. Explanation/evidence panel
3. Needs-input badge/filter
4. Done/Dropped collapse
5. Evidence-aware search
6. Stale predecessor/successor display
7. Keyboard triage shortcuts
8. Parent/child related task display
