// Tiny listening stories for the Luisterbos mode — listening comprehension +
// vocabulary. Each story is 2-3 short spoken sentences with two picture
// questions (who/what/where + a sequence or cause question). Emoji pictures, so
// no reading is required. Pure data.

import type { Challenge, ChallengeOption, Representation } from "../types";

export interface StoryQuestion {
  prompt: string;
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

/** A session plan: N stories, each followed by its questions in order. */
export function storySession(storyCount = 3): StoryRound[] {
  const picked = shuffle(LISTEN_STORIES).slice(0, storyCount);
  const rounds: StoryRound[] = [];
  for (const story of picked) {
    story.questions.forEach((question, index) => {
      rounds.push({
        story,
        question,
        storyStart: index === 0,
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
