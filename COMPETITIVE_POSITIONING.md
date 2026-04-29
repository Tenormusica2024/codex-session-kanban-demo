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

## Competitor-inspired adoption backlog

This section is intentionally practical: features that can be borrowed without changing the core wedge of intent-first session-to-task extraction.

### P0 — high leverage, low/medium cost (implemented in the public demo)

1. **Explain why a card exists**
   - Borrowed pattern: dashboards show status/progress, but usually not enough rationale.
   - Adaptation: each card should expose compact evidence: source sessions, latest decisive message, stale-predecessor suppression, and why the suggested status was chosen.
   - Why it matters: makes the extraction engine trustworthy and reduces manual re-reading.
   - Cost: medium; mostly data-shape/UI work.

2. **Stale predecessor / successor badges**
   - Borrowed pattern: Kangentic/Vibe emphasize handoff and task continuity.
   - Adaptation: show "superseded by newer session" or "merged into current task" rather than silently hiding old sessions.
   - Why it matters: directly strengthens cross-session lineage, the main differentiator.
   - Cost: medium.

3. **Needs-input vs needs-review split**
   - Borrowed pattern: Claudine has needs-input/question detection; agent dashboards often distinguish user attention from ordinary review.
   - Adaptation: keep columns simple, but add a badge/filter for "needs user answer", "needs browser/login", "needs deployment credentials", etc.
   - Why it matters: avoids mixing human decision blockers with normal review tasks.
   - Cost: low/medium.

4. **Search across evidence, not only title**
   - Borrowed pattern: Claudine full-text search.
   - Adaptation: search title, task summary, repo, cluster, session id, evidence snippets, and hidden lineage notes.
   - Why it matters: high utility for almost no conceptual risk.
   - Cost: low.

5. **Done/Dropped archive collapse**
   - Borrowed pattern: Claudine auto-archive; Kanban tools hide completed work.
   - Adaptation: compact Done/Dropped by default with expand-on-demand and counts.
   - Why it matters: keeps active review surface small.
   - Cost: low.

6. **Backlog/promote flow for candidates**
   - Borrowed pattern: Kangentic backlog + batch promote; Vibe issue/workspace separation.
   - Adaptation: keep "Kanban追加候補" as a staging backlog; fixed/manual cards disappear from candidate list; allow promote to chosen status.
   - Why it matters: matches the user's review workflow and avoids duplicate cards.
   - Cost: low/medium.

### P1 — strong, but should not distract (mostly implemented / evidence-driven now)

7. **Parent/child or linked task relation**
   - Borrowed pattern: Vibe issue parent/child relationships and sub-issues.
   - Adaptation: use only for lineage/decomposition display, not full project management.
   - Why it matters: helps when one large project legitimately has multiple parallel tasks.
   - Cost: medium.

8. **Activity timeline per card**
   - Borrowed pattern: Kangentic activity log and Vibe workspace logs.
   - Adaptation: show extracted decision points instead of raw terminal logs.
   - Why it matters: lets the user inspect why the card changed over time.
   - Cost: medium/high.

9. **Keyboard triage shortcuts**
   - Borrowed pattern: TUI/agent dashboards prioritize fast triage.
   - Adaptation: focused card + shortcuts for move left/right, up/down, promote, archive, copy session id.
   - Why it matters: faster than drag for personal Kanban review.
   - Cost: medium.

10. **Import/export presets**
    - Borrowed pattern: Claudine export/import; Kangentic imports issues/projects.
    - Adaptation: keep local override JSON, but add clear backup/restore and fixture export.
    - Why it matters: improves trust before cloud sync exists.
    - Cost: low.

11. **Provider/schema extensibility**
    - Borrowed pattern: Vibe/Kangentic support many agents.
    - Adaptation: do not become a multi-agent runner; just make session source/provider labels extensible.
    - Why it matters: future-proofs for Claude Code, Codex, Gemini, Cursor logs.
    - Cost: medium.

### P2 — attractive, but lower priority for this product

12. **Diff/review panel**
    - Borrowed pattern: Vibe built-in diffs and PR-like review.
    - Reason to delay: this project is a session-to-task review surface, not a code review orchestrator.

13. **Agent spawn/resume from Kanban**
    - Borrowed pattern: Vibe/Kangentic drag-to-run agents.
    - Reason to delay: high scope and security/credential implications; weakens static/privacy-first positioning.

14. **Remote server/SSH monitoring**
    - Borrowed pattern: claude-kanban multi-server monitoring.
    - Reason to delay: useful later, but not needed for the public fixture/static wedge.

15. **Deep token/cost analytics**
    - Borrowed pattern: Claude Deck/session-report style analytics.
    - Reason to delay: only add lightweight stats if they improve prioritization.

## Recommended next implementation order

The original P0/P1 adoption pass is now largely implemented in the public demo. Future work should be evidence-driven rather than parity-driven:

1. **Extraction quality maintenance**: add fixture coverage only when a real misclassification or lineage error appears.
2. **UI/keyboard polish**: add shortcuts or controls only when manual review exposes a concrete bottleneck.
3. **Provider mapping refinements**: extend normalization only after diagnosing a real export shape.
4. **Private scheduled-refresh refinements**: improve the local/private recipe after it is used in practice.
5. **Lightweight prioritization tuning**: adjust rough local signals only if they become noisy or insufficient.

Already adopted from the competitor scan:

- candidate staging and explicit promotion
- card-existence rationale and extraction evidence
- needs-input badges/filters
- Done/Dropped archive collapse
- evidence-aware search
- stale predecessor / lineage display
- related task display for legitimate same-repo parallel work
- extraction timeline and debug panels
- keyboard-first triage and handoff-copy shortcuts
- override export/import guidance
- lightweight provider/schema extensibility

The main rule remains: borrow workflow affordances, not the entire agent-orchestration product category.

## Implementation backlog

The active implementation checklist is maintained in [PRODUCT_TODO.md](./PRODUCT_TODO.md). Use it to decide whether a competitor-inspired feature strengthens or dilutes the product wedge.

