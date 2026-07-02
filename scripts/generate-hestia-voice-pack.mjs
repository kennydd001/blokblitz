import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const apiKey = process.env.DEEPGRAM_API_KEY?.trim();
if (!apiKey) {
  console.error("DEEPGRAM_API_KEY is required.");
  process.exit(1);
}

const model = "aura-2-hestia-nl";
const baseDir = path.resolve("public", "audio", "voice", "nl", "hestia");
const manifestPath = path.join(baseDir, "voice-lines.json");
const tsManifestPath = path.resolve("src", "game", "voiceLineManifest.ts");
const force = process.argv.includes("--force");

const dutchNumbers = [
  "nul",
  "een",
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

const phonicsWords = [
  { word: "maan", units: ["m", "aa", "n"] },
  { word: "vis", units: ["v", "i", "s"] },
  { word: "zon", units: ["z", "o", "n"] },
  { word: "boom", units: ["b", "oo", "m"] },
  { word: "kat", units: ["k", "a", "t"] },
  { word: "hond", units: ["h", "o", "n", "d"] },
  { word: "muis", units: ["m", "ui", "s"] },
  { word: "neus", units: ["n", "eu", "s"] },
  { word: "roos", units: ["r", "oo", "s"] },
  { word: "bal", units: ["b", "a", "l"] },
  { word: "sok", units: ["s", "o", "k"] },
  { word: "ster", units: ["s", "t", "e", "r"] },
  { word: "huis", units: ["h", "ui", "s"] },
  { word: "boot", units: ["b", "oo", "t"] }
];

const letters = ["m", "s", "v", "r", "n", "b", "k", "z", "h", "t", "l", "d", "p", "o", "a", "e", "i", "u"];
const shapeNames = ["cirkel", "driehoek", "vierkant", "rechthoek", "vijfhoek", "zeshoek"];
const regionStories = [
  "Het grasland werd grijs toen de ster viel. Breng de kleuren terug!",
  "In de Muntgrot is het donker. Tel goed, dan glinstert het weer!",
  "Op de ijsbaan is alles bevroren. Warme antwoorden laten het smelten!",
  "In het Webwoud raakte een vriendje verstrikt. Help het los!",
  "Het Bouwdorp viel om. Samen bouwen we het stukje voor stukje weer op!",
  "Bijna thuis! De sterrenhemel wacht op zijn verloren sterretje."
];

const voiceLines = new Map();

function add(id, text, category, spokenText = text) {
  if (!text || !String(text).trim()) return;
  const slug = voiceLineSlug(text);
  if (!voiceLines.has(slug)) {
    voiceLines.set(slug, { id, slug, text, spokenText, category });
  }
}

function addMany(category, items) {
  items.forEach((text, index) => add(`${category}-${index + 1}`, text, category));
}

function voiceLineSlug(text) {
  return String(text)
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\+/g, " plus ")
    .replace(/-/g, " min ")
    .replace(/\?/g, " vraag ")
    .replace(/!/g, " uitroep ")
    .replace(/&/g, " en ")
    .replace(/\./g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

function soundFor(unit) {
  // Phoneme-true spellings for a Dutch voice, mirroring
  // src/education/literacy/phonemeInventory.ts. Continuous consonants stretch
  // (mmm), stop consonants get a minimal schwa (buh — NEVER the letter name
  // "bee"), short vowels stay short (oh, not ooo), digraphs read as themselves.
  const spoken = {
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

function blendTrigger(word) {
  return `${word.units.join("... ")}... ${word.word}`;
}

function blendSpoken(word) {
  return `${word.units.map(soundFor).join("... ")}... ${word.word}`;
}

function buildInventory() {
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
    "Eerst de tien vol, dan de rest."
  ]);
  add("journey-intro", "Op een nacht viel er een sterretje uit de hemel. Alle kleuren verdwenen... maar samen brengen we ze terug! Help Buddy de ster naar huis te dragen en onderweg vriendjes te redden.", "story");
  regionStories.forEach((line, index) => add(`region-story-${index + 1}`, line, "story"));
  addMany("story", [
    "Hippie het konijn hupt mee en wijst de weg!",
    "Vonk de vos snuffelt de muntjes zo voor je op!",
    "Pim de pinguin glijdt vrolijk met je mee!",
    "Oeki de uil houdt van bovenaf de wacht!",
    "Bram de kikker springt van blok naar blok!",
    "Sterre de draak draagt de ster het laatste stukje!",
    "Hoera! De ster is thuis en schijnt weer! Alle kleuren zijn terug en zes vriendjes vieren mee. Knap gedaan!"
  ]);

  dutchNumbers.forEach((word, number) => add(`number-${number}`, word, "numbers", number === 1 ? "één" : word));
  for (let n = 1; n <= 20; n += 1) add(`zeg-${n}`, `Zeg ${dutchNumbers[n]}`, "numbers", `Zeg ${n === 1 ? "één" : dutchNumbers[n]}`);

  for (let q = 1; q <= 10; q += 1) {
    add(`flash-gate-${q}`, `Welke poort is ${q}?`, "number-prompts");
    add(`dice-hunt-${q}`, `Vind de dobbelsteen voor ${q}.`, "number-prompts");
    add(`bead-bridge-${q}`, `Kies de kralenbrug met ${q}.`, "number-prompts");
    add(`split-chest-${q}`, `Open ${q} als twee delen.`, "number-prompts");
    add(`web-anchor-${q}`, `Zwaai naar hetzelfde als ${q}.`, "number-prompts");
    add(`build-number-${q}`, `Bouw precies ${q}.`, "number-prompts");
    add(`double-track-${q}`, `Vind de dubbele route voor ${q}.`, "number-prompts");
    add(`rescue-herd-${q}`, `Laat precies ${q} dieren door.`, "number-prompts");
    if (q <= 9) {
      add(`make-ten-shield-${q}`, `Het schild heeft ${q}. Wat maakt 10?`, "number-prompts");
      add(`train-ten-${q}`, `Wagon heeft ${q}. Welke erbij voor 10?`, "number-prompts");
      add(`one-more-${q}`, `Spring naar eentje meer dan ${q}.`, "number-prompts");
      add(`what-more-${q}`, `Wat is eentje MEER dan ${q}?`, "number-prompts");
      add(`what-less-${q}`, `Wat is eentje MINDER dan ${q}?`, "number-prompts");
    }
  }
  add("compare-largest", "Kies de grootste groep.", "number-prompts");
  add("count-scene", "Tik elk diertje aan en tel hardop. Kies dan het juiste getal.", "number-prompts");
  add("compare-scene", "De dino heeft honger! Tik de groep met de MEESTE.", "number-prompts");
  add("fill-scene", "Vul precies zoveel vakjes als het getal. Eerst de bovenste rij.", "number-prompts");
  add("match-scene", "Welke groep heeft even veel als deze?", "number-prompts");
  add("memory-scene", "Zoek de paren: het getal en het groepje met even veel.", "number-prompts");
  add("order-scene", "Tik de getallen van klein naar groot.", "number-prompts");
  add("boss-scene", "Hoeveel zie je? Tik het getal en raak de baas!", "number-prompts");

  for (let total = 1; total <= 10; total += 1) {
    add(`split-total-${total}`, `Welke twee samen maken ${total}?`, "splitbord");
    for (let known = 0; known <= total; known += 1) add(`split-missing-${total}-${known}`, `${total} is ${known} en hoeveel?`, "splitbord");
    for (let left = 0; left <= total; left += 1) {
      const right = total - left;
      add(`split-parts-${left}-${right}`, `${left} en ${right} maken samen hoeveel?`, "splitbord");
      add(`split-fact-${total}-${left}-${right}`, `${total} is ${left} en ${right}.`, "splitbord");
    }
  }

  const sounds = [...new Set(phonicsWords.flatMap((word) => [word.word[0], word.units.at(-1), ...word.units]).filter(Boolean))];
  sounds.forEach((unit) => add(`sound-${unit}`, unit, "phonics", soundFor(unit)));
  sounds.forEach((sound) => {
    add(`begin-sound-${sound}`, `Welk woord begint met de ${sound}-klank?`, "phonics", `Welk woord begint met de ${soundFor(sound)} klank?`);
    add(`end-sound-${sound}`, `Welk woord eindigt met de ${sound}-klank?`, "phonics", `Welk woord eindigt met de ${soundFor(sound)} klank?`);
  });
  phonicsWords.forEach((word) => {
    add(`blend-picture-${word.word}`, `Welk plaatje is ${word.units.join("-")}?`, "phonics", `Welk plaatje is ${word.units.map(soundFor).join(" ")}?`);
    add(`blend-${word.word}`, blendTrigger(word), "phonics", blendSpoken(word));
  });
  add("zoem-prompt", "Zoem de klanken samen. Welk plaatje is het?", "reading");
  add("wordbuild-prompt", "Welke klank hoort in het lege vakje?", "reading");
  add("wordbuild-hint", "Zeg het woord traag en luister naar elke klank.", "reading");
  add("wordbuild-success", "Woord gemaakt!", "reading");
  add("zoem-success", "Knap gezoemd!", "reading");

  add("letter-hear", "Welke letter hoor je?", "letters");
  letters.forEach((letter) => {
    add(`letter-sound-${letter}`, letter, "letters", soundFor(letter));
    add(`letter-word-${letter}`, `Welk woord begint met de letter ${letter.toUpperCase()}?`, "letters", `Welk woord begint met de letter ${soundFor(letter)}?`);
  });

  add("line-missing", "Welk getal is weg?", "math20");
  for (let target = 1; target <= 19; target += 1) {
    add(`line-after-${target}`, `Welk getal komt na de ${target}?`, "math20");
    add(`line-before-${target}`, `Welk getal komt voor de ${target}?`, "math20");
  }
  add("teen-read", "Welk getal is dit? Tien en nog wat.", "math20");
  for (let total = 11; total <= 19; total += 1) add(`teen-build-${total}`, `${total} is tien en hoeveel?`, "math20");
  for (let a = 6; a <= 9; a += 1) {
    const answer = 10 - a;
    add(`bridge-to-ten-${a}`, `${a} + ? = 10`, "math20");
    add(`bridge-to-ten-text-${a}`, `${a} en ${answer} is 10.`, "math20");
  }
  for (let a = 5; a <= 9; a += 1) {
    const toTen = 10 - a;
    for (let rest = 1; rest <= Math.max(1, a - 1); rest += 1) {
      const b = toTen + rest;
      if (b > 9) continue;
      const answer = a + b;
      add(`bridge-add-${a}-${b}`, `${a} + ${b} = ?`, "math20");
      add(`bridge-add-text-${a}-${b}`, `${a} en ${toTen} is 10, en nog ${rest} is ${answer}.`, "math20");
    }
  }
  for (let minuend = 11; minuend <= 18; minuend += 1) {
    const ones = minuend - 10;
    for (let rest = 1; rest <= 9 - ones; rest += 1) {
      const b = ones + rest;
      const answer = minuend - b;
      add(`bridge-sub-${minuend}-${b}`, `${minuend} - ${b} = ?`, "math20");
      add(`bridge-sub-text-${minuend}-${b}`, `${minuend} min ${ones} is 10, en nog ${rest} eraf is ${answer}.`, "math20");
    }
  }

  add("shape-corners", "Hoeveel hoeken heeft deze vorm?", "geometry");
  add("shape-pattern", "Wat komt er nu? Maak het patroon af.", "geometry");
  shapeNames.forEach((shape) => add(`shape-find-${shape}`, `Tik de ${shape}.`, "geometry"));

  // Standalone phonics words, so a zoem chain can end on the plain word.
  phonicsWords.forEach((word) => add(`word-${word.word}`, word.word, "phonics"));

  // Kloktoren: prompts + every whole/half hour in Flemish time language.
  add("klok-read", "Hoe laat is het?", "klok");
  const dutchTime = (hour, minute) => (minute === 30 ? `half ${hour === 12 ? 1 : hour + 1}` : `${hour} uur`);
  for (let hour = 1; hour <= 12; hour += 1) {
    for (const minute of [0, 30]) {
      const time = dutchTime(hour, minute);
      add(`klok-time-${hour}-${minute}`, time, "klok");
      add(`klok-which-${hour}-${minute}`, `Welke klok is ${time}?`, "klok");
    }
  }
  add("klok-wrong", "Kijk naar de wijzers: kort = uur, lang = minuten.", "klok");

  // Geldmarkt: prompts + purse targets.
  add("geld-count", "Hoeveel euro is dit samen?", "geld");
  for (let amount = 3; amount <= 10; amount += 1) add(`geld-make-${amount}`, `Welke portemonnee is ${amount} euro?`, "geld");
  add("geld-wrong", "Tel de muntjes samen: 5, dan 2, dan 1.", "geld");

  // Meetwerf: prompts.
  addMany("meet", [
    "Hoeveel blokjes lang is de balk?",
    "Welke balk is het langst?",
    "Welke balk is het kortst?",
    "Leg ze naast elkaar en vergelijk."
  ]);

  // Verkeerspad: card prompts, every option (spoken on tap) and every lesson.
  const trafficCards = [
    { prompt: "Waar steek je veilig over?", options: ["op het zebrapad", "tussen de auto's", "achter een boom"], lesson: "Steek altijd over op het zebrapad." },
    { prompt: "Het licht is rood. Wat doe je?", options: ["stoppen en wachten", "snel oversteken", "ogen dicht en lopen"], lesson: "Rood is stoppen. Wacht tot het groen is." },
    { prompt: "Het licht is groen voor jou. Wat doe je?", options: ["eerst kijken, dan oversteken", "blijven staan slapen", "op je spelletje kijken"], lesson: "Groen is gaan, maar kijk altijd eerst links en rechts." },
    { prompt: "Het is donker. Wat trek je aan om gezien te worden?", options: ["een fluohesje", "donkere kleren", "een zonnebril"], lesson: "Met een fluohesje en lichtjes zien de auto's jou." },
    { prompt: "Je zit in de auto. Wat doe je eerst?", options: ["gordel vastklikken", "rondspringen", "uit het raam hangen"], lesson: "Klik, vast! Altijd eerst je gordel." },
    { prompt: "Je gaat fietsen. Wat zet je op?", options: ["je fietshelm", "een hoge hoed", "een kroontje"], lesson: "Een helm beschermt je hoofd." },
    { prompt: "Een grote vrachtwagen staat aan het licht. Waar ga je staan?", options: ["ver ervoor, waar de chauffeur je ziet", "er vlak naast", "er vlak achter"], lesson: "Vlak naast of achter een vrachtwagen kan de chauffeur je niet zien: de dode hoek." },
    { prompt: "Waar loop je op straat?", options: ["op de stoep", "midden op de weg", "op de busbaan"], lesson: "De stoep is voor voetgangers, de weg voor auto's." },
    { prompt: "Je bal rolt de straat op. Wat doe je?", options: ["stoppen en een grote mens vragen", "er meteen achteraan rennen", "de straat op duiken"], lesson: "Nooit zomaar de straat op rennen, ook niet voor je bal." },
    { prompt: "Je steekt over met mama of papa. Wat doe je?", options: ["hand vasthouden", "vooruit rennen", "heel ver achterblijven"], lesson: "Hand in hand oversteken is het veiligst." }
  ];
  trafficCards.forEach((card, index) => {
    add(`verkeer-prompt-${index + 1}`, card.prompt, "verkeer");
    add(`verkeer-lesson-${index + 1}`, card.lesson, "verkeer");
    card.options.forEach((option, oi) => add(`verkeer-option-${index + 1}-${oi + 1}`, option, "verkeer"));
  });
  addMany("verkeer", ["Veilig gedaan!", "Kies het veilige pad in het verkeer."]);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function synthesizeOnce(line) {
  const url = new URL("https://api.deepgram.com/v1/speak");
  url.searchParams.set("model", model);
  url.searchParams.set("encoding", "mp3");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text: line.spokenText })
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`${line.slug} failed with HTTP ${response.status}: ${body.slice(0, 300)}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function synthesize(line) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      return await synthesizeOnce(line);
    } catch (error) {
      lastError = error;
      if (attempt < 4) await wait(600 * attempt);
    }
  }
  throw lastError;
}

async function writeTsManifest(lines) {
  const slugs = lines.map((line) => line.slug).sort();
  const content = `// Generated by scripts/generate-hestia-voice-pack.mjs. Do not edit by hand.
// Hestia clips are generated build-time and loaded locally at runtime.

export const VOICE_LINE_BASE_PATH = "/audio/voice/nl/hestia/";

export const VOICE_LINE_SLUGS = new Set<string>([
${slugs.map((slug) => `  "${slug}"`).join(",\n")}
]);

export function voiceLineSlug(text: string): string {
  return String(text)
    .normalize("NFKD")
    .replace(/\\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\\+/g, " plus ")
    .replace(/-/g, " min ")
    .replace(/\\?/g, " vraag ")
    .replace(/!/g, " uitroep ")
    .replace(/&/g, " en ")
    .replace(/\\./g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

// Windows reserves device names (nul, con, aux, prn, com1-9, lpt1-9) — a file
// called "nul.mp3" cannot even be committed from a Windows checkout. Any slug
// that collides gets a "-clip" suffix on its FILENAME (the slug itself stays).
const RESERVED_FILE_NAMES = /^(nul|con|aux|prn|com[1-9]|lpt[1-9])$/;

export function voiceLineFile(slug: string): string {
  return RESERVED_FILE_NAMES.test(slug) ? \`\${slug}-clip.mp3\` : \`\${slug}.mp3\`;
}
`;
  await writeFile(tsManifestPath, content);
}

// Windows reserves device names (nul, con, aux, ...); suffix those filenames.
const RESERVED_FILE_NAMES = /^(nul|con|aux|prn|com[1-9]|lpt[1-9])$/;
function voiceLineFile(slug) {
  return RESERVED_FILE_NAMES.test(slug) ? slug + '-clip.mp3' : slug + '.mp3';
}

buildInventory();
const lines = [...voiceLines.values()].sort((a, b) => a.slug.localeCompare(b.slug));
await mkdir(baseDir, { recursive: true });

let generated = 0;
let skipped = 0;
for (const line of lines) {
  const filePath = path.join(baseDir, voiceLineFile(line.slug));
  if (!force && existsSync(filePath)) {
    skipped += 1;
    continue;
  }
  const audio = await synthesize(line);
  await writeFile(filePath, audio);
  generated += 1;
  console.log(`${voiceLineFile(line.slug)} (${audio.length} bytes)`);
}

await writeFile(
  manifestPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      provider: "Deepgram",
      model,
      voice: "Hestia",
      route: "direct /v1/speak",
      lineCount: lines.length,
      lines: lines.map((line) => ({
        ...line,
        file: voiceLineFile(line.slug)
      }))
    },
    null,
    2
  )
);
await writeTsManifest(lines);

console.log(`Hestia voice-pack complete: ${lines.length} lines, ${generated} generated, ${skipped} skipped.`);
