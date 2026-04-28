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

Status:
- Extended with an initial candidate review panel: the UI now summarizes open candidates, fixed candidates, quality-review cards, and multi-session representatives before/after promotion. Candidate click now opens a detail preview without fixing it to the board; only explicit target-column promotion creates the human override lock.

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
- Strengthened implementation added: representative cards with multiple related sessions now show a lineage badge, detail-panel lineage note, suppressed predecessor sessions, and the reason why the current card is the representative. This exposes merged/represented sessions from existing cluster data without inventing hidden successor links.

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

Status:
- Initial implementation added: the detail panel now shows first seen, latest decisive evidence, merged/represented sessions, and manual override timing so extraction decisions can be debugged without raw transcript rereading.

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

### 8.5 Evidence categorization drilldown

Status:
- Initial implementation added: detail view groups evidence into intent/goal, decision/policy, blocker/waiting, next action, output/change, and other. This helps review whether a title/body was derived from the real task instead of a preflight phrase.

Goal:
- Let users inspect what kind of evidence drove a card without reading the raw transcript.
- Make misclassification easier to debug before changing extraction rules.

Why:
- Higher return than generic PM features because it directly improves trust in session-to-task extraction.

Risk to avoid:
- Keep this as a detail-only explanation layer; do not overfit extraction from keyword buckets alone.

### 8.6 Extraction rule debug panel

Status:
- Initial implementation added: detail view now shows title source, body source, downweighted preflight/topic signals, and triggered extraction rules.

Goal:
- Make it clear why a card title/body was generated without exposing full transcripts.
- Help detect when extraction was pulled toward a preflight phrase instead of the actual task.

Why:
- This is a high-return differentiator because it makes the intent-first extraction process inspectable.

Risk to avoid:
- Keep it explanatory. Do not make keyword buckets the only extraction mechanism.

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

### 12. Public onboarding and import docs

Status:
- Initial implementation added: README now links a demo usage guide and import schema. The Pages workflow is also configured to deploy on push for public repositories using GitHub Actions Pages.

Goal:
- Help new users understand that this is a session-to-task extraction review surface, not a generic Kanban.
- Provide a safe fixture/import shape for public distribution and future provider adapters.

Why:
- Public distribution needs clear docs before broader packaging.

Risk to avoid:
- Do not encourage publishing real `.codex` logs or private paths.

### 13. Public demo fixture coverage

Status:
- Initial implementation added: sample fixture now includes six sessions covering static review surface lineage, suppressed predecessor handling, topic-shift decomposition, needs-input/blocker deployment, completed knowledge review, and external sink rescoping.

Goal:
- Make the public demo demonstrate the product wedge without private data.

Why:
- A stronger fixture makes intent-first extraction, lineage, blocker handling, and candidate promotion understandable to first-time users.

Risk to avoid:
- Keep sample data synthetic and fixture-only; never use personal `.codex` logs in the public demo.

### 14. Local session JSON import

Status:
- Extended implementation added: the static UI can import a local sessions JSON file, derive minimal task clusters/candidates when they are missing, show an import validation report for missing required fields, invalid statuses, duplicate IDs, invalid timestamps, broken related-session references, and possible private-data signals, then reset back to the embedded demo fixture. The toolbar also provides sample JSON copy/download and a schema-docs link. Overrides remain localStorage-based and separate from imported session data.

Goal:
- Let users try their own sanitized/exported session data without rebuilding the HTML.

Why:
- This makes the public demo more useful as a distributable local tool while preserving fixture-only public hosting.

Risk to avoid:
- Do not persist imported private session data into public builds or remote storage.

### 15. Strict fixture validation script

Status:
- Initial implementation added: `codex_session_review/validate_session_data.py` validates required fields, status enums, duplicate IDs, timestamps, broken related-session references, and privacy-like signals. The GitHub Pages workflow now runs it with `--distribution` before building the public fixture.

Goal:
- Prevent unsafe or malformed fixture data from being published.

Why:
- This protects the public/private split and makes the repository safer to use as a distributable demo.

Risk to avoid:
- Keep validation conservative enough to catch real leaks without blocking harmless project names such as `openclaw-secretary`.

### 16. Public release checklist

Status:
- Initial implementation added: `docs/PUBLIC_RELEASE_CHECKLIST.md` captures data-safety, build, demo-quality, GitHub Pages/artifact, and positioning checks. README and GitHub distribution docs now link/reflect the current public Pages workflow.

Goal:
- Make public release preparation repeatable and safe.

Why:
- The main risk of a public demo is accidentally weakening the private/public split or publishing a fixture that does not show the product wedge.

Risk to avoid:
- Do not treat the checklist as a replacement for `--distribution` validation; use both.

### 17. README screenshots

Status:
- Initial implementation added: README now includes generated screenshots for board overview and card detail/extraction evidence. Screenshots live under `docs/assets/` and should be regenerated after major UI changes.
- Follow-up refreshed both screenshots from the current fixture UI after README/release polish.

Goal:
- Make the public demo value understandable visually without requiring the reader to run it first.

Why:
- The product wedge is easier to understand when lineage, evidence, and review UI are visible.

Risk to avoid:
- Keep screenshots generated from public fixture data only.

### 18. Pages/artifact docs packaging

Status:
- Initial implementation added: fixture/distribution builds now copy public `docs/` into the output folder, package zips include docs, and the GitHub Pages workflow copies docs so in-app schema links work on the public site/artifact. Workflow path triggers now include README/docs changes.

Goal:
- Keep public demo links functional in GitHub Pages, local fixture builds, and downloadable artifacts.

Why:
- Import/schema documentation is part of the product onboarding, so it must ship with the static demo.

Risk to avoid:
- Only copy public docs/assets; never copy personal/local session data.

### 19. Artifact usage guide

Status:
- Initial implementation added: `docs/ARTIFACT_USAGE.md` explains how to download the GitHub Actions artifact, open `index.html`, import local session JSON, preserve overrides, reset demo data, and avoid publishing private logs. README, demo usage docs, and release checklist link/check this path.

Goal:
- Make the non-Pages distribution path understandable for users.

Why:
- GitHub Pages can depend on repo visibility/plan/settings, so the artifact fallback must be first-class.

Risk to avoid:
- Do not imply artifact use makes private data safe to publish; it is local/offline unless the user shares it.

### 20. Fixture input enrichment and EN smoke check

Status:
- Initial implementation added: `build_review_surface.py --input-json` now enriches fixture/session JSON with task clusters, suggested tasks, and quality report when those sections are missing. EN-mode smoke check was run against the built fixture; remaining Japanese text is limited to the language-switch label.

Goal:
- Ensure public fixture JSON renders meaningful candidates/board state instead of an empty board, and keep English demo output reasonably clean.

Why:
- Public fixture data may be hand-authored, so the builder should fill derived review structures consistently.

Risk to avoid:
- Do not mutate source fixture files during build; enrichment happens in the output bundle.

### 21. Architecture docs and Node 24 workflow opt-in

Status:
- Initial implementation added: `docs/ARCHITECTURE.md` documents the static-first data flow, public/private repository boundary, personal/private workflow, build modes, and backend deferral rationale. The Pages workflow now opts into Node 24 for JavaScript actions to address the GitHub Actions Node 20 deprecation warning.

Goal:
- Make the public/private split and build architecture explicit, and keep CI ahead of upcoming runner deprecations.

Why:
- The project is useful only if users can trust that public fixture distribution and private session review remain separated.

Risk to avoid:
- Do not imply that importing local session JSON into the browser makes it safe to commit or publish.

### 22. Public artifact smoke test

Status:
- Initial implementation added: `codex_session_review/smoke_public_build.py` checks the generated public HTML for embedded sessions, task clusters, suggested tasks, required UI mount points, bundled docs, distribution mode, and private-data signals. The GitHub Pages workflow now runs this after building the public fixture and before artifact upload/deploy.

Goal:
- Catch regressions where the public demo build is valid JSON but effectively empty or missing key documentation.

Why:
- The public artifact is the main distribution path when Pages or hosting settings are unstable, so it needs a fast build-level sanity check.

Risk to avoid:
- Keep this as a cheap artifact smoke test, not a full browser/E2E test that slows down every push.

### 23. Browser operation and visible text smoke test

Status:
- Initial implementation added: `codex_session_review/smoke_browser_surface.mjs` and npm scripts for Pages/local HTML browser checks. The test loads the page with Playwright, verifies board/candidate/detail mount points, switches to English, checks common static UI labels are translated, promotes one candidate into the board, and verifies the resulting card/detail/human-lock controls. Follow-up docs added `docs/TESTING.md`, README links, demo guide links, and release checklist steps so the test path is discoverable.

Goal:
- Make browser operation and visible text regressions testable without requiring CiC for every run.

Why:
- The product is UI-heavy; static HTML validation alone cannot catch broken rendering, missing buttons, language-mode regressions, or candidate promotion failures.

Risk to avoid:
- Do not put this heavy browser check on every Pages deploy until CI cost/time is intentionally accepted. Use it as local/pre-release smoke first; keep CiC for logged-in or subjective visual review.

### 24. One-command public release checks

Status:
- Initial implementation added: `codex_session_review/run_public_release_checks.ps1` runs public fixture validation, distribution build, static artifact smoke, Python compile checks, local browser smoke, and optionally Pages static/browser smoke. README, testing docs, and release checklist now point to this command. Follow-up docs updated internal distribution notes (`codex_session_review/README.md`, `DISTRIBUTION_BUILD.md`, `GITHUB_DISTRIBUTION.md`) so older distribution instructions no longer omit smoke/browser checks.

Goal:
- Make pre-release verification easy enough to run before every public update.

Why:
- The project now has multiple cheap and browser-level checks; a single entry point reduces skipped verification and makes future contributors less likely to publish an empty or broken demo.

Risk to avoid:
- Keep this as a local/pre-release helper. Do not hide individual commands or make CI unexpectedly slow.

### 25. Release-check npm shortcuts and pinned browser dependency

Status:
- Initial implementation added npm shortcuts `release:check` and `release:check:pages`, pinned Playwright to the locked version, and documented the shortcuts in README/testing/distribution docs.

Goal:
- Make the public-release validation path discoverable for users who start from `package.json` or npm scripts.

Why:
- The project now has a browser smoke dependency. Pinning and exposing scripts reduces accidental version drift and makes local verification easier to run.

Risk to avoid:
- Keep npm scripts as wrappers around the canonical PowerShell release check, not a second divergent test path.

### 26. Public OSS repository hygiene

Status:
- Initial implementation added MIT `LICENSE`, `CONTRIBUTING.md`, and `SECURITY.md`, plus README/release-checklist links. The contribution/security docs emphasize fixture-only public data and local/private handling of real session logs.

Goal:
- Make the public repository usable and safer for external readers or contributors.

Why:
- Publicizing the project is part of the direction, and a public repo without license/contribution/security guidance is ambiguous.

Risk to avoid:
- Keep these docs aligned with the privacy boundary; do not encourage users to upload real `.codex` logs to the public repo.

### 27. Public release metadata and issue intake hygiene

Status:
- Initial implementation added package metadata, a first `CHANGELOG.md`, and GitHub issue templates for bug reports and feature requests. Issue templates explicitly warn against posting private logs, local paths, or secrets.

Goal:
- Make the public repo easier to understand, install for tests, and receive safe feedback.

Why:
- Once public, bug/feature intake should reinforce the same fixture-only/privacy boundary as the app and docs.

Risk to avoid:
- Do not encourage generic feature requests that pull the project away from session-to-task review.

### 28. Public README positioning and quick start

Status:
- Initial implementation added a stronger README opening, target-user section, privacy stance, public-demo fast path, and quick start commands. Demo usage docs now start with a short guided review flow.

Goal:
- Help first-time visitors understand what the project is, who it is for, and what to click first.

Why:
- The project is differentiated by extraction/lineage/review behavior, not by being another Kanban. The README should make that clear before listing implementation details.

Risk to avoid:
- Keep the pitch accurate: this is a static fixture demo and local/private review tool, not a hosted task-management service.

### 29. README badges and release link

Status:
- Initial implementation added README badges for GitHub Pages, latest release, MIT license, and static/privacy-aware positioning, plus a direct release section linking to v0.1.0 and the changelog.
- Follow-up changed the README release link to GitHub's latest-release URL and added `CHANGELOG.md` notes for v0.1.1 so patch releases do not leave README stale.

Goal:
- Make the public repo landing page look complete and help users immediately find the demo, release, license, and architecture stance.

Why:
- After creating the first public release, the README should expose that release and the demo without requiring users to search GitHub UI.

Risk to avoid:
- Keep badges informational only; do not imply hosted cloud service functionality.

### 30. Package version alignment

Status:
- Initial implementation aligned `package.json` / `package-lock.json` with the public release stream and added `CHANGELOG.md` notes for v0.1.2.
- Follow-up aligned metadata and changelog for v0.1.3 after screenshot refresh and Pages smoke recheck.

Goal:
- Avoid confusing users who inspect npm metadata after the GitHub release has advanced.

Why:
- Even though this is a private/non-published package, the version is visible in the public repo and should not lag behind the release notes.

Risk to avoid:
- Do not imply npm package publishing; package metadata is for local tooling and repo clarity.

### 31. Public roadmap

Status:
- Initial implementation added `docs/ROADMAP.md` and linked it from README and CONTRIBUTING.

Goal:
- Make future direction clear without implying that broad PM/cloud/agent-runner features are next.

Why:
- Public contributors and future readers need a positive roadmap and an explicit deferral boundary.

Risk to avoid:
- Keep the roadmap focused on session-to-task extraction, lineage clarity, human override safety, and static/private distribution.

### 32. Pull request safety template

Status:
- Initial implementation added `.github/PULL_REQUEST_TEMPLATE.md` and linked the expected checklist from CONTRIBUTING and the public release checklist.

Goal:
- Make future changes pass through product-fit, privacy, fixture-safety, and release-check prompts before merge.

Why:
- The repo now accepts public issue/feature intake. PR intake should preserve the same guardrails and reduce accidental scope creep or private-data exposure.

Risk to avoid:
- Keep the template lightweight; it should guide safe contributions, not become process-heavy.

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
