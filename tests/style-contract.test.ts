import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Pins the responsive/UX CSS rules the live game depends on, so a stylesheet
// cleanup can never silently drop them. All selectors here are used by the
// CURRENT scenes (journey map, Speeltuin, mini modes, reward loops).
describe("responsive gameplay CSS contract", () => {
  const css = readFileSync("src/style.css", "utf8").replace(/\r\n/g, "\n");

  it("keeps the narrow-phone compaction rules (<=400px)", () => {
    expect(css).toContain("@media (max-width: 400px)");
    // Mini-mode header: dots shrink so 7 progress dots always fit.
    expect(css).toContain(".mini-dot { width: 10px; height: 10px; }");
    // Journey top bar wraps + compacts so stars + meter + pill + knop fit.
    expect(css).toMatch(/\.reis-top \{[^}]*flex-wrap: wrap/);
    expect(css).toContain(".reis-bag { padding: 6px 10px;");
  });

  it("keeps the mini-mode title from pushing the progress dots offscreen", () => {
    expect(css).toMatch(/\.mini-title \{[^}]*min-width: 0/);
    expect(css).toContain(".mini-title strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }");
  });

  it("keeps the reward-loop chrome (treasure meter, chests, golden rounds)", () => {
    expect(css).toContain(".schat-meter {");
    expect(css).toContain(".schat-chest {");
    expect(css).toContain(".reis-chest {");
    expect(css).toContain(".mini-golden-banner {");
    expect(css).toMatch(/\.mini-scene\.golden-round \.mini-instruction/);
  });

  it("keeps the celebration overlays used by every mode", () => {
    expect(css).toContain(".sticker-reveal {");
    expect(css).toContain(".buddy-levelup {");
    expect(css).toContain(".boss-intro {");
    expect(css).toContain(".reis-story-overlay {");
  });

  it("keeps the mobile app-shell fundamentals", () => {
    expect(css).toContain("min-height: 100dvh");
    expect(css).toContain("overscroll-behavior: none");
    expect(css).toContain("-webkit-tap-highlight-color: transparent");
  });
});
