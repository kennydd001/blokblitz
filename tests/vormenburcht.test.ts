import { describe, expect, it } from "vitest";
import { classifyShapeError, SHAPES, shapeRound, shapeSvg } from "../src/education/geometry/shapes";

describe("vormenburcht rounds", () => {
  it("builds find/count/pattern rounds with exactly one correct option", () => {
    for (const mode of ["find-shape", "count-corners", "continue-pattern"] as const) {
      for (let i = 0; i < 20; i += 1) {
        const round = shapeRound(mode);
        expect(round.mode).toBe(mode);
        expect(round.options.length).toBeGreaterThanOrEqual(3);
        expect(round.options.filter((o) => o.isCorrect)).toHaveLength(1);
      }
    }
  });

  it("count-corners answer is the shape's real corner count", () => {
    for (let i = 0; i < 20; i += 1) {
      const round = shapeRound("count-corners");
      const correct = Number(round.options.find((o) => o.isCorrect)!.value);
      expect(correct).toBeGreaterThan(0);
      expect(correct).toBeLessThanOrEqual(6);
    }
  });

  it("renders a local SVG for every shape", () => {
    for (const shape of SHAPES) expect(shapeSvg(shape.id)).toContain("<svg");
  });

  it("classifies the error by mode", () => {
    expect(classifyShapeError("count-corners")).toBe("corner-miscount");
    expect(classifyShapeError("continue-pattern")).toBe("pattern-weak");
    expect(classifyShapeError("find-shape")).toBe("shape-confusion");
  });

  it("keeps a new child on basic shapes and grows pattern complexity by tier", () => {
    for (let i = 0; i < 40; i += 1) {
      const find = shapeRound("find-shape", 1);
      expect(find.options.every((option) => !["pentagon", "hexagon"].includes(option.value))).toBe(true);
      const corners = shapeRound("count-corners", 1);
      expect(Number(corners.options.find((option) => option.isCorrect)?.value)).toBeLessThanOrEqual(4);
    }

    expect(shapeRound("continue-pattern", 1).targetKey).toContain("pattern-ab-");
    expect(shapeRound("continue-pattern", 2).targetKey).toContain("pattern-aabb-");
    expect(shapeRound("continue-pattern", 3).targetKey).toContain("pattern-abc-");
  });
});
