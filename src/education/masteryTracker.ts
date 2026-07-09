import { getQuantityRange, subitizeThresholdMs } from "./quantityLayouts";
import { classifyError, misconceptionLabels } from "./misconceptions";
import type { AttemptLog, CurriculumCell, MasteryCell, QuantityRange, Representation, Skill } from "./types";
import { QUANTITY_RANGES, REPRESENTATIONS, SKILLS } from "./types";

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export class MasteryTracker {
  private attempts: AttemptLog[];

  constructor(attempts: AttemptLog[] = []) {
    this.attempts = attempts;
  }

  setAttempts(attempts: AttemptLog[]): void {
    this.attempts = attempts;
  }

  getAttempts(): AttemptLog[] {
    return [...this.attempts];
  }

  logAttempt(attempt: AttemptLog): AttemptLog {
    const withError = attempt.wasCorrect ? { ...attempt, errorType: undefined } : { ...attempt, errorType: attempt.errorType ?? classifyError(attempt) };
    this.attempts = [...this.attempts, withError];
    return withError;
  }

  // Generic grouping keys: new curriculum attempts may carry their own
  // rangeKey/targetKey; number attempts fall back to the numeric fields, so
  // existing grouping is byte-identical.
  private rangeKeyOf(attempt: AttemptLog): string {
    return attempt.rangeKey ?? attempt.quantityRange;
  }

  private targetKeyOf(attempt: AttemptLog): string {
    return attempt.targetKey ?? String(attempt.quantity);
  }

  // Only the original 1-10 number modes (no domain tag) feed the number-first
  // views. Every domain-tagged curriculum mode (reading, math-to-20, measure...)
  // carries placeholder numeric fields and gets its own dashboard panel instead.
  private numberAttempts(): AttemptLog[] {
    return this.attempts.filter((attempt) => !attempt.domain);
  }

  getCell(skill: Skill, representation: Representation, range: QuantityRange): MasteryCell {
    const matching = this.numberAttempts().filter(
      (attempt) => attempt.skill === skill && attempt.representation === representation && this.rangeKeyOf(attempt) === range
    );
    const exposures = matching.length;
    const correct = matching.filter((attempt) => attempt.wasCorrect).length;
    const hints = matching.filter((attempt) => attempt.hintUsed).length;
    const accuracy = exposures === 0 ? 0 : correct / exposures;
    const hintRate = exposures === 0 ? 0 : hints / exposures;
    const medianRT = median(matching.map((attempt) => attempt.reactionTimeMs).filter((rt) => rt > 0));
    const recentErrors = matching
      .slice(-8)
      .filter((attempt) => !attempt.wasCorrect && attempt.errorType)
      .map((attempt) => attempt.errorType as string);
    const misconceptions = misconceptionLabels(recentErrors);
    const fastEnough = matching.some((attempt) => attempt.wasCorrect && attempt.reactionTimeMs <= subitizeThresholdMs(attempt.quantity));
    let mastery: MasteryCell["mastery"] = "emerging";
    if (exposures >= 8 && accuracy >= 0.85 && hintRate < 0.15 && (medianRT === 0 || fastEnough || medianRT <= 1000)) {
      mastery = "fluent";
    } else if (exposures >= 5 && accuracy >= 0.75 && hintRate < 0.3) {
      mastery = "secure";
    }

    return {
      skill,
      representation,
      range,
      accuracy,
      medianRT,
      hintRate,
      exposures,
      recentErrors,
      misconceptions,
      mastery
    };
  }

  getCells(includeEmpty = false): MasteryCell[] {
    const cells: MasteryCell[] = [];
    for (const skill of SKILLS) {
      for (const representation of REPRESENTATIONS) {
        for (const range of QUANTITY_RANGES) {
          const cell = this.getCell(skill, representation, range);
          if (includeEmpty || cell.exposures > 0) cells.push(cell);
        }
      }
    }
    return cells;
  }

  masteryBySkill(): Array<{ skill: Skill; accuracy: number; exposures: number; mastery: string }> {
    return SKILLS.map((skill) => {
      const attempts = this.numberAttempts().filter((attempt) => attempt.skill === skill);
      const exposures = attempts.length;
      const accuracy = exposures === 0 ? 0 : attempts.filter((attempt) => attempt.wasCorrect).length / exposures;
      const fluent = this.getCells().filter((cell) => cell.skill === skill && cell.mastery === "fluent").length;
      const secure = this.getCells().filter((cell) => cell.skill === skill && cell.mastery === "secure").length;
      const mastery = fluent > 0 ? "fluent" : secure > 0 ? "secure" : "emerging";
      return { skill, accuracy, exposures, mastery };
    });
  }

  masteryByRepresentation(): Array<{ representation: Representation; accuracy: number; exposures: number; mastery: string }> {
    return REPRESENTATIONS.map((representation) => {
      const attempts = this.numberAttempts().filter((attempt) => attempt.representation === representation);
      const exposures = attempts.length;
      const accuracy = exposures === 0 ? 0 : attempts.filter((attempt) => attempt.wasCorrect).length / exposures;
      const fluent = this.getCells().filter((cell) => cell.representation === representation && cell.mastery === "fluent").length;
      const secure = this.getCells().filter((cell) => cell.representation === representation && cell.mastery === "secure").length;
      const mastery = fluent > 0 ? "fluent" : secure > 0 ? "secure" : "emerging";
      return { representation, accuracy, exposures, mastery };
    });
  }

  weakestQuantities(limit = 5): Array<{ quantity: number; accuracy: number; exposures: number }> {
    return Array.from({ length: 10 }, (_, index) => index + 1)
      .map((quantity) => {
        const attempts = this.numberAttempts().filter((attempt) => attempt.quantity === quantity);
        const exposures = attempts.length;
        const accuracy = exposures === 0 ? 1 : attempts.filter((attempt) => attempt.wasCorrect).length / exposures;
        return { quantity, accuracy, exposures };
      })
      .filter((item) => item.exposures > 0)
      .sort((a, b) => a.accuracy - b.accuracy || b.exposures - a.exposures)
      .slice(0, limit);
  }

  weakestRanges(): Array<{ range: QuantityRange; accuracy: number; exposures: number }> {
    return QUANTITY_RANGES.map((range) => {
      const attempts = this.numberAttempts().filter((attempt) => getQuantityRange(attempt.quantity) === range);
      const exposures = attempts.length;
      const accuracy = exposures === 0 ? 1 : attempts.filter((attempt) => attempt.wasCorrect).length / exposures;
      return { range, accuracy, exposures };
    }).sort((a, b) => a.accuracy - b.accuracy || b.exposures - a.exposures);
  }

  // ---- Curriculum (domain-tagged) mastery -------------------------------
  // Reading, math-to-20, measurement, geometry etc. carry a `domain` + a
  // `targetKey` (the /s/ sound, the word "vis", the teen 13...). These were
  // excluded from every number view; now they get their own per-target cells so
  // weak targets can resurface and the parent can see what is emerging vs secure.

  /** One mastery cell per (domain, skill, targetKey). Filter by domain if given. */
  curriculumCells(domain?: string): CurriculumCell[] {
    const tagged = this.attempts.filter((a) => a.domain && (domain === undefined || a.domain === domain));
    const groups = new Map<string, AttemptLog[]>();
    for (const attempt of tagged) {
      const key = `${attempt.domain}::${attempt.skill}::${this.targetKeyOf(attempt)}`;
      const list = groups.get(key) ?? [];
      list.push(attempt);
      groups.set(key, list);
    }
    const cells: CurriculumCell[] = [];
    for (const [key, list] of groups) {
      const [d, skill, targetKey] = key.split("::");
      const exposures = list.length;
      const correct = list.filter((a) => a.wasCorrect).length;
      const hints = list.filter((a) => a.hintUsed).length;
      const accuracy = correct / exposures;
      const hintRate = hints / exposures;
      const recentErrors = list
        .slice(-8)
        .filter((a) => !a.wasCorrect && a.errorType)
        .map((a) => a.errorType as string);
      let mastery: MasteryCell["mastery"] = "emerging";
      if (exposures >= 6 && accuracy >= 0.85 && hintRate < 0.2) mastery = "fluent";
      else if (exposures >= 3 && accuracy >= 0.7 && hintRate < 0.35) mastery = "secure";
      cells.push({ domain: d, skill, targetKey, exposures, accuracy, hintRate, recentErrors, mastery });
    }
    return cells;
  }

  /**
   * The target most worth practising again in a domain: a seen-but-shaky one
   * (>=3 tries, <70% or emerging). Returns undefined when nothing is weak yet,
   * so the generator rolls freely and keeps introducing new targets.
   */
  weakCurriculumTarget(domain: string): string | undefined {
    const weak = this.curriculumCells(domain)
      .filter((c) => c.exposures >= 3 && (c.accuracy < 0.7 || c.mastery === "emerging"))
      .sort((a, b) => a.accuracy - b.accuracy || b.exposures - a.exposures)[0];
    return weak?.targetKey;
  }

  reactionTimeTrend(limit = 12): number[] {
    return this.attempts
      .filter((attempt) => attempt.wasCorrect && attempt.reactionTimeMs > 0)
      .slice(-limit)
      .map((attempt) => attempt.reactionTimeMs);
  }

  hintRate(): number {
    if (this.attempts.length === 0) return 0;
    return this.attempts.filter((attempt) => attempt.hintUsed).length / this.attempts.length;
  }

  misconceptionSummary(): string[] {
    return misconceptionLabels(this.attempts.map((attempt) => attempt.errorType).filter((error): error is string => Boolean(error)));
  }

  recentProgress(limit = 8): AttemptLog[] {
    return this.attempts.slice(-limit);
  }
}

