#!/usr/bin/env node
/**
 * Capture public fixture screenshots for README/docs.
 *
 * The script only opens a supplied/local fixture HTML file and writes images
 * under docs/assets. It must be run against fixture/distribution data, never
 * against private real-session output.
 */

import { mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch (error) {
  console.error("ERROR: Playwright is not available. Run npm install first.");
  console.error(`Detail: ${error.message}`);
  process.exit(2);
}

function argValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}

function targetUrl() {
  const explicitUrl = argValue("--url");
  if (explicitUrl) return explicitUrl;
  const filePath = argValue("--file") || "codex_session_review/fixture_snapshot/index.html";
  const resolved = resolve(filePath);
  if (!existsSync(resolved)) {
    console.error(`ERROR: fixture file not found: ${resolved}`);
    console.error("Run npm run local:update or npm run release:check first.");
    process.exit(2);
  }
  return pathToFileURL(resolved).href;
}

async function promoteFirstCandidate(page) {
  await page.waitForSelector(".candidate-card", { timeout: 15000 });
  await page.locator(".candidate-card").first().scrollIntoViewIfNeeded();
  await page.locator(".candidate-card").first().click();
  await page.locator(".candidate-card").first().focus();
  await page.keyboard.press("a");
  await page.waitForSelector(".session-card", { timeout: 10000 });
  await page.locator(".session-card").first().click();
  await page.waitForSelector("#detail-panel .session-id-box", { timeout: 10000 });
}

async function capture(page, fileName, fullPage = false) {
  const outputDir = resolve("docs/assets");
  mkdirSync(outputDir, { recursive: true });
  const output = resolve(outputDir, fileName);
  await page.screenshot({ path: output, fullPage });
  return output;
}

async function main() {
  const url = targetUrl();
  const browser = await chromium.launch({ headless: true });

  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await desktop.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await desktop.waitForSelector("#candidate-list", { timeout: 15000 });
  const boardOverview = await capture(desktop, "board-overview.png");
  await promoteFirstCandidate(desktop);
  await desktop.evaluate(() => document.querySelector("#detail-panel")?.scrollIntoView({ block: "start" }));
  await desktop.waitForTimeout(100);
  const cardDetail = await capture(desktop, "card-detail.png");

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await mobile.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await mobile.waitForSelector("#candidate-list", { timeout: 15000 });
  const mobileOverview = await capture(mobile, "mobile-overview.png");
  await promoteFirstCandidate(mobile);
  await mobile.evaluate(() => document.querySelector("#detail-panel")?.scrollIntoView({ block: "start" }));
  await mobile.waitForTimeout(100);
  const mobileDetail = await capture(mobile, "mobile-detail.png");

  await browser.close();
  console.log(JSON.stringify({ ok: true, url, files: [boardOverview, cardDetail, mobileOverview, mobileDetail] }, null, 2));
}

main().catch((error) => {
  console.error(`ERROR: ${error.stack || error.message}`);
  process.exit(2);
});
