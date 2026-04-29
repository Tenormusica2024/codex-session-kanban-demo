#!/usr/bin/env node
/**
 * Browser smoke test for Codex Session Kanban.
 *
 * This is intentionally a small Playwright check, not a full E2E suite:
 * - loads a public URL or local HTML file
 * - verifies visible board/candidate/detail UI
 * - switches to English and checks common static UI strings are translated
 * - promotes a candidate into the board and verifies human-lock behavior
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch (error) {
  console.error("ERROR: Playwright is not available.");
  console.error("Install it with: npm install");
  console.error(`Detail: ${error.message}`);
  process.exit(2);
}

const DEFAULT_URL = "https://tenormusica2024.github.io/codex-session-kanban-demo/";

function argValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function buildTargetUrl() {
  const explicitUrl = argValue("--url");
  if (explicitUrl) return explicitUrl;
  const filePath = argValue("--file");
  if (filePath) {
    const resolved = resolve(filePath);
    if (!existsSync(resolved)) {
      console.error(`ERROR: file not found: ${resolved}`);
      process.exit(2);
    }
    return pathToFileURL(resolved).href;
  }
  return DEFAULT_URL;
}

function visibleTextHasJapanese(text) {
  return /[ぁ-んァ-ン一-龥]/.test(text);
}

async function main() {
  const targetUrl = buildTargetUrl();
  const mobile = hasFlag("--mobile");
  const narrow = hasFlag("--narrow");
  const widthArg = Number(argValue("--width") || 0);
  const heightArg = Number(argValue("--height") || 0);
  const viewport = widthArg && heightArg
    ? { width: widthArg, height: heightArg }
    : narrow
      ? { width: 320, height: 740 }
      : mobile
        ? { width: 390, height: 844 }
        : { width: 1440, height: 1000 };
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport, isMobile: mobile || narrow });
  const errors = [];

  await page.addInitScript(() => {
    window.__copiedText = null;
    try {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (text) => {
            window.__copiedText = String(text);
          },
        },
      });
    } catch {
      // Some browsers may not allow overriding clipboard; the smoke will skip
      // clipboard assertion if the shim is unavailable.
    }
  });

  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(`console.error: ${message.text()}`);
    }
  });

  await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector("#candidate-list", { timeout: 15000 });
  await page.waitForSelector("#detail-panel", { timeout: 15000 });

  const initial = await page.evaluate(() => ({
    title: document.title,
    candidateCards: document.querySelectorAll(".candidate-card").length,
    sessionCards: document.querySelectorAll(".session-card").length,
    columns: [...document.querySelectorAll(".column-header h2")].map((node) => node.textContent.trim()),
    stats: [...document.querySelectorAll(".stat-card .value")].map((node) => node.textContent.trim()),
    hasCandidateList: Boolean(document.querySelector("#candidate-list")),
    hasDetailPanel: Boolean(document.querySelector("#detail-panel")),
    filterSummary: document.querySelector("#filter-summary")?.textContent?.trim() || "",
    buildMeta: document.querySelector("#build-meta")?.textContent?.trim() || "",
    viewport: { width: window.innerWidth, height: window.innerHeight },
    scrollWidth: document.documentElement.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
  }));

  if (!initial.hasCandidateList) errors.push("candidate-list is missing");
  if (!initial.hasDetailPanel) errors.push("detail-panel is missing");
  if (initial.candidateCards <= 0) errors.push("candidate cards are not visible");
  if (initial.columns.length < 5) errors.push(`too few kanban columns: ${initial.columns.join(", ")}`);
  if (!/v\d+\.\d+\.\d+/.test(initial.buildMeta)) {
    errors.push(`build meta does not show app version: ${initial.buildMeta}`);
  }
  if (initial.hasHorizontalOverflow) {
    errors.push(`horizontal overflow before interaction: viewport=${initial.viewport.width}, scrollWidth=${initial.scrollWidth}`);
  }

  await page.getByRole("button", { name: "EN" }).click();
  await page.waitForTimeout(100);
  const englishUi = await page.evaluate(() => {
    const staticSelectors = [
      ".hero h1",
      ".hero p",
      ".toolbar",
      ".cluster-strip-header",
      ".candidate-strip",
      ".column-header",
    ];
    const text = staticSelectors
      .map((selector) => [...document.querySelectorAll(selector)].map((node) => node.textContent.trim()).join("\n"))
      .join("\n");
    return {
      text,
      hasEnglishTitle: /Codex Session Kanban/i.test(document.body.textContent),
      hasJapaneseUiLabels:
        /表示中セッション|手動固定|自動処理候補|停止中|検索|状態|推奨列へ追加|使い方/.test(text),
    };
  });
  if (!englishUi.hasEnglishTitle) errors.push("English title was not rendered after language switch");
  if (englishUi.hasJapaneseUiLabels) errors.push("English UI still contains common Japanese static labels");

  await page.keyboard.press("/");
  await page.waitForTimeout(50);
  await page.keyboard.type("provider");
  const shortcutSearch = await page.evaluate(() => ({
    activeId: document.activeElement?.id || "",
    value: document.querySelector("#search-input")?.value || "",
    candidateCards: document.querySelectorAll(".candidate-card").length,
    filterSummary: document.querySelector("#filter-summary")?.textContent?.trim() || "",
    buildMeta: document.querySelector("#build-meta")?.textContent?.trim() || "",
  }));
  if (shortcutSearch.activeId !== "search-input" || shortcutSearch.value !== "provider") {
    errors.push(`slash shortcut did not focus/search correctly: ${JSON.stringify(shortcutSearch)}`);
  }
  if (shortcutSearch.candidateCards >= initial.candidateCards) {
    errors.push(`candidate list was not filtered by search: before=${initial.candidateCards}, after=${shortcutSearch.candidateCards}`);
  }
  if (!/provider|active|有効|候補|candidates/i.test(shortcutSearch.filterSummary)) {
    errors.push(`filter summary did not update after search: ${shortcutSearch.filterSummary}`);
  }
  await page.click("#clear-filters");
  const clearButtonState = await page.evaluate(() => ({
    search: document.querySelector("#search-input")?.value || "",
    repo: document.querySelector("#repo-filter")?.value || "",
    status: document.querySelector("#status-filter")?.value || "",
    cluster: document.querySelector("#cluster-filter")?.value || "",
    attention: document.querySelector("#attention-filter")?.value || "",
  }));
  if (clearButtonState.search || clearButtonState.repo !== "all" || clearButtonState.status !== "all" || clearButtonState.cluster !== "all" || clearButtonState.attention !== "all") {
    errors.push(`clear filters button failed: ${JSON.stringify(clearButtonState)}`);
  }
  await page.selectOption("#attention-filter", "quality-review");
  await page.waitForTimeout(50);
  const attentionFilter = await page.evaluate(() => ({
    value: document.querySelector("#attention-filter")?.value || "",
    candidateCards: document.querySelectorAll(".candidate-card").length,
    filterSummary: document.querySelector("#filter-summary")?.textContent?.trim() || "",
    buildMeta: document.querySelector("#build-meta")?.textContent?.trim() || "",
  }));
  if (attentionFilter.value !== "quality-review" || attentionFilter.candidateCards <= 0 || !/active|有効|候補|candidates/i.test(attentionFilter.filterSummary)) {
    errors.push(`attention quality filter failed: ${JSON.stringify(attentionFilter)}`);
  }
  await page.keyboard.press("/");
  await page.keyboard.type("provider");
  await page.evaluate(() => document.querySelector("#search-input")?.blur());
  await page.keyboard.press("x");
  const clearShortcutState = await page.evaluate(() => ({
    search: document.querySelector("#search-input")?.value || "",
    status: document.querySelector("#status-filter")?.value || "",
    attention: document.querySelector("#attention-filter")?.value || "",
  }));
  if (clearShortcutState.search || clearShortcutState.status !== "all" || clearShortcutState.attention !== "all") {
    errors.push(`clear filters shortcut failed: ${JSON.stringify(clearShortcutState)}`);
  }
  await page.locator('[data-review-attention="quality-review"]').first().click();
  await page.waitForTimeout(50);
  const reviewQuickFilter = await page.evaluate(() => ({
    attention: document.querySelector("#attention-filter")?.value || "",
    candidateCards: document.querySelectorAll(".candidate-card").length,
    filterSummary: document.querySelector("#filter-summary")?.textContent?.trim() || "",
    buildMeta: document.querySelector("#build-meta")?.textContent?.trim() || "",
  }));
  if (reviewQuickFilter.attention !== "quality-review" || reviewQuickFilter.candidateCards <= 0 || !/active|有効|候補|candidates/i.test(reviewQuickFilter.filterSummary)) {
    errors.push(`candidate review quick filter failed: ${JSON.stringify(reviewQuickFilter)}`);
  }
  await page.keyboard.press("x");
  await page.keyboard.press("Escape");
  await page.evaluate(() => {
    const input = document.querySelector("#search-input");
    if (input) {
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.blur();
    }
  });
  await page.keyboard.press("Shift+/");
  await page.waitForTimeout(50);
  const guideOpen = await page.evaluate(() => !document.querySelector("#workflow-help")?.hidden);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(50);
  const guideClosed = await page.evaluate(() => Boolean(document.querySelector("#workflow-help")?.hidden));
  if (!guideOpen || !guideClosed) {
    errors.push(`guide shortcuts failed: open=${guideOpen}, closed=${guideClosed}`);
  }

  const firstCandidate = page.locator(".candidate-card").first();
  const candidateCardsBeforeKeyboardAdd = await page.evaluate(() => document.querySelectorAll(".candidate-card").length);
  await firstCandidate.focus();
  await page.keyboard.press("j");
  await page.waitForTimeout(100);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(100);
  const selectedCandidateRepresentative = await page.evaluate(() => document.querySelector(".candidate-card.selected")?.dataset?.representativeSessionId || "");
  await page.locator(".candidate-card.selected").focus();
  await page.keyboard.press("a");
  await page.waitForSelector(".session-card", { timeout: 10000 });
  const candidateKeyboard = await page.evaluate((representativeId) => ({
    selectedCandidateCount: document.querySelectorAll(".candidate-card.selected").length,
    candidateCardsAfterAdd: document.querySelectorAll(".candidate-card").length,
    selectedRepresentativeStillVisible: representativeId
      ? Boolean(document.querySelector(`.candidate-card[data-representative-session-id="${CSS.escape(representativeId)}"]`))
      : null,
    detailMentionsCandidate: /Candidate detail|追加候補の詳細|session_id/.test(document.querySelector("#detail-panel")?.textContent || ""),
  }), selectedCandidateRepresentative);

  const promoted = await page.evaluate(() => ({
    sessionCards: document.querySelectorAll(".session-card").length,
    candidateCards: document.querySelectorAll(".candidate-card").length,
    hasHumanLock: /human lock|手動固定/i.test(document.body.textContent),
    detailHasSessionId: /session_id/i.test(document.querySelector("#detail-panel")?.textContent || ""),
    statusControls: document.querySelectorAll("#quick-status, #detail-status, .card-status-select, #manual-status").length,
    visibleTextLength: document.body.innerText.length,
    visibleTextHasJapanese: /[ぁ-んァ-ン一-龥]/.test(document.body.innerText),
    hasLightweightStats: /Text ~|Lightweight priority stats|軽量優先度stats|High activity|高活動/.test(document.body.innerText),
    scrollWidth: document.documentElement.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
  }));

  if (candidateKeyboard.selectedRepresentativeStillVisible === true) {
    errors.push(`candidate keyboard add did not remove the selected candidate from staging: representative=${selectedCandidateRepresentative}`);
  }
  if (candidateKeyboard.candidateCardsAfterAdd > candidateCardsBeforeKeyboardAdd) {
    errors.push(`candidate keyboard add increased visible candidates unexpectedly: before=${candidateCardsBeforeKeyboardAdd}, after=${candidateKeyboard.candidateCardsAfterAdd}`);
  }
  if (!candidateKeyboard.detailMentionsCandidate) errors.push("candidate keyboard preview/add did not update detail panel");
  if (promoted.sessionCards <= 0) errors.push("candidate promotion did not create a session card");
  if (!promoted.hasHumanLock) errors.push("candidate promotion did not create a human lock marker");
  if (!promoted.detailHasSessionId) errors.push("detail panel does not expose session_id");
  if (promoted.statusControls <= 0) errors.push("status controls are missing after promotion");
  if (promoted.visibleTextLength <= 200) errors.push("visible text is unexpectedly short");
  if (!promoted.hasLightweightStats) errors.push("lightweight prioritization stats are not visible");
  if (promoted.hasHorizontalOverflow) {
    errors.push(`horizontal overflow after interaction: viewport=${viewport.width}, scrollWidth=${promoted.scrollWidth}`);
  }

  await page.keyboard.press("3");
  await page.waitForTimeout(100);
  await page.keyboard.press("c");
  const keyboardTriage = await page.evaluate(() => {
    const selectedCard = document.querySelector(".session-card.selected");
    const selectedId = document.querySelector(".session-id-box .mono")?.textContent?.trim() || "";
    return {
      quickStatus: document.querySelector("#quick-status")?.value || "",
      selectedCardText: selectedCard?.textContent?.trim().slice(0, 240) || "",
      hasHumanLock: /human lock|手動固定/.test(document.body.textContent),
      copiedText: window.__copiedText || "",
      selectedId,
      hash: window.location.hash || "",
    };
  });
  await page.click("#copy-card-link");
  const cardLink = await page.evaluate(() => window.__copiedText || "");
  await page.click("#copy-card-brief");
  const cardBrief = await page.evaluate(() => window.__copiedText || "");
  await page.keyboard.press("b");
  const keyboardCardBrief = await page.evaluate(() => window.__copiedText || "");
  if (keyboardTriage.quickStatus !== "In Progress") {
    errors.push(`keyboard status shortcut did not move selected card to In Progress: ${keyboardTriage.quickStatus}`);
  }
  if (!keyboardTriage.selectedCardText) {
    errors.push("keyboard triage left no selected session card");
  }
  if (!keyboardTriage.hasHumanLock) {
    errors.push("keyboard status shortcut did not preserve/create a human lock marker");
  }
  if (keyboardTriage.selectedId && keyboardTriage.copiedText && keyboardTriage.copiedText !== keyboardTriage.selectedId) {
    errors.push("keyboard copy shortcut copied the wrong session_id");
  }
  if (!keyboardCardBrief.includes(keyboardTriage.selectedId) || !/summary:|session_id:|status:/i.test(keyboardCardBrief)) {
    errors.push("keyboard card-brief shortcut did not copy a usable brief");
  }

  await browser.close();

  const result = {
    ok: errors.length === 0,
    targetUrl,
    initial,
    promoted,
    shortcutSearch,
    clearFilters: { button: clearButtonState, shortcut: clearShortcutState },
    attentionFilter,
    reviewQuickFilter,
    guideShortcuts: { open: guideOpen, closed: guideClosed },
    candidateKeyboard,
    keyboardTriage,
    cardLink,
    cardBrief,
    keyboardCardBrief,
    note: promoted.visibleTextHasJapanese
      ? "Japanese may remain in source/session data; static English UI labels were checked separately."
      : "No Japanese text found in visible page text.",
    errors,
  };
  console.log(JSON.stringify(result, null, 2));
  process.exit(errors.length ? 1 : 0);
}

main().catch((error) => {
  console.error(`ERROR: ${error.stack || error.message}`);
  process.exit(2);
});
