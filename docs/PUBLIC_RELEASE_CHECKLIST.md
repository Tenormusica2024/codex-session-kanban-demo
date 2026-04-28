# Public Release Checklist

Use this checklist before sharing the public demo URL or release artifact.

## Data safety

- [ ] Public data comes only from `codex_session_review/sample_data/recent_sessions.sample.json`.
- [ ] No real `.codex` logs are committed.
- [ ] No local user paths are present.
- [ ] No private repository/client/family details are present.
- [ ] No tokens, cookies, bypass URLs, API keys, credentials, passwords, or secrets are present.
- [ ] `python codex_session_review/validate_session_data.py codex_session_review/sample_data/recent_sessions.sample.json --distribution` passes.

## Build

- [ ] One-command local release check passes:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\codex_session_review\run_public_release_checks.ps1
```

- [ ] Distribution fixture builds locally:

```powershell
powershell -ExecutionPolicy Bypass -File .\codex_session_review\build_fixture_snapshot.ps1 -Distribution
```

- [ ] Output opens locally:

```powershell
powershell -ExecutionPolicy Bypass -File .\codex_session_review\open_distribution_review.ps1
```

- [ ] Static artifact smoke passes:

```powershell
python .\codex_session_review\smoke_public_build.py .\codex_session_review\fixture_snapshot\index.html --docs-dir .\codex_session_review\fixture_snapshot\docs --distribution
```

- [ ] Browser smoke passes locally:

```powershell
npm run smoke:browser:local
```

## Demo quality

- [ ] Board shows more than one meaningful status.
- [ ] At least one card demonstrates lineage/suppressed predecessor handling.
- [ ] At least one card demonstrates topic-shift handling.
- [ ] At least one card demonstrates needs-input/blocker handling.
- [ ] Candidate preview does not add a card until a target column is explicitly chosen.
- [ ] English mode does not expose private Japanese source text in the public fixture.

## GitHub Pages / artifact

- [ ] Repository is public if using free GitHub Pages.
- [ ] Settings → Pages → Source is GitHub Actions.
- [ ] Workflow `Codex Session Kanban Demo Pages` passes.
- [ ] Optional manual workflow with `run_browser_smoke=true` passes before major public releases.
- [ ] If Pages is unavailable, use the downloadable Actions artifact instead.
- [ ] Artifact contains `index.html`, `README_LOCAL_DEMO.txt`, and `docs/`.

## Positioning

- [ ] README explains that this is a session-to-task extraction review surface, not a generic Kanban.
- [ ] README screenshots are regenerated after major UI changes.
- [ ] README links to usage guide, import schema, competitive positioning, and TODO/adoption policy.
- [ ] LICENSE, CONTRIBUTING, and SECURITY docs are present and still match the public fixture/privacy stance.
- [ ] CHANGELOG and GitHub issue templates are present and still warn against sharing private session data.
- [ ] Pull request template is present and still checks product fit, privacy, fixture safety, and release checks.
- [ ] Demo fixture shows the product wedge without real personal task data.
