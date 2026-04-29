# Changelog

All notable public-demo changes are tracked here.

This project is still pre-1.0. Entries focus on public distribution, fixture safety, and the session-to-task review workflow.

## 0.1.33 - 2026-04-29

### Added

- Public and local builds now embed `app_version` from `package.json` into the review payload and display it in the hero build pill.
- Static and browser smoke checks now fail if the embedded app version is missing.

## 0.1.32 - 2026-04-29

### Changed

- Competitive positioning now reflects that the initial P0/P1 competitor-inspired adoption pass is largely implemented.
- Replaced the stale implementation-order list with the current evidence-driven maintenance order.

## 0.1.31 - 2026-04-29

### Changed

- Demo usage docs now list the full board/candidate keyboard shortcut set, including search, guide, filter reset, candidate promotion, and card-brief copy.
- README quick demo flow now points users to keyboard-first triage and handoff-copy actions.

### Fixed

- Corrected duplicate numbering in the demo behavior list.

## 0.1.30 - 2026-04-29

### Added

- Keyboard shortcut `b` copies the selected card brief, matching the detail-panel copy-card-brief action.
- Browser smoke coverage verifies the card-brief keyboard shortcut.

### Changed

- The workflow guide now documents the card-brief shortcut so handoff summaries can be copied without opening the detail action row.

## 0.1.29 - 2026-04-29

### Added

- Detail view includes a copy-card-brief action with title, status, repo, session id, summary, next action, reason, related-session count, and compact evidence.
- Browser smoke coverage for copied card briefs.

### Changed

- Selected cards are easier to hand off to another AI/chat or save into notes without copying the whole board state.

## 0.1.28 - 2026-04-29

### Added

- Selected board cards now sync to a `#session=...` URL hash so refreshes and copied links return to the same card.
- Detail view includes a copy-card-URL action.
- Browser smoke coverage for selected-card hash updates and copied card links.

### Changed

- Card review state is easier to resume or share without relying only on session-id copy.

## 0.1.27 - 2026-04-29

### Added

- Candidate review summary cards now provide quick filters for open candidates, extraction quality review, and multi-session lineage review.
- Browser smoke coverage for candidate-review quick filtering.

### Changed

- The candidate review panel is now an actionable triage entry point instead of a read-only summary.

## 0.1.26 - 2026-04-29

### Added

- Expanded the attention filter with quality-review, multi-session lineage, and high-activity/large-session options.
- Browser smoke coverage for attention-based quality filtering and `x` reset behavior.

### Changed

- Reviewers can now jump directly to extraction-risk or lineage-heavy cards without adding new Kanban columns.

## 0.1.25 - 2026-04-29

### Added

- Filter result summary showing visible board cards, open candidates, and whether filters are active.
- Browser smoke coverage for filter-summary updates after search.

### Changed

- Candidate/board filtering is now easier to confirm at a glance before clearing or promoting candidates.

## 0.1.24 - 2026-04-29

### Added

- Candidate staging now respects the same search/repo/status/cluster/attention filters as the board.
- Browser smoke coverage verifies that search narrows the candidate list, not only board cards.

### Changed

- Filter reset now explicitly resets both board and candidate filters.

## 0.1.23 - 2026-04-29

### Added

- Clear-filters control and `x` shortcut for resetting search/repo/status/cluster/attention filters during review.
- Browser smoke coverage for both the clear-filters button and shortcut.

### Changed

- Workflow guide shortcut copy now documents filter reset behavior.

## 0.1.22 - 2026-04-29

### Added

- Keyboard polish for faster review: `/` focuses search, `?` toggles the workflow guide, and `Esc` closes it.
- Browser smoke coverage for search and guide keyboard shortcuts.
- Release-check step wrapper now fails on non-zero native command exits.

### Changed

- Workflow guide shortcut copy now documents search/guide shortcuts in both Japanese and English.

## 0.1.21 - 2026-04-29

### Added

- Fixture coverage diagnosis script for behavior-driven public sample maintenance.
- npm shortcut `fixture:coverage` and release-check coverage for fixture behavior diagnosis.
- Fixture coverage guide documenting when to add or avoid new synthetic sessions.

### Changed

- Roadmap and product TODO now make fixture additions coverage-first instead of volume-driven.

## 0.1.20 - 2026-04-29

### Added

- Provider import diagnosis script for observed real-world export shapes.
- npm shortcut `provider:diagnose` and release-check coverage for provider diagnosis.
- Provider adapter review guide that keeps future mappings diagnosis-first and import/display-only.

### Changed

- Import schema and testing docs now show the diagnosis step before adding broader provider compatibility claims.

## 0.1.19 - 2026-04-29

### Added

- Private real-session refresh helper `update_private_review.ps1` that writes to a git-ignored local output directory.
- npm shortcuts `private:update`, `private:update:open`, and `private:update:full`.
- Private scheduled refresh documentation with Windows Task Scheduler setup, output paths, and override backup/restore guidance.

### Changed

- Roadmap and product TODO now move private scheduling from near-term implementation to practical-use refinement.

## 0.1.18 - 2026-04-29

### Added

- Lightweight prioritization stats for review triage: estimated local text units, high-activity signals, and large-session signals.
- Card/detail UI badges and a detail-panel stats block for quickly spotting heavier sessions without adding cost analytics.

### Changed

- Public release smoke now checks that lightweight prioritization stats are visible after candidate promotion.

## 0.1.17 - 2026-04-29

### Changed

- Refreshed roadmap and product TODO to reflect the completed public-demo hardening pass.
- Reordered remaining work around lightweight prioritization stats, private scheduled workflow docs, real provider samples, and evidence-driven fixture/UI additions.

## 0.1.16 - 2026-04-29

### Added

- Narrow viewport smoke mode for 320px-wide review checks.
- npm shortcuts for narrow smoke against local fixture and deployed Pages URL.

### Changed

- Release checks now include narrow viewport browser smoke.
- Tightened ultra-narrow CSS spacing, column/dropzone heights, card actions, and buttons to avoid cramped phone-width layouts.

## 0.1.15 - 2026-04-29

### Added

- Expanded public fixture coverage with cross-session predecessor/representative lineage for provider import normalization.
- Added a topic-conflict fixture where login/Pages testing context is downweighted in favor of the actual mobile review controls task.

### Changed

- Public fixture now contains 11 synthetic sessions and demonstrates 9 task clusters.

## 0.1.14 - 2026-04-29

### Added

- Candidate-list keyboard triage: focus candidates with `j/k`, preview with `Enter`, and promote the selected candidate with `a`.
- Browser smoke coverage for candidate keyboard preview and promotion.

### Changed

- Guide copy now documents candidate-list shortcuts separately from board-card shortcuts.

## 0.1.13 - 2026-04-29

### Added

- Provider import normalization for lightweight Claude Code / Cursor / Gemini-style JSON shapes.
- Provider-native sample import fixture and schema documentation for accepted aliases.
- Release checks now include a provider import normalization smoke test.

## 0.1.12 - 2026-04-29

### Added

- Local update helper for refreshing the fixture snapshot, running static/browser smoke checks, optionally opening the generated HTML, and optionally package-smoking the downloadable zip.
- npm shortcuts for local update workflows: `local:update`, `local:update:open`, and `local:update:full`.
- Local update helper documentation with Task Scheduler command examples.

## 0.1.11 - 2026-04-29

### Added

- Public fixture examples for:
  - same-repo parallel task separation
  - non-Codex provider import/display metadata via a Claude Code-style sample

### Changed

- Import schema docs now document provider metadata fields and the current `schema_version`.
- README/demo/roadmap docs now call out same-repo parallel task handling.

## 0.1.10 - 2026-04-29

### Changed

- Browser smoke now exercises keyboard triage after candidate promotion:
  - number shortcut moves the selected card to `In Progress`
  - selected card remains visible
  - human-lock marker remains present
  - copy shortcut targets the selected `session_id` when the clipboard shim is available
- Testing and distribution docs now mention keyboard-triage smoke coverage.

## 0.1.9 - 2026-04-29

### Changed

- Updated GitHub Actions dependencies to current major versions that run on newer Node runtimes:
  - `actions/checkout@v6`
  - `actions/setup-python@v6`
  - `actions/upload-pages-artifact@v5`
  - `actions/upload-artifact@v7`
  - `actions/deploy-pages@v5`

## 0.1.8 - 2026-04-29

### Added

- Downloadable distribution package smoke test for the zipped public demo artifact.
- npm shortcuts for building and smoke-testing the local distribution package.

### Changed

- Release checks now build and smoke-test the downloadable package in addition to the static HTML and browser checks.
- GitHub Actions now uploads a tested `codex-session-kanban-demo.zip` artifact instead of a raw folder artifact.
- Artifact/distribution docs now explain the tested inner zip path.

## 0.1.7 - 2026-04-29

### Changed

- One-command release checks now run both desktop and mobile local browser smoke by default.
- Pages smoke mode now verifies both desktop and mobile deployed URLs.
- Manual GitHub Actions browser smoke now runs both desktop and mobile checks against the built artifact.
- Release/check documentation now reflects the mobile smoke path.

## 0.1.6 - 2026-04-29

### Added

- Mobile/narrow-viewport browser smoke mode for local fixture and deployed Pages checks.
- Mobile overview/detail screenshots for public visual regression review.

### Changed

- Tightened small-screen spacing, card wrapping, toolbar actions, and single-column review panels to avoid horizontal overflow.
- Testing guide now documents the mobile smoke commands.

## 0.1.5 - 2026-04-29

### Added

- Pull request template with product-fit, privacy, fixture-safety, release-check, and screenshot prompts.

### Changed

- CONTRIBUTING and release checklist now reference the PR safety checklist.

## 0.1.4 - 2026-04-29

### Added

- Public roadmap focused on extraction quality, lineage clarity, personal/local workflow, and fixture-demo quality.

### Changed

- Linked the roadmap from README and CONTRIBUTING.

## 0.1.3 - 2026-04-29

### Changed

- Refreshed README screenshots from the current public fixture UI.
- Rechecked the deployed Pages demo with browser smoke after the screenshot refresh.
- Kept release metadata aligned with the public release stream.

## 0.1.2 - 2026-04-29

### Changed

- Aligned package metadata version with the public release stream.

## 0.1.1 - 2026-04-29

### Added

- Public README positioning improvements for first-time visitors.
- README badges for demo, release, license, and static/privacy-aware architecture.
- Direct release/changelog links from the README.
- GitHub repository metadata, topics, and public issue templates.
- Public OSS hygiene docs: license, contribution guide, and security policy.

### Changed

- Improved demo usage fast path and release/check documentation.
- Added npm shortcuts for release checks.

## 0.1.0 - 2026-04-29

### Added

- Static Codex Session Kanban demo with fixture-only public data.
- Intent-first card summaries, topic-shift handling, lineage-aware grouping, and human override locks.
- Candidate staging flow with explicit promotion into the board.
- Detail panels for evidence, extraction timeline, quality audit, debug hints, related tasks, and suppressed predecessor sessions.
- Bilingual UI mode for Japanese/personal and English/public review.
- Local session JSON import with validation report.
- Override export/import and localStorage-backed manual review state.
- GitHub Pages and downloadable Actions artifact distribution.
- Public fixture validation, static artifact smoke test, optional Playwright browser smoke test, and one-command release checks.
- Public docs for usage, import schema, architecture, testing, release checklist, artifact use, competitive positioning, contribution, and security.

### Safety

- Public builds use synthetic fixture data only.
- Distribution validation blocks common private-data signals.
- Real `.codex` logs and private session data are documented as local/private-only inputs.
