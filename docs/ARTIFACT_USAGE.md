# Downloadable Artifact Usage

Use this path when GitHub Pages is unavailable or when you want an offline demo package.

## 1. Download the artifact

1. Open the GitHub repository.
2. Go to **Actions**.
3. Open the latest successful **Codex Session Kanban Pages** run.
4. Download the artifact named `codex-session-kanban`.
5. Unzip the downloaded GitHub artifact, then unzip `codex-session-kanban.zip` locally.

The inner distribution zip should contain:

- `index.html`
- `README_LOCAL_DEMO.txt`
- `docs/`

## 2. Open the demo

Open `index.html` in a browser.

The artifact is static. It does not need a server for basic review.

## 3. Try your own session JSON

1. Click **session JSONを読み込み / Import session JSON**.
2. Select a JSON file with a top-level `sessions` array.
3. Review the import validation report.
4. If the data is safe and valid enough for local review, continue using the board.

Imported session data is only used in the current browser page. It is not uploaded anywhere by this static demo.

## 4. Preserve manual decisions

Manual status changes, ordering, and notes are stored in browser `localStorage`.

Use:

- **手動修正を出力 / Export overrides** to download override JSON.
- **手動修正JSONをコピー / Copy overrides JSON** to copy it.
- **手動修正を読み込み / Import overrides** to restore it later.

Session JSON and override JSON are separate:

- Session JSON = source task/session data.
- Override JSON = human review decisions.

## 5. Reset to sample data

Click **デモデータに戻す / Reset demo data** to return to the embedded public fixture.

This does not delete override JSON files you already exported. Use **手動修正を全消去 / Clear all overrides** if you want to clear browser-local overrides.

## 6. Safety notes

Do not publish artifacts generated from real `.codex` logs unless they are sanitized.

Before sharing fixture data publicly, run:

```powershell
python codex_session_review\validate_session_data.py path\to\sessions.json --distribution
```

The public repository artifact is intended to contain fixture data only.
