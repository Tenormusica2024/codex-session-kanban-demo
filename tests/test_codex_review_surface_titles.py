import sys
import unittest
from datetime import datetime
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
    summarize_session,
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

    def test_near_future_product_work_is_not_absorbed_by_idle_continue(self):
        topic_key, topic_label, confidence, reason = derive_topic_key(
            repo_name="near-future-demand-lens",
            task_cluster_label="今すぐ対応可能な残タスク",
            title="今すぐ対応可能な残タスク",
            current_goal="今すぐ対応可能な残タスクを進める",
            first_user_line="いますぐ対応可能な優先順位の高い残タスクを進めて",
            latest_meaningful_change="duplicate-send guard 修正を Cloudflare private dashboard へ反映",
            deep_context=(
                "assistant: Daily Brief の duplicate-send guard 修正を Cloudflare private dashboard へ反映\n"
                "assistant: npm run site:build / site:validate / ui:quality:hosted-gate / cf:deploy:verify pass\n"
                "user: 残タスクを進めて\n"
                "assistant: LLMWIKI事前値を public-safe sanitizer で抽象化"
            ),
        )

        self.assertEqual(topic_key, "near-future-demand-lens:near-future-ops")
        self.assertEqual(topic_label, "近未来予測レンズ運用改善")
        self.assertGreaterEqual(confidence, 80)
        self.assertIn("near-future demand lens operation", reason)

        title = concrete_title_from_topic(
            "near-future-demand-lens",
            topic_label,
            "duplicate-send guard 修正を Cloudflare private dashboard へ反映",
            "fallback",
        )
        self.assertEqual(title, "近未来予測レンズのDaily Brief重複送信ガード反映")

    def test_near_future_label_requires_repo_identity_not_user_wording_only(self):
        topic_key, topic_label, confidence, reason = derive_topic_key(
            repo_name="openclaw-secretary",
            task_cluster_label="llm",
            title="kanban分類確認",
            current_goal="近未来予測レンズのパネルがない理由を調査",
            first_user_line="近未来予測レンズのパネルがないのはなぜ？",
            latest_meaningful_change="codex_session_review の topic 分類と quality gate を確認",
            deep_context=(
                "assistant: codex_session_review/build_review_surface.py を確認\n"
                "assistant: unknown_repo_sessions / stale_context_topic_risks を確認"
            ),
        )

        self.assertNotEqual(topic_key, "openclaw-secretary:near-future-ops")
        self.assertNotEqual(topic_label, "近未来予測レンズ運用改善")

    def test_repeated_residual_task_prompts_keep_assistant_work_anchor(self):
        acc = SessionAccumulator(
            session_id="residual-loop",
            source_file="fixture.jsonl",
            start_at="2026-05-09T09:00:00+09:00",
            end_at="2026-05-09T10:00:00+09:00",
            session_cwd="C:\\Users\\Tenormusica\\near-future-demand-lens",
            cwds=["C:\\Users\\Tenormusica\\near-future-demand-lens"],
        )
        acc.user_messages.append("残タスクは？")
        work_message = (
            "対応済み。\n"
            "## 進めたタスク\n"
            "### Daily Brief duplicate-send guard を Cloudflare private dashboard へ反映\n"
            "## 検証結果\n"
            "- npm run site:build pass\n"
            "- npm run cf:deploy:verify pass"
        )
        acc.assistant_messages.append(work_message)
        acc.timeline_messages.append(("user", "残タスクは？"))
        acc.timeline_messages.append(("assistant", work_message))
        for _ in range(10):
            user = "残タスクを進めて"
            assistant = (
                "現時点の残タスクはこの順です。\n"
                "- Cloudflare Access 再ログイン後の hosted 認証済み目視\n"
                "## 1. TODO/運用ドキュメントを最新状態へ更新\n"
                "## 2. README / docs の細部リンク確認"
            )
            acc.user_messages.append(user)
            acc.assistant_messages.append(assistant)
            acc.timeline_messages.append(("user", user))
            acc.timeline_messages.append(("assistant", assistant))

        summary = summarize_session(acc, datetime.fromisoformat("2026-05-09T10:05:00+09:00"))

        self.assertIsNotNone(summary)
        assert summary is not None
        self.assertEqual(summary["topic_key"], "near-future-demand-lens:near-future-ops")
        self.assertEqual(summary["topic_label"], "近未来予測レンズ運用改善")
        self.assertIn("Daily Brief", summary["current_goal"])
        self.assertNotIn("残タスク", summary["current_goal"])

    def test_residual_prompt_anchor_falls_back_to_body_when_heading_is_generic(self):
        acc = SessionAccumulator(
            session_id="generic-heading-loop",
            source_file="fixture.jsonl",
            start_at="2026-05-09T09:00:00+09:00",
            end_at="2026-05-09T10:00:00+09:00",
            session_cwd="C:\\Users\\Tenormusica\\near-future-demand-lens",
            cwds=["C:\\Users\\Tenormusica\\near-future-demand-lens"],
        )
        acc.user_messages.append("残タスクは？")
        work_message = (
            "対応済み。\n"
            "### 修正しました\n"
            "Cloudflare Access Service Token policy を追加しました。\n"
            "認証付きUI品質チェック pass。"
        )
        acc.assistant_messages.append(work_message)
        acc.timeline_messages.append(("user", "残タスクは？"))
        acc.timeline_messages.append(("assistant", work_message))
        for _ in range(10):
            user = "残タスクを進めて"
            assistant = (
                "現時点の残タスクはこの順です。\n"
                "- Cloudflare Access 再ログイン後の hosted 認証済み目視\n"
                "- README / docs の細部リンク確認"
            )
            acc.user_messages.append(user)
            acc.assistant_messages.append(assistant)
            acc.timeline_messages.append(("user", user))
            acc.timeline_messages.append(("assistant", assistant))

        summary = summarize_session(acc, datetime.fromisoformat("2026-05-09T10:05:00+09:00"))

        self.assertIsNotNone(summary)
        assert summary is not None
        self.assertEqual(summary["topic_key"], "near-future-demand-lens:near-future-ops")
        self.assertEqual(summary["topic_label"], "近未来予測レンズ運用改善")
        self.assertIn("Cloudflare Access", summary["current_goal"])
        self.assertNotIn("残タスク", summary["current_goal"])


if __name__ == "__main__":
    unittest.main()
