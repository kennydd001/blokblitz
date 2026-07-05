// Clock reading (whole + half hours) for the Kloktoren mode. Analog clocks are
// drawn as local SVG; times use the Flemish convention ("3 uur", "half 4" = 3:30).
// Pure data + rendering.

import type { Challenge, ChallengeOption, Representation } from "../types";

export type ClockMode = "read-clock" | "which-clock";

export interface ClockRound {
  mode: ClockMode;
  hour: number; // 1..12
  minute: number; // 0 or 30
  prompt: string;
  promptHtml?: string;
  options: Array<{ label: string; value: string; isCorrect: boolean }>;
  targetKey: string;
  skill: "timeHourHalf";
}

export const CLOCK_MISCONCEPTIONS = ["hour-half-confusion", "clock-weak"] as const;
export type ClockMisconception = (typeof CLOCK_MISCONCEPTIONS)[number];

/** Flemish spoken time: whole = "3 uur", half = "half 4" (= 3:30). */
export function dutchTime(hour: number, minute: number): string {
  if (minute === 30) return `half ${hour === 12 ? 1 : hour + 1}`;
  return `${hour} uur`;
}

/** A local analog-clock SVG at hour:minute. */
export function clockSvg(hour: number, minute: number, size = 120): string {
  const ink = `stroke="#10131c"`;
  const hourAngle = ((hour % 12) * 30 + minute * 0.5) * (Math.PI / 180);
  const minAngle = minute * 6 * (Math.PI / 180);
  const hand = (angle: number, len: number, width: number, color: string): string => {
    const x = 50 + len * Math.sin(angle);
    const y = 50 - len * Math.cos(angle);
    return `<line x1="50" y1="50" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" ${ink} stroke-width="${width}" stroke-linecap="round" stroke="${color}"/>`;
  };
  let ticks = "";
  for (let i = 0; i < 12; i += 1) {
    const a = i * 30 * (Math.PI / 180);
    const x1 = 50 + 42 * Math.sin(a);
    const y1 = 50 - 42 * Math.cos(a);
    const x2 = 50 + 36 * Math.sin(a);
    const y2 = 50 - 36 * Math.cos(a);
    ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" ${ink} stroke-width="${i % 3 === 0 ? 3.5 : 2}" stroke-linecap="round"/>`;
  }
  return `<svg class="clock-svg" width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="50" cy="50" r="46" fill="#fffdf4" ${ink} stroke-width="4"/>
    ${ticks}
    ${hand(hourAngle, 26, 5, "#10131c")}
    ${hand(minAngle, 36, 3.5, "#e4564b")}
    <circle cx="50" cy="50" r="3.5" fill="#10131c"/>
  </svg>`;
}

function pickInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

/**
 * One clock round. `tier` shapes it dynamically: tier 1 reads whole hours
 * only, tier 2 mixes whole and half hours, tier 3 is half-hour heavy.
 */
export function clockRound(mode: ClockMode = pickOne(["read-clock", "which-clock"] as ClockMode[]), tier: 1 | 2 | 3 = 2): ClockRound {
  const hour = pickInt(1, 12);
  const minute = tier === 1 ? 0 : pickOne(tier === 3 ? [30, 30, 0] : [0, 30]);
  const key = `${hour}:${minute}`;

  // Distractor times: the other half/whole of this hour + a neighbour hour.
  const otherMinute = minute === 0 ? 30 : 0;
  const nextHour = hour === 12 ? 1 : hour + 1;
  const distractorTimes = shuffle([
    { hour, minute: otherMinute },
    { hour: nextHour, minute }
  ]);

  if (mode === "read-clock") {
    return {
      mode,
      hour,
      minute,
      prompt: "Hoe laat is het?",
      promptHtml: `<div class="klok-stage">${clockSvg(hour, minute, 150)}</div>`,
      options: shuffle([
        { label: dutchTime(hour, minute), value: key, isCorrect: true },
        ...distractorTimes.map((t) => ({ label: dutchTime(t.hour, t.minute), value: `${t.hour}:${t.minute}`, isCorrect: false }))
      ]),
      targetKey: `clock-${key}`,
      skill: "timeHourHalf"
    };
  }
  return {
    mode,
    hour,
    minute,
    prompt: `Welke klok is ${dutchTime(hour, minute)}?`,
    options: shuffle([
      { label: dutchTime(hour, minute), value: key, isCorrect: true },
      ...distractorTimes.map((t) => ({ label: dutchTime(t.hour, t.minute), value: `${t.hour}:${t.minute}`, isCorrect: false }))
    ]),
    targetKey: `clock-${key}`,
    skill: "timeHourHalf"
  };
}

export function classifyClockError(round: ClockRound, playerValue: string): ClockMisconception {
  const [, pm] = playerValue.split(":").map(Number);
  if (Number(pm) !== round.minute) return "hour-half-confusion";
  return "clock-weak";
}

let clockCounter = 0;

export function clockChallenge(round: ClockRound): Challenge {
  clockCounter += 1;
  const rep: Representation = "numeral";
  const options: ChallengeOption[] = round.options.map((opt, i) => ({
    id: `clock-${clockCounter}-${i}`,
    label: opt.label,
    value: opt.value,
    representation: rep,
    svg: "",
    isCorrect: opt.isCorrect
  }));
  return {
    id: `kloktoren-${clockCounter}`,
    levelId: "kloktoren",
    challengeType: `clock-${round.mode}`,
    title: "Kloktoren",
    prompt: round.prompt,
    scene: "minigame",
    skill: "subitize",
    representation: rep,
    promptRepresentation: rep,
    answerRepresentation: rep,
    quantity: 0,
    correctAnswer: `${round.hour}:${round.minute}`,
    displayTimeMs: 4000,
    options,
    mechanic: `clock|${round.mode}|${round.hour}|${round.minute}`,
    successEffect: "Juiste tijd!",
    safeErrorEffect: "Kijk naar de wijzers.",
    hint: "De korte wijzer is het uur, de lange de minuten."
  };
}
