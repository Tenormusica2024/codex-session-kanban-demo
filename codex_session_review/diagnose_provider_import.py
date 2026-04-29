#!/usr/bin/env python3
"""Diagnose provider-native session JSON before claiming adapter support.

This script normalizes an observed export shape into the common review schema
and reports what worked, what fell back to generic handling, and what still
needs a concrete mapping. It intentionally does not run external agents.
"""
from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path
from typing import Any

from build_review_surface import (
    STATUS_ORDER,
    apply_lightweight_prioritization_stats,
    build_quality_report,
    build_suggested_tasks,
    enrich_task_clusters,
    find_private_markers,
    normalize_import_bundle,
)

REQUIRED_FIELDS = ("session_id", "title", "summary", "suggested_status", "primary_repo", "start_at", "end_at")


def load_raw(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def raw_sessions(raw: Any) -> list[Any]:
    if isinstance(raw, list):
        return raw
    if isinstance(raw, dict):
        value = raw.get("sessions") or raw.get("conversations") or raw.get("items")
        if isinstance(value, list):
            return value
    return []


def complete_bundle(raw: Any) -> dict[str, Any]:
    bundle = normalize_import_bundle(raw)
    sessions = bundle.get("sessions", [])
    if sessions and not bundle.get("task_clusters"):
        bundle["task_clusters"] = enrich_task_clusters(sessions)
    if bundle.get("task_clusters") and not bundle.get("suggested_tasks"):
        bundle["suggested_tasks"] = build_suggested_tasks(bundle["task_clusters"])
    apply_lightweight_prioritization_stats(bundle)
    if sessions and bundle.get("task_clusters") and bundle.get("suggested_tasks") and not bundle.get("quality_report"):
        bundle["quality_report"] = build_quality_report(sessions, bundle["task_clusters"], bundle["suggested_tasks"])
    return bundle


def diagnose(bundle: dict[str, Any], raw_count: int) -> dict[str, Any]:
    sessions = [item for item in bundle.get("sessions", []) if isinstance(item, dict)]
    providers = Counter(str(item.get("provider") or "unknown") for item in sessions)
    statuses = Counter(str(item.get("suggested_status") or "unknown") for item in sessions)
    missing_required: list[dict[str, Any]] = []
    weak_evidence: list[dict[str, Any]] = []
    generic_provider: list[str] = []
    unknown_repo: list[str] = []
    invalid_status: list[dict[str, str]] = []

    for index, item in enumerate(sessions):
        sid = str(item.get("session_id") or f"#{index + 1}")
        missing = [field for field in REQUIRED_FIELDS if not item.get(field)]
        if missing:
            missing_required.append({"session_id": sid, "missing": missing})
        if item.get("provider") == "generic-ai-session":
            generic_provider.append(sid)
        if str(item.get("primary_repo") or "").lower() in {"", "unknown"}:
            unknown_repo.append(sid)
        if item.get("suggested_status") not in STATUS_ORDER:
            invalid_status.append({"session_id": sid, "status": str(item.get("suggested_status"))})
        evidence_count = len(item.get("evidence_messages") or [])
        if evidence_count < 2 or int(item.get("user_message_count") or 0) == 0:
            weak_evidence.append(
                {
                    "session_id": sid,
                    "evidence_messages": evidence_count,
                    "user_message_count": int(item.get("user_message_count") or 0),
                }
            )

    private_markers = find_private_markers(bundle)
    errors: list[str] = []
    warnings: list[str] = []
    if raw_count == 0:
        errors.append("input does not contain a sessions/conversations/items array")
    if missing_required:
        errors.append("normalized sessions are missing required fields")
    if invalid_status:
        errors.append("normalized sessions contain invalid statuses")
    if generic_provider:
        warnings.append("some sessions fell back to generic-ai-session provider inference")
    if unknown_repo:
        warnings.append("some sessions have unknown repo/project labels")
    if weak_evidence:
        warnings.append("some sessions have weak evidence/message extraction")
    if private_markers:
        warnings.append("possible private-data markers are present; keep this local unless sanitized")

    return {
        "ok": not errors,
        "raw_session_count": raw_count,
        "normalized_session_count": len(sessions),
        "task_cluster_count": len(bundle.get("task_clusters") or []),
        "suggested_task_count": len(bundle.get("suggested_tasks") or []),
        "providers": dict(sorted(providers.items())),
        "statuses": dict(sorted(statuses.items())),
        "missing_required": missing_required,
        "invalid_status": invalid_status,
        "generic_provider_session_ids": generic_provider,
        "unknown_repo_session_ids": unknown_repo,
        "weak_evidence": weak_evidence,
        "private_markers": private_markers,
        "warnings": warnings,
        "errors": errors,
    }


def print_human(report: dict[str, Any]) -> None:
    print(f"provider diagnosis: {'ok' if report['ok'] else 'needs mapping'}")
    print(f"raw sessions: {report['raw_session_count']}")
    print(f"normalized sessions: {report['normalized_session_count']}")
    print(f"task clusters: {report['task_cluster_count']}")
    print(f"suggested tasks: {report['suggested_task_count']}")
    print(f"providers: {report['providers']}")
    print(f"statuses: {report['statuses']}")
    for warning in report["warnings"]:
        print(f"WARNING: {warning}")
    for error in report["errors"]:
        print(f"ERROR: {error}", file=sys.stderr)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_json", type=Path)
    parser.add_argument("--report-json", type=Path, help="Optional path to write the machine-readable diagnosis")
    parser.add_argument("--normalized-json", type=Path, help="Optional path to write the normalized bundle")
    parser.add_argument("--strict", action="store_true", help="Exit non-zero when warnings are present")
    args = parser.parse_args()

    try:
        raw = load_raw(args.input_json)
        bundle = complete_bundle(raw)
        report = diagnose(bundle, len(raw_sessions(raw)))
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2

    print_human(report)

    if args.report_json:
        args.report_json.parent.mkdir(parents=True, exist_ok=True)
        args.report_json.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    if args.normalized_json:
        args.normalized_json.parent.mkdir(parents=True, exist_ok=True)
        args.normalized_json.write_text(json.dumps(bundle, ensure_ascii=False, indent=2), encoding="utf-8")

    if report["errors"]:
        return 1
    if args.strict and report["warnings"]:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
