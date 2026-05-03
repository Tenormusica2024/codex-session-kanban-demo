const STORAGE_KEY = "codex-session-review:v1";
const LANGUAGE_KEY = "codex-session-review:language";
const PANE_AUTOMATION_KEY = "codex-session-review:pane-automation:v1";
const PANE_AUTOMATION_BRIDGE_URL = "http://127.0.0.1:8766/pane-automation";
const PANE_AUTOMATION_DEFAULT = {
  upper_left: true,
  upper_right: false,
  lower_left: false,
  lower_right: false,
};
const PANE_AUTOMATION_LABEL_KEYS = {
  upper_left: "paneAutoUpperLeft",
  upper_right: "paneAutoUpperRight",
  lower_left: "paneAutoLowerLeft",
  lower_right: "paneAutoLowerRight",
};
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
    paneAutoTitle: "Pane Auto",
    paneAutoModeLocal: "local cache",
    paneAutoModeBridge: "bridge同期",
    paneAutoModePending: "未反映",
    paneAutoUpperLeft: "左上",
    paneAutoUpperRight: "右上",
    paneAutoLowerLeft: "左下",
    paneAutoLowerRight: "右下",
    paneAutoEnabled: "{label} 自動継続 ON",
    paneAutoDisabled: "{label} 自動継続 OFF",
    paneAutoOn: "ON",
    paneAutoOff: "OFF",
    paneAutoSummary: "{count}/4 ON",
    paneAutoRefresh: "再読込",
    paneAutoApply: "ローカル反映",
    paneAutoCopy: "JSONコピー",
    paneAutoLoaded: "bridgeから読込",
    paneAutoApplied: "反映しました",
    paneAutoBridgeOffline: "bridge未接続",
    paneAutoCopied: "コピーしました",
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
      "候補一覧は staging。候補クリックは詳細確認のみで、追加先の列を選んで保存した時だけボードに固定されます。固定済み候補は候補一覧から消えます。",
    guideNoteSchedule:
      "配布版は sample fixture だけから GitHub Actions で生成します。外部 LLM API や実セッションは使いません。",
    guideKeyboard:
      "ショートカット: / で検索、? で使い方、Esc で使い方を閉じる、x でボードと候補の絞り込み解除。j/k でカード選択移動、Alt+↑/↓ で同列順位変更、1-6 で状態変更、c でsession IDコピー。候補一覧フォーカス中は j/k で候補移動、Enterで詳細、aで推奨列へ追加。b でカード要約コピー。入力欄フォーカス中は無効。",
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
    candidateReviewTitle: "候補レビュー",
    candidateReviewLead: "追加前後の候補を品質・固定状態・前後関係で確認",
    candidateOpen: "未追加候補",
    candidateFixed: "固定済み",
    candidateQualityReview: "品質要確認",
    candidateLineage: "複数session代表",
    filterSearch: "検索",
    filterRepo: "Repo",
    filterStatus: "状態",
    filterCluster: "まとまり",
    filterAttention: "注目",
    searchPlaceholder: "repo / 依頼文 / 要約",
    allAttention: "すべて",
    attentionNeedsInput: "入力/操作待ち",
    attentionHasBlocker: "blockerあり",
    attentionQualityReview: "品質要確認",
    attentionLineage: "複数session代表",
    attentionHighActivity: "高活動/大きいsession",
    clearFilters: "絞り込み解除",
    clearFiltersShortcut: "絞り込み解除: x",
    filterSummary: "表示 {cards}件 / 候補 {candidates}件 / 絞り込み {filters}",
    filterSummaryNone: "なし",
    filterSummaryActive: "有効",
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
    importSessionData: "session JSONを読み込み",
    resetDemoData: "デモデータに戻す",
    importedSessionData: "session JSONを読み込みました: {count}件",
    importValidationTitle: "Import validation report",
    importValidationSummary: "読み込み結果",
    importWarnings: "警告",
    importNoWarnings: "警告なし",
    importMissingFields: "不足フィールド",
    importInvalidStatuses: "不正なstatus",
    importDuplicateIds: "重複session_id",
    importInvalidTimestamps: "不正な時刻",
    importBrokenRelatedIds: "参照切れrelated_session_ids",
    importPrivacySignals: "private情報らしき信号",
    importValidationHint: "警告がある場合もローカル表示だけなら続行できます。公開fixtureへ入れる前には必ず修正してください。",
    downloadSampleJson: "sample JSONをDL",
    copySampleJson: "sample JSONをコピー",
    openSchemaDocs: "schema docs",
    copiedSampleJson: "sample JSONをコピーしました。",
    invalidSessionData: "sessions 配列を含むJSONを指定してください",
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
    previewCandidate: "詳細を確認",
    candidateDetailTitle: "追加候補の詳細",
    candidatePromoteTo: "追加先の列",
    candidatePromote: "この列へ追加",
    candidateRepresentative: "代表セッション",
    candidatePreviewHint: "ここではまだボードに固定しません。追加先を選んで保存すると human override lock として固定されます。",
    quickFilter: "絞り込む",
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
    textUnits: "Text",
    lightweightStats: "軽量優先度stats",
    estimatedText: "推定テキスト量",
    highActivity: "高活動",
    largeSession: "大きめ",
    prioritizationSignals: "優先度シグナル",
    rankUp: "同じ列で上へ",
    rankDown: "同じ列で下へ",
    buildMeta: "v{version} / 生成 {date} / {count} セッション",
    copySessionId: "session IDをコピー",
    copyCardLink: "カードURLをコピー",
    copyCardBrief: "カード要約をコピー",
    moveStatus: "状態を変更",
    humanLockHint: "変更すると human override lock として保存",
    aiRecommendation: "AI判断",
    whyThisCard: "このカードの根拠",
    inferredIntent: "推定したタスク意図",
    evidence: "根拠",
    evidenceCategories: "根拠の分類",
    evidenceIntent: "目的/意図",
    evidenceDecision: "決定/方針",
    evidenceBlocker: "詰まり/待ち",
    evidenceNextAction: "次の一手",
    evidenceOutput: "成果物/変更",
    evidenceOther: "その他",
    lineage: "前後関係",
    noLineage: "このカードでは代表セッションのみを表示中",
    sourceSessions: "元セッション",
    suppressedSessions: "非表示にした前後セッション",
    suppressedReason: "このカードが同じ前後関係の代表として表示されているため、古いセッションは active board から抑制されています。",
    representativeReason: "代表理由",
    openSuppressed: "このセッションを見る",
    supersedes: "{count}件を代表表示中",
    mergedHint: "古い関連セッションはこのカードに集約",
    confidence: "確信度",
    taskCluster: "タスクまとまり",
    relatedSessions: "関連セッション",
    statusOwner: "状態の所有者",
    overrideLock: "override lock",
    orderLock: "order lock",
    extractionTimeline: "抽出タイムライン",
    timelineFirstSeen: "初回検出",
    timelineLatestEvidence: "最新の決定的根拠",
    timelineMergedSessions: "統合/代表セッション",
    timelineManualOverride: "手動修正",
    timelineNoManualOverride: "手動修正なし",
    timelineNotAvailable: "タイムライン情報なし",
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
    provider: "provider",
    extractionDebug: "抽出デバッグ",
    titleSource: "タイトル根拠",
    summarySource: "本文根拠",
    discardedTopicSignals: "捨てた/弱めたトピック संकेत",
    debugRules: "発火したルール",
    debugNoSignals: "目立つデバッグ信号なし",
    debugIntentFirst: "前置きの確認語より、実作業の目的・成果物・次の一手を優先",
    debugLineage: "同じ前後関係の古い情報は、新しい文脈と整合した場合だけ代表カードへ統合",
    qualityCheck: "抽出品質チェック",
    qualityOk: "品質OK",
    qualityReview: "要品質確認",
    qualityIssues: "検出事項",
    qualityGenericTitle: "タイトルが汎用的すぎる可能性",
    qualityRawBody: "本文がraw発言寄りの可能性",
    qualityWeakEvidence: "根拠メッセージが少ない",
    qualityConflictRisk: "topic conflict / task shift の確認余地",
    qualityLineageRisk: "複数セッション統合の確認余地",
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
    paneAutoTitle: "Pane Auto",
    paneAutoModeLocal: "local cache",
    paneAutoModeBridge: "bridge sync",
    paneAutoModePending: "pending",
    paneAutoUpperLeft: "upper left",
    paneAutoUpperRight: "upper right",
    paneAutoLowerLeft: "lower left",
    paneAutoLowerRight: "lower right",
    paneAutoEnabled: "{label} auto-continue on",
    paneAutoDisabled: "{label} auto-continue off",
    paneAutoOn: "ON",
    paneAutoOff: "OFF",
    paneAutoSummary: "{count}/4 ON",
    paneAutoRefresh: "refresh",
    paneAutoApply: "apply local",
    paneAutoCopy: "copy JSON",
    paneAutoLoaded: "loaded from bridge",
    paneAutoApplied: "applied",
    paneAutoBridgeOffline: "bridge offline",
    paneAutoCopied: "copied",
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
      "The candidate list is staging. Clicking a candidate only previews it; it is fixed to the board only after choosing a target column and saving.",
    guideNoteSchedule:
      "The public demo is generated from sample fixtures by GitHub Actions. It uses no external LLM API and no real session logs.",
    guideKeyboard:
      "Shortcuts: / focuses search, ? toggles the guide, and Esc closes it, and x clears board and candidate filters. j/k select cards, Alt+↑/↓ reorder within a column, 1-6 move status, c copy session ID. When the candidate list is focused, j/k move candidates, Enter previews, and a adds to the recommended column. Press b to copy the selected card brief. Disabled while typing in inputs.",
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
    candidateReviewTitle: "Candidate review",
    candidateReviewLead: "Review candidates by add-state, extraction quality, and lineage",
    candidateOpen: "Open candidates",
    candidateFixed: "Fixed",
    candidateQualityReview: "Quality review",
    candidateLineage: "Multi-session representative",
    filterSearch: "Search",
    filterRepo: "Repo",
    filterStatus: "Status",
    filterCluster: "Cluster",
    filterAttention: "Attention",
    searchPlaceholder: "repo / prompt / summary",
    allAttention: "All",
    attentionNeedsInput: "Needs input",
    attentionHasBlocker: "Has blocker",
    attentionQualityReview: "Needs quality review",
    attentionLineage: "Multi-session representative",
    attentionHighActivity: "High activity / large session",
    clearFilters: "Clear filters",
    clearFiltersShortcut: "Clear filters: x",
    filterSummary: "Showing {cards} cards / {candidates} candidates / filters {filters}",
    filterSummaryNone: "none",
    filterSummaryActive: "active",
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
    importSessionData: "Import session JSON",
    resetDemoData: "Reset demo data",
    importedSessionData: "Imported session JSON: {count} sessions",
    importValidationTitle: "Import validation report",
    importValidationSummary: "Import result",
    importWarnings: "Warnings",
    importNoWarnings: "No warnings",
    importMissingFields: "Missing fields",
    importInvalidStatuses: "Invalid statuses",
    importDuplicateIds: "Duplicate session_id",
    importInvalidTimestamps: "Invalid timestamps",
    importBrokenRelatedIds: "Broken related_session_ids",
    importPrivacySignals: "Possible private-data signals",
    importValidationHint: "Warnings are acceptable for local-only review, but fix them before publishing fixture data.",
    downloadSampleJson: "Download sample JSON",
    copySampleJson: "Copy sample JSON",
    openSchemaDocs: "Schema docs",
    copiedSampleJson: "Sample JSON copied.",
    invalidSessionData: "Choose JSON with a sessions array",
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
    previewCandidate: "Review details",
    candidateDetailTitle: "Candidate detail",
    candidatePromoteTo: "Add to column",
    candidatePromote: "Add to this column",
    candidateRepresentative: "Representative session",
    candidatePreviewHint: "This does not fix the card to the board yet. Choose a target column and save to create a human override lock.",
    quickFilter: "Filter",
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
    textUnits: "Text",
    lightweightStats: "Lightweight priority stats",
    estimatedText: "Estimated text",
    highActivity: "High activity",
    largeSession: "Large session",
    prioritizationSignals: "Priority signals",
    rankUp: "Move up in column",
    rankDown: "Move down in column",
    buildMeta: "v{version} / built {date} / {count} sessions",
    copySessionId: "Copy session ID",
    copyCardLink: "Copy card URL",
    copyCardBrief: "Copy card brief",
    moveStatus: "Move status",
    humanLockHint: "Changing this saves a human override lock",
    aiRecommendation: "AI recommendation",
    whyThisCard: "Why this card exists",
    inferredIntent: "Inferred task intent",
    evidence: "Evidence",
    evidenceCategories: "Evidence categories",
    evidenceIntent: "Intent / goal",
    evidenceDecision: "Decision / policy",
    evidenceBlocker: "Blocker / waiting",
    evidenceNextAction: "Next action",
    evidenceOutput: "Output / change",
    evidenceOther: "Other",
    lineage: "Lineage",
    noLineage: "Only the representative session is shown for this card",
    sourceSessions: "Source sessions",
    suppressedSessions: "Suppressed predecessor sessions",
    suppressedReason: "Older sessions are suppressed from the active board because this card represents the same task lineage.",
    representativeReason: "Representative reason",
    openSuppressed: "Open this session",
    supersedes: "Represents {count} sessions",
    mergedHint: "Older related sessions are merged into this card",
    confidence: "confidence",
    taskCluster: "task cluster",
    relatedSessions: "related sessions",
    statusOwner: "status owner",
    overrideLock: "override lock",
    orderLock: "order lock",
    extractionTimeline: "Extraction timeline",
    timelineFirstSeen: "First seen",
    timelineLatestEvidence: "Latest decisive evidence",
    timelineMergedSessions: "Merged / represented sessions",
    timelineManualOverride: "Manual override",
    timelineNoManualOverride: "No manual override",
    timelineNotAvailable: "No timeline information",
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
    provider: "provider",
    extractionDebug: "Extraction debug",
    titleSource: "Title source",
    summarySource: "Body source",
    discardedTopicSignals: "Discarded / downweighted topic signals",
    debugRules: "Triggered rules",
    debugNoSignals: "No notable debug signals",
    debugIntentFirst: "Prefer the actual work goal, output, and next action over preflight review phrases",
    debugLineage: "Merge older lineage only when newer context reconciles it",
    qualityCheck: "Extraction quality check",
    qualityOk: "Quality OK",
    qualityReview: "Needs quality review",
    qualityIssues: "Detected issues",
    qualityGenericTitle: "Title may be too generic",
    qualityRawBody: "Body may still look like a raw message",
    qualityWeakEvidence: "Few evidence messages",
    qualityConflictRisk: "Possible topic conflict / task shift",
    qualityLineageRisk: "Merged-session lineage should be reviewed",
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
  originalBoardData: null,
  sessions: [],
  overrides: {},
  search: "",
  repo: "all",
  status: "all",
  cluster: "all",
  attention: "all",
  selectedId: null,
  selectedCandidateIndex: 0,
  dragId: null,
  archiveExpanded: {},
  paneAutomation: { ...PANE_AUTOMATION_DEFAULT },
  paneAutomationBridgeOnline: null,
  paneAutomationDirty: false,
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
    buildMeta.textContent = t("buildMeta", {
      version: state.boardData?.app_version || "unknown",
      date: state.boardData?.generated_at || "unknown",
      count: state.sessions.length,
    });
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

function displayOriginalText(value, fallback = "Original source text is Japanese; switch to Japanese mode to read it.", enValue = null) {
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

function classifyEvidenceMessage(message) {
  const text = String(message || "").toLowerCase();
  if (/block|blocked|waiting|credential|login|auth|permission|limit|budget|terms|policy|詰ま|待ち|停止|同意|利用規約|認証|ログイン|制限|予算/.test(text)) {
    return "blocker";
  }
  if (/next|todo|follow|continue|confirm|review|進め|次|確認|レビュー|残タスク|一手/.test(text)) {
    return "nextAction";
  }
  if (/decid|policy|direction|should|must|方針|決定|判断|優先|採用|やめる|戻す/.test(text)) {
    return "decision";
  }
  if (/goal|intent|purpose|objective|目的|意図|ゴール|主題|本題/.test(text)) {
    return "intent";
  }
  if (/commit|push|deploy|built|generated|implemented|added|fixed|変更|実装|追加|修正|生成|反映|成果物/.test(text)) {
    return "output";
  }
  return "other";
}

function evidenceCategoryLabel(category) {
  return {
    intent: t("evidenceIntent"),
    decision: t("evidenceDecision"),
    blocker: t("evidenceBlocker"),
    nextAction: t("evidenceNextAction"),
    output: t("evidenceOutput"),
    other: t("evidenceOther"),
  }[category] || t("evidenceOther");
}

function buildEvidenceCategories(session) {
  const messages = displayEvidenceMessages(session).filter(Boolean);
  const grouped = new Map();
  for (const message of messages) {
    const category = classifyEvidenceMessage(message);
    if (!grouped.has(category)) grouped.set(category, []);
    grouped.get(category).push(message);
  }
  return ["intent", "decision", "blocker", "nextAction", "output", "other"]
    .filter((category) => grouped.has(category))
    .map((category) => ({ category, items: grouped.get(category).slice(0, 3) }));
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
function formatTimelineDate(value) {
  if (!value) return "n/a";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(state.lang === "ja" ? "ja-JP" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildExtractionTimeline(session, relatedSessions = []) {
  const all = [session, ...relatedSessions].filter(Boolean);
  const sorted = all
    .slice()
    .sort((a, b) => new Date(a.start_at || a.end_at || 0) - new Date(b.start_at || b.end_at || 0));
  const first = sorted[0] || session;
  const latest = sorted
    .slice()
    .sort((a, b) => new Date(b.end_at || b.start_at || 0) - new Date(a.end_at || a.start_at || 0))[0] || session;
  const overrideAt = session.reviewTouchedAt || session.touched_at || session.override_touched_at || session.override?.touched_at;
  const mergedLabels = relatedSessions
    .slice(0, 4)
    .map((item) => `${displayTaskTitle(item)} (${shortSessionId(item.session_id)})`);
  return [
    {
      label: t("timelineFirstSeen"),
      value: `${formatTimelineDate(first.start_at || first.end_at)} / ${displayTaskTitle(first)}`,
    },
    {
      label: t("timelineLatestEvidence"),
      value: `${formatTimelineDate(latest.end_at || latest.start_at)} / ${displayTaskTitle(latest)}`,
    },
    {
      label: t("timelineMergedSessions"),
      value: mergedLabels.length
        ? `${relatedSessions.length} ${t("sessions")}: ${mergedLabels.join(" / ")}`
        : t("representativeOnly"),
    },
    {
      label: t("timelineManualOverride"),
      value: session.overrideLock || session.orderLock
        ? `${formatTimelineDate(overrideAt)} / ${session.statusOwner || "human"}`
        : t("timelineNoManualOverride"),
    },
  ].filter((item) => item.value && item.value !== "n/a");
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

function buildSuppressedLineage(session, mergedSessions) {
  const ids = new Set(session.related_session_ids || []);
  const family = session.task_cluster_family || session.task_cluster_label;
  const rows = mergedSessions
    .filter((item) => item.session_id !== session.session_id)
    .filter((item) => ids.has(item.session_id) || ((item.task_cluster_family || item.task_cluster_label) === family && family))
    .sort((a, b) => new Date(b.end_at || b.start_at || 0) - new Date(a.end_at || a.start_at || 0));
  const representativeReason = session.overrideLock
    ? (state.lang === "ja" ? "human lock 済みのセッションを代表にしています。" : "A human-locked session is used as the representative.")
    : (state.lang === "ja" ? "同じ前後関係の中で、より新しい/優先度の高いセッションを代表にしています。" : "The newest or highest-priority session in the same lineage is used as the representative.");
  return { rows, representativeReason };
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

function providerLabel(item) {
  return item?.provider || item?.session_provider || state.boardData?.provider || "codex";
}

function extractionDebugInfo(session, relatedSessions = []) {
  const title = displayTaskTitle(session);
  const summary = displayTaskSummary(session);
  const evidence = displayEvidenceMessages(session).filter(Boolean);
  const signals = [];
  const rawSources = [
    session.first_user_message,
    session.current_goal,
    session.latest_meaningful_change,
    session.deep_summary,
    session.last_assistant_message,
    ...evidence,
  ].filter(Boolean);
  const preflightPattern = /内容確認|差分確認|進捗確認|状態確認|確認|review|check|status|progress/i;
  const actionPattern = /実装|追加|修正|生成|制作|返信|デプロイ|調査|整理|統合|分割|改善|方針|next|implement|fix|deploy|generate|reply|summar/i;
  const preflightHits = rawSources.filter((text) => preflightPattern.test(String(text))).slice(0, 3);
  const actionHits = rawSources.filter((text) => actionPattern.test(String(text))).slice(0, 3);
  if (preflightHits.length && actionHits.length) {
    signals.push(state.lang === "ja" ? "確認・レビュー語は前置き候補として弱める" : "Review/check phrases are downweighted as preflight candidates");
  }
  if (session.task_shift_signal || /本題|主題|前後関係|別タスク|topic|shift/i.test(rawSources.join(" "))) {
    signals.push(state.lang === "ja" ? "topic shift 可能性を検出" : "Possible topic shift detected");
  }
  if (relatedSessions.length || Number(session.related_session_count || 1) > 1) {
    signals.push(t("debugLineage"));
  }
  const titleSource = actionHits[0] || evidence[0] || session.current_goal || title;
  const summarySource = evidence.find((item) => item !== titleSource) || session.deep_summary || session.latest_meaningful_change || summary;
  return {
    titleSource,
    summarySource,
    discardedSignals: preflightHits,
    rules: [t("debugIntentFirst"), ...signals],
  };
}

function auditExtractionQuality(session) {
  const issues = [];
  const title = displayTaskTitle(session);
  const summary = displayTaskSummary(session);
  const evidence = displayEvidenceMessages(session);
  const titleLower = String(title || "").toLowerCase();
  const genericTitleTokens = [
    "内容確認",
    "差分確認",
    "進捗確認",
    "状態確認",
    "確認",
    "review",
    "check",
    "status",
    "progress",
  ];
  if (genericTitleTokens.some((token) => titleLower.includes(token.toLowerCase())) && String(title || "").length < 28) {
    issues.push(t("qualityGenericTitle"));
  }
  const rawBodyPatterns = [
    /https?:\/\//,
    /\/\s*現状[:：]/,
    /follow-up\s*\d+/i,
    /送信元[:：]/,
    /宛先[:：]/,
    /つまり、/,
    /できます/,
  ];
  if (rawBodyPatterns.some((pattern) => pattern.test(String(summary || "")))) {
    issues.push(t("qualityRawBody"));
  }
  if (evidence.length < 2) {
    issues.push(t("qualityWeakEvidence"));
  }
  if (session.task_shift_signal || /topic|shift|分裂|別タスク|本題|前後関係/.test(String(session.latest_meaningful_change || session.summary || ""))) {
    issues.push(t("qualityConflictRisk"));
  }
  if (Number(session.related_session_count || 1) > 1 && !session.overrideLock) {
    issues.push(t("qualityLineageRisk"));
  }
  return {
    ok: issues.length === 0,
    score: Math.max(0, 100 - issues.length * 18),
    issues: [...new Set(issues)],
  };
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

function loadPaneAutomation() {
  try {
    const stored = JSON.parse(localStorage.getItem(PANE_AUTOMATION_KEY) || "{}");
    return { ...PANE_AUTOMATION_DEFAULT, ...stored };
  } catch {
    return { ...PANE_AUTOMATION_DEFAULT };
  }
}

function savePaneAutomation() {
  localStorage.setItem(PANE_AUTOMATION_KEY, JSON.stringify(state.paneAutomation, null, 2));
}

function normalizePaneAutomationPanes(panes) {
  return Object.keys(PANE_AUTOMATION_DEFAULT).reduce((result, pane) => {
    result[pane] = panes?.[pane] ?? PANE_AUTOMATION_DEFAULT[pane];
    return result;
  }, {});
}

function paneAutomationExportPayload() {
  return {
    schema_version: 1,
    source: "codex-session-review-surface",
    storage_key: PANE_AUTOMATION_KEY,
    updated_at: new Date().toISOString(),
    panes: { ...PANE_AUTOMATION_DEFAULT, ...state.paneAutomation },
  };
}

function setPaneAutomationFeedback(messageKey, timeout = 1600) {
  const feedback = document.getElementById("pane-auto-feedback");
  if (!feedback) return;
  feedback.textContent = t(messageKey);
  if (timeout > 0) {
    window.setTimeout(() => {
      feedback.textContent = "";
    }, timeout);
  }
}

async function refreshPaneAutomationFromBridge({ quiet = false } = {}) {
  try {
    const response = await fetch(PANE_AUTOMATION_BRIDGE_URL, { method: "GET" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = await response.json();
    if (!payload?.ok || !payload?.panes) {
      throw new Error("invalid pane automation bridge response");
    }
    state.paneAutomation = normalizePaneAutomationPanes(payload.panes);
    state.paneAutomationBridgeOnline = true;
    state.paneAutomationDirty = false;
    savePaneAutomation();
    renderPaneAutomationControl();
    if (!quiet) {
      setPaneAutomationFeedback("paneAutoLoaded");
    }
    return true;
  } catch {
    state.paneAutomationBridgeOnline = false;
    renderPaneAutomationControl();
    if (!quiet) {
      setPaneAutomationFeedback("paneAutoBridgeOffline", 0);
    }
    return false;
  }
}

function renderPaneAutomationControl() {
  const enabledCount = Object.keys(PANE_AUTOMATION_DEFAULT).filter(
    (pane) => state.paneAutomation[pane] !== false,
  ).length;
  const status = document.getElementById("pane-auto-status");
  if (status) {
    status.textContent = t("paneAutoSummary", { count: enabledCount });
  }
  const mode = document.getElementById("pane-auto-mode");
  if (mode) {
    const bridgeOnline = state.paneAutomationBridgeOnline === true;
    const pending = state.paneAutomationDirty === true;
    mode.textContent = pending
      ? t("paneAutoModePending")
      : bridgeOnline
        ? t("paneAutoModeBridge")
        : t("paneAutoModeLocal");
    mode.classList.toggle("is-online", bridgeOnline && !pending);
    mode.classList.toggle("is-local", !bridgeOnline && !pending);
    mode.classList.toggle("is-pending", pending);
  }
  document.querySelectorAll("[data-pane-toggle]").forEach((button) => {
    const pane = button.dataset.paneToggle;
    const enabled = state.paneAutomation[pane] !== false;
    const label = t(PANE_AUTOMATION_LABEL_KEYS[pane] || pane);
    button.setAttribute("aria-pressed", String(enabled));
    button.classList.toggle("off", !enabled);
    button.title = enabled ? t("paneAutoEnabled", { label }) : t("paneAutoDisabled", { label });
    button.setAttribute("aria-label", button.title);
    const statusLabel = button.querySelector("[data-pane-toggle-status]");
    if (statusLabel) {
      statusLabel.textContent = enabled ? t("paneAutoOn") : t("paneAutoOff");
    }
  });
}

function initPaneAutomationControl() {
  state.paneAutomation = loadPaneAutomation();
  document.querySelectorAll("[data-pane-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const pane = button.dataset.paneToggle;
      state.paneAutomation[pane] = !(state.paneAutomation[pane] !== false);
      state.paneAutomationDirty = true;
      savePaneAutomation();
      renderPaneAutomationControl();
    });
  });
  document.getElementById("pane-auto-apply")?.addEventListener("click", async () => {
    const payload = paneAutomationExportPayload();
    try {
      const response = await fetch(PANE_AUTOMATION_BRIDGE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      state.paneAutomationBridgeOnline = true;
      state.paneAutomationDirty = false;
      renderPaneAutomationControl();
      setPaneAutomationFeedback("paneAutoApplied");
    } catch {
      state.paneAutomationBridgeOnline = false;
      renderPaneAutomationControl();
      setPaneAutomationFeedback("paneAutoBridgeOffline", 0);
    }
  });
  document.getElementById("pane-auto-refresh")?.addEventListener("click", () => {
    refreshPaneAutomationFromBridge();
  });
  document.getElementById("pane-auto-copy")?.addEventListener("click", async () => {
    const feedback = document.getElementById("pane-auto-feedback");
    const text = JSON.stringify(paneAutomationExportPayload(), null, 2);
    try {
      await navigator.clipboard.writeText(text);
      if (feedback) {
        feedback.textContent = t("paneAutoCopied");
        window.setTimeout(() => {
          feedback.textContent = "";
        }, 1600);
      }
    } catch {
      if (feedback) {
        feedback.textContent = text;
      }
    }
  });
  renderPaneAutomationControl();
  refreshPaneAutomationFromBridge({ quiet: true });
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

function sessionSearchHaystack(session) {
  const relatedSessions = (session.related_session_ids || [])
    .map((id) => state.sessions.find((item) => item.session_id === id))
    .filter(Boolean);
  return [
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
    session.topic_key,
    session.topic_label,
    session.lineage_key,
    session.lineage_label,
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
}

function sessionMatchesCurrentFilters(session, { includeStatus = true } = {}) {
  if (state.repo !== "all" && session.primary_repo !== state.repo) return false;
  if (includeStatus && state.status !== "all" && session.currentStatus !== state.status) return false;
  if (state.cluster !== "all" && (session.task_cluster_family || session.task_cluster_label) !== state.cluster) return false;
  if (state.attention !== "all") {
    const signals = attentionSignals(session);
    if (state.attention === "needs-input" && !signals.needsInput) return false;
    if (state.attention === "has-blocker" && !signals.hasBlocker) return false;
    if (state.attention === "quality-review" && auditExtractionQuality(session).ok) return false;
    if (state.attention === "lineage" && !lineageInfo(session).hasMerged) return false;
    if (state.attention === "high-activity" && !lightweightStats(session).highActivity && !lightweightStats(session).largeSession) return false;
  }
  const search = state.search.trim().toLowerCase();
  return !search || sessionSearchHaystack(session).includes(search);
}

function candidateMatchesCurrentFilters(task) {
  const representative = findRepresentativeForTask(task);
  if (!representative) return false;
  if (!sessionMatchesCurrentFilters(representative, { includeStatus: false })) return false;
  if (state.status !== "all") {
    const targetStatus = task["推奨列"] || representative.suggested_status || representative.currentStatus;
    if (targetStatus !== state.status) return false;
  }
  const search = state.search.trim().toLowerCase();
  if (!search) return true;
  const cluster = findClusterForTask(task);
  const taskHaystack = [
    task.title_ja,
    task.title_en,
    task.cluster_label,
    task.task_id,
    task["理由"],
    task["状態判断理由"],
    task["次の一手"],
    ...(task.primary_repos || []),
    ...(task.representative_titles || []),
    cluster?.cluster_label,
    cluster?.cluster_key,
  ]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();
  return taskHaystack.includes(search) || sessionSearchHaystack(representative).includes(search);
}

function getVisibleSessions() {
  return getDisplaySessions().filter((session) => sessionMatchesCurrentFilters(session));
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

function filtersActive() {
  return Boolean(
    state.search.trim() ||
      state.repo !== "all" ||
      state.status !== "all" ||
      state.cluster !== "all" ||
      state.attention !== "all"
  );
}

function updateFilterSummary(visibleSessions = null, openCandidates = null) {
  const node = document.getElementById("filter-summary");
  if (!node) return;
  const cards = visibleSessions || getVisibleSessions();
  const candidates = openCandidates || getOpenCandidateTasks();
  node.textContent = t("filterSummary", {
    cards: cards.length,
    candidates: candidates.length,
    filters: t(filtersActive() ? "filterSummaryActive" : "filterSummaryNone"),
  });
  node.classList.toggle("active", filtersActive());
}

function renderAttentionFilter() {
  const select = document.getElementById("attention-filter");
  if (!select) return;
  select.innerHTML = `
    <option value="all">${escapeHtml(t("allAttention"))}</option>
    <option value="needs-input">${escapeHtml(t("attentionNeedsInput"))}</option>
    <option value="has-blocker">${escapeHtml(t("attentionHasBlocker"))}</option>
    <option value="quality-review">${escapeHtml(t("attentionQualityReview"))}</option>
    <option value="lineage">${escapeHtml(t("attentionLineage"))}</option>
    <option value="high-activity">${escapeHtml(t("attentionHighActivity"))}</option>
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

function selectedSessionIdFromHash() {
  const raw = decodeURIComponent(String(window.location.hash || "").replace(/^#/, ""));
  if (!raw) return null;
  if (raw.startsWith("session=")) {
    return new URLSearchParams(raw).get("session");
  }
  return raw;
}

function cardLinkForSession(sessionId) {
  const url = new URL(window.location.href);
  url.hash = `session=${encodeURIComponent(sessionId)}`;
  return url.toString();
}

function syncSelectedHash(sessionId) {
  if (!sessionId || !window.history?.replaceState) return;
  const nextHash = `#session=${encodeURIComponent(sessionId)}`;
  if (window.location.hash !== nextHash) {
    window.history.replaceState(null, "", nextHash);
  }
}

function selectBoardSession(sessionId, { updateHash = true } = {}) {
  state.selectedId = sessionId;
  if (updateHash) syncSelectedHash(sessionId);
}

function revealBoardSession(sessionId) {
  selectBoardSession(sessionId);
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

function getOpenCandidateTasks() {
  const allCandidates = state.boardData?.suggested_tasks || [];
  return allCandidates.filter((task) => {
    const representative = findRepresentativeForTask(task);
    return !(representative && state.overrides[representative.session_id]?.status) && candidateMatchesCurrentFilters(task);
  });
}

function focusCandidateTask(task) {
  const openCandidates = getOpenCandidateTasks();
  const index = openCandidates.findIndex((candidate) => candidate === task || (candidate.task_id && candidate.task_id === task.task_id));
  if (index >= 0) state.selectedCandidateIndex = index;
  renderCandidateDetail(task);
  renderCandidateStrip();
}

function addCandidateTask(task, targetStatus = null) {
  const representative = findRepresentativeForTask(task);
  if (!representative) {
    alert(t("noRepresentative"));
    return;
  }
  const status = targetStatus || task["推奨列"] || representative.suggested_status || "Need Review";
  setOverride(representative.session_id, {
    status,
    notes:
      representative.reviewNotes ||
      `Added from Kanban candidates: ${displayTaskTitle(task)} -> ${statusLabel(status)}.`,
  });
  revealBoardSession(representative.session_id);
}

function renderCandidateDetail(task) {
  const panel = document.getElementById("detail-panel");
  const representative = findRepresentativeForTask(task);
  if (!representative) {
    panel.innerHTML = `<p class="detail-empty">${escapeHtml(t("noRepresentative"))}</p>`;
    return;
  }
  const targetStatus = task["推奨列"] || representative.suggested_status || "Need Review";
  const cluster = findClusterForTask(task);
  panel.innerHTML = `
    <h2>${escapeHtml(t("candidateDetailTitle"))}</h2>
    <div class="detail-meta">
      <span class="tag">${escapeHtml(displayTaskSize(task.task_size_ja))}</span>
      <span class="tag">${escapeHtml(statusLabel(targetStatus))}</span>
      <span class="tag">${escapeHtml(t("priority"))} ${escapeHtml(task.priority_score ?? "")}</span>
      <span class="tag">${escapeHtml(displayClusterLabel(task.cluster_label || cluster?.cluster_label || "misc"))}</span>
    </div>
    <div class="candidate-detail-card">
      <h3>${escapeHtml(displayTaskTitle(task))}</h3>
      <p>${escapeHtml(displayTaskSummary(task))}</p>
      <p class="small">${escapeHtml(t("statusReason"))}: ${escapeHtml(displayReason(task))}</p>
      <p class="small">${escapeHtml(t("nextAction"))}: ${escapeHtml(displayNextAction(task))}</p>
    </div>
    <div class="session-id-box">
      <div>
        <span class="small">${escapeHtml(t("candidateRepresentative"))}</span>
        <div class="mono">${escapeHtml(representative.session_id)}</div>
      </div>
      <button class="secondary tiny" id="candidate-copy-session-id">${escapeHtml(t("copySessionId"))}</button>
    </div>
    <div class="quick-status-bar">
      <label>
        <span class="small">${escapeHtml(t("candidatePromoteTo"))}</span>
        <select id="candidate-status">
          ${STATUSES.map((status) => `<option value="${escapeHtml(status)}"${status === targetStatus ? " selected" : ""}>${escapeHtml(statusLabel(status))}</option>`).join("")}
        </select>
      </label>
      <button id="candidate-promote">${escapeHtml(t("candidatePromote"))}</button>
    </div>
    <p class="small">${escapeHtml(t("candidatePreviewHint"))}</p>
  `;
  document.getElementById("candidate-promote")?.addEventListener("click", () => {
    addCandidateTask(task, document.getElementById("candidate-status").value);
  });
  document.getElementById("candidate-copy-session-id")?.addEventListener("click", () => {
    navigator.clipboard.writeText(representative.session_id).catch((error) => alert(t("copyFailed", { message: error.message })));
  });
}

function renderCandidateStrip() {
  const host = document.getElementById("candidate-list");
  const allCandidates = state.boardData?.suggested_tasks || [];
  const openCandidates = getOpenCandidateTasks();
  const hiddenCount = allCandidates.length - openCandidates.length;
  updateFilterSummary(null, openCandidates);
  state.selectedCandidateIndex = Math.max(0, Math.min(state.selectedCandidateIndex || 0, Math.max(0, openCandidates.length - 1)));
  const candidates = openCandidates.slice(0, 8);
  host.innerHTML = "";
  if (!candidates.length) {
    host.innerHTML = `<span class="small">${
      hiddenCount ? escapeHtml(t("noUnaddedCandidates", { count: hiddenCount })) : escapeHtml(t("noCandidates"))
    }</span>`;
    renderCandidateReviewPanel();
    return;
  }
  if (hiddenCount) {
    const note = document.createElement("div");
    note.className = "candidate-filter-note";
    note.textContent = t("fixedHidden", { count: hiddenCount });
    host.appendChild(note);
  }
  candidates.forEach((task, index) => {
    const representative = findRepresentativeForTask(task);
    const targetStatus = task["推奨列"] || "Need Review";
    const card = document.createElement("article");
    card.className = `candidate-card${index === state.selectedCandidateIndex ? " selected" : ""}`;
    card.tabIndex = 0;
    card.dataset.candidateIndex = String(index);
    if (representative?.session_id) {
      card.dataset.representativeSessionId = representative.session_id;
    }
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
        <button class="secondary candidate-view" data-candidate-action="view">${escapeHtml(t("previewCandidate"))}</button>
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
  renderCandidateReviewPanel();
}

function renderCandidateReviewPanel() {
  const host = document.getElementById("candidate-review-grid");
  if (!host) return;
  const displaySessions = getDisplaySessions();
  const allCandidates = state.boardData?.suggested_tasks || [];
  const fixedCandidateIds = new Set();
  let openCandidateCount = 0;
  allCandidates.forEach((task) => {
    const representative = findRepresentativeForTask(task);
    if (representative && state.overrides[representative.session_id]?.status) {
      fixedCandidateIds.add(representative.session_id);
    } else {
      openCandidateCount += 1;
    }
  });
  const qualityReview = displaySessions.filter((item) => !auditExtractionQuality(item).ok);
  const lineageSessions = displaySessions.filter((item) => lineageInfo(item).hasMerged);
  const rows = [
    { label: t("candidateOpen"), count: openCandidateCount, items: allCandidates.slice(0, 3).map((task) => displayTaskTitle(task)).filter(Boolean), action: "open" },
    { label: t("candidateFixed"), count: fixedCandidateIds.size, items: [...fixedCandidateIds].slice(0, 3).map((id) => displayTaskTitle(displaySessions.find((item) => item.session_id === id) || { title: id })) },
    { label: t("candidateQualityReview"), count: qualityReview.length, items: qualityReview.slice(0, 3).map(displayTaskTitle), attention: "quality-review" },
    { label: t("candidateLineage"), count: lineageSessions.length, items: lineageSessions.slice(0, 3).map(displayTaskTitle), attention: "lineage" },
  ];
  host.innerHTML = rows
    .map(
      (row, index) => `
        <div class="candidate-review-card${row.action || row.attention ? " actionable" : ""}" data-review-row="${index}">
          <div class="candidate-review-count">${escapeHtml(row.count)}</div>
          <strong>${escapeHtml(row.label)}</strong>
          <ul>${row.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("") || "<li>n/a</li>"}</ul>
          ${row.action || row.attention ? `<button class="secondary tiny candidate-review-filter" type="button" data-review-action="${escapeHtml(row.action || "attention")}" data-review-attention="${escapeHtml(row.attention || "all")}">${escapeHtml(t("quickFilter"))}</button>` : ""}
        </div>`
    )
    .join("");
  host.querySelectorAll("[data-review-action]").forEach((button) => {
    button.addEventListener("click", () => {
      state.search = "";
      state.repo = "all";
      state.status = "all";
      state.cluster = "all";
      state.attention = button.dataset.reviewAction === "attention" ? button.dataset.reviewAttention || "all" : "all";
      state.selectedCandidateIndex = 0;
      const searchInput = document.getElementById("search-input");
      if (searchInput) searchInput.value = "";
      renderRepoFilter();
      renderStatusFilter();
      renderClusterFilter();
      renderAttentionFilter();
      renderCandidateStrip();
      renderBoard();
      document.getElementById("candidate-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
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
  updateFilterSummary(visible, null);
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
      const quality = auditExtractionQuality(session);
      const stats = lightweightStats(session);
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
          <span class="tag provider">${escapeHtml(providerLabel(session))}</span>
          <span class="tag">${escapeHtml(session.recency_label || t("recent"))}</span>
          <span class="tag ${escapeHtml(session.autonomy_mode || "")}">${escapeHtml(localizeAutonomyMode(session.autonomy_mode))}</span>
          ${session.clusterCard ? `<span class="tag">${escapeHtml(t("cluster"))}</span>` : ""}
          ${attentionSignals(session).needsInput ? `<span class="tag attention">${escapeHtml(t("needsInput"))}</span>` : ""}
          ${cardLineage.hasMerged ? `<span class="tag lineage">${escapeHtml(cardLineage.badge)}</span>` : ""}
          ${stats.highActivity ? `<span class="tag signal">${escapeHtml(t("highActivity"))}</span>` : ""}
          ${stats.largeSession ? `<span class="tag signal">${escapeHtml(t("largeSession"))}</span>` : ""}
          <span class="tag ${quality.ok ? "quality-ok" : "quality-review"}">${escapeHtml(quality.ok ? t("qualityOk") : t("qualityReview"))}</span>
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
          <span class="tag">${escapeHtml(t("textUnits"))} ~${stats.estimatedTokens}</span>
        </div>
      `;
      card.addEventListener("click", () => {
        selectBoardSession(session.session_id);
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
  selectBoardSession(sessionId);
  renderBoard();
  renderDetail();
}

function selectAdjacentCandidate(direction) {
  const candidates = getOpenCandidateTasks();
  if (!candidates.length) return;
  const nextIndex = Math.max(0, Math.min(candidates.length - 1, (state.selectedCandidateIndex || 0) + direction));
  state.selectedCandidateIndex = nextIndex;
  renderCandidateStrip();
  renderCandidateDetail(candidates[nextIndex]);
  requestAnimationFrame(() => {
    document.querySelector(`.candidate-card[data-candidate-index="${CSS.escape(String(nextIndex))}"]`)?.focus();
  });
}

function previewSelectedCandidate() {
  const candidates = getOpenCandidateTasks();
  const task = candidates[state.selectedCandidateIndex || 0];
  if (task) renderCandidateDetail(task);
}

function addSelectedCandidate() {
  const candidates = getOpenCandidateTasks();
  const task = candidates[state.selectedCandidateIndex || 0];
  if (task) addCandidateTask(task);
}

function candidateFocusActive() {
  return Boolean(document.activeElement?.closest?.("#candidate-list"));
}

function selectAdjacentSession(direction) {
  const visible = getVisibleSessions();
  if (!visible.length) return;
  const ordered = STATUSES.flatMap((status) =>
    visible.filter((item) => item.currentStatus === status).sort(compareSessionsWithinColumn)
  );
  const currentIndex = ordered.findIndex((item) => item.session_id === state.selectedId);
  const nextIndex = currentIndex < 0 ? 0 : Math.max(0, Math.min(ordered.length - 1, currentIndex + direction));
  selectBoardSession(ordered[nextIndex].session_id);
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

function selectedRelatedSessions(session, mergedSessions = getMergedSessions()) {
  if (!session) return [];
  const family = session.task_cluster_family || session.task_cluster_label;
  return mergedSessions
    .filter((item) => (item.task_cluster_family || item.task_cluster_label) === family && item.session_id !== session.session_id)
    .slice(0, 6);
}

function copySelectedCardBrief() {
  const merged = getMergedSessions();
  const session = merged.find((item) => item.session_id === state.selectedId);
  if (!session) return;
  navigator.clipboard?.writeText(cardBriefText(session, selectedRelatedSessions(session, merged))).catch(() => {});
}

function isTypingTarget(target) {
  const tag = String(target?.tagName || "").toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || Boolean(target?.isContentEditable);
}

function clearFilters() {
  state.search = "";
  state.repo = "all";
  state.status = "all";
  state.cluster = "all";
  state.attention = "all";
  state.selectedCandidateIndex = 0;
  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.value = "";
  renderRepoFilter();
  renderStatusFilter();
  renderClusterFilter();
  renderAttentionFilter();
  renderBoard();
  renderDetail();
}

function handleKeyboardTriage(event) {
  if (event.ctrlKey || event.metaKey) return;
  if (isTypingTarget(event.target)) {
    if (event.key === "Escape") {
      const workflowHelp = document.getElementById("workflow-help");
      if (workflowHelp && !workflowHelp.hidden) {
        workflowHelp.hidden = true;
        event.preventDefault();
      }
    }
    return;
  }
  if (event.key === "/" && !event.shiftKey) {
    event.preventDefault();
    const searchInput = document.getElementById("search-input");
    searchInput?.focus();
    searchInput?.select?.();
    return;
  }
  if (event.key === "?" || (event.key === "/" && event.shiftKey)) {
    event.preventDefault();
    const workflowHelp = document.getElementById("workflow-help");
    if (workflowHelp) workflowHelp.hidden = !workflowHelp.hidden;
    return;
  }
  if (event.key === "Escape") {
    const workflowHelp = document.getElementById("workflow-help");
    if (workflowHelp && !workflowHelp.hidden) {
      workflowHelp.hidden = true;
      event.preventDefault();
    }
    return;
  }
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
  const inCandidateList = candidateFocusActive();
  if (event.key === "j") {
    event.preventDefault();
    if (inCandidateList) selectAdjacentCandidate(1);
    else selectAdjacentSession(1);
  } else if (event.key === "k") {
    event.preventDefault();
    if (inCandidateList) selectAdjacentCandidate(-1);
    else selectAdjacentSession(-1);
  } else if (inCandidateList && event.key === "Enter") {
    event.preventDefault();
    previewSelectedCandidate();
  } else if (inCandidateList && event.key.toLowerCase() === "a") {
    event.preventDefault();
    addSelectedCandidate();
  } else if (event.key.toLowerCase() === "x") {
    event.preventDefault();
    clearFilters();
  } else if (/^[1-6]$/.test(event.key)) {
    event.preventDefault();
    setSelectedStatusByIndex(Number(event.key) - 1);
  } else if (event.key.toLowerCase() === "c") {
    event.preventDefault();
    copySelectedSessionId();
  } else if (event.key.toLowerCase() === "b") {
    event.preventDefault();
    copySelectedCardBrief();
  }
}

function cardBriefText(session, relatedSessions = []) {
  const evidence = displayEvidenceMessages(session).filter(Boolean).slice(0, 3);
  const lines = [
    `# ${displayTaskTitle(session)}`,
    `status: ${statusLabel(session.currentStatus)}`,
    `repo: ${session.primary_repo || "unknown"}`,
    `session_id: ${session.session_id}`,
    `summary: ${displayTaskSummary(session)}`,
    `next_action: ${displayNextAction(session) || "n/a"}`,
    `reason: ${displayReason(session) || session.suggested_reason || "n/a"}`,
  ];
  if (relatedSessions.length || Number(session.related_session_count || 1) > 1) {
    lines.push(`related_sessions: ${Math.max(Number(session.related_session_count || 1), relatedSessions.length + 1)}`);
  }
  if (evidence.length) {
    lines.push("evidence:");
    evidence.forEach((item) => lines.push(`- ${item}`));
  }
  return lines.join("\n");
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
  const relatedSessions = selectedRelatedSessions(session, merged);
  const rationale = buildCardRationale(session, relatedSessions);
  const detailLineage = lineageInfo(session, relatedSessions);
  const taskMap = relatedTaskMap(session, displaySessions);
  const suppressedLineage = buildSuppressedLineage(session, merged);
  const quality = auditExtractionQuality(session);
  const stats = lightweightStats(session);
  const extractionDebug = extractionDebugInfo(session, relatedSessions);
  const evidenceCategories = buildEvidenceCategories(session);

  panel.innerHTML = `
    <h2>${escapeHtml(displayTaskTitle(session))}</h2>
    <div class="detail-meta">
      <span class="tag">${escapeHtml(session.primary_repo || t("unknownRepo"))}</span>
      <span class="tag provider">${escapeHtml(providerLabel(session))}</span>
      <span class="tag">${escapeHtml(statusLabel(session.currentStatus))}</span>
      <span class="tag ${escapeHtml(session.autonomy_mode || "")}">${escapeHtml(localizeAutonomyMode(session.autonomy_mode))}</span>
      ${attentionSignals(session).needsInput ? `<span class="tag attention">${escapeHtml(t("needsInput"))}</span>` : ""}
      ${detailLineage.hasMerged ? `<span class="tag lineage">${escapeHtml(detailLineage.badge)}</span>` : ""}
      ${stats.highActivity ? `<span class="tag signal">${escapeHtml(t("highActivity"))}</span>` : ""}
      ${stats.largeSession ? `<span class="tag signal">${escapeHtml(t("largeSession"))}</span>` : ""}
      <span class="tag ${quality.ok ? "quality-ok" : "quality-review"}">${escapeHtml(quality.ok ? t("qualityOk") : t("qualityReview"))} ${quality.score}</span>
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
      <div class="session-id-actions">
        <button class="secondary tiny" id="copy-session-id">${escapeHtml(t("copySessionId"))}</button>
        <button class="secondary tiny" id="copy-card-link">${escapeHtml(t("copyCardLink"))}</button>
        <button class="secondary tiny" id="copy-card-brief">${escapeHtml(t("copyCardBrief"))}</button>
      </div>
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
      <h3>${escapeHtml(t("extractionDebug"))}</h3>
      <div class="debug-grid">
        <div class="debug-card">
          <strong>${escapeHtml(t("titleSource"))}</strong>
          <p>${escapeHtml(displayOriginalText(extractionDebug.titleSource || displayTaskTitle(session)))}</p>
        </div>
        <div class="debug-card">
          <strong>${escapeHtml(t("summarySource"))}</strong>
          <p>${escapeHtml(displayOriginalText(extractionDebug.summarySource || displayTaskSummary(session)))}</p>
        </div>
        <div class="debug-card">
          <strong>${escapeHtml(t("discardedTopicSignals"))}</strong>
          <ul>${extractionDebug.discardedSignals.map((item) => `<li>${escapeHtml(displayOriginalText(item))}</li>`).join("") || `<li>${escapeHtml(t("debugNoSignals"))}</li>`}</ul>
        </div>
        <div class="debug-card">
          <strong>${escapeHtml(t("debugRules"))}</strong>
          <ul>${extractionDebug.rules.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        </div>
      </div>
    </div>

    <div class="detail-section">
      <h3>${escapeHtml(t("evidenceCategories"))}</h3>
      <div class="evidence-category-grid">
        ${evidenceCategories
          .map(
            (group) => `
              <div class="evidence-category-card ${escapeHtml(group.category)}">
                <strong>${escapeHtml(evidenceCategoryLabel(group.category))}</strong>
                <ul>${group.items.map((item) => `<li>${escapeHtml(displayOriginalText(item))}</li>`).join("")}</ul>
              </div>`
          )
          .join("") || `<p>${escapeHtml(t("qualityWeakEvidence"))}</p>`}
      </div>
    </div>

    <div class="detail-section">
      <h3>${escapeHtml(t("lightweightStats"))}</h3>
      <div class="reason-box stats-box">
        <div><strong>${escapeHtml(t("estimatedText"))}:</strong> ${escapeHtml(t("textUnits"))} ~${stats.estimatedTokens} / ${stats.textSizeChars} chars</div>
        <div><strong>${escapeHtml(t("commandCount"))}:</strong> ${stats.commandCount} / <strong>${escapeHtml(t("score"))}:</strong> ${stats.activityScore}</div>
        <div><strong>${escapeHtml(t("prioritizationSignals"))}:</strong> ${stats.flags.length ? stats.flags.map((flag) => escapeHtml(flag)).join(" / ") : "n/a"}</div>
      </div>
    </div>

    <div class="detail-section">
      <h3>${escapeHtml(t("qualityCheck"))}</h3>
      <div class="reason-box quality-box ${quality.ok ? "ok" : "review"}">
        <div><strong>${escapeHtml(quality.ok ? t("qualityOk") : t("qualityReview"))}</strong> / score ${quality.score}</div>
        <div>
          <strong>${escapeHtml(t("qualityIssues"))}:</strong>
          <ul>${quality.issues.map((item) => `<li>${escapeHtml(item)}</li>`).join("") || `<li>${escapeHtml(t("qualityOk"))}</li>`}</ul>
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
      <h3>${escapeHtml(t("extractionTimeline"))}</h3>
      <div class="timeline-list">
        ${buildExtractionTimeline(session, relatedSessions)
          .map(
            (item) => `
              <div class="timeline-item">
                <span>${escapeHtml(item.label)}</span>
                <strong>${escapeHtml(item.value)}</strong>
              </div>`
          )
          .join("") || `<p>${escapeHtml(t("timelineNotAvailable"))}</p>`}
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
      <h3>${escapeHtml(t("suppressedSessions"))}</h3>
      <div class="reason-box suppressed-box">
        <div><strong>${escapeHtml(t("representativeReason"))}:</strong> ${escapeHtml(suppressedLineage.representativeReason)}</div>
        <p class="small">${escapeHtml(t("suppressedReason"))}</p>
        ${
          suppressedLineage.rows.length
            ? `<div class="suppressed-session-list">${suppressedLineage.rows
                .slice(0, 8)
                .map(
                  (item) => `
                    <button class="suppressed-session" data-related-id="${escapeHtml(item.session_id)}">
                      <span>${escapeHtml(displayTaskTitle(item))}</span>
                      <small>${escapeHtml(formatTimelineDate(item.end_at || item.start_at))} / sid ${escapeHtml(shortSessionId(item.session_id))} / ${escapeHtml(statusLabel(item.currentStatus || item.suggested_status))}</small>
                    </button>`
                )
                .join("")}</div>`
            : `<p>${escapeHtml(t("representativeOnly"))}</p>`
        }
      </div>
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
      <p class="small">${escapeHtml(t("provider"))}: <span class="mono">${escapeHtml(providerLabel(session))}</span>${session.provider_session_type ? ` / <span class="mono">${escapeHtml(session.provider_session_type)}</span>` : ""}</p>
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
  document.getElementById("copy-card-link")?.addEventListener("click", () => {
    navigator.clipboard.writeText(cardLinkForSession(session.session_id)).catch((error) => alert(t("copyFailed", { message: error.message })));
  });
  document.getElementById("copy-card-brief")?.addEventListener("click", () => {
    navigator.clipboard.writeText(cardBriefText(session, relatedSessions)).catch((error) => alert(t("copyFailed", { message: error.message })));
  });
  syncSelectedHash(session.session_id);

  document.getElementById("quick-status").addEventListener("change", (event) => {
    setOverride(session.session_id, { status: event.target.value, notes: session.reviewNotes || "" });
    renderBoard();
    renderDetail();
  });

  panel.querySelectorAll("[data-related-id]").forEach((button) => {
    button.addEventListener("click", () => {
      selectBoardSession(button.dataset.relatedId);
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

function validateImportedSessions(sessions) {
  const required = ["session_id", "title", "summary", "suggested_status", "primary_repo", "start_at", "end_at"];
  const allowedStatuses = new Set(STATUSES);
  const missing = [];
  const invalidStatuses = [];
  const duplicateIds = [];
  const invalidTimestamps = [];
  const brokenRelatedIds = [];
  const privacy = [];
  const seenIds = new Set();
  const allIds = new Set(sessions.map((session, index) => session.session_id || `#${index + 1}`));
  const privatePattern = /(C:\\Users\\|\\Users\\|\/Users\/|\/home\/|token|api[_-]?key|cookie|bypass|secret|password|credential)/i;
  sessions.forEach((session, index) => {
    const label = session.session_id || `#${index + 1}`;
    const missingFields = required.filter((field) => !session[field]);
    if (missingFields.length) {
      missing.push(`${label}: ${missingFields.join(", ")}`);
    }
    if (session.session_id) {
      if (seenIds.has(session.session_id)) duplicateIds.push(session.session_id);
      seenIds.add(session.session_id);
    }
    const status = session.suggested_status || session.currentStatus;
    if (status && !allowedStatuses.has(status)) {
      invalidStatuses.push(`${label}: ${status}`);
    }
    ["start_at", "end_at"].forEach((field) => {
      if (session[field] && Number.isNaN(new Date(session[field]).getTime())) {
        invalidTimestamps.push(`${label}: ${field}=${session[field]}`);
      }
    });
    (session.related_session_ids || []).forEach((relatedId) => {
      if (!allIds.has(relatedId)) {
        brokenRelatedIds.push(`${label}: ${relatedId}`);
      }
    });
    const searchable = JSON.stringify(session);
    if (privatePattern.test(searchable)) {
      privacy.push(label);
    }
  });
  return {
    sessionCount: sessions.length,
    missing,
    invalidStatuses,
    duplicateIds: [...new Set(duplicateIds)],
    invalidTimestamps,
    brokenRelatedIds,
    privacy: [...new Set(privacy)],
    ok: missing.length === 0 && invalidStatuses.length === 0 && duplicateIds.length === 0 && invalidTimestamps.length === 0 && brokenRelatedIds.length === 0 && privacy.length === 0,
  };
}

function renderImportValidationReport(report) {
  const panel = document.getElementById("detail-panel");
  if (!panel || !report) return;
  const warningCount = report.missing.length + report.invalidStatuses.length + report.duplicateIds.length + report.invalidTimestamps.length + report.brokenRelatedIds.length + report.privacy.length;
  panel.innerHTML = `
    <h2>${escapeHtml(t("importValidationTitle"))}</h2>
    <div class="detail-meta">
      <span class="tag">${escapeHtml(t("sessions"))}: ${escapeHtml(report.sessionCount)}</span>
      <span class="tag ${warningCount ? "quality-review" : "quality-ok"}">${escapeHtml(t("importWarnings"))}: ${warningCount}</span>
    </div>
    <div class="reason-box import-validation-box ${warningCount ? "review" : "ok"}">
      <div><strong>${escapeHtml(t("importValidationSummary"))}:</strong> ${escapeHtml(warningCount ? t("importWarnings") : t("importNoWarnings"))}</div>
      <div>
        <strong>${escapeHtml(t("importMissingFields"))}</strong>
        <ul>${report.missing.map((item) => `<li>${escapeHtml(item)}</li>`).join("") || `<li>${escapeHtml(t("importNoWarnings"))}</li>`}</ul>
      </div>
      <div>
        <strong>${escapeHtml(t("importInvalidStatuses"))}</strong>
        <ul>${report.invalidStatuses.map((item) => `<li>${escapeHtml(item)}</li>`).join("") || `<li>${escapeHtml(t("importNoWarnings"))}</li>`}</ul>
      </div>
      <div>
        <strong>${escapeHtml(t("importDuplicateIds"))}</strong>
        <ul>${report.duplicateIds.map((item) => `<li>${escapeHtml(item)}</li>`).join("") || `<li>${escapeHtml(t("importNoWarnings"))}</li>`}</ul>
      </div>
      <div>
        <strong>${escapeHtml(t("importInvalidTimestamps"))}</strong>
        <ul>${report.invalidTimestamps.map((item) => `<li>${escapeHtml(item)}</li>`).join("") || `<li>${escapeHtml(t("importNoWarnings"))}</li>`}</ul>
      </div>
      <div>
        <strong>${escapeHtml(t("importBrokenRelatedIds"))}</strong>
        <ul>${report.brokenRelatedIds.map((item) => `<li>${escapeHtml(item)}</li>`).join("") || `<li>${escapeHtml(t("importNoWarnings"))}</li>`}</ul>
      </div>
      <div>
        <strong>${escapeHtml(t("importPrivacySignals"))}</strong>
        <ul>${report.privacy.map((item) => `<li>${escapeHtml(item)}</li>`).join("") || `<li>${escapeHtml(t("importNoWarnings"))}</li>`}</ul>
      </div>
      <p class="small">${escapeHtml(t("importValidationHint"))}</p>
    </div>
  `;
}


function compactText(value, limit = 180) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 1).trim()}…`;
}

function providerStatus(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (["done", "completed", "complete", "success", "closed"].includes(raw)) return "Done";
  if (["dropped", "cancelled", "canceled", "wontfix", "archived"].includes(raw)) return "Dropped";
  if (["blocked", "error", "failed", "waiting-on-user"].includes(raw)) return "Blocked";
  if (["pending", "waiting", "paused", "todo", "backlog"].includes(raw)) return "Pending";
  if (["in progress", "in_progress", "active", "running", "working"].includes(raw)) return "In Progress";
  return STATUSES.includes(value) ? value : "Need Review";
}

function inferProvider(item, boardProvider) {
  if (item.provider || item.source_tool || item.tool || boardProvider) return item.provider || item.source_tool || item.tool || boardProvider;
  if ((item.uuid || item.cwd) && (item.messages || item.transcript)) return "claude-code";
  if ((item.workspace && item.conversation) || item.cursor_session_id) return "cursor-agent";
  if ((item.history && item.model) || item.gemini_session_id) return "gemini-cli";
  return "generic-ai-session";
}

function contentToText(content) {
  if (!content) return "";
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content.map((part) => {
      if (typeof part === "string") return part;
      if (part && typeof part === "object") return part.text || part.content || part.value || "";
      return String(part || "");
    }).filter(Boolean).join("\n").trim();
  }
  if (typeof content === "object") {
    if (Array.isArray(content.parts)) return contentToText(content.parts);
    return String(content.text || content.content || content.message || content.value || "").trim();
  }
  return String(content).trim();
}

function providerMessages(item) {
  const rawMessages = item.timeline_messages || item.messages || item.conversation || item.turns || item.history || item.events || [];
  if (!Array.isArray(rawMessages)) return [];
  return rawMessages.map((raw) => {
    let role = "user";
    let text = "";
    if (Array.isArray(raw)) {
      role = String(raw[0] || "user").toLowerCase();
      text = contentToText(raw[1]);
    } else if (raw && typeof raw === "object") {
      role = String(raw.role || raw.speaker || raw.type || "user").toLowerCase();
      text = contentToText(raw.content || raw.message || raw.text || raw.parts);
    } else {
      text = contentToText(raw);
    }
    if (["assistant", "model", "agent", "ai"].includes(role)) role = "assistant";
    else if (["system", "tool", "function"].includes(role)) role = "system";
    else role = "user";
    return { role, text };
  }).filter((item) => item.text);
}

function repoFromProviderItem(item) {
  const explicit = item.primary_repo || item.repo || item.repository || item.project || item.workspace_name;
  if (explicit) return String(explicit);
  const pathValue = item.workspace || item.cwd || item.session_cwd || item.project_path;
  if (pathValue) {
    const parts = String(pathValue).replace(/\\/g, "/").replace(/\/$/, "").split("/");
    return parts[parts.length - 1] || "unknown";
  }
  return "unknown";
}

function slugify(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}


function estimateTextUnits(source, evidence = [], messages = []) {
  const fields = [
    source?.title,
    source?.summary,
    source?.task_body_summary,
    source?.current_goal,
    source?.deep_summary,
    source?.latest_meaningful_change,
    source?.latest_phase_context,
    source?.blocker,
    source?.first_user_message,
    source?.last_user_message,
    source?.last_assistant_message,
    source?.suggested_reason,
    ...(Array.isArray(evidence) ? evidence : []),
    ...(Array.isArray(messages) ? messages.map((item) => item.text || item.message || item.content || "") : []),
  ];
  const chars = fields.filter(Boolean).map((item) => String(item)).join("\n").length;
  return { chars, tokens: chars ? Math.ceil(chars / 4) : 0 };
}

function lightweightStats(session) {
  const estimatedTokens = Number(session.estimated_tokens || 0);
  const textSizeChars = Number(session.text_size_chars || estimatedTokens * 4 || 0);
  const commandCount = Number(session.command_count || 0);
  const activityScore = Number(session.activity_score || 0);
  const relatedCount = Number(session.related_session_count || 1);
  const highActivity = Boolean(session.high_activity_signal) || commandCount >= 25 || activityScore >= 120;
  const largeSession = Boolean(session.large_session_signal) || estimatedTokens >= 700 || commandCount >= 50;
  const flags = new Set(Array.isArray(session.prioritization_flags) ? session.prioritization_flags : []);
  if (highActivity) flags.add("high-activity");
  if (largeSession) flags.add("large-session");
  if (relatedCount >= 2) flags.add("multi-session");
  return { estimatedTokens, textSizeChars, commandCount, activityScore, relatedCount, highActivity, largeSession, flags: [...flags] };
}

function normalizeProviderSession(item, index, boardProvider) {
  const source = item && typeof item === "object" ? item : { summary: String(item || "") };
  const provider = inferProvider(source, boardProvider);
  const messages = providerMessages(source);
  const userMessages = messages.filter((msg) => msg.role === "user").map((msg) => msg.text);
  const assistantMessages = messages.filter((msg) => msg.role === "assistant").map((msg) => msg.text);
  const evidence = Array.isArray(source.evidence_messages) && source.evidence_messages.length
    ? source.evidence_messages
    : [...userMessages, ...assistantMessages].slice(0, 4).map((text) => compactText(text));
  const title = source.title || source.title_ja || source.title_en || source.current_goal || source.goal || compactText(userMessages[userMessages.length - 1] || source.summary || source.prompt || `Imported ${provider} session ${index + 1}`, 80);
  const summary = source.summary || source.summary_ja || source.summary_en || source.current_goal || source.goal || compactText(source.description || source.prompt || evidence.slice(0, 2).join(" / ") || title, 220);
  const sessionId = source.session_id || source.id || source.uuid || source.conversation_id || source.cursor_session_id || source.gemini_session_id || source.name || `imported-${provider}-${index + 1}`;
  const startAt = source.start_at || source.created_at || source.createdAt || source.timestamp || source.startTime || source.end_at || new Date().toISOString();
  const endAt = source.end_at || source.updated_at || source.updatedAt || source.lastUpdated || source.endTime || startAt;
  const primaryRepo = repoFromProviderItem(source);
  const textStats = estimateTextUnits(source, evidence, messages);
  const base = {
    ...source,
    session_id: String(sessionId),
    title: String(title),
    summary: String(summary),
    suggested_status: providerStatus(source.suggested_status || source.currentStatus || source.status || source.state),
    primary_repo: primaryRepo,
    start_at: String(startAt),
    end_at: String(endAt),
    evidence_messages: evidence,
    first_user_message: source.first_user_message || userMessages[0] || "",
    last_assistant_message: source.last_assistant_message || assistantMessages[assistantMessages.length - 1] || "",
    user_message_count: source.user_message_count || userMessages.length,
    assistant_message_count: source.assistant_message_count || assistantMessages.length,
    command_count: source.command_count || messages.filter((msg) => msg.role === "system").length,
    activity_score: source.activity_score || Math.max(1, messages.length * 8 + evidence.length * 5),
    text_size_chars: source.text_size_chars || textStats.chars,
    estimated_tokens: source.estimated_tokens || textStats.tokens,
    high_activity_signal: Boolean(source.high_activity_signal) || Number(source.command_count || 0) >= 25 || Number(source.activity_score || 0) >= 120,
    large_session_signal: Boolean(source.large_session_signal) || Number(source.estimated_tokens || textStats.tokens) >= 700 || Number(source.command_count || 0) >= 50,
    prioritization_flags: Array.isArray(source.prioritization_flags) ? source.prioritization_flags : [],
    provider,
    provider_session_type: source.provider_session_type || source.format || `${provider}-import`,
    provider_source: source.provider_source || source.source || "provider-import",
  };
  const clusterKey = base.task_cluster_key || base.topic_key || `${primaryRepo}:${slugify(title) || base.session_id}`;
  return {
    ...base,
    task_cluster_key: base.task_cluster_key || clusterKey,
    topic_key: base.topic_key || clusterKey,
    lineage_key: base.lineage_key || clusterKey,
    task_cluster_label: base.task_cluster_label || base.topic_label || String(title),
    topic_label: base.topic_label || base.task_cluster_label || String(title),
    lineage_label: base.lineage_label || base.task_cluster_label || String(title),
  };
}

function normalizeImportedBoardData(raw) {
  const sessions = Array.isArray(raw) ? raw : (raw?.sessions || raw?.conversations || raw?.items);
  if (!Array.isArray(sessions)) {
    throw new Error(t("invalidSessionData"));
  }
  const boardProvider = Array.isArray(raw) ? null : (raw?.provider || raw?.source_tool);
  const normalizedSessions = sessions.map((item, index) => normalizeProviderSession(item, index, boardProvider));
  const providers = [...new Set(normalizedSessions.map((item) => item.provider || "generic-ai-session"))].sort();
  const board = {
    ...(Array.isArray(raw) ? {} : raw),
    generated_at: raw?.generated_at || new Date().toISOString(),
    source: raw?.source || "local-import",
    schema_version: raw?.schema_version || "0.2.1",
    supported_providers: raw?.supported_providers || providers,
    surface_mode: raw?.surface_mode || "personal",
    sessions: normalizedSessions,
  };
  if (!Array.isArray(board.task_clusters)) {
    board.task_clusters = deriveClientTaskClusters(board.sessions);
  }
  if (!Array.isArray(board.suggested_tasks)) {
    board.suggested_tasks = deriveClientSuggestedTasks(board.task_clusters);
  }
  return board;
}

function deriveClientTaskClusters(sessions) {
  const groups = new Map();
  for (const session of sessions) {
    const label = session.topic_label || session.task_cluster_family || session.task_cluster_label || session.primary_repo || "Imported sessions";
    const key = session.topic_key || session.lineage_key || session.task_cluster_key || label;
    const row = groups.get(key) || {
      cluster_key: key,
      cluster_label: label,
      primary_repos: [],
      session_ids: [],
      status_counts: {},
      representative_titles: [],
      max_confidence: 0,
      latest_end_at: null,
      latest_status: null,
      latest_title: null,
      latest_blocker: null,
      latest_meaningful_change: null,
    };
    row.session_ids.push(session.session_id);
    if (session.primary_repo && !row.primary_repos.includes(session.primary_repo)) row.primary_repos.push(session.primary_repo);
    if (session.title && !row.representative_titles.includes(session.title) && row.representative_titles.length < 3) row.representative_titles.push(session.title);
    const status = session.suggested_status || "Need Review";
    row.status_counts[status] = (row.status_counts[status] || 0) + 1;
    row.max_confidence = Math.max(row.max_confidence, Number(session.suggested_confidence || 0));
    const endAt = session.end_at || session.start_at;
    if (endAt && (!row.latest_end_at || new Date(endAt) > new Date(row.latest_end_at))) {
      row.latest_end_at = endAt;
      row.latest_status = status;
      row.latest_title = session.title;
      row.latest_blocker = session.blocker || session.blocker_en || null;
      row.latest_meaningful_change = session.latest_meaningful_change || session.latest_meaningful_change_en || session.summary || "";
    }
    groups.set(key, row);
  }
  return [...groups.values()].map((row) => {
    const statusEntries = Object.entries(row.status_counts).sort((a, b) => b[1] - a[1]);
    return {
      ...row,
      session_count: row.session_ids.length,
      dominant_status: statusEntries[0]?.[0] || "Need Review",
    };
  });
}

function deriveClientSuggestedTasks(taskClusters) {
  return taskClusters
    .filter((cluster) => cluster.dominant_status !== "Done")
    .map((cluster) => {
      const status = cluster.latest_status || cluster.dominant_status || "Need Review";
      return {
        task_id: String(cluster.cluster_key || cluster.cluster_label || "task").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "task",
        cluster_key: cluster.cluster_key,
        title_ja: cluster.latest_title || cluster.cluster_label || "Imported task",
        title_en: cluster.latest_title || cluster.cluster_label || "Imported task",
        task_size_ja: cluster.session_count >= 3 || (cluster.primary_repos || []).length >= 2 ? "大タスク" : "中タスク",
        "推奨列": status,
        "理由": `${cluster.session_count || 1} sessions / ${cluster.primary_repos?.join(", ") || "unknown repo"}`,
        "状態判断理由": `Imported latest status: ${status}`,
        "次の一手": "Review the representative session and choose the next status.",
        cluster_label: cluster.cluster_label,
        primary_repos: cluster.primary_repos || [],
        session_count: cluster.session_count || 1,
        representative_titles: cluster.representative_titles || [],
        priority_score: ({ Blocked: 100, "Need Review": 80, "In Progress": 60, Pending: 40 }[status] || 20) + (cluster.session_count || 1) * 10,
      };
    })
    .sort((a, b) => Number(b.priority_score || 0) - Number(a.priority_score || 0));
}

function applyBoardData(boardData) {
  state.boardData = boardData;
  state.sessions = state.boardData.sessions || [];
  state.selectedId = state.sessions[0]?.session_id || null;
  state.repo = "all";
  state.status = "all";
  state.cluster = "all";
  state.search = "";
  updateHeroMeta();
  renderRepoFilter();
  renderStatusFilter();
  renderClusterFilter();
  renderAttentionFilter();
  renderCandidateStrip();
  renderBoard();
  renderDetail();
}

function sampleJsonText() {
  const payload = {
    generated_at: state.boardData?.generated_at || new Date().toISOString(),
    source: "sample-fixture-public",
    schema_version: state.boardData?.schema_version || "0.2.0",
    surface_mode: "distribution",
    supported_providers: state.boardData?.supported_providers || ["codex"],
    sessions: state.originalBoardData?.sessions || state.sessions || [],
  };
  return JSON.stringify(payload, null, 2);
}

function downloadSampleJson() {
  const blob = new Blob([sampleJsonText()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "codex-session-kanban-sample.json";
  a.click();
  URL.revokeObjectURL(url);
}

async function copySampleJson() {
  await navigator.clipboard.writeText(sampleJsonText());
  alert(t("copiedSampleJson"));
}

function importSessionData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = normalizeImportedBoardData(JSON.parse(reader.result));
      const report = validateImportedSessions(imported.sessions);
      applyBoardData(imported);
      renderImportValidationReport(report);
      alert(t("importedSessionData", { count: imported.sessions.length }));
    } catch (error) {
      alert(t("invalidJson", { message: error.message }));
    }
  };
  reader.readAsText(file);
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
  state.originalBoardData = JSON.parse(JSON.stringify(state.boardData));
  state.sessions = state.boardData.sessions || [];
  state.overrides = loadOverrides();
  const hashSelectedId = selectedSessionIdFromHash();
  state.selectedId = state.sessions.some((item) => item.session_id === hashSelectedId) ? hashSelectedId : state.sessions[0]?.session_id || null;

  applyStaticI18n();
  updateHeroMeta();
  initPaneAutomationControl();
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
      renderPaneAutomationControl();
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
    state.selectedCandidateIndex = 0;
    renderCandidateStrip();
    renderBoard();
  });

  document.getElementById("repo-filter").addEventListener("change", (event) => {
    state.repo = event.target.value;
    state.selectedCandidateIndex = 0;
    renderCandidateStrip();
    renderBoard();
  });
  document.getElementById("status-filter").addEventListener("change", (event) => {
    state.status = event.target.value;
    state.selectedCandidateIndex = 0;
    renderCandidateStrip();
    renderBoard();
  });
  document.getElementById("cluster-filter").addEventListener("change", (event) => {
    state.cluster = event.target.value;
    state.selectedCandidateIndex = 0;
    renderCandidateStrip();
    renderBoard();
  });
  document.getElementById("attention-filter")?.addEventListener("change", (event) => {
    state.attention = event.target.value;
    state.selectedCandidateIndex = 0;
    renderCandidateStrip();
    renderBoard();
  });
  document.getElementById("clear-filters")?.addEventListener("click", clearFilters);

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
    event.target.value = "";
  });
  document.getElementById("import-session-file")?.addEventListener("change", (event) => {
    importSessionData(event.target.files?.[0]);
    event.target.value = "";
  });
  document.getElementById("reset-demo-data")?.addEventListener("click", () => {
    applyBoardData(JSON.parse(JSON.stringify(state.originalBoardData)));
  });
  document.getElementById("download-sample-json")?.addEventListener("click", downloadSampleJson);
  document.getElementById("copy-sample-json")?.addEventListener("click", () => {
    copySampleJson().catch((error) => alert(t("copyFailed", { message: error.message })));
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

