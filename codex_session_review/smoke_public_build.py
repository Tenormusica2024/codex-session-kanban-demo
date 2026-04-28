#!/usr/bin/env python3
"""Smoke-test a built Codex Session Kanban HTML artifact.

This catches regressions that schema validation alone cannot see, such as a
valid fixture JSON rendering as an empty board because derived clusters or
candidate tasks were not generated into the embedded bootstrap payload.
"""
from __future__ import annotations

import argparse
import html
import json
import re
import sys
from pathlib import Path
from typing import Any


BOOTSTRAP_RE = re.compile(
    r'<script\s+id=["\']bootstrap-data["\']\s+type=["\']application/json["\']>(?P<payload>.*?)</script>',
    re.IGNORECASE | re.DOTALL,
)
SCRIPT_RE = re.compile(r"<script\b[^>]*>.*?</script>", re.IGNORECASE | re.DOTALL)
PRIVATE_SIGNAL_RE = re.compile(
    r"(C:\\Users\\|\\Users\\|/Users/|/home/|\btoken\b|api[_-]?key|\bcookie\b|\bbypass\b|\bsecret\b|\bpassword\b|\bcredential\b)",
    re.IGNORECASE,
)
PRIVATE_PATH_RE = re.compile(r"(C:\\Users\\|\\Users\\|/Users/|/home/)", re.IGNORECASE)


def load_bootstrap(html_text: str) -> dict[str, Any]:
    match = BOOTSTRAP_RE.search(html_text)
    if not match:
        raise ValueError("missing bootstrap-data script")
    raw_payload = html.unescape(match.group("payload").strip())
    payload = json.loads(raw_payload)
    if not isinstance(payload, dict):
        raise ValueError("bootstrap payload must be a JSON object")
    return payload


def count_list(payload: dict[str, Any], key: str) -> int:
    value = payload.get(key)
    if not isinstance(value, list):
        return 0
    return len(value)


def smoke(
    html_path: Path,
    *,
    docs_dir: Path | None = None,
    distribution: bool = False,
) -> tuple[list[str], list[str], dict[str, int]]:
    errors: list[str] = []
    warnings: list[str] = []
    html_text = html_path.read_text(encoding="utf-8")

    if 'id="candidate-list"' not in html_text and "id='candidate-list'" not in html_text:
        errors.append("missing candidate-list element")
    if 'id="detail-panel"' not in html_text and "id='detail-panel'" not in html_text:
        errors.append("missing detail-panel element")

    try:
        payload = load_bootstrap(html_text)
    except Exception as exc:  # noqa: BLE001
        return [f"invalid bootstrap payload: {exc}"], warnings, {}

    counts = {
        "sessions": count_list(payload, "sessions"),
        "task_clusters": count_list(payload, "task_clusters"),
        "suggested_tasks": count_list(payload, "suggested_tasks"),
    }
    for key, value in counts.items():
        if value <= 0:
            errors.append(f"bootstrap {key} must not be empty")

    if distribution and payload.get("surface_mode") != "distribution":
        errors.append("distribution build must embed surface_mode=distribution")

    if docs_dir:
        required_docs = ("DEMO_USAGE.md", "IMPORT_SCHEMA.md", "ARTIFACT_USAGE.md")
        for name in required_docs:
            if not (docs_dir / name).is_file():
                errors.append(f"missing bundled doc: {name}")

    serialized = json.dumps(payload, ensure_ascii=False)
    # The app source intentionally contains guard words such as "token" and
    # "credential" in regexes/help copy. Treat those as a build feature, not a
    # leak. The embedded payload is stricter; the whole HTML is checked for
    # concrete local path shapes only.
    html_without_scripts = SCRIPT_RE.sub("", html_text)
    if PRIVATE_SIGNAL_RE.search(serialized) or PRIVATE_PATH_RE.search(html_without_scripts):
        message = "possible private-data signal in built artifact"
        if distribution:
            errors.append(message)
        else:
            warnings.append(message)

    return errors, warnings, counts


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("html_path", type=Path)
    parser.add_argument("--docs-dir", type=Path)
    parser.add_argument("--distribution", action="store_true")
    args = parser.parse_args()

    try:
        errors, warnings, counts = smoke(
            args.html_path,
            docs_dir=args.docs_dir,
            distribution=args.distribution,
        )
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2

    for warning in warnings:
        print(f"WARNING: {warning}")
    for error in errors:
        print(f"ERROR: {error}", file=sys.stderr)

    if errors:
        print(f"smoke failed: {len(errors)} error(s), {len(warnings)} warning(s)", file=sys.stderr)
        return 1
    print(
        "smoke ok: "
        f"sessions={counts.get('sessions', 0)} "
        f"task_clusters={counts.get('task_clusters', 0)} "
        f"suggested_tasks={counts.get('suggested_tasks', 0)} "
        f"warnings={len(warnings)}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
