// Traffic-safety content for the Verkeerspad mode (optional WO/verkeer layer).
// Picture/audio-heavy question cards: crossing safely, traffic lights, being
// visible, passenger behaviour, the blind spot. Pure data — one correct answer
// per card, emoji pictures so no reading is required.

import type { Challenge, ChallengeOption, Representation } from "../types";

export interface TrafficCard {
  id: string;
  prompt: string;
  options: Array<{ emoji: string; label: string; isCorrect: boolean }>;
  /** spoken after a wrong tap: the safety rule, in child language. */
  lesson: string;
}

export const TRAFFIC_CARDS: TrafficCard[] = [
  {
    id: "oversteken-waar",
    prompt: "Waar steek je veilig over?",
    options: [
      { emoji: "🦓", label: "op het zebrapad", isCorrect: true },
      { emoji: "🚗", label: "tussen de auto's", isCorrect: false },
      { emoji: "🌳", label: "achter een boom", isCorrect: false }
    ],
    lesson: "Steek altijd over op het zebrapad."
  },
  {
    id: "licht-rood",
    prompt: "Het licht is rood. Wat doe je?",
    options: [
      { emoji: "✋", label: "stoppen en wachten", isCorrect: true },
      { emoji: "🏃", label: "snel oversteken", isCorrect: false },
      { emoji: "🙈", label: "ogen dicht en lopen", isCorrect: false }
    ],
    lesson: "Rood is stoppen. Wacht tot het groen is."
  },
  {
    id: "licht-groen",
    prompt: "Het licht is groen voor jou. Wat doe je?",
    options: [
      { emoji: "👀", label: "eerst kijken, dan oversteken", isCorrect: true },
      { emoji: "😴", label: "blijven staan slapen", isCorrect: false },
      { emoji: "🎮", label: "op je spelletje kijken", isCorrect: false }
    ],
    lesson: "Groen is gaan, maar kijk altijd eerst links en rechts."
  },
  {
    id: "donker-zichtbaar",
    prompt: "Het is donker. Wat trek je aan om gezien te worden?",
    options: [
      { emoji: "🦺", label: "een fluohesje", isCorrect: true },
      { emoji: "🥷", label: "donkere kleren", isCorrect: false },
      { emoji: "🕶️", label: "een zonnebril", isCorrect: false }
    ],
    lesson: "Met een fluohesje en lichtjes zien de auto's jou."
  },
  {
    id: "auto-gordel",
    prompt: "Je zit in de auto. Wat doe je eerst?",
    options: [
      { emoji: "🔗", label: "gordel vastklikken", isCorrect: true },
      { emoji: "🤸", label: "rondspringen", isCorrect: false },
      { emoji: "🪟", label: "uit het raam hangen", isCorrect: false }
    ],
    lesson: "Klik, vast! Altijd eerst je gordel."
  },
  {
    id: "fiets-helm",
    prompt: "Je gaat fietsen. Wat zet je op?",
    options: [
      { emoji: "🪖", label: "je fietshelm", isCorrect: true },
      { emoji: "🎩", label: "een hoge hoed", isCorrect: false },
      { emoji: "👑", label: "een kroontje", isCorrect: false }
    ],
    lesson: "Een helm beschermt je hoofd."
  },
  {
    id: "vrachtwagen-dode-hoek",
    prompt: "Een grote vrachtwagen staat aan het licht. Waar ga je staan?",
    options: [
      { emoji: "👋", label: "ver ervoor, waar de chauffeur je ziet", isCorrect: true },
      { emoji: "🫥", label: "er vlak naast", isCorrect: false },
      { emoji: "🎒", label: "er vlak achter", isCorrect: false }
    ],
    lesson: "Vlak naast of achter een vrachtwagen kan de chauffeur je niet zien: de dode hoek."
  },
  {
    id: "stoep-lopen",
    prompt: "Waar loop je op straat?",
    options: [
      { emoji: "🚶", label: "op de stoep", isCorrect: true },
      { emoji: "🛣️", label: "midden op de weg", isCorrect: false },
      { emoji: "🚌", label: "op de busbaan", isCorrect: false }
    ],
    lesson: "De stoep is voor voetgangers, de weg voor auto's."
  },
  {
    id: "bal-op-straat",
    prompt: "Je bal rolt de straat op. Wat doe je?",
    options: [
      { emoji: "🧍", label: "stoppen en een grote mens vragen", isCorrect: true },
      { emoji: "🏃", label: "er meteen achteraan rennen", isCorrect: false },
      { emoji: "😭", label: "de straat op duiken", isCorrect: false }
    ],
    lesson: "Nooit zomaar de straat op rennen, ook niet voor je bal."
  },
  {
    id: "hand-vasthouden",
    prompt: "Je steekt over met mama of papa. Wat doe je?",
    options: [
      { emoji: "🤝", label: "hand vasthouden", isCorrect: true },
      { emoji: "🏃", label: "vooruit rennen", isCorrect: false },
      { emoji: "🐌", label: "heel ver achterblijven", isCorrect: false }
    ],
    lesson: "Hand in hand oversteken is het veiligst."
  }
];

export interface TrafficRound {
  card: TrafficCard;
  prompt: string;
  options: Array<{ label: string; value: string; isCorrect: boolean; emoji: string; text: string }>;
  targetKey: string;
  skill: "trafficSafety";
}

function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

export function trafficRound(cardId?: string): TrafficRound {
  const card = (cardId && TRAFFIC_CARDS.find((c) => c.id === cardId)) || pickOne(TRAFFIC_CARDS);
  return {
    card,
    prompt: card.prompt,
    options: shuffle(
      card.options.map((opt) => ({
        label: opt.emoji,
        value: opt.label,
        isCorrect: opt.isCorrect,
        emoji: opt.emoji,
        text: opt.label
      }))
    ),
    targetKey: `traffic-${card.id}`,
    skill: "trafficSafety"
  };
}

let trafficCounter = 0;

export function trafficChallenge(round: TrafficRound): Challenge {
  trafficCounter += 1;
  const rep: Representation = "numeral";
  const options: ChallengeOption[] = round.options.map((opt, i) => ({
    id: `traffic-${trafficCounter}-${i}`,
    label: opt.emoji,
    value: opt.value,
    representation: rep,
    svg: "",
    isCorrect: opt.isCorrect
  }));
  return {
    id: `verkeerspad-${trafficCounter}`,
    levelId: "verkeerspad",
    challengeType: "traffic-safety",
    title: "Verkeerspad",
    prompt: round.prompt,
    scene: "minigame",
    skill: "subitize",
    representation: rep,
    promptRepresentation: rep,
    answerRepresentation: rep,
    quantity: 0,
    correctAnswer: round.options.find((o) => o.isCorrect)?.value ?? "",
    displayTimeMs: 4000,
    options,
    mechanic: `traffic|${round.card.id}`,
    successEffect: "Veilig gedaan!",
    safeErrorEffect: round.card.lesson,
    hint: round.card.lesson
  };
}
