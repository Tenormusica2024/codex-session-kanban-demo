"""Shared title-classification guardrails for Codex session review surfaces.

This file is intentionally small and deterministic.  Keep the same file in
`openclaw-secretary` and `codex-session-kanban-demo-public`; use the sync check
before changing title routing so the private surface and public/demo surface do
not drift.
"""

from __future__ import annotations

import re
from typing import Final


RULESET_ID: Final = "title-classification-rules-v2026-05-07-supabase-rls-security"
LLMWIKI_REPORT_VISIBILITY_LABEL: Final = "LLMWIKI報告メール誤表示修正"
LLMWIKI_REPORT_VISIBILITY_TOPIC_SUFFIX: Final = "llmwiki-report-visibility"
SUPABASE_RLS_SECURITY_LABEL: Final = "Supabase RLS/security修正"
SUPABASE_RLS_SECURITY_TOPIC_SUFFIX: Final = "supabase-rls-security"

KNOWN_PROJECT_HINTS: Final[dict[str, str]] = {
    "hzofpqlhrlveqnjsoaae": "ai-model-tracker",
    "ai-model-tracker": "ai-model-tracker",
    "curiosity-wiki-paper-intake": "curiosity-wiki",
    "curiosity-wiki": "curiosity-wiki",
    "openclaw-secretary": "openclaw-secretary",
    "codex_session_review": "openclaw-secretary",
    "secretary-kanbanreviewsurface": "openclaw-secretary",
}


def is_llmwiki_report_visibility_signal(text: str) -> bool:
    """Detect Research Links display bugs before creative/CiC routing.

    ai-character-ip paths contain "character", and failed research can mention
    Grok/CiC as a search route. Those words must not make a session look like
    image generation when the latest work is about fallback, success logs,
    score display, or report wording.
    """
    lowered = (text or "").lower()
    if not lowered.strip():
        return False
    source_signal = any(
        token in lowered
        for token in (
            "llmwiki",
            "research links",
            "send_daily_research_links",
            "latest-auto-collect",
            "auto-collect",
            "local_wiki_fallback",
        )
    )
    visibility_signal = any(
        token in lowered
        for token in (
            "誤表示",
            "おかしい",
            "成功ログ",
            "成功扱い",
            "失敗なのに成功",
            "暫定成功",
            "score",
            "スコア",
            "要確認",
            "未生成理由",
            "過去24時間の自動調査md",
            "外部検索失敗",
            "検索失敗",
            "search_local_fallback",
            "search_deferred_timeout",
            "local fallback",
            "fallback暫定",
            "fallback",
        )
    )
    return source_signal and visibility_signal


def compose_llmwiki_report_visibility_title(context: str) -> str:
    lowered = (context or "").lower()
    if "score" in lowered or "スコア" in lowered:
        return "LLMWIKI Research Links の失敗/score誤表示修正"
    if "local_wiki_fallback" in lowered or "local fallback" in lowered or "search_local_fallback" in lowered:
        return "LLMWIKI Research Links のLOCAL_WIKI_FALLBACK表示修正"
    if "成功ログ" in context or "成功扱い" in context or "失敗なのに成功" in context or "暫定成功" in context:
        return "LLMWIKI Research Links の成功ログ誤表示修正"
    return "LLMWIKI Research Links の表示・成功判定修正"


def is_supabase_rls_security_signal(text: str) -> bool:
    """Detect Supabase RLS/Security Advisor work before dashboard routing."""
    lowered = (text or "").lower()
    if not lowered.strip():
        return False
    source_signal = (
        "supabase" in lowered
        or any(project_ref in lowered for project_ref in KNOWN_PROJECT_HINTS)
        or "public.benchmarks" in lowered
    )
    security_signal = any(
        token in lowered
        for token in (
            "rls",
            "row-level security",
            "row level security",
            "rls_disabled_in_public",
            "security advisor",
            "security definer",
            "public policy",
            "select only",
            "read-only",
            "read only",
            "anon",
            "authenticated",
            "public.benchmarks",
        )
    )
    return source_signal and security_signal


def infer_project_name_from_text(text: str) -> str:
    """Infer a durable project/repo label from high-signal session text."""
    raw = text or ""
    lowered = raw.lower()
    for project_ref, project_name in KNOWN_PROJECT_HINTS.items():
        if project_ref in lowered or project_name in lowered:
            return project_name

    # Supabase notification mails often include either `Project: name` or
    # `Project\n\nname`.  Use this only for identifier-like project names so
    # generic prose does not become a repo label.
    project_patterns = (
        r"\bproject\s*[:：]\s*([A-Za-z0-9][A-Za-z0-9._-]{2,80})",
        r"\bproject\s*\n+\s*([A-Za-z0-9][A-Za-z0-9._-]{2,80})",
    )
    for pattern in project_patterns:
        match = re.search(pattern, raw, flags=re.IGNORECASE)
        if not match:
            continue
        name = match.group(1).strip().strip("`'\".,)")
        if "-" in name or "_" in name:
            return name
    return ""


def has_creative_asset_signal(topic_text: str, *, project_dof_context: bool) -> bool:
    """Return true only for concrete image-generation signals.

    Bare `character` / `キャラ` / `プロンプト` appears in old LLMWIKI and search
    context.  Treat those as creative only when the session is clearly scoped to
    project-dof; otherwise require explicit image generation tokens.
    """
    text = (topic_text or "").lower()
    generic_image_signal = any(
        token in text
        for token in ("画像生成", "image generation", "image2", "gpt image")
    )
    project_dof_prompt_signal = project_dof_context and any(
        token in text for token in ("プロンプト", "キャラ", "character")
    )
    return generic_image_signal or project_dof_prompt_signal
