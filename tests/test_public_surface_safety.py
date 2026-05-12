from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PUBLIC_SURFACE_FILES = [
    ROOT / "codex_session_review" / "assets" / "app.js",
    ROOT / "codex_session_review" / "assets" / "styles.css",
    ROOT / "codex_session_review" / "templates" / "review_template.html",
    ROOT / "codex_session_review" / "smoke_browser_surface.mjs",
]
PANE_AUTO_MARKERS = [
    "Pane Auto",
    "pane-auto",
    "paneAuto",
    "PANE_AUTOMATION",
    "paneAutomation",
    "pane_automation",
    "127.0.0.1:8766",
    "remote intent",
]


def test_public_surface_does_not_ship_pane_auto_controls():
    for path in PUBLIC_SURFACE_FILES:
        text = path.read_text(encoding="utf-8")
        for marker in PANE_AUTO_MARKERS:
            assert marker.lower() not in text.lower(), f"{marker!r} leaked into {path.relative_to(ROOT)}"


def test_detail_panel_collapses_long_raw_text_by_default():
    js = (ROOT / "codex_session_review" / "assets" / "app.js").read_text(encoding="utf-8")
    css = (ROOT / "codex_session_review" / "assets" / "styles.css").read_text(encoding="utf-8")

    assert "function renderRawTextBlock(value)" in js
    assert "function isLongRawText(value)" in js
    assert "rawPreviewNote" in js
    assert "showRawText" in js
    assert "renderRawTextBlock(displayOriginalText(session.first_user_message" in js
    assert "renderRawTextBlock(displayOriginalText(item))" in js
    assert "renderRawTextBlock(displayOriginalText(session.last_assistant_message" in js
    assert '<details class="raw-text-details">' in js
    assert ".raw-text-details" in css
    assert ".raw-text-body" in css
    assert "max-height: min(48vh, 520px);" in css


def test_public_surface_prunes_stale_or_mojibake_local_overrides():
    js = (ROOT / "codex_session_review" / "assets" / "app.js").read_text(encoding="utf-8")

    assert "function hasMojibakeSignal(value)" in js
    assert "function currentOverrideKeys()" in js
    assert "function sanitizeOverrideMap(overrides, options = {})" in js
    assert "return sanitizeOverrideMap({ ...embedded, ...local }, { dropStale: true });" in js
    assert "state.overrides = sanitizeOverrideMap(state.overrides, { dropStale: true });" in js
    assert "removed ${removedMojibake} mojibake override entries from public demo local state" in js
    assert "removed ${removedStale} stale override entries not present in the current public fixture" in js
