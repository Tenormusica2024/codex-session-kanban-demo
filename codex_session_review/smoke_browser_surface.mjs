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
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];

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
  }));

  if (!initial.hasCandidateList) errors.push("candidate-list is missing");
  if (!initial.hasDetailPanel) errors.push("detail-panel is missing");
  if (initial.candidateCards <= 0) errors.push("candidate cards are not visible");
  if (initial.columns.length < 5) errors.push(`too few kanban columns: ${initial.columns.join(", ")}`);

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

  const firstCandidate = page.locator(".candidate-card").first();
  await firstCandidate
    .getByRole("button", { name: /Add to recommended|Add to suggested|推奨列へ追加/i })
    .click();
  await page.waitForSelector(".session-card", { timeout: 10000 });

  const promoted = await page.evaluate(() => ({
    sessionCards: document.querySelectorAll(".session-card").length,
    candidateCards: document.querySelectorAll(".candidate-card").length,
    hasHumanLock: /human lock|手動固定/i.test(document.body.textContent),
    detailHasSessionId: /session_id/i.test(document.querySelector("#detail-panel")?.textContent || ""),
    statusControls: document.querySelectorAll("#quick-status, #detail-status, .card-status-select, #manual-status").length,
    visibleTextLength: document.body.innerText.length,
    visibleTextHasJapanese: /[ぁ-んァ-ン一-龥]/.test(document.body.innerText),
  }));

  if (promoted.sessionCards <= 0) errors.push("candidate promotion did not create a session card");
  if (!promoted.hasHumanLock) errors.push("candidate promotion did not create a human lock marker");
  if (!promoted.detailHasSessionId) errors.push("detail panel does not expose session_id");
  if (promoted.statusControls <= 0) errors.push("status controls are missing after promotion");
  if (promoted.visibleTextLength <= 200) errors.push("visible text is unexpectedly short");

  await browser.close();

  const result = {
    ok: errors.length === 0,
    targetUrl,
    initial,
    promoted,
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
