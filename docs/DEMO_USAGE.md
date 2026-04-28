# Demo Usage Guide

## What this demo shows

Codex Session Kanban is not a generic project-management Kanban. It is a review surface for turning long AI coding sessions into task candidates.

The demo shows four core behaviors:

1. **Intent-first extraction**
   - Cards should describe the real task, not just the first prompt.
2. **Lineage-aware deduplication**
   - Older sessions can be represented by a newer card instead of appearing as duplicate active cards.
3. **Human override lock**
   - Moving a card or changing status makes the human decision authoritative.
4. **Inspectable extraction**
   - Detail panels show evidence, extraction timeline, suppressed sessions, and debug hints.

## Recommended review flow

1. Open a card.
2. Check `Why this card exists`.
3. Check `Evidence categories` and `Extraction debug` if the title/body looks suspicious.
4. Move it to the right status.
5. Export overrides if you want to preserve manual decisions outside localStorage.

## Status policy

The board intentionally uses a review-oriented status order:

- `Need Review`: human review or post-work verification needed.
- `Pending`: valid task, but not active now.
- `In Progress`: AI/human work loop is active, including AI-driven review/fix loops.
- `Blocked`: external auth, credentials, environment, or user action is blocking progress.
- `Done`: completed archive.
- `Dropped`: intentionally not pursuing.

## Keyboard shortcuts

- `j` / `k`: select next/previous visible card
- `Alt+↑` / `Alt+↓`: reorder selected card inside the same column
- `1-6`: move selected card to a status
- `c`: copy selected session id

Shortcuts are disabled while typing in inputs or textareas.

## Public vs personal mode

This public demo is generated from sample fixture data only.

Personal/local builds can use real session summaries, but should stay private unless sanitized.

## Downloadable artifact

If GitHub Pages is unavailable, download the `codex-session-kanban-demo` artifact from the latest successful Actions run and open `index.html`. See [Downloadable artifact usage](./ARTIFACT_USAGE.md).

## Testing the demo

For repeatable checks, use the smoke tests instead of manual browser review only:

- static artifact smoke: verifies embedded data, docs, mount points, and distribution safety
- browser smoke: verifies visible UI, language switch, candidate promotion, human lock, session id, and status controls

See [Testing guide](./TESTING.md).
