import type { AttemptLog } from "./types";

function firstNumber(value: number | string | Array<number | string>): number | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstNumber(item);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  if (typeof value === "number") return value;
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : undefined;
}

export function classifyError(attempt: Omit<AttemptLog, "errorType">): string | undefined {
  if (attempt.wasCorrect) return undefined;

  const correct = firstNumber(attempt.correctAnswer);
  const player = firstNumber(attempt.playerAnswer);

  if (correct !== undefined && player !== undefined) {
    if (player === correct - 1) return "confused-with-one-less";
    if (player === correct + 1) return "confused-with-one-more";
    if (correct + player === 10) return "complement-instead-of-target";
    if (Math.abs(player - correct) === 5) return "missed-five-structure";
  }

  if (attempt.skill === "make10") return "make-ten-complement-unclear";
  if (attempt.skill === "quantityToNumeral") return "quantity-to-numeral-map-weak";
  if (attempt.skill === "numeralToQuantity") return "numeral-to-quantity-map-weak";
  if (attempt.skill === "partwhole") return "part-whole-decomposition-weak";
  if (attempt.skill === "compare") return "comparison-direction-weak";
  return "needs-more-structure";
}

export function misconceptionLabels(errors: string[]): string[] {
  const labels = new Set<string>();
  for (const error of errors) {
    if (error.includes("one-less")) labels.add("Often answers N-1. Add 5+n and before/after scaffolds.");
    if (error.includes("one-more")) labels.add("Often answers N+1. Slow down counting-on visuals.");
    if (error.includes("five")) labels.add("Misses five-structure. Use five-frames and ten-frames.");
    if (error.includes("make-ten")) labels.add("Make-10 complement needs more shield and train practice.");
    if (error.includes("numeral")) labels.add("Numeral mapping needs concrete pairing first.");
    if (error.includes("part-whole")) labels.add("Part-whole splits need block and chest scaffolds.");
    if (error.includes("comparison")) labels.add("Comparison prompt direction needs clearer larger/smaller icons.");
  }
  return [...labels];
}

