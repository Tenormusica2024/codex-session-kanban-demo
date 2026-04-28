# Competitive Positioning

Codex Session Kanban is not trying to be only another live AI-agent dashboard. Several strong tools already cover live monitoring, process status, agent orchestration, token/cost analytics, and VS Code or desktop integration.

This project is positioned around a narrower problem:

> Convert messy, long-running AI coding sessions into reviewable task candidates, while preserving the human's manual judgment as the source of truth.

## Core differentiation

### 1. Intent-first task extraction

The board should avoid blindly using the first prompt, latest raw message, or a generic "check progress" phrase as the task. It should infer the actual work intent from the session context and produce:

- a task-like title
- a concise task summary
- the next useful review action
- evidence for why the task belongs in its suggested status

This is the main difference from simple transcript viewers or session-summary dashboards.

### 2. Topic conflict decomposition

A single session can contain setup checks, side investigations, browser/tooling detours, and the actual project task. The extraction flow should separate:

- preflight / environment checks
- resolved setup blockers
- side quests
- the current main task
- genuine parallel tasks inside the same project

The goal is to avoid creating cards whose title only says "content check", "difference review", or "progress confirmation" when the real task is more specific.

### 3. Cross-session task lineage

The board should compare related sessions and suppress stale predecessors when a newer session clearly continues or supersedes the same task.

This is intentionally different from showing every session as a separate card. The useful unit is the current task candidate, not the raw session file.

### 4. Human override lock

When the user moves or edits a card, that manual judgment must be treated as authoritative. Future AI sync may suggest changes, but it should not silently revert the user's board decisions.

This makes the tool suitable for "AI secretary suggests, human curates" workflows.

### 5. Static, privacy-aware distribution

The public build is fixture-only and can be hosted as static HTML on GitHub Pages. Real local `.codex` logs and private data are intentionally excluded from the public demo.

## Competitor strengths worth learning from

These are not all direct competitors, but they show useful patterns to borrow.

| Area | Tools showing the pattern | What to consider adopting |
| --- | --- | --- |
| Live refresh / file watching | Claudine, claude-kanban | Optional local watcher for personal mode; keep public demo static |
| Full-text search | Claudine, session viewers | Search across title, summary, repo, evidence, and session id |
| Archive / restore | Claudine | Collapsible Done/Dropped archive so old cards do not dominate the board |
| Multi-provider support | Claudine, claude-kanban, Kangentic, agtx | Keep Codex-first, but make provider labels/data schema extensible |
| Agent handoff context | Kangentic, agtx | Reuse as inspiration for task lineage and successor/predecessor explanations |
| Usage/cost analytics | Claude Deck, Claude analytics tools, session-report | Add lightweight token/session stats only if it helps prioritization |
| Alerts / needs-input | Claudine, live dashboards | Distinguish "needs review" from "blocked by user input" more clearly |
| Export/import | Claudine | Keep override JSON export/import and make it prominent |
| Keyboard navigation / reorder | agtx | Improve fast triage: move up/down, status shortcuts, focus mode |
| Bilingual/localized UI | Claudine | Maintain Japanese personal mode and English public demo mode |

## What not to copy by default

The project should avoid drifting into a heavy all-in-one agent runner unless there is a clear need.

Lower priority for this project:

- spawning agents from the board
- managing tmux sessions
- remote SSH server control
- replacing Vibe Kanban / Plane / Jira
- deep cost analytics as the main feature
- account-based cloud service

Those are valuable, but they are not the current wedge.

## Public positioning draft

Short version:

> A static, privacy-aware Kanban review surface that turns long AI coding sessions into deduplicated task candidates with human override locks.

Longer version:

> Codex Session Kanban reads recent AI coding session summaries and builds a reviewable board of current task candidates. It focuses on intent-first task extraction, topic-conflict handling, cross-session lineage, and human override locks, so the board reflects what you actually need to review next instead of every raw session transcript.

## Near-term product priorities

1. Improve extraction quality before adding more dashboard features.
2. Make stale predecessor suppression explainable.
3. Make manual override behavior obvious in the UI.
4. Keep public demo fixture-only and safe to host.
5. Add competitor-inspired convenience features only when they support fast task review.

## Reference examples checked

- Claudine: https://claudine.pro/
- claude-kanban / Code Agent Kanban: https://pypi.org/project/claude-kanban/
- Kangentic: https://kangentic.com/
- agtx: https://github.com/fynnfluegge/agtx
- Claude Deck: https://claudedeck.org/
- Anthropic session-report plugin: https://claude.com/plugins/session-report
