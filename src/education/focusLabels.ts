import type { QuantityRange, Representation, Skill } from "./types";

const skillLabels: Record<Skill, { title: string; action: string }> = {
  subitize: { title: "Kijk in groepjes", action: "Zie het beeld snel, zonder tellen." },
  make10: { title: "Maak 10", action: "Vul eerst vijf en daarna tien." },
  partwhole: { title: "Splits slim", action: "Bouw twee delen die samen kloppen." },
  compare: { title: "Kies groter of kleiner", action: "Vergelijk eerst de vijf-groep." },
  oneMoreLess: { title: "Eentje meer", action: "Spring naar ervoor of erna." },
  quantityToNumeral: { title: "Beeld naar cijfer", action: "Koppel de structuur aan het cijfer." },
  numeralToQuantity: { title: "Cijfer naar beeld", action: "Maak het cijfer zichtbaar met blokken." },
  buildQuantity: { title: "Bouw precies", action: "Leg eerst vijf, dan de rest." }
};

const representationLabels: Record<Representation, string> = {
  dots: "stippen",
  dice: "dobbelstenen",
  domino: "domino",
  fingers: "vingers",
  fiveframe: "vijfkader",
  tenframe: "tienkader",
  beads: "kralen",
  blocks: "blokken",
  eggs: "eieren",
  pawprints: "pootjes",
  numeral: "cijfers",
  mixed: "mix"
};

export function childFocusTitle(skill: Skill): string {
  return skillLabels[skill].title;
}

export function childFocusAction(skill: Skill): string {
  return skillLabels[skill].action;
}

export function childRepresentationName(representation: Representation): string {
  return representationLabels[representation];
}

export function childFocusSummary(skill: Skill, representation: Representation, range: QuantityRange): string {
  return `${childFocusTitle(skill)} met ${representationLabels[representation]} (${range})`;
}
