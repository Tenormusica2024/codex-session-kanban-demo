# Changelog

All notable public-demo changes are tracked here.

This project is still pre-1.0. Entries focus on public distribution, fixture safety, and the session-to-task review workflow.

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
