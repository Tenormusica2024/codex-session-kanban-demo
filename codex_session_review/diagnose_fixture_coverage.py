#!/usr/bin/env python3
"""Diagnose whether public fixtures cover the session-to-kanban behaviors.

The fixture should stay small. This check makes coverage visible so new sample
sessions are added only when a behavior is not already represented.
"""
from __future__ import annotations

import argparse
import json
import sys
from collections import Counter, defaultdict
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

REQUIRED_CAPABILITIES: dict[str, str] = {
    "source_side_blocked_rescope": "blocked external sink or deployment/provisioning path is represented",
    "manual_review_surface": "manual override / review surface workflow is represented",
    "topic_shift_detection": "session that starts with one topic and moves to another is represented",
    "same_lineage_predecessor_merge": "multiple sessions in one lineage can be collapsed into one representative task",
    "same_repo_parallel_tasks": "one repo can legitimately contain multiple separate task topics",
    "provider_import": "non-Codex or provider-import normalization path is represented",
    "needs_input_or_blocker": "blocked / needs-input evidence is represented",
    "done_or_archived": "completed work is represented so it can stay out of active candidates",
    "english_distribution_copy": "public/demo English copy fields are represented",
    "lightweight_prioritization": "token-free activity/size prioritization signals can be generated",
}

# Keep this aligned with the visible board columns. Inbox used to be part of
# the early prototype, but the public review surface intentionally removed it
# so candidates stay in the staging backlog until explicitly promoted.
OPTIONAL_STATUS_LABELS = list(STATUS_ORDER)


def load_raw(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


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


def text_blob(item: dict[str, Any]) -> str:
    parts: list[str] = []
    for key in (
        "session_id",
        "title",
        "summary",
        "current_goal",
        "deep_summary",
        "latest_meaningful_change",
        "blocker",
        "suggested_reason",
        "task_cluster_key",
        "task_cluster_label",
        "topic_key",
        "topic_label",
        "lineage_key",
        "lineage_label",
        "primary_repo",
        "provider",
    ):
        value = item.get(key)
        if value:
            parts.append(str(value))
    for key in ("evidence_messages", "active_paths"):
        value = item.get(key)
        if isinstance(value, list):
            parts.extend(str(v) for v in value if v)
    return "\n".join(parts).lower()


def session_capabilities(sessions: list[dict[str, Any]], bundle: dict[str, Any]) -> dict[str, Any]:
    status_counter = Counter(str(s.get("suggested_status") or "unknown") for s in sessions)
    provider_counter = Counter(str(s.get("provider") or "unknown") for s in sessions)
    repo_topics: dict[str, set[str]] = defaultdict(set)
    lineage_counter: Counter[str] = Counter()
    topic_counter: Counter[str] = Counter()

    blobs = {str(s.get("session_id") or i): text_blob(s) for i, s in enumerate(sessions)}
    for s in sessions:
        repo = str(s.get("primary_repo") or "unknown")
        topic = str(s.get("topic_key") or s.get("task_cluster_key") or s.get("title") or "unknown")
        lineage = str(s.get("lineage_key") or topic)
        repo_topics[repo].add(topic)
        lineage_counter[lineage] += 1
        topic_counter[topic] += 1

    suggested = bundle.get("suggested_tasks") or []
    clusters = bundle.get("task_clusters") or []

    def any_blob(*needles: str) -> bool:
        return any(any(needle in blob for needle in needles) for blob in blobs.values())

    def any_all(*needles: str) -> bool:
        return any(all(needle in blob for needle in needles) for blob in blobs.values())

    english_fields = ["title_en", "summary_en", "evidence_messages_en"]
    english_complete = sum(1 for s in sessions if all(s.get(field) for field in english_fields))
    has_stats = any(
        (s.get("estimated_tokens") is not None)
        or (s.get("text_size_chars") is not None)
        or (s.get("high_activity_signal") is not None)
        or (s.get("large_session_signal") is not None)
        for s in sessions
    ) or bool((bundle.get("quality_report") or {}).get("lightweight_prioritization"))

    coverage: dict[str, Any] = {
        "source_side_blocked_rescope": any_all("blocked", "rescope") or any_all("provision", "blocked"),
        "manual_review_surface": any_blob("manual override", "localstorage", "review surface", "drag"),
        "topic_shift_detection": any(bool(s.get("task_shift_signal")) for s in sessions),
        "same_lineage_predecessor_merge": any(count > 1 for count in lineage_counter.values()) or any(
            int(c.get("session_count") or c.get("related_session_count") or 0) > 1 for c in clusters
        ),
        "same_repo_parallel_tasks": any(len(topics) > 1 for topics in repo_topics.values()),
        "provider_import": any(provider != "codex" for provider in provider_counter) or any_blob("provider import", "provider-import"),
        "needs_input_or_blocker": bool(status_counter.get("Blocked")) or any_blob("needs-input", "blocker", "permission", "blocked"),
        "done_or_archived": bool(status_counter.get("Done") or status_counter.get("Dropped")),
        "english_distribution_copy": english_complete >= max(1, len(sessions) // 2),
        "lightweight_prioritization": has_stats,
    }

    return {
        "session_count": len(sessions),
        "task_cluster_count": len(clusters),
        "suggested_task_count": len(suggested),
        "statuses": {label: status_counter.get(label, 0) for label in OPTIONAL_STATUS_LABELS if label in STATUS_ORDER or label in status_counter},
        "providers": dict(sorted(provider_counter.items())),
        "repos": {repo: len(topics) for repo, topics in sorted(repo_topics.items())},
        "lineages_with_multiple_sessions": {k: v for k, v in sorted(lineage_counter.items()) if v > 1},
        "topics_with_multiple_sessions": {k: v for k, v in sorted(topic_counter.items()) if v > 1},
        "english_complete_sessions": english_complete,
        "coverage": coverage,
    }


def diagnose(bundle: dict[str, Any]) -> dict[str, Any]:
    sessions = [s for s in bundle.get("sessions", []) if isinstance(s, dict)]
    capabilities = session_capabilities(sessions, bundle)
    missing_required = [key for key, covered in capabilities["coverage"].items() if key in REQUIRED_CAPABILITIES and not covered]
    missing_optional_statuses = [label for label in OPTIONAL_STATUS_LABELS if capabilities["statuses"].get(label, 0) == 0]
    private_markers = find_private_markers(bundle)

    errors: list[str] = []
    warnings: list[str] = []
    if not sessions:
        errors.append("fixture has no sessions")
    if missing_required:
        errors.append("fixture is missing required behavior coverage")
    if missing_optional_statuses:
        warnings.append("some optional board statuses are not represented: " + ", ".join(missing_optional_statuses))
    if private_markers:
        warnings.append("possible private-data markers are present; distribution fixtures should stay synthetic/sanitized")

    return {
        "ok": not errors,
        "capabilities": capabilities,
        "required_capabilities": REQUIRED_CAPABILITIES,
        "missing_required_capabilities": missing_required,
        "missing_optional_statuses": missing_optional_statuses,
        "private_markers": private_markers,
        "warnings": warnings,
        "errors": errors,
    }


def print_human(report: dict[str, Any]) -> None:
    caps = report["capabilities"]
    print(f"fixture coverage: {'ok' if report['ok'] else 'needs fixtures'}")
    print(f"sessions: {caps['session_count']}")
    print(f"task clusters: {caps['task_cluster_count']}")
    print(f"suggested tasks: {caps['suggested_task_count']}")
    print(f"statuses: {caps['statuses']}")
    print(f"providers: {caps['providers']}")
    print("coverage:")
    for key, description in REQUIRED_CAPABILITIES.items():
        mark = "ok" if caps["coverage"].get(key) else "missing"
        print(f"  - {key}: {mark} ({description})")
    for warning in report["warnings"]:
        print(f"WARNING: {warning}")
    for error in report["errors"]:
        print(f"ERROR: {error}", file=sys.stderr)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_json", type=Path)
    parser.add_argument("--report-json", type=Path, help="Optional path to write the machine-readable coverage report")
    parser.add_argument("--normalized-json", type=Path, help="Optional path to write the normalized bundle used for coverage")
    parser.add_argument("--strict", action="store_true", help="Exit non-zero when warnings are present")
    args = parser.parse_args()

    try:
        raw = load_raw(args.input_json)
        bundle = complete_bundle(raw)
        report = diagnose(bundle)
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

