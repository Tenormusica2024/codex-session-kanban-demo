#!/usr/bin/env python3
"""Smoke-test a zipped Codex Session Kanban distribution package."""
from __future__ import annotations

import argparse
import tempfile
import zipfile
from pathlib import Path

from smoke_public_build import smoke


REQUIRED_MEMBERS = {
    "index.html",
    "README_LOCAL_DEMO.txt",
    "docs/DEMO_USAGE.md",
    "docs/IMPORT_SCHEMA.md",
    "docs/ARTIFACT_USAGE.md",
}


def normalized_members(package_path: Path) -> set[str]:
    with zipfile.ZipFile(package_path) as archive:
        return {name.replace("\\", "/").rstrip("/") for name in archive.namelist()}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("package_path", type=Path)
    parser.add_argument("--distribution", action="store_true")
    args = parser.parse_args()

    package_path = args.package_path
    if not package_path.is_file():
        print(f"ERROR: package not found: {package_path}")
        return 2

    try:
        members = normalized_members(package_path)
    except zipfile.BadZipFile as exc:
        print(f"ERROR: invalid zip package: {exc}")
        return 2

    missing = sorted(REQUIRED_MEMBERS - members)
    if missing:
        for member in missing:
            print(f"ERROR: missing package member: {member}")
        return 1

    with tempfile.TemporaryDirectory(prefix="codex-session-kanban-package-") as temp_dir:
        temp_path = Path(temp_dir)
        with zipfile.ZipFile(package_path) as archive:
            archive.extractall(temp_path)

        errors, warnings, counts = smoke(
            temp_path / "index.html",
            docs_dir=temp_path / "docs",
            distribution=args.distribution,
        )

    for warning in warnings:
        print(f"WARNING: {warning}")
    for error in errors:
        print(f"ERROR: {error}")
    if errors:
        print(f"package smoke failed: {len(errors)} error(s), {len(warnings)} warning(s)")
        return 1

    print(
        "package smoke ok: "
        f"sessions={counts.get('sessions', 0)} "
        f"task_clusters={counts.get('task_clusters', 0)} "
        f"suggested_tasks={counts.get('suggested_tasks', 0)} "
        f"members={len(members)} "
        f"warnings={len(warnings)}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
