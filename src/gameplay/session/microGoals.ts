import type { AnchorDecisionType } from "../webwoud/anchorDecisions";
import type { RunnerMechanic } from "../runner/runnerMechanics";
import type { MinigameType } from "../../education/types";

export type MicroGoalKind =
  | "gate"
  | "boost"
  | "shield"
  | "bridge"
  | "jump"
  | "split"
  | "wave"
  | "rescue"
  | "route"
  | "build"
  | "match";

export interface MicroGoal {
  kind: MicroGoalKind;
  label: string;
  verb: string;
}

export const runnerMicroGoals: Record<RunnerMechanic, MicroGoal> = {
  "flash-gate": { kind: "gate", label: "Poort open", verb: "Open" },
  "subitize-boost": { kind: "boost", label: "Boost pakken", verb: "Boost" },
  "make-ten-shield": { kind: "shield", label: "Schild vol", verb: "Schild" },
  "bead-bridge": { kind: "bridge", label: "Brug bouwen", verb: "Brug" },
  "jump-platform": { kind: "jump", label: "Spring goed", verb: "Spring" },
  "split-chest": { kind: "split", label: "Kist kraken", verb: "Splits" },
  "enemy-wave": { kind: "wave", label: "Golf voorbij", verb: "Kies" },
  "one-more-less": { kind: "jump", label: "Volgende stap", verb: "Stap" },
  "rescue-cage": { kind: "rescue", label: "Kooi open", verb: "Red" },
  "shortcut-route": { kind: "route", label: "Geheime route", verb: "Route" },
  "dino-streak": { kind: "rescue", label: "Dino maatje", verb: "Red" }
};

export function webMicroGoal(decision: AnchorDecisionType): MicroGoal {
  if (decision.includes("make-10")) return { kind: "shield", label: "Maak 10", verb: "Vul" };
  if (decision.includes("part-whole")) return { kind: "split", label: "Delen passen", verb: "Splits" };
  if (decision.includes("compare")) return { kind: "wave", label: "Grootste groep", verb: "Kies" };
  if (decision.includes("one more")) return { kind: "jump", label: "Eentje meer", verb: "Stap" };
  if (decision.includes("equivalence")) return { kind: "match", label: "Zelfde beeld", verb: "Match" };
  if (decision.includes("numeral")) return { kind: "match", label: "Cijfer match", verb: "Match" };
  return { kind: "rescue", label: "Anker redding", verb: "Zwaai" };
}

export function minigameMicroGoal(type: MinigameType): MicroGoal {
  if (type === "make-ten-shield" || type === "train-of-ten") return { kind: "shield", label: "Maak 10", verb: "Vul" };
  if (type === "bead-bridge") return { kind: "bridge", label: "Brug bouwen", verb: "Bouw" };
  if (type === "split-chests" || type === "double-track") return { kind: "split", label: "Delen passen", verb: "Splits" };
  if (type === "enemy-wave-compare") return { kind: "wave", label: "Grootste groep", verb: "Kies" };
  if (type === "one-more-one-less") return { kind: "jump", label: "Volgende stap", verb: "Stap" };
  if (type === "rescue-the-herd") return { kind: "rescue", label: "Kudde redden", verb: "Red" };
  if (type === "build-the-number") return { kind: "build", label: "Bouw precies", verb: "Bouw" };
  return { kind: "match", label: "Match snel", verb: "Match" };
}

export function cityMicroGoal(): MicroGoal {
  return { kind: "build", label: "Wijk bouwen", verb: "Bouw" };
}

export function isRouteMilestone(stepCompleted: number, totalSteps: number): boolean {
  return stepCompleted > 0 && (stepCompleted % 3 === 0 || stepCompleted === totalSteps);
}
