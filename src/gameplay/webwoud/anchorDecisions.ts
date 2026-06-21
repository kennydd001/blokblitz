import type { MinigameType, Representation } from "../../education/types";

export const anchorDecisionTypes = [
  "quantity matching",
  "numeral matching",
  "numeral to structured quantity",
  "structured quantity to numeral",
  "make-10 complement",
  "part-whole relation",
  "one more / one less",
  "compare larger/smaller",
  "representation equivalence"
] as const;

export type AnchorDecisionType = (typeof anchorDecisionTypes)[number];

export interface AnchorDecisionConfig {
  decision: AnchorDecisionType;
  minigameType: MinigameType;
  promptRepresentation?: Representation;
  routeLabel: string;
}

export const anchorDecisionPlan: AnchorDecisionConfig[] = [
  {
    decision: "quantity matching",
    minigameType: "flash-gates",
    promptRepresentation: "dots",
    routeLabel: "zelfde hoeveelheid"
  },
  {
    decision: "numeral matching",
    minigameType: "dice-hunt",
    promptRepresentation: "numeral",
    routeLabel: "cijfer naar patroon"
  },
  {
    decision: "numeral to structured quantity",
    minigameType: "web-anchors",
    promptRepresentation: "numeral",
    routeLabel: "cijfer naar structuur"
  },
  {
    decision: "structured quantity to numeral",
    minigameType: "flash-gates",
    promptRepresentation: "tenframe",
    routeLabel: "structuur naar cijfer"
  },
  {
    decision: "make-10 complement",
    minigameType: "make-ten-shield",
    promptRepresentation: "tenframe",
    routeLabel: "maak 10"
  },
  {
    decision: "part-whole relation",
    minigameType: "split-chests",
    promptRepresentation: "blocks",
    routeLabel: "delen en geheel"
  },
  {
    decision: "one more / one less",
    minigameType: "one-more-one-less",
    promptRepresentation: "dots",
    routeLabel: "eentje meer"
  },
  {
    decision: "compare larger/smaller",
    minigameType: "enemy-wave-compare",
    promptRepresentation: "eggs",
    routeLabel: "grootste groep"
  },
  {
    decision: "representation equivalence",
    minigameType: "web-anchors",
    promptRepresentation: "beads",
    routeLabel: "gelijke voorstelling"
  }
];
