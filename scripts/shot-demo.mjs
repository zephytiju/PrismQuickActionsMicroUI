// Demo screenshot driver: boots the vite dev server on a unique port, drives
// the multi-theme demo in headless Chrome, and captures the language switcher,
// BOTH quick-actions instances (VAULT v9 dark + Lattice Light) and the intent
// monitor at 2x, with the LEFT instance set to en and the RIGHT instance set
// to zh-CN (locale is a per-instance prop, so the shot shows two hosts
// rendering differing locales). It then CLICKS CREATE DOSSIER in the LEFT
// instance and IMPORT EVIDENCE in the RIGHT instance: quick-action buttons
// REQUEST their intents as Prism events, so the monitor below logs both
// requested intents (the publications). Demo-only tooling; not part of the
// published package.
import { spawn } from "node:child_process";
import { stat, mkdir } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const PORT = 4182;
// vite binds to localhost (IPv6 loopback first on macOS) — poll and navigate
// via localhost, not 127.0.0.1.
const BASE_URL = `http://localhost:${PORT}/`;
const OUT_DIR = "/tmp/guanlan-review";
const OUT_PATH = path.join(OUT_DIR, "demo-quick-actions.png");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const MIN_BYTES = 20_000;

function startDevServer() {
  const child = spawn("npx", ["vite", "--port", String(PORT), "--strictPort"], {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env },
  });
  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += String(chunk);
  });
  child.on("exit", (code) => {
    // 143 = SIGTERM from this script's cleanup; anything else is real.
    if (code !== null && code !== 0 && code !== 143) {
      process.stderr.write(`vite exited ${code}:\n${stderr}\n`);
    }
  });
  return child;
}

async function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      const response = await fetch(url, { method: "HEAD" });
      if (response.ok) {
        return;
      }
    } catch {
      // not up yet
    }
    if (Date.now() > deadline) {
      throw new Error(`dev server at ${url} did not become ready in ${timeoutMs}ms`);
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 250);
    });
  }
}

/** Clicks the option ("EN" / "中文") of a Mantine SegmentedControl by testid. */
async function clickSegmentedOption(page, rootSelector, optionText) {
  const clicked = await page.evaluate(
    ({ rootSelector, optionText }) => {
      const root = document.querySelector(rootSelector);
      if (root === null) {
        return false;
      }
      const label = Array.from(root.querySelectorAll("label")).find(
        (candidate) => candidate.textContent?.trim() === optionText,
      );
      if (label === undefined) {
        return false;
      }
      label.click();
      return true;
    },
    { rootSelector, optionText },
  );
  if (!clicked) {
    throw new Error(`segmented option "${optionText}" not found in ${rootSelector}`);
  }
}

const server = startDevServer();
let browser;
try {
  await waitForServer(BASE_URL, 30_000);
  browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 2 });
  await page.goto(BASE_URL, { waitUntil: "networkidle0" });

  // Locale is a per-instance prop: LEFT (VAULT) stays en, RIGHT (Lattice
  // Light) switches to zh-CN — both set through the per-instance controls so
  // the shot shows the two hosts rendering differing locales while the GLOBAL
  // switcher stays visible above.
  await page.waitForSelector('[data-testid="demo-locale-switcher"]');
  await clickSegmentedOption(page, '[data-testid="demo-instance-locale-a"]', "EN");
  await clickSegmentedOption(page, '[data-testid="demo-instance-locale-b"]', "中文");

  // Wait for BOTH instances to render all three action buttons and for the
  // RIGHT (zh-CN) instance to show its localized button copy.
  await page.waitForSelector('[data-testid="demo-locale-stage"]');
  await page.waitForFunction(() => {
    return document.querySelectorAll('[data-testid="quick-action-create-dossier"]').length === 2;
  });
  await page.waitForFunction(() => {
    const buttons = document.querySelectorAll('[data-testid="quick-action-create-dossier"]');
    return (
      buttons.length === 2 && Array.from(buttons).some((node) => node.textContent === "创建卷宗→")
    );
  });

  // Request one intent from EACH instance: CREATE DOSSIER from the LEFT
  // (VAULT dark, en) and IMPORT EVIDENCE from the RIGHT (Lattice Light,
  // zh-CN). Both land in the shared intent monitor below.
  await page.click('[data-testid="demo-panel-a"] [data-testid="quick-action-create-dossier"]');
  await page.click('[data-testid="demo-panel-b"] [data-testid="quick-action-import-evidence"]');
  await page.waitForFunction(() => {
    const log = document.querySelector('[data-testid="demo-intent-log"]');
    const text = log?.textContent ?? "";
    return text.includes("quick-actions.create-dossier") && text.includes("quick-actions.import-evidence");
  });
  await new Promise((resolve) => {
    setTimeout(resolve, 400);
  });

  // Capture the full demo page: both instances and the intent monitor showing
  // the two requested intents.
  await mkdir(OUT_DIR, { recursive: true });
  const pageRoot = await page.waitForSelector('[data-testid="demo-page"]');
  await pageRoot.screenshot({ path: OUT_PATH });
  const { size } = await stat(OUT_PATH);
  if (size < MIN_BYTES) {
    throw new Error(`screenshot ${OUT_PATH} is suspiciously small (${size} bytes)`);
  }
  console.log(`saved ${OUT_PATH} (${size} bytes)`);
} finally {
  if (browser !== undefined) {
    await browser.close().catch(() => undefined);
  }
  server.kill("SIGTERM");
}
