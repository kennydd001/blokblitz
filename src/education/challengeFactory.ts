import { makeTenComplement, subitizeThresholdMs } from "./quantityLayouts";
import type { Challenge, ChallengeOption, MinigameType, Representation, Skill } from "./types";
import { MINIGAME_TYPES } from "./types";
import { RepresentationFactory } from "./representations/RepresentationFactory";

export interface ChallengeFactoryOptions {
  quantity?: number;
  representation?: Representation;
  scene?: Challenge["scene"];
  levelId?: string;
}

interface TemplateConfig {
  title: string;
  prompt: (q: number) => string;
  skill: Skill;
  promptRepresentation: Representation;
  answerRepresentation: Representation;
  mechanic: string;
  successEffect: string;
  safeErrorEffect: string;
  hint: string;
}

const templateConfigs: Record<MinigameType, TemplateConfig> = {
  "flash-gates": {
    title: "Flash Gates",
    prompt: (q) => `Welke poort is ${q}?`,
    skill: "subitize",
    promptRepresentation: "dots",
    answerRepresentation: "numeral",
    mechanic: "Kies de juiste baan voordat de poort sluit.",
    successEffect: "De poort gaat open, je krijgt snelheid, en Subitize Snap kan starten.",
    safeErrorEffect: "De poort buigt naar een rustige baan en toont hetzelfde getal in een tienkader.",
    hint: "Kijk naar het groepje: eerst vijf, dan de extra blokjes."
  },
  "dice-hunt": {
    title: "Dice Hunt",
    prompt: (q) => `Vind de dobbelsteen voor ${q}.`,
    skill: "quantityToNumeral",
    promptRepresentation: "numeral",
    answerRepresentation: "dice",
    mechanic: "Pak de dobbelsteen of domino die erbij hoort.",
    successEffect: "Sterren springen uit de dobbelsteengrot.",
    safeErrorEffect: "De dobbelsteen rolt naast het cijfer voor nog een poging.",
    hint: "Zie de stippen als een patroon, niet een voor een."
  },
  "bead-bridge": {
    title: "Bead Bridge",
    prompt: (q) => `Kies de kralenbrug met ${q}.`,
    skill: "buildQuantity",
    promptRepresentation: "numeral",
    answerRepresentation: "beads",
    mechanic: "De gekozen kralen worden brugstukken.",
    successEffect: "De brug groeit onder de held.",
    safeErrorEffect: "Een steiger licht de vijf rode kralen op.",
    hint: "Rode kralen tonen vijf. Witte kralen zijn de rest."
  },
  "make-ten-shield": {
    title: "Make-Ten Shield",
    prompt: (q) => `Het schild heeft ${q}. Wat maakt 10?`,
    skill: "make10",
    promptRepresentation: "tenframe",
    answerRepresentation: "blocks",
    mechanic: "Pak wat ontbreekt om het schild op te laden.",
    successEffect: "Een schildring beschermt de renner.",
    safeErrorEffect: "Het schild pauzeert en licht de lege tienkader-vakken op.",
    hint: "Tel de lege vakken om tien te maken."
  },
  "split-chests": {
    title: "Split Chests",
    prompt: (q) => `Open ${q} als twee delen.`,
    skill: "partwhole",
    promptRepresentation: "blocks",
    answerRepresentation: "mixed",
    mechanic: "Kies een splitsing die samen klopt.",
    successEffect: "De kist opent in twee heldere groepjes.",
    safeErrorEffect: "De kist toont een goede splitsing met blokken.",
    hint: "De twee delen samen moeten het doelgetal zijn."
  },
  "web-anchors": {
    title: "Web Anchors",
    prompt: (q) => `Zwaai naar hetzelfde als ${q}.`,
    skill: "numeralToQuantity",
    promptRepresentation: "numeral",
    answerRepresentation: "mixed",
    mechanic: "Goede ankers trekken de held omhoog en openen kooien.",
    successEffect: "De liaan trekt strak en redt een vriend.",
    safeErrorEffect: "De liaan veert veilig naar een lagere steiger.",
    hint: "Match het cijfer met hetzelfde groepje."
  },
  "train-of-ten": {
    title: "Train of Ten",
    prompt: (q) => `Wagon heeft ${q}. Welke erbij voor 10?`,
    skill: "make10",
    promptRepresentation: "beads",
    answerRepresentation: "blocks",
    mechanic: "Koppel wagons zodat de lading precies tien is.",
    successEffect: "De trein vertrekt met een volle tien.",
    safeErrorEffect: "De trein wacht en toont wat nog ontbreekt.",
    hint: "Tien is vijf en vijf. Vul wat mist."
  },
  "enemy-wave-compare": {
    title: "Enemy Wave Compare",
    prompt: (q) => `Kies de grootste groep.`,
    skill: "compare",
    promptRepresentation: "eggs",
    answerRepresentation: "pawprints",
    mechanic: "Kies groter of kleiner om veilig langs de golf te gaan.",
    successEffect: "De held flitst langs de kleinere golf.",
    safeErrorEffect: "De golf vertraagt en zet alles in tienkader-rijen.",
    hint: "Vergelijk eerst de vijf-groep."
  },
  "build-the-number": {
    title: "Build the Number",
    prompt: (q) => `Bouw precies ${q}.`,
    skill: "buildQuantity",
    promptRepresentation: "numeral",
    answerRepresentation: "blocks",
    mechanic: "Kies blokken om precies het doel te bouwen.",
    successEffect: "Het gebouw klikt vast in Sterrenstad.",
    safeErrorEffect: "Een hulpkader toont vijf plus de rest.",
    hint: "Bouw eerst vijf en voeg daarna de rest toe."
  },
  "one-more-one-less": {
    title: "One More / One Less",
    prompt: (q) => `Spring naar eentje meer dan ${q}.`,
    skill: "oneMoreLess",
    promptRepresentation: "dots",
    answerRepresentation: "mixed",
    mechanic: "Spring naar het platform ervoor of erna.",
    successEffect: "Het platform tilt je naar de snelle route.",
    safeErrorEffect: "De route zakt en toont ervoor, nu, erna.",
    hint: "Eentje meer is het volgende getal."
  },
  "double-track": {
    title: "Double Track",
    prompt: (q) => `Vind de dubbele route voor ${q}.`,
    skill: "partwhole",
    promptRepresentation: "blocks",
    answerRepresentation: "domino",
    mechanic: "Dubbels en bijna-dubbels openen de wissels.",
    successEffect: "De tweelingrails lichten samen op.",
    safeErrorEffect: "De rails splitsen in twee gelijke of bijna gelijke groepjes.",
    hint: "Een dubbel heeft twee even grote delen."
  },
  "rescue-the-herd": {
    title: "Rescue the Herd",
    prompt: (q) => `Laat precies ${q} dieren door.`,
    skill: "buildQuantity",
    promptRepresentation: "numeral",
    answerRepresentation: "eggs",
    mechanic: "Open de poort voor precies de juiste kudde.",
    successEffect: "De kudde rent naar het veilige hok.",
    safeErrorEffect: "De poort wordt een telhok met vijf gemarkeerde plekken.",
    hint: "Stop als het groepje past bij het doel."
  }
};

const cityChallengeByDistrict: Record<string, MinigameType> = {
  "dot-plaza": "one-more-one-less",
  "dice-cave": "dice-hunt",
  "domino-dock": "split-chests",
  "finger-treehouse": "build-the-number",
  "five-frame-farm": "build-the-number",
  "ten-frame-tower": "make-ten-shield",
  "rekenrek-bridge": "bead-bridge",
  "block-yard": "build-the-number",
  "egg-nursery": "rescue-the-herd",
  "paw-hq": "enemy-wave-compare",
  "numeral-library": "web-anchors",
  observatory: "web-anchors",
  "train-station": "train-of-ten",
  "dino-park": "rescue-the-herd"
};

function idPart(): string {
  return Math.random().toString(36).slice(2, 9);
}

function clampOptionQuantity(quantity: number): number {
  return Math.max(1, Math.min(10, Math.round(quantity)));
}

function distractors(quantity: number): number[] {
  const candidates = [quantity - 1, quantity + 1, quantity === 10 ? 5 : 10 - quantity, quantity + 2, quantity - 2]
    .map(clampOptionQuantity)
    .filter((item) => item !== quantity);
  return [...new Set(candidates)].slice(0, 2);
}

function optionFromQuantity(quantity: number, representation: Representation, isCorrect: boolean, label?: string): ChallengeOption {
  return {
    id: `${representation}-${quantity}-${idPart()}`,
    label: label ?? String(quantity),
    value: label ?? quantity,
    quantity,
    representation,
    svg: RepresentationFactory.renderSvg(representation, quantity, { label: label ?? `${representation} ${quantity}` }),
    isCorrect
  };
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function splitOptions(quantity: number, representation: Representation): { options: ChallengeOption[]; correctAnswer: string[] } {
  const q = clampOptionQuantity(quantity);
  const splits = new Set<string>();
  for (let left = 1; left < q; left += 1) {
    const right = q - left;
    splits.add(`${left}+${right}`);
    if (splits.size >= 3) break;
  }
  const wrong = [`${Math.max(1, q - 2)}+${Math.min(10, 3)}`, `${Math.min(9, q)}+1`].filter((item) => {
    const [a, b] = item.split("+").map(Number);
    return a + b !== q;
  });
  const correct = [...splits];
  const options = [
    ...correct.slice(0, 2).map((split) => {
      const [left, right] = split.split("+").map(Number);
      return {
        id: `split-${split}-${idPart()}`,
        label: split,
        value: split,
        quantity: q,
        representation,
        svg: RepresentationFactory.renderSvg(representation, q, { label: `${split} maakt ${q}` }),
        isCorrect: true,
        scaffold: `${left} en ${right} maken samen ${q}.`
      };
    }),
    ...wrong.slice(0, 1).map((split) => ({
      id: `split-${split}-${idPart()}`,
      label: split,
      value: split,
      quantity: q,
      representation,
      svg: RepresentationFactory.renderSvg(representation, clampOptionQuantity(q - 1), { label: `${split}` }),
      isCorrect: false,
      scaffold: "Tel de twee delen samen."
    }))
  ];
  return { options: shuffle(options), correctAnswer: correct };
}

export class ChallengeFactory {
  static allMinigameTypes(): MinigameType[] {
    return [...MINIGAME_TYPES];
  }

  createMinigame(type: MinigameType, options: ChallengeFactoryOptions = {}): Challenge {
    const config = templateConfigs[type];
    const rawQuantity = options.quantity ?? (type === "make-ten-shield" || type === "train-of-ten" ? 6 + Math.floor(Math.random() * 4) : 1 + Math.floor(Math.random() * 10));
    let quantity = clampOptionQuantity(rawQuantity);
    if (type === "make-ten-shield" || type === "train-of-ten") quantity = Math.max(1, Math.min(9, quantity));
    if (type === "split-chests") quantity = Math.max(3, quantity);
    if (type === "double-track") {
      quantity = Math.max(2, quantity);
      if (quantity % 2 === 1) quantity = quantity < 10 ? quantity + 1 : quantity - 1;
    }
    if (type === "one-more-one-less") quantity = Math.min(9, quantity);
    const promptRepresentation = options.representation ?? config.promptRepresentation;
    const answerRepresentation = config.answerRepresentation;
    const levelId = options.levelId ?? type;
    let correctAnswer: Challenge["correctAnswer"] = quantity;
    let challengeOptions: ChallengeOption[];

    if (type === "make-ten-shield" || type === "train-of-ten") {
      const complement = makeTenComplement(quantity);
      correctAnswer = complement;
      challengeOptions = shuffle([
        optionFromQuantity(complement, answerRepresentation, true, String(complement)),
        ...distractors(complement).map((item) => optionFromQuantity(item, answerRepresentation, false, String(item)))
      ]);
    } else if (type === "split-chests" || type === "double-track") {
      const split = splitOptions(quantity, answerRepresentation);
      correctAnswer = split.correctAnswer;
      challengeOptions = split.options;
    } else if (type === "one-more-one-less") {
      const target = clampOptionQuantity(quantity + 1);
      correctAnswer = target;
      challengeOptions = shuffle([
        optionFromQuantity(target, answerRepresentation, true, String(target)),
        optionFromQuantity(clampOptionQuantity(quantity - 1), answerRepresentation, false, String(clampOptionQuantity(quantity - 1))),
        optionFromQuantity(quantity, answerRepresentation, false, String(quantity))
      ]);
    } else if (type === "enemy-wave-compare") {
      const other = quantity === 10 ? 7 : clampOptionQuantity(quantity + 2);
      const larger = Math.max(quantity, other);
      correctAnswer = larger;
      challengeOptions = shuffle([
        optionFromQuantity(quantity, answerRepresentation, quantity === larger, String(quantity)),
        optionFromQuantity(other, answerRepresentation, other === larger, String(other)),
        optionFromQuantity(clampOptionQuantity(larger - 1), answerRepresentation, false, String(clampOptionQuantity(larger - 1)))
      ]);
    } else {
      challengeOptions = shuffle([
        optionFromQuantity(quantity, answerRepresentation, true, String(quantity)),
        ...distractors(quantity).map((item) => optionFromQuantity(item, answerRepresentation, false, String(item)))
      ]);
    }

    return {
      id: `${type}-${quantity}-${idPart()}`,
      levelId,
      challengeType: type,
      title: config.title,
      prompt: config.prompt(quantity),
      scene: options.scene ?? "minigame",
      skill: config.skill,
      representation: promptRepresentation,
      promptRepresentation,
      answerRepresentation,
      quantity,
      correctAnswer,
      displayTimeMs: type === "flash-gates" ? subitizeThresholdMs(quantity) : 1400,
      options: challengeOptions,
      mechanic: config.mechanic,
      successEffect: config.successEffect,
      safeErrorEffect: config.safeErrorEffect,
      hint: config.hint
    };
  }

  createRunnerChallenge(mechanic: string, options: ChallengeFactoryOptions = {}): Challenge {
    const map: Record<string, MinigameType> = {
      "flash-gate": "flash-gates",
      "subitize-boost": "flash-gates",
      "make-ten-shield": "make-ten-shield",
      "bead-bridge": "bead-bridge",
      "jump-platform": "one-more-one-less",
      "split-chest": "split-chests",
      "enemy-wave": "enemy-wave-compare",
      "one-more-less": "one-more-one-less",
      "rescue-cage": "rescue-the-herd",
      "shortcut-route": "web-anchors",
      "dino-streak": "double-track"
    };
    const type = map[mechanic] ?? "flash-gates";
    const challenge = this.createMinigame(type, { ...options, scene: "runner", levelId: mechanic });
    return {
      ...challenge,
      mechanic
    };
  }

  createWebChallenge(options: ChallengeFactoryOptions = {}): Challenge {
    const sequence: MinigameType[] = [
      "web-anchors",
      "make-ten-shield",
      "split-chests",
      "one-more-one-less",
      "enemy-wave-compare",
      "train-of-ten"
    ];
    const type = sequence[Math.floor(Math.random() * sequence.length)];
    return this.createMinigame(type, { ...options, scene: "webwoud", levelId: "webwoud-anchor" });
  }

  createCityChallenge(districtId: string, options: ChallengeFactoryOptions = {}): Challenge {
    const type = cityChallengeByDistrict[districtId] ?? "build-the-number";
    return this.createMinigame(type, { ...options, scene: "city", levelId: districtId });
  }
}


