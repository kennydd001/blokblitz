// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  allSplits,
  allSplitsFor,
  classifySplitError,
  isValidSplit,
  MAX_SPLIT_N,
  reversalPairs,
  splitById,
  SPLIT_MISCONCEPTIONS
} from "../src/education/math/splits";
import { buildAttemptLog } from "../src/education/challengeLogger";
import { MasteryTracker } from "../src/education/masteryTracker";
import { splitbordChallenge } from "../src/scenes/minigames/miniChallenges";
import { JOURNEY } from "../src/data/journey";

describe("splits data", () => {
  it("lists all splits 0..n including zero and full", () => {
    expect(allSplitsFor(5).map((s) => `${s.left}+${s.right}`)).toEqual(["0+5", "1+4", "2+3", "3+2", "4+1", "5+0"]);
    expect(allSplitsFor(5).filter((s) => s.isZeroSplit)).toHaveLength(2);
  });

  it("generates 65 splits for n=1..10 and every reverseOf resolves", () => {
    expect(MAX_SPLIT_N).toBe(10);
    expect(allSplits()).toHaveLength(65);
    for (const split of allSplits()) expect(splitById(split.reverseOf)).toBeTruthy();
  });

  it("finds distinct reversal pairs", () => {
    expect(reversalPairs(5)).toHaveLength(2);
    expect(reversalPairs(4)).toHaveLength(1);
  });

  it("validates splits and classifies wrong answers", () => {
    expect(isValidSplit(5, 2, 3)).toBe(true);
    expect(isValidSplit(5, 2, 2)).toBe(false);
    expect(classifySplitError({ mode: "pick-missing", total: 5, correctLeft: 4, correctRight: 1, knownPart: 4, playerValue: 4 })).toBe("counts-total-as-part");
    expect(classifySplitError({ mode: "pick-missing", total: 5, correctLeft: 4, correctRight: 1, knownPart: 4, playerValue: 2 })).toBe("off-by-one-part");
    expect(SPLIT_MISCONCEPTIONS).toContain("reversed-pair-unclear");
  });
});

describe("splitbord challenge generation + logging", () => {
  it("builds valid challenges for all three modes and logs as partwhole", () => {
    const tracker = new MasteryTracker();
    for (const mode of ["pick-parts", "pick-missing", "pick-total"] as const) {
      const challenge = splitbordChallenge(5, mode);
      expect(challenge.skill).toBe("partwhole");
      expect(challenge.challengeType.startsWith("splitbord-")).toBe(true);
      expect(challenge.quantity).toBe(5);
      const correct = challenge.options.find((option) => option.isCorrect);
      expect(correct).toBeTruthy();
      tracker.logAttempt(buildAttemptLog({ challenge, option: correct!, sessionId: "s", reactionTimeMs: 600, hintUsed: false }));
    }
    // Splits flow into the existing partwhole skill row, without touching number grouping.
    expect(tracker.masteryBySkill().find((m) => m.skill === "partwhole")!.exposures).toBe(3);
    expect(tracker.getAttempts().filter((a) => a.challengeType.startsWith("splitbord-"))).toHaveLength(3);
  });

  it("is reachable as a node on De Sterrenreis", () => {
    const node = JOURNEY.find((n) => n.scene === "splitbord");
    expect(node).toBeTruthy();
    expect(node!.kind).toBe("stop");
  });

  it("pick-missing rounds are hands-on: eggs move into the empty box and the numeral lights up", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    localStorage.clear();
    const { Game } = await import("../src/game/Game");
    const { SplitbordScene } = await import("../src/scenes/minigames/SplitbordScene");
    const game = new Game(document.querySelector<HTMLElement>("#app")!);
    class ForcedMissing extends SplitbordScene {
      protected makeChallenge() {
        const challenge = splitbordChallenge(5, "pick-missing");
        this.instruction = challenge.prompt;
        return challenge;
      }
    }
    const scene = new ForcedMissing(game);
    scene.mount();
    const overlay = game.overlay;

    // One tappable egg per "samen" (the whole rekenbordje amount).
    expect(overlay.querySelectorAll(".splitbord-tray .splitbord-egg")).toHaveLength(5);
    // Tap two eggs: they land in the empty box's nest.
    (overlay.querySelector(".splitbord-tray .splitbord-egg") as HTMLButtonElement).click();
    (overlay.querySelector(".splitbord-tray .splitbord-egg") as HTMLButtonElement).click();
    expect(overlay.querySelectorAll(".splitbord-part.empty .splitbord-nest .splitbord-egg")).toHaveLength(2);
    // If "2" is among the numerals, it lights up as the built suggestion.
    const two = overlay.querySelector('.splitbord-choice[data-value="2"]');
    if (two) expect(two.classList.contains("suggest")).toBe(true);
    // Tapping a nested egg puts it back on the tray.
    (overlay.querySelector(".splitbord-nest .splitbord-egg") as HTMLButtonElement).click();
    expect(overlay.querySelectorAll(".splitbord-nest .splitbord-egg")).toHaveLength(1);
    // The answer flow is unchanged: numeral buttons still resolve the round.
    expect(overlay.querySelector('.splitbord-choice[data-correct="true"]')).toBeTruthy();
    const wrong = overlay.querySelector<HTMLButtonElement>('.splitbord-choice[data-correct="false"]')!;
    wrong.click();
    expect(game.mastery.getAttempts().at(-1)).toMatchObject({
      domain: "math-number",
      skill: "partwhole",
      wasCorrect: false
    });
    expect(game.mastery.getAttempts().at(-1)?.errorType).toBeTruthy();
    expect(overlay.querySelector<HTMLElement>(".scene.splitbord")?.dataset.supportLevel).toBe("model");
    expect(overlay.querySelector('.splitbord-choice[data-correct="true"]')?.classList.contains("reveal")).toBe(true);
    scene.unmount();
  });
});
