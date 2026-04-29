# Fixture Coverage Diagnosis

Public fixture data should be small, synthetic, and representative. This project should not add sample sessions just to increase the count.

Use the fixture coverage diagnosis to decide whether a new fixture is actually needed.

## Run

```powershell
npm run fixture:coverage
```

Direct command:

```powershell
python .\codex_session_review\diagnose_fixture_coverage.py .\codex_session_review\sample_data\recent_sessions.sample.json --report-json .\codex_session_review\fixture_snapshot\fixture-coverage.json --normalized-json .\codex_session_review\fixture_snapshot\fixture-coverage.normalized.json
```

The public release check runs this automatically.

## What it checks

The diagnosis verifies that the public fixture represents the core product wedge:

- blocked external-sink / deployment rescope
- manual review surface and human override workflow
- topic-shift detection
- same-lineage predecessor merge
- same-repo parallel tasks
- provider import / non-Codex metadata
- needs-input or blocker evidence
- done/archive behavior
- English distribution copy fields
- lightweight prioritization stats

It also reports optional status gaps such as `Inbox` or `Dropped`. Optional gaps are warnings, not release blockers, because adding fake sessions only to cover every column can make the demo noisier.

## When to add a fixture

Add a new synthetic session only when it demonstrates a distinct behavior that is not already covered, for example:

- a real misclassification pattern that current topic-shift fixtures do not represent
- a same-repo parallel task that incorrectly merges
- a predecessor/successor lineage that suppresses the wrong card
- a provider export shape that loses title, body, status, or evidence
- a UI/import path that needs a stable public sample to test

Do not copy private `.codex` logs into the public fixture. Rewrite the case as a synthetic, sanitized example.

## Outputs

- `fixture-coverage.json`: machine-readable coverage report
- `fixture-coverage.normalized.json`: normalized bundle used by the diagnosis

Both outputs are generated under `codex_session_review/fixture_snapshot/` and are not source-of-truth files.
