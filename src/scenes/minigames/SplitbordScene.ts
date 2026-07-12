import { buildCurriculumAttempt } from "../../education/challengeLogger";
import {
  classifySplitError,
  splitRemediation,
  type SplitMisconception,
  type SplitMode
} from "../../education/math/splits";
import type { Challenge, ChallengeOption } from "../../education/types";
import type { Game } from "../../game/Game";
import { splitbordChallenge } from "./miniChallenges";
import { MiniGameScene } from "./MiniGameScene";

interface SplitContext {
  mode: SplitMode;
  total: number;
  left: number;
  right: number;
  targetKey: string;
}

// The rekenbordje met 3 vakjes: one "samen" (total) box on top and two part
// boxes below. Depending on the round the child picks the two parts, the missing
// part, or the total. The board layout itself carries the structure; the tap row
// is the answer. Logs as the existing `partwhole` skill.
export class SplitbordScene extends MiniGameScene {
  protected readonly emoji = "⚖️";
  protected readonly heading = "Splitsbord";
  private split?: SplitContext;
  private splitChallengeId = "";

  constructor(game: Game) {
    super(game, "splitbord");
  }

  protected makeChallenge(): Challenge {
    const focusedTotal = Number(this.adaptiveTargetKey()?.match(/^split-(\d+)-/)?.[1]);
    const challenge = splitbordChallenge(
      Number.isFinite(focusedTotal) ? Math.max(2, Math.min(10, focusedTotal)) : this.focusQuantity(3, 10)
    );
    this.split = this.contextFor(challenge);
    this.splitChallengeId = challenge.id;
    this.instruction = challenge.prompt;
    return challenge;
  }

  private contextFor(challenge: Challenge): SplitContext {
    const [, rawMode, totalDisplay, leftDisplay, rightDisplay] = challenge.mechanic.split("|");
    const mode = rawMode as SplitMode;
    const correct = challenge.options.find((option) => option.isCorrect);
    const pair = String(correct?.label ?? "").match(/^(\d+)\+(\d+)$/);
    let total = totalDisplay === "?" ? Number(correct?.value) : Number(totalDisplay);
    let left = leftDisplay === "?" ? Number.NaN : Number(leftDisplay);
    let right = rightDisplay === "?" ? Number.NaN : Number(rightDisplay);
    if (mode === "pick-parts" && pair) {
      left = Number(pair[1]);
      right = Number(pair[2]);
    } else if (mode === "pick-missing") {
      right = Number(correct?.value);
    }
    if (!Number.isFinite(total)) total = left + right;
    if (!Number.isFinite(left)) left = total - right;
    if (!Number.isFinite(right)) right = total - left;
    return { mode, total, left, right, targetKey: `split-${total}-${left}-${right}` };
  }

  protected renderPlay(challenge: Challenge): HTMLElement {
    // mechanic = "split|<mode>|<totalDisplay>|<leftDisplay>|<rightDisplay>"
    const [, mode, totalD = "?", leftD = "?", rightD = "?"] = challenge.mechanic.split("|");
    const wrap = document.createElement("div");
    wrap.className = "mini-play splitbord-play";

    const board = document.createElement("div");
    board.className = "splitbord-board";
    board.innerHTML = `
      <div class="splitbord-total ${totalD === "?" ? "empty" : ""}"><span class="splitbord-box-label">samen</span><b>${totalD}</b></div>
      <div class="splitbord-stem" aria-hidden="true"></div>
      <div class="splitbord-parts">
        <div class="splitbord-part ${leftD === "?" ? "empty" : ""}"><b>${leftD}</b><span class="splitbord-nest" aria-hidden="true"></span></div>
        <span class="splitbord-plus" aria-hidden="true">+</span>
        <div class="splitbord-part ${rightD === "?" ? "empty" : ""}"><b>${rightD}</b><span class="splitbord-nest" aria-hidden="true"></span></div>
      </div>
    `;

    const choices = document.createElement("div");
    choices.className = "mini-choices splitbord-choices";
    challenge.options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mini-choice splitbord-choice";
      button.dataset.correct = String(option.isCorrect);
      button.dataset.value = String(option.value ?? option.label);
      button.setAttribute("aria-label", option.label);
      button.innerHTML = `<span class="splitbord-choice-num">${option.label}</span>`;
      button.addEventListener("click", () => this.pick(option));
      choices.appendChild(button);
    });

    wrap.appendChild(board);
    // Hands-on rekenbordje: for the "which part is missing?" rounds the child
    // gets a tray with ALL the eggs (the total) and taps them INTO the empty
    // box — seeing and feeling how many still fit. When the built amount
    // matches an answer, that numeral lights up; the tap on it stays the
    // confirmation (same challenge + logging as before).
    if (mode === "pick-missing" && totalD !== "?") {
      wrap.appendChild(this.buildEggTray(Number(totalD), board, choices));
    }
    wrap.appendChild(choices);
    return wrap;
  }

  private buildEggTray(total: number, board: HTMLElement, choices: HTMLElement): HTMLElement {
    const tray = document.createElement("div");
    tray.className = "splitbord-tray";
    tray.setAttribute("aria-label", "Tik eieren in het lege vak");
    const nest = board.querySelector<HTMLElement>(".splitbord-part.empty .splitbord-nest");
    const sync = (): void => {
      const built = nest?.childElementCount ?? 0;
      choices.querySelectorAll<HTMLElement>(".splitbord-choice").forEach((button) => {
        button.classList.toggle("suggest", Number(button.dataset.value) === built && built > 0);
      });
    };
    for (let i = 0; i < total; i += 1) {
      const egg = document.createElement("button");
      egg.type = "button";
      egg.className = "splitbord-egg";
      egg.setAttribute("aria-label", "ei");
      egg.textContent = "🥚";
      egg.addEventListener("click", () => {
        if (this.resolving || !nest) return;
        if (egg.parentElement === tray) {
          nest.appendChild(egg);
          this.game.audio.play("coin");
        } else {
          tray.appendChild(egg);
          this.game.audio.play("snap");
        }
        egg.classList.remove("hop");
        void egg.offsetWidth;
        egg.classList.add("hop");
        sync();
      });
      tray.appendChild(egg);
    }
    return tray;
  }

  protected currentTargetKey(): string | undefined {
    return this.activeSplit()?.targetKey;
  }

  private activeSplit(): SplitContext | undefined {
    if (!this.current) return this.split;
    if (!this.split || this.splitChallengeId !== this.current.id) {
      this.split = this.contextFor(this.current);
      this.splitChallengeId = this.current.id;
    }
    return this.split;
  }

  private errorFor(option: ChallengeOption): SplitMisconception | undefined {
    const split = this.activeSplit();
    if (!split) return undefined;
    const pair = String(option.label ?? "").match(/^(\d+)\+(\d+)$/);
    return classifySplitError({
      mode: split.mode,
      total: split.total,
      correctLeft: split.left,
      correctRight: split.right,
      knownPart: split.mode === "pick-missing" ? split.left : undefined,
      playerLeft: pair ? Number(pair[1]) : undefined,
      playerRight: pair ? Number(pair[2]) : undefined,
      playerValue: pair ? undefined : Number(option.value)
    });
  }

  protected logAttempt(option: ChallengeOption): boolean {
    const split = this.activeSplit();
    if (!split) return super.logAttempt(option);
    const attempt = buildCurriculumAttempt({
      sessionId: this.game.save.getMutableData().progress.sessionId,
      domain: "math-number",
      skill: "partwhole",
      targetKey: split.targetKey,
      rangeKey: "splits-10",
      stimulusKey: `${split.total}=${split.left}+${split.right}`,
      responseKey: String(option.label ?? option.value),
      wasCorrect: option.isCorrect,
      reactionTimeMs: performance.now() - this.startedAt,
      hintUsed: this.hintUsed,
      errorType: this.errorFor(option)
    });
    // Preserve the established activity identity while enriching the attempt
    // with domain/target metadata for adaptive split remediation.
    attempt.levelId = this.current.levelId;
    attempt.challengeType = this.current.challengeType;
    return this.game.recordCurriculumAttempt(attempt);
  }

  protected showScaffold(): void {}

  protected onWrong(option: ChallengeOption): void {
    const error = this.errorFor(option);
    const plan = this.remediation(splitRemediation(error, this.current.hint || "Tel de twee delen samen."));
    const board = this.root.querySelector<HTMLElement>(".splitbord-board");
    board?.classList.add(`support-${plan.level}`);
    if (plan.level !== "nudge") this.root.querySelector<HTMLElement>(".splitbord-tray")?.classList.add("support-guided");
    if (plan.revealAnswer) {
      this.root.querySelector('.splitbord-choice[data-correct="true"]')?.classList.add("reveal");
      this.showWorkedSplit();
    }
    this.reteach(plan.text);
  }

  private showWorkedSplit(): void {
    const split = this.activeSplit();
    if (!split) return;
    this.root.querySelector(".mini-scaffold")?.remove();
    const panel = document.createElement("div");
    panel.className = "mini-scaffold splitbord-model";
    panel.dataset.scaffold = "true";
    panel.innerHTML = `<small>Kijk: ${split.total} is ${split.left} en ${split.right}.</small><div class="splitbord-model-fact"><strong>${split.total}</strong><span>=</span><b>${split.left}</b><span>+</span><b>${split.right}</b></div>`;
    this.root.appendChild(panel);
    this.later(() => panel.remove(), 2400);
  }

  // Signature moment: the split CLICKS together and the missing numbers LAND
  // in their dashed boxes. The mechanic packs the DISPLAY state
  // ("split|mode|total|left|right" with "?" for hidden), so real values are
  // derived: the missing one from the other two, or from the chosen pair.
  protected onCorrect(option: ChallengeOption): void {
    const board = this.root.querySelector<HTMLElement>(".splitbord-board");
    if (!board) return;
    board.classList.add("snapped");
    const [, , totalD, leftD, rightD] = (this.current.mechanic || "").split("|");
    const num = (s?: string) => (s && s !== "?" ? Number(s) : undefined);
    let total = num(totalD);
    let left = num(leftD);
    let right = num(rightD);
    if (left === undefined && right === undefined) {
      const pair = String(option.label ?? "").match(/\d+/g);
      if (pair && pair.length >= 2) {
        left = Number(pair[0]);
        right = Number(pair[1]);
      }
    }
    if (total === undefined && left !== undefined && right !== undefined) total = left + right;
    if (left === undefined && total !== undefined && right !== undefined) left = total - right;
    if (right === undefined && total !== undefined && left !== undefined) right = total - left;
    const land = (box: HTMLElement, value: number | undefined) => {
      if (value === undefined) return;
      box.classList.add("landed");
      const b = box.querySelector("b");
      if (b) b.textContent = String(value);
    };
    const totalBox = board.querySelector<HTMLElement>(".splitbord-total.empty");
    if (totalBox) land(totalBox, total);
    board.querySelectorAll<HTMLElement>(".splitbord-part").forEach((box, i) => {
      if (box.classList.contains("empty")) land(box, i === 0 ? left : right);
    });
  }
}
