import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
THIS_RULES = ROOT / "codex_session_review" / "title_classification_rules.py"
OTHER_REPO_NAME = (
    "codex-session-kanban-demo-public"
    if ROOT.name == "openclaw-secretary"
    else "openclaw-secretary"
)
OTHER_RULES = ROOT.parent / OTHER_REPO_NAME / "codex_session_review" / "title_classification_rules.py"


class TitleClassificationRulesSyncTest(unittest.TestCase):
    def test_shared_title_classification_rules_are_identical_across_local_repos(self):
        if not OTHER_RULES.exists():
            self.skipTest(f"other local repo not found: {OTHER_RULES}")

        this_text = THIS_RULES.read_text(encoding="utf-8").replace("\r\n", "\n")
        other_text = OTHER_RULES.read_text(encoding="utf-8").replace("\r\n", "\n")
        self.assertEqual(
            this_text,
            other_text,
            "title_classification_rules.py drifted; copy the canonical rules before changing title routing",
        )


if __name__ == "__main__":
    unittest.main()
