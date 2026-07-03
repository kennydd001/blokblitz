import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import net from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const root = process.cwd();
const artifactDir = path.join(root, ".qa-artifacts", "mobile-touch-qa");
mkdirSync(artifactDir, { recursive: true });

const errors = [];
const steps = [];
let vite;
let chrome;
let cdp;
let chromeProfile;

async function main() {
  try {
    const vitePort = await getFreePort(5311);
    const debugPort = await getFreePort(9342);
    const baseUrl = `http://127.0.0.1:${vitePort}/`;
    vite = spawnNpm(["run", "dev", "--", "--port", String(vitePort), "--strictPort"]);
    const viteLogs = collectLogs(vite);
    await waitForHttp(baseUrl, 30_000, () => viteLogs());

    chromeProfile = path.join(tmpdir(), `blokblitz-mobile-touch-qa-${Date.now()}`);
    chrome = spawn(
      findChrome(),
      [
        "--headless=new",
        "--disable-gpu",
        "--disable-extensions",
        "--disable-dev-shm-usage",
        "--no-first-run",
        "--no-default-browser-check",
        "--remote-allow-origins=*",
        `--remote-debugging-port=${debugPort}`,
        `--user-data-dir=${chromeProfile}`,
        "--window-size=390,844",
        "about:blank"
      ],
      { stdio: ["ignore", "pipe", "pipe"] }
    );
    const chromeLogs = collectLogs(chrome);
    const target = await waitForPageTarget(debugPort, 20_000, () => chromeLogs());
    cdp = await CdpClient.connect(target.webSocketDebuggerUrl);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Log.enable");
    await cdp.send("Input.setIgnoreInputEvents", { ignore: false });
    cdp.on("Runtime.exceptionThrown", (event) => errors.push(`Runtime exception: ${event.exceptionDetails?.text ?? "unknown"}`));
    cdp.on("Runtime.consoleAPICalled", (event) => {
      if (event.type === "error") errors.push(`Console error: ${event.args?.map((arg) => arg.value ?? arg.description ?? "").join(" ")}`);
    });
    cdp.on("Log.entryAdded", (event) => {
      if (event.entry?.level === "error") errors.push(`Log error: ${event.entry.text}`);
    });

    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    await cdp.send("Page.navigate", { url: `${baseUrl}?qa=mobile-touch-${Date.now()}` });
    await waitForGameHook(8_000);
    await assertNoHorizontalOverflow("journey");

    await openGameScene("run");
    await waitForSelector(".run-scene", 5_000);
    await assertNoHorizontalOverflow("real runner");
    await tap(".run-ctrl-right", "real-runner right control");
    await tap(".run-ctrl-left", "real-runner left control");
    await tap(".run-ctrl-jump", "real-runner jump control");
    await swipe("canvas", -96, "real-runner swipe left");
    await swipe("canvas", 96, "real-runner swipe right");

    // De Sterrenreis: dismiss the story card, then finish the frontier stop by touch.
    await openGameScene("reis");
    await waitForSelector(".reis-scene", 5_000);
    if (await exists(".reis-story-start")) await tap(".reis-story-start", "journey story start");
    await assertNoHorizontalOverflow("journey map");
    await dismissRewardOverlays("journey map");
    await waitForSelector(".reis-node.now", 5_000);
    await tap(".reis-node.now", "journey frontier stop");
    await waitForSelector(".mini-scene", 5_000);
    await assertNoHorizontalOverflow("journey mini mode");
    await completeMiniRounds("journey stop", 14);
    await waitForSelector(".results-actions .btn.secondary", 5_000);
    await dismissRewardOverlays("journey stop");
    await tap(".results-actions .btn.secondary", "journey verder");
    await waitForSelector(".reis-scene", 5_000);

    // Vrij spelen: open the Speeltuin, play a reading mode by touch, return home.
    await openGameScene("hub");
    await waitForSelector(".hub-grid", 5_000);
    await assertNoHorizontalOverflow("speeltuin hub");
    await tap('.hub-card[data-mode="klankgrot"]', "open klankgrot");
    await waitForSelector(".klankgrot-play", 5_000);
    await completeMiniRounds("klankgrot", 14);
    await waitForSelector(".results-actions .btn.secondary", 5_000);
    await dismissRewardOverlays("klankgrot");
    await tap(".results-actions .btn.secondary", "back to speeltuin");
    await waitForSelector(".hub-scene", 5_000);
    await dismissRewardOverlays("speeltuin");

    const metrics = await evaluate(`
      (() => ({
        scene: document.querySelector(".scene")?.className ?? "",
        hasGameHook: Boolean(window.__blokblitzGame),
        attempts: window.__blokblitzGame?.data().progress.attempts.length ?? -1,
        journeyDone: window.__blokblitzGame?.data().progress.journey.completed.length ?? -1,
        treasureFill: window.__blokblitzGame?.data().progress.sessionChestFill ?? -1,
        viewport: {
          width: innerWidth,
          height: innerHeight,
          scrollWidth: document.documentElement.scrollWidth
        }
      }))()
    `);
    if (!metrics.hasGameHook) throw new Error("Missing QA game hook; mobile touch QA must run with ?qa=");
    if (!metrics.scene.includes("hub")) throw new Error(`Expected hub scene at the end, got ${metrics.scene}`);
    if (metrics.attempts < 14) throw new Error(`Expected at least 14 tracked attempts after the touch playthrough, got ${metrics.attempts}`);
    if (metrics.journeyDone < 1) throw new Error("Touch playthrough did not advance De Sterrenreis");
    if (metrics.treasureFill < 2 && metrics.treasureFill !== 0) throw new Error(`Expected the treasure meter to count both finished activities, got ${metrics.treasureFill}`);
    if (errors.length > 0) throw new Error(`Browser errors during touch QA:\n- ${errors.join("\n- ")}`);

    const screenshot = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: false });
    const screenshotPath = path.join(artifactDir, "summary-touch-mobile.png");
    writeFileSync(screenshotPath, Buffer.from(screenshot.data, "base64"));
    const reportPath = path.join(artifactDir, "report.json");
    writeFileSync(reportPath, JSON.stringify({ generatedAt: new Date().toISOString(), steps, metrics, screenshot: screenshotPath }, null, 2));
    console.log(`Mobile touch QA passed: ${steps.length} touch steps, ${metrics.attempts} tracked attempts, journey ${metrics.journeyDone} node(s) done.`);
    console.log(`Artifacts: ${artifactDir}`);
  } finally {
    await cdp?.close().catch(() => {});
    killProcess(chrome);
    killProcess(vite);
    await delay(500);
    if (chromeProfile) {
      try {
        rmSync(chromeProfile, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
      } catch {
        // Chrome may hold the profile briefly on Windows.
      }
    }
  }
}

// Reward moments (sticker unboxing, Buddy level-up) overlay the whole screen;
// tap through them so the next control tap actually lands on its target.
async function dismissRewardOverlays(label) {
  for (let i = 0; i < 4; i += 1) {
    if (await exists(".sticker-reveal")) {
      await tap(".sticker-reveal", `${label} dismiss sticker reveal`);
      continue;
    }
    if (await exists(".buddy-levelup")) {
      await tap(".buddy-levelup", `${label} dismiss buddy level-up`);
      continue;
    }
    return;
  }
}

async function completeMiniRounds(label, maxSteps) {
  for (let step = 0; step < maxSteps; step += 1) {
    if (await exists(".mini-done")) return;
    if (!(await exists(".mini-choice[data-correct='true']"))) {
      await delay(320);
      continue;
    }
    await tap(".mini-choice[data-correct='true']", `${label} correct ${step + 1}`);
    await delay(1150);
  }
  await waitForSelector(".mini-done", 3_000);
}

async function openGameScene(scene) {
  const opened = await evaluate(`
    (() => {
      const game = window.__blokblitzGame;
      if (!game) return false;
      game.showScene(${JSON.stringify(scene)});
      return true;
    })()
  `);
  if (!opened) throw new Error(`Could not open game scene ${scene}`);
}

async function waitForGameHook(timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await evaluate(`Boolean(window.__blokblitzGame)`)) return;
    await delay(100);
  }
  throw new Error("Timed out waiting for QA game hook");
}

async function tap(selector, label) {
  // Bring the target into the viewport first (map nodes / hub cards live in
  // long scroll containers), so the touch point is actually hittable.
  await evaluate(`document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({ block: "center", inline: "center" })`);
  await delay(160);
  const point = await centerPoint(selector);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
  await delay(45);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  steps.push({ label, selector, x: Math.round(point.x), y: Math.round(point.y) });
  await delay(120);
}

async function swipe(selector, deltaX, label) {
  const point = await centerPoint(selector);
  const end = { x: point.x + deltaX, y: point.y };
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
  await delay(30);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [end] });
  await delay(30);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  steps.push({ label, selector, x: Math.round(point.x), y: Math.round(point.y), endX: Math.round(end.x), endY: Math.round(end.y) });
  await delay(140);
}

async function centerPoint(selector) {
  const rect = await evaluate(`
    (() => {
      const node = document.querySelector(${JSON.stringify(selector)});
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      if (rect.width < 1 || rect.height < 1 || style.visibility === "hidden" || style.display === "none") return null;
      return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    })()
  `);
  if (!rect) throw new Error(`Could not tap ${selector}: missing or hidden`);
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

async function assertNoHorizontalOverflow(label) {
  const viewport = await evaluate(`
    (() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }))()
  `);
  if (viewport.scrollWidth > viewport.width + 1) throw new Error(`${label} horizontal overflow ${viewport.scrollWidth} > ${viewport.width}`);
}

async function exists(selector) {
  return evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`);
}

async function waitForSelector(selector, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await exists(selector)) return;
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${selector}`);
}

async function evaluate(expression) {
  const result = await cdp.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text ?? "Runtime.evaluate failed");
  return result.result.value;
}

async function waitForHttp(url, timeoutMs, logs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      await delay(200);
    }
  }
  throw new Error(`Timed out waiting for ${url}\n${logs()}`);
}

async function waitForPageTarget(port, timeoutMs, logs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      const targets = await response.json();
      const target = targets.find((item) => item.type === "page" && item.webSocketDebuggerUrl);
      if (target) return target;
    } catch {
      await delay(200);
    }
  }
  throw new Error(`Timed out waiting for Chrome DevTools\n${logs()}`);
}

async function getFreePort(start) {
  for (let port = start; port < start + 200; port += 1) {
    if (await canListen(port)) return port;
  }
  throw new Error(`No free port near ${start}`);
}

function canListen(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen(port, "127.0.0.1");
  });
}

function collectLogs(child) {
  const chunks = [];
  child.stdout?.on("data", (chunk) => chunks.push(String(chunk)));
  child.stderr?.on("data", (chunk) => chunks.push(String(chunk)));
  return () => chunks.slice(-20).join("");
}

function spawnNpm(args) {
  if (process.platform !== "win32") {
    return spawn("npm", args, { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
  }
  return spawn(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", ["npm.cmd", ...args].join(" ")], {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser"
  ].filter(Boolean);
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) throw new Error("Chrome/Edge was not found. Set CHROME_PATH to run mobile touch QA.");
  return found;
}

function killProcess(child) {
  if (!child || child.killed) return;
  if (process.platform === "win32" && child.pid) {
    spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    child.kill("SIGTERM");
  }
}

class CdpClient {
  static connect(url) {
    return new Promise((resolve, reject) => {
      const client = new CdpClient(url);
      client.ws.addEventListener("open", () => resolve(client), { once: true });
      client.ws.addEventListener("error", () => reject(new Error(`Could not connect to ${url}`)), { once: true });
    });
  }

  constructor(url) {
    this.nextId = 1;
    this.pending = new Map();
    this.handlers = new Map();
    this.ws = new WebSocket(url);
    this.ws.addEventListener("message", (message) => this.handleMessage(JSON.parse(message.data)));
    this.ws.addEventListener("close", () => {
      for (const { reject } of this.pending.values()) reject(new Error("CDP socket closed"));
      this.pending.clear();
    });
  }

  on(method, handler) {
    const handlers = this.handlers.get(method) ?? [];
    handlers.push(handler);
    this.handlers.set(method, handlers);
  }

  send(method, params = {}) {
    const id = this.nextId++;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  handleMessage(message) {
    if (message.id) {
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result ?? {});
      return;
    }
    const handlers = this.handlers.get(message.method) ?? [];
    for (const handler of handlers) handler(message.params ?? {});
  }

  close() {
    return new Promise((resolve) => {
      if (this.ws.readyState === WebSocket.CLOSED) {
        resolve();
        return;
      }
      this.ws.addEventListener("close", () => resolve(), { once: true });
      this.ws.close();
    });
  }
}

await main();
