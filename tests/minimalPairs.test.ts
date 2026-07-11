import { describe, expect, it } from "vitest";
import { PHONICS_WORDS } from "../src/education/literacy/phonics";
import {
  allMinimalPairs,
  availableRemediations,
  CONFUSABLE_SOUNDS,
  minimalPairsForContrast,
  remediationDrill
} from "../src/education/literacy/minimalPairs";

const word = (value: string) => PHONICS_WORDS.find((item) => item.word === value)!;

describe("minimal-pair derivation", () => {
  it("accepts vis/vos and rejects same-word, different-length, and two-difference candidates", () => {
    const pairs = allMinimalPairs();
    expect(pairs.some((pair) => pair.id === "vis-vos")).toBe(true);
    expect(pairs.some((pair) => pair.a.word === "vis" && pair.b.word === "vis")).toBe(false);
    expect(pairs.some((pair) => pair.id === "hand-maan")).toBe(false);
    expect(pairs.some((pair) => pair.id === "mes-pen")).toBe(false);
  });

  it("uses canonical word ordering and stable ids", () => {
    const pair = minimalPairsForContrast("o", "i").find((item) => item.id === "vis-vos")!;
    expect(pair.a).toBe(word("vis"));
    expect(pair.b).toBe(word("vos"));
    expect(pair.unitA).toBe("i");
    expect(pair.unitB).toBe("o");
    expect(pair.id).toBe("vis-vos");
  });

  it("classifies begin, medial, and end contrasts", () => {
    expect(minimalPairsForContrast("b", "p").find((pair) => pair.id === "beer-peer")?.kind).toBe("begin");
    expect(minimalPairsForContrast("a", "e").find((pair) => pair.id === "bal-bel")?.kind).toBe("medial");
    expect(minimalPairsForContrast("m", "t").find((pair) => pair.id === "boom-boot")?.kind).toBe("end");
  });

  it("matches contrasts without depending on argument order", () => {
    expect(minimalPairsForContrast("i", "o")).toEqual(minimalPairsForContrast("o", "i"));
    expect(minimalPairsForContrast("i", "o").map((pair) => pair.id)).toContain("vis-vos");
  });

  it("caps drills and prefers begin contrasts before end and medial contrasts", () => {
    const drill = remediationDrill("m", "t", 3);
    expect(drill).toHaveLength(1);
    expect(drill[0].id).toBe("boom-boot");

    const beginFirst = remediationDrill("m", "h", 3);
    expect(beginFirst[0]?.kind).toBe("begin");
    expect(remediationDrill("m", "h", 0)).toEqual([]);
  });

  it("returns only available configured remediations in configured order", () => {
    const available = availableRemediations();
    expect(available.every(({ pairs }) => pairs.length >= 1)).toBe(true);
    expect(available.map(({ contrast }) => contrast)).toEqual(
      CONFUSABLE_SOUNDS.filter(([x, y]) => minimalPairsForContrast(x, y).length > 0)
    );
    expect(available.map(({ contrast }) => contrast)).toEqual([
     ["b", "p"],
     ["a", "e"],
     ["i", "o"],
      ["v", "m"]
   ]);
  });

  it("derivation is deterministic", () => {
    expect(allMinimalPairs()).toEqual(allMinimalPairs());
    expect(availableRemediations()).toEqual(availableRemediations());
  });

  it("every emitted pair has equal unit length and exactly one changed unit", () => {
    for (const pair of allMinimalPairs()) {
      expect(pair.a.units).toHaveLength(pair.b.units.length);
      expect(pair.a.word.localeCompare(pair.b.word)).toBeLessThanOrEqual(0);
      expect(pair.unitA.localeCompare(pair.unitB)).toBeLessThanOrEqual(0);
      expect(pair.a.units.filter((unit, index) => unit !== pair.b.units[index])).toHaveLength(1);
      expect(pair.a.units[pair.position]).toBe(pair.unitA);
      expect(pair.b.units[pair.position]).toBe(pair.unitB);
    }
  });
});
