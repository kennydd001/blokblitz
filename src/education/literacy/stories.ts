// Tiny listening stories for the Luisterbos mode — listening comprehension +
// vocabulary. Each story is 2-3 short spoken sentences with two picture
// questions (who/what/where + a sequence or cause question). Emoji pictures, so
// no reading is required. Pure data.

import type { DifficultyTier } from "../difficulty";
import type { Challenge, ChallengeOption, Representation } from "../types";

export interface StoryQuestion {
  prompt: string;
  difficulty?: "recall" | "reasoning";
  options: Array<{ emoji: string; label: string; isCorrect: boolean }>;
}

export interface ListenStory {
  id: string;
  emoji: string;
  title: string;
  text: string;
  questions: StoryQuestion[];
}

export const LISTEN_STORIES: ListenStory[] = [
  {
    id: "poes-boom",
    emoji: "🐱",
    title: "De poes in de boom",
    text: "De poes klimt in de hoge boom. Ze ziet een vogeltje en wil spelen. Maar de poes durft niet meer naar beneden!",
    questions: [
      {
        prompt: "Wie klimt er in de boom?",
        options: [
          { emoji: "🐱", label: "de poes", isCorrect: true },
          { emoji: "🐶", label: "de hond", isCorrect: false },
          { emoji: "🐰", label: "het konijn", isCorrect: false }
        ]
      },
      {
        prompt: "Wat ziet de poes in de boom?",
        options: [
          { emoji: "🐦", label: "een vogeltje", isCorrect: true },
          { emoji: "🐟", label: "een visje", isCorrect: false },
          { emoji: "🍎", label: "een appel", isCorrect: false }
        ]
      }
    ]
  },
  {
    id: "beer-honing",
    emoji: "🐻",
    title: "De beer en de honing",
    text: "De beer heeft honger. Hij zoekt honing bij de bijen. De bijen zoemen boos, dus de beer rent snel naar de rivier!",
    questions: [
      {
        prompt: "Wat zoekt de beer?",
        options: [
          { emoji: "🍯", label: "honing", isCorrect: true },
          { emoji: "🥕", label: "een wortel", isCorrect: false },
          { emoji: "🧀", label: "kaas", isCorrect: false }
        ]
      },
      {
        prompt: "Waar rent de beer naartoe?",
        options: [
          { emoji: "🏞️", label: "naar de rivier", isCorrect: true },
          { emoji: "🏠", label: "naar huis", isCorrect: false },
          { emoji: "🏫", label: "naar school", isCorrect: false }
        ]
      }
    ]
  },
  {
    id: "trein-berg",
    emoji: "🚂",
    title: "De kleine trein",
    text: "De kleine trein rijdt de hoge berg op. Eerst gaat het langzaam, tsjoeke tsjoeke. Boven op de berg toetert de trein heel blij!",
    questions: [
      {
        prompt: "Waar rijdt de trein naartoe?",
        options: [
          { emoji: "⛰️", label: "de berg op", isCorrect: true },
          { emoji: "🌊", label: "naar de zee", isCorrect: false },
          { emoji: "🌙", label: "naar de maan", isCorrect: false }
        ]
      },
      {
        prompt: "Wat doet de trein boven op de berg?",
        options: [
          { emoji: "📯", label: "blij toeteren", isCorrect: true },
          { emoji: "😴", label: "slapen", isCorrect: false },
          { emoji: "🍦", label: "een ijsje eten", isCorrect: false }
        ]
      }
    ]
  },
  {
    id: "kikker-regen",
    emoji: "🐸",
    title: "De kikker en de regen",
    text: "Het regent hard op de vijver. De kikker springt van blij op zijn blad. Na de regen komt een mooie regenboog!",
    questions: [
      {
        prompt: "Waarom springt de kikker?",
        difficulty: "reasoning",
        options: [
          { emoji: "🌧️", label: "hij is blij met de regen", isCorrect: true },
          { emoji: "😢", label: "hij is verdrietig", isCorrect: false },
          { emoji: "😡", label: "hij is boos", isCorrect: false }
        ]
      },
      {
        prompt: "Wat komt er na de regen?",
        options: [
          { emoji: "🌈", label: "een regenboog", isCorrect: true },
          { emoji: "⛄", label: "een sneeuwpop", isCorrect: false },
          { emoji: "🎈", label: "een ballon", isCorrect: false }
        ]
      }
    ]
  },
  {
    id: "muis-maan",
    emoji: "🐭",
    title: "De muis en de kaas-maan",
    text: "De kleine muis kijkt naar de volle maan. Hij denkt dat de maan van kaas is! Papa muis lacht en geeft hem een echt stukje kaas.",
    questions: [
      {
        prompt: "Waar kijkt de muis naar?",
        options: [
          { emoji: "🌕", label: "de maan", isCorrect: true },
          { emoji: "☀️", label: "de zon", isCorrect: false },
          { emoji: "📺", label: "de televisie", isCorrect: false }
        ]
      },
      {
        prompt: "Wat krijgt de muis van papa?",
        options: [
          { emoji: "🧀", label: "een stukje kaas", isCorrect: true },
          { emoji: "🍪", label: "een koekje", isCorrect: false },
          { emoji: "⚽", label: "een bal", isCorrect: false }
        ]
      }
    ]
  },
  {
    id: "vos-verjaardag",
    emoji: "🦊",
    title: "Het feest van de vos",
    text: "De vos is jarig vandaag. Alle dieren komen naar zijn feest in het bos. De uil brengt een grote taart met kaarsjes mee!",
    questions: [
      {
        prompt: "Wie is er jarig?",
        options: [
          { emoji: "🦊", label: "de vos", isCorrect: true },
          { emoji: "🦉", label: "de uil", isCorrect: false },
          { emoji: "🐻", label: "de beer", isCorrect: false }
        ]
      },
      {
        prompt: "Wat brengt de uil mee?",
        options: [
          { emoji: "🎂", label: "een taart", isCorrect: true },
          { emoji: "🎈", label: "ballonnen", isCorrect: false },
          { emoji: "📚", label: "een boek", isCorrect: false }
        ]
      }
    ]
  },
  {
    id: "pinguin-ijs",
    emoji: "🐧",
    title: "Pim glijdt op het ijs",
    text: "Pim de pinguïn glijdt de hele dag op zijn buik over het gladde ijs. Hij glijdt zo hard dat hij bijna in het koude water valt! Net op tijd stopt hij.",
    questions: [
      {
        prompt: "Waar glijdt Pim op?",
        options: [
          { emoji: "🧊", label: "op het ijs", isCorrect: true },
          { emoji: "🌊", label: "op de zee", isCorrect: false },
          { emoji: "🏖️", label: "op het zand", isCorrect: false }
        ]
      },
      {
        prompt: "Hoe glijdt Pim over het ijs?",
        options: [
          { emoji: "🫃", label: "op zijn buik", isCorrect: true },
          { emoji: "🦶", label: "op zijn voeten", isCorrect: false },
          { emoji: "🙌", label: "op zijn handen", isCorrect: false }
        ]
      }
    ]
  },
  {
    id: "kikker-vlieg",
    emoji: "🐸",
    title: "Bram vangt een vlieg",
    text: "Bram de kikker zit stil op een blad in de vijver. Zoem! Daar komt een vlieg. Bram steekt zijn lange tong uit en hap — de vlieg is weg!",
    questions: [
      {
        prompt: "Wat vangt Bram?",
        options: [
          { emoji: "🪰", label: "een vlieg", isCorrect: true },
          { emoji: "🐟", label: "een vis", isCorrect: false },
          { emoji: "🦋", label: "een vlinder", isCorrect: false }
        ]
      },
      {
        prompt: "Waarmee vangt Bram de vlieg?",
        options: [
          { emoji: "👅", label: "met zijn tong", isCorrect: true },
          { emoji: "✋", label: "met zijn hand", isCorrect: false },
          { emoji: "🕸️", label: "met een web", isCorrect: false }
        ]
      }
    ]
  },
  {
    id: "uil-nacht",
    emoji: "🦉",
    title: "Oeki blijft wakker",
    text: "Als alle dieren gaan slapen, wordt Oeki de uil pas wakker. In het donker ziet zij heel goed. Ze vliegt door de nacht en telt de sterren aan de hemel.",
    questions: [
      {
        prompt: "Wanneer is Oeki wakker?",
        options: [
          { emoji: "🌙", label: "in de nacht", isCorrect: true },
          { emoji: "☀️", label: "in de dag", isCorrect: false },
          { emoji: "🌧️", label: "in de regen", isCorrect: false }
        ]
      },
      {
        prompt: "Wat telt Oeki?",
        options: [
          { emoji: "⭐", label: "de sterren", isCorrect: true },
          { emoji: "🐟", label: "de visjes", isCorrect: false },
          { emoji: "🌳", label: "de bomen", isCorrect: false }
        ]
      }
    ]
  },
  {
    id: "konijn-wortel",
    emoji: "🐰",
    title: "Hippie zoekt een wortel",
    text: "Hippie het konijn heeft honger. Hij hupt door de tuin en graaft met zijn pootjes in de grond. Daar! Een grote oranje wortel om lekker aan te knagen.",
    questions: [
      {
        prompt: "Wat zoekt Hippie?",
        options: [
          { emoji: "🥕", label: "een wortel", isCorrect: true },
          { emoji: "🍎", label: "een appel", isCorrect: false },
          { emoji: "🧀", label: "een kaas", isCorrect: false }
        ]
      },
      {
        prompt: "Waarmee graaft Hippie?",
        options: [
          { emoji: "🐾", label: "met zijn pootjes", isCorrect: true },
          { emoji: "🥄", label: "met een lepel", isCorrect: false },
          { emoji: "👂", label: "met zijn oren", isCorrect: false }
        ]
      }
    ]
  },
  {
    id: "draak-ster",
    emoji: "🐲",
    title: "Sterre draagt het licht",
    text: "Sterre de kleine draak vliegt hoog boven het bos. In haar pootjes draagt ze een klein sterretje naar huis. Overal waar ze vliegt, komen de kleuren terug.",
    questions: [
      {
        prompt: "Wat draagt Sterre?",
        options: [
          { emoji: "⭐", label: "een sterretje", isCorrect: true },
          { emoji: "🌷", label: "een bloem", isCorrect: false },
          { emoji: "🎁", label: "een cadeau", isCorrect: false }
        ]
      },
      {
        prompt: "Wat komt er terug waar Sterre vliegt?",
        options: [
          { emoji: "🌈", label: "de kleuren", isCorrect: true },
          { emoji: "🌧️", label: "de regen", isCorrect: false },
          { emoji: "❄️", label: "de sneeuw", isCorrect: false }
        ]
      }
    ]
  },
  {
    id: "muis-kaas",
    emoji: "🐭",
    title: "Muis vindt de kaas",
    text: "Een kleine muis ruikt iets lekkers in de keuken. Op de tafel ligt een groot stuk gele kaas. Stilletjes klimt de muis omhoog en neemt een klein hapje.",
    questions: [
      {
        prompt: "Wat ruikt de muis?",
        options: [
          { emoji: "🧀", label: "de kaas", isCorrect: true },
          { emoji: "🍰", label: "de taart", isCorrect: false },
          { emoji: "🍞", label: "het brood", isCorrect: false }
        ]
      },
      {
        prompt: "Waar ligt de kaas?",
        options: [
          { emoji: "🪑", label: "op de tafel", isCorrect: true },
          { emoji: "🛏️", label: "op het bed", isCorrect: false },
          { emoji: "🌳", label: "in de boom", isCorrect: false }
        ]
      }
    ]
  }
];

export interface StoryRound {
  story: ListenStory;
  question: StoryQuestion;
  /** true when this round opens a new story (speak the story first). */
  storyStart: boolean;
  targetKey: string;
  skill: "listeningQuestion";
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

/** A session plan: N stories, each followed by the tier-appropriate questions. */
export function storySession(storyCount = 3, tier: DifficultyTier = 2): StoryRound[] {
  const picked = shuffle(LISTEN_STORIES).slice(0, storyCount);
  const rounds: StoryRound[] = [];
  for (const story of picked) {
    const starterQuestion = story.questions.find((question) => question.difficulty !== "reasoning") ?? story.questions[0];
    const questions = tier === 1 ? [starterQuestion] : story.questions;
    questions.forEach((question) => {
      const index = story.questions.indexOf(question);
      rounds.push({
        story,
        question,
        storyStart: questions.indexOf(question) === 0,
        targetKey: `story-${story.id}-${index}`,
        skill: "listeningQuestion"
      });
    });
  }
  return rounds;
}

let storyCounter = 0;

export function storyChallenge(round: StoryRound): Challenge {
  storyCounter += 1;
  const rep: Representation = "numeral";
  const options: ChallengeOption[] = shuffle(round.question.options).map((opt, i) => ({
    id: `story-${storyCounter}-${i}`,
    label: opt.emoji,
    value: opt.label,
    representation: rep,
    svg: "",
    isCorrect: opt.isCorrect
  }));
  return {
    id: `luisterbos-${storyCounter}`,
    levelId: "luisterbos",
    challengeType: "listen-story",
    title: round.story.title,
    prompt: round.question.prompt,
    scene: "minigame",
    skill: "subitize",
    representation: rep,
    promptRepresentation: rep,
    answerRepresentation: rep,
    quantity: 0,
    correctAnswer: round.question.options.find((o) => o.isCorrect)?.label ?? "",
    displayTimeMs: 4000,
    options,
    mechanic: `story|${round.story.id}`,
    successEffect: "Goed geluisterd!",
    safeErrorEffect: "Luister nog eens naar het verhaaltje.",
    hint: "Luister goed naar het verhaaltje."
  };
}
