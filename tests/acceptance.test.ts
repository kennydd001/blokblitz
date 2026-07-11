import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ChallengeFactory } from "../src/education/challengeFactory";
import { MINIGAME_TYPES, REPRESENTATIONS, SKILLS } from "../src/education/types";

const requiredFiles = [
  "AGENTS.md",
  "docs/GAME_SPEC.md",
  "docs/PLAN.md",
  "docs/IMPLEMENT.md",
  "docs/STATUS.md",
  "docs/ACCEPTANCE_AUDIT.md",
  "assets/ASSET_MANIFEST.json",
  "README.md",
  "package.json",
  "index.html",
  "src/main.ts"
];

const requiredScenes = [
  "BootScene",
  "ReisScene",
  "MainMenuScene",
  "HubScene",
  "RunScene",
  "ResultsScene",
  "ParentDashboardScene",
  "SettingsScene"
];

const requiredMiniScenes = [
  "CountScene",
  "MatchScene",
  "CompareScene",
  "FillScene",
  "OneMoreLessScene",
  "OrderScene",
  "MemoryScene",
  "SplitbordScene",
  "KlankgrotScene",
  "LetterkompasScene",
  "TientalhuisScene",
  "ZoemrouteScene",
  "GetallenlijnScene",
  "WoordbouwplaatsScene",
  "TienbrugScene",
  "VormenburchtScene",
  "KloktorenScene",
  "GeldmarktScene",
  "MeetwerfScene",
  "VerkeerspadScene",
  "LuisterbosScene",
  "BossScene"
];

function walkFiles(path: string): string[] {
  const stat = statSync(path);
  if (stat.isFile()) return [path];
  return readdirSync(path).flatMap((entry) => walkFiles(join(path, entry)));
}

describe("acceptance checklist audit", () => {
  it("keeps the required durable project files present", () => {
    for (const file of requiredFiles) {
      expect(existsSync(file), `${file} should exist`).toBe(true);
    }
  });

  it("keeps every required scene implemented and registered", () => {
    const gameSource = readFileSync("src/game/Game.ts", "utf8");
    for (const scene of requiredScenes) {
      expect(existsSync(`src/scenes/${scene}.ts`), `${scene} file should exist`).toBe(true);
      expect(gameSource).toContain(`new ${scene}(game)`);
    }
    for (const scene of requiredMiniScenes) {
      expect(existsSync(`src/scenes/minigames/${scene}.ts`), `${scene} file should exist`).toBe(true);
      expect(gameSource).toContain(`new ${scene}(game)`);
    }
    // The old prototype scenes are gone for good.
    for (const legacy of ["BlokBlitzScene", "WebWoudScene", "SterrenstadScene", "NumberOfDayScene", "MinigameScene", "SummaryScene"]) {
      expect(existsSync(`src/scenes/${legacy}.ts`), `${legacy} should stay deleted`).toBe(false);
    }
  });

  it("exposes all required education dimensions", () => {
    expect(SKILLS).toEqual([
      "subitize",
      "make10",
      "partwhole",
      "compare",
      "oneMoreLess",
      "quantityToNumeral",
      "numeralToQuantity",
      "buildQuantity"
    ]);
    expect(REPRESENTATIONS).toHaveLength(12);
    expect(MINIGAME_TYPES).toHaveLength(12);
  });


  it("documents a local-first asset manifest with only same-origin runtime assets", () => {
    const manifest = JSON.parse(readFileSync("assets/ASSET_MANIFEST.json", "utf8")) as {
      externalAssets: Array<{ name: string; usedFiles: string[]; notes: string }>;
      generatedAssets: Array<{ license: string; source: string }>;
    };
    expect(manifest.externalAssets.length).toBeGreaterThanOrEqual(1);
    expect(manifest.externalAssets.some((asset) => asset.name === "ElevenLabs Dutch voice-pack")).toBe(true);
    const voicePack = manifest.externalAssets.find((asset) => asset.name === "ElevenLabs Dutch voice-pack");
    expect(voicePack?.usedFiles.every((file) => !file.includes("://"))).toBe(true);
    expect(voicePack?.usedFiles).toContain("public/audio/voice/nl/elevenlabs-lily-v3/");
    expect(existsSync("public/audio/voice/nl/elevenlabs-lily-v3/voice-lines.json")).toBe(true);
    expect(existsSync("src/game/voiceLineManifest.ts")).toBe(true);
    expect(voicePack?.notes).toContain("does not call ElevenLabs");
    expect(manifest.externalAssets.some((asset) => asset.name === "ElevenLabs Dutch reading phoneme pack")).toBe(true);
    expect(existsSync("public/audio/reading/nl/elevenlabs-lily-v3/phonemes/phonemes.json")).toBe(true);
    expect(existsSync("src/game/ReadingAudioManager.ts")).toBe(true);
    expect(manifest.generatedAssets.length).toBeGreaterThanOrEqual(3);
    expect(manifest.generatedAssets.every((asset) => asset.license === "Project-generated")).toBe(true);
    expect(readFileSync("index.html", "utf8")).not.toContain("https://");
  });

  it("keeps the mobile app shell installable and local-first", () => {
    const index = readFileSync("index.html", "utf8");
    const css = readFileSync("src/style.css", "utf8");
    const gameSource = readFileSync("src/game/Game.ts", "utf8");
    const mainMenuSource = readFileSync("src/scenes/MainMenuScene.ts", "utf8");
    const reisSource = readFileSync("src/scenes/ReisScene.ts", "utf8");
    expect(index).toContain("viewport-fit=cover");
    expect(index).toContain('name="mobile-web-app-capable" content="yes"');
    expect(index).toContain('name="apple-mobile-web-app-capable" content="yes"');
    expect(index).toContain('name="theme-color" content="#bae6fd"');
    expect(index).toContain('rel="manifest" href="/site.webmanifest"');
    expect(css).toContain("min-height: 100dvh");
    expect(css).toContain("overscroll-behavior: none");
    expect(css).toContain("-webkit-tap-highlight-color: transparent");
    expect(gameSource).toContain("requestFullscreenPlay");
    expect(gameSource).toContain("requestFullscreen");
    expect(mainMenuSource).toContain("this.game.requestFullscreenPlay()");
    expect(reisSource).toContain("this.game.requestFullscreenPlay()");

    const webManifest = JSON.parse(readFileSync("public/site.webmanifest", "utf8")) as {
      name: string;
      short_name: string;
      display: string;
      orientation: string;
      start_url: string;
      scope: string;
      icons: Array<{ src: string; type: string; purpose?: string }>;
    };
    expect(webManifest.name).toContain("BlokBlitz");
    expect(webManifest.short_name).toBe("BlokBlitz");
    expect(webManifest.display).toBe("fullscreen");
    expect(webManifest.orientation).toBe("portrait-primary");
    expect(webManifest.start_url).toBe("/");
    expect(webManifest.scope).toBe("/");
    expect(webManifest.icons.length).toBeGreaterThan(0);
    expect(webManifest.icons.every((icon) => icon.src.startsWith("/") && !icon.src.includes("://"))).toBe(true);
    expect(webManifest.icons.some((icon) => icon.type === "image/svg+xml" && icon.purpose?.includes("maskable"))).toBe(true);
    expect(existsSync("public/favicon.svg")).toBe(true);
  });

  it("keeps offline play support same-origin and production-scoped", () => {
    const main = readFileSync("src/main.ts", "utf8");
    const serviceWorker = readFileSync("public/sw.js", "utf8");
    expect(main).toContain("serviceWorker");
    expect(main).toContain('register("/sw.js")');
    expect(main).toContain("PROD");
    // Two-tier cache: network-first shell + cache-first immutable assets, so
    // hashed bundles and the voice pack load instantly and play offline.
    expect(serviceWorker).toContain("SHELL_CACHE");
    expect(serviceWorker).toContain("STATIC_CACHE");
    expect(serviceWorker).toContain('"/index.html"');
    expect(serviceWorker).toContain('"/site.webmanifest"');
    expect(serviceWorker).toContain("cache.addAll(APP_SHELL)");
    expect(serviceWorker).toContain('url.pathname.startsWith("/assets/")');
    expect(serviceWorker).toContain('url.pathname.startsWith("/audio/")');
    expect(serviceWorker).toContain("url.origin !== self.location.origin");
    expect(serviceWorker).not.toMatch(/https?:\/\//);
  });

  it("keeps automated mobile touch QA available for phone-like playthroughs", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as { scripts: Record<string, string> };
    const script = readFileSync("scripts/mobile-touch-qa.mjs", "utf8");
    expect(packageJson.scripts["qa:mobile-touch"]).toBe("node scripts/mobile-touch-qa.mjs");
    expect(script).toContain("Input.dispatchTouchEvent");
    expect(script).toContain("Mobile touch QA passed");
    expect(script).toContain("swipe left");
    expect(script).toContain("swipe right");
    // The touch route covers the REAL game: journey stop + a Speeltuin mode.
    expect(script).toContain(".reis-cine-overlay");
    expect(script).toContain(".reis-quest");
    expect(script).toContain('.hub-tab[data-category="lezen"]');
    expect(script).toContain('.hub-card[data-mode="klankgrot"]');
    expect(script).toContain(".mini-choice[data-correct='true']");
  });

  it("keeps runtime source free of remote dependencies and network APIs", () => {
    const runtimeFiles = ["index.html", ...walkFiles("src").filter((file) => /\.(ts|css)$/.test(file))];
    const violations: string[] = [];
    for (const file of runtimeFiles) {
      const source = readFileSync(file, "utf8");
      const remoteUrls = source.match(/https?:\/\/(?!www\.w3\.org\/2000\/svg)/g);
      const networkApis = source.match(/\b(fetch\s*\(|XMLHttpRequest|WebSocket|EventSource)\b/g);
      if (remoteUrls || networkApis) violations.push(`${file}: ${[...(remoteUrls ?? []), ...(networkApis ?? [])].join(", ")}`);
    }
    expect(violations).toEqual([]);
  });

  it("generates a valid runner-gate challenge for every minigame type", () => {
    // The education factory drives the real runner gates: every template must
    // produce a playable challenge with exactly one correct option and local SVG.
    const factory = new ChallengeFactory();
    for (const type of MINIGAME_TYPES) {
      const challenge = factory.createMinigame(type, { quantity: 6, representation: "dots", scene: "runner" });
      expect(challenge.options.some((option) => option.isCorrect), `${type} should have a correct option`).toBe(true);
      expect(challenge.options.every((option) => option.svg.includes("<svg")), `${type} options render SVG`).toBe(true);
      expect(challenge.hint.length).toBeGreaterThan(8);
    }
  });

  it("keeps README coverage for setup, controls, architecture, assets, and learning model", () => {
    const readme = readFileSync("README.md", "utf8");
    for (const section of ["Run Locally", "Validation", "Controls", "Architecture", "Learning Model", "Adding a Representation", "Adding a Challenge", "Asset Policy"]) {
      expect(readme).toContain(section);
    }
  });
});
