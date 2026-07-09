import { afterEach, describe, expect, it, vi } from "vitest";
import { AdaptiveEngine } from "../src/education/adaptiveEngine";
import { buildAttemptLog } from "../src/education/challengeLogger";
import { ChallengeFactory } from "../src/education/challengeFactory";
import { MasteryTracker } from "../src/education/masteryTracker";
import { dutchQuantityName } from "../src/education/quantityNames";
import { getQuantityRange } from "../src/education/quantityLayouts";
import { RepresentationFactory } from "../src/education/representations/RepresentationFactory";
import { MINIGAME_TYPES, REPRESENTATIONS, type AttemptLog } from "../src/education/types";
import { SaveManager } from "../src/game/SaveManager";
import { runnerMechanicLabels, runnerMechanics } from "../src/gameplay/runner/runnerMechanics";
import { adaptivePressureMultiplier, adaptiveProgressRate } from "../src/gameplay/session/adaptivePressure";
import { anchorDecisionPlan, anchorDecisionTypes } from "../src/gameplay/webwoud/anchorDecisions";

afterEach(() => {
  vi.unstubAllGlobals();
});

function attempt(overrides: Partial<AttemptLog>): AttemptLog {
  const quantity = overrides.quantity ?? 7;
  return {
    timestamp: Date.now(),
    sessionId: "adaptive-rule-session",
    levelId: "adaptive-rule",
    scene: "minigame",
    challengeType: "flash-gates",
    skill: "subitize",
    representation: "dots",
    quantity,
    quantityRange: getQuantityRange(quantity),
    promptRepresentation: "dots",
    answerRepresentation: "numeral",
    correctAnswer: quantity,
    playerAnswer: quantity,
    wasCorrect: true,
    reactionTimeMs: 800,
    hintUsed: false,
    ...overrides
  };
}

describe("quantity representations", () => {
  it("renders all required representations for quantities 1-10", () => {
    for (const representation of REPRESENTATIONS) {
      for (let quantity = 1; quantity <= 10; quantity += 1) {
        const svg = RepresentationFactory.renderSvg(representation, quantity);
        expect(svg).toContain("<svg");
        expect(svg).toContain("quantity-svg");
      }
    }
  });
});

describe("quantity naming", () => {
  it("provides Dutch names for quantities 1-10", () => {
    expect(Array.from({ length: 10 }, (_, index) => dutchQuantityName(index + 1))).toEqual([
      "een",
      "twee",
      "drie",
      "vier",
      "vijf",
      "zes",
      "zeven",
      "acht",
      "negen",
      "tien"
    ]);
  });
});

describe("challenge factory and mastery", () => {
  it("creates all 12 minigames and logs attempts to one tracker", () => {
    const factory = new ChallengeFactory();
    const tracker = new MasteryTracker();

    expect(ChallengeFactory.allMinigameTypes()).toHaveLength(12);
    expect(ChallengeFactory.allMinigameTypes()).toEqual([...MINIGAME_TYPES]);

    for (const type of MINIGAME_TYPES) {
      const challenge = factory.createMinigame(type, { quantity: type === "make-ten-shield" || type === "train-of-ten" ? 7 : 6 });
      const correct = challenge.options.find((option) => option.isCorrect);
      expect(correct).toBeTruthy();
      const attempt = buildAttemptLog({
        challenge,
        option: correct!,
        sessionId: "test-session",
        reactionTimeMs: 520,
        hintUsed: false
      });
      tracker.logAttempt(attempt);
    }

    expect(tracker.getAttempts()).toHaveLength(12);
    expect(tracker.getCells().length).toBeGreaterThan(0);
  });

  it("keeps boundary challenge quantities valid", () => {
    const factory = new ChallengeFactory();
    const makeTen = factory.createMinigame("make-ten-shield", { quantity: 10 });
    expect(makeTen.quantity).toBe(9);
    expect(makeTen.correctAnswer).toBe(1);
    expect(makeTen.options.some((option) => option.isCorrect && option.label === "1")).toBe(true);

    const split = factory.createMinigame("split-chests", { quantity: 1 });
    expect(split.quantity).toBe(3);
    expect(split.options.some((option) => option.isCorrect)).toBe(true);

    const oneMore = factory.createMinigame("one-more-one-less", { quantity: 10 });
    expect(oneMore.quantity).toBe(9);
    expect(oneMore.correctAnswer).toBe(10);

    const double = factory.createMinigame("double-track", { quantity: 7 });
    expect(double.quantity).toBe(8);
    expect(double.correctAnswer as string[]).toContain("1+7");
  });

  it("marks fast repeated subitizing as fluent", () => {
    const tracker = new MasteryTracker();
    for (let i = 0; i < 8; i += 1) {
      const attempt: AttemptLog = {
        timestamp: Date.now(),
        sessionId: "snap-session",
        levelId: "flash-gate",
        scene: "runner",
        challengeType: "flash-gates",
        skill: "subitize",
        representation: "dots",
        quantity: 3,
        quantityRange: getQuantityRange(3),
        promptRepresentation: "dots",
        answerRepresentation: "numeral",
        correctAnswer: 3,
        playerAnswer: 3,
        wasCorrect: true,
        reactionTimeMs: 320,
        hintUsed: false
      };
      tracker.logAttempt(attempt);
    }
    expect(tracker.getCell("subitize", "dots", "1-3").mastery).toBe("fluent");
  });
});

describe("WebWoud decision coverage", () => {
  it("maps every required anchor decision to a concrete challenge", () => {
    const factory = new ChallengeFactory();
    expect(anchorDecisionPlan.map((item) => item.decision)).toEqual([...anchorDecisionTypes]);

    for (const [index, decision] of anchorDecisionPlan.entries()) {
      const challenge = factory.createMinigame(decision.minigameType, {
        quantity: index + 1,
        representation: decision.promptRepresentation,
        scene: "webwoud",
        levelId: `webwoud-${decision.decision}`
      });
      expect(challenge.scene).toBe("webwoud");
      expect(challenge.levelId).toBe(`webwoud-${decision.decision}`);
      expect(challenge.options.some((option) => option.isCorrect)).toBe(true);
    }
  });
});

describe("BlokBlitz Sprint mechanic coverage", () => {
  it("maps every required runner mechanic to a valid number-structure challenge", () => {
    const factory = new ChallengeFactory();
    expect(runnerMechanics).toHaveLength(11);

    for (const mechanic of runnerMechanics) {
      const challenge = factory.createRunnerChallenge(mechanic, { quantity: mechanic === "make-ten-shield" ? 7 : 6 });
      expect(challenge.scene).toBe("runner");
      expect(challenge.levelId).toBe(mechanic);
      expect(challenge.mechanic).toBe(mechanic);
      expect(runnerMechanicLabels[mechanic]).toBeTruthy();
      expect(challenge.options.some((option) => option.isCorrect)).toBe(true);
      expect(challenge.successEffect.length).toBeGreaterThan(8);
      expect(challenge.safeErrorEffect.length).toBeGreaterThan(8);
      expect(challenge.hint.length).toBeGreaterThan(8);
    }
  });
});

describe("adaptive engine", () => {
  it("prioritizes make-10 after repeated make-10 misses", () => {
    const tracker = new MasteryTracker();
    const factory = new ChallengeFactory();
    for (let i = 0; i < 6; i += 1) {
      const challenge = factory.createMinigame("make-ten-shield", { quantity: 7 });
      const wrong = challenge.options.find((option) => !option.isCorrect)!;
      tracker.logAttempt(
        buildAttemptLog({
          challenge,
          option: wrong,
          sessionId: "adaptive-session",
          reactionTimeMs: 1800,
          hintUsed: true
        })
      );
    }
    const engine = new AdaptiveEngine(tracker);
    expect(engine.pickNextMinigame()).toBe("make-ten-shield");
    expect(engine.suggestedNextFocus()).toContain("Maak-10");
  });

  it("adjusts timing, representations, and repeats based on mastery", () => {
    const weakTracker = new MasteryTracker();
    for (let i = 0; i < 4; i += 1) {
      weakTracker.logAttempt(
        attempt({
          skill: "subitize",
          representation: "dots",
          quantity: 7,
          wasCorrect: false,
          playerAnswer: 6,
          reactionTimeMs: 1700,
          hintUsed: true
        })
      );
    }
    const weakEngine = new AdaptiveEngine(weakTracker);
    expect(weakEngine.displayTimeFor("subitize", 7, "dots")).toBeGreaterThan(1400);
    expect(weakEngine.chooseRepresentation("subitize", 7)).toBe("eggs");
    expect(weakEngine.displayTimeFor("subitize", 7, "eggs")).toBeGreaterThan(1400);
    expect(weakEngine.pickNextMinigame(["flash-gates", "dice-hunt"])).not.toBe("flash-gates");

    const fluentTracker = new MasteryTracker();
    for (let i = 0; i < 8; i += 1) {
      fluentTracker.logAttempt(
        attempt({
          skill: "subitize",
          representation: "dots",
          quantity: 7,
          wasCorrect: true,
          reactionTimeMs: 520,
          hintUsed: false
        })
      );
    }
    const fluentEngine = new AdaptiveEngine(fluentTracker);
    expect(fluentTracker.getCell("subitize", "dots", "6-8").mastery).toBe("fluent");
    expect(fluentEngine.displayTimeFor("subitize", 7, "dots")).toBeLessThan(1400);
    expect(fluentEngine.displayTimeFor("subitize", 7, "numeral")).toBeLessThan(1400);
  });

  it("surfaces required weak-skill focus guidance", () => {
    const cases = [
      { skill: "oneMoreLess" as const, expected: "voor/na" },
      { skill: "quantityToNumeral" as const, expected: "Koppel cijfers" },
      { skill: "numeralToQuantity" as const, expected: "Koppel cijfers" },
      { skill: "partwhole" as const, expected: "Split Chests" }
    ];

    for (const item of cases) {
      const tracker = new MasteryTracker();
      for (let i = 0; i < 5; i += 1) {
        tracker.logAttempt(
          attempt({
            skill: item.skill,
            representation: "dots",
            quantity: 6,
            wasCorrect: false,
            playerAnswer: 5,
            hintUsed: true,
            reactionTimeMs: 1600
          })
        );
      }
      expect(new AdaptiveEngine(tracker).suggestedNextFocus()).toContain(item.expected);
    }
  });

  it("turns adaptive display timing into live gameplay pressure", () => {
    expect(adaptivePressureMultiplier(1750)).toBeLessThan(1);
    expect(adaptivePressureMultiplier(950)).toBeGreaterThan(1);
    expect(adaptiveProgressRate(0.5, 1750)).toBeLessThan(0.5);
    expect(adaptiveProgressRate(0.5, 950)).toBeGreaterThan(0.5);
  });
});

describe("save manager persistence", () => {
  it("persists attempts, rewards, districts, sessions, and settings in localStorage", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear()
    });

    const save = new SaveManager();
    save.updateSettings((settings) => {
      settings.speed = 1.3;
      settings.muted = true;
      settings.haptics = false;
    });
    save.award({ stars: 4, blocks: 2, dinos: 1, numerianen: 1, streakDelta: 1 });

    const attempt: AttemptLog = {
      timestamp: Date.now(),
      sessionId: save.getMutableData().progress.sessionId,
      levelId: "save-test",
      scene: "city",
      challengeType: "build-the-number",
      skill: "buildQuantity",
      representation: "blocks",
      quantity: 7,
      quantityRange: "6-8",
      promptRepresentation: "numeral",
      answerRepresentation: "blocks",
      correctAnswer: 7,
      playerAnswer: 7,
      wasCorrect: true,
      reactionTimeMs: 900,
      hintUsed: false
    };
    save.appendAttempt(attempt);
    save.restoreDistrict("block-yard");
    save.endSession();

    const reloaded = new SaveManager().getData();
    expect(reloaded.settings.speed).toBe(1.3);
    expect(reloaded.settings.muted).toBe(true);
    expect(reloaded.settings.haptics).toBe(false);
    expect(reloaded.progress.attempts).toHaveLength(1);
    expect(reloaded.progress.stars).toBeGreaterThanOrEqual(6);
    expect(reloaded.progress.rescuedDinos).toBe(1);
    expect(reloaded.progress.rescuedNumerianen).toBe(1);
    expect(reloaded.progress.cityDistricts["block-yard"].restored).toBe(true);
    expect(reloaded.progress.currentLevel).toBe(2);
    expect(reloaded.progress.sessions[0].endedAt).toBeTypeOf("number");
  });
});

describe("curriculum mastery + adaptive resurfacing", () => {
  const cur = (targetKey: string, wasCorrect: boolean, over: Partial<AttemptLog> = {}): AttemptLog =>
    attempt({ domain: "literacy-reading", skill: "letterSound", targetKey, rangeKey: "letters", wasCorrect, ...over });

  it("groups domain-tagged attempts into per-target cells (kept out of the number views)", () => {
    const tracker = new MasteryTracker([
      // /s/ mastered: 6 tries, all correct.
      ...Array.from({ length: 6 }, () => cur("letter-s", true)),
      // /r/ shaky: 4 tries, mostly wrong.
      ...Array.from({ length: 4 }, (_, i) => cur("letter-r", i === 0)),
      // a maths-to-20 attempt in another domain.
      attempt({ domain: "math-number", skill: "teenNumber", targetKey: "teen-13", rangeKey: "teens", wasCorrect: true })
    ]);

    const reading = tracker.curriculumCells("literacy-reading");
    expect(reading).toHaveLength(2);
    const s = reading.find((c) => c.targetKey === "letter-s")!;
    const r = reading.find((c) => c.targetKey === "letter-r")!;
    expect(s.mastery).toBe("fluent");
    expect(r.mastery).toBe("emerging");
    expect(r.accuracy).toBeLessThan(0.5);
    // Domain filtering works; the maths attempt is its own cell.
    expect(tracker.curriculumCells("math-number")).toHaveLength(1);
    // None of this pollutes the number-mode mastery.
    expect(tracker.masteryBySkill().every((m) => m.exposures === 0)).toBe(true);
  });

  it("resurfaces the weakest seen target and the adaptive engine surfaces it", () => {
    const tracker = new MasteryTracker([
      ...Array.from({ length: 6 }, () => cur("letter-s", true)),
      ...Array.from({ length: 4 }, (_, i) => cur("letter-r", i === 0))
    ]);
    expect(tracker.weakCurriculumTarget("literacy-reading")).toBe("letter-r");
    // Nothing weak in an untouched domain -> undefined (generator rolls freely).
    expect(tracker.weakCurriculumTarget("math-operations")).toBeUndefined();

    const engine = new AdaptiveEngine(tracker);
    expect(engine.recommendCurriculumFocus("literacy-reading")).toBe("letter-r");
    expect(engine.recommendCurriculumFocus(undefined)).toBeUndefined();
  });
});
