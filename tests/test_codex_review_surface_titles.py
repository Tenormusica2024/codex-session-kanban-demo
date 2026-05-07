import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
root_str = str(ROOT)
if root_str not in sys.path:
    sys.path.insert(0, root_str)

from codex_session_review.build_review_surface import (
    SUPABASE_RLS_SECURITY_LABEL,
    build_quality_report,
    concrete_title_from_topic,
    derive_repo_name,
    derive_topic_key,
    SessionAccumulator,
)


class CodexReviewSurfaceTitleTest(unittest.TestCase):
    def test_llmwiki_research_links_fallback_is_not_creative_assets(self):
        topic_key, topic_label, confidence, reason = derive_topic_key(
            repo_name="curiosity-wiki",
            task_cluster_label="llmwiki",
            title="LLMWIKI Research Links last 24h の成功ログとscore誤表示調査",
            current_goal="LLMWIKI Research Links の失敗/score誤表示修正",
            first_user_line=(
                "失敗してるのにgmailの[LLMWIKI] Research Links last 24hで"
                "成功ログと score: 13/25 がついてるのはおかしい"
            ),
            latest_meaningful_change="誤表示関連の残タスクを確認中",
            deep_context=(
                "assistant: LOCAL_WIKI_FALLBACK true のmdをscore N/Aにし、"
                "send_daily_research_linksの成功ログをなしにした\n"
                "assistant: search_local_fallback / search_deferred_timeout を要確認に分離"
            ),
        )

        self.assertEqual(topic_key, "curiosity-wiki:llmwiki-report-visibility")
        self.assertEqual(topic_label, "LLMWIKI報告メール誤表示修正")
        self.assertGreaterEqual(confidence, 90)
        self.assertIn("Research Links", reason)

    def test_llmwiki_visibility_title_prefers_score_misdisplay(self):
        title = concrete_title_from_topic(
            "curiosity-wiki",
            "LLMWIKI報告メール誤表示修正",
            "LOCAL_WIKI_FALLBACK なのに score: 13/25 と成功ログが出た",
            "fallback",
        )
        self.assertEqual(title, "LLMWIKI Research Links の失敗/score誤表示修正")

    def test_llmwiki_visibility_handles_success_like_unknown_wording(self):
        topic_key, topic_label, confidence, _reason = derive_topic_key(
            repo_name="curiosity-wiki",
            task_cluster_label="llmwiki",
            title="Research Links の結果表示を修正",
            current_goal="LLMWIKI Research Links の成功判定表示修正",
            first_user_line="LLMWIKIの外部検索が失敗なのに成功扱いになっている",
            latest_meaningful_change="失敗なのに成功扱いになる暫定成功表示を修正",
            deep_context="assistant: Research Links の fallback 表示と要確認理由を直す",
        )

        self.assertEqual(topic_key, "curiosity-wiki:llmwiki-report-visibility")
        self.assertEqual(topic_label, "LLMWIKI報告メール誤表示修正")
        self.assertGreaterEqual(confidence, 90)

        title = concrete_title_from_topic(
            "curiosity-wiki",
            topic_label,
            "失敗なのに成功扱いになる暫定成功表示を修正",
            "fallback",
        )
        self.assertEqual(title, "LLMWIKI Research Links の成功ログ誤表示修正")

    def test_quality_report_flags_creative_title_for_llmwiki_visibility_phase(self):
        report = build_quality_report(
            sessions=[
                {
                    "session_id": "s1",
                    "title": "curiosity-wikiのChatGPT/CiC画像生成検証",
                    "primary_repo": "curiosity-wiki",
                    "topic_label": "クリエイティブ素材",
                    "topic_key": "curiosity-wiki:creative-assets",
                    "latest_meaningful_change": "誤表示関連の残タスクを確認",
                    "latest_phase_context": (
                        "LLMWIKI Research Links / LOCAL_WIKI_FALLBACK / "
                        "score / 成功ログ / search_local_fallback"
                    ),
                }
            ],
            task_clusters=[],
            suggested_tasks=[],
        )

        self.assertEqual(report["status"], "needs-review")
        issues = [item["issue"] for item in report["stale_context_topic_risks"]]
        self.assertTrue(any("LLMWIKI Research Links visibility" in issue for issue in issues))

    def test_supabase_rls_session_infers_project_and_not_dashboard_freshness(self):
        acc = SessionAccumulator(session_id="s1", source_file="fixture")
        acc.user_messages.append(
            "Supabase Security Advisor: Project\n\nai-model-tracker\n\n"
            "https://supabase.com/dashboard/project/hzofpqlhrlveqnjsoaae/advisors/security\n"
            "rls_disabled_in_public public.benchmarks"
        )
        acc.assistant_messages.append(
            "public.benchmarks の RLS を有効化し、anon/authenticated は SELECT only の public policy にした。"
        )

        repo_name = derive_repo_name([str(Path.home())], acc)
        self.assertEqual(repo_name, "ai-model-tracker")

        topic_key, topic_label, confidence, reason = derive_topic_key(
            repo_name=repo_name,
            task_cluster_label="ranking / dashboard",
            title="ランキングsnapshot鮮度をCiCで修正",
            current_goal="ランキング画面の鮮度・グラフ表示を確認",
            first_user_line="ranking snapshot dashboardを確認",
            latest_meaningful_change="public.benchmarks RLSを有効化し public policy を SELECT only に修正",
            deep_context=(
                "assistant: Supabase Security Advisor の rls_disabled_in_public を確認\n"
                "assistant: Project ai-model-tracker / hzofpqlhrlveqnjsoaae / public.benchmarks / anon SELECT only"
            ),
        )

        self.assertEqual(topic_key, "ai-model-tracker:supabase-rls-security")
        self.assertEqual(topic_label, SUPABASE_RLS_SECURITY_LABEL)
        self.assertGreaterEqual(confidence, 90)
        self.assertIn("Supabase RLS", reason)

        title = concrete_title_from_topic(
            repo_name,
            topic_label,
            "public.benchmarks RLSを有効化し public policy を SELECT only に修正",
            "fallback",
        )
        self.assertEqual(title, "ai-model-trackerのSupabase RLS公開read-only設定修正")

    def test_quality_report_flags_unknown_dashboard_title_for_supabase_rls_phase(self):
        report = build_quality_report(
            sessions=[
                {
                    "session_id": "s2",
                    "title": "unknownのランキングsnapshot鮮度をCiCで修正",
                    "primary_repo": "unknown",
                    "topic_label": "ランキング鮮度・sparkline修正",
                    "topic_key": "unknown:dashboard-freshness",
                    "latest_meaningful_change": "public.benchmarks RLSを有効化し public policy を SELECT only に修正",
                    "latest_phase_context": (
                        "Supabase Security Advisor / rls_disabled_in_public / public.benchmarks / "
                        "anon SELECT only / project hzofpqlhrlveqnjsoaae"
                    ),
                }
            ],
            task_clusters=[],
            suggested_tasks=[],
        )

        self.assertEqual(report["status"], "needs-review")
        weak_issues = [issue for item in report["weak_session_titles"] for issue in item["issues"]]
        self.assertIn("unknown-project-title", weak_issues)
        unknown_repo_issues = [item["issue"] for item in report["unknown_repo_sessions"]]
        self.assertTrue(any("repo/project inference returned unknown" in issue for issue in unknown_repo_issues))
        investigation = report["unknown_repo_sessions"][0]["investigation"]
        self.assertEqual(investigation["candidate_repo"], "ai-model-tracker")
        self.assertIn("latest_phase_context", investigation["inspected"])
        self.assertIn("next_fix", investigation)
        stale_issues = [item["issue"] for item in report["stale_context_topic_risks"]]
        self.assertTrue(any("Supabase RLS/security" in issue for issue in stale_issues))

    def test_web_remote_desktop_clipboard_work_is_not_ranking_freshness(self):
        topic_key, topic_label, confidence, reason = derive_topic_key(
            repo_name="web-remote-desktop",
            task_cluster_label="残タスク",
            title="残タスク",
            current_goal="残タスクを教えて",
            first_user_line="残タスクを教えて",
            latest_meaningful_change="実装はコミット済みなので、監視プロセスを再起動します。",
            deep_context=(
                "assistant: clipboard copy 後 100ms / Ctrl+V 後 paste probe wait / TRANSCRIPT は即時 q\n"
                "assistant: idle-continue-question 後は二択判定を優先し、残タスク回答ありなら残タスクを進めてを送る\n"
                "assistant: web-remote-desktop watcher を再起動。same_display_without_thinking の曖昧ゲートを回避\n"
                "__STALE_CONTEXT__\n"
                "near-future-demand-lens ranking snapshot 鮮度 dashboard sparkline"
            ),
        )

        self.assertEqual(topic_key, "web-remote-desktop:idle-continue-agent")
        self.assertEqual(topic_label, "idle-continue代理ツール")
        self.assertGreaterEqual(confidence, 90)
        self.assertIn("idle-continue", reason)

        title = concrete_title_from_topic(
            "web-remote-desktop",
            topic_label,
            "idle-continue-question 後は二択判定を優先し、残タスク回答ありなら残タスクを進めてを送る",
            "fallback",
        )
        self.assertEqual(title, "web-remote-desktopの残タスク自動送信判定修正")

    def test_quality_report_flags_ranking_topic_outside_near_future_repo(self):
        report = build_quality_report(
            sessions=[
                {
                    "session_id": "wrd1",
                    "title": "web-remote-desktopのランキングsnapshot鮮度をクリップボードで修正",
                    "primary_repo": "web-remote-desktop",
                    "topic_label": "ランキング鮮度・sparkline修正",
                    "topic_key": "web-remote-desktop:dashboard-freshness",
                    "latest_meaningful_change": "idle-continue-question 後は二択判定を優先",
                    "latest_phase_context": "clipboard / Ctrl+V / TRANSCRIPT / watcher / 残タスクを進めて",
                }
            ],
            task_clusters=[],
            suggested_tasks=[],
        )

        self.assertEqual(report["status"], "needs-review")
        issues = [item["issue"] for item in report["stale_context_topic_risks"]]
        self.assertTrue(any("reserved for near-future-demand-lens" in issue for issue in issues))
        self.assertTrue(any("idle-continue/clipboard" in issue for issue in issues))

    def test_codex_review_surface_title_quality_beats_stale_supabase_and_idle_terms(self):
        topic_key, topic_label, confidence, reason = derive_topic_key(
            repo_name="openclaw-secretary",
            task_cluster_label="llm",
            title="再発防止リスク確認",
            current_goal="Codex review surfaceのタイトル分類とquality gateを改善",
            first_user_line="このタイトルは正しい？ 誤分類の再発防止を確認して",
            latest_meaningful_change="Codex review surfaceのタイトル分類、unknown調査、quality gateを再確認",
            deep_context=(
                "assistant: codex_session_review/build_review_surface.py と title_classification_rules.py を修正\n"
                "assistant: quality gate / quality_report / unknown_repo_sessions / topic_title_mismatches を検証\n"
                "assistant: sc-rflで再発防止とstale context誤分類を確認\n"
                "__STALE_CONTEXT__\n"
                "Supabase Security Advisor rls_disabled_in_public public.benchmarks\n"
                "web-remote-desktop clipboard TRANSCRIPT idle-continue 残タスクを進めて"
            ),
        )

        self.assertEqual(topic_key, "openclaw-secretary:codex-review-surface-title-quality")
        self.assertEqual(topic_label, "Codexセッションkanbanタイトル分類改善")
        self.assertGreaterEqual(confidence, 90)
        self.assertIn("title classification", reason)

        title = concrete_title_from_topic(
            "openclaw-secretary",
            topic_label,
            "Codex review surfaceのタイトル分類、unknown調査、quality gateを再確認",
            "fallback",
        )
        self.assertEqual(title, "Codexセッションkanbanのタイトル分類・quality gate改善")

    def test_codex_review_surface_operation_is_named_as_kanban(self):
        topic_key, topic_label, confidence, reason = derive_topic_key(
            repo_name="openclaw-secretary",
            task_cluster_label="codex_session_review",
            title="Codex review surface運用改善",
            current_goal="codex_session_reviewの定期実行とremote overrides同期を改善",
            first_user_line="Codex review surfaceって何だっけ。kanbanと言われた方がわかる",
            latest_meaningful_change="codex_session_review / review.html / overrides.local.json の定期実行、remote overrides、skipped_fixed、perf_statusを確認",
            deep_context="codex-session-review surface scheduler parse cache remote overrides perf_status skipped_fixed",
        )

        self.assertEqual(topic_key, "openclaw-secretary:codex-review-surface")
        self.assertEqual(topic_label, "Codexセッションkanban運用改善")
        self.assertGreaterEqual(confidence, 80)
        self.assertIn("kanban operation", reason)

        title = concrete_title_from_topic(
            "openclaw-secretary",
            topic_label,
            "定期実行、remote overrides同期、固定済みskip、性能指標を確認",
            "fallback",
        )
        self.assertEqual(title, "Codexセッションkanbanの定期実行・同期改善")


if __name__ == "__main__":
    unittest.main()
