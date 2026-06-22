// Bridges the adaptive education engine to the runner's number gates.
//
// Every gate is a real Challenge (subitise / count / compare) whose three
// options become the three lanes. The child steers into the lane that matches
// the spoken-style target, and the scene logs the attempt through the same
// MasteryTracker the rest of the app uses.

import type { AdaptiveEngine } from "../education/adaptiveEngine";
import type { ChallengeFactory } from "../education/challengeFactory";
import type { Challenge, MinigameType, Skill } from "../education/types";
import { clampQuantity } from "../education/quantityLayouts";
import type { GateProvider, GateSpec } from "./RunnerCore";

// The three gate types that read instantly for a 4-7 year old running at speed.
const TYPE_BY_SKILL: Record<Skill, MinigameType> = {
  subitize: "flash-gates",
  quantityToNumeral: "dice-hunt",
  numeralToQuantity: "dice-hunt",
  compare: "enemy-wave-compare",
  make10: "flash-gates",
  partwhole: "flash-gates",
  oneMoreLess: "dice-hunt",
  buildQuantity: "dice-hunt"
};

// Default getalbeeld rotation, used when a world doesn't restrict the set.
const DEFAULT_REPRESENTATIONS = [
  "dice",
  "dots",
  "tenframe",
  "fingers",
  "beads",
  "domino",
  "blocks",
  "fiveframe",
  "eggs",
  "numeral",
  "pawprints",
  "mixed"
];

const DEFAULT_TYPES: MinigameType[] = ["flash-gates", "dice-hunt", "enemy-wave-compare"];

export interface GateConfig {
  maxQuantity: number;
  gateTypes: MinigameType[];
  representations: string[];
}

function targetText(challenge: Challenge): string {
  if (challenge.challengeType === "enemy-wave-compare") return "Pak de grootste!";
  if (challenge.challengeType === "dice-hunt") return `Pak de ${challenge.quantity}!`;
  return `Ren door de ${challenge.quantity}!`;
}

export class AdaptiveGateProvider implements GateProvider {
  private counter = 0;
  private lastType?: MinigameType;
  private readonly config: GateConfig;

  constructor(
    private readonly adaptive: AdaptiveEngine,
    private readonly challenges: ChallengeFactory,
    config?: Partial<GateConfig>
  ) {
    this.config = {
      maxQuantity: config?.maxQuantity ?? 10,
      gateTypes: config?.gateTypes?.length ? config.gateTypes : DEFAULT_TYPES,
      representations: config?.representations?.length ? config.representations : DEFAULT_REPRESENTATIONS
    };
  }

  next(roundIndex: number): GateSpec {
    const focus = this.adaptive.recommendFocus();
    // Pick a gate type the adaptive engine wants, but only from this world's set.
    let type = TYPE_BY_SKILL[focus.skill] ?? "flash-gates";
    if (!this.config.gateTypes.includes(type)) type = this.config.gateTypes[roundIndex % this.config.gateTypes.length];
    // Keep some variety: don't show the same gate type three rounds running.
    if (type === this.lastType && roundIndex > 0 && this.config.gateTypes.length > 1) {
      type = this.config.gateTypes[(this.config.gateTypes.indexOf(type) + 1) % this.config.gateTypes.length];
    }
    this.lastType = type;

    // Keep quantities within the world's band; compare needs headroom for the bigger group.
    const cap = clampQuantity(this.config.maxQuantity);
    let quantity = Math.min(cap, Math.max(2, clampQuantity(focus.quantity)));
    if (type === "enemy-wave-compare") quantity = Math.min(8, Math.max(2, Math.min(cap, quantity)));
    const representation = this.adaptive.chooseRepresentation(focus.skill, quantity);
    const challenge = this.challenges.createMinigame(type, { quantity, representation, scene: "runner" });

    const lanes = challenge.options.map((option) => {
      const value = option.quantity ?? (Number(option.value) || 1);
      return { quantity: value, correct: option.isCorrect, numeral: String(value) };
    });
    const correctLane = Math.max(0, challenge.options.findIndex((option) => option.isCorrect));

    const gateRepresentation = this.config.representations[this.counter % this.config.representations.length];
    this.counter += 1;
    return {
      id: `gate-${this.counter}`,
      lanes,
      correctLane,
      targetText: targetText(challenge),
      skill: challenge.skill,
      representation: gateRepresentation,
      meta: challenge
    };
  }
}
