import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { districtSeeds } from "../src/data/districts";
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
  "NumberOfDayScene",
  "BlokBlitzScene",
  "WebWoudScene",
  "SterrenstadScene",
  "MinigameScene",
  "SummaryScene",
  "ParentDashboardScene",
  "SettingsScene"
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

  it("includes all required Sterrenstad districts", () => {
    expect(districtSeeds).toHaveLength(14);
    expect(districtSeeds.map((district) => district.name)).toEqual([
      "Dot Card Plaza",
      "Dice Cave",
      "Domino Dock",
      "Finger Treehouse",
      "Five-Frame Farm",
      "Ten-Frame Tower",
      "Rekenrek Bridge",
      "Block Stack Yard",
      "Egg Nest Nursery",
      "Pawprint Rescue HQ",
      "Numeral Library",
      "Mixed Match Observatory",
      "Train of Ten Station",
      "Dino Park"
    ]);
  });

  it("documents a local-first asset manifest with no external runtime assets", () => {
    const manifest = JSON.parse(readFileSync("assets/ASSET_MANIFEST.json", "utf8")) as {
      externalAssets: unknown[];
      generatedAssets: Array<{ license: string; source: string }>;
    };
    expect(manifest.externalAssets).toEqual([]);
    expect(manifest.generatedAssets.length).toBeGreaterThanOrEqual(3);
    expect(manifest.generatedAssets.every((asset) => asset.license === "Project-generated")).toBe(true);
    expect(readFileSync("index.html", "utf8")).not.toContain("https://");
  });

  it("keeps the mobile app shell installable and local-first", () => {
    const index = readFileSync("index.html", "utf8");
    const css = readFileSync("src/style.css", "utf8");
    const gameSource = readFileSync("src/game/Game.ts", "utf8");
    const mainMenuSource = readFileSync("src/scenes/MainMenuScene.ts", "utf8");
    const summarySource = readFileSync("src/scenes/SummaryScene.ts", "utf8");
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
    expect(summarySource).toContain("this.game.requestFullscreenPlay()");

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
    expect(serviceWorker).toContain("CACHE_NAME");
    expect(serviceWorker).toContain('"/index.html"');
    expect(serviceWorker).toContain('"/site.webmanifest"');
    expect(serviceWorker).toContain("cache.addAll(APP_SHELL)");
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
    expect(script).toContain(".city-quick-build button[data-action='Bouw nu']");
    expect(script).toContain(".summary-replay-actions button[data-action='Nog een missie']");
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

  it("binds Sterrenstad restoration examples to deterministic number-structure challenges", () => {
    const factory = new ChallengeFactory();
    const challenges = new Map(
      districtSeeds.map((district) => [
        district.id,
        factory.createCityChallenge(district.id, {
          quantity: district.targetQuantity,
          representation: district.representation
        })
      ])
    );

    expect(challenges.get("block-yard")?.challengeType).toBe("build-the-number");
    expect(challenges.get("rekenrek-bridge")?.challengeType).toBe("bead-bridge");
    expect(challenges.get("train-station")?.challengeType).toBe("train-of-ten");
    expect(challenges.get("numeral-library")?.challengeType).toBe("web-anchors");
    expect(challenges.get("dot-plaza")?.challengeType).toBe("one-more-one-less");
    expect(challenges.get("dino-park")?.challengeType).toBe("rescue-the-herd");

    for (const district of districtSeeds) {
      const challenge = challenges.get(district.id);
      expect(challenge, `${district.name} should create a challenge`).toBeTruthy();
      expect(challenge!.scene).toBe("city");
      expect(challenge!.levelId).toBe(district.id);
      expect(challenge!.options.some((option) => option.isCorrect)).toBe(true);
      expect(challenge!.options.every((option) => option.svg.includes("<svg"))).toBe(true);
      expect(challenge!.successEffect.length).toBeGreaterThan(8);
      expect(challenge!.safeErrorEffect.length).toBeGreaterThan(8);
      expect(challenge!.hint.length).toBeGreaterThan(8);
    }
  });

  it("keeps README coverage for setup, controls, architecture, assets, and learning model", () => {
    const readme = readFileSync("README.md", "utf8");
    for (const section of ["Run Locally", "Validation", "Controls", "Architecture", "Learning Model", "Adding a Representation", "Adding a Challenge", "Asset Policy"]) {
      expect(readme).toContain(section);
    }
  });
});
