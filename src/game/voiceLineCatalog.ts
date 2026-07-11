import { BOSSES, FRIENDS, FRIEND_STORY, JOURNEY_INTRO, REGION_STORY, journeyFinale } from "../data/journey";
import { STICKERS } from "../data/stickers";
import { SHAPES } from "../education/geometry/shapes";
import { LETTERS } from "../education/literacy/letters";
import { PHONICS_WORDS } from "../education/literacy/phonics";
import { rhymeGroups } from "../education/literacy/rhymes";
import { LISTEN_STORIES } from "../education/literacy/stories";
import { TRAFFIC_CARDS } from "../education/world/traffic";
import { WORLDS } from "../runner/worlds";
import { HERO_SKINS } from "../runner/skins";
import { BUDDY_LEVELS } from "../scenes/buddy";

export interface VoiceLineCatalogEntry {
  id: string;
  text: string;
  spokenText: string;
  category: string;
}

const DUTCH_NUMBERS = [
  "nul",
  "één",
  "twee",
  "drie",
  "vier",
  "vijf",
  "zes",
  "zeven",
  "acht",
  "negen",
  "tien",
  "elf",
  "twaalf",
  "dertien",
  "veertien",
  "vijftien",
  "zestien",
  "zeventien",
  "achttien",
  "negentien",
  "twintig"
];

function soundFor(unit: string): string {
  const spoken: Record<string, string> = {
    m: "mmm",
    s: "sss",
    v: "vvv",
    r: "rrr",
    n: "nnn",
    z: "zzz",
    h: "hhh",
    l: "lll",
    f: "fff",
    w: "www",
    b: "buh",
    d: "duh",
    k: "kuh",
    p: "puh",
    t: "tuh",
    a: "aaa",
    e: "eh",
    i: "ih",
    o: "oh",
    u: "uh"
  };
  return spoken[unit] ?? unit;
}

function buildVoiceLineCatalog(): VoiceLineCatalogEntry[] {
  const lines = new Map<string, VoiceLineCatalogEntry>();
  const add = (id: string, text: string, category: string, spokenText = text): void => {
    const cleanText = text.trim();
    if (!cleanText || lines.has(cleanText)) return;
    lines.set(cleanText, { id, text: cleanText, spokenText: spokenText.trim(), category });
  };
  const addMany = (category: string, texts: string[]): void => {
    texts.forEach((text, index) => add(`${category}-${index + 1}`, text, category));
  };

  addMany("praise", ["Goed zo!", "Knap!", "Super!", "Wauw!", "Yes!", "Top!", "Hoera!", "Heel goed!"]);
  addMany("encourage", ["Bijna! Probeer nog eens.", "Tel rustig mee.", "Kijk nog eens goed.", "Je kan het!"]);
  addMany("common", [
    "Hoi! Wat gaan we spelen?",
    "Ga!",
    "Eerst deze!",
    "Verder met de reis!",
    "Verder met de reis! Waar gaan we heen?",
    "Daar gaan we! Volg de weg.",
    "Goed zo! Verder met de reis!",
    "Helemaal thuis! Knap gedaan!",
    "Perfect! Heel knap gedaan!",
    "Goed gedaan!",
    "Perfect geheugen!",
    "Luister nog eens goed.",
    "Luister naar de klank.",
    "Zoem rustig: rek de klanken aan elkaar.",
    "Zeg het woord traag en luister.",
    "Joepie!",
    "Probeer nog!",
    "Bijna!",
    "Nog eens.",
    "Kijk: eerst vijf, dan de extra blokjes.",
    "Eerst de tien vol, dan de rest.",
    "Knap! Een nieuwe wereld is open!",
    "Perfect gelopen!",
    "Hoera! Drie sterren erbij!",
    "Laatste klap!",
    "De Sterrenrover wordt boos!",
    "Alle bazen verslagen! Jij bent de kampioen van de Sterrenarena!"
  ]);
  addMany("profiles", ["Hoi! Kies jouw teken.", "Kies wie er nu speelt.", "Hoi! Daar gaan we!"]);
  HERO_SKINS.forEach((skin) => add(`profile-skin-${skin.id}`, skin.name, "profiles"));

  addMany("minigame-instruction", [
    "Tik elk diertje aan en tel hardop. Kies dan het juiste getal.",
    "De dino heeft honger! Tik de groep met de MEESTE.",
    "Vul precies zoveel vakjes als het getal. Eerst de bovenste rij.",
    "Welke groep heeft even veel als deze?",
    "Zoek de paren: het getal en het groepje met even veel.",
    "Tik de getallen van klein naar groot.",
    "Hoeveel zie je? Tik het getal en raak de baas!"
  ]);
  addMany("minigame-reteach", [
    "Tik elk dier aan en tel mee.",
    "Tel rustig: eerst vijf, dan de rest.",
    "Tel allebei de groepjes en kijk welke even veel heeft.",
    "De grootste groep heeft meer stippen.",
    "Vul net zoveel vakjes als het getal. Eerst de bovenste rij van vijf.",
    "Begin bij het kleinste getal.",
    "Tel de stippen: welke heeft er meer?",
    "Tel beide groepjes en kijk goed.",
    "Tel eentje verder.",
    "Tel eentje terug.",
    "Zoek het kleinste getal dat nog over is.",
    "Tel rustig langs de lijn.",
    "Eerst de volle tien, dan de losse.",
    "Leg ze naast elkaar en vergelijk.",
    "Tel de muntjes samen: 5, dan 2, dan 1.",
    "Kijk naar de wijzers: kort = uur, lang = minuten.",
    "Kijk goed naar de vorm.",
    "Tel de twee vakjes samen. Eerst vijf, dan de rest.",
    "Hoeveel moet erbij om samen het getal te maken? Kijk naar het lege vak.",
    "Tel de twee delen samen.",
    "Samen is het nog niet zoveel. Kijk naar het lege vak."
  ]);

  DUTCH_NUMBERS.forEach((word, number) => add(`number-${number}`, word, "numbers"));
  for (let quantity = 1; quantity <= 10; quantity += 1) {
    add(`flash-gate-${quantity}`, `Welke poort is ${quantity}?`, "number-prompts");
    add(`dice-hunt-${quantity}`, `Vind de dobbelsteen voor ${quantity}.`, "number-prompts");
    add(`bead-bridge-${quantity}`, `Kies de kralenbrug met ${quantity}.`, "number-prompts");
    add(`split-chest-${quantity}`, `Open ${quantity} als twee delen.`, "number-prompts");
    add(`web-anchor-${quantity}`, `Zwaai naar hetzelfde als ${quantity}.`, "number-prompts");
    add(`build-number-${quantity}`, `Bouw precies ${quantity}.`, "number-prompts");
    add(`double-track-${quantity}`, `Vind de dubbele route voor ${quantity}.`, "number-prompts");
    add(`rescue-herd-${quantity}`, `Laat precies ${quantity} dieren door.`, "number-prompts");
    if (quantity <= 9) {
      add(`make-ten-shield-${quantity}`, `Het schild heeft ${quantity}. Wat maakt 10?`, "number-prompts");
      add(`train-ten-${quantity}`, `Wagon heeft ${quantity}. Welke erbij voor 10?`, "number-prompts");
      add(`one-more-${quantity}`, `Spring naar eentje meer dan ${quantity}.`, "number-prompts");
      add(`what-more-${quantity}`, `Wat is eentje MEER dan ${quantity}?`, "number-prompts");
      add(`what-less-${quantity}`, `Wat is eentje MINDER dan ${quantity}?`, "number-prompts");
    }
  }

  for (let base = 2; base <= 9; base += 1) {
    add(`one-more-hint-${base}`, `Eentje meer dan ${base} is ${base + 1}.`, "number-prompts");
    add(`one-less-hint-${base}`, `Eentje minder dan ${base} is ${base - 1}.`, "number-prompts");
  }

  for (let total = 1; total <= 10; total += 1) {
    add(`split-total-${total}`, `Welke twee samen maken ${total}?`, "splitbord");
    for (let known = 0; known <= total; known += 1) {
      add(`split-missing-${total}-${known}`, `${total} is ${known} en hoeveel?`, "splitbord");
    }
    for (let left = 0; left <= total; left += 1) {
      const right = total - left;
      add(`split-parts-${left}-${right}`, `${left} en ${right} maken samen hoeveel?`, "splitbord");
      add(`split-fact-${total}-${left}-${right}`, `${total} is ${left} en ${right}.`, "splitbord");
    }
  }

  const sounds = [...new Set(PHONICS_WORDS.flatMap((word) => [word.begin, word.end, ...word.units]))];
  sounds.forEach((sound) => {
    add(`begin-sound-${sound}`, `Welk woord begint met de ${sound}-klank?`, "phonics", `Welk woord begint met de ${soundFor(sound)} klank?`);
    add(`end-sound-${sound}`, `Welk woord eindigt met de ${sound}-klank?`, "phonics", `Welk woord eindigt met de ${soundFor(sound)} klank?`);
    add(`sound-hint-${sound}`, `Luister naar de ${sound}-klank.`, "phonics", `Luister naar de ${soundFor(sound)} klank.`);
  });
  PHONICS_WORDS.forEach((word) => {
    add(
      `blend-picture-${word.word}`,
      `Welk plaatje is ${word.units.join("-")}?`,
      "phonics",
      `Welk plaatje is ${word.units.map(soundFor).join(" ")}?`
    );
    add(`word-${word.word}`, word.word, "reading-word");
  });
  addMany("reading", [
    "Welke letter hoor je?",
    "Zoem de klanken samen. Welk plaatje is het?",
    "Welke klank hoort in het lege vakje?",
    "Zeg het woord traag en luister naar elke klank.",
    "Luister: ik rek de klanken.",
    "Rek de klanken aan elkaar tot een woord."
  ]);
  addMany("minimal-pairs", [
    "Welk woord hoor je? Tik op het plaatje.",
    "Luister goed naar het stukje dat anders klinkt."
  ]);
  add("rhyme-hint", "Luister goed naar het einde van de woorden.", "rhyme");
  rhymeGroups().forEach((group) => {
    group.words.forEach((word) => add(`rhyme-${group.key}-${word.word}`, `Wat rijmt op ${word.word}?`, "rhyme"));
  });
  LETTERS.forEach((letter) => {
    add(
      `letter-word-${letter}`,
      `Welk woord begint met de letter ${letter.toUpperCase()}?`,
      "letters",
      `Welk woord begint met de letter ${soundFor(letter)}?`
    );
  });

  add("line-missing", "Welk getal is weg?", "math20");
  for (let target = 1; target <= 19; target += 1) {
    add(`line-after-${target}`, `Welk getal komt na de ${target}?`, "math20");
    add(`line-before-${target}`, `Welk getal komt voor de ${target}?`, "math20");
  }
  add("teen-read", "Welk getal is dit? Tien en nog wat.", "math20");
  for (let total = 11; total <= 19; total += 1) add(`teen-build-${total}`, `${total} is tien en hoeveel?`, "math20");
  for (let first = 6; first <= 9; first += 1) {
    const toTen = 10 - first;
    add(`bridge-to-ten-${first}`, `${first} + ? = 10`, "math20");
    add(`bridge-to-ten-text-${first}`, `${first} en ${toTen} is 10.`, "math20");
  }
  for (let first = 5; first <= 9; first += 1) {
    const toTen = 10 - first;
    for (let rest = 1; rest <= Math.max(1, first - 1); rest += 1) {
      const second = toTen + rest;
      if (second > 9) continue;
      add(`bridge-add-${first}-${second}`, `${first} + ${second} = ?`, "math20");
      add(`bridge-add-text-${first}-${second}`, `${first} en ${toTen} is 10, en nog ${rest} is ${first + second}.`, "math20");
    }
  }
  for (let minuend = 11; minuend <= 18; minuend += 1) {
    const ones = minuend - 10;
    for (let rest = 1; rest <= 9 - ones; rest += 1) {
      const subtrahend = ones + rest;
      add(`bridge-sub-${minuend}-${subtrahend}`, `${minuend} - ${subtrahend} = ?`, "math20");
      add(`bridge-sub-text-${minuend}-${subtrahend}`, `${minuend} min ${ones} is 10, en nog ${rest} eraf is ${minuend - subtrahend}.`, "math20");
    }
  }

  for (let base = 1; base <= 10; base += 1) {
    add(`double-prompt-${base}`, `Dubbel ${base}?`, "doubles", `Wat is dubbel ${base}?`);
    add(
      `double-hint-${base}`,
      `Dubbel is twee keer evenveel: ${base} en nog ${base}.`,
      "doubles"
    );
    if (base <= 9) {
      const answer = base + base + 1;
      add(`near-double-prompt-${base}`, `${base} + ${base + 1} = ?`, "doubles", `${base} plus ${base + 1} is hoeveel?`);
      add(
        `near-double-hint-${base}`,
        `${base} en nog ${base} is ${base + base}, plus 1 is ${answer}.`,
        "doubles"
      );
    }
  }
  for (let number = 1; number <= 20; number += 1) {
    add(`even-odd-${number}`, `Is ${number} even of oneven?`, "doubles");
  }
  add(
    "even-odd-hint",
    "Leg de getallen in tweetallen. Bij even blijft er niets over; bij oneven blijft er eentje over.",
    "doubles"
  );

  const bondNumbers = ["nul", "een", "twee", "drie", "vier", "vijf", "zes", "zeven", "acht", "negen", "tien"];
  for (let first = 0; first <= 10; first += 1) {
    const partner = 10 - first;
    add(`bond-find-${first}`, `${first} en hoeveel maken 10?`, "bonds");
    add(`bond-pick-${first}`, `Welke vriend maakt ${first} tot 10?`, "bonds");
    add(
      `bond-full-hint-${first}`,
      `Tienframe: ${bondNumbers[first]} vol, dan nog ${bondNumbers[partner]} tot tien.`,
      "bonds"
    );
    for (let second = 0; second <= 10; second += 1) {
      add(`bond-is-ten-${first}-${second}`, `Maken ${first} en ${second} samen 10?`, "bonds");
      if (first + second !== 10) {
        add(
          `bond-not-ten-hint-${first}-${second}`,
          `Tienframe: ${bondNumbers[first]} en ${bondNumbers[second]} maken geen tien vol.`,
          "bonds"
        );
      }
    }
  }

  for (const step of [2, 5, 10]) {
    const word = step === 2 ? "twee" : step === 5 ? "vijf" : "tien";
    add(
      `skip-next-${step}`,
      `Tel verder per ${step}. Welk getal komt daarna?`,
      "skip-counting",
      `Tel verder per ${word}. Welk getal komt daarna?`
    );
    add(
      `skip-missing-${step}`,
      `We tellen per ${step}. Welk getal is weg?`,
      "skip-counting",
      `We tellen per ${word}. Welk getal is weg?`
    );
    add(`skip-hint-${step}`, `Spring telkens ${step} verder.`, "skip-counting", `Spring telkens ${word} verder.`);
  }

  addMany("geometry", ["Hoeveel hoeken heeft deze vorm?", "Wat komt er nu? Maak het patroon af."]);
  SHAPES.forEach((shape) => add(`shape-find-${shape.id}`, `Tik de ${shape.name}.`, "geometry"));

  add("klok-read", "Hoe laat is het?", "klok");
  const dutchTime = (hour: number, minute: number): string => (minute === 30 ? `half ${hour === 12 ? 1 : hour + 1}` : `${hour} uur`);
  for (let hour = 1; hour <= 12; hour += 1) {
    for (const minute of [0, 30]) {
      const time = dutchTime(hour, minute);
      add(`klok-time-${hour}-${minute}`, time, "klok");
      add(`klok-which-${hour}-${minute}`, `Welke klok is ${time}?`, "klok");
    }
  }

  add("geld-count", "Hoeveel euro is dit samen?", "geld");
  for (let amount = 3; amount <= 10; amount += 1) add(`geld-make-${amount}`, `Welke portemonnee is ${amount} euro?`, "geld");
  addMany("meet", ["Hoeveel blokjes lang is de balk?", "Welke balk is het langst?", "Welke balk is het kortst?"]);

  TRAFFIC_CARDS.forEach((card) => {
    add(`traffic-prompt-${card.id}`, card.prompt, "traffic");
    add(`traffic-lesson-${card.id}`, card.lesson, "traffic");
    card.options.forEach((option, index) => add(`traffic-option-${card.id}-${index}`, option.label, "traffic"));
  });

  LISTEN_STORIES.forEach((story) => {
    add(`listen-story-${story.id}`, story.text, "listening");
    story.questions.forEach((question, questionIndex) => {
      add(`listen-question-${story.id}-${questionIndex}`, question.prompt, "listening");
      question.options.forEach((option, optionIndex) => add(`listen-option-${story.id}-${questionIndex}-${optionIndex}`, option.label, "listening"));
    });
  });

  add("journey-title", JOURNEY_INTRO.title, "story");
  JOURNEY_INTRO.lines.forEach((line, index) => add(`journey-intro-${index}`, line, "story"));
  add("journey-start", JOURNEY_INTRO.start, "story");
  add("journey-intro-combined", JOURNEY_INTRO.lines.join(" "), "story");
  addMany("journey-round", [
    "De sterren willen nog een reis! Dezelfde weg, maar alles is een beetje moeilijker. Laat zien hoe sterk je geworden bent!",
    "De sterren willen nog een reis. Het wordt ietsje moeilijker. Ga je mee?"
  ]);
  WORLDS.forEach((world) => {
    const story = REGION_STORY[world.id] ?? "";
    add(`region-story-${world.id}`, story, "story");
    add(`region-welcome-${world.id}`, `Welkom in ${world.name}! ${story}`, "story");
    add(`region-healed-${world.id}`, `Kijk! De kleuren zijn terug in ${world.name}!`, "story");
    const boss = BOSSES[world.id];
    if (boss) {
      add(`boss-intro-${world.id}`, `${boss.name}! ${boss.taunt}`, "boss");
      add(`boss-defeat-${world.id}`, `${boss.name} is verslagen! ${boss.defeat}`, "boss");
    }
  });
  FRIENDS.forEach((friend) => {
    const story = FRIEND_STORY[friend.id] ?? "";
    add(`friend-hi-${friend.id}`, `Hoi! Ik ben ${friend.name}!`, "story");
    add(`friend-rescue-${friend.id}`, `Hoera! ${friend.name} is gered en gaat mee! ${story}`, "story");
  });
  for (let rescued = 0; rescued <= FRIENDS.length; rescued += 1) add(`journey-finale-${rescued}`, journeyFinale(rescued), "story");
  add("final-boss-defeat", `De Sterrenrover laat de ster los! ${BOSSES.sterrenrace.defeat}`, "boss");

  STICKERS.forEach((sticker) => add(`sticker-${sticker.id}`, `Je verdiende een nieuwe sticker: ${sticker.name}!`, "reward"));
  BUDDY_LEVELS.forEach((level) => add(`buddy-level-${level.level}`, `Buddy groeit! ${level.title}!`, "reward"));
  addMany("daily-reward", [
    "Hoera! 3 sterren erbij!",
    "Ik heb je gemist! Fijn dat je er weer bent. 3 sterren erbij!",
    "Hoera, 2 dagen op een rij! 4 sterren erbij. Kom morgen weer!",
    "Hoera, 3 dagen op een rij! 5 sterren erbij. Kom morgen weer!",
    "Hoera, al vier dagen op een rij! 6 sterren erbij. Kom morgen weer!"
  ]);

  return [...lines.values()];
}

export const CURRENT_VOICE_LINE_CATALOG = buildVoiceLineCatalog();
