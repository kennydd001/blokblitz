import { childFocusTitle, childRepresentationName } from "./focusLabels";
import type { MasteryTracker } from "./masteryTracker";
import { getQuantityRange } from "./quantityLayouts";
import { phaseForExposure, preferredRepresentationsForSkill } from "./progression";
import type { MinigameType, QuantityRange, Representation, Skill } from "./types";
import { MINIGAME_TYPES, REPRESENTATIONS, SKILLS } from "./types";

export interface AdaptiveFocus {
  skill: Skill;
  representation: Representation;
  range: QuantityRange;
  quantity: number;
  reason: string;
}

const skillToMinigame: Record<Skill, MinigameType[]> = {
  subitize: ["flash-gates", "dice-hunt", "double-track"],
  make10: ["make-ten-shield", "train-of-ten", "bead-bridge"],
  partwhole: ["split-chests", "double-track", "train-of-ten"],
  compare: ["enemy-wave-compare"],
  oneMoreLess: ["one-more-one-less"],
  quantityToNumeral: ["flash-gates", "dice-hunt", "web-anchors"],
  numeralToQuantity: ["build-the-number", "web-anchors"],
  buildQuantity: ["build-the-number", "rescue-the-herd", "bead-bridge"]
};

export class AdaptiveEngine {
  constructor(private readonly tracker: MasteryTracker) {}

  recommendFocus(): AdaptiveFocus {
    const cells = this.tracker.getCells(true);
    const weak = cells
      .map((cell) => {
        const penalty = cell.exposures === 0 ? 0.28 : 1 - cell.accuracy + cell.hintRate + (cell.mastery === "emerging" ? 0.35 : 0);
        return { cell, penalty };
      })
      .sort((a, b) => b.penalty - a.penalty)[0].cell;
    const rangeStart: Record<QuantityRange, number> = {
      "1-3": 2,
      "4-5": 5,
      "6-8": 7,
      "9-10": 10
    };
    return {
      skill: weak.skill,
      representation: weak.representation,
      range: weak.range,
      quantity: rangeStart[weak.range],
      reason: `${childFocusTitle(weak.skill)} met ${childRepresentationName(weak.representation)} is ${weak.mastery}`
    };
  }

  pickNextMinigame(lastTypes: string[] = []): MinigameType {
    const stats = this.tracker.masteryBySkill();
    const practicedWeak = stats
      .filter((item) => item.exposures >= 3 && item.accuracy < 0.7)
      .sort((a, b) => a.accuracy - b.accuracy || b.exposures - a.exposures)[0];
    const bySkill = [...stats].sort((a, b) => {
      const aScore = (a.exposures < 3 ? -0.3 : a.accuracy) + (a.mastery === "emerging" ? -0.2 : 0);
      const bScore = (b.exposures < 3 ? -0.3 : b.accuracy) + (b.mastery === "emerging" ? -0.2 : 0);
      return aScore - bScore;
    });
    const weakestSkill = practicedWeak?.skill ?? bySkill[0]?.skill ?? "subitize";
    const candidates = skillToMinigame[weakestSkill].filter((type) => !lastTypes.slice(-2).includes(type));
    if (candidates.length > 0) return candidates[0];

    const fallback = MINIGAME_TYPES.find((type) => !lastTypes.slice(-2).includes(type));
    return fallback ?? "flash-gates";
  }

  chooseRepresentation(skill: Skill, quantity: number): Representation {
    const range = getQuantityRange(quantity);
    const cells = REPRESENTATIONS.map((representation) => this.tracker.getCell(skill, representation, range));
    const bestExisting = cells.find((cell) => cell.exposures > 0);
    const phase = phaseForExposure(bestExisting?.exposures ?? 0, bestExisting?.accuracy ?? 0);
    return preferredRepresentationsForSkill(skill, phase)[0];
  }

  displayTimeFor(skill: Skill, quantity: number, representation: Representation): number {
    const range = getQuantityRange(quantity);
    const exactCell = this.tracker.getCell(skill, representation, range);
    const fallbackCell = this.tracker
      .getCells()
      .filter((cell) => cell.skill === skill && cell.range === range && cell.exposures > 0)
      .sort((a, b) => {
        const aPenalty = 1 - a.accuracy + a.hintRate + (a.mastery === "emerging" ? 0.35 : 0);
        const bPenalty = 1 - b.accuracy + b.hintRate + (b.mastery === "emerging" ? 0.35 : 0);
        return bPenalty - aPenalty;
      })[0];
    const cell = exactCell.exposures > 0 ? exactCell : fallbackCell ?? exactCell;
    const base = quantity <= 3 ? 900 : quantity <= 5 ? 1100 : quantity <= 8 ? 1400 : 1600;
    if (cell.mastery === "fluent") return Math.max(400, base - 450);
    if (cell.mastery === "secure") return Math.max(650, base - 250);
    if (cell.accuracy < 0.7 && cell.exposures >= 3) return base + 350;
    return base;
  }

  nextFocusQuantity(): number {
    const weak = this.tracker.weakestQuantities(1)[0];
    if (weak) return weak.quantity;
    const focus = this.recommendFocus();
    return focus.quantity;
  }

  suggestedNextFocus(): string {
    const focus = this.recommendFocus();
    if (focus.skill === "make10") return "Meer Maak-10 met tienkaders en treinen.";
    if (focus.skill === "oneMoreLess") return "Gebruik voor/na platforms voor eentje meer en eentje minder.";
    if (focus.skill === "quantityToNumeral" || focus.skill === "numeralToQuantity") {
      return "Koppel cijfers eerst aan echte groepjes voor gemengde opdrachten.";
    }
    if (focus.skill === "partwhole") return "Gebruik Split Chests en blokken voor splitsen.";
    return `Oefen ${childFocusTitle(focus.skill).toLowerCase()} met ${childRepresentationName(focus.representation)} (${focus.range}).`;
  }

  skillRotation(): Skill[] {
    const stats = this.tracker.masteryBySkill();
    return [...SKILLS].sort((a, b) => {
      const aStat = stats.find((item) => item.skill === a);
      const bStat = stats.find((item) => item.skill === b);
      return (aStat?.accuracy ?? 0) - (bStat?.accuracy ?? 0);
    });
  }
}
