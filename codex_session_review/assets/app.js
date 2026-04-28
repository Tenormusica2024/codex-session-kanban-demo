const STORAGE_KEY = "codex-session-review:v1";
const LANGUAGE_KEY = "codex-session-review:language";
const STATUSES = [
  "Need Review",
  "Pending",
  "In Progress",
  "Blocked",
  "Done",
  "Dropped",
];
const ARCHIVE_STATUSES = new Set(["Done", "Dropped"]);
const ARCHIVE_PREVIEW_LIMIT = 5;

const I18N = {
  ja: {
    appTitle: "CodexセッションKanban",
    appLead:
      "直近の “短くない” Codex session を整理し、AI秘書が扱いやすいKanbanに変換します。人間が動かした状態は正として扱い、後段AI syncでは戻しません。",
    pillModeKey: "形式",
    pillModeValue: "静的HTML優先",
    pillStorageKey: "保存先",
    pillOpsKey: "運用",
    pillOpsValue: "AI優先 / 手動修正可",
    pillAccessKey: "用途",
    accessPersonal: "個人用・保護URL",
    accessDistribution: "配布用・fixture",
    guideAccessTitle: "URLの使い分け",
    guideAccessPersonal: "個人用: 実セッション入りのため、このpublic demoには含めない。",
    guideAccessDistribution: "配布用: sample fixtureだけで生成。公開前に -Distribution guard を通し、個人セッション・ローカルパス・bypass token を混ぜない。",
    guideButton: "使い方",
    guideTitle: "このKanbanの使い方",
    guideLead:
      "このボードは通常の開発Kanbanより、AI秘書のセッション整理に寄せています。左から「候補確認 → 待ち/保留 → 作業ループ → 障害 → 完了履歴」の順です。",
    guideNeedReview: "人間確認待ち。実働テスト後にUIや成果物を見て判断する段階もここ。",
    guidePending: "やる予定だが今は待ち・保留。タイミング待ち、情報待ち、後回し。",
    guideInProgress: "AI/人間どちらかが作業ループ中。AI駆動開発では、AIがレビューしながら直す段階もここ。",
    guideBlocked: "認証、外部環境、権限、ユーザー操作など明確な障害で進めない。",
    guideDone: "完了履歴。通常は折りたたみ、必要な時だけ見る。",
    guideNoteStatus: "判断目安: レビュー中 = 進行中 / レビュー待ち = 要確認。",
    guideNoteCandidates:
      "候補一覧は staging。`推奨列へ追加` か `要確認へ仮追加して選択` で初めてボードに固定され、固定済み候補は候補一覧から消えます。",
    guideNoteSchedule:
      "配布版は sample fixture だけから GitHub Actions で生成します。外部 LLM API や実セッションは使いません。",
    guideKeyboard:
      "ショートカット: j/k で選択移動、Alt+↑/↓ で同列順位変更、1-6 で状態変更、c でsession IDコピー。入力欄フォーカス中は無効。",
    statVisible: "表示中セッション",
    statOverrides: "手動固定",
    statAutoReady: "自動処理候補",
    statBlocked: "停止中",
    statClusters: "タスクまとまり",
    statRepos: "Repo数",
    majorClustersTitle: "大タスクのまとまり",
    majorClustersLead: "同じ大タスクっぽい session をまとめて見るための local heuristic",
    candidatesTitle: "Kanban 追加候補",
    candidatesLead: "直近 session から見えた大タスク / 中タスク候補",
    filterSearch: "検索",
    filterRepo: "Repo",
    filterStatus: "状態",
    filterCluster: "まとまり",
    filterAttention: "注目",
    searchPlaceholder: "repo / 依頼文 / 要約",
    allAttention: "すべて",
    attentionNeedsInput: "入力/操作待ち",
    attentionHasBlocker: "blockerあり",
    exportOverrides: "手動修正を出力",
    copyOverridesJson: "手動修正JSONをコピー",
    saveSyncJson: "同期用JSONを保存",
    exportEffectiveJson: "反映済みJSONを出力",
    copyAiSummary: "AI判断をコピー",
    copyClusterSummary: "まとまり要約をコピー",
    copyKanbanCandidates: "追加候補をコピー",
    copyEffectiveSummary: "反映済み要約をコピー",
    copyReviewSummary: "レビュー要約をコピー",
    importOverrides: "手動修正を読み込み",
    clearOverrides: "手動修正を全消去",
    overridePanelTitle: "手動修正の保存/復元",
    overridePanelBody:
      "状態変更・同列順位・メモは localStorage と export JSON に保存されます。AI同期は human override lock を戻さない前提です。",
    overridePanelCount: "保存中 {count} 件 / localStorage",
    detailEmpty: "カードを選ぶと、ここにセッション概要と手動レビュー操作が表示されます。",
    statusNeedReview: "要確認",
    statusPending: "保留",
    statusInProgress: "進行中",
    statusBlocked: "停止中",
    statusDone: "完了",
    statusDropped: "採用しない",
    allStatuses: "すべての状態",
    allRepos: "すべてのRepo",
    allClusters: "すべてのまとまり",
    visibleSessionEmpty: "表示できるセッションがありません",
    sessions: "セッション",
    fixedHidden: "固定済み {count} 件は候補一覧から非表示",
    noUnaddedCandidates: "未追加候補はありません（固定済み {count} 件は非表示）",
    noCandidates: "候補はまだありません",
    priority: "優先度",
    statusReason: "状態判断",
    nextAction: "次の一手",
    addRecommended: "推奨列へ追加",
    addNeedReview: "要確認へ仮追加して選択",
    show: "表示",
    collapse: "折りたたむ",
    archiveCollapsed: "{status} {count}件を折りたたみ中",
    archiveCollapsedBody: "{status}履歴は通常非表示。ドラッグでこの列へ移動は可能です。",
    archivePreview: "最新 {limit} 件のみ表示中 / 残り {count} 件はアーカイブ扱い",
    emptyColumn: "この列にはセッションがありません",
    move: "移動",
    unknownRepo: "repo不明",
    recent: "直近",
    needsReviewMode: "要確認",
    cluster: "まとまり",
    humanLock: "human lock",
    manualOrder: "手動順序",
    userCount: "U",
    assistantCount: "A",
    commandCount: "Cmd",
    score: "Score",
    rankUp: "同じ列で上へ",
    rankDown: "同じ列で下へ",
    buildMeta: "生成 {date} / {count} セッション",
    copySessionId: "session IDをコピー",
    moveStatus: "状態を変更",
    humanLockHint: "変更すると human override lock として保存",
    aiRecommendation: "AI判断",
    whyThisCard: "このカードの根拠",
    inferredIntent: "推定したタスク意図",
    evidence: "根拠",
    lineage: "前後関係",
    noLineage: "このカードでは代表セッションのみを表示中",
    sourceSessions: "元セッション",
    supersedes: "{count}件を代表表示中",
    mergedHint: "古い関連セッションはこのカードに集約",
    confidence: "確信度",
    taskCluster: "タスクまとまり",
    relatedSessions: "関連セッション",
    statusOwner: "状態の所有者",
    overrideLock: "override lock",
    orderLock: "order lock",
    deepReadSummary: "深読み要約",
    currentGoal: "現在ゴール",
    taskSummary: "タスク概要",
    deepReadMemo: "深読みメモ",
    latestMeaningfulChange: "直近の意味変化",
    blocker: "blocker",
    needsInput: "入力/操作待ち",
    manualReview: "手動レビュー",
    status: "状態",
    notes: "メモ",
    notesPlaceholder: "なぜ動かしたか、次に何をするか、AIが戻してはいけないこと",
    saveReview: "レビューを保存",
    resetOverride: "手動修正を解除",
    defaultPolicy:
      "default は AI recommendation。drag / status select した時だけ human override lock を入れ、後段 AI sync は status を戻さない。",
    firstUserRequest: "最初の依頼",
    recentUserMessages: "直近のユーザー発言",
    relatedSessionsTitle: "同じタスクまとまりの関連セッション",
    relatedTaskMap: "関連タスク",
    sameLineage: "同じ前後関係",
    sameProjectOtherTasks: "同じRepoの別タスク候補",
    representativeOnly: "このまとまりでは今のところこのセッションが代表です。",
    lastAssistantRecap: "最後のassistant要約",
    source: "Source",
    owner: "owner",
    on: "on",
    off: "off",
    true: "true",
    false: "false",
    copiedReviewSummary: "レビュー要約をコピーしました。",
    copiedAiSummary: "AI判断をコピーしました。",
    copiedClusterSummary: "まとまり要約をコピーしました。",
    copiedKanbanCandidates: "追加候補をコピーしました。",
    copiedEffectiveSummary: "反映済み要約をコピーしました。",
    copiedOverridesJson: "手動修正JSONをコピーしました。",
    savedSyncJson: "同期用JSONを保存しました。",
    downloadedSyncJson: "同期用JSONをダウンロードしました。`local_pack/base.overrides.json` として配置すると次回deployに反映されます。",
    copyFailed: "コピーに失敗しました: {message}",
    invalidJson: "JSONが不正です: {message}",
    noRepresentative: "この候補に対応する代表セッションが見つかりません。",
  },
  en: {
    appTitle: "Codex Session Kanban",
    appLead:
      "Turns recent non-trivial Codex sessions into an AI-secretary Kanban. Human moves are authoritative and later AI sync must not revert them.",
    pillModeKey: "mode",
    pillModeValue: "static-first",
    pillStorageKey: "storage",
    pillOpsKey: "ops",
    pillOpsValue: "auto-first / override-optional",
    pillAccessKey: "access",
    accessPersonal: "personal / protected",
    accessDistribution: "distribution / fixture",
    guideAccessTitle: "URL profiles",
    guideAccessPersonal: "Personal: contains real sessions and is intentionally not included in this public demo.",
    guideAccessDistribution: "Distribution: generated only from sample fixtures. Run the -Distribution guard before publishing so real sessions, local paths, and bypass tokens are not included.",
    guideButton: "Guide",
    guideTitle: "How to use this Kanban",
    guideLead:
      "This board is tuned for AI-secretary session triage rather than a normal development Kanban. The flow is review candidates, waiting/hold, work loop, blocked, and completion history.",
    guideNeedReview: "Waiting for human review. Use this after implementation/testing when the result should be checked.",
    guidePending: "Planned but on hold, waiting for timing, information, or later prioritization.",
    guideInProgress: "AI or human is actively working. In AI-driven development, review-and-fix loops also live here.",
    guideBlocked: "Cannot move because of auth, external environment, permissions, or required user action.",
    guideDone: "Completion history. Usually collapsed and opened only when needed.",
    guideNoteStatus: "Rule of thumb: reviewing while fixing = In Progress / waiting for review = Need Review.",
    guideNoteCandidates:
      "The candidate list is staging. A card is fixed to the board only after adding it to the recommended column or temporarily adding it to Need Review.",
    guideNoteSchedule:
      "The public demo is generated from sample fixtures by GitHub Actions. It uses no external LLM API and no real session logs.",
    guideKeyboard:
      "Shortcuts: j/k select next/previous, Alt+↑/↓ reorder within column, 1-6 move status, c copy session ID. Disabled while typing in inputs.",
    statVisible: "Visible sessions",
    statOverrides: "Human overrides",
    statAutoReady: "Auto-ready",
    statBlocked: "Blocked",
    statClusters: "Task clusters",
    statRepos: "Repos",
    majorClustersTitle: "Major task clusters",
    majorClustersLead: "Local heuristic for grouping sessions that look like the same major task",
    candidatesTitle: "Kanban candidates",
    candidatesLead: "Major/mid task candidates found from recent sessions",
    filterSearch: "Search",
    filterRepo: "Repo",
    filterStatus: "Status",
    filterCluster: "Cluster",
    filterAttention: "Attention",
    searchPlaceholder: "repo / prompt / summary",
    allAttention: "All",
    attentionNeedsInput: "Needs input",
    attentionHasBlocker: "Has blocker",
    exportOverrides: "Export overrides",
    copyOverridesJson: "Copy overrides JSON",
    saveSyncJson: "Save sync JSON",
    exportEffectiveJson: "Export effective JSON",
    copyAiSummary: "Copy AI summary",
    copyClusterSummary: "Copy cluster summary",
    copyKanbanCandidates: "Copy candidates",
    copyEffectiveSummary: "Copy effective summary",
    copyReviewSummary: "Copy review summary",
    importOverrides: "Import overrides",
    clearOverrides: "Clear all overrides",
    overridePanelTitle: "Override backup / restore",
    overridePanelBody:
      "Status moves, rank changes, and notes are saved in localStorage and export JSON. AI sync must not revert human override locks.",
    overridePanelCount: "{count} saved overrides / localStorage",
    detailEmpty: "Select a card to see the session digest and manual review controls.",
    statusNeedReview: "Need Review",
    statusPending: "Pending",
    statusInProgress: "In Progress",
    statusBlocked: "Blocked",
    statusDone: "Done",
    statusDropped: "Dropped",
    allStatuses: "All statuses",
    allRepos: "All repos",
    allClusters: "All task clusters",
    visibleSessionEmpty: "No visible sessions",
    sessions: "sessions",
    fixedHidden: "{count} fixed candidates are hidden from the list",
    noUnaddedCandidates: "No unadded candidates ({count} fixed candidates hidden)",
    noCandidates: "No candidates yet",
    priority: "priority",
    statusReason: "Status reason",
    nextAction: "Next action",
    addRecommended: "Add to recommended column",
    addNeedReview: "Add to Need Review and select",
    show: "Show",
    collapse: "Collapse",
    archiveCollapsed: "{status} {count} items collapsed",
    archiveCollapsedBody: "{status} history is hidden by default. Dragging into this column still works.",
    archivePreview: "Showing latest {limit} / {count} remaining items are archived",
    emptyColumn: "No sessions in this column",
    move: "Move",
    unknownRepo: "unknown repo",
    recent: "recent",
    needsReviewMode: "needs-review",
    cluster: "cluster",
    humanLock: "human lock",
    manualOrder: "manual order",
    userCount: "U",
    assistantCount: "A",
    commandCount: "Cmd",
    score: "Score",
    rankUp: "Move up in column",
    rankDown: "Move down in column",
    buildMeta: "built {date} / {count} sessions",
    copySessionId: "Copy session ID",
    moveStatus: "Move status",
    humanLockHint: "Changing this saves a human override lock",
    aiRecommendation: "AI recommendation",
    whyThisCard: "Why this card exists",
    inferredIntent: "Inferred task intent",
    evidence: "Evidence",
    lineage: "Lineage",
    noLineage: "Only the representative session is shown for this card",
    sourceSessions: "Source sessions",
    supersedes: "Represents {count} sessions",
    mergedHint: "Older related sessions are merged into this card",
    confidence: "confidence",
    taskCluster: "task cluster",
    relatedSessions: "related sessions",
    statusOwner: "status owner",
    overrideLock: "override lock",
    orderLock: "order lock",
    deepReadSummary: "Deep read summary",
    currentGoal: "Current goal",
    taskSummary: "Task summary",
    deepReadMemo: "Deep read memo",
    latestMeaningfulChange: "Latest meaningful change",
    blocker: "blocker",
    needsInput: "needs input",
    manualReview: "Manual review",
    status: "Status",
    notes: "Notes",
    notesPlaceholder: "Why you moved it, what to do next, what AI should not revert.",
    saveReview: "Save review",
    resetOverride: "Reset override",
    defaultPolicy:
      "Default is AI recommendation. Dragging or selecting status creates a human override lock; downstream AI sync must not revert status.",
    firstUserRequest: "First user request",
    recentUserMessages: "Recent user messages",
    relatedSessionsTitle: "Related sessions in the same task cluster",
    relatedTaskMap: "Related task map",
    sameLineage: "Same lineage",
    sameProjectOtherTasks: "Other tasks in the same repo",
    representativeOnly: "This session is currently the representative for this cluster.",
    lastAssistantRecap: "Last assistant recap",
    source: "Source",
    owner: "owner",
    on: "on",
    off: "off",
    true: "true",
    false: "false",
    copiedReviewSummary: "Review summary copied.",
    copiedAiSummary: "AI summary copied.",
    copiedClusterSummary: "Cluster summary copied.",
    copiedKanbanCandidates: "Kanban candidates copied.",
    copiedEffectiveSummary: "Effective summary copied.",
    copiedOverridesJson: "Overrides JSON copied.",
    savedSyncJson: "Sync JSON saved.",
    downloadedSyncJson: "Sync JSON downloaded. Place it as `local_pack/base.overrides.json` to include it in the next deploy.",
    copyFailed: "Copy failed: {message}",
    invalidJson: "Invalid JSON: {message}",
    noRepresentative: "No representative session found for this candidate.",
  },
};

const state = {
  boardData: null,
  sessions: [],
  overrides: {},
  search: "",
  repo: "all",
  status: "all",
  cluster: "all",
  attention: "all",
  selectedId: null,
  dragId: null,
  archiveExpanded: {},
  lang: localStorage.getItem(LANGUAGE_KEY) || "ja",
};

function t(key, vars = {}) {
  const table = I18N[state.lang] || I18N.ja;
  let value = table[key] ?? I18N.ja[key] ?? key;
  for (const [name, replacement] of Object.entries(vars)) {
    value = value.replaceAll(`{${name}}`, String(replacement));
  }
  return value;
}

function getAccessProfile() {
  const explicit = state.boardData?.surface_mode || state.boardData?.surfaceMode || "";
  const source = String(state.boardData?.source || "").toLowerCase();
  if (explicit === "distribution" || source.includes("fixture") || source.includes("sample")) {
    return "distribution";
  }
  return "personal";
}

function accessProfileLabel() {
  return getAccessProfile() === "distribution" ? t("accessDistribution") : t("accessPersonal");
}

function updateHeroMeta() {
  const buildMeta = document.getElementById("build-meta");
  if (buildMeta) {
    buildMeta.textContent = t("buildMeta", { date: state.boardData?.generated_at || "unknown", count: state.sessions.length });
  }
  const accessPill = document.getElementById("access-profile-pill");
  if (accessPill) {
    accessPill.innerHTML = `<strong>${escapeHtml(t("pillAccessKey"))}</strong> ${escapeHtml(accessProfileLabel())}`;
    accessPill.dataset.profile = getAccessProfile();
  }
}

function statusLabel(status) {
  return {
    "Need Review": t("statusNeedReview"),
    "Pending": t("statusPending"),
    "In Progress": t("statusInProgress"),
    "Blocked": t("statusBlocked"),
    "Done": t("statusDone"),
    "Dropped": t("statusDropped"),
  }[status] || status;
}

function hasJapanese(value) {
  return /[ぁ-んァ-ヶ一-龠]/.test(String(value || ""));
}

function titleCaseLabel(value) {
  return String(value || "task")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const EN_TASK_LABELS = {
  "AI秘書のkanban自動更新": "AI Secretary Kanban Automation",
  "kanban自動化": "Kanban Automation",
  "B2Bポートフォリオの販路拡大": "B2B Portfolio Sales Channel Expansion",
  "B2Bポートフォリオのページ内容・図解改善": "B2B Portfolio Page and Diagram Improvements",
  "B2BポートフォリオのAI組み込み開発ページ改善": "B2B Portfolio AI Development Page Improvements",
  "near-future-demand-lensの需要・マネタイズ指数設計": "Near Future Demand Lens Metric Design",
  "LinkedInオファー返信方針（副業案件含む）": "LinkedIn Offer Reply Policy",
  "project-dofティザーLP制作": "Project DOF Teaser LP Production",
  "ネットワーク不安定の原因調査": "Network Instability Investigation",
  "LLMWIKIクエリ報告メール重複抑止": "LLMWIKI Query Report Email Deduplication",
  "ブックマーク管理サイト / ピン留めrepo 見直し": "Bookmark Site and Pinned Repo Review",
  "転職・求人選別": "Job Search Candidate Triage",
  "タスク別送信者名": "Per-task Sender Name Handling",
  "private化": "Repository Privatization",
  "デプロイ": "Deployment",
  "ログイン・手続き": "Login / Procedure",
  "repoレビュー": "Repository Review",
  "UI表示修正": "UI Display Fixes",
  "llmwiki": "LLMWIKI Review",
};

function translateKnownLabel(value, fallback = "") {
  const raw = String(value || "").trim();
  if (!raw) return fallback;
  if (!hasJapanese(raw)) return raw;
  if (EN_TASK_LABELS[raw]) return EN_TASK_LABELS[raw];
  for (const [ja, en] of Object.entries(EN_TASK_LABELS)) {
    if (raw.includes(ja)) return en;
  }
  return fallback || "Session Task";
}

function displayClusterLabel(value) {
  if (state.lang === "ja") return value || "misc";
  return titleCaseLabel(translateKnownLabel(value, value || "misc"));
}

function displayTaskTitle(item) {
  const raw = item?.title_ja || item?.title || item?.cluster_label || item?.task_cluster_label || item?.task_cluster_family || "task";
  if (state.lang === "ja") return raw;
  if (item?.title_en) return item.title_en;
  const cluster = item?.cluster_label || item?.task_cluster_label;
  const fallback = cluster && !hasJapanese(cluster) ? titleCaseLabel(cluster) : titleCaseLabel(item?.primary_repo || "Session Task");
  return translateKnownLabel(raw, fallback);
}

function displayTaskSummary(item) {
  const raw = item?.task_body_summary || item?.summary || item?.["理由"] || "";
  if (state.lang === "en" && (item?.task_body_summary_en || item?.summary_en)) {
    return item.task_body_summary_en || item.summary_en;
  }
  if (state.lang === "ja" || !hasJapanese(raw)) return raw;
  const title = displayTaskTitle(item);
  const repo = item?.primary_repo || item?.primary_repos?.[0];
  const repoText = repo ? ` in ${repo}` : "";
  return `${title}${repoText}. Review the current state, remaining decisions, blockers, and next action.`;
}

function displayReason(item) {
  const raw = item?.["状態判断理由"] || item?.suggested_reason || item?.["理由"] || "";
  if (state.lang === "en" && (item?.suggested_reason_en || item?.reason_en)) {
    return item.suggested_reason_en || item.reason_en;
  }
  if (state.lang === "ja" || !hasJapanese(raw)) return raw;
  const status = item?.["推奨列"] || item?.suggested_status || item?.currentStatus || "Need Review";
  return `Recommended status: ${statusLabel(status)}. Needs human review if completion or blocker evidence is not explicit.`;
}

function attentionSignals(item) {
  const texts = [
    item?.blocker,
    item?.blocker_en,
    item?.suggested_reason,
    item?.suggested_reason_en,
    item?.latest_meaningful_change,
    item?.latest_meaningful_change_en,
    item?.summary,
    item?.task_body_summary,
    item?.first_user_message,
    item?.last_assistant_message,
    ...(item?.evidence_messages || []),
  ]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();
  const blocker = String(item?.blocker || item?.blocker_en || "").trim().toLowerCase();
  const hasBlocker = Boolean(blocker && !["none", "n/a", "なし", "無し", "特になし"].includes(blocker));
  const needsInput =
    hasBlocker ||
    /login|auth|credential|permission|token|secret|manual action|user action|needs input|user input|approval|consent|browser|deploy|vercel|github pages|billing|budget|rate limit|quota/.test(texts) ||
    /ログイン|認証|権限|資格情報|credential|token|手動|ユーザー操作|確認が必要|判断が必要|同意|利用規約|ブラウザ|デプロイ|予算|制限/.test(texts);
  return { needsInput, hasBlocker };
}

function displayNextAction(item) {
  const raw = item?.["次の一手"] || "";
  if (state.lang === "en" && (item?.next_action_en || item?.["next_action_en"])) {
    return item.next_action_en || item["next_action_en"];
  }
  if (state.lang === "ja" || !hasJapanese(raw)) return raw;
  return "Confirm the latest session state, then either continue work, move to review, or mark as done.";
}

function displayTaskSize(value) {
  if (state.lang === "ja") return value || "中タスク";
  return { "大タスク": "Major task", "中タスク": "Mid task", "小タスク": "Small task" }[value] || "Mid task";
}

function displayOriginalText(value, fallback = "Original source text is Japanese; switch to 日本語 to read it.", enValue = null) {
  if (state.lang === "en" && enValue) return enValue;
  if (state.lang === "ja" || !hasJapanese(value)) return value || "n/a";
  return fallback;
}

function displayEvidenceMessages(session) {
  if (state.lang === "en" && Array.isArray(session.evidence_messages_en)) {
    return session.evidence_messages_en;
  }
  return session.evidence_messages || [];
}

function buildCardRationale(session, relatedSessions = []) {
  const evidence = displayEvidenceMessages(session).filter(Boolean).slice(0, 3);
  const relatedCount = Math.max(Number(session.related_session_count || 1), relatedSessions.length + 1);
  const relatedTitles = relatedSessions.slice(0, 4).map((item) => displayTaskTitle(item));
  const lineageParts = [];
  if (relatedCount > 1) {
    lineageParts.push(
      state.lang === "ja"
        ? `${relatedCount}件の関連セッションを代表カードに集約`
        : `${relatedCount} related sessions are represented by this card`
    );
  }
  if (relatedTitles.length) {
    lineageParts.push(`${t("sourceSessions")}: ${relatedTitles.join(" / ")}`);
  }
  if (session.clusterCard) {
    lineageParts.push(
      state.lang === "ja"
        ? "task cluster から生成された代表カード"
        : "representative card generated from a task cluster"
    );
  }
  if (session.overrideLock) {
    lineageParts.push(
      state.lang === "ja"
        ? "human override lock により状態は手動判断を優先"
        : "status follows the human override lock"
    );
  }
  return {
    intent: displayTaskSummary(session) || displayOriginalText(session.current_goal || "", displayTaskTitle(session), session.current_goal_en),
    evidence,
    lineage: lineageParts.length ? lineageParts : [t("noLineage")],
  };
}

function lineageInfo(session, relatedSessions = []) {
  const relatedCount = Math.max(Number(session.related_session_count || 1), relatedSessions.length + 1);
  const hasMerged = relatedCount > 1 || (session.related_session_ids || []).length > 1;
  const latestRelated = relatedSessions
    .slice()
    .sort((a, b) => new Date(b.end_at || b.start_at || 0) - new Date(a.end_at || a.start_at || 0))[0];
  return {
    hasMerged,
    relatedCount,
    latestRelated,
    badge: hasMerged ? t("supersedes", { count: relatedCount }) : "",
    hint: hasMerged ? t("mergedHint") : t("noLineage"),
  };
}

function relatedTaskMap(session, displaySessions) {
  const family = session.task_cluster_family || session.task_cluster_label;
  const sameLineage = displaySessions
    .filter((item) => item.session_id !== session.session_id)
    .filter((item) => (item.task_cluster_family || item.task_cluster_label) === family)
    .slice(0, 5);
  const sameRepoOtherTasks = displaySessions
    .filter((item) => item.session_id !== session.session_id)
    .filter((item) => item.primary_repo && item.primary_repo === session.primary_repo)
    .filter((item) => (item.task_cluster_family || item.task_cluster_label) !== family)
    .slice(0, 5);
  return { sameLineage, sameRepoOtherTasks };
}

function localizeAutonomyMode(value) {
  if (!value) return t("needsReviewMode");
  if (state.lang !== "ja") return value;
  return {
    "needs-review": "要確認",
    "auto-suggest": "AI提案",
    "auto-ready": "自動処理候補",
  }[value] || value;
}

function applyStaticI18n() {
  document.documentElement.lang = state.lang;
  document.title = t("appTitle");
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    node.setAttribute("placeholder", t(node.dataset.i18nPlaceholder));
  });
  document.querySelectorAll("[data-lang-option]").forEach((button) => {
    button.classList.toggle("active", button.dataset.langOption === state.lang);
    button.setAttribute("aria-pressed", String(button.dataset.langOption === state.lang));
  });
}

function loadBootstrap() {
  const raw = document.getElementById("bootstrap-data")?.textContent ?? "{}";
  return JSON.parse(raw);
}

function loadOverrides() {
  try {
    const local = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const embedded = state.boardData?.initial_overrides || {};
    if (!localStorage.getItem(STORAGE_KEY) && Object.keys(embedded).length) {
      return embedded;
    }
    return { ...embedded, ...local };
  } catch {
    return {};
  }
}

function saveOverrides() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.overrides, null, 2));
}

function getMergedSessions() {
  return state.sessions.map((session, sourceIndex) => {
    const override = state.overrides[session.session_id] || {};
    const manualStatus = override.status === "Inbox" ? "Need Review" : override.status;
    const manualRank =
      Number.isFinite(Number(override.manual_rank)) ? Number(override.manual_rank) : null;
    const statusOwner = manualStatus ? "human" : "ai";
    const overrideLock = Boolean(manualStatus);
    const orderLock = manualRank !== null || Boolean(override.order_lock);
    return {
      ...session,
      sourceIndex,
      currentStatus: manualStatus || session.suggested_status || "Need Review",
      manualRank,
      reviewNotes: override.notes || "",
      touchedAt: override.touched_at || null,
      statusOwner,
      overrideLock,
      orderLock,
      hasOverride: Boolean(manualStatus || override.notes || orderLock),
    };
  });
}

function compareSessionsWithinColumn(a, b) {
  if (a.manualRank !== null || b.manualRank !== null) {
    if (a.manualRank === null) return 1;
    if (b.manualRank === null) return -1;
    if (a.manualRank !== b.manualRank) return a.manualRank - b.manualRank;
  }
  return (a.sourceIndex || 0) - (b.sourceIndex || 0);
}

function getDisplaySessions() {
  const merged = getMergedSessions();
  const selected = new Set();
  const representatives = [];
  const clusterPriority = new Map();
  const taskByClusterKey = new Map();
  const taskByClusterLabel = new Map();
  for (const task of state.boardData?.suggested_tasks || []) {
    const key = task.cluster_key || task.cluster_label;
    if (key && !clusterPriority.has(key)) {
      clusterPriority.set(key, Number(task.priority_score || 0));
      taskByClusterKey.set(key, task);
    }
    if (task.cluster_label && !taskByClusterLabel.has(task.cluster_label)) {
      taskByClusterLabel.set(task.cluster_label, task);
    }
  }
  const clusterRows = (state.boardData?.task_clusters || []).slice().sort((a, b) => {
    const aPriority = clusterPriority.get(a.cluster_key) ?? clusterPriority.get(a.cluster_label) ?? 0;
    const bPriority = clusterPriority.get(b.cluster_key) ?? clusterPriority.get(b.cluster_label) ?? 0;
    return bPriority - aPriority || new Date(b.latest_end_at || 0) - new Date(a.latest_end_at || 0);
  });
  for (const cluster of clusterRows) {
    const ids = cluster.session_ids || [];
    if (!ids.length) continue;
    const candidates = ids.map((id) => merged.find((item) => item.session_id === id)).filter(Boolean);
    if (!candidates.length) continue;
    const representative = candidates
      .slice()
      .sort((a, b) => {
        if (a.overrideLock !== b.overrideLock) return a.overrideLock ? -1 : 1;
        if (a.orderLock !== b.orderLock) return a.orderLock ? -1 : 1;
        return new Date(b.end_at || b.start_at || 0) - new Date(a.end_at || a.start_at || 0);
      })[0];
    const task = taskByClusterKey.get(cluster.cluster_key) || taskByClusterLabel.get(cluster.cluster_label);
    const isAcceptedCandidate = Boolean(state.overrides[representative.session_id]?.status);
    if (task && !isAcceptedCandidate) {
      // suggested_tasks は Kanban 追加候補の staging list として扱う。
      // 未追加候補まで board に自動表示すると「候補」と「追加済み」が二重化するため、
      // human が追加操作をしたものだけ board 側に出す。
      continue;
    }
    const clusterStatus = representative.overrideLock
      ? representative.currentStatus
      : cluster.ai_column || task?.["推奨列"] || representative.currentStatus;
    selected.add(representative.session_id);
      representatives.push({
      ...representative,
      title: task?.title_ja || cluster.latest_title || representative.title,
      currentStatus: clusterStatus,
      suggested_status: cluster.ai_column || representative.suggested_status,
      suggested_reason: cluster.ai_reason || task?.["状態判断理由"] || representative.suggested_reason,
      task_cluster_family: cluster.cluster_label || representative.task_cluster_family,
      related_session_count: cluster.session_count || representative.related_session_count,
      related_session_ids: cluster.session_ids || representative.related_session_ids,
      clusterCard: true,
    });
  }
  for (const session of merged) {
    if (!session.lineage_key && !session.topic_key && !selected.has(session.session_id)) {
      selected.add(session.session_id);
      representatives.push(session);
    }
  }
  return representatives;
}

function getVisibleSessions() {
  const search = state.search.trim().toLowerCase();
  return getDisplaySessions().filter((session) => {
    if (state.repo !== "all" && session.primary_repo !== state.repo) return false;
    if (state.status !== "all" && session.currentStatus !== state.status) return false;
    if (state.cluster !== "all" && (session.task_cluster_family || session.task_cluster_label) !== state.cluster) return false;
    if (state.attention !== "all") {
      const signals = attentionSignals(session);
      if (state.attention === "needs-input" && !signals.needsInput) return false;
      if (state.attention === "has-blocker" && !signals.hasBlocker) return false;
    }
    if (!search) return true;
    const relatedSessions = (session.related_session_ids || [])
      .map((id) => state.sessions.find((item) => item.session_id === id))
      .filter(Boolean);
    const haystack = [
      session.title,
      session.title_ja,
      session.title_en,
      session.summary,
      session.summary_en,
      session.task_body_summary,
      session.task_body_summary_en,
      session.primary_repo,
      session.session_id,
      session.source_file,
      session.current_goal,
      session.current_goal_en,
      session.deep_summary,
      session.deep_summary_en,
      session.latest_meaningful_change,
      session.latest_meaningful_change_en,
      session.blocker,
      session.blocker_en,
      session.suggested_reason,
      session.suggested_reason_en,
      session.task_cluster_key,
      session.task_cluster_label,
      session.task_cluster_family,
      session.first_user_message,
      session.first_user_message_en,
      session.last_assistant_message,
      session.last_assistant_message_en,
      ...(session.evidence_messages || []),
      ...(session.evidence_messages_en || []),
      ...relatedSessions.flatMap((item) => [
        item.title,
        item.title_ja,
        item.summary,
        item.task_body_summary,
        item.session_id,
        item.first_user_message,
        item.latest_meaningful_change,
        ...(item.evidence_messages || []),
      ]),
    ]
      .filter(Boolean)
      .join("\n")
      .toLowerCase();
    return haystack.includes(search);
  });
}

function updateOverviewStats(visible) {
  const total = visible.length;
  const overridden = visible.filter((item) => item.hasOverride).length;
  const storedOverrides = Object.keys(state.overrides || {}).length;
  const autoReady = visible.filter((item) => item.autonomy_mode === "auto-ready").length;
  const blocked = visible.filter((item) => item.currentStatus === "Blocked").length;
  const repos = new Set(visible.map((item) => item.primary_repo).filter(Boolean)).size;
  const clusters = new Set(visible.map((item) => item.task_cluster_key).filter(Boolean)).size;

  document.getElementById("stat-total").textContent = String(total);
  document.getElementById("stat-overridden").textContent = String(overridden);
  document.getElementById("stat-auto-ready").textContent = String(autoReady);
  document.getElementById("stat-blocked").textContent = String(blocked);
  document.getElementById("stat-clusters").textContent = String(clusters);
  document.getElementById("stat-repos").textContent = String(repos);
  const overrideCount = document.getElementById("override-storage-count");
  if (overrideCount) {
    overrideCount.textContent = t("overridePanelCount", { count: storedOverrides });
  }
}

function renderStatusFilter() {
  const select = document.getElementById("status-filter");
  select.innerHTML = `<option value="all">${escapeHtml(t("allStatuses"))}</option>${STATUSES.map(
    (status) => `<option value="${escapeHtml(status)}">${escapeHtml(statusLabel(status))}</option>`
  ).join("")}`;
  select.value = state.status;
}

function renderRepoFilter() {
  const repos = [...new Set(state.sessions.map((item) => item.primary_repo).filter(Boolean))].sort();
  const select = document.getElementById("repo-filter");
  select.innerHTML = `<option value="all">${escapeHtml(t("allRepos"))}</option>${repos
    .map((repo) => `<option value="${escapeHtml(repo)}">${escapeHtml(repo)}</option>`)
    .join("")}`;
  select.value = state.repo;
}

function renderClusterFilter() {
  const clusters = (state.boardData?.task_clusters || []).slice();
  const select = document.getElementById("cluster-filter");
  select.innerHTML = `<option value="all">${escapeHtml(t("allClusters"))}</option>${clusters
    .map(
      (cluster) =>
        `<option value="${escapeHtml(cluster.cluster_label)}">${escapeHtml(
          cluster.cluster_label || "misc"
        )} (${cluster.session_count})</option>`
    )
    .join("")}`;
  select.value = state.cluster;
}

function renderAttentionFilter() {
  const select = document.getElementById("attention-filter");
  if (!select) return;
  select.innerHTML = `
    <option value="all">${escapeHtml(t("allAttention"))}</option>
    <option value="needs-input">${escapeHtml(t("attentionNeedsInput"))}</option>
    <option value="has-blocker">${escapeHtml(t("attentionHasBlocker"))}</option>
  `;
  select.value = state.attention;
}

function renderClusterStrip(visible) {
  const host = document.getElementById("cluster-list");
  const counts = new Map();
  const minorClusterLabels = new Set([
    "grok4cic運用",
    "private化",
    "デプロイ",
    "UI表示修正",
    "ログイン・手続き",
    "repoレビュー",
  ]);
  visible.forEach((session) => {
    const key = session.task_cluster_key || "misc";
    const family = session.task_cluster_family || session.task_cluster_label || key;
    const row = counts.get(family) || {
      cluster_key: family,
      cluster_label: family,
      count: 0,
      repos: new Set(),
      dominantStatus: session.currentStatus,
    };
    row.count += 1;
    row.repos.add(session.primary_repo || "unknown");
    counts.set(family, row);
  });
  const rows = [...counts.values()]
    .filter((row) => row.count >= 2 || !minorClusterLabels.has(row.cluster_label))
    .sort((a, b) => b.count - a.count || a.cluster_label.localeCompare(b.cluster_label));
  host.innerHTML = "";
  if (!rows.length) {
    host.innerHTML = `<span class="small">${escapeHtml(t("visibleSessionEmpty"))}</span>`;
    return;
  }
  rows.slice(0, 8).forEach((cluster) => {
    const button = document.createElement("button");
    button.className = `cluster-chip${state.cluster === cluster.cluster_key ? " active" : ""}`;
    button.innerHTML = `
      <span class="cluster-chip-label">${escapeHtml(displayClusterLabel(cluster.cluster_label))}</span>
      <span class="cluster-chip-meta">${cluster.count} ${escapeHtml(t("sessions"))} / ${escapeHtml([...cluster.repos].join(', '))}</span>
    `;
    button.addEventListener("click", () => {
      state.cluster = state.cluster === cluster.cluster_key ? "all" : cluster.cluster_key;
      renderClusterFilter();
      renderBoard();
      renderDetail();
    });
    host.appendChild(button);
  });
}

function findClusterForTask(task) {
  const key = task.cluster_key || task.cluster_label;
  return (state.boardData?.task_clusters || []).find(
    (cluster) =>
      (key && cluster.cluster_key === key) ||
      (task.cluster_label && cluster.cluster_label === task.cluster_label)
  );
}

function findRepresentativeForTask(task) {
  const cluster = findClusterForTask(task);
  const merged = getMergedSessions();
  if (cluster?.session_ids?.length) {
    const candidates = cluster.session_ids.map((id) => merged.find((item) => item.session_id === id)).filter(Boolean);
    if (candidates.length) {
      return candidates
        .slice()
        .sort((a, b) => {
          if (a.overrideLock !== b.overrideLock) return a.overrideLock ? -1 : 1;
          if (a.orderLock !== b.orderLock) return a.orderLock ? -1 : 1;
          return new Date(b.end_at || b.start_at || 0) - new Date(a.end_at || a.start_at || 0);
        })[0];
    }
  }
  return merged.find(
    (session) =>
      (task.cluster_key && (session.lineage_key || session.topic_key) === task.cluster_key) ||
      (task.cluster_label && (session.task_cluster_family || session.task_cluster_label) === task.cluster_label)
  );
}

function revealBoardSession(sessionId) {
  state.selectedId = sessionId;
  state.status = "all";
  state.cluster = "all";
  state.repo = "all";
  state.search = "";
  renderRepoFilter();
  renderStatusFilter();
  renderClusterFilter();
  renderAttentionFilter();
  renderCandidateStrip();
  renderBoard();
  renderDetail();
  requestAnimationFrame(() => {
    document.querySelector(`[data-session-id="${CSS.escape(sessionId)}"]`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  });
}

function focusCandidateTask(task) {
  const representative = findRepresentativeForTask(task);
  if (!representative) {
    alert(t("noRepresentative"));
    return;
  }
  if (!state.overrides[representative.session_id]?.status) {
    setOverride(representative.session_id, {
      status: "Need Review",
      notes:
        representative.reviewNotes ||
        `Added from Kanban candidates: ${displayTaskTitle(task)} -> ${statusLabel("Need Review")}.`,
    });
  }
  revealBoardSession(representative.session_id);
}

function addCandidateTask(task) {
  const representative = findRepresentativeForTask(task);
  if (!representative) {
    alert(t("noRepresentative"));
    return;
  }
  const targetStatus = task["推奨列"] || representative.suggested_status || "Need Review";
  setOverride(representative.session_id, {
    status: targetStatus,
    notes:
      representative.reviewNotes ||
      `Added from Kanban candidates: ${displayTaskTitle(task)} -> ${statusLabel(targetStatus)}.`,
  });
  revealBoardSession(representative.session_id);
}

function renderCandidateStrip() {
  const host = document.getElementById("candidate-list");
  const allCandidates = state.boardData?.suggested_tasks || [];
  const openCandidates = allCandidates.filter((task) => {
    const representative = findRepresentativeForTask(task);
    return !(representative && state.overrides[representative.session_id]?.status);
  });
  const hiddenCount = allCandidates.length - openCandidates.length;
  const candidates = openCandidates.slice(0, 8);
  host.innerHTML = "";
  if (!candidates.length) {
    host.innerHTML = `<span class="small">${
      hiddenCount ? escapeHtml(t("noUnaddedCandidates", { count: hiddenCount })) : escapeHtml(t("noCandidates"))
    }</span>`;
    return;
  }
  if (hiddenCount) {
    const note = document.createElement("div");
    note.className = "candidate-filter-note";
    note.textContent = t("fixedHidden", { count: hiddenCount });
    host.appendChild(note);
  }
  candidates.forEach((task) => {
    const representative = findRepresentativeForTask(task);
    const targetStatus = task["推奨列"] || "Need Review";
    const card = document.createElement("article");
    card.className = "candidate-card";
    card.tabIndex = 0;
    card.innerHTML = `
      <div class="card-tags">
        <span class="tag">${escapeHtml(displayTaskSize(task.task_size_ja))}</span>
        <span class="tag">${escapeHtml(statusLabel(targetStatus))}</span>
        <span class="tag">${escapeHtml(t("priority"))} ${escapeHtml(task.priority_score ?? "")}</span>
      </div>
      <h3>${escapeHtml(displayTaskTitle(task))}</h3>
      <p>${escapeHtml(displayTaskSummary(task))}</p>
      <p class="small candidate-next">${escapeHtml(t("statusReason"))}: ${escapeHtml(displayReason(task))}</p>
      <p class="small candidate-next">${escapeHtml(t("nextAction"))}: ${escapeHtml(displayNextAction(task))}</p>
      <div class="candidate-actions">
        <button class="candidate-add" data-candidate-action="add">${escapeHtml(t("addRecommended"))}</button>
        <button class="secondary candidate-view" data-candidate-action="view">${escapeHtml(t("addNeedReview"))}</button>
      </div>
    `;
    card.addEventListener("click", () => {
      focusCandidateTask(task);
    });
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        focusCandidateTask(task);
      }
    });
    card.querySelectorAll("[data-candidate-action]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (button.dataset.candidateAction === "add") {
          addCandidateTask(task);
        } else {
          focusCandidateTask(task);
        }
      });
    });
    host.appendChild(card);
  });
}

function getVisibleClusters() {
  const visible = getVisibleSessions();
  const groups = new Map();
  visible.forEach((session) => {
    const key = session.task_cluster_key || "misc";
    const row = groups.get(key) || {
      cluster_key: session.task_cluster_family || session.task_cluster_label || key,
      cluster_label: session.task_cluster_family || session.task_cluster_label || "misc",
      primary_repos: new Set(),
      session_count: 0,
      status_counts: {},
      representative_titles: [],
      max_confidence: 0,
    };
    row.session_count += 1;
    row.primary_repos.add(session.primary_repo || "unknown");
    row.status_counts[session.currentStatus] = (row.status_counts[session.currentStatus] || 0) + 1;
    row.max_confidence = Math.max(row.max_confidence, session.suggested_confidence || 0);
    if (!row.representative_titles.includes(session.title) && row.representative_titles.length < 3) {
      row.representative_titles.push(session.title);
    }
    groups.set(row.cluster_key, row);
  });
  return [...groups.values()]
    .map((cluster) => ({
      ...cluster,
      dominant_status:
        Object.entries(cluster.status_counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Need Review",
    }))
    .sort((a, b) => b.session_count - a.session_count || b.max_confidence - a.max_confidence);
}

function renderBoard() {
  const visible = getVisibleSessions();
  updateOverviewStats(visible);
  renderClusterStrip(visible);
  const grouped = Object.fromEntries(STATUSES.map((status) => [status, []]));
  visible.forEach((session) => grouped[session.currentStatus]?.push(session));
  STATUSES.forEach((status) => grouped[status].sort(compareSessionsWithinColumn));

  const board = document.getElementById("kanban-grid");
  board.innerHTML = "";

  STATUSES.forEach((status) => {
    const isArchive = ARCHIVE_STATUSES.has(status);
    const archiveExpanded = Boolean(state.archiveExpanded[status]);
    const isArchiveCollapsed = isArchive && !archiveExpanded;
    const columnSessions =
      isArchive && archiveExpanded ? grouped[status].slice(0, ARCHIVE_PREVIEW_LIMIT) : isArchiveCollapsed ? [] : grouped[status];
    const hiddenArchiveCount =
      isArchive && archiveExpanded ? Math.max(grouped[status].length - ARCHIVE_PREVIEW_LIMIT, 0) : grouped[status].length;
    const column = document.createElement("section");
    column.className = `kanban-column${isArchive ? " archive-column" : ""}${isArchiveCollapsed ? " collapsed" : ""}`;
    column.innerHTML = `
      <div class="column-header">
        <h2>${escapeHtml(statusLabel(status))}</h2>
        <div class="column-header-actions">
          ${isArchive ? `<button class="column-toggle" data-archive-toggle="${escapeHtml(status)}" type="button">${escapeHtml(archiveExpanded ? t("collapse") : t("show"))}</button>` : ""}
          <span class="count-chip">${grouped[status].length}</span>
        </div>
      </div>
      <div class="dropzone" data-status="${escapeHtml(status)}"></div>
    `;
    column.querySelector("[data-archive-toggle]")?.addEventListener("click", (event) => {
      event.preventDefault();
      const targetStatus = event.currentTarget.dataset.archiveToggle;
      state.archiveExpanded[targetStatus] = !state.archiveExpanded[targetStatus];
      renderBoard();
    });
    const dropzone = column.querySelector(".dropzone");
    attachDropzone(dropzone, status);

    if (isArchiveCollapsed && grouped[status].length) {
      const collapsed = document.createElement("div");
      collapsed.className = "collapsed-archive-state";
      collapsed.innerHTML = `
        <strong>${escapeHtml(t("archiveCollapsed", { status: statusLabel(status), count: grouped[status].length }))}</strong>
        <span>${escapeHtml(t("archiveCollapsedBody", { status: statusLabel(status) }))}</span>
      `;
      dropzone.appendChild(collapsed);
    }

    columnSessions.forEach((session) => {
      const cardLineage = lineageInfo(session);
      const card = document.createElement("article");
      card.className = `session-card${session.session_id === state.selectedId ? " selected" : ""}`;
      card.draggable = true;
      card.dataset.sessionId = session.session_id;
      card.innerHTML = `
        <div class="card-top-actions" aria-label="同列内の順位変更">
          <button class="rank-button" data-rank-move="-1" title="${escapeHtml(t("rankUp"))}">↑</button>
          <button class="rank-button" data-rank-move="1" title="${escapeHtml(t("rankDown"))}">↓</button>
        </div>
        <div class="card-tags">
          <span class="tag">${escapeHtml(session.primary_repo || t("unknownRepo"))}</span>
          <span class="tag">${escapeHtml(session.recency_label || t("recent"))}</span>
          <span class="tag ${escapeHtml(session.autonomy_mode || "")}">${escapeHtml(localizeAutonomyMode(session.autonomy_mode))}</span>
          ${session.clusterCard ? `<span class="tag">${escapeHtml(t("cluster"))}</span>` : ""}
          ${attentionSignals(session).needsInput ? `<span class="tag attention">${escapeHtml(t("needsInput"))}</span>` : ""}
          ${cardLineage.hasMerged ? `<span class="tag lineage">${escapeHtml(cardLineage.badge)}</span>` : ""}
          ${session.overrideLock ? `<span class="tag override">${escapeHtml(t("humanLock"))}</span>` : ""}
          ${session.orderLock ? `<span class="tag override">${escapeHtml(t("manualOrder"))}</span>` : ""}
        </div>
        <div class="card-cluster">${escapeHtml(displayClusterLabel(session.task_cluster_label || "misc"))} / ${session.related_session_count || 1} ${escapeHtml(t("sessions"))}</div>
        <h3>${escapeHtml(displayTaskTitle(session))}</h3>
        <p>${escapeHtml(displayTaskSummary(session))}</p>
        ${
          session.session_id === state.selectedId
            ? `<div class="inline-status-row">
                <span class="small">${escapeHtml(t("move"))}</span>
                <div class="status-segment" role="group" aria-label="${escapeHtml(t("moveStatus"))}">
                  ${STATUSES.map((option) => `<button type="button" class="status-segment-button${option === session.currentStatus ? " active" : ""}" data-card-status-value="${escapeHtml(option)}">${escapeHtml(shortStatusLabel(option))}</button>`).join("")}
                </div>
              </div>`
            : ""
        }
        <div class="card-meta">
          <span class="tag">${escapeHtml(statusLabel(session.suggested_status))} ${session.suggested_confidence || 0}%</span>
          <span class="tag">${escapeHtml(t("userCount"))} ${session.user_message_count}</span>
          <span class="tag">${escapeHtml(t("assistantCount"))} ${session.assistant_message_count}</span>
          <span class="tag">${escapeHtml(t("commandCount"))} ${session.command_count}</span>
          <span class="tag">${escapeHtml(t("score"))} ${session.activity_score}</span>
        </div>
      `;
      card.addEventListener("click", () => {
        state.selectedId = session.session_id;
        renderBoard();
        renderDetail();
      });
      card.addEventListener("dragstart", () => {
        state.dragId = session.session_id;
      });
      card.addEventListener("dragend", () => {
        state.dragId = null;
      });
      card.querySelectorAll("[data-rank-move]").forEach((button) => {
        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          moveSessionWithinColumn(session.session_id, Number(button.dataset.rankMove));
        });
      });
      card.querySelectorAll("[data-card-status-value]").forEach((button) => {
        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          setOverride(session.session_id, { status: button.dataset.cardStatusValue, notes: session.reviewNotes || "" });
          renderBoard();
          renderDetail();
        });
      });
      dropzone.appendChild(card);
    });

    if (isArchive && archiveExpanded && hiddenArchiveCount > 0) {
      const archive = document.createElement("div");
      archive.className = "archive-note";
      archive.textContent = t("archivePreview", { limit: ARCHIVE_PREVIEW_LIMIT, count: hiddenArchiveCount });
      dropzone.appendChild(archive);
    }

    if (!grouped[status].length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = t("emptyColumn");
      dropzone.appendChild(empty);
    }

    board.appendChild(column);
  });
}

function shortStatusLabel(status) {
  if (state.lang === "ja") {
    return {
      "Need Review": "確認",
      "In Progress": "進行",
      "Pending": "保留",
      "Blocked": "停止",
      "Done": "完了",
      "Dropped": "除外",
    }[status] || status;
  }
  return {
    "Need Review": "Review",
    "In Progress": "Doing",
    "Pending": "Wait",
    "Blocked": "Block",
    "Done": "Done",
    "Dropped": "Drop",
  }[status] || status;
}

function attachDropzone(dropzone, status) {
  dropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropzone.classList.add("drag-over");
  });
  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("drag-over");
  });
  dropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropzone.classList.remove("drag-over");
    if (!state.dragId) return;
    setOverride(state.dragId, { status });
    renderBoard();
    renderDetail();
  });
}

function persistColumnOrder(orderedSessionIds) {
  const touchedAt = new Date().toISOString();
  orderedSessionIds.forEach((sessionId, index) => {
    state.overrides[sessionId] = {
      ...state.overrides[sessionId],
      manual_rank: (index + 1) * 1000,
      order_owner: "human",
      order_lock: true,
      touched_at: touchedAt,
    };
  });
  saveOverrides();
}

function moveSessionWithinColumn(sessionId, direction) {
  const session = getMergedSessions().find((item) => item.session_id === sessionId);
  if (!session) return;
  const columnSessions = getVisibleSessions()
    .filter((item) => item.currentStatus === session.currentStatus)
    .sort(compareSessionsWithinColumn);
  const index = columnSessions.findIndex((item) => item.session_id === sessionId);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= columnSessions.length) return;
  const ordered = columnSessions.map((item) => item.session_id);
  [ordered[index], ordered[nextIndex]] = [ordered[nextIndex], ordered[index]];
  persistColumnOrder(ordered);
  state.selectedId = sessionId;
  renderBoard();
  renderDetail();
}

function selectAdjacentSession(direction) {
  const visible = getVisibleSessions();
  if (!visible.length) return;
  const ordered = STATUSES.flatMap((status) =>
    visible.filter((item) => item.currentStatus === status).sort(compareSessionsWithinColumn)
  );
  const currentIndex = ordered.findIndex((item) => item.session_id === state.selectedId);
  const nextIndex = currentIndex < 0 ? 0 : Math.max(0, Math.min(ordered.length - 1, currentIndex + direction));
  state.selectedId = ordered[nextIndex].session_id;
  renderBoard();
  renderDetail();
}

function setSelectedStatusByIndex(index) {
  const session = getMergedSessions().find((item) => item.session_id === state.selectedId);
  const status = STATUSES[index];
  if (!session || !status) return;
  setOverride(session.session_id, { status, notes: session.reviewNotes || "" });
  renderBoard();
  renderDetail();
}

function copySelectedSessionId() {
  const session = getMergedSessions().find((item) => item.session_id === state.selectedId);
  if (!session) return;
  navigator.clipboard?.writeText(session.session_id).catch(() => {});
}

function isTypingTarget(target) {
  const tag = String(target?.tagName || "").toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || Boolean(target?.isContentEditable);
}

function handleKeyboardTriage(event) {
  if (isTypingTarget(event.target) || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.altKey && event.key === "ArrowUp") {
    event.preventDefault();
    if (state.selectedId) moveSessionWithinColumn(state.selectedId, -1);
    return;
  }
  if (event.altKey && event.key === "ArrowDown") {
    event.preventDefault();
    if (state.selectedId) moveSessionWithinColumn(state.selectedId, 1);
    return;
  }
  if (event.altKey) return;
  if (event.key === "j") {
    event.preventDefault();
    selectAdjacentSession(1);
  } else if (event.key === "k") {
    event.preventDefault();
    selectAdjacentSession(-1);
  } else if (/^[1-6]$/.test(event.key)) {
    event.preventDefault();
    setSelectedStatusByIndex(Number(event.key) - 1);
  } else if (event.key.toLowerCase() === "c") {
    event.preventDefault();
    copySelectedSessionId();
  }
}

function renderDetail() {
  const panel = document.getElementById("detail-panel");
  const merged = getMergedSessions();
  const displaySessions = getDisplaySessions();
  const session = displaySessions.find((item) => item.session_id === state.selectedId) || merged.find((item) => item.session_id === state.selectedId);
  if (!session) {
    panel.innerHTML = `<p class="detail-empty">${escapeHtml(t("detailEmpty"))}</p>`;
    return;
  }
  const relatedSessions = merged
    .filter((item) => (item.task_cluster_family || item.task_cluster_label) === (session.task_cluster_family || session.task_cluster_label) && item.session_id !== session.session_id)
    .slice(0, 6);
  const rationale = buildCardRationale(session, relatedSessions);
  const detailLineage = lineageInfo(session, relatedSessions);
  const taskMap = relatedTaskMap(session, displaySessions);

  panel.innerHTML = `
    <h2>${escapeHtml(displayTaskTitle(session))}</h2>
    <div class="detail-meta">
      <span class="tag">${escapeHtml(session.primary_repo || t("unknownRepo"))}</span>
      <span class="tag">${escapeHtml(statusLabel(session.currentStatus))}</span>
      <span class="tag ${escapeHtml(session.autonomy_mode || "")}">${escapeHtml(localizeAutonomyMode(session.autonomy_mode))}</span>
      ${attentionSignals(session).needsInput ? `<span class="tag attention">${escapeHtml(t("needsInput"))}</span>` : ""}
      ${detailLineage.hasMerged ? `<span class="tag lineage">${escapeHtml(detailLineage.badge)}</span>` : ""}
      <span class="tag">${escapeHtml(session.statusOwner || "ai")} ${escapeHtml(t("owner"))}</span>
      <span class="tag">${escapeHtml(displayClusterLabel(session.task_cluster_family || session.task_cluster_label || "misc"))} / ${session.related_session_count || 1} ${escapeHtml(t("sessions"))}</span>
      <span class="tag mono">sid ${escapeHtml(shortSessionId(session.session_id))}</span>
      <span class="tag">${escapeHtml(session.start_at)}</span>
      ${session.overrideLock ? `<span class="tag override">${escapeHtml(t("humanLock"))}</span>` : ""}
      ${session.orderLock ? `<span class="tag override">${escapeHtml(t("manualOrder"))}</span>` : ""}
    </div>
    <div class="session-id-box">
      <div>
        <span class="small">session_id</span>
        <div class="mono">${escapeHtml(session.session_id)}</div>
      </div>
      <button class="secondary tiny" id="copy-session-id">${escapeHtml(t("copySessionId"))}</button>
    </div>
    <div class="quick-status-bar">
      <label>
        <span class="small">${escapeHtml(t("moveStatus"))}</span>
        <select id="quick-status">
          ${STATUSES.map((status) => `<option value="${escapeHtml(status)}"${status === session.currentStatus ? " selected" : ""}>${escapeHtml(statusLabel(status))}</option>`).join("")}
        </select>
      </label>
      <span class="small">${escapeHtml(t("humanLockHint"))}</span>
    </div>
    <p class="detail-summary">${escapeHtml(displayTaskSummary(session))}</p>

    <div class="detail-section">
      <h3>${escapeHtml(t("whyThisCard"))}</h3>
      <div class="reason-box rationale-box">
        <div><strong>${escapeHtml(t("inferredIntent"))}:</strong> ${escapeHtml(rationale.intent || "n/a")}</div>
        <div>
          <strong>${escapeHtml(t("evidence"))}:</strong>
          <ul>${rationale.evidence.map((item) => `<li>${escapeHtml(displayOriginalText(item))}</li>`).join("") || "<li>n/a</li>"}</ul>
        </div>
        <div>
          <strong>${escapeHtml(t("lineage"))}:</strong>
          <ul>${rationale.lineage.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          ${detailLineage.hasMerged ? `<p class="small">${escapeHtml(detailLineage.hint)}</p>` : ""}
        </div>
      </div>
    </div>

    <div class="detail-section">
      <h3>${escapeHtml(t("aiRecommendation"))}</h3>
      <div class="reason-box">
        <div><strong>${escapeHtml(statusLabel(session.suggested_status))}</strong> / ${escapeHtml(t("confidence"))} ${session.suggested_confidence || 0}%</div>
        <div>${escapeHtml(displayReason(session) || "n/a")}</div>
        <div class="small">${escapeHtml(t("taskCluster"))}: ${escapeHtml(displayClusterLabel(session.task_cluster_family || session.task_cluster_label || "misc"))} / ${escapeHtml(t("relatedSessions"))}: ${session.related_session_count || 1}</div>
        <div class="small">${escapeHtml(t("statusOwner"))}: ${escapeHtml(session.statusOwner || "ai")} / ${escapeHtml(t("overrideLock"))}: ${session.overrideLock ? t("on") : t("off")} / ${escapeHtml(t("orderLock"))}: ${session.orderLock ? t("on") : t("off")}</div>
      </div>
    </div>

    <div class="detail-section">
      <h3>${escapeHtml(t("deepReadSummary"))}</h3>
      <div class="reason-box">
        <div><strong>${escapeHtml(t("currentGoal"))}:</strong> ${escapeHtml(displayOriginalText(session.current_goal || "n/a", displayTaskTitle(session), session.current_goal_en))}</div>
        <div><strong>${escapeHtml(t("taskSummary"))}:</strong> ${escapeHtml(displayTaskSummary(session) || "n/a")}</div>
        <div><strong>${escapeHtml(t("deepReadMemo"))}:</strong> ${escapeHtml(displayOriginalText(session.deep_summary, undefined, session.deep_summary_en))}</div>
        <div><strong>${escapeHtml(t("latestMeaningfulChange"))}:</strong> ${escapeHtml(displayOriginalText(session.latest_meaningful_change, undefined, session.latest_meaningful_change_en))}</div>
        <div><strong>${escapeHtml(t("blocker"))}:</strong> ${escapeHtml(displayOriginalText(session.blocker || "none", "none", session.blocker_en))}</div>
        <div class="small">doneish=${session.doneish_signal ? t("true") : t("false")} / pendingish=${session.pendingish_signal ? t("true") : t("false")} / task_shift=${session.task_shift_signal ? t("true") : t("false")}</div>
      </div>
    </div>

    <div class="detail-section">
      <h3>${escapeHtml(t("manualReview"))}</h3>
      <div class="detail-controls">
        <label>
          ${escapeHtml(t("status"))}
          <select id="detail-status">
            ${STATUSES.map((status) => `<option value="${escapeHtml(status)}"${status === session.currentStatus ? " selected" : ""}>${escapeHtml(statusLabel(status))}</option>`).join("")}
          </select>
        </label>
        <label>
          ${escapeHtml(t("notes"))}
          <textarea id="detail-notes" rows="5" placeholder="${escapeHtml(t("notesPlaceholder"))}">${escapeHtml(session.reviewNotes || "")}</textarea>
        </label>
        <div class="toolbar-actions">
          <button id="save-review">${escapeHtml(t("saveReview"))}</button>
          <button class="secondary" id="reset-review">${escapeHtml(t("resetOverride"))}</button>
      </div>
        <p class="small">${escapeHtml(t("defaultPolicy"))}</p>
      </div>
    </div>

    <div class="detail-section">
      <h3>${escapeHtml(t("firstUserRequest"))}</h3>
      <p>${escapeHtml(displayOriginalText(session.first_user_message || "n/a", undefined, session.first_user_message_en))}</p>
    </div>

    <div class="detail-section">
      <h3>${escapeHtml(t("recentUserMessages"))}</h3>
      <ul>${displayEvidenceMessages(session).map((item) => `<li>${escapeHtml(displayOriginalText(item))}</li>`).join("") || "<li>n/a</li>"}</ul>
    </div>

    <div class="detail-section">
      <h3>${escapeHtml(t("relatedSessionsTitle"))}</h3>
      ${
        relatedSessions.length
          ? `<div class="related-session-list">${relatedSessions
              .map(
                (item) => `
                  <button class="related-session" data-related-id="${escapeHtml(item.session_id)}">
                    ${escapeHtml(displayTaskTitle(item))}
                    <small>${escapeHtml(statusLabel(item.currentStatus))} / ${escapeHtml(item.recency_label || t("recent"))}</small>
                  </button>`
              )
              .join("")}</div>`
          : `<p>${escapeHtml(t("representativeOnly"))}</p>`
      }
    </div>

    <div class="detail-section">
      <h3>${escapeHtml(t("relatedTaskMap"))}</h3>
      <div class="related-task-map">
        <div>
          <strong>${escapeHtml(t("sameLineage"))}</strong>
          ${
            taskMap.sameLineage.length
              ? `<div class="related-session-list">${taskMap.sameLineage
                  .map(
                    (item) => `
                      <button class="related-session" data-related-id="${escapeHtml(item.session_id)}">
                        ${escapeHtml(displayTaskTitle(item))}
                        <small>${escapeHtml(statusLabel(item.currentStatus))} / ${escapeHtml(displayClusterLabel(item.task_cluster_family || item.task_cluster_label || "misc"))}</small>
                      </button>`
                  )
                  .join("")}</div>`
              : `<p>${escapeHtml(t("noLineage"))}</p>`
          }
        </div>
        <div>
          <strong>${escapeHtml(t("sameProjectOtherTasks"))}</strong>
          ${
            taskMap.sameRepoOtherTasks.length
              ? `<div class="related-session-list">${taskMap.sameRepoOtherTasks
                  .map(
                    (item) => `
                      <button class="related-session" data-related-id="${escapeHtml(item.session_id)}">
                        ${escapeHtml(displayTaskTitle(item))}
                        <small>${escapeHtml(statusLabel(item.currentStatus))} / ${escapeHtml(displayClusterLabel(item.task_cluster_family || item.task_cluster_label || "misc"))}</small>
                      </button>`
                  )
                  .join("")}</div>`
              : `<p>${escapeHtml(t("representativeOnly"))}</p>`
          }
        </div>
      </div>
    </div>

    <div class="detail-section">
      <h3>${escapeHtml(t("lastAssistantRecap"))}</h3>
      <p>${escapeHtml(displayOriginalText(session.last_assistant_message || "n/a", undefined, session.last_assistant_message_en))}</p>
    </div>

    <div class="detail-section">
      <h3>${escapeHtml(t("source"))}</h3>
      <p class="mono">${escapeHtml(session.source_file || "n/a")}</p>
      <p class="small">session_id: <span class="mono">${escapeHtml(session.session_id)}</span></p>
    </div>
  `;

  document.getElementById("save-review").addEventListener("click", () => {
    const status = document.getElementById("detail-status").value;
    const notes = document.getElementById("detail-notes").value.trim();
    setOverride(session.session_id, { status, notes });
    renderBoard();
    renderDetail();
  });

  document.getElementById("reset-review").addEventListener("click", () => {
    delete state.overrides[session.session_id];
    saveOverrides();
    renderBoard();
    renderDetail();
  });

  document.getElementById("copy-session-id").addEventListener("click", () => {
    navigator.clipboard.writeText(session.session_id).catch((error) => alert(t("copyFailed", { message: error.message })));
  });

  document.getElementById("quick-status").addEventListener("change", (event) => {
    setOverride(session.session_id, { status: event.target.value, notes: session.reviewNotes || "" });
    renderBoard();
    renderDetail();
  });

  panel.querySelectorAll("[data-related-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedId = button.dataset.relatedId;
      renderBoard();
      renderDetail();
    });
  });
}

function shortSessionId(sessionId) {
  const value = String(sessionId || "");
  if (value.length <= 12) return value;
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

function setOverride(sessionId, patch) {
  const previous = state.overrides[sessionId] || {};
  const statusChanged = Boolean(patch && "status" in patch && patch.status !== previous.status);
  const next = {
    ...previous,
    ...patch,
    status_owner: "human",
    override_lock: Boolean((patch && "status" in patch ? patch.status : previous.status) || false),
    touched_at: new Date().toISOString(),
  };
  if (statusChanged) {
    delete next.manual_rank;
    delete next.order_owner;
    delete next.order_lock;
  }
  state.overrides[sessionId] = next;
  saveOverrides();
}

function exportOverrides() {
  const blob = new Blob([JSON.stringify(state.overrides, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "codex-session-review-overrides.json";
  a.click();
  URL.revokeObjectURL(url);
}

async function copyOverridesJson() {
  await navigator.clipboard.writeText(JSON.stringify(state.overrides, null, 2));
  alert(t("copiedOverridesJson"));
}

async function saveSyncJson() {
  const text = JSON.stringify(state.overrides, null, 2);
  if (window.showSaveFilePicker) {
    const handle = await window.showSaveFilePicker({
      suggestedName: "base.overrides.json",
      types: [
        {
          description: "Kanban overrides JSON",
          accept: { "application/json": [".json"] },
        },
      ],
    });
    const writable = await handle.createWritable();
    await writable.write(text);
    await writable.close();
    alert(t("savedSyncJson"));
    return;
  }
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "base.overrides.json";
  a.click();
  URL.revokeObjectURL(url);
  alert(t("downloadedSyncJson"));
}

function buildEffectiveState() {
  const sessions = getMergedSessions().map((item) => ({
    session_id: item.session_id,
    title: item.title,
    primary_repo: item.primary_repo,
    effective_status: item.currentStatus,
    status_owner: item.statusOwner,
    override_lock: item.overrideLock,
    order_lock: item.orderLock,
    manual_rank: item.manualRank,
    status_mutable: !item.overrideLock,
    order_mutable: !item.orderLock,
    suggested_status: item.suggested_status,
    suggested_confidence: item.suggested_confidence,
    autonomy_mode: item.autonomy_mode,
    suggested_reason: item.suggested_reason,
    task_cluster_key: item.task_cluster_key,
    task_cluster_label: item.task_cluster_label,
    task_cluster_family: item.task_cluster_family || item.task_cluster_label,
    related_session_count: item.related_session_count || 1,
    human_notes: item.reviewNotes || "",
    human_touched_at: item.touchedAt,
    source_file: item.source_file,
    start_at: item.start_at,
    summary: item.summary,
  }));

  const counts = {};
  for (const item of sessions) {
    counts[item.effective_status] = (counts[item.effective_status] || 0) + 1;
  }

  return {
    generated_at: new Date().toISOString(),
    mode: "effective-kanban-state",
    status_policy: {
      default_owner: "ai",
      human_override_rule:
        "if human moved a card, that status becomes authoritative and downstream AI sync must not revert it",
    },
    counts,
    sessions,
  };
}

function exportEffectiveJson() {
  const effectiveState = buildEffectiveState();
  const blob = new Blob([JSON.stringify(effectiveState, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "codex-session-effective-state.json";
  a.click();
  URL.revokeObjectURL(url);
}

async function copyReviewSummary() {
  const visible = getVisibleSessions();
  const overridden = visible.filter((item) => item.hasOverride);
  const counts = Object.fromEntries(STATUSES.map((status) => [status, 0]));
  visible.forEach((item) => {
    counts[item.currentStatus] += 1;
  });
  const lines = [
    "# Codex Session Review Summary",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Visible sessions: ${visible.length}`,
    `Human overrides: ${overridden.length}`,
    "",
    "## Status counts",
    ...STATUSES.map((status) => `- ${status}: ${counts[status]}`),
    "",
    "## Human overrides",
  ];
  if (!overridden.length) {
    lines.push("- none");
  } else {
    overridden.forEach((item) => {
      lines.push(`- [${item.currentStatus}] ${item.title} (${item.primary_repo || "unknown repo"})`);
      lines.push(`  - task_cluster: ${item.task_cluster_family || item.task_cluster_label || "misc"} (${item.related_session_count || 1} sessions)`);
      lines.push(`  - status_owner: ${item.statusOwner}`);
      lines.push(`  - override_lock: ${item.overrideLock ? "true" : "false"}`);
      lines.push(`  - order_lock: ${item.orderLock ? "true" : "false"}${item.manualRank !== null ? ` / manual_rank: ${item.manualRank}` : ""}`);
      if (item.reviewNotes) {
        lines.push(`  - notes: ${item.reviewNotes}`);
      }
    });
  }
  const text = lines.join("\n");
  await navigator.clipboard.writeText(text);
  alert(t("copiedReviewSummary"));
}

async function copyAiSummary() {
  const visible = getVisibleSessions();
  const lines = [
    "# Codex Session AI Summary",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Visible sessions: ${visible.length}`,
    "",
    "## AI recommendations",
  ];
  visible.forEach((item) => {
    lines.push(`- [${item.suggested_status} / ${item.suggested_confidence || 0}% / ${item.autonomy_mode}] ${item.title} (${item.primary_repo || "unknown repo"})`);
    lines.push(`  - task_cluster: ${item.task_cluster_family || item.task_cluster_label || "misc"} (${item.related_session_count || 1} sessions)`);
    lines.push(`  - reason: ${item.suggested_reason || "n/a"}`);
    lines.push(`  - effective_status_owner: ${item.statusOwner}`);
    lines.push(`  - effective_override_lock: ${item.overrideLock ? "true" : "false"}`);
    lines.push(`  - effective_order_lock: ${item.orderLock ? "true" : "false"}`);
  });
  await navigator.clipboard.writeText(lines.join("\n"));
  alert(t("copiedAiSummary"));
}

async function copyClusterSummary() {
  const clusters = getVisibleClusters();
  const lines = [
    "# Codex Session Task Clusters",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Visible clusters: ${clusters.length}`,
    `Visible sessions: ${getVisibleSessions().length}`,
    "",
    "## Major clusters",
  ];
  if (!clusters.length) {
    lines.push("- none");
  } else {
    clusters.forEach((cluster) => {
      lines.push(`- [${cluster.dominant_status}] ${cluster.cluster_label} (${cluster.session_count} sessions / ${[...cluster.primary_repos].join(', ')})`);
      cluster.representative_titles.forEach((title) => {
        lines.push(`  - ${title}`);
      });
    });
  }
  await navigator.clipboard.writeText(lines.join("\n"));
  alert(t("copiedClusterSummary"));
}

async function copyKanbanCandidates() {
  const candidates = state.boardData?.suggested_tasks || [];
  const lines = [
    "# Kanban 追加候補",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Candidates: ${candidates.length}`,
    "",
  ];
  if (!candidates.length) {
    lines.push("- 候補なし");
  } else {
    candidates.forEach((task) => {
      lines.push(`- [${task.task_size_ja}] ${task.title_ja}`);
      lines.push(`  - 推奨列: ${task["推奨列"]}`);
      lines.push(`  - priority: ${task.priority_score}`);
      lines.push(`  - 理由: ${task["理由"]}`);
      lines.push(`  - 状態判断: ${task["状態判断理由"]}`);
      lines.push(`  - 次の一手: ${task["次の一手"]}`);
      if (task.primary_repos?.length) {
        lines.push(`  - repo: ${task.primary_repos.join(", ")}`);
      }
      for (const title of task.representative_titles || []) {
        lines.push(`  - 代表session: ${title}`);
      }
    });
  }
  await navigator.clipboard.writeText(lines.join("\n"));
  alert(t("copiedKanbanCandidates"));
}

async function copyEffectiveSummary() {
  const effective = buildEffectiveState();
  const lines = [
    "# Effective Kanban State",
    "",
    `Generated: ${effective.generated_at}`,
    `Default owner: ${effective.status_policy.default_owner}`,
    `Rule: ${effective.status_policy.human_override_rule}`,
    "",
    "## Effective status counts",
  ];
  for (const [status, count] of Object.entries(effective.counts)) {
    lines.push(`- ${status}: ${count}`);
  }
  lines.push("", "## Sessions");
  effective.sessions.forEach((item) => {
    lines.push(`- [${item.effective_status}] ${item.title} (${item.primary_repo || "unknown repo"})`);
    lines.push(`  - task_cluster: ${item.task_cluster_family || item.task_cluster_label || "misc"} (${item.related_session_count || 1} sessions)`);
    lines.push(`  - status_owner: ${item.status_owner}`);
    lines.push(`  - override_lock: ${item.override_lock ? "true" : "false"}`);
    lines.push(`  - status_mutable: ${item.status_mutable ? "true" : "false"}`);
    lines.push(`  - order_lock: ${item.order_lock ? "true" : "false"}${item.manual_rank !== null ? ` / manual_rank: ${item.manual_rank}` : ""}`);
    if (item.human_notes) {
      lines.push(`  - notes: ${item.human_notes}`);
    }
  });
  await navigator.clipboard.writeText(lines.join("\n"));
  alert(t("copiedEffectiveSummary"));
}

function importOverrides(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      state.overrides = JSON.parse(reader.result);
      saveOverrides();
      renderBoard();
      renderDetail();
    } catch (error) {
      alert(t("invalidJson", { message: error.message }));
    }
  };
  reader.readAsText(file);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function init() {
  state.boardData = loadBootstrap();
  state.sessions = state.boardData.sessions || [];
  state.overrides = loadOverrides();
  state.selectedId = state.sessions[0]?.session_id || null;

  applyStaticI18n();
  updateHeroMeta();
  const workflowHelp = document.getElementById("workflow-help");
  document.getElementById("workflow-help-button")?.addEventListener("click", () => {
    workflowHelp.hidden = !workflowHelp.hidden;
  });
  document.getElementById("workflow-help-close")?.addEventListener("click", () => {
    workflowHelp.hidden = true;
  });
  document.querySelectorAll("[data-lang-option]").forEach((button) => {
    button.addEventListener("click", () => {
      state.lang = button.dataset.langOption || "ja";
      localStorage.setItem(LANGUAGE_KEY, state.lang);
      applyStaticI18n();
      updateHeroMeta();
      renderRepoFilter();
      renderStatusFilter();
      renderClusterFilter();
      renderAttentionFilter();
      renderCandidateStrip();
      renderBoard();
      renderDetail();
    });
  });
  renderRepoFilter();
  renderStatusFilter();
  renderClusterFilter();
  renderAttentionFilter();
  renderCandidateStrip();

  document.getElementById("search-input").addEventListener("input", (event) => {
    state.search = event.target.value;
    renderBoard();
  });

  document.getElementById("repo-filter").addEventListener("change", (event) => {
    state.repo = event.target.value;
    renderBoard();
  });
  document.getElementById("status-filter").addEventListener("change", (event) => {
    state.status = event.target.value;
    renderBoard();
  });
  document.getElementById("cluster-filter").addEventListener("change", (event) => {
    state.cluster = event.target.value;
    renderBoard();
  });
  document.getElementById("attention-filter")?.addEventListener("change", (event) => {
    state.attention = event.target.value;
    renderBoard();
  });

  document.getElementById("export-button").addEventListener("click", exportOverrides);
  document.getElementById("copy-overrides-json").addEventListener("click", () => {
    copyOverridesJson().catch((error) => alert(t("copyFailed", { message: error.message })));
  });
  document.getElementById("save-sync-json").addEventListener("click", () => {
    saveSyncJson().catch((error) => {
      if (error?.name !== "AbortError") {
        alert(t("copyFailed", { message: error.message }));
      }
    });
  });
  document.getElementById("export-effective-json").addEventListener("click", exportEffectiveJson);
  document.getElementById("copy-ai-summary").addEventListener("click", () => {
    copyAiSummary().catch((error) => alert(t("copyFailed", { message: error.message })));
  });
  document.getElementById("copy-cluster-summary").addEventListener("click", () => {
    copyClusterSummary().catch((error) => alert(t("copyFailed", { message: error.message })));
  });
  document.getElementById("copy-kanban-candidates").addEventListener("click", () => {
    copyKanbanCandidates().catch((error) => alert(t("copyFailed", { message: error.message })));
  });
  document.getElementById("copy-effective-summary").addEventListener("click", () => {
    copyEffectiveSummary().catch((error) => alert(t("copyFailed", { message: error.message })));
  });
  document.getElementById("copy-summary").addEventListener("click", () => {
    copyReviewSummary().catch((error) => alert(t("copyFailed", { message: error.message })));
  });
  document.getElementById("import-file").addEventListener("change", (event) => {
    importOverrides(event.target.files?.[0]);
  });
  document.getElementById("clear-overrides").addEventListener("click", () => {
    state.overrides = {};
    saveOverrides();
    renderBoard();
    renderDetail();
  });
  document.addEventListener("keydown", handleKeyboardTriage);

  renderBoard();
  renderDetail();
}

document.addEventListener("DOMContentLoaded", init);
