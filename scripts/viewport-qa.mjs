import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import net from "node:net";
import zlib from "node:zlib";
import { setTimeout as delay } from "node:timers/promises";

const root = process.cwd();
const artifactDir = path.join(root, ".qa-artifacts", "viewport-qa");
mkdirSync(artifactDir, { recursive: true });

const scenarios = [
  { name: "menu-mobile", width: 390, height: 844, mobile: true, open: "menu", expectJourneyMap: true },
  { name: "menu-narrow-mobile", width: 360, height: 740, mobile: true, open: "menu", expectJourneyMap: true },
  { name: "hub-mobile", width: 390, height: 844, mobile: true, open: "hub", expectHub: true },
  { name: "hub-narrow-mobile", width: 360, height: 740, mobile: true, open: "hub", expectHub: true },
  { name: "menu-fullscreen-desktop", width: 1920, height: 1080, mobile: false, open: "menu", expectJourneyMap: true },
  { name: "hub-fullscreen-desktop", width: 1920, height: 1080, mobile: false, open: "hub", expectHub: true },
  { name: "real-runner-mobile", width: 390, height: 844, mobile: true, open: "real-runner", expectRealRunner: true },
  { name: "real-runner-narrow-mobile", width: 360, height: 740, mobile: true, open: "real-runner", expectRealRunner: true },
  { name: "real-runner-short-desktop", width: 1280, height: 720, mobile: false, open: "real-runner", expectRealRunner: true },
  { name: "real-runner-fullscreen-desktop", width: 1920, height: 1080, mobile: false, open: "real-runner", expectRealRunner: true },
  { name: "count-narrow-mobile", width: 332, height: 807, mobile: true, open: "count", expectMiniMode: ".count-play", expectCountSequence: true },
  { name: "compare-mobile", width: 390, height: 844, mobile: true, open: "compare", expectMiniMode: ".compare-play", expectCompareFeeding: true },
  { name: "onemoreless-narrow-mobile", width: 332, height: 807, mobile: true, open: "onemoreless", expectMiniMode: ".onemore-play", expectBeforeAfter: true },
  { name: "vormenburcht-narrow-mobile", width: 332, height: 807, mobile: true, open: "vormenburcht", expectMiniMode: ".vormen-play", expectShapeBuild: true },
  { name: "verkeerspad-mobile", width: 390, height: 844, mobile: true, open: "verkeerspad", expectMiniMode: ".verkeer-play", expectTrafficRoute: true },
  { name: "klankgrot-mobile", width: 390, height: 844, mobile: true, open: "klankgrot", expectMiniMode: ".klankgrot-play" },
  { name: "klankgrot-fullscreen-desktop", width: 1920, height: 1080, mobile: false, open: "klankgrot", expectMiniMode: ".klankgrot-play" },
  { name: "rijmrivier-narrow-mobile", width: 332, height: 807, mobile: true, open: "rijmspel", expectMiniMode: ".rhyme-river" },
  { name: "rijmrivier-desktop", width: 1280, height: 720, mobile: false, open: "rijmspel", expectMiniMode: ".rhyme-river" },
  { name: "sprongpad-narrow-mobile", width: 332, height: 807, mobile: true, open: "sprongpad", expectMiniMode: ".skip-track" },
  { name: "sprongpad-desktop", width: 1280, height: 720, mobile: false, open: "sprongpad", expectMiniMode: ".skip-track" },
  { name: "vriendjes-narrow-mobile", width: 332, height: 807, mobile: true, open: "vriendjes", expectMiniMode: ".bond-frame" },
  { name: "dubbelspel-mobile", width: 390, height: 844, mobile: true, open: "dubbelspel", expectMiniMode: ".dubbel-stage" },
  { name: "splitbord-mobile", width: 390, height: 844, mobile: true, open: "splitbord", expectMiniMode: ".splitbord-board" },
  { name: "tienbrug-narrow-mobile", width: 360, height: 740, mobile: true, open: "tienbrug", expectMiniMode: ".tienbrug-sum" },
  { name: "kloktoren-mobile", width: 390, height: 844, mobile: true, open: "kloktoren", expectMiniMode: ".klok-play" },
  { name: "boss-mobile", width: 390, height: 844, mobile: true, open: "boss", expectMiniMode: ".boss-arena" },
  { name: "boss-fullscreen-desktop", width: 1920, height: 1080, mobile: false, open: "boss", expectMiniMode: ".boss-arena" },
  { name: "real-runner-landscape-mobile", width: 844, height: 390, mobile: true, open: "real-runner", expectRealRunner: true }
];

const errors = [];
let vite;
let chrome;
let cdp;
let chromeProfile;

async function main() {
try {
  const vitePort = await getFreePort(5291);
  const debugPort = await getFreePort(9322);
  const baseUrl = `http://127.0.0.1:${vitePort}/`;
  vite = spawnNpm(["run", "dev", "--", "--port", String(vitePort), "--strictPort"]);
  const viteLogs = collectLogs(vite);
  await waitForHttp(baseUrl, 30_000, () => viteLogs());

  chromeProfile = path.join(tmpdir(), `blokblitz-viewport-qa-${Date.now()}`);
  const chromePath = findChrome();
  chrome = spawn(
    chromePath,
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
      "--window-size=1280,720",
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
  cdp.on("Runtime.exceptionThrown", (event) => {
    errors.push(`Runtime exception: ${event.exceptionDetails?.text ?? "unknown"}`);
  });
  cdp.on("Runtime.consoleAPICalled", (event) => {
    if (event.type === "error") errors.push(`Console error: ${event.args?.map((arg) => arg.value ?? arg.description ?? "").join(" ")}`);
  });
  cdp.on("Log.entryAdded", (event) => {
    if (event.entry?.level === "error") errors.push(`Log error: ${event.entry.text}`);
  });

  const report = [];
  for (const scenario of scenarios) {
    const beforeErrorCount = errors.length;
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: scenario.width,
      height: scenario.height,
      deviceScaleFactor: 1,
      mobile: scenario.mobile
    });
    await cdp.send("Page.navigate", { url: `${baseUrl}?qa=${Date.now()}-${scenario.name}` });
    await waitForSelector(".scene", 8_000);
    await openScenario(scenario.open);
    await delay(350);

    const metrics = await collectMetrics(scenario);
    validateScenario(scenario, metrics, errors.slice(beforeErrorCount));
    const screenshot = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: false });
    const screenshotPath = path.join(artifactDir, `${scenario.name}.png`);
    const pngBuffer = Buffer.from(screenshot.data, "base64");
    writeFileSync(screenshotPath, pngBuffer);
    const pixelReport = inspectPng(pngBuffer);
    if (pixelReport.distinctBuckets < 24 || pixelReport.range < 42) {
      throw new Error(`${scenario.name}: screenshot/canvas looks too flat (${JSON.stringify(pixelReport)})`);
    }
    report.push({ scenario: scenario.name, metrics, pixelReport, screenshot: screenshotPath });
  }

  const reportPath = path.join(artifactDir, "report.json");
  writeFileSync(reportPath, JSON.stringify({ generatedAt: new Date().toISOString(), scenarios: report }, null, 2));
  console.log(`Viewport QA passed: ${scenarios.map((scenario) => scenario.name).join(", ")}`);
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
      // Chrome can hold the profile briefly on Windows. The temp folder is safe to leave behind.
    }
  }
}
}

async function openScenario(open) {
  if (open === "menu") {
    await openGameScene("reis");
    await waitForSelector(".reis-scene", 5_000);
    // A fresh profile opens with the intro cinematic (dark night sky) over
    // the map; start the adventure so the scenario validates the map itself.
    await evaluate("document.querySelector('.reis-story-start')?.click()");
    await delay(250);
    return;
  }
  if (open === "hub") {
    await openGameScene("hub");
    await waitForSelector(".hub-grid", 5_000);
    return;
  }
  if (open !== "real-runner") {
    await openGameScene(open);
    await waitForSelector(".mini-scene", 5_000);
    await evaluate("document.querySelector('.boss-intro')?.remove()");
    return;
  }
  if (open === "real-runner") {
    await openGameScene("run");
    await waitForSelector(".run-scene", 5_000);
    await waitForSelector(".run-target", 5_000);
    // Three.js + RunnerView load as a lazy chunk; wait until the in-world
    // gates exist before collecting scene-graph metrics.
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const gatesReady = await evaluate(`(() => {
        const game = window.__blokblitzGame;
        let numerals = 0;
        const visit = (node) => {
          if (!node || typeof node !== "object") return;
          if (node.userData?.blokblitzRole === "runner-gate-big-numeral") numerals += 1;
          if (Array.isArray(node.children)) node.children.forEach(visit);
        };
        visit(game?.stage3d?.world);
        return numerals >= 2;
      })()`);
      if (gatesReady) break;
      await delay(250);
    }
    await delay(400);
    return;
  }
}

async function playThroughToSummary() {
  await openGameScene("runner");
  await waitForSelector(".play-field-layer.runner", 5_000);
  for (let step = 0; step < 18; step += 1) {
    if (!(await evaluate(`Boolean(document.querySelector(".play-field-layer.runner"))`))) break;
    await click(".play-field-layer.runner button[data-correct='true']");
    await delay(720);
  }
  await waitForSelector(".play-field-layer.web", 8_000);
  for (let step = 0; step < 18; step += 1) {
    if (!(await evaluate(`Boolean(document.querySelector(".play-field-layer.web"))`))) break;
    await click(".play-field-layer.web button[data-correct='true']");
    await delay(720);
  }
  await waitForSelector(".city-quick-build button[data-action='Bouw nu']", 8_000);
  await click(".city-quick-build button[data-action='Bouw nu']");
  await waitForSelector(".city-build-live", 5_000);
  await click(".city-build-live button[data-correct='true']");
  await waitForSelector(".city-next-actions button[data-action='Missie afronden']", 5_000);
  await click(".city-next-actions button[data-action='Missie afronden']");
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

async function click(selector) {
  const clicked = await evaluate(`
    (() => {
      const node = document.querySelector(${JSON.stringify(selector)});
      if (!node) return false;
      node.click();
      return true;
    })()
  `);
  if (!clicked) throw new Error(`Could not click ${selector}`);
}

async function waitForSelector(selector, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const found = await evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`);
    if (found) return;
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${selector}`);
}

async function collectMetrics(scenario = {}) {
  const miniBoardSelector = JSON.stringify(scenario.expectMiniMode ?? "");
  return evaluate(`
    (() => {
      const miniBoardSelector = ${miniBoardSelector};
      // Neutralise CSS animations while measuring AND for the screenshot that
      // follows: pulse/idle animations scale elements (flaky getBoundingClientRect)
      // and, crucially, entrance animations (.tile-in etc.) start at opacity 0 —
      // so we must leave the freeze applied through the screenshot to capture the
      // SETTLED screen, not a mid-fade one. The freeze is discarded on the next
      // scenario's fresh navigation.
      const freeze = document.createElement("style");
      freeze.setAttribute("data-qa-freeze", "true");
      freeze.textContent = "* { animation: none !important; transition: none !important; }";
      document.head.appendChild(freeze);
      const rect = (selector) => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return {
          top: r.top,
          bottom: r.bottom,
          left: r.left,
          right: r.right,
          width: r.width,
          height: r.height,
          display: cs.display,
          opacity: Number(cs.opacity),
          pointerEvents: cs.pointerEvents
        };
      };
      const rects = (selector) => [...document.querySelectorAll(selector)].map((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return {
          top: r.top,
          bottom: r.bottom,
          left: r.left,
          right: r.right,
          width: r.width,
          height: r.height,
          display: cs.display,
          opacity: Number(cs.opacity),
          pointerEvents: cs.pointerEvents
        };
      });
      const metrics = {
        hubGrid: rect(".hub-grid"),
        hubCardCount: document.querySelectorAll(".hub-card").length,
        hubDaily: rect(".hub-daily"),
        hubMissions: rects(".daily-mission"),
        hubTabs: rects(".hub-tab"),
        hubActiveTabs: document.querySelectorAll('.hub-tab[aria-selected="true"]').length,
        hubAdventure: rect(".hub-adventure"),
        menuGarage: rect(".menu-garage"),
        miniBoardPresent: miniBoardSelector ? Boolean(document.querySelector(miniBoardSelector)) : false,
        miniBoard: miniBoardSelector ? rect(miniBoardSelector) : null,
        miniChoiceCount: document.querySelectorAll(".mini-choice").length,
        miniChoices: rects(".mini-choice"),
        countItems: rects(".count-item"),
        countDisabledChoices: document.querySelectorAll(".count-choices .mini-choice:disabled").length,
        countRescueSlots: document.querySelectorAll(".count-rescue-trail > span").length,
        compareFeedDots: document.querySelectorAll(".compare-feed-meter > i").length,
        oneMoreStates: rects(".onemore-state"),
        oneMoreMysteryVisible: Boolean(document.querySelector(".onemore-state.after .onemore-mystery")),
        shapeBuild: rect(".vormen-build-progress"),
        shapeBuildSlots: document.querySelectorAll(".vormen-build-stones > span").length,
        trafficRoute: rect(".verkeer-route"),
        trafficSteps: document.querySelectorAll(".verkeer-road > i").length,
        miniTitleClipped: (() => {
          const title = document.querySelector(".mini-title strong");
          return title ? title.scrollWidth > title.clientWidth + 1 : false;
        })(),
        viewport: {
          width: innerWidth,
          height: innerHeight,
          scrollWidth: document.documentElement.scrollWidth,
          scrollHeight: document.documentElement.scrollHeight
        },
        scene: document.querySelector(".scene")?.className ?? "",
        canvas: rect("canvas"),
        hud: rect(".play-hud"),
        adaptiveWindow: document.querySelector(".play-hud")?.dataset.adaptiveWindow ?? null,
        status: rect(".play-status"),
        controls: rect(".scene-layer.gameplay-layer .gameplay-actions, .city-build-live .city-build-controls"),
        field: rect(".play-field-layer, .city-build-live"),
        route: rect(".option-grid.lanes.game-field, .option-grid.anchors.game-field, .minigame-field, .city-build-field"),
        hitZones: rects(".world-hit-zone, .mini-object, .build-choice"),
        actionButtons: rects(".scene-layer.gameplay-layer .action-pad-button, .scene-layer.gameplay-layer .gameplay-actions .btn, .city-build-live .action-pad-button, .city-build-live .city-build-controls .btn"),
        padActions: [...document.querySelectorAll(".scene-layer.gameplay-layer .action-pad-button, .city-build-live .action-pad-button")].map((button) => ({
          action: button.dataset.padAction,
          label: button.getAttribute("aria-label")
        })),
        rewardBadges: rects(".play-outcome .reward-badge[data-reward-icon], .city-build-live .city-build-outcome .reward-badge[data-reward-icon]"),
        scaffoldStrip: rect(".scaffold-strip"),
        selectedCorrectHint: Boolean(document.querySelector(".option-card.selected[data-correct='true'], .mini-object.selected[data-correct='true'], .build-choice.selected[data-correct='true']")),
        scaffoldBeaconCount: (() => {
          const game = window.__blokblitzGame;
          return game?.stage3d?.world?.children?.filter((child) => child.userData?.blokblitzRole === "scaffold-target-beacon").length ?? 0;
        })(),
        menuProgress: rect(".kid-progress-strip"),
        menuProgressTokens: rects(".kid-progress-token"),
        journeyTop: rect(".reis-top"),
        journeyQuest: rect(".reis-quest"),
        journeyQuestDebug: (() => {
          const quest = document.querySelector(".reis-quest");
          if (!quest) return null;
          const cs = getComputedStyle(quest);
          return { cssWidth: cs.width, boxSizing: cs.boxSizing, parentWidth: quest.parentElement?.getBoundingClientRect().width, storyOverlayUp: Boolean(document.querySelector(".reis-story-overlay")) };
        })(),
        journeyScroll: rect(".reis-scroll"),
        journeyMap: rect(".reis-map"),
        journeyProgress: rect(".reis-progress-pill"),
        journeyFriends: rects(".reis-friend"),
        journeyNodes: rects(".reis-node"),
        journeyActiveNodes: rects(".reis-node.now"),
        summaryTreasure: rect(".summary-treasure-trail"),
        summaryTreasures: rects(".summary-treasure"),
        summaryCityMeter: rect(".summary-city-meter"),
        summaryActions: rect(".summary-replay-actions"),
        summaryActionButtons: rects(".summary-replay-actions .btn"),
        summaryParentDetails: rect(".summary-parent-details"),
        summaryParentDetailsOpen: Boolean(document.querySelector(".summary-parent-details")?.open),
        visibleSummaryStats: [...document.querySelectorAll(".summary-scoreboard .stat-pill")].filter((el) => {
          const details = el.closest("details");
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          return (!details || details.open) && cs.display !== "none" && cs.visibility !== "hidden" && Number(cs.opacity) > 0.05 && r.width > 1 && r.height > 1;
        }).length,
        cityQuickBuild: rect(".city-quick-build"),
        cityBuildNow: rect(".city-quick-build button[data-action='Bouw nu']"),
        cityRecommendedDistricts: rects(".district-card.recommended"),
        cityBuildLivePresent: Boolean(document.querySelector(".city-build-live")),
        adventureBridge: rect(".adventure-bridge"),
        adventureBridges: rects(".adventure-bridge"),
        adventureToast: rect(".adventure-toast"),
        blockingOverlayCount: [...document.querySelectorAll(".challenge-card, .runner-coach, .web-coach, .mini-coach")].filter((el) => {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          return cs.display !== "none" && cs.visibility !== "hidden" && Number(cs.opacity) > 0.05 && r.width > 1 && r.height > 1;
        }).length,
        missionRibbonVisible: Boolean(document.querySelector(".scene.blokblitz .mission-ribbon, .scene.webwoud .mission-ribbon, .scene.minigames .mission-ribbon")),
        realRunnerTarget: rect(".run-target"),
        realRunnerControls: rect(".run-controls"),
        realRunnerControlButtons: rects(".run-ctrl"),
        realRunnerProgress: rect(".run-progress"),
        realRunnerRoles: (() => {
          const game = window.__blokblitzGame;
          const roles = {};
          const visit = (node) => {
            if (!node || typeof node !== "object") return;
            const role = node.userData?.blokblitzRole;
            if (role) roles[role] = (roles[role] ?? 0) + 1;
            if (Array.isArray(node.children)) node.children.forEach(visit);
          };
          // The 3D layer is a lazy chunk: the world lives on game.stage3d.
          visit(game?.stage3d?.world);
          return roles;
        })()
      };
      // NOTE: freeze intentionally left applied so the screenshot below captures
      // the settled screen (entrance animations at their final opacity, not 0).
      return metrics;
    })()
  `);
}

function validateScenario(scenario, metrics, scenarioErrors) {
  const failures = [];
  const { viewport } = metrics;
  if (scenarioErrors.length > 0) failures.push(...scenarioErrors);
  if (viewport.scrollWidth > viewport.width + 1) failures.push(`horizontal overflow ${viewport.scrollWidth} > ${viewport.width}`);
  if (!metrics.canvas || metrics.canvas.width < viewport.width - 2 || metrics.canvas.height < viewport.height - 2) failures.push("canvas does not fill viewport");
  if (scenario.expectJourneyMap) {
    if (!metrics.journeyTop) failures.push("missing journey top bar");
    if (!metrics.journeyProgress) failures.push("missing journey progress pill");
    if (!metrics.journeyQuest) failures.push("missing journey quest card");
    if (!metrics.journeyScroll) failures.push("missing journey scroll map");
    if (!metrics.journeyMap) failures.push("missing journey map");
    if (metrics.journeyTop && metrics.journeyTop.width > viewport.width - 10) failures.push(`journey top too wide: ${metrics.journeyTop.width}`);
    if (metrics.journeyQuest && metrics.journeyQuest.width > viewport.width - 10)
      failures.push(`journey quest too wide: ${metrics.journeyQuest.width} (${JSON.stringify(metrics.journeyQuestDebug)})`);
    if (metrics.journeyQuest && metrics.journeyQuest.height < 72) failures.push(`journey quest too short: ${metrics.journeyQuest.height}`);
    if (metrics.journeyScroll && metrics.journeyScroll.height < viewport.height * 0.5) failures.push(`journey map viewport too short: ${metrics.journeyScroll.height}`);
    if (metrics.journeyActiveNodes.length !== 1) failures.push(`expected one active journey node, got ${metrics.journeyActiveNodes.length}`);
    if (metrics.journeyNodes.length < 20) failures.push(`expected a full journey map, got ${metrics.journeyNodes.length} nodes`);
    if (metrics.journeyFriends.length !== 6) failures.push(`expected 6 rescued-friend slots, got ${metrics.journeyFriends.length}`);
    if (failures.length > 0) throw new Error(`${scenario.name} failed:\n- ${failures.join("\n- ")}`);
    return;
  }
  if (scenario.expectAdventureBridge) {
    if (!metrics.adventureBridge) failures.push("missing adventure bridge");
    if (metrics.adventureBridge && metrics.adventureBridge.width > viewport.width - 10) failures.push(`adventure bridge too wide: ${metrics.adventureBridge.width}`);
    if (metrics.adventureBridge && metrics.adventureBridge.height < 42) failures.push(`adventure bridge too short: ${metrics.adventureBridge.height}`);
    if (failures.length > 0) throw new Error(`${scenario.name} failed:\n- ${failures.join("\n- ")}`);
    return;
  }
  if (scenario.expectSummaryProgress) {
    if (!metrics.summaryTreasure) failures.push("missing summary treasure trail");
    if (metrics.summaryTreasure && metrics.summaryTreasure.width > viewport.width - 10) failures.push(`summary treasure too wide: ${metrics.summaryTreasure.width}`);
    if (metrics.summaryTreasures.length !== 4) failures.push(`expected 4 summary treasures, got ${metrics.summaryTreasures.length}`);
    if (!metrics.summaryCityMeter) failures.push("missing summary city meter");
    if (!metrics.adventureBridge) failures.push("missing summary adventure bridge");
    if (!metrics.summaryActions) failures.push("missing summary replay actions");
    if (!metrics.summaryParentDetails) failures.push("missing collapsed parent summary details");
    if (metrics.summaryParentDetailsOpen) failures.push("parent summary details should not be open by default");
    if (metrics.visibleSummaryStats > 0) failures.push(`summary dashboard stats visible by default: ${metrics.visibleSummaryStats}`);
    if (metrics.summaryActions && metrics.summaryActions.bottom > viewport.height + 1) failures.push(`summary replay actions are not in first viewport: ${JSON.stringify(metrics.summaryActions)}`);
    if (metrics.summaryActionButtons.length !== 2) failures.push(`expected 2 summary action buttons, got ${metrics.summaryActionButtons.length}`);
    for (const button of metrics.summaryActionButtons) {
      if (button.width < 44 || button.height < 44) failures.push(`summary action button too small: ${JSON.stringify(button)}`);
    }
    for (const treasure of metrics.summaryTreasures) {
      if (treasure.width < 40 || treasure.height < 44) failures.push(`summary treasure too small: ${JSON.stringify(treasure)}`);
    }
    if (failures.length > 0) throw new Error(`${scenario.name} failed:\n- ${failures.join("\n- ")}`);
    return;
  }
  if (scenario.expectCityQuickBuild) {
    if (!metrics.cityQuickBuild) failures.push("missing city quick-build action");
    if (!metrics.cityBuildNow) failures.push("missing Bouw nu button");
    if (metrics.cityQuickBuild && metrics.cityQuickBuild.bottom > viewport.height + 1) failures.push(`city quick-build not in first viewport: ${JSON.stringify(metrics.cityQuickBuild)}`);
    if (metrics.cityQuickBuild && metrics.cityQuickBuild.width > viewport.width - 10) failures.push(`city quick-build too wide: ${metrics.cityQuickBuild.width}`);
    if (metrics.cityBuildNow && (metrics.cityBuildNow.width < 44 || metrics.cityBuildNow.height < 54)) failures.push(`Bouw nu button too small: ${JSON.stringify(metrics.cityBuildNow)}`);
    if (metrics.cityRecommendedDistricts.length !== 1) failures.push(`expected one recommended city district, got ${metrics.cityRecommendedDistricts.length}`);
    if (metrics.cityBuildLivePresent) failures.push("city overview opened live build before Bouw nu");
    if (failures.length > 0) throw new Error(`${scenario.name} failed:\n- ${failures.join("\n- ")}`);
    return;
  }
  if (scenario.expectHub) {
    if (!metrics.hubGrid) failures.push("missing hub grid");
    if (metrics.hubCardCount < 3 || metrics.hubCardCount > 6) failures.push(`expected one compact hub category (3-6 cards), got ${metrics.hubCardCount}`);
    if (!metrics.hubDaily) failures.push("missing personal daily plan");
    if (metrics.hubMissions.length !== 3) failures.push(`expected 3 daily missions, got ${metrics.hubMissions.length}`);
    if (metrics.hubTabs.length !== 5) failures.push(`expected 5 free-play category tabs, got ${metrics.hubTabs.length}`);
    if (metrics.hubActiveTabs !== 1) failures.push(`expected one active hub category, got ${metrics.hubActiveTabs}`);
    if (!metrics.hubAdventure) failures.push("missing Sterrenreis adventure action");
    if (metrics.hubDaily && (metrics.hubDaily.left < -1 || metrics.hubDaily.right > viewport.width + 1)) failures.push(`daily plan is clipped: ${JSON.stringify(metrics.hubDaily)}`);
    for (const mission of metrics.hubMissions) {
      if (mission.width < 88 || mission.height < 96) failures.push(`daily mission too small: ${JSON.stringify(mission)}`);
      if (mission.left < -1 || mission.right > viewport.width + 1) failures.push(`daily mission clipped: ${JSON.stringify(mission)}`);
    }
    for (const tab of metrics.hubTabs) {
      if (tab.width < 44 || tab.height < 44) failures.push(`hub category tab too small: ${JSON.stringify(tab)}`);
    }
    if (!metrics.menuGarage) failures.push("missing hero garage");
    if (failures.length > 0) throw new Error(`${scenario.name} failed:\n- ${failures.join("\n- ")}`);
    return;
  }
  if (scenario.expectMiniMode) {
    if (!metrics.miniBoardPresent) failures.push(`missing mini board ${scenario.expectMiniMode}`);
    if (metrics.miniChoiceCount < 1) failures.push("mini mode has no tappable choices");
    if (metrics.miniBoard && (metrics.miniBoard.left < -1 || metrics.miniBoard.right > viewport.width + 1)) failures.push(`mini board is clipped: ${JSON.stringify(metrics.miniBoard)}`);
    if (metrics.miniTitleClipped) failures.push("mini mode title is clipped");
    for (const choice of metrics.miniChoices) {
      if (choice.left < -1 || choice.right > viewport.width + 1) failures.push(`mini choice is horizontally clipped: ${JSON.stringify(choice)}`);
      if (choice.width < 44 || choice.height < 44) failures.push(`mini choice is too small: ${JSON.stringify(choice)}`);
    }
    if (scenario.expectCountSequence) {
      if (metrics.countRescueSlots !== 5) failures.push(`expected 5 rescue slots, got ${metrics.countRescueSlots}`);
      if (metrics.countItems.length < 2) failures.push(`expected countable animals, got ${metrics.countItems.length}`);
      if (metrics.countDisabledChoices !== metrics.miniChoiceCount) failures.push("count answers are not locked before all animals are counted");
      for (const item of metrics.countItems) {
        if (item.width < 44 || item.height < 44) failures.push(`count animal is too small: ${JSON.stringify(item)}`);
      }
    }
    if (scenario.expectCompareFeeding && metrics.compareFeedDots !== 7) failures.push(`expected 7 dino feed dots, got ${metrics.compareFeedDots}`);
    if (scenario.expectBeforeAfter) {
      if (metrics.oneMoreStates.length !== 2) failures.push(`expected before and after cards, got ${metrics.oneMoreStates.length}`);
      if (!metrics.oneMoreMysteryVisible) failures.push("missing one-more/less mystery state");
      for (const state of metrics.oneMoreStates) {
        if (state.left < -1 || state.right > viewport.width + 1) failures.push(`one-more/less state is clipped: ${JSON.stringify(state)}`);
      }
    }
    if (scenario.expectShapeBuild) {
      if (!metrics.shapeBuild) failures.push("missing shape-castle build goal");
      if (metrics.shapeBuildSlots !== 7) failures.push(`expected 7 shape stones, got ${metrics.shapeBuildSlots}`);
      if (metrics.shapeBuild && (metrics.shapeBuild.left < -1 || metrics.shapeBuild.right > viewport.width + 1)) failures.push(`shape build goal is clipped: ${JSON.stringify(metrics.shapeBuild)}`);
    }
    if (scenario.expectTrafficRoute) {
      if (!metrics.trafficRoute) failures.push("missing traffic journey route");
      if (metrics.trafficSteps !== 7) failures.push(`expected 7 traffic steps, got ${metrics.trafficSteps}`);
      if (metrics.trafficRoute && (metrics.trafficRoute.left < -1 || metrics.trafficRoute.right > viewport.width + 1)) failures.push(`traffic route is clipped: ${JSON.stringify(metrics.trafficRoute)}`);
    }
    if (failures.length > 0) throw new Error(`${scenario.name} failed:\n- ${failures.join("\n- ")}`);
    return;
  }
  if (scenario.expectRealRunner) {
    if (!metrics.realRunnerTarget) failures.push("missing real runner target");
    if (!metrics.realRunnerControls) failures.push("missing real runner controls");
    if (!metrics.realRunnerProgress) failures.push("missing real runner progress");
    if (metrics.realRunnerTarget && metrics.realRunnerTarget.width > viewport.width - 8) failures.push(`real runner target too wide: ${metrics.realRunnerTarget.width}`);
    if (metrics.realRunnerTarget && metrics.realRunnerTarget.bottom > viewport.height * 0.36) failures.push(`real runner target blocks too much play space: ${JSON.stringify(metrics.realRunnerTarget)}`);
    if (metrics.realRunnerControls && metrics.realRunnerControls.bottom > viewport.height + 1) failures.push(`real runner controls offscreen: ${JSON.stringify(metrics.realRunnerControls)}`);
    if (metrics.realRunnerControlButtons.length !== 3) failures.push(`expected 3 real runner controls, got ${metrics.realRunnerControlButtons.length}`);
    for (const button of metrics.realRunnerControlButtons) {
      if (button.width < 64 || button.height < 64) failures.push(`real runner control too small: ${JSON.stringify(button)}`);
    }
    const roles = metrics.realRunnerRoles ?? {};
    // The revamped gate is a big left/right fork: each of the two lanes carries a
    // giant numeral, the matching getalbeeld, and a number-coloured floor carpet.
    if ((roles["runner-gate-big-numeral"] ?? 0) < 2) failures.push(`missing big in-world gate numerals: ${roles["runner-gate-big-numeral"] ?? 0}`);
    if ((roles["runner-gate-quantity-art"] ?? 0) < 2) failures.push(`missing in-world gate getalbeelden: ${roles["runner-gate-quantity-art"] ?? 0}`);
    if ((roles["runner-gate-floor"] ?? 0) < 2) failures.push(`missing number-coloured gate floors: ${roles["runner-gate-floor"] ?? 0}`);
    if (failures.length > 0) throw new Error(`${scenario.name} failed:\n- ${failures.join("\n- ")}`);
    return;
  }
  if (!metrics.hud) failures.push("missing gameplay HUD");
  if (!metrics.adaptiveWindow) failures.push("missing adaptive live window");
  if (metrics.hud && (metrics.hud.top < -1 || metrics.hud.bottom > viewport.height * 0.42)) failures.push(`HUD too large or offscreen: ${JSON.stringify(metrics.hud)}`);
  if (metrics.status && metrics.status.width > Math.min(390, viewport.width - 90)) failures.push(`status panel is too wide: ${metrics.status.width}`);
  if (!metrics.controls) failures.push("missing gameplay controls");
  if (metrics.controls && (metrics.controls.top < 0 || metrics.controls.bottom > viewport.height + 1)) failures.push(`controls offscreen: ${JSON.stringify(metrics.controls)}`);
  const padActions = metrics.padActions.map((button) => button.action);
  if (padActions.join(",") !== "left,act,right") failures.push(`expected left/act/right pad actions, got ${padActions.join(",")}`);
  if (!metrics.padActions[1]?.label) failures.push("missing central action pad label");
  if (!metrics.route || metrics.route.height < viewport.height * 0.58) failures.push(`play route is too small: ${metrics.route?.height ?? 0}`);
  if (metrics.hitZones.length < 2) failures.push(`expected at least two hit zones, got ${metrics.hitZones.length}`);
  for (const hitZone of metrics.hitZones) {
    if (hitZone.width < 56 || hitZone.height < viewport.height * 0.5) failures.push(`hit zone too small: ${JSON.stringify(hitZone)}`);
  }
  for (const button of metrics.actionButtons) {
    if (button.height < 44 || button.width < 44) failures.push(`action button too small: ${JSON.stringify(button)}`);
  }
  if (metrics.blockingOverlayCount !== 0) failures.push(`blocking card/coach overlays visible: ${metrics.blockingOverlayCount}`);
  if (metrics.missionRibbonVisible) failures.push("mission ribbon is visible during live play");
  if (scenario.expectReward && metrics.rewardBadges.length < 2) failures.push(`expected visible reward badges, got ${metrics.rewardBadges.length}`);
  if (scenario.expectScaffold) {
    if (!metrics.scaffoldStrip) failures.push("missing scaffold strip after wrong choice");
    if (!metrics.selectedCorrectHint) failures.push("wrong-choice scaffold did not select the correct hint target");
    if (metrics.scaffoldBeaconCount < 1) failures.push(`missing 3D scaffold beacon, got ${metrics.scaffoldBeaconCount}`);
  }
  if (scenario.expectReward) {
    for (const badge of metrics.rewardBadges) {
      if (badge.width < 36 || badge.height < 36) failures.push(`reward badge too small: ${JSON.stringify(badge)}`);
    }
  }
  if (failures.length > 0) throw new Error(`${scenario.name} failed:\n- ${failures.join("\n- ")}`);
}

async function evaluate(expression) {
  const result = await cdp.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text ?? "Runtime.evaluate failed");
  return result.result.value;
}

function inspectPng(buffer) {
  const signature = "89504e470d0a1a0a";
  if (buffer.subarray(0, 8).toString("hex") !== signature) throw new Error("Invalid PNG screenshot");
  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idat = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      const bitDepth = data[8];
      colorType = data[9];
      if (bitDepth !== 8 || ![2, 6].includes(colorType)) throw new Error(`Unsupported PNG format: bitDepth=${bitDepth}, colorType=${colorType}`);
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
    offset += 12 + length;
  }
  const bytesPerPixel = colorType === 6 ? 4 : 3;
  const stride = width * bytesPerPixel;
  const inflated = zlib.inflateSync(Buffer.concat(idat));
  const raw = Buffer.alloc(height * stride);
  let source = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = inflated[source++];
    const row = inflated.subarray(source, source + stride);
    const previousOffset = (y - 1) * stride;
    const targetOffset = y * stride;
    for (let x = 0; x < stride; x += 1) {
      const left = x >= bytesPerPixel ? raw[targetOffset + x - bytesPerPixel] : 0;
      const up = y > 0 ? raw[previousOffset + x] : 0;
      const upLeft = y > 0 && x >= bytesPerPixel ? raw[previousOffset + x - bytesPerPixel] : 0;
      raw[targetOffset + x] = unfilter(filter, row[x], left, up, upLeft);
    }
    source += stride;
  }
  const buckets = new Set();
  let minBrightness = 255;
  let maxBrightness = 0;
  const xStart = Math.floor(width * 0.18);
  const xEnd = Math.floor(width * 0.82);
  const yStart = Math.floor(height * 0.16);
  const yEnd = Math.floor(height * 0.86);
  for (let y = yStart; y < yEnd; y += 17) {
    for (let x = xStart; x < xEnd; x += 17) {
      const index = y * stride + x * bytesPerPixel;
      const r = raw[index];
      const g = raw[index + 1];
      const b = raw[index + 2];
      buckets.add(`${r >> 4},${g >> 4},${b >> 4}`);
      const brightness = (r + g + b) / 3;
      minBrightness = Math.min(minBrightness, brightness);
      maxBrightness = Math.max(maxBrightness, brightness);
    }
  }
  return { width, height, distinctBuckets: buckets.size, range: Math.round(maxBrightness - minBrightness) };
}

function unfilter(filter, value, left, up, upLeft) {
  if (filter === 0) return value;
  if (filter === 1) return (value + left) & 0xff;
  if (filter === 2) return (value + up) & 0xff;
  if (filter === 3) return (value + Math.floor((left + up) / 2)) & 0xff;
  if (filter === 4) return (value + paeth(left, up, upLeft)) & 0xff;
  throw new Error(`Unsupported PNG filter: ${filter}`);
}

function paeth(left, up, upLeft) {
  const p = left + up - upLeft;
  const pa = Math.abs(p - left);
  const pb = Math.abs(p - up);
  const pc = Math.abs(p - upLeft);
  if (pa <= pb && pa <= pc) return left;
  if (pb <= pc) return up;
  return upLeft;
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
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser"
  ].filter(Boolean);
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) throw new Error("Chrome/Edge was not found. Set CHROME_PATH to run viewport QA.");
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
