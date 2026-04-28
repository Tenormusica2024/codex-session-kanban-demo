#!/usr/bin/env python3
"""Validate Codex Session Kanban session JSON before public/demo builds."""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Any

ALLOWED_STATUSES = {"Need Review", "Pending", "In Progress", "Blocked", "Done", "Dropped"}
REQUIRED_FIELDS = ("session_id", "title", "summary", "suggested_status", "primary_repo", "start_at", "end_at")
PRIVACY_PATTERN = re.compile(
    r"(C:\\\\Users\\\\|\\\\Users\\\\|/Users/|/home/|\btoken\b|api[_-]?key|\bcookie\b|\bbypass\b|\bsecret\b|\bpassword\b|\bcredential\b)",
    re.IGNORECASE,
)


def load_payload(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(payload, list):
        return {"sessions": payload}
    if not isinstance(payload, dict):
        raise ValueError("top-level JSON must be an object or session array")
    return payload


def parse_time(value: Any) -> bool:
    if not value:
        return False
    text = str(value).replace("Z", "+00:00")
    try:
        datetime.fromisoformat(text)
        return True
    except ValueError:
        return False


def validate(path: Path, *, distribution: bool = False) -> tuple[list[str], list[str]]:
    payload = load_payload(path)
    sessions = payload.get("sessions")
    errors: list[str] = []
    warnings: list[str] = []
    if not isinstance(sessions, list):
        return ["missing sessions array"], warnings

    ids = [str(item.get("session_id") or f"#{index + 1}") for index, item in enumerate(sessions) if isinstance(item, dict)]
    id_counts = Counter(ids)
    duplicate_ids = sorted([sid for sid, count in id_counts.items() if count > 1])
    for sid in duplicate_ids:
        errors.append(f"duplicate session_id: {sid}")
    id_set = set(ids)

    for index, item in enumerate(sessions):
        if not isinstance(item, dict):
            errors.append(f"session #{index + 1}: must be an object")
            continue
        label = str(item.get("session_id") or f"#{index + 1}")
        missing = [field for field in REQUIRED_FIELDS if not item.get(field)]
        if missing:
            errors.append(f"{label}: missing required fields: {', '.join(missing)}")
        status = item.get("suggested_status") or item.get("currentStatus")
        if status and status not in ALLOWED_STATUSES:
            errors.append(f"{label}: invalid status: {status}")
        for field in ("start_at", "end_at"):
            if item.get(field) and not parse_time(item.get(field)):
                errors.append(f"{label}: invalid timestamp {field}={item.get(field)}")
        for related_id in item.get("related_session_ids") or []:
            if str(related_id) not in id_set:
                errors.append(f"{label}: broken related_session_id: {related_id}")
        serialized = json.dumps(item, ensure_ascii=False)
        if PRIVACY_PATTERN.search(serialized):
            message = f"{label}: possible private-data signal"
            if distribution:
                errors.append(message)
            else:
                warnings.append(message)

    if distribution:
        source = str(payload.get("source") or "").lower()
        mode = str(payload.get("surface_mode") or "").lower()
        if "fixture" not in source and mode != "distribution":
            warnings.append("distribution build should use fixture source or surface_mode=distribution")
    return errors, warnings


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("json_path", type=Path)
    parser.add_argument("--distribution", action="store_true", help="fail on privacy-like signals")
    args = parser.parse_args()

    try:
        errors, warnings = validate(args.json_path, distribution=args.distribution)
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2

    for warning in warnings:
        print(f"WARNING: {warning}")
    for error in errors:
        print(f"ERROR: {error}", file=sys.stderr)
    if errors:
        print(f"validation failed: {len(errors)} error(s), {len(warnings)} warning(s)", file=sys.stderr)
        return 1
    print(f"validation ok: {len(warnings)} warning(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
