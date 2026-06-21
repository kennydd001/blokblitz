import type { Representation, Skill } from "./types";

export const concreteRepresentations: Representation[] = ["eggs", "pawprints", "blocks", "fingers"];
export const schematicRepresentations: Representation[] = ["dots", "dice", "domino", "fiveframe", "tenframe", "beads"];
export const abstractRepresentations: Representation[] = ["numeral", "mixed"];

export function preferredRepresentationsForSkill(skill: Skill, phase: "concrete" | "schematic" | "abstract"): Representation[] {
  if (phase === "concrete") {
    if (skill === "make10") return ["blocks", "eggs", "fingers"];
    if (skill === "compare") return ["eggs", "pawprints", "blocks"];
    return concreteRepresentations;
  }

  if (phase === "schematic") {
    if (skill === "make10") return ["tenframe", "beads", "fiveframe"];
    if (skill === "partwhole") return ["domino", "beads", "blocks"];
    if (skill === "subitize") return ["dots", "dice", "fiveframe"];
    return schematicRepresentations;
  }

  if (skill === "quantityToNumeral") return ["numeral", "mixed"];
  if (skill === "numeralToQuantity") return ["mixed", "numeral"];
  return abstractRepresentations;
}

export function phaseForExposure(exposures: number, accuracy: number): "concrete" | "schematic" | "abstract" {
  if (exposures < 4 || accuracy < 0.7) return "concrete";
  if (exposures < 8 || accuracy < 0.85) return "schematic";
  return "abstract";
}

