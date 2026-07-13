import { buildCurriculumAttempt } from "../../education/challengeLogger";
import { letterProgress } from "../../education/literacy/letters";
import {
  evaluateTrace,
  traceChallenge,
  traceGuide,
  traceSettings,
  writingPracticeTarget,
  type TraceEvaluation,
  type TraceGuide,
  type TracePoint
} from "../../education/literacy/tracing";
import type { Challenge, ChallengeOption } from "../../education/types";
import type { Game } from "../../game/Game";
import { MiniGameScene } from "./MiniGameScene";

const SVG_NS = "http://www.w3.org/2000/svg";

// Schrijfspoor turns unlocked reading graphemes into a touch-first motor task.
// The guide stays visible, mistakes are safe, and scoring rewards completeness
// over neatness so small fingers can succeed without adult-level precision.
export class SchrijfspoorScene extends MiniGameScene {
  protected readonly emoji = "✏️";
  protected readonly heading = "Schrijfspoor";
  private grapheme = "i";
  private guide: TraceGuide = traceGuide("i");
  private strokes: TracePoint[][] = [];
  private activeStroke?: TracePoint[];
  private activePointer?: number;
  private svg?: SVGSVGElement;
  private inkLayer?: SVGGElement;
  private feedback?: HTMLElement;
  private lastEvaluation?: TraceEvaluation;
  private hasUnscoredInput = false;

  constructor(game: Game) {
    super(game, "schrijfspoor");
    this.total = 5;
  }

  protected makeChallenge(): Challenge {
    const attempts = this.game.mastery.getAttempts();
    const unlocked = letterProgress(attempts).unlockedLetters;
    this.grapheme = writingPracticeTarget(attempts, unlocked, this.adaptiveTargetKey());
    this.guide = traceGuide(this.grapheme);
    this.instruction = "Volg het lichtspoor met je vinger.";
    this.resetDrawingState();
    return traceChallenge(this.grapheme);
  }

  protected renderPlay(challenge: Challenge): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "mini-play schrijfspoor-play";
    wrap.dataset.guideLevel = traceSettings(this.tier()).guideLevel;

    const target = document.createElement("div");
    target.className = "schrijfspoor-target";
    target.setAttribute("aria-label", `Schrijf ${this.grapheme}`);
    target.innerHTML = `<span aria-hidden="true">✏️</span><strong>${this.grapheme}</strong><small>van stip naar ster</small>`;

    const board = document.createElement("div");
    board.className = "schrijfspoor-board";
    board.dataset.grapheme = this.grapheme;
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.classList.add("schrijfspoor-surface");
    svg.setAttribute("viewBox", `0 0 ${this.guide.width} ${this.guide.height}`);
    svg.setAttribute("role", "application");
    svg.setAttribute("aria-label", `Schrijfvlak voor ${this.grapheme}. Begin bij de groene stip.`);
    svg.setAttribute("tabindex", "0");
    svg.innerHTML = this.guideMarkup();
    this.svg = svg;
    this.inkLayer = svg.querySelector<SVGGElement>(".schrijfspoor-ink") ?? undefined;
    this.bindDrawing(svg);
    board.appendChild(svg);

    const feedback = document.createElement("div");
    feedback.className = "schrijfspoor-feedback";
    feedback.setAttribute("role", "status");
    feedback.setAttribute("aria-live", "polite");
    feedback.innerHTML = `<span aria-hidden="true">●</span><strong>Start bij groen</strong>`;
    this.feedback = feedback;

    const tools = document.createElement("div");
    tools.className = "schrijfspoor-tools";
    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "btn ghost schrijfspoor-clear";
    clear.setAttribute("aria-label", "Wis het getekende spoor");
    clear.title = "Wis het spoor";
    clear.innerHTML = `<span aria-hidden="true">↺</span><span class="sr-only">Wis het spoor</span>`;
    clear.addEventListener("click", () => this.clearTrace());

    const check = document.createElement("button");
    check.type = "button";
    check.className = "btn play-now schrijfspoor-check";
    check.dataset.action = "Klaar met schrijven";
    check.setAttribute("aria-label", `Klaar met het schrijven van ${this.grapheme}`);
    check.innerHTML = `<span aria-hidden="true">★</span><strong>Klaar</strong>`;
    check.addEventListener("click", () => this.submitTrace(challenge.options[0]));
    tools.append(clear, check);

    wrap.append(target, board, feedback, tools);
    return wrap;
  }

  protected currentTargetKey(): string | undefined {
    return `write-${this.grapheme}`;
  }

  protected announceRound(): void {
    this.game.voice.speakThen(
      this.instruction,
      () => this.game.readingAudio.playPhoneme(this.grapheme, { interrupt: false, rate: 0.85 }),
      { interrupt: true }
    );
  }

  protected replayPrompt(): void {
    this.buddy?.setMood("think", 900);
    this.announceRound();
  }

  protected logAttempt(option: ChallengeOption): boolean {
    const evaluation = this.lastEvaluation ?? evaluateTrace(this.guide, this.strokes, traceSettings(this.tier()).corridor);
    option.isCorrect = evaluation.complete;
    const errorType = evaluation.complete
      ? undefined
      : evaluation.coverage < 0.64
        ? "trace-incomplete"
        : evaluation.precision < 0.4
          ? "trace-off-path"
          : "trace-direction";
    const attempt = buildCurriculumAttempt({
      sessionId: this.game.save.getMutableData().progress.sessionId,
      domain: "literacy-writing",
      skill: "letterForm",
      targetKey: `write-${this.grapheme}`,
      rangeKey: this.grapheme.length === 1 ? "lowercase-letter" : "lowercase-grapheme",
      stimulusKey: this.grapheme,
      responseKey: `trace-${Math.round(evaluation.score * 100)}`,
      wasCorrect: evaluation.complete,
      reactionTimeMs: performance.now() - this.startedAt,
      hintUsed: this.hintUsed,
      errorType
    });
    return this.game.recordCurriculumAttempt(attempt);
  }

  protected showScaffold(): void {
    const missed = this.lastEvaluation?.missedPoint;
    const marker = this.svg?.querySelector<SVGCircleElement>(".schrijfspoor-missed");
    if (marker && missed) {
      marker.setAttribute("cx", String(missed.x));
      marker.setAttribute("cy", String(missed.y));
      marker.removeAttribute("hidden");
    }
    this.svg?.classList.add("needs-help");
  }

  protected onWrong(): void {
    this.feedback?.classList.add("help");
    if (this.feedback) this.feedback.innerHTML = `<span aria-hidden="true">→</span><strong>Volg het licht verder</strong>`;
    this.reteach("Begin bij de groene stip en volg het spoor naar de ster.");
    this.later(() => {
      if (!this.hasUnscoredInput && this.root.isConnected) this.clearTrace();
    }, 1100);
  }

  protected onCorrect(): void {
    this.svg?.classList.add("complete");
    this.feedback?.classList.remove("help");
    if (this.feedback) {
      const excellent = Boolean(this.lastEvaluation?.excellent);
      this.feedback.classList.add("good");
      this.feedback.innerHTML = `<span aria-hidden="true">${excellent ? "★" : "✓"}</span><strong>${excellent ? "Prachtig spoor!" : "Letter gelukt!"}</strong>`;
    }
  }

  private resetDrawingState(): void {
    this.strokes = [];
    this.activeStroke = undefined;
    this.activePointer = undefined;
    this.lastEvaluation = undefined;
    this.hasUnscoredInput = false;
    this.svg = undefined;
    this.inkLayer = undefined;
    this.feedback = undefined;
  }

  private guideMarkup(): string {
    const paths = this.guide.strokes
      .map((stroke, index) => {
        const start = stroke[0];
        const end = stroke[stroke.length - 1];
        return `
          <path class="schrijfspoor-guide-shadow" d="${this.pathData(stroke)}" />
          <path class="schrijfspoor-guide-stroke" data-stroke="${index}" d="${this.pathData(stroke)}" />
          <g class="schrijfspoor-start" transform="translate(${start.x} ${start.y})"><circle r="9"></circle><text y="4">${index + 1}</text></g>
          <text class="schrijfspoor-end" x="${end.x}" y="${end.y + 5}" text-anchor="middle">★</text>`;
      })
      .join("");
    return `
      <defs>
        <pattern id="trace-lines" width="220" height="45" patternUnits="userSpaceOnUse">
          <path d="M 0 44.5 H 220" stroke="#b9d8f0" stroke-width="1.5" stroke-dasharray="5 7" />
        </pattern>
      </defs>
      <rect class="schrijfspoor-paper" x="2" y="2" width="216" height="176" rx="14" />
      <rect x="8" y="8" width="204" height="164" rx="10" fill="url(#trace-lines)" />
      <g class="schrijfspoor-guide">${paths}</g>
      <g class="schrijfspoor-ink"></g>
      <circle class="schrijfspoor-missed" cx="0" cy="0" r="13" hidden></circle>`;
  }

  private bindDrawing(svg: SVGSVGElement): void {
    const down = (event: PointerEvent): void => {
      if (this.resolving || this.activePointer !== undefined) return;
      const tracePoint = this.eventPoint(event);
      if (!tracePoint) return;
      event.preventDefault();
      this.activePointer = event.pointerId;
      this.activeStroke = [tracePoint];
      this.strokes.push(this.activeStroke);
      this.hasUnscoredInput = true;
      this.lastEvaluation = undefined;
      svg.classList.add("drawing");
      svg.classList.remove("needs-help");
      svg.querySelector(".schrijfspoor-missed")?.setAttribute("hidden", "true");
      try {
        svg.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is optional on older tablet WebViews.
      }
      this.renderInk();
    };
    const move = (event: PointerEvent): void => {
      if (event.pointerId !== this.activePointer || !this.activeStroke) return;
      event.preventDefault();
      const events = typeof event.getCoalescedEvents === "function" ? event.getCoalescedEvents() : [event];
      for (const sample of events) {
        const tracePoint = this.eventPoint(sample);
        const previous = this.activeStroke[this.activeStroke.length - 1];
        if (tracePoint && (!previous || Math.hypot(tracePoint.x - previous.x, tracePoint.y - previous.y) >= 1.5)) this.activeStroke.push(tracePoint);
      }
      this.renderInk();
    };
    const up = (event: PointerEvent): void => {
      if (event.pointerId !== this.activePointer) return;
      event.preventDefault();
      this.activePointer = undefined;
      this.activeStroke = undefined;
      svg.classList.remove("drawing");
      this.feedback?.classList.remove("help", "good");
      if (this.feedback) this.feedback.innerHTML = `<span aria-hidden="true">★</span><strong>Tik klaar als je letter af is</strong>`;
    };
    svg.addEventListener("pointerdown", down);
    svg.addEventListener("pointermove", move);
    svg.addEventListener("pointerup", up);
    svg.addEventListener("pointercancel", up);
  }

  private eventPoint(event: Pick<PointerEvent, "clientX" | "clientY">): TracePoint | undefined {
    const rect = this.svg?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return undefined;
    return {
      x: Math.max(0, Math.min(this.guide.width, ((event.clientX - rect.left) / rect.width) * this.guide.width)),
      y: Math.max(0, Math.min(this.guide.height, ((event.clientY - rect.top) / rect.height) * this.guide.height))
    };
  }

  private pathData(stroke: TracePoint[]): string {
    if (stroke.length === 0) return "";
    if (stroke.length === 1) return `M ${stroke[0].x} ${stroke[0].y} l 0.01 0`;
    return stroke.map((tracePoint, index) => `${index === 0 ? "M" : "L"} ${tracePoint.x.toFixed(1)} ${tracePoint.y.toFixed(1)}`).join(" ");
  }

  private renderInk(): void {
    if (!this.inkLayer) return;
    this.inkLayer.replaceChildren();
    for (const stroke of this.strokes) {
      if (stroke.length === 0) continue;
      const path = document.createElementNS(SVG_NS, "path");
      path.classList.add("schrijfspoor-ink-stroke");
      path.setAttribute("d", this.pathData(stroke));
      this.inkLayer.appendChild(path);
    }
  }

  private clearTrace(): void {
    this.strokes = [];
    this.activeStroke = undefined;
    this.activePointer = undefined;
    this.lastEvaluation = undefined;
    this.hasUnscoredInput = false;
    this.inkLayer?.replaceChildren();
    this.svg?.classList.remove("drawing", "needs-help", "complete");
    this.svg?.querySelector(".schrijfspoor-missed")?.setAttribute("hidden", "true");
    this.feedback?.classList.remove("help", "good");
    if (this.feedback) this.feedback.innerHTML = `<span aria-hidden="true">●</span><strong>Start bij groen</strong>`;
  }

  private submitTrace(option: ChallengeOption): void {
    if (this.resolving) return;
    if (this.strokes.every((stroke) => stroke.length === 0)) {
      this.svg?.classList.add("needs-help");
      this.reteach("Begin bij de groene stip en volg het spoor naar de ster.");
      return;
    }
    this.lastEvaluation = evaluateTrace(this.guide, this.strokes, traceSettings(this.tier()).corridor);
    this.hasUnscoredInput = false;
    option.isCorrect = this.lastEvaluation.complete;
    this.pick(option);
  }
}
