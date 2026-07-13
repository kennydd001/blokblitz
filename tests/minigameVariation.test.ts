// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AttemptLog, Challenge } from "../src/education/types";
import { Game } from "../src/game/Game";
import { MiniGameScene } from "../src/scenes/minigames/MiniGameScene";

class VariationScene extends MiniGameScene {
  protected readonly emoji = "V";
  protected readonly heading = "Variatie";
  protected readonly instruction = "Kies.";
  private target = "";
  generated = 0;

  constructor(game: Game, private readonly targets: string[]) {
    super(game, "variation-test");
    this.total = 3;
  }

  protected makeChallenge(): Challenge {
    this.generated += 1;
    this.target = this.targets.shift() ?? this.target;
    return {
      id: `variation-${this.generated}`,
      levelId: "variation-test",
      challengeType: "variation",
      title: "Variatie",
      prompt: this.target,
      scene: "minigame",
      skill: "subitize",
      representation: "numeral",
      promptRepresentation: "numeral",
      answerRepresentation: "numeral",
      quantity: 1,
      correctAnswer: this.target,
      displayTimeMs: 1000,
      options: [
        { id: `yes-${this.generated}`, label: this.target, value: this.target, representation: "numeral", svg: "", isCorrect: true },
        { id: `no-${this.generated}`, label: "x", value: "x", representation: "numeral", svg: "", isCorrect: false }
      ],
      mechanic: "variation",
      successEffect: "goed",
      safeErrorEffect: "opnieuw",
      hint: "kijk"
    };
  }

  protected currentTargetKey(): string | undefined {
    return this.target;
  }

  protected renderPlay(challenge: Challenge): HTMLElement {
    const play = document.createElement("div");
    play.className = "mini-play variation-play";
    play.dataset.target = this.target;
    challenge.options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mini-choice";
      button.dataset.correct = String(option.isCorrect);
      button.textContent = option.label;
      button.addEventListener("click", () => this.pick(option));
      play.appendChild(button);
    });
    return play;
  }

  protected announceRound(): void {}
}

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '<div id="app"></div>';
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  localStorage.clear();
  document.body.replaceChildren();
});

describe("within-session variation", () => {
  it("does not label a fresh discovery round as a warm-up", () => {
    const game = new Game(document.querySelector<HTMLElement>("#app")!);
    expect(game.curriculumFocus("literacy-reading")).toBeUndefined();
    expect(game.curriculumFocusReason()).toBe("discovery");
  });

  it("consumes a profile-local due-target warm-up before normal adaptive review", () => {
    const game = new Game(document.querySelector<HTMLElement>("#app")!);
    const old = Date.now() - 12 * 86_400_000;
    const historical = ["letter-i", "letter-k", "letter-m"].map(
      (targetKey, index) =>
        ({
          timestamp: old + index,
          sessionId: "last-week",
          levelId: "literacy-reading",
          scene: "minigame",
          challengeType: "literacy-reading:letterSound",
          skill: "letterSound",
          representation: "numeral",
          quantity: 0,
          quantityRange: "1-3",
          promptRepresentation: "numeral",
          correctAnswer: targetKey,
          playerAnswer: targetKey,
          wasCorrect: true,
          reactionTimeMs: 500,
          hintUsed: false,
          domain: "literacy-reading",
          targetKey
        }) as AttemptLog
    );
    game.save.updateProgress((progress) => {
      progress.attempts = historical;
    });
    game.mastery.setAttempts(historical);
    game.save.startNewSession();

    expect(game.curriculumFocus("literacy-reading")).toBe("letter-i");
    expect(game.curriculumFocusReason()).toBe("warmup");
    expect(game.curriculumFocus("literacy-reading")).toBe("letter-k");
    expect(game.curriculumFocusReason()).toBe("warmup");
    expect(game.curriculumFocus("literacy-reading")).toBe("letter-m");
    expect(game.curriculumFocusReason()).toBe("warmup");
    expect(game.curriculumFocus("literacy-reading")).toBe("letter-i");
    expect(game.curriculumFocusReason()).toBe("review");
  });

  it("keeps warm-up targets inside the activity that can actually generate them", () => {
    const game = new Game(document.querySelector<HTMLElement>("#app")!);
    const old = Date.now() - 12 * 86_400_000;
    const attempts: AttemptLog[] = [
      {
        timestamp: old,
        sessionId: "last-week",
        levelId: "literacy-reading",
        scene: "minigame",
        challengeType: "literacy-reading:letterSound",
        skill: "letterSound",
        representation: "numeral",
        quantity: 0,
        quantityRange: "1-3",
        promptRepresentation: "numeral",
        correctAnswer: "letter-i",
        playerAnswer: "letter-i",
        wasCorrect: true,
        reactionTimeMs: 500,
        hintUsed: false,
        domain: "literacy-reading",
        targetKey: "letter-i"
      },
      {
        timestamp: old + 1,
        sessionId: "last-week",
        levelId: "zoemroute",
        scene: "minigame",
        challengeType: "word-blend",
        skill: "wordRead",
        representation: "numeral",
        quantity: 0,
        quantityRange: "1-3",
        promptRepresentation: "numeral",
        correctAnswer: "maan",
        playerAnswer: "maan",
        wasCorrect: true,
        reactionTimeMs: 500,
        hintUsed: false,
        domain: "literacy-reading",
        targetKey: "word-maan"
      }
    ];
    game.save.updateProgress((progress) => { progress.attempts = attempts; });
    game.mastery.setAttempts(attempts);
    game.save.startNewSession();

    expect(game.curriculumFocus("literacy-reading", "zoemroute")).toBe("word-maan");
    expect(game.curriculumFocus("literacy-reading", "letterkompas")).toBe("letter-i");
  });

  it("rerolls an accidental immediate target repeat", () => {
    const game = new Game(document.querySelector<HTMLElement>("#app")!);
    const scene = new VariationScene(game, ["a", "a", "b"]);
    scene.mount();
    expect(document.querySelector<HTMLElement>(".variation-play")?.dataset.target).toBe("a");

    document.querySelector<HTMLButtonElement>('.variation-play [data-correct="true"]')!.click();
    vi.advanceTimersByTime(1100);

    expect(document.querySelector<HTMLElement>(".variation-play")?.dataset.target).toBe("b");
    expect(scene.generated).toBe(3);
    scene.unmount();
  });

  it("keeps an explicit adaptive focus stronger than the variation cooldown", () => {
    const game = new Game(document.querySelector<HTMLElement>("#app")!);
    const scene = new VariationScene(game, ["a", "b", "a"]);
    scene.mount();
    vi.spyOn(game, "curriculumFocus").mockReturnValue("a");

    document.querySelector<HTMLButtonElement>('.variation-play [data-correct="true"]')!.click();
    vi.advanceTimersByTime(1100);

    expect(document.querySelector<HTMLElement>(".variation-play")?.dataset.target).toBe("a");
    expect(scene.generated).toBe(3);
    scene.unmount();
  });

  it("breaks a third identical correct-answer position without alternating every round", () => {
    const game = new Game(document.querySelector<HTMLElement>("#app")!);
    const scene = new VariationScene(game, ["a", "b", "c"]);
    scene.mount();
    const correctIndex = (): number =>
      [...document.querySelectorAll<HTMLButtonElement>(".variation-play .mini-choice")].findIndex(
        (choice) => choice.dataset.correct === "true"
      );

    expect(correctIndex()).toBe(0);
    document.querySelector<HTMLButtonElement>('.variation-play [data-correct="true"]')!.click();
    vi.advanceTimersByTime(1100);
    expect(correctIndex()).toBe(0);

    document.querySelector<HTMLButtonElement>('.variation-play [data-correct="true"]')!.click();
    vi.advanceTimersByTime(1100);
    expect(correctIndex()).toBe(1);
    scene.unmount();
  });

  it("changes the rescued animal between consecutive Count rounds", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const game = new Game(document.querySelector<HTMLElement>("#app")!);
    game.showScene("count");
    const firstAnimal = document.querySelector<HTMLButtonElement>(".count-item")!.textContent;

    document.querySelectorAll<HTMLButtonElement>(".count-item").forEach((animal) => animal.click());
    document.querySelector<HTMLButtonElement>('.count-choices [data-correct="true"]')!.click();
    vi.advanceTimersByTime(1100);

    expect(document.querySelector<HTMLButtonElement>(".count-item")!.textContent).not.toBe(firstAnimal);
  });
});
