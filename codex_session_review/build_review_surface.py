from __future__ import annotations

import argparse
import json
import os
import math
import re
from collections import Counter
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any


JST = timezone(timedelta(hours=9))
STATUS_ORDER = [
    "Need Review",
    "Pending",
    "In Progress",
    "Blocked",
    "Done",
    "Dropped",
]
TRIVIAL_COMMANDS = {"/status", "/init", "/pwd", "a"}
NOISY_PREFIXES = (
    "【運用ルール",
    "【優先順位宣言】",
    "Claude Code Instructions",
)
NOISY_EXACT = {
    "何も選択されていません",
    "コンテンツへ",
}
NOISY_CONTAINS = (
    "Gmail でのスクリーン リーダーの使用",
    "Gmail のデスクトップ通知を有効にしてください。",
)
GLOBAL_LINEAGE_HINTS = (
    "運用",
    "取り込み",
    "見直し",
    "ナレッジ",
    "クエリ",
    "メール",
    "ブックマーク",
    "週次",
    "報告",
    "重複",
    "求人",
    "転職",
    "応募",
    "年収",
    "オファー",
)
REPO_SCOPED_TOPIC_KEYS = {
    "account-flow",
    "creative-assets",
    "deploy",
    "grok4cic-clipboard",
    "kanban-automation",
    "portfolio-page-improvement",
    "privatize",
    "repo-review",
    "sales-channel",
    "dashboard-freshness",
    "demand-index",
    "teaser-lp",
    "ui-fix",
}
CONTINUE_TOKENS = ("go", "進めて", "すすめて", "続けて", "お願い", "それで進めて")
BLOCK_TOKENS = ("blocked", "credential", "provisioning required", "pending reason", "保留", "止まって", "ボトルネック")
DONE_TOKENS = ("完了", "done", "投稿済み", "通った", "成功")
CLUSTER_STOPWORDS = {
    "github",
    "issue",
    "issues",
    "codex",
    "session",
    "sessions",
    "review",
    "surface",
    "local",
    "static",
    "board",
    "task",
    "tasks",
    "html",
    "json",
    "sync",
    "status",
    "summary",
    "summaries",
    "kanban",
    "progress",
    "implementation",
    "implement",
    "continue",
    "need",
    "needs",
    "from",
    "that",
    "this",
    "with",
    "without",
    "into",
    "your",
    "have",
    "been",
    "more",
    "just",
    "optional",
    "human",
    "override",
    "first",
    "recent",
    "latest",
    "update",
    "updates",
    "make",
    "made",
    "good",
    "better",
    "route",
    "routes",
    "repo",
    "repos",
    "plane",
    "follow",
    "githubissue",
    "claudecode",
    "claude",
    "private",
    "grok4cic",
    "cic",
    "scui",
    "ui",
    "hitl",
}
JP_CLUSTER_NOISE = (
    "直近の",
    "大タスク",
    "内容",
    "把握",
    "実装",
    "進めて",
    "すすめて",
    "お願い",
    "それで",
    "この",
    "あと",
    "ただ",
    "ローカル",
    "ローカルで",
    "ようなことをしたい",
    "ことをしたい",
    "ようにしたい",
    "してほしい",
    "してください",
    "確認して",
    "確認",
    "教えて",
    "どうしても",
    "まず",
    "そのまま",
    "その線引き",
    "運用時",
    "人間が動かしたら",
    "AIがkanbanを更新するときに元に戻さない",
)
ISSUE_WRAPPER_MARKERS = (
    "このメッセージはGitHub Issue経由で届いています。",
    "作業完了後は /githubissue スキル",
    "成果物（ツイート案・コード・分析結果等）はGitHub Issue上でしか確認できないため",
)
GENERIC_TITLE_PATTERNS = (
    "これはどういう内容",
    "これどういう内容",
    "進めて",
    "すすめて",
    "go",
)
ASSISTANT_NOISE_MARKERS = (
    "Issue に投稿済み",
    "Issue報告",
    "GitHub Issue",
    "commit",
    "次の1手",
    "next action",
    "go で進めました",
)


@dataclass
class SessionAccumulator:
    session_id: str
    source_file: str
    start_at: str | None = None
    end_at: str | None = None
    session_cwd: str | None = None
    user_messages: list[str] = field(default_factory=list)
    assistant_messages: list[str] = field(default_factory=list)
    timeline_messages: list[tuple[str, str]] = field(default_factory=list)
    cwds: list[str] = field(default_factory=list)
    command_count: int = 0
    task_completed: int = 0
    task_started: int = 0


def iso_to_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def clip(text: str, limit: int) -> str:
    text = " ".join(text.split())
    if len(text) <= limit:
        return text
    return text[: limit - 1].rstrip() + "…"


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def extract_message_text(message_payload: dict[str, Any]) -> str:
    chunks: list[str] = []
    for item in message_payload.get("content", []):
        if item.get("type") in {"output_text", "input_text"} and item.get("text"):
            chunks.append(item["text"])
    return "\n".join(chunks).strip()


def strip_issue_wrapper(text: str) -> str:
    if not text:
        return text
    lines = text.splitlines()
    cleaned: list[str] = []
    for line in lines:
        if line.strip().startswith("[PANE:"):
            continue
        if any(marker in line for marker in ISSUE_WRAPPER_MARKERS):
            continue
        if line.strip() == "---":
            continue
        cleaned.append(line)
    text = "\n".join(cleaned).strip()
    return text


def strip_visual_attachment_markers(text: str) -> str:
    """Remove pasted image/file markers that describe the evidence, not the task.

    These markers are useful in the conversation but make poor kanban titles
    because they surface the UI review artifact instead of the underlying work.
    """
    if not text:
        return ""
    text = re.sub(r"<image\b[^>]*>.*?</image>", " ", text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r"\[Image\s*#?\d+\]", " ", text, flags=re.IGNORECASE)
    text = re.sub(r"画像\s*#?\d+", " ", text, flags=re.IGNORECASE)
    return " ".join(text.split())


def first_meaningful_line(text: str) -> str:
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        if line == "---":
            continue
        return line
    return text.strip()


def strip_leading_links(text: str) -> str:
    cleaned = text.strip()
    while True:
        updated = re.sub(r"^(https?://\S+)\s*[　 ]*", "", cleaned)
        updated = re.sub(r"^\[[^\]]+\]\((https?://[^)]+)\)\s*[　 ]*", "", updated)
        if updated == cleaned:
            return cleaned
        cleaned = updated.strip()


def clean_japanese_task_stem(text: str) -> str:
    cleaned = strip_visual_attachment_markers(strip_issue_wrapper(text)).strip()
    cleaned = re.sub(r"https?://\S+", "", cleaned)
    cleaned = cleaned.replace("ぼく", "").replace("僕", "")
    cleaned = cleaned.replace("今週の内容をみて", "今週の内容を見て")
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def taskify_japanese_title(title: str, cluster_label: str | None = None) -> str:
    text = clean_japanese_task_stem(title)
    lowered = text.lower()

    specific_rules: list[tuple[bool, str]] = [
        ("ブックマーク管理サイト" in text and cluster_label in {"bookmark", "bookmark / site"}, "ブックマーク管理サイト / ピン留め repo 見直し"),
        ("ランキングで並べ" in text and "llmwiki" in lowered, "LLMWIKIクエリの有望ナレッジ抽出"),
        ("内容がかぶってないか" in text and "llmwiki" in lowered, "LLMWIKIクエリ報告の重複チェック"),
        ("定期実行クエリ" in text and "過去" in text and "llmwiki" in lowered, "LLMWIKI定期実行クエリの過去分追跡"),
        ("比較して新情報" in text and "llmwiki" in lowered, "LLMWIKIとの差分確認"),
        ((("還付申告" in text) or ("e-tax" in lowered)) and ("状態" in text or "手続き" in text), "e-Tax還付申告の状態確認"),
        ("リンク未生成" in text and "メール" in text, "AI秘書メールのリンク未生成調査"),
        ("kanban" in lowered and "ai秘書" in text, "AI秘書のkanban自動更新"),
        ("ティザー" in text and "project-dof" in lowered, "project-dofティザーLP制作"),
        ("ピン留め" in text and "ブックマーク" in text, "ブックマーク管理サイトのピン留め見直し"),
        (("go-robust" in lowered or "/go-robust" in lowered) and ("移植" in text or "スキル" in text), "go-robustスキル移植"),
        (("private化" in text or "private" in lowered) and ("repo" in lowered or "リポジトリ" in text), "不要公開repoのprivate化整理"),
        (("スタート時" in text or "起動時" in text) and ("無効化" in text or "立ち上げ" in text), "スタート時の自動起動処理無効化"),
        ("状態・品質" in text, text),
        ("引き継ぎ" in text, text),
        ("読み順" in text and ".claude" in text, "agent.md / .claude 読み順整理"),
    ]
    for matched, replacement in specific_rules:
        if matched:
            return clip(replacement, 48)

    replacements: list[tuple[str, str]] = [
        (r"できる[？?]?$", "確認"),
        (r"してほしい$", ""),
        (r"見直してほしい$", "見直し"),
        (r"チェックしてほしい$", "チェック"),
        (r"調査してほしい$", "調査"),
        (r"確認してほしい$", "確認"),
        (r"並べて$", "整理"),
        (r"並べてください$", "整理"),
        (r"まとめてほしい$", "整理"),
        (r"教えて$", "確認"),
    ]
    for pattern, replacement in replacements:
        text = re.sub(pattern, replacement, text)

    text = re.sub(r"^(これらの|最近の|現在導入済みの|現在の)", "", text)
    text = text.rstrip("？?。 ")

    if "llmwiki" in lowered and not text.lower().startswith("llmwiki"):
        text = f"LLMWIKI {text}"
    if cluster_label == "llmwiki" and "LLMWIKI" not in text:
        text = f"LLMWIKI {text}"

    compact_rules: list[tuple[str, str]] = [
        (r"(.+?)を過去.?週間分追うことは.*", r"\1の過去分追跡"),
        (r"(.+?)の今週の内容を見て(.+?)ランキング.*", r"\1の有望ナレッジ抽出"),
        (r"(.+?)だけど(.+?)チェック", r"\1の重複チェック"),
        (r"(.+?)比較して新情報はある", r"\1との差分確認"),
    ]
    for pattern, replacement in compact_rules:
        updated = re.sub(pattern, replacement, text)
        if updated != text:
            text = updated
            break

    text = re.sub(r"\s+", " ", text).strip(" /")
    return clip(text or title, 48)


def normalize_user_message(text: str) -> str:
    text = strip_visual_attachment_markers(strip_issue_wrapper(text)).strip()
    if not text:
        return ""
    if text in TRIVIAL_COMMANDS:
        return ""
    if text in NOISY_EXACT:
        return ""
    if any(fragment in text for fragment in NOISY_CONTAINS):
        return ""
    if any(text.startswith(prefix) for prefix in NOISY_PREFIXES):
        return ""
    return text


def normalize_assistant_message(text: str) -> str:
    text = strip_issue_wrapper(text).strip()
    if not text:
        return ""
    lines: list[str] = []
    for raw in text.splitlines():
        line = raw.strip().lstrip("-*•").strip()
        if not line:
            continue
        if any(marker.lower() in line.lower() for marker in ASSISTANT_NOISE_MARKERS):
            continue
        lines.append(line)
    return " ".join(lines).strip()


def derive_message_keywords(cluster_label: str, repo_name: str, first_user_line: str) -> list[str]:
    keywords: list[str] = []
    for word in re.split(r"[ /:_-]+", cluster_label.lower()):
        if len(word) >= 3 and word not in CLUSTER_STOPWORDS:
            keywords.append(word)
    for word in re.findall(r"[\u3040-\u30ff\u3400-\u9fff]{2,10}", cluster_label + " " + first_user_line):
        if word not in JP_CLUSTER_NOISE:
            keywords.append(word)
    if repo_name and repo_name != "unknown":
        keywords.append(repo_name.lower())
    return list(dict.fromkeys(keywords))[:12]


def keyword_score(text: str, keywords: list[str]) -> int:
    lowered = text.lower()
    score = 0
    for keyword in keywords:
        if keyword and keyword.lower() in lowered:
            score += 1
    return score


def pick_relevant_excerpt(messages: list[str], keywords: list[str], *, assistant: bool = False) -> tuple[str, int]:
    normalizer = normalize_assistant_message if assistant else normalize_user_message
    best_text = ""
    best_score = -1
    fallback = ""
    for raw in reversed(messages):
        cleaned = normalizer(raw)
        if not cleaned:
            continue
        if not fallback:
            fallback = cleaned
        score = keyword_score(cleaned, keywords)
        if score > best_score:
            best_text = cleaned
            best_score = score
        if score >= 2:
            return clip(cleaned, 220), score
    chosen = best_text or fallback
    return clip(chosen, 220), max(best_score, 0)


def pick_recent_excerpt(messages: list[str], *, assistant: bool = False) -> str:
    normalizer = normalize_assistant_message if assistant else normalize_user_message
    for raw in reversed(messages):
        cleaned = normalizer(raw)
        if cleaned:
            return clip(cleaned, 260)
    return ""


def collect_latest_phase_context(timeline_messages: list[tuple[str, str]], max_items: int = 16) -> str:
    """Return the latest working phase, not the whole session."""
    rows: list[str] = []
    for role, raw in reversed(timeline_messages):
        normalizer = normalize_assistant_message if role == "assistant" else normalize_user_message
        cleaned = normalizer(raw)
        if not cleaned:
            continue
        if role == "user" and cleaned.lower() in CONTINUE_TOKENS:
            continue
        rows.append(f"{role}: {clip(cleaned, 320)}")
        if len(rows) >= max_items:
            break
    rows.reverse()
    return "\n".join(rows)


def extract_blocker_ja(*texts: str) -> str | None:
    combined = "\n".join(texts).lower()
    if not combined.strip():
        return None
    if "blocked" in combined or "ボトルネック" in combined or "止まって" in combined:
        return "作業が止まっている / blocked の可能性"
    if "pending" in combined or "保留" in combined:
        return "保留条件が残っている"
    if "規約" in combined or "同意" in combined:
        return "同意・利用規約まわりで停止している可能性"
    if "credential" in combined or "api key" in combined:
        return "認証情報や接続情報待ち"
    if "未生成" in combined:
        return "生成失敗 / 未生成の原因切り分けが未完了"
    return None


def compact_japanese_excerpt(text: str, limit: int = 140) -> str:
    if not text:
        return ""
    cleaned = strip_visual_attachment_markers(strip_issue_wrapper(text))
    cleaned = re.sub(r"https?://\S+", "", cleaned)
    cleaned = re.sub(r"`([^`]+)`", r"\1", cleaned)
    cleaned = re.sub(r"\*{1,3}([^*]+)\*{1,3}", r"\1", cleaned)
    cleaned = re.sub(r"\[[^\]]+\]\(([^)]+)\)", "", cleaned)
    cleaned = cleaned.replace("## ", "").replace("### ", "")
    cleaned = " ".join(cleaned.split())
    cleaned = re.split(r"(?:\s/\s| / |\n)", cleaned)[0].strip()
    sentence_parts = re.split(r"(?<=[。！？])\s*", cleaned)
    if sentence_parts and sentence_parts[0]:
        first_sentence = sentence_parts[0].strip()
        if 8 <= len(first_sentence) <= max(36, limit):
            cleaned = first_sentence
    cleaned = re.sub(r"(follow-up\s*\d+件).*", r"\1", cleaned, flags=re.IGNORECASE)
    return clip(cleaned, limit)


def derive_current_goal_ja(display_title: str, relevant_user: str) -> str:
    title_candidate = compact_japanese_excerpt(display_title, 120)
    generic = not title_candidate or title_candidate.lower().startswith("unknown:") or title_candidate.lower() in GENERIC_TITLE_PATTERNS
    candidate = compact_japanese_excerpt(relevant_user, 120) if generic else title_candidate
    if not candidate:
        candidate = compact_japanese_excerpt(relevant_user, 120) or title_candidate
    candidate = re.sub(r"^(最近の|現在の)", "", candidate)
    candidate = candidate.rstrip("？?。 ")
    return candidate or display_title


def is_surface_artifact_title(title: str) -> bool:
    """True when the title still looks like a pasted prompt/screenshot caption."""
    if not title:
        return True
    lowered = title.lower()
    return (
        "[image" in lowered
        or "…" in title
        or "してほしい" in title
        or title.endswith(("してほしい", "してください", "知りたい", "教えて"))
        or "？" in title
        or "?" in title
        or len(title) > 58
    )


def is_generic_confirmation_title(text: str) -> bool:
    lowered = (text or "").lower()
    generic_confirmation = (
        (any(token in text for token in ("進捗", "状態", "現状")) and "確認" in text)
        or "内容確認" in text
        or "どういう内容" in text
        or "差分確認" in text
        or lowered.endswith("/ explain")
    )
    if not generic_confirmation:
        return False
    if "差分確認" in text:
        return True
    return not any(
        token in lowered
        for token in (
            "e-tax",
            "還付",
            "b2b",
            "llmwiki",
            "kanban",
            "メール",
                "ブックマーク",
                "sparkline",
                "ランキング",
                "grok4cic",
            "clipboard",
            "クリップボード",
            "image2",
            "画像",
            "ティザー",
        )
    )


def is_weak_task_title(text: str) -> bool:
    """Titles like 内容確認/状態確認 are entry prompts, not final task names."""
    if not text:
        return True
    lowered = text.lower()
    weak_tokens = (
        "内容確認",
        "状態確認",
        "状態・品質確認",
        "進捗確認",
        "差分確認",
        "の整理",
        "を整理",
    )
    if any(token in text for token in weak_tokens):
        return True
    return lowered.endswith("/ explain")


def concrete_title_from_topic(repo_name: str, topic_label: str, latest_change: str, fallback: str, context: str = "") -> str:
    latest_source = f"{latest_change or ''}\n{context or ''}"
    latest = latest_source.lower()
    if topic_label == "grok4cic運用":
        latest_only = (latest_change or "").lower()
        if "image2" in latest_only or "画像" in latest_only or "chatgpt" in latest_only:
            return f"{repo_name}のGPT Image2/CiC画像生成検証"
        return f"{repo_name}のgrok4cic/クリップボード運用検証"
    if topic_label == "repoレビュー":
        structured = compose_task_title_from_intent(repo_name, topic_label, latest_source)
        if structured:
            return structured
    if topic_label == "ログイン・手続き":
        structured = compose_task_title_from_intent(repo_name, topic_label, latest_source)
        if structured:
            return structured
    if topic_label == "クリエイティブ素材":
        if "動画" in latest or "video" in latest:
            return f"{repo_name}の動画生成サービス検証"
        if repo_name == "project-dof" and "なかも" in latest and ("chatgpt" in latest or "cic" in latest or "image2" in latest):
            return f"{repo_name}のなかも画像生成をChatGPT/CiCで検証"
        if "chatgpt" in latest or "cic" in latest or "image2" in latest:
            return f"{repo_name}のChatGPT/CiC画像生成検証"
        return f"{repo_name}の画像・プロンプト素材検証"
    if topic_label == "ティザーLP":
        return f"{repo_name}のティザーLP制作"
    if topic_label == "デプロイ":
        structured = compose_task_title_from_intent(repo_name, topic_label, latest_source)
        if structured:
            return structured
        return f"{repo_name}の公開反映"
    if topic_label == "UI表示修正":
        return f"{repo_name}の表示文言・レイアウト修正"
    if topic_label == "需要レンズ指数設計":
        return f"{repo_name}の需要・マネタイズ指数設計"
    if topic_label == "B2Bポートフォリオページ改善":
        if "ai組み込み開発" in latest.lower() or "ai-integration" in latest.lower():
            return "B2BポートフォリオのAI組み込み開発ページ改善"
        if "問い合わせ" in latest or "inquiry" in latest.lower():
            return "B2Bポートフォリオの問い合わせ業務支援ページ改善"
        return "B2Bポートフォリオのページ内容・図解改善"
    if topic_label == "LLMWIKI品質レビュー導線改善":
        return "LLMWIKI品質レビュー導線の改善"
    if topic_label == "ナレッジ取り込み":
        if "過去" in latest_source and ("定期実行" in latest_source or "クエリ" in latest_source):
            return "LLMWIKI定期実行クエリの過去分追跡"
        if "差分" in latest_source:
            return "LLMWIKIとの差分確認"
        return "LLMWIKI 週次レビューと取り込み整理"
    structured = compose_task_title_from_intent(repo_name, topic_label, latest_source)
    if structured:
        return structured
    if topic_label and topic_label not in {"repoレビュー", "ログイン・手続き"}:
        return f"{repo_name}の{topic_label}"
    return fallback


RECOMPOSABLE_TOPIC_LABELS = {
    "LinkedInオファー返信方針",
    "LLMWIKIクエリ報告メール重複抑止",
    "go-robustスキル移植",
    "grok4cic運用",
    "クリエイティブ素材",
    "スタート時の自動起動処理無効化",
    "タスク別送信者名",
    "ティザーLP",
    "デプロイ",
    "UI表示修正",
    "ナレッジ取り込み",
    "ネットワーク不安定の原因調査",
    "ブックマーク見直し",
    "メールリンク未生成調査",
    "メール運用",
    "ランキング鮮度・sparkline修正",
    "需要レンズ指数設計",
    "レビュー修正点DB/hook連携",
    "B2Bポートフォリオページ改善",
    "LLMWIKI品質レビュー導線改善",
    "ログイン・手続き",
    "private化",
    "repoレビュー",
}


def should_recompose_title_for_topic(title: str, topic_label: str, concrete_title: str) -> bool:
    """Decide if the topic-derived title is safer than the current surface title.

    This is intentionally shape/consistency based: avoid one-off project names,
    and repair titles that look like pasted prompts, generic confirmations, or
    older intent fragments after the extracted topic shifted.
    """
    if not concrete_title or concrete_title == title:
        return False
    if topic_label == "クリエイティブ素材" and any(token in title for token in ("画像生成", "プロンプト", "素材", "シーン")):
        return False
    if is_surface_artifact_title(title) or is_weak_task_title(title):
        return True
    if topic_label in RECOMPOSABLE_TOPIC_LABELS and topic_label not in title:
        title_terms = set(re.findall(r"[A-Za-z0-9_-]{3,}|[一-龥ぁ-んァ-ン]{2,}", title.lower()))
        concrete_terms = set(re.findall(r"[A-Za-z0-9_-]{3,}|[一-龥ぁ-んァ-ン]{2,}", concrete_title.lower()))
        overlap = title_terms & concrete_terms
        if not overlap or len(overlap) <= 1:
            return True
    return False


def clean_intent_object(text: str) -> str:
    cleaned = compact_japanese_excerpt(text, 64)
    cleaned = re.sub(r"^(まず|次に|今回|今|実際に|そのまま|こちらで|あなたの|僕の)", "", cleaned)
    cleaned = re.sub(r"(が|は)?(酷い|ひどい|おかしい|変|微妙)(ので|から)?", "", cleaned)
    cleaned = re.sub(r"(修正|改善|確認|整理|デプロイ|deploy|完了|済み)(してほしい|してください|しました|します)?", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"(する|したい|してほしい|できる|必要がある|と思ってる)$", "", cleaned)
    cleaned = cleaned.strip(" 、。・:：/　")
    cleaned = re.sub(r"^(repoの|リポジトリの|現在の|今の|この|その)", "", cleaned)
    return clip(cleaned, 42)


def extract_method_phrase(text: str) -> str:
    lowered = text.lower()
    methods: list[str] = []
    if "chatgpt" in lowered or "ブラウザ版chatgpt" in lowered:
        methods.append("ChatGPT")
    if "cic" in lowered or "claude in chrome" in lowered:
        methods.append("CiC")
    if "image2" in lowered or "gpt image2" in lowered or "gpt-image-2" in lowered:
        methods.append("Image2")
    if "clipboard" in lowered or "クリップボード" in lowered:
        methods.append("クリップボード")
    if "grok4cic" in lowered and not methods:
        methods.append("grok4cic")

    ordered: list[str] = []
    for method in methods:
        if method not in ordered:
            ordered.append(method)
    if ordered[:3] == ["ChatGPT", "CiC", "Image2"]:
        return "ChatGPT/CiC"
    if ordered[:2] == ["ChatGPT", "CiC"]:
        return "ChatGPT/CiC"
    if ordered:
        return "/".join(ordered[:3])
    return ""


def extract_action_phrase(text: str, topic_label: str) -> str:
    if topic_label == "転職・求人選別" or "返信方針" in topic_label:
        return "整理"
    if topic_label == "レビュー修正点DB/hook連携":
        return "整備"
    if topic_label == "ランキング鮮度・sparkline修正":
        return "修正"
    if topic_label == "デプロイ":
        if any(token in text for token in ("修正", "改善", "調整")):
            return "修正"
        return "デプロイ"
    if topic_label == "repoレビュー" and ("入れました" in text or "add " in text.lower() or "追加" in text):
        return "追加"
    for verb in ("検証", "再生成", "生成", "改善", "整理", "作成", "実装", "確認", "送信", "投入", "回収", "保存", "追加", "修正"):
        if verb in text:
            if verb in {"生成", "再生成"} and ("chatgpt" in text.lower() or "cic" in text.lower() or "image2" in text.lower()):
                return "検証"
            return verb
    defaults = {
        "クリエイティブ素材": "検証",
        "grok4cic運用": "検証",
        "ティザーLP": "制作",
        "メール運用": "整理",
        "ブックマーク見直し": "見直し",
        "ナレッジ取り込み": "整理",
        "転職・求人選別": "整理",
        "レビュー修正点DB/hook連携": "整備",
        "ランキング鮮度・sparkline修正": "修正",
        "デプロイ": "デプロイ",
        "UI表示修正": "修正",
    }
    return defaults.get(topic_label, "整理")


def extract_object_phrase(text: str, topic_label: str) -> str:
    lowered_text = text.lower()
    if topic_label == "転職・求人選別" or "返信方針" in topic_label:
        if "LinkedInオファー返信" in topic_label:
            if "松尾研究所" in text:
                return "LinkedInオファー返信方針（直近: 松尾研究所）"
            if "副業" in text or "フリーランス" in text or "side-gig" in lowered_text:
                return "LinkedInオファー返信方針（副業案件含む）"
            return "LinkedInオファー返信方針"
        if "松尾研究所" in topic_label:
            return "松尾研究所ポジション返信方針"
        if "副業" in topic_label:
            return "副業案件返信方針"
        if "選考結果" in topic_label:
            return "選考結果返信方針"
        if "求人紹介" in topic_label:
            return "求人紹介返信方針"
        if "松尾研究所" in text:
            return "松尾研究所ポジション返信方針"
        if "副業" in text or "フリーランス" in text:
            return "副業案件返信方針"
        if "返信" in text or "文面" in text:
            return "求人紹介返信方針"
        if "選考結果" in text or "不採用" in text:
            return "選考結果返信方針"
        if "求人選別" in text or "求人" in text:
            return "求人選別"
        if "応募" in text:
            return "応募候補整理"
        if "linkedin" in lowered_text or "オファー" in text:
            return "LinkedInオファー確認"
        return "転職候補整理"
    if topic_label == "レビュー修正点DB/hook連携":
        if "修正点" in text and ("hook" in lowered_text or "フック" in text):
            return "レビュー修正点DB/hook連携"
        if "db" in lowered_text or "データベース" in text:
            return "レビュー修正点DB"
        return "レビュースキル改善ワークフロー"
    if topic_label == "ランキング鮮度・sparkline修正":
        if "sparkline" in lowered_text or "折れ線" in text:
            return "ランキング鮮度とsparkline表示"
        if "snapshot" in lowered_text or "鮮度" in text:
            return "ランキングsnapshot鮮度"
        return "ランキング表示"
    if topic_label == "デプロイ":
        visual_text = strip_visual_attachment_markers(text)
        for pattern in (
            r"([^。\n！？]{2,36}?)(?:を|が|は)[^。\n！？]{0,18}?(?:修正|改善|調整)",
            r"([^。\n！？]{2,36}?)(?:の)?(?:改行|配色|色|余白|レイアウト|表示)",
        ):
            match = re.search(pattern, visual_text, flags=re.IGNORECASE)
            if match:
                obj = clean_intent_object(match.group(1))
                if obj and obj not in {"これ", "ここ", "この", "その"}:
                    return obj
        return "公開反映"
    if topic_label == "UI表示修正":
        if "改行" in text:
            return "改行・表示文言"
        if "色" in text or "配色" in text:
            return "配色・表示"
        return "表示文言・レイアウト"
    if topic_label == "ティザーLP":
        return "ティザーLP"
    if topic_label == "メール運用":
        if "リンク未生成" in text:
            return "メールリンク未生成調査"
        if "重複" in text:
            if "llmwiki" in lowered_text or "クエリ" in text:
                return "LLMWIKIクエリ報告メール重複抑止"
            return "メール重複抑止"
        if "送信者名" in text or "別 gmail" in lowered_text or "alias" in lowered_text:
            return "タスク別送信者名"
        return "メール運用"
    if topic_label in {"メールリンク未生成調査", "LLMWIKIクエリ報告メール重複抑止", "タスク別送信者名"}:
        return topic_label
    if topic_label == "repoレビュー":
        if "readme" in lowered_text and ("preview" in lowered_text or "プレビュー" in text or "実画面" in text):
            return "READMEライブダッシュボードプレビュー"
        if "dashboard-preview" in lowered_text:
            return "dashboard preview画像"
        if "readme" in lowered_text:
            return "README"
        return "repo品質改善"
    if topic_label == "ログイン・手続き":
        if "ゆうちょ銀行以外" in text or "振込み" in text or "振込" in text or "口座" in text:
            return "還付金振込先入力"
        if "ログイン" in text:
            return "ログイン後手続き"
        return "手続き入力"
    if topic_label == "ブックマーク見直し":
        return "ブックマーク見直し"
    if topic_label == "ナレッジ取り込み":
        if "差分" in text:
            if "現在導入済み" in text or "導入済み" in text:
                return "導入済みLLMWIKIとの差分確認"
            return "LLMWIKI差分確認"
        return "ナレッジ取り込み"
    if topic_label == "クリエイティブ素材":
        if "なかも" in lowered_text and ("画像" in lowered_text or "image" in lowered_text):
            return "なかも画像生成"
        if "scene_" in lowered_text or "シーン" in lowered_text:
            return "シーン画像生成"
        if "画像生成" in lowered_text or "image generation" in lowered_text:
            return "画像生成"
        return "画像・プロンプト素材"

    candidates: list[str] = []
    for pattern in (
        r"(?P<object>[^。\n！？]{2,48}?)を(?:ChatGPT|CiC|ブラウザ版|gpt|GPT|image2|Image2)?[^。\n！？]{0,16}?(?:で|に)?(?:生成|検証|改善|整理|作成|実装|確認|送信|投入|回収|保存)",
        r"(?P<object>[^。\n！？]{2,36}?)(?:の)?(?:品質|精度|再現性|ボトルネック)",
        r"(?P<object>[^。\n！？]{2,36}?)(?:画像生成|LP制作|メール運用|ブックマーク見直し|ナレッジ取り込み|販路拡大)",
    ):
        for match in re.finditer(pattern, text, flags=re.IGNORECASE):
            candidates.append(clean_intent_object(match.group("object")))

    if topic_label == "クリエイティブ素材" or any(token in text.lower() for token in ("画像生成", "image2", "gpt image", "chatgpt")):
        entity_match = re.search(r"([ぁ-んァ-ン一-龥A-Za-z0-9_-]{2,18})(?:らしさ|キャラ|固有要素|画像|scene|シーン)", text)
        entity = clean_intent_object(entity_match.group(1)) if entity_match else ""
        if entity and entity not in {"画像生成", "背景維持", "画風統一", "ブラウザ版"}:
            return f"{entity}画像生成"
        if "画像生成" in text:
            return "画像生成"

    for candidate in candidates:
        lowered = candidate.lower()
        if not candidate or len(candidate) < 2:
            continue
        if any(tool in lowered for tool in ("chatgpt", "cic", "grok4cic", "clipboard", "クリップボード", "ログイン", "前面タブ")):
            continue
        if candidate in {"現在", "状態", "進捗", "確認", "今回", "実行経路"}:
            continue
        return candidate

    defaults = {
        "クリエイティブ素材": "画像・プロンプト素材",
        "grok4cic運用": "CiC/クリップボード運用",
        "ティザーLP": "ティザーLP",
        "メール運用": "メール運用",
        "ブックマーク見直し": "ブックマーク見直し",
        "ナレッジ取り込み": "ナレッジ取り込み",
        "レビュー修正点DB/hook連携": "レビュー修正点DB/hook連携",
        "ランキング鮮度・sparkline修正": "ランキング鮮度とsparkline表示",
        "デプロイ": "公開反映",
        "UI表示修正": "表示文言・レイアウト",
    }
    return defaults.get(topic_label, "")


def compose_task_title_from_intent(repo_name: str, topic_label: str, context: str) -> str | None:
    """Compose a task title from object/action/method instead of fixed names."""
    if not context.strip():
        return None
    obj = extract_object_phrase(context, topic_label)
    if not obj:
        return None
    action = extract_action_phrase(context, topic_label)
    method = extract_method_phrase(context)
    if topic_label == "転職・求人選別" or "返信方針" in topic_label:
        if obj.startswith("LinkedInオファー返信方針"):
            title = obj
        elif obj.endswith("方針"):
            title = obj
        elif obj.endswith("確認"):
            title = f"{obj}の整理"
        elif obj.endswith("整理"):
            title = obj
        else:
            title = f"{obj}を{action}"
    elif topic_label == "ナレッジ取り込み" and "差分確認" in obj:
        title = obj
    elif topic_label == "転職・求人選別" and obj.endswith("方針"):
        title = obj
    elif topic_label == "LinkedInオファー返信方針" and obj.startswith("LinkedInオファー返信方針"):
        title = obj
    elif topic_label == "ログイン・手続き":
        if "還付金" in obj:
            title = f"e-Tax{obj}手順"
        else:
            title = f"{obj}手順"
    elif (topic_label == "メール運用" or "メール" in topic_label or "送信者名" in topic_label) and obj.endswith(("抑止", "調査", "送信者名")):
        title = obj
    elif repo_name != "unknown" and obj.lower().startswith(f"{repo_name.lower()}の"):
        title = obj if obj.endswith(action) else f"{obj}を{action}"
    elif obj.endswith(action):
        title = f"{repo_name}の{obj}"
    elif method and method not in obj:
        title = f"{repo_name}の{obj}を{method}で{action}"
    else:
        particle = "を" if not obj.endswith(("運用", "見直し", "整理", "制作", "検証", "確認")) else "の"
        title = f"{repo_name}の{obj}{particle}{action}"
    title = re.sub(r"生成を生成$", "生成を検証", title)
    title = re.sub(r"検証を検証$", "検証", title)
    return clip(title, 64)


def clip_around_token(text: str, token: str, limit: int = 220) -> str:
    index = text.lower().find(token.lower())
    if index < 0:
        return compact_japanese_excerpt(text, limit)
    start = max(index - limit // 3, 0)
    end = min(index + limit, len(text))
    return compact_japanese_excerpt(text[start:end], limit)


def collect_topic_signal_context(user_messages: list[str], assistant_messages: list[str]) -> str:
    """Collect high-signal snippets from the whole session for topic naming.

    This is intentionally broader than the latest turn because long sessions
    often start with a real goal, then end with tool/procedure discussion. The
    title should prefer the goal/artifact over the final operation detail.
    """
    signal_tokens = (
        "なかも",
        "画像生成",
        "image2",
        "gpt image",
        "chatgpt",
        "scene_",
        "ティザー",
        "メール",
        "ブックマーク",
        "llmwiki",
        "販路",
        "google ビジネスプロフィール",
        "求人",
        "転職",
        "応募",
        "年収",
        "linkedin",
        "修正点",
        "レビュースキル",
        "hook",
        "db",
        "claude-review-pdca",
        "ランキング",
        "sparkline",
        "snapshot",
        "鮮度",
        "vercel",
    )
    messages = [*user_messages, *assistant_messages]
    project_context_text = "\n".join(messages).lower()
    project_dof_context = "project-dof" in project_context_text or "project dof" in project_context_text
    priority_snippets = [
        clip_around_token(message, "なかも", 220)
        for message in messages
        if project_dof_context and "なかも" in message.lower()
    ][:3]
    snippets: list[str] = list(priority_snippets)
    for message in messages:
        lowered = message.lower()
        if any(token in lowered for token in signal_tokens):
            if "なかも" in lowered and not project_dof_context:
                lowered_without_project_entity = lowered.replace("なかも", "")
                if not any(token in lowered_without_project_entity for token in signal_tokens if token != "なかも"):
                    continue
            snippet = compact_japanese_excerpt(message, 220)
            if snippet not in snippets:
                snippets.append(snippet)
        if len(snippets) >= 6:
            break
    return "\n".join(snippets)


def build_deep_summary_ja(current_goal: str, latest_change: str, blocker: str | None, task_shift: bool) -> str:
    parts = [current_goal]
    if blocker:
        parts.append(f"停止要因: {blocker}")
    elif latest_change and latest_change != current_goal:
        parts.append(f"直近: {compact_japanese_excerpt(latest_change, 150)}")
    if task_shift:
        parts.append("直近topicを優先")
    return clip(" / ".join(part for part in parts if part), 240)


def build_summary_ja(current_goal: str, latest_change: str, blocker: str | None, follow_up_count: int, task_shift: bool) -> str:
    parts = [current_goal]
    if blocker:
        parts.append(f"現状: {blocker}")
    elif latest_change and compact_japanese_excerpt(latest_change, 80) != compact_japanese_excerpt(current_goal, 80):
        parts.append(f"現状: {compact_japanese_excerpt(latest_change, 90)}")
    elif follow_up_count > 0:
        parts.append(f"follow-up {follow_up_count}件")
    if task_shift:
        parts.append("直近topic優先")
    return clip(" / ".join(part for part in parts if part), 180)


def canonical_cluster_title(cluster_label: str | None, repo_name: str) -> str | None:
    mapping = {
        "bookmark": "ブックマーク管理サイト / ピン留め repo 見直し",
        "bookmark / site": "ブックマーク管理サイトの確認",
        "e-tax": "e-Tax還付申告の状態確認",
        "ai secretary / kanban": "AI秘書のkanban自動更新",
        "ai secretary / mail links": "AI秘書メールのリンク未生成調査",
        "B2B sales channel / Google Business Profile": "B2Bポートフォリオの販路拡大",
        "network / instability": "ネットワーク不安定の原因調査",
        "project / dof": "project-dofティザーLP制作",
        "agent instructions": "agent.md / .claude 読み順整理",
        "grok4cic / clipboard rule": "grok4cic のクリップボード運用ルール整理",
        "llmwiki": "LLMWIKI関連タスク",
        "robust": "go-robustスキル移植",
        "repo / privatize": "不要公開repoのprivate化整理",
        "linkedin offer / 前田空我": "LinkedInオファー確認: 前田空我",
    }
    if cluster_label in mapping:
        return mapping[cluster_label]
    if cluster_label == f"{repo_name} / repo review":
        return f"{repo_name} の状態・品質確認"
    if cluster_label == f"{repo_name} / handoff":
        return f"{repo_name} の引き継ぎ整理"
    if cluster_label == f"{repo_name} / explain":
        return f"{repo_name} の内容確認"
    return None


def needs_title_repair(title: str) -> bool:
    lowered = title.lower()
    return (
        len(title) > 42
        or "..." in title
        or "なんとか" in title
        or "多分" in title
        or "知りたい" in title
        or "してる" in title
        or "最近品質をあげた" in title
        or title.startswith("の")
        or lowered.startswith("github")
    )


def normalize_latest_change_for_summary(text: str) -> str:
    compact = compact_japanese_excerpt(text, 90)
    replacements = [
        (r"^なら選ぶのはこれです.*", "選択手順を案内済み"),
        (r"^完了です.*push 済みです.*", "完了寄り。push 済み"),
        (r"^完了です.*", "完了寄り"),
        (r"^掃除した.*", "整理済み"),
        (r"^デプロイ進めた.*", "デプロイ実施済み"),
        (r"^進めました。今回やったこと.*", "改善実装を進行中"),
        (r"^進めました.*", "改善実装を進行中"),
        (r"^はい、それはできます.*", "実現可否は確認済み"),
    ]
    for pattern, replacement in replacements:
        updated = re.sub(pattern, replacement, compact)
        if updated != compact:
            return updated
    return compact


def cluster_task_body_ja(cluster_label: str | None, current_goal: str) -> str:
    if cluster_label and ("スタート時" in cluster_label or "起動" in cluster_label):
        return "PC起動時に自動で立ち上がる処理を無効化・整理するタスク。不要な自動起動、残っている起動元、再発防止の確認点を整理する。"
    mapping = {
        "llmwiki": "LLMWIKI関連の調査・週次レビュー・取り込み候補を整理するタスク。今取り入れるナレッジ、運用改善、残確認を分けて扱う。",
        "bookmark": "ブックマーク管理サイトとGitHubピン留めrepoの見直しタスク。反映済み変更と残件を整理し、次に入れ替える対象を判断する。",
        "bookmark / site": "ブックマーク管理サイトの表示・導線・repo連携を確認するタスク。改善済み箇所と残りの確認点を整理する。",
        "e-tax": "e-Tax還付申告の手続き状況を確認するタスク。ログイン後の状態、必要入力、次に必要な判断を整理する。",
        "ai secretary / kanban": "AI秘書がCodexセッションを読み取り、kanban候補へ整理する仕組みを作るタスク。自動判定とhuman overrideの境界を保つ。",
        "ai secretary / mail links": "AI秘書メールでリンクが未生成になる原因を切り分けるタスク。入力、テンプレート、生成処理、投稿経路を確認する。",
        "B2B sales channel / Google Business Profile": "B2Bポートフォリオの販路拡大タスク。Googleビジネスプロフィール等の販路候補、停止理由、次に必要な判断を整理する。",
        "project / dof": "project-dofのティザーLPを制作・改善するタスク。デザイン、素材、公開状態、次に詰める画面を整理する。",
        "network / instability": "ネットワーク不安定の原因を切り分けるタスク。回線、無線、時間帯、機器側のどこに問題があるかを確認する。",
        "agent instructions": "agent.md / .claude / Codex側instructionの読み順と責務を整理するタスク。実際に参照される順序と衝突を確認する。",
        "grok4cic / clipboard rule": "grok4cicとクリップボード連携の運用ルールを整理するタスク。CiCへ渡す情報と自動実行の境界を明確にする。",
        "robust": "go-robustスキルをCodex側でも使えるように移植・整理するタスク。既存のClaude Code運用との差分と配置先を確認する。",
        "repo / privatize": "公開不要なGitHub repoをprivate化するタスク。対象repo、fork扱い、公開し続ける理由の有無を整理する。",
        "linkedin offer / 前田空我": "LinkedInオファー内容を確認するタスク。返信要否、条件、次に確認する情報を整理する。",
        "クリエイティブ素材": f"{current_goal}するタスク。成果物の品質、実行経路、残っている再現性課題を整理する。",
        "grok4cic運用": f"{current_goal}するタスク。CiC経路、クリップボード投入、再現性課題を整理する。",
        "ティザーLP": f"{current_goal}を進めるタスク。LPの見せ方、素材、未完了セクション、公開確認を整理する。",
        "repoレビュー": f"{current_goal}。repoの状態・品質・残タスクを確認し、kanbanに載せる粒度へ整理する。",
        "kanban自動化": "AI秘書がCodexセッションを読み取り、kanban候補へ整理する仕組みを作るタスク。自動判定、統合、human overrideの境界を保つ。",
        "B2B販路拡大": "B2Bポートフォリオの販路拡大タスク。Googleビジネスプロフィール等の販路候補、停止理由、次に必要な判断を整理する。",
        "ログイン・手続き": f"{current_goal}を進めるタスク。ログイン後の状態、必要入力、次に必要な判断を整理する。",
        "ナレッジ取り込み": "LLMWIKI関連の調査・週次レビュー・取り込み候補を整理するタスク。今取り入れるナレッジ、運用改善、残確認を分けて扱う。",
        "メール運用": "AI秘書メールやLLMWIKI報告メールの運用を整理するタスク。生成、重複抑止、送信履歴、再通知条件を確認する。",
        "メールリンク未生成調査": "AI秘書メールでリンクが未生成になる原因を切り分けるタスク。入力、テンプレート、生成処理、投稿経路を確認する。",
        "LLMWIKIクエリ報告メール重複抑止": "LLMWIKIクエリ報告メールの重複を抑止するタスク。重複検知、失敗理由、送信履歴の掃除を確認する。",
        "タスク別送信者名": "タスク別にメール送信者名を分ける運用を整理するタスク。別Gmail、Send mail as alias、件名プレフィックスのどれで扱うか確認する。",
        "ブックマーク見直し": "ブックマーク管理サイトとGitHubピン留めrepoの見直しタスク。反映済み変更と残件を整理し、次に入れ替える対象を判断する。",
        "ネットワーク不安定の原因調査": "ネットワーク不安定の原因を切り分けるタスク。回線、無線、時間帯、機器設定のどこに問題があるかを確認する。",
        "LinkedInオファー確認: 前田空我": "LinkedInオファー内容を確認するタスク。返信要否、条件、次に確認する情報を整理する。",
        "agent.md / .claude 読み順確認": "agent.md / .claude / Codex側instructionの読み順と責務を整理するタスク。実際に参照される順序と衝突を確認する。",
        "go-robustスキル移植": "go-robustスキルをCodex側でも使えるように移植・整理するタスク。既存のClaude Code運用との差分と配置先を確認する。",
        "private化": "公開不要なGitHub repoをprivate化するタスク。対象repo、fork扱い、公開し続ける理由の有無を整理する。",
        "転職・求人選別": "転職・求人候補を整理するタスク。候補企業、年収条件、応募優先度、保留条件を確認する。",
        "求人紹介返信方針": "求人紹介への返信方針を整理するタスク。温度感、返信文面、応募/面談に進む条件を確認する。",
        "松尾研究所ポジション返信方針": "松尾研究所ポジションへの返信方針を整理するタスク。関心領域、面談希望、文量と温度感を確認する。",
        "副業案件返信方針": "副業・フリーランス案件への返信方針を整理するタスク。現時点の稼働条件、前向きさ、将来余地の書き方を確認する。",
        "選考結果返信方針": "選考結果連絡への返信方針を整理するタスク。感謝、受領、次に進めたい求人、文量を確認する。",
        "LinkedInオファー返信方針": "LinkedIn経由の求人・副業オファー返信方針を整理するタスク。送信者、対象ポジション、温度感、返信文面を確認する。",
        "レビュー修正点DB/hook連携": "レビューで出た実装修正点をDBに蓄積し、次回hookで呼び出すワークフローを整備するタスク。既存実装、未接続箇所、運用手順を確認する。",
        "ランキング鮮度・sparkline修正": "ランキング画面の鮮度表示とsparkline表示を修正するタスク。当日snapshot生成、Vercel反映、折れ線の見やすさを確認する。",
    }
    if cluster_label in mapping:
        return mapping[cluster_label]
    if cluster_label and "内容確認" in cluster_label:
        return f"{current_goal}。対象の目的、現在地、変更済み内容、残っている判断点を整理する。"
    if cluster_label and "引き継ぎ" in cluster_label:
        return f"{current_goal}。引き継ぎ済み内容、未整理の残件、次に見るべきrepo/ドキュメントを整理する。"
    if cluster_label and cluster_label.endswith(" / repo review"):
        return f"{current_goal}。repoの状態・品質・残タスクを確認し、kanbanに載せる粒度へ整理する。"
    if cluster_label and cluster_label.endswith(" / handoff"):
        return f"{current_goal}。引き継ぎに必要な現在地、残件、次の一手を整理する。"
    return f"{current_goal}を進めるタスク。目的、現在地、残件、次の一手を整理する。"


def build_task_body_summary_ja(
    cluster_label: str | None,
    current_goal: str,
    blocker: str | None,
    doneish: bool,
    pendingish: bool,
    task_shift: bool,
    latest_change: str | None = None,
) -> str:
    body = revise_task_body_ja(cluster_label, current_goal, cluster_task_body_ja(cluster_label, current_goal), latest_change or "")
    notes: list[str] = []
    if cluster_label == "kanban自動化" and blocker == "保留条件が残っている":
        blocker = None
        pendingish = False
    if blocker:
        notes.append(f"現状: {blocker}。")
    elif doneish:
        notes.append("直近は完了寄り。反映済み範囲と残件だけ確認する。")
    elif pendingish:
        notes.append("直近は保留寄り。再開条件を確認する。")
    if task_shift:
        notes.append("直近topicを現在タスクとして扱う。")
    return clip(" ".join([body, *notes]), 260)


def latest_task_context_note_ja(cluster_label: str | None, latest_change: str) -> str:
    """Convert latest raw chat into a task-context note.

    Card bodies should explain the project task, not paste the latest message.
    Only add a short normalized note when it gives durable task context.
    """
    text = latest_change or ""
    lowered = text.lower()
    if not text.strip():
        return ""
    if any(token in lowered for token in ("go", "了解", "進めます", "続行", "sc-ui", "残タスク")):
        return ""
    if any(token in text for token in ("止まった", "停止", "保留", "blocked")):
        return "停止箇所と再開条件を整理する。"
    if any(token in text for token in ("反映済", "デプロイ", "deploy", "push 済み", "本番")):
        return "反映済み範囲と残確認を整理する。"
    if any(token in text for token in ("3案", "複数案", "コンタクトシート", "1枚絵", "案を")):
        return "複数案の比較と次に採用する方向を整理する。"
    if cluster_label == "ティザーLP" and any(token in text for token in ("デザイン", "素材", "画面", "LP")):
        return "LPの見せ方、素材、未完了画面を整理する。"
    if cluster_label == "クリエイティブ素材" and any(token in lowered for token in ("image", "画像", "prompt", "プロンプト", "chatgpt", "cic")):
        return "生成経路、成果物品質、再現性課題を整理する。"
    if cluster_label == "B2Bポートフォリオページ改善" and any(token in text for token in ("図解", "ページ", "文言", "ワークフロー")):
        return "ページ内容、図解、文言、公開反映を整理する。"
    if cluster_label == "需要レンズ指数設計" and any(token in text for token in ("指数", "マネタイズ", "需要", "供給")):
        return "指標定義、根拠ソース、今後の調整方針を整理する。"
    if cluster_label == "kanban自動化" and any(token in lowered for token in ("kanban", "candidate", "cluster", "session")):
        return "候補抽出、統合、状態判定の再発防止ルールを整理する。"
    return ""


def revise_task_body_ja(cluster_label: str | None, current_goal: str, base_body: str, latest_change: str) -> str:
    """Make the card body read like a task summary, not a template sentence."""
    label = cluster_label or ""
    topic_focus = {
        "デプロイ": "表示修正と公開反映の状態を確認する。",
        "UI表示修正": "表示文言、改行、配色、レイアウトの崩れを確認する。",
        "ランキング鮮度・sparkline修正": "ランキング画面の鮮度・グラフ表示・本番反映を確認する。",
        "クリエイティブ素材": "生成サービス、成果物品質、利用条件、再現性を確認する。",
        "grok4cic運用": "CiC経路、クリップボード投入、再現性を確認する。",
        "タスク別送信者名": "送信者名やaliasの扱いを整理し、メール運用の見え方を決める。",
        "ナレッジ取り込み": "LLMWIKIの過去分・週次分を見て、取り込む候補と保留を分ける。",
        "kanban自動化": "Codexセッションをkanban候補へ整理し、統合・状態判定・human lockの境界を整える。",
        "LinkedInオファー返信方針": "LinkedIn関連は原則まとめ、直近の送信者と返信温度感を確認する。",
        "ブックマーク見直し": "ブックマーク管理サイトとGitHubピン留めrepoの見直しを扱う。統合/分割は保留観察する。",
        "B2Bポートフォリオページ改善": "B2Bポートフォリオのページ内容、図解、文言、公開反映を確認する。",
        "LLMWIKI品質レビュー導線改善": "LLMWIKIの自動収集・品質レビュー・恒久配置済み資料の参照導線を改善する。",
    }
    focus = topic_focus.get(label)
    if focus:
        body = f"{current_goal}。{focus}"
    else:
        body = base_body
        body = body.replace("するタスク。", "。")
        body = body.replace("を進めるタスク。", "。")
        body = body.replace("のタスク。", "。")
        body = re.sub(r"タスク。", "。", body)
    latest_note = latest_task_context_note_ja(label, latest_change)
    if latest_note and latest_note not in body:
        body = f"{body} 現在地: {latest_note}"
    body = re.sub(r"。。+", "。", body)
    return body


def should_use_global_lineage(topic_key: str, topic_label: str, topic_text: str) -> tuple[bool, str]:
    """Return whether a topic should merge across repos.

    The decision is intentionally based on task semantics instead of project
    names. Repo-scoped work stays under the repo, while workflow/intake/review
    style topics can represent the same task moving across implementation repos.
    """
    if topic_key in REPO_SCOPED_TOPIC_KEYS:
        return False, "repo-scoped topic"
    if topic_key == "career-linkedin-offer-reply":
        return True, "LinkedIn offer workflow across repos"
    if topic_key == "mail-sender-identity":
        return True, "mail sender identity workflow across repos"

    combined = f"{topic_key}\n{topic_label}\n{topic_text}".lower()
    if any(hint.lower() in combined for hint in GLOBAL_LINEAGE_HINTS):
        return True, "semantic cross-repo workflow topic"

    return False, "repo-local by default"


def derive_career_topic(topic_text: str) -> tuple[str, str, str]:
    """Split career sessions by actual work, not by broad project/repo."""
    if any(token in topic_text for token in ("linkedin", "linkedin-offer-responder", "前田", "渡邊", "松尾研究所", "副業", "フリーランス", "side-gig", "freelance", "オファー")):
        return "career-linkedin-offer-reply", "LinkedInオファー返信方針", "career reply / LinkedIn offers"
    if "松尾研究所" in topic_text:
        return "career-matsuo-reply", "松尾研究所ポジション返信方針", "career reply / company-specific position"
    if "副業" in topic_text or "フリーランス" in topic_text or "side-gig" in topic_text or "freelance" in topic_text:
        return "career-sidegig-reply", "副業案件返信方針", "career reply / side-gig availability"
    if "選考結果" in topic_text or "不採用" in topic_text:
        return "career-result-reply", "選考結果返信方針", "career reply / selection result"
    if "返信" in topic_text or "文面" in topic_text or "オファー" in topic_text or "前田" in topic_text:
        return "career-recruiter-reply", "求人紹介返信方針", "career reply / recruiter message"
    return "career-selection", "転職・求人選別", "career / job selection"


def derive_mail_topic(topic_text: str) -> tuple[str, str, str]:
    """Split mail-operation sessions by concrete failure/operation type."""
    if "リンク未生成" in topic_text or "未生成" in topic_text:
        return "mail-link-generation", "メールリンク未生成調査", "mail link generation failure"
    if "重複" in topic_text or "かぶ" in topic_text:
        return "mail-duplicate-suppression", "LLMWIKIクエリ報告メール重複抑止", "mail duplicate suppression"
    if "送信者名" in topic_text or "別 gmail" in topic_text or "alias" in topic_text:
        return "mail-sender-identity", "タスク別送信者名", "mail sender identity"
    return "mail", "メール運用", "mail / gmail operation"


STALE_CONTEXT_STOPWORDS = {
    "これ", "それ", "ため", "よう", "もの", "こと", "タスク", "確認", "整理", "実装", "修正", "追加", "進行", "完了", "状態",
    "go", "ok", "repo", "session", "sessions", "project", "codex", "github", "issue", "html", "json",
}


def extract_context_terms(text: str) -> set[str]:
    terms = set(re.findall(r"[A-Za-z0-9_-]{4,}|[一-龥ぁ-んァ-ン]{2,}", (text or "").lower()))
    return {term for term in terms if term not in STALE_CONTEXT_STOPWORDS and len(term) >= 2}


def stale_context_alignment(anchor_text: str, stale_context: str) -> tuple[bool, str]:
    """Old transcript context is only safe when it agrees with the latest task anchor."""
    if not stale_context or not stale_context.strip():
        return False, "empty stale context"
    anchor_terms = extract_context_terms(anchor_text)
    stale_terms = extract_context_terms(stale_context)
    if not anchor_terms or not stale_terms:
        return False, "insufficient concrete terms"
    overlap = anchor_terms & stale_terms
    project_overlap = {term for term in overlap if "-" in term or term in {"openclaw", "linkedin", "vercel", "grok4cic"}}
    if len(overlap) >= 2 or project_overlap:
        return True, f"aligned stale context: {', '.join(sorted(list(overlap))[:5])}"
    return False, "stale context has no concrete overlap with latest anchor"


STALE_CONTEXT_MARKER = "__STALE_CONTEXT__"


def build_aligned_topic_text(recent_text: str, base_text: str, deep_context: str | None) -> tuple[str, bool, str]:
    current_context = deep_context or ""
    stale_context = ""
    if STALE_CONTEXT_MARKER in current_context:
        current_context, stale_context = current_context.split(STALE_CONTEXT_MARKER, 1)
    anchor = f"{recent_text or ''}\n{base_text or ''}\n{current_context or ''}".lower()
    aligned, reason = stale_context_alignment(anchor, stale_context)
    if aligned:
        return f"{anchor}\n{stale_context}".lower(), True, reason
    return anchor, False, reason


def derive_topic_key(
    repo_name: str,
    task_cluster_label: str | None,
    title: str,
    current_goal: str,
    first_user_line: str,
    latest_meaningful_change: str | None = None,
    deep_context: str | None = None,
) -> tuple[str, str, int, str]:
    text = f"{title}\n{current_goal}\n{first_user_line}".lower()
    recent_text = f"{latest_meaningful_change or ''}".lower()
    activity_text = f"{recent_text}\n{text}".lower()
    topic_text, stale_context_used, stale_context_reason = build_aligned_topic_text(recent_text, text, deep_context)
    latest_phase_text = (deep_context or "").split(STALE_CONTEXT_MARKER, 1)[0].lower()
    current_phase_activity = f"{recent_text}\n{latest_phase_text}"
    deep_activity_text = topic_text
    near_future_dashboard_signal = (
        repo_name == "near-future-demand-lens" or "near-future-demand-lens" in topic_text
    ) and any(
        token in topic_text
        for token in (
            "ランキング",
            "ranking",
            "sparkline",
            "折れ線",
            "棒グラフ",
            "bar chart",
            "snapshot",
            "鮮度",
            "vercel",
            "dashboard",
            "ダッシュボード",
            "実画面確認",
        )
    )
    project_dof_context = repo_name == "project-dof" or "project-dof" in topic_text or "project dof" in topic_text
    project_entity_conflict = repo_name != "project-dof" and "なかも" in topic_text
    creative_signal = any(
        token in topic_text
        for token in ("画像生成", "image generation", "image2", "gpt image", "プロンプト", "キャラ", "character")
    )
    project_scoped_creative_signal = creative_signal and not project_entity_conflict and (
        project_dof_context or ("なかも" not in topic_text and not near_future_dashboard_signal)
    )
    if "kanban" in topic_text or "カンバン" in topic_text or "human override" in topic_text or ("ボード" in topic_text and "ai秘書" in topic_text):
        return f"{repo_name}:kanban-automation", "kanban自動化", 86, "kanban / session automation"
    # If the latest substantive exchange clearly moved into a concrete
    # implementation/deploy phase, prefer that phase over older high-signal
    # snippets from the same long session.  This prevents entry prompts like
    # "内容確認/差分確認/送信者名" from becoming the kanban task after the
    # session has already progressed to actual work.
    if any(token in current_phase_activity for token in ("quality_reviewer", "query_quality_trend", "review_log", "durable auto-collect", "llmwiki-research")):
        return f"{repo_name}:knowledge-quality-review", "LLMWIKI品質レビュー導線改善", 88, "latest phase / llmwiki quality review pipeline"
    portfolio_page_phase = repo_name == "portfolio" and any(
        token in current_phase_activity
        for token in (
            "ai組み込み開発",
            "ai-integration",
            "問い合わせ整理",
            "問い合わせ業務",
            "workflow-support",
            "ワークフロー図",
            "図解",
            "本番デプロイ",
            "vercel production",
        )
    )
    if portfolio_page_phase:
        return f"{repo_name}:portfolio-page-improvement", "B2Bポートフォリオページ改善", 88, "latest phase / portfolio page implementation"
    b2b_sales_signal = any(
        token in topic_text
        for token in (
            "google ビジネスプロフィール",
            "googleビジネスプロフィール",
            "business.google.com",
            "bing places",
            "bing webmaster",
            "microsoft アカウント",
            "ミツモア",
            "販路",
            "b2bポートフォリオ",
            "b2b portfolio",
            "オーナー確認",
            "プロフィール作成",
        )
    )
    if b2b_sales_signal:
        return f"{repo_name}:sales-channel", "B2B販路拡大", 86, "B2B sales channel / Google Business Profile"
    near_future_index_signal = (repo_name == "near-future-demand-lens" or "near-future-demand-lens" in topic_text) and any(
        token in topic_text
        for token in ("指数", "需給", "需要", "供給圧", "マネタイズ", "ソロプレナー", "persona_monetization", "buyer_demand", "supply_pressure", "raw evidence")
    )
    if near_future_index_signal:
        return f"{repo_name}:demand-index", "需要レンズ指数設計", 86, "near-future demand / monetization index"
    if near_future_dashboard_signal:
        return f"{repo_name}:dashboard-freshness", "ランキング鮮度・sparkline修正", 86, "ranking freshness / sparkline display"
    career_text = deep_activity_text
    career_direct_tokens = ("求人", "転職", "応募候補", "求人選別", "年収", "カオナビ", "finatext", "ジーニー", "linkedin", "linkedin-offer-responder", "オファー", "松尾研究所", "渡邊", "前田")
    career_context_tokens = ("返信", "文面", "面談", "ポジション", "案件", "求人", "転職", "linkedin", "オファー")
    career_soft_tokens = ("副業", "side-gig", "freelance", "フリーランス")
    career_signal = any(token.lower() in career_text for token in career_direct_tokens) or (
        any(token.lower() in career_text for token in career_soft_tokens)
        and any(token.lower() in career_text for token in career_context_tokens)
    )
    if career_signal:
        key, label, reason = derive_career_topic(career_text)
        use_global, lineage_reason = should_use_global_lineage(key, label, activity_text)
        if use_global:
            return f"global:{key}", label, 78, f"{reason} / {lineage_reason}"
        return f"{repo_name}:{key}", label, 86, reason
    # Mail-operation topics use the same aligned-context guard: stale mail notes
    # in a long session do not become the current task unless the latest anchor agrees.
    mail_anchor_text = topic_text
    concrete_mail_signal = (
        any(token in mail_anchor_text for token in ("リンク未生成", "送信者名", "別 gmail", "alias"))
        or ("重複" in mail_anchor_text and any(token in mail_anchor_text for token in ("メール", "gmail", "llmwikiクエリ報告")))
    )
    if concrete_mail_signal:
        key, label, reason = derive_mail_topic(mail_anchor_text)
        use_global, lineage_reason = should_use_global_lineage(key, label, activity_text)
        if use_global:
            return f"global:{key}", label, 78, f"{reason} / {lineage_reason}"
        return f"{repo_name}:{key}", label, 86, reason
    topic_rules: list[tuple[bool, str, str, str]] = [
        (any(token in topic_text for token in ("スタート時", "起動時", "自動起動", "startup")), "startup-control", "スタート時の自動起動処理無効化", "startup control"),
        (any(token in topic_text for token in ("回線", "無線", "ソフトバンク", "ネットワーク", "tp-link")), "network-instability", "ネットワーク不安定の原因調査", "network troubleshooting"),
        (("修正点" in topic_text and ("db" in topic_text or "データベース" in topic_text) and ("hook" in topic_text or "呼び出す" in topic_text)) or ("claude-review-pdca" in topic_text and "レビュースキル" in topic_text), "review-feedback-memory", "レビュー修正点DB/hook連携", "review feedback DB / hook workflow"),
        (near_future_dashboard_signal or (("ランキング" in topic_text or "ranking" in topic_text) and any(token in topic_text for token in ("sparkline", "折れ線", "棒グラフ", "snapshot", "鮮度", "vercel", "dashboard", "ダッシュボード"))), "dashboard-freshness", "ランキング鮮度・sparkline修正", "ranking freshness / sparkline display"),
        (any(token in topic_text for token in ("改行", "配色", "余白", "レイアウト", "表示崩れ", "表示文言")) and any(token in topic_text for token in ("修正", "改善", "調整")), "ui-fix", "UI表示修正", "UI copy / layout fix"),
        (any(token in topic_text for token in ("ティザー", "teaser", "lp-v", "lp.html")), "teaser-lp", "ティザーLP", "same artifact / teaser LP"),
        (("private化" in topic_text or "不要公開" in topic_text), "privatize", "private化", "repo privacy / privatize"),
        (("ピン留め" in topic_text or "ブックマーク管理" in topic_text), "bookmark-review", "ブックマーク見直し", "bookmark / pinned repo review"),
        (project_scoped_creative_signal, "creative-assets", "クリエイティブ素材", "creative assets / character / prompt"),
        (("grok4cic" in topic_text or "クリップボード" in topic_text or "clipboard" in topic_text), "grok4cic-clipboard", "grok4cic運用", "grok4cic / clipboard operation"),
        (any(token in text for token in ("repo", "リポジトリ", "状態・品質", "品質確認", "進捗確認")), "repo-review", "repoレビュー", "repo status / quality review"),
        (any(token in topic_text for token in ("deploy", "デプロイ", "vercel", "公開")), "deploy", "デプロイ", "deployment / publish"),
        (
            any(token in topic_text for token in ("google ビジネスプロフィール", "googleビジネスプロフィール", "business.google.com", "bing places", "bing webmaster", "ミツモア", "販路", "b2bポートフォリオ", "b2b portfolio")),
            "sales-channel",
            "B2B販路拡大",
            "B2B sales channel / Google Business Profile",
        ),
        (any(token in topic_text for token in ("定期実行", "クエリ", "llmwiki", "ナレッジ")), "knowledge-intake", "ナレッジ取り込み", "knowledge / query intake"),
        (any(token in topic_text for token in ("規約", "同意", "ログイン", "還付", "e-tax")), "account-flow", "ログイン・手続き", "account / form flow"),
    ]
    for matched, key, label, reason in topic_rules:
        if matched:
            use_global, lineage_reason = should_use_global_lineage(key, label, activity_text)
            if use_global:
                return f"global:{key}", label, 78, f"{reason} / {lineage_reason}"
            return f"{repo_name}:{key}", label, 86, reason

    base = normalize_cluster_slug(title or current_goal or first_user_line) or normalize_cluster_slug(task_cluster_label or "misc") or "general"
    stale_note = "stale context aligned" if stale_context_used else stale_context_reason
    return f"{repo_name}:{base}", clip((title or current_goal or task_cluster_label or "general"), 32), 58, f"fallback lexical topic / {stale_note}"


def normalize_cluster_slug(text: str) -> str:
    lowered = strip_issue_wrapper(text).lower()
    lowered = re.sub(r"https?://\S+", " ", lowered)
    lowered = re.sub(r"[^a-z0-9]+", " ", lowered)
    words = []
    for word in lowered.split():
        if len(word) < 3:
            continue
        if word.isdigit():
            continue
        if word[0].isdigit() and len(word) <= 4:
            continue
        if word in CLUSTER_STOPWORDS:
            continue
        words.append(word)
    deduped = list(dict.fromkeys(words))
    return "-".join(deduped[:3])


def normalize_cluster_phrase(text: str) -> str:
    cleaned = strip_issue_wrapper(text)
    for token in JP_CLUSTER_NOISE:
        cleaned = cleaned.replace(token, " ")
    cleaned = re.sub(r"https?://\S+", " ", cleaned)
    cleaned = re.sub(r"[A-Za-z0-9._:/-]+", " ", cleaned)
    cleaned = re.sub(r"[^\u3040-\u30ff\u3400-\u9fff]+", "", cleaned)
    for token in ("して", "する", "したい", "よう", "こと", "から", "まで", "なしで"):
        cleaned = cleaned.replace(token, "")
    cleaned = cleaned.translate(str.maketrans("", "", "をがにのではともへや"))
    return cleaned[:18]


def derive_task_cluster(repo_name: str, first_user_line: str, summary: str) -> tuple[str, str]:
    patterned = derive_pattern_cluster(repo_name, first_user_line, summary)
    if patterned:
        return patterned
    slug = normalize_cluster_slug(first_user_line)
    if slug:
        label = slug.replace("-", " / ")
        return f"{repo_name}:{slug}", clip(label, 40)
    phrase = normalize_cluster_phrase(first_user_line)
    if phrase:
        return f"{repo_name}:jp:{phrase}", clip(phrase, 28)
    fallback = clip(first_user_line or "misc", 28)
    safe = re.sub(r"\s+", "-", fallback.lower()) or "misc"
    return f"{repo_name}:{safe}", fallback


def derive_repo_name(paths: list[str], session: SessionAccumulator) -> str:
    candidates: Counter[str] = Counter()
    home = str(Path.home()).lower()
    for raw in paths:
      raw = raw.strip()
      if not raw:
          continue
      path = Path(raw)
      if str(path).lower() == home:
          continue
      parts = [part for part in path.parts if part not in (path.anchor,)]
      if not parts:
          continue
      basename = path.name or (parts[-1] if parts else "")
      if basename and basename.lower() not in {"tenormusica", "users"}:
          candidates[basename] += 2
    path_hits = re.findall(r"([A-Za-z0-9][A-Za-z0-9._-]{2,})", "\n".join(session.user_messages[:4]))
    for hit in path_hits:
        if hit.lower() in {"https", "http", "issue", "github"}:
            continue
        if "-" in hit or "_" in hit:
            candidates[hit] += 1
    return candidates.most_common(1)[0][0] if candidates else "unknown"


def normalize_title_for_display(first_user_line: str, repo_name: str, cluster_label: str | None = None) -> str:
    title = first_user_line.strip().lstrip("●").strip()
    if title.lower().startswith("結論:"):
        title = title.split(":", 1)[1].strip()
    title = re.sub(r"\s+\d{1,2}:\d{2}$", "", title)
    lowered = title.lower()
    if cluster_label == "ai secretary / kanban":
        return "AI秘書の kanban 自動更新構想"
    if cluster_label == "ai secretary / mail links":
        return "AI秘書メールのリンク未生成調査"
    if cluster_label == "network / instability":
        return "ネットワーク不安定の原因調査"
    if cluster_label == "bookmark / site":
        return "ブックマーク管理サイトの確認"
    if cluster_label == "agent instructions":
        return "agent.md / .claude 読み順確認"
    if cluster_label == f"{repo_name} / explain":
        return f"{repo_name} の内容確認"
    if cluster_label == f"{repo_name} / repo review":
        return f"{repo_name} の状態・品質確認"
    if cluster_label == f"{repo_name} / handoff":
        return f"{repo_name} の引き継ぎ"
    if cluster_label == "reroute cadence":
        return "再配置の自動化状況確認"
    if cluster_label == "linkedin offer / 前田空我":
        return "LinkedInオファー確認: 前田空我"
    if cluster_label == "grok4cic / clipboard rule":
        return "grok4cic のクリップボード運用ルール確認"
    if any(lowered == pattern for pattern in GENERIC_TITLE_PATTERNS):
        return f"{repo_name}: {title}"
    if any(pattern in lowered for pattern in GENERIC_TITLE_PATTERNS[:2]):
        return f"{repo_name}: {title}"
    normalized = taskify_japanese_title(title, cluster_label)
    if needs_title_repair(normalized):
        return canonical_cluster_title(cluster_label, repo_name) or normalized
    return normalized


def derive_pattern_cluster(repo_name: str, first_user_line: str, summary: str) -> tuple[str, str] | None:
    text = f"{first_user_line}\n{summary}".lower()
    repo_slug = repo_name.replace("_", "-")
    rules: list[tuple[bool, str, str]] = [
        ("project-dof" in text or "project dof" in text, f"{repo_slug}:project-dof", "project / dof"),
        ("llmwiki" in text, f"{repo_slug}:llmwiki", "llmwiki"),
        (("kanban" in text or "ボード" in text) and "ai秘書" in text, f"{repo_slug}:ai-secretary-kanban", "ai secretary / kanban"),
        (("リンク未生成" in first_user_line) or ("未生成" in text and "メール" in text), f"{repo_slug}:mail-links", "ai secretary / mail links"),
        (any(token in text for token in ("回線", "無線", "ソフトバンク", "ネットワーク")), f"{repo_slug}:network", "network / instability"),
        (any(token in text for token in ("e-tax", "還付申告")), f"{repo_slug}:etax", "e-tax"),
        (("ブックマーク" in text or "bookmark" in text) and "site" in text, f"{repo_slug}:bookmark-site", "bookmark / site"),
        ("ブックマーク" in text or "bookmark" in text, f"{repo_slug}:bookmark", "bookmark"),
        (("repo" in text or "リポジトリ" in text) and any(token in text for token in ("状態", "品質", "進捗", "確認", "チェック")), f"{repo_slug}:repo-review", f"{repo_name} / repo review"),
        ("引き継ぎ" in text, f"{repo_slug}:handoff", f"{repo_name} / handoff"),
        (("前田 空我" in first_user_line) or ("前田空我" in first_user_line), f"{repo_slug}:maeda-kuga", "linkedin offer / 前田空我"),
        (("go-robust" in text) or ("robust" in text and "skill" in text), f"{repo_slug}:robust", "robust"),
        (("grok4cic" in text) and ("クリップボード" in text or "clipboard" in text), f"{repo_slug}:grok4cic-clipboard", "grok4cic / clipboard rule"),
        (("private化" in text) or ("private に" in text), f"{repo_slug}:privatize", "repo / privatize"),
        ((".claude" in text) or ("agent.md" in text), f"{repo_slug}:agent-instructions", "agent instructions"),
        (("再配置" in text) or ("自動化されてない" in text), f"{repo_slug}:reroute", "reroute cadence"),
        (("どういう内容" in text), f"{repo_slug}:explain", f"{repo_name} / explain"),
    ]
    for matched, key, label in rules:
        if matched:
            return key, label
    return None


def derive_status(acc: SessionAccumulator) -> str:
    last_user = normalize_user_message(acc.user_messages[-1]) if acc.user_messages else ""
    last_assistant = acc.assistant_messages[-1] if acc.assistant_messages else ""
    recent_text = "\n".join([last_user, last_assistant]).lower()
    if any(token in recent_text for token in BLOCK_TOKENS):
        return "Blocked"
    if last_user and any(token in last_user.lower() for token in CONTINUE_TOKENS):
        return "In Progress"
    if last_user and any(token in last_user for token in ("？", "?", "教えて", "どう", "なに", "何")):
        return "Need Review"
    if any(token in recent_text for token in DONE_TOKENS) and not any(
        token in recent_text for token in CONTINUE_TOKENS
    ):
        return "Done"
    if any(token in recent_text for token in ("next", "次の1手", "continue implementation", "すすめて")):
        return "In Progress"
    if len(acc.user_messages) >= 6:
        return "Need Review"
    return "Need Review"


def derive_recommendation(acc: SessionAccumulator) -> tuple[str, int, str]:
    status = derive_status(acc)
    last_user = normalize_user_message(acc.user_messages[-1]) if acc.user_messages else ""
    last_assistant = acc.assistant_messages[-1] if acc.assistant_messages else ""
    recent_text = "\n".join([last_user, last_assistant]).lower()

    if status == "Blocked":
        return status, 88, "blocked / pending / waiting 系の語が末尾付近にある"
    if status == "Need Review" and last_user and any(token in last_user for token in ("？", "?", "教えて", "どう", "なに", "何")):
        return status, 78, "末尾が質問・判断要求なので auto-finalize せず review 優先"
    if status == "In Progress" and last_user and any(token in last_user.lower() for token in CONTINUE_TOKENS):
        return status, 82, "末尾が go / 進めて 系なので継続中と判断"
    if status == "Done":
        return status, 84, "完了 / 投稿済み / 通った / commit などの完了寄り語がある"
    if status == "In Progress":
        return status, 74, "次の1手 / continue / すすめて があり継続中と見やすい"
    if len(acc.user_messages) >= 8 and len(acc.assistant_messages) >= 6:
        return "Need Review", 66, "会話量は多いが blocked / done 判定が弱いので review 優先"
    return status, 58, "heuristic confidence が低めなので auto-finalize ではなく review 優先"


def derive_autonomy_mode(recommended_status: str, confidence: int) -> str:
    if confidence >= 84 and recommended_status in {"Blocked", "Done"}:
        return "auto-ready"
    if confidence >= 72 and recommended_status == "In Progress":
        return "auto-suggest"
    return "needs-review"


def recency_label(end_at: datetime | None, now: datetime) -> str:
    if not end_at:
        return "unknown"
    days = max((now.date() - end_at.astimezone(JST).date()).days, 0)
    if days == 0:
        return "today"
    if days == 1:
        return "yesterday"
    return f"{days} days ago"


def summarize_session(acc: SessionAccumulator, now: datetime) -> dict[str, Any] | None:
    meaningful_users = [normalize_user_message(item) for item in acc.user_messages]
    meaningful_users = [item for item in meaningful_users if item]
    if len(meaningful_users) < 2:
        return None

    start_dt = iso_to_dt(acc.start_at)
    end_dt = iso_to_dt(acc.end_at) or start_dt
    paths = acc.cwds or ([acc.session_cwd] if acc.session_cwd else [])
    repo_name = derive_repo_name(paths, acc)
    first_user = next((item for item in meaningful_users if len(item) >= 8), meaningful_users[0])
    first_user_line = strip_leading_links(first_meaningful_line(first_user))
    last_assistant = acc.assistant_messages[-1] if acc.assistant_messages else ""
    recommended_status, confidence, reason = derive_recommendation(acc)
    autonomy_mode = derive_autonomy_mode(recommended_status, confidence)
    task_cluster_key, task_cluster_label = derive_task_cluster(repo_name, first_user_line, first_user_line)
    display_title = normalize_title_for_display(first_user_line, repo_name, task_cluster_label)
    keywords = derive_message_keywords(task_cluster_label, repo_name, first_user_line)
    recent_user = pick_recent_excerpt(meaningful_users[-8:], assistant=False)
    recent_assistant = pick_recent_excerpt(acc.assistant_messages[-8:], assistant=True)
    relevant_user, relevant_user_score = pick_relevant_excerpt(meaningful_users[-10:], keywords, assistant=False)
    relevant_assistant, relevant_assistant_score = pick_relevant_excerpt(acc.assistant_messages[-10:], keywords, assistant=True)
    assistant_unrelated = False
    if relevant_user_score >= 2 and relevant_assistant_score >= 2:
        assistant_for_summary = relevant_assistant
    else:
        relevant_user = recent_user or relevant_user
        assistant_for_summary = recent_assistant or relevant_assistant
    blocker = extract_blocker_ja(relevant_user, assistant_for_summary, acc.user_messages[-1] if acc.user_messages else "")
    doneish_signal = contains_doneish_signal(assistant_for_summary or last_assistant)
    pendingish_signal = blocker is not None or ("保留" in assistant_for_summary) or ("pending" in assistant_for_summary.lower() if assistant_for_summary else False)
    task_shift_signal = assistant_unrelated
    latest_meaningful_change = normalize_latest_change_for_summary(assistant_for_summary or relevant_user)
    topic_signal_context = collect_topic_signal_context(meaningful_users, acc.assistant_messages)
    latest_phase_context = collect_latest_phase_context(acc.timeline_messages)
    current_topic_context = "\n".join(
        dict.fromkeys(
            part
            for part in (
                latest_phase_context,
                recent_user,
                recent_assistant,
                first_user_line,
                relevant_user,
                assistant_for_summary,
                last_assistant,
            )
            if part
        )
    )
    stale_topic_context = topic_signal_context
    deep_topic_context = f"{current_topic_context}\n{STALE_CONTEXT_MARKER}\n{stale_topic_context}" if stale_topic_context else current_topic_context
    current_goal = derive_current_goal_ja(display_title, relevant_user or first_user_line)
    if needs_title_repair(current_goal):
        current_goal = canonical_cluster_title(task_cluster_label, repo_name) or current_goal
    task_body_summary = build_task_body_summary_ja(
        task_cluster_label,
        current_goal,
        blocker,
        doneish_signal,
        pendingish_signal,
        task_shift_signal,
        latest_meaningful_change,
    )
    topic_key, topic_label, merge_confidence, topic_reason = derive_topic_key(
        repo_name,
        task_cluster_label,
        display_title,
        current_goal,
        first_user_line,
        latest_meaningful_change,
        deep_topic_context,
    )
    if topic_label == "kanban自動化":
        display_title = "AI秘書のkanban自動更新"
        current_goal = display_title
        task_body_summary = build_task_body_summary_ja(
            topic_label,
            current_goal,
            blocker,
            doneish_signal,
            pendingish_signal,
            task_shift_signal,
            latest_meaningful_change,
        )
    elif repo_name != "project-dof" and "なかも" in f"{display_title}\n{current_goal}":
        concrete_title = concrete_title_from_topic(repo_name, topic_label, latest_meaningful_change, topic_label or display_title, deep_topic_context)
        display_title = concrete_title
        current_goal = concrete_title
        task_body_summary = build_task_body_summary_ja(
            topic_label,
            current_goal,
            blocker,
            doneish_signal,
            pendingish_signal,
            task_shift_signal,
            latest_meaningful_change,
        )
    elif topic_label in RECOMPOSABLE_TOPIC_LABELS:
        concrete_title = concrete_title_from_topic(repo_name, topic_label, latest_meaningful_change, display_title, deep_topic_context)
        if should_recompose_title_for_topic(display_title, topic_label, concrete_title):
            display_title = concrete_title
            current_goal = concrete_title
            task_body_summary = build_task_body_summary_ja(
                topic_label,
                current_goal,
                blocker,
                doneish_signal,
                pendingish_signal,
                task_shift_signal,
                latest_meaningful_change,
            )
    elif topic_label == "B2B販路拡大":
        display_title = "B2Bポートフォリオの販路拡大"
        current_goal = "B2Bポートフォリオの販路拡大"
        task_body_summary = build_task_body_summary_ja(
            "B2B sales channel / Google Business Profile",
            current_goal,
            blocker,
            doneish_signal,
            pendingish_signal,
            task_shift_signal,
            latest_meaningful_change,
        )
    elif topic_label == "転職・求人選別" or "返信方針" in topic_label:
        concrete_title = concrete_title_from_topic(repo_name, topic_label, latest_meaningful_change, "転職・求人候補の整理", deep_topic_context)
        display_title = concrete_title
        current_goal = concrete_title
        task_body_summary = build_task_body_summary_ja(
            topic_label,
            current_goal,
            blocker,
            doneish_signal,
            pendingish_signal,
            task_shift_signal,
            latest_meaningful_change,
        )
    elif topic_label == "レビュー修正点DB/hook連携":
        concrete_title = concrete_title_from_topic(repo_name, topic_label, latest_meaningful_change, "レビュー修正点DB/hook連携", deep_topic_context)
        display_title = concrete_title
        current_goal = concrete_title
        task_body_summary = build_task_body_summary_ja(
            topic_label,
            current_goal,
            blocker,
            doneish_signal,
            pendingish_signal,
            task_shift_signal,
            latest_meaningful_change,
        )
    elif topic_label == "ランキング鮮度・sparkline修正":
        concrete_title = concrete_title_from_topic(repo_name, topic_label, latest_meaningful_change, "ランキング鮮度・sparkline修正", deep_topic_context)
        display_title = concrete_title
        current_goal = concrete_title
        task_body_summary = build_task_body_summary_ja(
            topic_label,
            current_goal,
            blocker,
            doneish_signal,
            pendingish_signal,
            task_shift_signal,
            latest_meaningful_change,
        )
    elif (topic_label in {"repoレビュー", "ログイン・手続き", "メール運用"} or "メール" in topic_label or "送信者名" in topic_label) and is_weak_task_title(display_title):
        concrete_title = concrete_title_from_topic(repo_name, topic_label, latest_meaningful_change, display_title, deep_topic_context)
        display_title = concrete_title
        current_goal = concrete_title
        task_body_summary = build_task_body_summary_ja(
            topic_label,
            current_goal,
            blocker,
            doneish_signal,
            pendingish_signal,
            task_shift_signal,
            latest_meaningful_change,
        )
    elif is_generic_confirmation_title(display_title) and topic_label != "repoレビュー":
        concrete_title = concrete_title_from_topic(repo_name, topic_label, latest_meaningful_change, display_title, deep_topic_context)
        display_title = concrete_title
        current_goal = concrete_title
        task_body_summary = build_task_body_summary_ja(
            topic_label,
            current_goal,
            blocker,
            doneish_signal,
            pendingish_signal,
            task_shift_signal,
            latest_meaningful_change,
        )
    elif topic_label and topic_label != task_cluster_label:
        task_body_summary = build_task_body_summary_ja(
            topic_label,
            current_goal,
            blocker,
            doneish_signal,
            pendingish_signal,
            task_shift_signal,
            latest_meaningful_change,
        )
    deep_summary = build_deep_summary_ja(current_goal, latest_meaningful_change, blocker, task_shift_signal)

    summary = task_body_summary

    duration_minutes = None
    if start_dt and end_dt:
        duration_minutes = max(1, math.ceil((end_dt - start_dt).total_seconds() / 60))

    return {
        "session_id": acc.session_id,
        "title": clip(display_title, 72),
        "summary": clip(summary, 240),
        "deep_summary": deep_summary,
        "task_body_summary": task_body_summary,
        "current_goal": current_goal,
        "latest_meaningful_change": clip(latest_meaningful_change, 220) if latest_meaningful_change else "",
        "latest_phase_context": clip(latest_phase_context, 1200) if latest_phase_context else "",
        "blocker": blocker,
        "doneish_signal": doneish_signal,
        "pendingish_signal": pendingish_signal,
        "task_shift_signal": task_shift_signal,
        "first_user_message": first_user,
        "first_user_line": first_user_line,
        "last_user_message": clip(meaningful_users[-1], 260),
        "last_assistant_message": clip(last_assistant, 1200),
        "evidence_messages": [clip(item, 220) for item in meaningful_users[1:5]],
        "suggested_status": recommended_status,
        "suggested_confidence": confidence,
        "suggested_reason": reason,
        "autonomy_mode": autonomy_mode,
        "task_cluster_key": task_cluster_key,
        "task_cluster_label": task_cluster_label,
        "topic_key": topic_key,
        "topic_label": topic_label,
        "merge_confidence": merge_confidence,
        "topic_reason": topic_reason,
        "user_message_count": len(meaningful_users),
        "assistant_message_count": len(acc.assistant_messages),
        "command_count": acc.command_count,
        "activity_score": len(meaningful_users) * 2 + len(acc.assistant_messages) + acc.command_count,
        "primary_repo": repo_name,
        "active_paths": list(dict.fromkeys(paths))[:6],
        "source_file": acc.source_file,
        "start_at": start_dt.astimezone(JST).isoformat(timespec="seconds") if start_dt else None,
        "end_at": end_dt.astimezone(JST).isoformat(timespec="seconds") if end_dt else None,
        "recency_label": recency_label(end_dt, now),
        "duration_minutes": duration_minutes,
        "task_started": acc.task_started,
        "task_completed": acc.task_completed,
    }


def enrich_task_clusters(sessions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    clusters: dict[str, dict[str, Any]] = {}
    for item in sessions:
        key = item.get("topic_key") or item.get("task_cluster_label") or item.get("task_cluster_key") or "misc"
        cluster = clusters.setdefault(
            key,
            {
                "cluster_key": key,
                "cluster_label": item.get("topic_label") or item.get("task_cluster_label") or "misc",
                "base_cluster_labels": [],
                "primary_repos": [],
                "session_ids": [],
                "titles": [],
                "status_counts": Counter(),
                "max_confidence": 0,
                "auto_ready_count": 0,
                "merge_confidences": [],
                "topic_reasons": [],
            },
        )
        cluster["session_ids"].append(item["session_id"])
        cluster["titles"].append(item.get("title"))
        base_label = item.get("task_cluster_label")
        if base_label and base_label not in cluster["base_cluster_labels"]:
            cluster["base_cluster_labels"].append(base_label)
        if item.get("merge_confidence") is not None:
            cluster["merge_confidences"].append(int(item.get("merge_confidence") or 0))
        if item.get("topic_reason") and item.get("topic_reason") not in cluster["topic_reasons"]:
            cluster["topic_reasons"].append(item.get("topic_reason"))
        repo = item.get("primary_repo")
        if repo and repo not in cluster["primary_repos"]:
            cluster["primary_repos"].append(repo)
        end_at = item.get("end_at")
        if end_at and (not cluster.get("latest_end_at") or end_at > cluster.get("latest_end_at")):
            cluster["latest_end_at"] = end_at
            cluster["latest_status"] = item.get("suggested_status")
            cluster["latest_title"] = item.get("title")
            cluster["latest_assistant_message"] = item.get("last_assistant_message")
            cluster["latest_blocker"] = item.get("blocker")
            cluster["latest_doneish_signal"] = item.get("doneish_signal")
            cluster["latest_pendingish_signal"] = item.get("pendingish_signal")
            cluster["latest_task_shift_signal"] = item.get("task_shift_signal")
            cluster["latest_meaningful_change"] = item.get("latest_meaningful_change")
        cluster["status_counts"][item.get("suggested_status")] += 1
        cluster["max_confidence"] = max(cluster["max_confidence"], int(item.get("suggested_confidence") or 0))
        if item.get("autonomy_mode") == "auto-ready":
            cluster["auto_ready_count"] += 1

    cluster_rows: list[dict[str, Any]] = []
    for cluster in clusters.values():
        session_count = len(cluster["session_ids"])
        merge_confidences = cluster.get("merge_confidences") or [0]
        cluster_rows.append(
            {
                "cluster_key": cluster["cluster_key"],
                "cluster_label": cluster["cluster_label"],
                "base_cluster_labels": cluster.get("base_cluster_labels", []),
                "topic_reasons": cluster.get("topic_reasons", []),
                "merge_confidence": min(merge_confidences),
                "primary_repos": cluster.get("primary_repos", []),
                "session_count": session_count,
                "status_counts": dict(cluster["status_counts"]),
                "dominant_status": cluster["status_counts"].most_common(1)[0][0] if cluster["status_counts"] else "Need Review",
                "max_confidence": cluster["max_confidence"],
                "auto_ready_count": cluster["auto_ready_count"],
                "representative_titles": [title for title in dict.fromkeys(cluster["titles"]) if title][:3],
                "session_ids": cluster["session_ids"],
                "latest_end_at": cluster.get("latest_end_at"),
                "latest_status": cluster.get("latest_status"),
                "latest_title": cluster.get("latest_title"),
                "latest_assistant_message": cluster.get("latest_assistant_message"),
                "latest_blocker": cluster.get("latest_blocker"),
                "latest_doneish_signal": cluster.get("latest_doneish_signal"),
                "latest_pendingish_signal": cluster.get("latest_pendingish_signal"),
                "latest_task_shift_signal": cluster.get("latest_task_shift_signal"),
                "latest_meaningful_change": cluster.get("latest_meaningful_change"),
            }
        )
    cluster_rows.sort(key=lambda item: (-item["session_count"], -item["max_confidence"], item["cluster_label"]))

    cluster_lookup = {item["cluster_key"]: item for item in cluster_rows}
    for item in sessions:
        cluster = cluster_lookup.get(item.get("topic_key") or item.get("task_cluster_label"))
        if not cluster:
            item["related_session_count"] = 1
            item["related_session_ids"] = [item["session_id"]]
            item["cluster_dominant_status"] = item.get("suggested_status")
            item["task_cluster_family"] = item.get("task_cluster_label")
            item["lineage_key"] = item.get("topic_key") or item.get("task_cluster_label")
            item["lineage_label"] = item.get("topic_label") or item.get("task_cluster_label")
            continue
        item["related_session_count"] = cluster["session_count"]
        item["related_session_ids"] = cluster["session_ids"]
        item["cluster_dominant_status"] = cluster["dominant_status"]
        item["task_cluster_family"] = cluster["cluster_label"]
        item["lineage_key"] = cluster["cluster_key"]
        item["lineage_label"] = cluster["cluster_label"]
    return cluster_rows


def derive_task_title_ja(cluster: dict[str, Any]) -> str:
    label = cluster.get("cluster_label", "misc")
    repos = cluster.get("primary_repos", [])
    repo_name = repos[0] if repos else "unknown"
    if label == "grok4cic運用" and repo_name != "unknown":
        return concrete_title_from_topic(repo_name, label, cluster.get("latest_meaningful_change") or "", "grok4cic のクリップボード運用ルール整理")
    if label == "クリエイティブ素材" and repo_name != "unknown":
        context = "\n".join(str(item) for item in cluster.get("representative_titles", []))
        return concrete_title_from_topic(repo_name, label, cluster.get("latest_meaningful_change") or "", f"{repo_name}の画像・プロンプト素材検証", context)
    if (label in {"repoレビュー", "ログイン・手続き", "メール運用"} or "メール" in label or "送信者名" in label) and repo_name != "unknown":
        context = "\n".join(str(item) for item in cluster.get("representative_titles", []))
        fallback = {
            "repoレビュー": f"{repo_name} の状態・品質確認",
            "ログイン・手続き": "e-Tax 還付申告の状態確認",
            "メール運用": "AI秘書メール運用の整理",
        }.get(label, label)
        return concrete_title_from_topic(repo_name, label, cluster.get("latest_meaningful_change") or "", fallback, context)
    if label == "転職・求人選別" or "返信方針" in label:
        return concrete_title_from_topic(repo_name, label, cluster.get("latest_meaningful_change") or "", "転職・求人候補の整理", "\n".join(str(item) for item in cluster.get("representative_titles", [])))
    if label == "レビュー修正点DB/hook連携":
        return concrete_title_from_topic(repo_name, label, cluster.get("latest_meaningful_change") or "", "レビュー修正点DB/hook連携", "\n".join(str(item) for item in cluster.get("representative_titles", [])))
    if label == "ランキング鮮度・sparkline修正":
        return concrete_title_from_topic(repo_name, label, cluster.get("latest_meaningful_change") or "", "ランキング鮮度・sparkline修正", "\n".join(str(item) for item in cluster.get("representative_titles", [])))
    if label == "デプロイ" and repo_name != "unknown":
        return concrete_title_from_topic(repo_name, label, cluster.get("latest_meaningful_change") or "", f"{repo_name}の公開反映", "\n".join(str(item) for item in cluster.get("representative_titles", [])))
    if label == "UI表示修正" and repo_name != "unknown":
        return concrete_title_from_topic(repo_name, label, cluster.get("latest_meaningful_change") or "", f"{repo_name}の表示文言・レイアウト修正", "\n".join(str(item) for item in cluster.get("representative_titles", [])))
    mapping = {
        "ナレッジ取り込み": "LLMWIKI 週次レビューと取り込み整理",
        "ブックマーク見直し": "ブックマーク管理サイト / ピン留め repo 見直し",
        "メール運用": "AI秘書メール運用の整理",
        "メールリンク未生成調査": "メールリンク未生成調査",
        "LLMWIKIクエリ報告メール重複抑止": "LLMWIKIクエリ報告メール重複抑止",
        "タスク別送信者名": "タスク別送信者名",
        "ログイン・手続き": "e-Tax 還付申告の状態確認",
        "ティザーLP": "project-dof ティザーLP制作",
        "repoレビュー": f"{repo_name} の状態・品質確認",
        "kanban自動化": "AI秘書の kanban 自動更新構想",
        "B2B販路拡大": "B2Bポートフォリオの販路拡大",
        "private化": "不要公開repoのprivate化整理",
        "転職・求人選別": "転職・求人候補の整理",
        "求人紹介返信方針": "求人紹介返信方針",
        "松尾研究所ポジション返信方針": "松尾研究所ポジション返信方針",
        "副業案件返信方針": "副業案件返信方針",
        "選考結果返信方針": "選考結果返信方針",
        "LinkedInオファー返信方針": "LinkedInオファー返信方針",
        "レビュー修正点DB/hook連携": "レビュー修正点DB/hook連携",
        "ランキング鮮度・sparkline修正": "ランキング鮮度・sparkline修正",
        "需要レンズ指数設計": "near-future-demand-lensの需要・マネタイズ指数設計",
        "デプロイ": "公開反映",
        "UI表示修正": "表示文言・レイアウト修正",
        "grok4cic運用": "grok4cic のクリップボード運用ルール整理",
        "llmwiki": "LLMWIKI 週次レビューと取り込み整理",
        "project / dof": "project-dof ティザーLP制作",
        "bookmark": "ブックマーク管理サイト / ピン留め repo 見直し",
        "ai secretary / kanban": "AI秘書の kanban 自動更新構想",
        "ai secretary / mail links": "AI秘書メールのリンク未生成調査",
        "B2B sales channel / Google Business Profile": "B2Bポートフォリオの販路拡大",
        "network / instability": "ネットワーク不安定の原因調査",
        "agent instructions": "agent.md / .claude 読み順整理",
        "grok4cic / clipboard rule": "grok4cic のクリップボード運用ルール整理",
        "e-tax": "e-Tax 還付申告の状態確認",
        "robust": "go-robust スキル移植整理",
        "linkedin offer / 前田空我": "LinkedIn オファー確認（前田空我）",
        "reroute cadence": "再配置の自動化状況確認",
    }
    if label in mapping:
        return mapping[label]
    if label.endswith(" / repo review"):
        return f"{repo_name} の状態・品質確認"
    if label.endswith(" / handoff"):
        return f"{repo_name} の引き継ぎ整理"
    if label.endswith(" / explain"):
        return f"{repo_name} の内容確認"
    return label


def derive_task_size_ja(cluster: dict[str, Any]) -> str:
    session_count = int(cluster.get("session_count", 0))
    repo_count = len(cluster.get("primary_repos", []))
    if session_count >= 3 or repo_count >= 2:
        return "大タスク"
    return "中タスク"


def derive_task_reason_ja(cluster: dict[str, Any]) -> str:
    session_count = int(cluster.get("session_count", 0))
    repos = cluster.get("primary_repos", [])
    dominant = cluster.get("dominant_status", "Need Review")
    parts = [f"{session_count}件の session"]
    if repos:
        parts.append(f"{len(repos)} repo 跨ぎ" if len(repos) >= 2 else f"repo: {repos[0]}")
    parts.append(f"主状態: {dominant}")
    return " / ".join(parts)


def contains_doneish_signal(text: str) -> bool:
    lowered = text.lower()
    return any(token in lowered for token in ("投稿済み", "確認済み", "通った", "完了", "done", "merged", "commit", "実装済み"))


def derive_candidate_column(cluster: dict[str, Any], now: datetime) -> tuple[str, str]:
    latest_status = cluster.get("latest_status") or cluster.get("dominant_status") or "Need Review"
    latest_end_at = iso_to_dt(cluster.get("latest_end_at"))
    latest_assistant = cluster.get("latest_assistant_message") or ""
    latest_pendingish = bool(cluster.get("latest_pendingish_signal"))
    latest_doneish = bool(cluster.get("latest_doneish_signal"))
    latest_task_shift = bool(cluster.get("latest_task_shift_signal"))
    latest_blocker = cluster.get("latest_blocker")

    if latest_status == "Blocked":
        return "Blocked", "最新 session が blocked 判定"
    if latest_status == "Need Review":
        return "Need Review", "最新 session が review 要求で止まっている"
    if latest_status == "Done":
        return "Done", "最新 session が完了寄りで閉じている"

    age_days = None
    if latest_end_at:
        age_days = max((now.date() - latest_end_at.astimezone(JST).date()).days, 0)

    if latest_status == "In Progress":
        if latest_blocker:
            return "Pending", f"最新 session は継続中だが blocker が残っている: {latest_blocker}"
        if latest_task_shift and age_days is not None and age_days >= 3:
            return "Pending", "直近topic優先だが 3日以上更新がないため pending 寄り"
        if (latest_doneish or contains_doneish_signal(latest_assistant) or latest_pendingish) and age_days is not None and age_days >= 1:
            return "Pending", "直近応答は完了寄りだが、その後同 cluster の継続が見えていない"
        if age_days is not None and age_days >= 3:
            return "Pending", "in progress のまま 3日以上更新がない"
        return "In Progress", "明示完了は無いので in progress 寄り"

    return latest_status, "cluster の最新状態をそのまま採用"


def derive_task_next_action_ja(cluster: dict[str, Any]) -> str:
    label = cluster.get("cluster_label", "misc")
    dominant = cluster.get("dominant_status", "Need Review")
    mapping = {
        "ナレッジ取り込み": "今週分の query / レポートをまとめて、取り込む価値が高い項目と保留項目を仕分ける",
        "ブックマーク見直し": "ブックマーク管理サイトと pinned repo の反映済み変更・残件を確認し、次に入れ替える対象を決める",
        "メール運用": "メール生成・重複抑止・送信履歴のどこが残件かを確認し、運用ルールに固定する",
        "クリエイティブ素材": "成果物を目視確認し、品質不足・再生成条件・次に使う経路を1つに絞る",
        "ティザーLP": "次に詰める画面/素材/公開確認を1つに絞り、LP制作の続きに入る",
        "repoレビュー": "反映済み変更、未解決PR/未追跡ファイル、次の実装単位を確認する",
        "kanban自動化": "タイトル抽出・topic統合・status判定のうち、次に改善する1レイヤーを選ぶ",
        "B2B販路拡大": "Googleビジネスプロフィール等の停止理由を確認し、ユーザー判断が必要な同意/規約だけ切り出す",
        "ログイン・手続き": "ログイン後に確認すべき画面・入力値・次の判断をCiC手順に分解する",
        "ネットワーク不安定の原因調査": "回線・無線・時間帯・端末設定のどこが原因かを次の計測観点に落とす",
        "LinkedInオファー確認: 前田空我": "条件・返信要否・副業/転職方針との合致を確認して、返信するか保留するか決める",
        "agent.md / .claude 読み順確認": "実際に参照されるinstructionの順序と衝突箇所を確認し、必要なら整理する",
        "転職・求人選別": "候補企業と年収条件を見直し、応募候補/条件確認/見送りを分ける",
        "求人紹介返信方針": "求人紹介への返信文面と応募/面談に進む条件を確認する",
        "松尾研究所ポジション返信方針": "松尾研究所ポジションへの返信文面を、関心領域と面談希望が伝わる温度感に整える",
        "副業案件返信方針": "現時点の稼働条件と副業案件への前向きさを両立する返信文面に整える",
        "選考結果返信方針": "選考結果への感謝と次に進めたい求人を短く返せる文面に整える",
        "LinkedInオファー返信方針": "直近の送信者・対象ポジションを確認し、返信文面と温度感を整える",
        "レビュー修正点DB/hook連携": "レビューで出た実装修正点をDBに保存し、次回hookで呼び出せるかを確認する",
        "ランキング鮮度・sparkline修正": "当日snapshotの自動生成とsparkline再スケールが本番表示に反映されているか確認する",
        "需要レンズ指数設計": "外部ソースから buyer_demand / supply_pressure / entry_cost などへ入れる raw evidence JSON を作る",
        "メールリンク未生成調査": "リンク未生成の原因を入力・テンプレート・投稿経路のどこかに切り分ける",
        "LLMWIKIクエリ報告メール重複抑止": "重複した報告項目と失敗理由ログを確認し、再通知条件を整理する",
        "タスク別送信者名": "別Gmail / alias / 件名プレフィックスのどれで送信者識別するか決める",
        "llmwiki": "今週分の query / レポートをまとめて見て、取り込む価値が高い項目を仕分ける",
        "project / dof": "ティザー側の詰まりと repo 側の進捗を切り分けて、次の実装単位を決める",
        "bookmark": "ブックマーク管理サイトと pinned repo の見直し対象を並べて優先度を決める",
        "ai secretary / kanban": "kanban 自動更新の source 側 / sync 側を分けて次の実装単位を切る",
        "ai secretary / mail links": "未生成リンクの原因をログ / 入力 / テンプレートのどこかに切り分ける",
        "network / instability": "回線・無線・時間帯のどこが原因かを計測観点で切り分ける",
        "agent instructions": "実際にどの instruction file を読んでいるかを source から確認する",
        "grok4cic / clipboard rule": "運用ルールとして固定し、必要なら docs に昇格する",
        "e-tax": "ログイン後の状態確認フローを分解し、CiC に渡す部分を切り出す",
        "robust": "移植済み範囲と未移植範囲を確認して task を閉じるか判断する",
        "linkedin offer / 前田空我": "内容確認と返信要否の判断材料を揃える",
        "reroute cadence": "再配置ジョブの実行頻度と実際の起動条件を確認する",
    }
    if label in mapping:
        return mapping[label]
    if "起動" in label or "無効化" in label:
        return "無効化済みの起動元と残っている自動起動経路を確認し、再発防止の扱いを決める"
    if "引き継ぎ" in label:
        return "引き継ぎ済み内容と未整理の残件を分け、次に見るべきrepo/ドキュメントを固定する"
    if "内容確認" in label:
        return "対象の現在地と変更済み内容を確認し、継続/保留/完了のどれに寄せるか判断する"
    if dominant == "Blocked":
        return "blocked 理由を明示して、再開条件を 1 行で固定する"
    if dominant == "Need Review":
        return "代表 session を見て、board に載せる粒度と列を確定する"
    if dominant == "In Progress":
        return "直近の続きを 1 ステップだけ切り出して next action にする"
    return "代表 session を確認して次の 1 手を決める"


def derive_task_priority(cluster: dict[str, Any]) -> int:
    session_count = int(cluster.get("session_count", 0))
    repo_count = len(cluster.get("primary_repos", []))
    dominant = cluster.get("ai_column", cluster.get("dominant_status", "Need Review"))
    base = {
        "Blocked": 100,
        "Need Review": 80,
        "In Progress": 60,
        "Pending": 40,
        "Dropped": 0,
        "Done": -100,
    }.get(dominant, 10)
    return base + session_count * 10 + repo_count * 5


def build_suggested_tasks(task_clusters: list[dict[str, Any]]) -> list[dict[str, Any]]:
    suggested: list[dict[str, Any]] = []
    now = datetime.now(timezone.utc)
    for cluster in task_clusters:
        ai_column, ai_reason = derive_candidate_column(cluster, now)
        cluster["ai_column"] = ai_column
        cluster["ai_reason"] = ai_reason
        if ai_column == "Done":
            continue
        title_ja = derive_task_title_ja(cluster)
        suggested.append(
            {
                "task_id": re.sub(r"[^a-z0-9]+", "-", cluster.get("cluster_label", "misc").lower()).strip("-") or "misc",
                "cluster_key": cluster.get("cluster_key"),
                "title_ja": title_ja,
                "task_size_ja": derive_task_size_ja(cluster),
                "推奨列": ai_column,
                "理由": derive_task_reason_ja(cluster),
                "状態判断理由": ai_reason,
                "次の一手": derive_task_next_action_ja(cluster),
                "cluster_label": cluster.get("cluster_label"),
                "primary_repos": cluster.get("primary_repos", []),
                "session_count": cluster.get("session_count", 0),
                "representative_titles": cluster.get("representative_titles", []),
            }
        )
        suggested[-1]["priority_score"] = derive_task_priority({**cluster, "ai_column": ai_column})
    suggested.sort(
        key=lambda item: (
            -int(item.get("priority_score", 0)),
            0 if item["task_size_ja"] == "大タスク" else 1,
        )
    )
    return suggested


QUALITY_WEAK_TITLE_TERMS = ("内容確認", "状態・品質確認", "状態確認", "進捗確認", "差分確認")


def title_quality_issues(title: str) -> list[str]:
    issues: list[str] = []
    if is_surface_artifact_title(title):
        issues.append("surface-artifact-title")
    if any(term in title for term in QUALITY_WEAK_TITLE_TERMS):
        issues.append("generic-confirmation-title")
    if title.endswith(("の整理", "を整理")):
        issues.append("over-generic-organize-title")
    return issues


def build_quality_report(sessions: list[dict[str, Any]], task_clusters: list[dict[str, Any]], suggested_tasks: list[dict[str, Any]]) -> dict[str, Any]:
    """Machine-readable guardrail for the exact regressions reviewed in the UI."""
    weak_sessions = [
        {
            "session_id": item.get("session_id"),
            "title": item.get("title"),
            "issues": title_quality_issues(item.get("title", "")),
            "topic_label": item.get("topic_label"),
            "latest_meaningful_change": item.get("latest_meaningful_change"),
        }
        for item in sessions
        if title_quality_issues(item.get("title", ""))
    ]
    weak_candidates = [
        {
            "title": item.get("title_ja"),
            "issues": title_quality_issues(item.get("title_ja", "")),
            "cluster_label": item.get("cluster_label"),
            "primary_repos": item.get("primary_repos", []),
        }
        for item in suggested_tasks
        if title_quality_issues(item.get("title_ja", ""))
    ]
    suspicious_merges = [
        {
            "cluster_key": item.get("cluster_key"),
            "cluster_label": item.get("cluster_label"),
            "session_count": item.get("session_count"),
            "primary_repos": item.get("primary_repos", []),
            "representative_titles": item.get("representative_titles", []),
        }
        for item in task_clusters
        if int(item.get("session_count") or 0) >= 3
        and len(set(item.get("representative_titles", []))) >= 3
        and item.get("cluster_label") in {"メール運用", "転職・求人選別", "repoレビュー", "ナレッジ取り込み"}
    ]
    project_entity_mismatches = [
        {
            "session_id": item.get("session_id"),
            "title": item.get("title"),
            "primary_repo": item.get("primary_repo"),
            "topic_label": item.get("topic_label"),
            "issue": "project-specific entity leaked into another repo topic",
        }
        for item in sessions
        if (
            item.get("primary_repo") != "project-dof"
            and "なかも" in str(item.get("title") or item.get("current_goal") or "")
        )
        or (
            item.get("primary_repo") == "near-future-demand-lens"
            and item.get("topic_label") in {"クリエイティブ素材", "LinkedInオファー返信方針"}
        )
    ]
    stale_context_topic_risks = []
    for item in sessions:
        latest = str(item.get("latest_meaningful_change") or "").lower()
        latest_phase = str(item.get("latest_phase_context") or "").lower()
        phase_text = f"{latest}\n{latest_phase}"
        topic_label = item.get("topic_label") or ""
        topic_key = item.get("topic_key") or ""
        repo = item.get("primary_repo") or ""
        if repo == "near-future-demand-lens" and topic_label == "LinkedInオファー返信方針" and any(
            token in latest for token in ("指数", "需給", "需要", "供給圧", "マネタイズ", "buyer_demand", "supply_pressure")
        ):
            stale_context_topic_risks.append({
                "session_id": item.get("session_id"),
                "title": item.get("title"),
                "primary_repo": repo,
                "topic_label": topic_label,
                "latest_meaningful_change": item.get("latest_meaningful_change"),
                "issue": "latest repo-specific demand-index work was absorbed by stale career context",
            })
        if repo == "portfolio" and topic_label == "クリエイティブ素材" and any(
            token in phase_text for token in ("bing", "google", "business", "ビジネスプロフィール", "販路", "オーナー確認")
        ):
            stale_context_topic_risks.append({
                "session_id": item.get("session_id"),
                "title": item.get("title"),
                "primary_repo": repo,
                "topic_label": topic_label,
                "latest_meaningful_change": item.get("latest_meaningful_change"),
                "issue": "portfolio B2B sales-channel work was absorbed by stale creative/ChatGPT context",
            })
        phase_conflict_rules = [
            ("クリエイティブ素材", ("bing", "google", "business", "ビジネスプロフィール", "販路", "オーナー確認"), "latest phase looks like B2B sales-channel, not creative assets"),
            ("LinkedInオファー返信方針", ("指数", "需給", "需要", "供給圧", "マネタイズ", "raw evidence"), "latest phase looks like demand-index work, not LinkedIn reply"),
            ("タスク別送信者名", ("デプロイ", "本番", "production", "vercel", "workflow", "反映済"), "latest phase looks like implementation/deploy work, not mail sender identity"),
        ]
        for conflict_label, conflict_tokens, conflict_issue in phase_conflict_rules:
            if topic_label == conflict_label and any(token in phase_text for token in conflict_tokens):
                stale_context_topic_risks.append({
                    "session_id": item.get("session_id"),
                    "title": item.get("title"),
                    "primary_repo": repo,
                    "topic_label": topic_label,
                    "latest_meaningful_change": item.get("latest_meaningful_change"),
                    "issue": conflict_issue,
                })
                break
        if topic_key.startswith("global:") and topic_label in {"LinkedInオファー返信方針", "タスク別送信者名"} and any(
            token in latest for token in ("デプロイ", "本番", "production", "vercel", "反映済", "workflow")
        ):
            stale_context_topic_risks.append({
                "session_id": item.get("session_id"),
                "title": item.get("title"),
                "primary_repo": repo,
                "topic_label": topic_label,
                "latest_meaningful_change": item.get("latest_meaningful_change"),
                "issue": "global workflow topic conflicts with latest implementation/deploy work",
            })
    topic_title_mismatches = []
    for item in sessions:
        topic_label = item.get("topic_label") or ""
        title = item.get("title") or ""
        if topic_label not in RECOMPOSABLE_TOPIC_LABELS:
            continue
        concrete_title = concrete_title_from_topic(
            item.get("primary_repo") or "unknown",
            topic_label,
            item.get("latest_meaningful_change") or "",
            title,
            "\n".join(
                str(part)
                for part in (
                    item.get("deep_summary"),
                    item.get("first_user_line"),
                    item.get("last_assistant_message"),
                )
                if part
            ),
        )
        if should_recompose_title_for_topic(title, topic_label, concrete_title):
            topic_title_mismatches.append(
                {
                    "session_id": item.get("session_id"),
                    "title": title,
                    "suggested_title": concrete_title,
                    "topic_label": topic_label,
                    "issue": "title does not match extracted topic",
                }
            )
    return {
        "status": "needs-review" if (weak_sessions or weak_candidates or suspicious_merges or project_entity_mismatches or stale_context_topic_risks or topic_title_mismatches) else "ok",
        "weak_session_titles": weak_sessions,
        "weak_candidate_titles": weak_candidates,
        "suspicious_merges": suspicious_merges,
        "project_entity_mismatches": project_entity_mismatches,
        "stale_context_topic_risks": stale_context_topic_risks,
        "topic_title_mismatches": topic_title_mismatches,
    }



def _coerce_text_parts(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        return [value]
    if isinstance(value, (int, float, bool)):
        return [str(value)]
    if isinstance(value, list):
        parts: list[str] = []
        for item in value:
            parts.extend(_coerce_text_parts(item))
        return parts
    if isinstance(value, dict):
        parts: list[str] = []
        for key in ("text", "content", "message", "summary", "title"):
            if key in value:
                parts.extend(_coerce_text_parts(value.get(key)))
        return parts
    return [str(value)]


def estimate_session_text_stats(session: dict[str, Any]) -> tuple[int, int]:
    fields = [
        "title",
        "summary",
        "task_body_summary",
        "current_goal",
        "deep_summary",
        "latest_meaningful_change",
        "latest_phase_context",
        "blocker",
        "first_user_message",
        "last_user_message",
        "last_assistant_message",
        "suggested_reason",
    ]
    parts: list[str] = []
    for field in fields:
        parts.extend(_coerce_text_parts(session.get(field)))
    for field in ("evidence_messages", "recent_user_messages", "timeline_messages"):
        parts.extend(_coerce_text_parts(session.get(field)))
    chars = len("\n".join(item for item in parts if item))
    # Deliberately a rough review-sorting signal, not billing-grade token accounting.
    estimated_tokens = math.ceil(chars / 4) if chars else 0
    return chars, estimated_tokens


def apply_lightweight_prioritization_stats(bundle: dict[str, Any]) -> dict[str, Any]:
    sessions = bundle.get("sessions") or []
    by_id: dict[str, dict[str, Any]] = {}
    for session in sessions:
        if not isinstance(session, dict):
            continue
        chars, estimated_tokens = estimate_session_text_stats(session)
        session["text_size_chars"] = int(session.get("text_size_chars") or chars)
        session["estimated_tokens"] = int(session.get("estimated_tokens") or estimated_tokens)
        command_count = int(session.get("command_count") or 0)
        activity_score = int(session.get("activity_score") or 0)
        related_count = int(session.get("related_session_count") or 1)
        high_activity = bool(session.get("high_activity_signal")) or command_count >= 25 or activity_score >= 120
        large_session = bool(session.get("large_session_signal")) or session["estimated_tokens"] >= 700 or command_count >= 50
        flags = set(session.get("prioritization_flags") or [])
        if high_activity:
            flags.add("high-activity")
        if large_session:
            flags.add("large-session")
        if related_count >= 2:
            flags.add("multi-session")
        session["high_activity_signal"] = high_activity
        session["large_session_signal"] = large_session
        session["prioritization_flags"] = sorted(flags)
        if session.get("session_id"):
            by_id[str(session["session_id"])] = session

    for cluster in bundle.get("task_clusters") or []:
        if not isinstance(cluster, dict):
            continue
        members = [by_id[item] for item in cluster.get("session_ids") or [] if item in by_id]
        if not members:
            continue
        cluster["estimated_tokens_total"] = sum(int(item.get("estimated_tokens") or 0) for item in members)
        cluster["estimated_tokens_max"] = max(int(item.get("estimated_tokens") or 0) for item in members)
        cluster["high_activity_count"] = sum(1 for item in members if item.get("high_activity_signal"))
        cluster["large_session_count"] = sum(1 for item in members if item.get("large_session_signal"))

    cluster_lookup = {item.get("cluster_key"): item for item in (bundle.get("task_clusters") or []) if isinstance(item, dict)}
    for task in bundle.get("suggested_tasks") or []:
        if not isinstance(task, dict):
            continue
        cluster = cluster_lookup.get(task.get("cluster_key"))
        if cluster:
            task["estimated_tokens_total"] = cluster.get("estimated_tokens_total", 0)
            task["estimated_tokens_max"] = cluster.get("estimated_tokens_max", 0)
            task["high_activity_count"] = cluster.get("high_activity_count", 0)
            task["large_session_count"] = cluster.get("large_session_count", 0)
    return bundle

def collect_sessions(codex_home: Path, days: int, max_sessions: int, min_user_messages: int) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=days)
    session_files = sorted(
        codex_home.joinpath("sessions").rglob("*.jsonl"),
        key=lambda path: path.stat().st_mtime,
        reverse=True,
    )

    sessions: list[dict[str, Any]] = []
    for path in session_files:
        modified = datetime.fromtimestamp(path.stat().st_mtime, timezone.utc)
        if modified < cutoff:
            break

        lines = load_jsonl(path)
        if not lines:
            continue

        meta_payload = next((line.get("payload", {}) for line in lines if line.get("type") == "session_meta"), {})
        acc = SessionAccumulator(
            session_id=meta_payload.get("id") or path.stem,
            source_file=str(path),
            start_at=meta_payload.get("timestamp"),
            end_at=lines[-1].get("timestamp"),
            session_cwd=meta_payload.get("cwd"),
        )
        if acc.session_cwd:
            acc.cwds.append(acc.session_cwd)

        for line in lines:
            payload = line.get("payload", {})
            line_type = line.get("type")
            if line_type == "turn_context":
                cwd = payload.get("cwd")
                if cwd:
                    acc.cwds.append(cwd)
            elif line_type == "event_msg":
                payload_type = payload.get("type")
                if payload_type == "user_message":
                    message = payload.get("message", "").strip()
                    if message:
                        acc.user_messages.append(message)
                        acc.timeline_messages.append(("user", message))
                elif payload_type == "exec_command_end":
                    acc.command_count += 1
                    cwd = payload.get("cwd")
                    if cwd:
                        acc.cwds.append(cwd)
                elif payload_type == "task_started":
                    acc.task_started += 1
                elif payload_type == "task_complete":
                    acc.task_completed += 1
            elif line_type == "response_item" and payload.get("type") == "message" and payload.get("role") == "assistant":
                assistant_text = extract_message_text(payload)
                if assistant_text:
                    acc.assistant_messages.append(assistant_text)
                    acc.timeline_messages.append(("assistant", assistant_text))

        summary = summarize_session(acc, now)
        if not summary:
            continue
        if summary["user_message_count"] < min_user_messages:
            continue
        sessions.append(summary)
        if len(sessions) >= max_sessions:
            break

    task_clusters = enrich_task_clusters(sessions)
    suggested_tasks = build_suggested_tasks(task_clusters)
    bundle = {
        "generated_at": datetime.now(JST).isoformat(timespec="seconds"),
        "source": str(codex_home),
        "mode": "auto-first-with-optional-human-override",
        "sessions": sessions,
        "task_clusters": task_clusters,
        "suggested_tasks": suggested_tasks,
    }
    apply_lightweight_prioritization_stats(bundle)
    bundle["quality_report"] = build_quality_report(sessions, task_clusters, suggested_tasks)
    return bundle


def render_markdown(bundle: dict[str, Any]) -> str:
    sessions = bundle.get("sessions", [])
    counts = Counter(item.get("suggested_status") for item in sessions)
    auto_ready = sum(1 for item in sessions if item.get("autonomy_mode") == "auto-ready")
    lines = [
        "# Codex Session Review Pack",
        "",
        f"- generated_at: {bundle.get('generated_at')}",
        f"- source: {bundle.get('source')}",
        f"- mode: {bundle.get('mode')}",
        f"- sessions: {len(sessions)}",
        f"- auto_ready: {auto_ready}",
        f"- quality: {bundle.get('quality_report', {}).get('status', 'unknown')}",
        "",
        "## Status counts",
    ]
    for status in STATUS_ORDER:
        lines.append(f"- {status}: {counts.get(status, 0)}")
    clusters = bundle.get("task_clusters", [])
    if clusters:
        lines.extend(["", "## Task clusters"])
        for cluster in clusters[:12]:
            lines.append(
                f"- {cluster.get('cluster_label')} ({cluster.get('session_count')} sessions / {cluster.get('dominant_status')})"
            )
    suggested_tasks = bundle.get("suggested_tasks", [])
    if suggested_tasks:
        lines.extend(["", "## Kanban 追加候補"])
        for task in suggested_tasks[:12]:
            lines.append(
                f"- [{task.get('task_size_ja')}] {task.get('title_ja')} / 推奨列: {task.get('推奨列')} / {task.get('理由')} / 次の一手: {task.get('次の一手')}"
            )
    quality_report = bundle.get("quality_report", {})
    if quality_report and quality_report.get("status") != "ok":
        lines.extend(["", "## Quality warnings"])
        for key in ("weak_candidate_titles", "weak_session_titles", "suspicious_merges"):
            rows = quality_report.get(key) or []
            if rows:
                lines.append(f"### {key}")
                for row in rows[:10]:
                    lines.append(f"- {row}")
    lines.extend(["", "## Sessions"])
    for item in sessions:
        lines.extend(
            [
                f"### {item.get('title')}",
                f"- repo: {item.get('primary_repo')}",
                f"- task_cluster: {item.get('task_cluster_label')} ({item.get('related_session_count', 1)} sessions)",
                f"- suggested_status: {item.get('suggested_status')} ({item.get('suggested_confidence')}%)",
                f"- autonomy_mode: {item.get('autonomy_mode')}",
                f"- reason: {item.get('suggested_reason')}",
                f"- start_at: {item.get('start_at')}",
                f"- source_file: `{item.get('source_file')}`",
                f"- first_user: {item.get('first_user_message')}",
                f"- summary: {item.get('summary')}",
                "",
            ]
        )
    return "\n".join(lines)




def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def provider_status(value: Any) -> str:
    raw = str(value or "").strip().lower()
    if raw in {"done", "completed", "complete", "success", "closed"}:
        return "Done"
    if raw in {"dropped", "cancelled", "canceled", "wontfix", "archived"}:
        return "Dropped"
    if raw in {"blocked", "error", "failed", "waiting-on-user"}:
        return "Blocked"
    if raw in {"pending", "waiting", "paused", "todo", "backlog"}:
        return "Pending"
    if raw in {"in progress", "in_progress", "active", "running", "working"}:
        return "In Progress"
    if value in STATUS_ORDER:
        return str(value)
    return "Need Review"


def infer_provider(item: dict[str, Any], board_provider: str | None = None) -> str:
    explicit = item.get("provider") or item.get("source_tool") or item.get("tool") or board_provider
    if explicit:
        return str(explicit)
    keys = set(item.keys())
    if {"uuid", "cwd"} & keys and ("messages" in keys or "transcript" in keys):
        return "claude-code"
    if {"workspace", "conversation"} & keys or "cursor_session_id" in keys:
        return "cursor-agent"
    if {"history", "model"} <= keys or "gemini_session_id" in keys:
        return "gemini-cli"
    return "generic-ai-session"


def text_from_provider_content(content: Any) -> str:
    if content is None:
        return ""
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        chunks: list[str] = []
        for part in content:
            if isinstance(part, str):
                chunks.append(part)
            elif isinstance(part, dict):
                chunks.append(str(part.get("text") or part.get("content") or part.get("value") or ""))
        return "\n".join(chunk for chunk in chunks if chunk).strip()
    if isinstance(content, dict):
        if "parts" in content:
            return text_from_provider_content(content.get("parts"))
        return str(content.get("text") or content.get("content") or content.get("message") or content.get("value") or "").strip()
    return str(content).strip()


def provider_messages(item: dict[str, Any]) -> list[tuple[str, str]]:
    raw_messages = (
        item.get("timeline_messages")
        or item.get("messages")
        or item.get("conversation")
        or item.get("turns")
        or item.get("history")
        or item.get("events")
        or []
    )
    messages: list[tuple[str, str]] = []
    if not isinstance(raw_messages, list):
        return messages
    for raw in raw_messages:
        if isinstance(raw, (list, tuple)) and len(raw) >= 2:
            role = str(raw[0] or "user").lower()
            text = text_from_provider_content(raw[1])
        elif isinstance(raw, dict):
            role = str(raw.get("role") or raw.get("speaker") or raw.get("type") or "user").lower()
            text = text_from_provider_content(raw.get("content") or raw.get("message") or raw.get("text") or raw.get("parts"))
        else:
            role = "user"
            text = text_from_provider_content(raw)
        if not text:
            continue
        if role in {"assistant", "model", "agent", "ai"}:
            role = "assistant"
        elif role in {"system", "tool", "function"}:
            role = "system"
        else:
            role = "user"
        messages.append((role, text))
    return messages


def repo_from_provider_item(item: dict[str, Any]) -> str:
    value = item.get("primary_repo") or item.get("repo") or item.get("repository") or item.get("project") or item.get("workspace_name")
    if value:
        return str(value)
    path_value = item.get("workspace") or item.get("cwd") or item.get("session_cwd") or item.get("project_path")
    if path_value:
        normalized = str(path_value).replace("\\", "/").rstrip("/")
        name = normalized.split("/")[-1]
        return name or "unknown"
    return "unknown"


def normalize_provider_session(item: dict[str, Any], index: int, board_provider: str | None = None) -> dict[str, Any]:
    if not isinstance(item, dict):
        item = {"summary": str(item)}
    provider = infer_provider(item, board_provider)
    messages = provider_messages(item)
    user_messages = [text for role, text in messages if role == "user"]
    assistant_messages = [text for role, text in messages if role == "assistant"]
    evidence = item.get("evidence_messages") if isinstance(item.get("evidence_messages"), list) else []
    if not evidence:
        evidence = [clip(text, 180) for text in (user_messages + assistant_messages)[:4] if text]
    title = item.get("title") or item.get("title_ja") or item.get("title_en") or item.get("current_goal") or item.get("goal")
    if not title:
        title = clip(user_messages[-1] if user_messages else (item.get("summary") or item.get("prompt") or f"Imported {provider} session {index + 1}"), 80)
    summary = item.get("summary") or item.get("summary_ja") or item.get("summary_en") or item.get("current_goal") or item.get("goal")
    if not summary:
        source = item.get("description") or item.get("prompt") or (" / ".join(evidence[:2]) if evidence else title)
        summary = clip(str(source), 220)
    start_at = item.get("start_at") or item.get("created_at") or item.get("createdAt") or item.get("timestamp") or item.get("startTime") or item.get("end_at") or datetime.now(JST).isoformat(timespec="seconds")
    end_at = item.get("end_at") or item.get("updated_at") or item.get("updatedAt") or item.get("lastUpdated") or item.get("endTime") or start_at
    session_id = item.get("session_id") or item.get("id") or item.get("uuid") or item.get("conversation_id") or item.get("cursor_session_id") or item.get("gemini_session_id") or item.get("name") or f"imported-{provider}-{index + 1}"
    normalized = {
        **item,
        "session_id": str(session_id),
        "title": str(title),
        "summary": str(summary),
        "suggested_status": provider_status(item.get("suggested_status") or item.get("currentStatus") or item.get("status") or item.get("state")),
        "primary_repo": repo_from_provider_item(item),
        "start_at": str(start_at),
        "end_at": str(end_at),
        "evidence_messages": evidence,
        "first_user_message": item.get("first_user_message") or (user_messages[0] if user_messages else ""),
        "last_assistant_message": item.get("last_assistant_message") or (assistant_messages[-1] if assistant_messages else ""),
        "user_message_count": item.get("user_message_count") or len(user_messages),
        "assistant_message_count": item.get("assistant_message_count") or len(assistant_messages),
        "command_count": item.get("command_count") or len([role for role, _ in messages if role == "system"]),
        "activity_score": item.get("activity_score") or max(1, len(messages) * 8 + len(evidence) * 5),
        "provider": provider,
        "provider_session_type": item.get("provider_session_type") or item.get("format") or f"{provider}-import",
        "provider_source": item.get("provider_source") or item.get("source") or "provider-import",
    }
    cluster_key = normalized.get("task_cluster_key") or normalized.get("topic_key") or f"{normalized['primary_repo']}:{slugify(str(title)) or normalized['session_id']}"
    normalized.setdefault("task_cluster_key", cluster_key)
    normalized.setdefault("topic_key", cluster_key)
    normalized.setdefault("lineage_key", cluster_key)
    normalized.setdefault("task_cluster_label", normalized.get("topic_label") or str(title))
    normalized.setdefault("topic_label", normalized.get("task_cluster_label"))
    normalized.setdefault("lineage_label", normalized.get("task_cluster_label"))
    return normalized


def normalize_import_bundle(raw: Any) -> dict[str, Any]:
    if isinstance(raw, list):
        board: dict[str, Any] = {"sessions": raw}
    elif isinstance(raw, dict):
        board = dict(raw)
    else:
        raise SystemExit("input JSON must be an object or an array of sessions")
    sessions = board.get("sessions") or board.get("conversations") or board.get("items") or []
    if not isinstance(sessions, list):
        raise SystemExit("input JSON must contain a sessions array")
    board_provider = board.get("provider") or board.get("source_tool")
    board["sessions"] = [normalize_provider_session(item, index, board_provider) for index, item in enumerate(sessions)]
    board.setdefault("generated_at", datetime.now(JST).isoformat(timespec="seconds"))
    board.setdefault("source", "provider-import")
    board.setdefault("schema_version", "0.2.1")
    providers = sorted({item.get("provider", "generic-ai-session") for item in board["sessions"]})
    if providers:
        board.setdefault("supported_providers", providers)
    return board




def read_app_version(root: Path) -> str:
    package_path = root.parent / "package.json"
    try:
        package = json.loads(package_path.read_text(encoding="utf-8"))
        version = str(package.get("version") or "").strip()
        return version or "unknown"
    except Exception:
        return "unknown"


def render_html(bundle: dict[str, Any], root: Path) -> str:
    bundle["app_version"] = read_app_version(root)
    template = root.joinpath("templates", "review_template.html").read_text(encoding="utf-8")
    css = root.joinpath("assets", "styles.css").read_text(encoding="utf-8").rstrip()
    js = root.joinpath("assets", "app.js").read_text(encoding="utf-8").rstrip()
    html = template.replace("__INLINE_CSS__", css)
    html = html.replace("__INLINE_JS__", js)
    html = html.replace("__BOOTSTRAP_JSON__", json.dumps(bundle, ensure_ascii=False))
    return html


PRIVATE_PATTERNS = [
    "C:\\Users\\",
    "C:/Users/",
    "vercel-protection-bypass",
    "BEGIN PRIVATE KEY",
    "gmail_token",
    "credentials.json",
]


def get_private_patterns() -> list[str]:
    extra = os.environ.get("CODEX_REVIEW_PRIVATE_MARKERS", "")
    extra_patterns = [item.strip() for item in extra.split(";") if item.strip()]
    return PRIVATE_PATTERNS + extra_patterns


def find_private_markers(bundle: dict[str, Any]) -> list[str]:
    text = json.dumps(bundle, ensure_ascii=False)
    return sorted({pattern for pattern in get_private_patterns() if pattern in text})


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build static Codex session review surface")
    parser.add_argument("--codex-home", type=Path, default=Path.home() / ".codex")
    parser.add_argument("--input-json", type=Path, help="Use prebuilt JSON bundle instead of scanning .codex")
    parser.add_argument("--output", type=Path, default=Path("codex_session_review/dist/review.html"))
    parser.add_argument("--json-output", type=Path, help="Optional path to also write the extracted bundle JSON")
    parser.add_argument("--markdown-output", type=Path, help="Optional path to also write a markdown review pack")
    parser.add_argument("--distribution", action="store_true", help="Fail if the bundle appears to contain private/local data")
    parser.add_argument("--days", type=int, default=7)
    parser.add_argument("--max-sessions", type=int, default=40)
    parser.add_argument("--min-user-messages", type=int, default=4)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    root = Path(__file__).resolve().parent
    if args.input_json:
        bundle = normalize_import_bundle(json.loads(args.input_json.read_text(encoding="utf-8")))
        sessions = bundle.get("sessions", [])
        if sessions and not bundle.get("task_clusters"):
            bundle["task_clusters"] = enrich_task_clusters(sessions)
        if bundle.get("task_clusters") and not bundle.get("suggested_tasks"):
            bundle["suggested_tasks"] = build_suggested_tasks(bundle["task_clusters"])
        if sessions and bundle.get("task_clusters") and bundle.get("suggested_tasks"):
            apply_lightweight_prioritization_stats(bundle)
        if sessions and bundle.get("task_clusters") and bundle.get("suggested_tasks") and not bundle.get("quality_report"):
            bundle["quality_report"] = build_quality_report(sessions, bundle["task_clusters"], bundle["suggested_tasks"])
    else:
        bundle = collect_sessions(
            codex_home=args.codex_home,
            days=args.days,
            max_sessions=args.max_sessions,
            min_user_messages=args.min_user_messages,
        )
    apply_lightweight_prioritization_stats(bundle)
    bundle["app_version"] = read_app_version(root)

    if args.distribution:
        bundle["surface_mode"] = "distribution"
        private_markers = find_private_markers(bundle)
        if private_markers:
            raise SystemExit(f"distribution guard failed: private markers found: {', '.join(private_markers)}")
    else:
        bundle.setdefault("surface_mode", "personal")

    html = render_html(bundle, root)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(html, encoding="utf-8")
    if args.json_output:
        args.json_output.parent.mkdir(parents=True, exist_ok=True)
        args.json_output.write_text(json.dumps(bundle, ensure_ascii=False, indent=2), encoding="utf-8")
    if args.markdown_output:
        args.markdown_output.parent.mkdir(parents=True, exist_ok=True)
        args.markdown_output.write_text(render_markdown(bundle), encoding="utf-8")
    print(f"built {args.output}")
    print(f"sessions: {len(bundle.get('sessions', []))}")
    print(f"source: {bundle.get('source')}")
    if args.json_output:
        print(f"json: {args.json_output}")
    if args.markdown_output:
        print(f"markdown: {args.markdown_output}")


if __name__ == "__main__":
    main()
