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
- provider import normalization for lightweight Claude Code / Cursor / Gemini-style JSON shapes
- lightweight prioritization stats for estimated text size, high-activity signals, and large-session signals
- private scheduled refresh recipe for local real-session builds
- provider import diagnosis for observed export shapes
- fixture coverage diagnosis for behavior-driven sample additions

## Near-term focus

The initial public-demo hardening pass is largely complete. Next work should be more selective and evidence-driven rather than adding generic Kanban features.

### 1. Extraction quality maintenance

Do not add more synthetic fixture cases by default. Run `npm run fixture:coverage` first, then add fixtures only when a new real misclassification appears, such as:

- a new topic-conflict pattern
- a same-repo parallel task that incorrectly merges
- a predecessor session that is suppressed without enough newer context
- a provider export shape that loses title/body/status evidence

### 2. UI polish by evidence

Keyboard and desktop/mobile/narrow smoke coverage now exists. Further UI work should be triggered by screenshots, smoke failures, or a specific manual-review bottleneck.

## Candidate future work

These are useful, but should be implemented only if they strengthen the core review workflow.

1. More keyboard-first triage actions when they remove a real drag/click bottleneck.
2. More fixture examples only when coverage diagnosis or a real misclassification shows a new extraction/lineage failure mode.
3. Further mobile/narrow-width polish only when screenshots or smoke tests reveal a concrete regression.
4. Provider mappings only after diagnosis of real export samples shows a stable new field shape.
5. Optional Task Scheduler refinements only after the private recipe is used in practice.
6. Lightweight prioritization-stat refinements only if the rough signals become noisy or insufficient.

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
