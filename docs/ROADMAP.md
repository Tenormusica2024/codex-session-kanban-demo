# Roadmap

Codex Session Kanban should grow around one core wedge:

> turn long AI coding sessions into deduplicated, reviewable task candidates with human override locks.

This roadmap intentionally avoids turning the project into a generic Kanban, cloud PM service, or agent runner.

## Current status

The public fixture demo currently includes:

- static GitHub Pages demo
- fixture-only public data
- candidate staging and explicit promotion
- human override lock for manual status/order decisions
- intent-first task/card summaries
- lineage-aware grouping and suppressed predecessor display
- evidence, extraction timeline, quality audit, and debug panels
- local session JSON import and validation report
- override export/import
- Japanese/English UI mode
- static artifact smoke and Playwright browser smoke
- one-command release checks
- local update helper for fixture refresh, browser smoke, optional package smoke, and manual/Task Scheduler use

## Near-term focus

### 1. Extraction quality

Improve how cards are titled and summarized when sessions include:

- preflight phrases such as "check progress" or "review this"
- setup/tooling detours
- multiple topics inside one session
- old context that is only safe to suppress after newer context reconciles it

The goal is to reduce cards that look like raw prompts or vague review requests.

### 2. Lineage clarity

Make it easier to understand:

- why a newer card represents older sessions
- which sessions were suppressed
- whether related sessions are same-lineage or parallel tasks inside the same project

This should remain an explanation layer, not a full dependency graph.

### 3. Personal/local workflow

Keep improving the static/local workflow before adding backend features:

- safer import validation
- clearer override backup/restore
- better local release checks
- better docs for keeping real session data private

### 4. Public demo quality

Keep the fixture demo useful without exposing private data:

- maintain representative synthetic examples
- cover topic conflict, same-repo parallel tasks, and provider import/display examples
- keep screenshots current
- keep release notes and smoke tests aligned
- keep onboarding concise

## Candidate future work

These are useful, but should be implemented only if they strengthen the core review workflow.

- Lightweight token/session stats if they help prioritization
- More provider import compatibility for Claude Code, Gemini, Cursor, etc.
- Better fixture examples for topic conflict and cross-session lineage
- Optional Task Scheduler recipe refinements for personal/private imports
- More keyboard-first triage actions
- Better mobile/narrow-width layout polish

## Deferred by default

These may be valuable in other products, but are not the current wedge:

- cloud sync/account system
- team/multiplayer features
- spawning/resuming agents from the board
- SSH/multi-server monitoring
- heavy cost analytics dashboard
- replacing Jira/Plane/Vibe Kanban
- credential-heavy deployment automation

## Contribution filter

Before implementing a new feature, ask:

1. Does it improve task review, extraction quality, lineage clarity, or human override safety?
2. Can it work in static/local mode?
3. Does it preserve fixture-only public distribution?
4. Can it be explained in one sentence?
5. Does it avoid making the UI noisier than the review task requires?

If not, keep it as a backlog idea rather than adding it to the public demo.
