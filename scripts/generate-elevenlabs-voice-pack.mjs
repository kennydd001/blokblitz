import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadVoiceLineCatalog } from "./load-voice-line-catalog.mjs";

const apiKey = process.env.ELEVENLABS_API_KEY?.trim() ?? process.env.XI_API_KEY?.trim();
if (!apiKey) {
  console.error("ELEVENLABS_API_KEY or XI_API_KEY is required.");
  process.exit(1);
}

const model = process.env.ELEVENLABS_MODEL ?? "eleven_v3";
const voiceId = process.env.ELEVENLABS_VOICE_ID ?? "pFZP5JQG7iQjIQuC4Bku";
const voice = process.env.ELEVENLABS_VOICE_NAME ?? "Lily - Velvety Actress";
const voiceSlug = process.env.ELEVENLABS_PACK_SLUG ?? "elevenlabs-lily-v3";
const baseDir = path.resolve("public", "audio", "voice", "nl", voiceSlug);
let sourceManifestPath = path.resolve(
  process.env.ELEVENLABS_SOURCE_MANIFEST ?? path.join("public", "audio", "voice", "nl", "hestia", "voice-lines.json")
);
const manifestPath = path.join(baseDir, "voice-lines.json");
const tsManifestPath = path.resolve("src", "game", "voiceLineManifest.ts");
const force = process.argv.includes("--force");

const voiceSettings = {
  stability: Number(process.env.ELEVENLABS_STABILITY ?? 0.48),
  similarity_boost: Number(process.env.ELEVENLABS_SIMILARITY ?? 0.78),
  style: Number(process.env.ELEVENLABS_STYLE ?? 0.18),
  use_speaker_boost: process.env.ELEVENLABS_SPEAKER_BOOST !== "false",
  speed: Number(process.env.ELEVENLABS_SPEED ?? 0.9)
};
const seed = Number(process.env.ELEVENLABS_SEED ?? 11611);

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

// Windows reserves device names (nul, con, aux, prn, com1-9, lpt1-9).
const RESERVED_FILE_NAMES = /^(nul|con|aux|prn|com[1-9]|lpt[1-9])$/;

function voiceLineFile(slug) {
  return RESERVED_FILE_NAMES.test(slug) ? `${slug}-clip.mp3` : `${slug}.mp3`;
}

function comparableText(text) {
  return String(text).normalize("NFKD").replace(/\p{Diacritic}/gu, "");
}

function loadLines(currentCatalog) {
  if (!existsSync(sourceManifestPath)) {
    if (existsSync(manifestPath)) {
      sourceManifestPath = manifestPath;
    } else {
      console.error(`Source manifest not found: ${sourceManifestPath}`);
      process.exit(1);
    }
  }
  const source = JSON.parse(readFileSync(sourceManifestPath, "utf8"));
  const bySlug = new Map();
  for (const sourceLine of source.lines ?? []) {
    const text = String(sourceLine.text ?? "").trim();
    if (!text) continue;
    const slug = sourceLine.slug ?? voiceLineSlug(text);
    if (bySlug.has(slug)) continue;
    bySlug.set(slug, {
      id: sourceLine.id ?? slug,
      slug,
      text,
      spokenText: String(sourceLine.spokenText ?? text),
      category: sourceLine.category ?? "uncategorized"
    });
  }
  addSupplementalRuntimeLines(bySlug);
  for (const line of currentCatalog) {
    addRuntimeLine(bySlug, line.id, line.text, line.category, line.spokenText);
  }
  return [...bySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}

function addRuntimeLine(bySlug, id, text, category = "runtime-dynamic", spokenText = text) {
  const cleanText = String(text ?? "").trim();
  if (!cleanText) return;
  const slug = voiceLineSlug(cleanText);
  const cleanSpokenText = String(spokenText ?? cleanText);
  const existing = bySlug.get(slug);
  if (existing) {
    if (existing.text !== cleanText && comparableText(existing.spokenText) !== comparableText(cleanSpokenText)) {
      throw new Error(`Voice slug collision: "${existing.text}" and "${cleanText}" -> ${slug}`);
    }
    return;
  }
  bySlug.set(slug, { id, slug, text: cleanText, spokenText: cleanSpokenText, category });
}

function addSupplementalRuntimeLines(bySlug) {
  const buddyTitles = ["Kleine dino", "Coole dino", "Superdino", "Koningsdino", "Sterrendino"];
  const friends = [
    ["f-bun", "Hippie het konijn", "Hippie het konijn hupt mee en wijst de weg!"],
    ["f-fox", "Vonk de vos", "Vonk de vos snuffelt de muntjes zo voor je op!"],
    ["f-peng", "Pim de pinguin", "Pim de pinguin glijdt vrolijk met je mee!"],
    ["f-owl", "Oeki de uil", "Oeki de uil houdt van bovenaf de wacht!"],
    ["f-frog", "Bram de kikker", "Bram de kikker springt van blok naar blok!"],
    ["f-dragon", "Sterre de draak", "Sterre de draak draagt de ster het laatste stukje!"]
  ];
  const worlds = [
    ["grasland", "Grasland", "Het grasland werd grijs toen de ster viel. Breng de kleuren terug!"],
    ["muntgrot", "Muntgrot", "In de Muntgrot is het donker. Tel goed, dan glinstert het weer!"],
    ["ijsbaan", "IJsbaan", "Op de ijsbaan is alles bevroren. Warme antwoorden laten het smelten!"],
    ["webwoud", "Webwoud", "In het Webwoud raakte een vriendje verstrikt. Help het los!"],
    ["bouwdorp", "Bouwdorp", "Het Bouwdorp viel om. Samen bouwen we het stukje voor stukje weer op!"],
    ["sterrenrace", "Sterrenrace", "Bijna thuis! De sterrenhemel wacht op zijn verloren sterretje."]
  ];
  const bosses = [
    ["grasland", "Grauwgrijs", "Geen kleur voor jou!", "Het grasland is weer groen!"],
    ["muntgrot", "Schaduwvleer", "Lekker donker hier!", "De grot glinstert weer goud!"],
    ["ijsbaan", "Vorstwolf", "Alles bevriest!", "Het ijs glimt weer blauw!"],
    ["webwoud", "Webbaas", "Mooi vast in mijn web!", "Het webwoud kleurt weer groen!"],
    ["bouwdorp", "Sloopbot", "Sloop! Sloop!", "Het dorp staat weer overeind!"],
    ["sterrenrace", "Sterrenrover", "De ster is van mij!", "De sterrenhemel schittert weer!"]
  ];
  const stickers = [
    "Eerste ster",
    "Eerste run",
    "Tien sterren",
    "Vlijtig",
    "Muntgrot",
    "Sterrenvanger",
    "Hardloper",
    "Bouwer",
    "Webwoud",
    "Getallenbaas",
    "Kampioen",
    "Alle werelden"
  ];

  buddyTitles.forEach((title, index) => addRuntimeLine(bySlug, `runtime-buddy-level-${index + 1}`, `Buddy groeit! ${title}!`));
  friends.forEach(([id, name, story]) => {
    addRuntimeLine(bySlug, `runtime-friend-hi-${id}`, `Hoi! Ik ben ${name}!`);
    addRuntimeLine(bySlug, `runtime-friend-rescue-${id}`, `Hoera! ${name} is gered en gaat mee! ${story}`);
  });
  worlds.forEach(([id, name, story]) => {
    addRuntimeLine(bySlug, `runtime-region-welcome-${id}`, `Welkom in ${name}! ${story}`);
    addRuntimeLine(bySlug, `runtime-region-healed-${id}`, `Kijk! De kleuren zijn terug in ${name}!`);
  });
  bosses.forEach(([id, name, taunt, defeat]) => {
    addRuntimeLine(bySlug, `runtime-boss-intro-${id}`, `${name}! ${taunt}`);
    addRuntimeLine(bySlug, `runtime-boss-defeat-${id}`, `${name} is verslagen! ${defeat}`);
  });
  stickers.forEach((name, index) => addRuntimeLine(bySlug, `runtime-sticker-${index + 1}`, `Je verdiende een nieuwe sticker: ${name}!`));

  [
    "De Sterrenreis",
    "Op een nacht viel er een sterretje uit de hemel.",
    "Alle kleuren verdwenen... maar samen brengen we ze terug!",
    "Help Buddy de ster naar huis te dragen en onderweg vriendjes te redden.",
    "Start het avontuur!",
    "Op een nacht viel er een sterretje uit de hemel. Alle kleuren verdwenen... maar samen brengen we ze terug! Help Buddy de ster naar huis te dragen en onderweg vriendjes te redden.",
    "Knap! Een nieuwe wereld is open!",
    "Perfect gelopen!",
    "Hoera! Drie sterren erbij!",
    "Laatste klap!",
    "De Sterrenrover wordt boos!",
    "De Sterrenrover laat de ster los! De sterrenhemel schittert weer!",
    "De sterren willen nog een reis. Het wordt ietsje moeilijker. Ga je mee?",
    "De sterren willen nog een reis! Dezelfde weg, maar alles is een beetje moeilijker. Laat zien hoe sterk je geworden bent!",
    "Helemaal thuis! Knap gedaan!"
  ].forEach((text, index) => addRuntimeLine(bySlug, `runtime-extra-${index + 1}`, text));

  for (let friendsRescued = 0; friendsRescued <= 6; friendsRescued += 1) {
    addRuntimeLine(
      bySlug,
      `runtime-finale-${friendsRescued}`,
      `Hoera! De ster is thuis en schijnt weer! Alle kleuren zijn terug en ${friendsRescued} vriendjes vieren mee. Knap gedaan!`
    );
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkedFetch(url, options, label) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`${label} failed with HTTP ${response.status}: ${body.slice(0, 500)}`);
  }
  return response;
}

async function synthesizeOnce(line) {
  const url = new URL(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`);
  url.searchParams.set("output_format", "mp3_44100_128");
  const body = {
    text: line.spokenText,
    model_id: model,
    language_code: "nl",
    voice_settings: voiceSettings,
    seed
  };
  const response = await checkedFetch(
    url,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    },
    `ElevenLabs ${model}/${voice}/${line.id}`
  );
  return Buffer.from(await response.arrayBuffer());
}

async function synthesize(line) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      return await synthesizeOnce(line);
    } catch (error) {
      lastError = error;
      if (attempt < 4) await wait(700 * attempt);
    }
  }
  throw lastError;
}

async function writeTsManifest(lines) {
  const slugs = lines.map((line) => line.slug).sort();
  const content = `// Generated by scripts/generate-elevenlabs-voice-pack.mjs. Do not edit by hand.
// ElevenLabs clips are generated build-time and loaded locally at runtime.

export const VOICE_LINE_BASE_PATH = "/audio/voice/nl/${voiceSlug}/";

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

// Windows reserves device names (nul, con, aux, prn, com1-9, lpt1-9) - a file
// called "nul.mp3" cannot even be committed from a Windows checkout. Any slug
// that collides gets a "-clip" suffix on its FILENAME (the slug itself stays).
const RESERVED_FILE_NAMES = /^(nul|con|aux|prn|com[1-9]|lpt[1-9])$/;

export function voiceLineFile(slug: string): string {
  return RESERVED_FILE_NAMES.test(slug) ? \`\${slug}-clip.mp3\` : \`\${slug}.mp3\`;
}
`;
  await writeFile(tsManifestPath, content);
}

const currentCatalog = await loadVoiceLineCatalog();
const lines = loadLines(currentCatalog);
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
      provider: "ElevenLabs",
      model,
      voice,
      voiceId,
      route: "direct /v1/text-to-speech",
      sourceManifest: path.relative(process.cwd(), sourceManifestPath).replace(/\\/g, "/"),
      voiceSettings,
      seed,
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

console.log(`ElevenLabs voice-pack complete: ${lines.length} lines, ${generated} generated, ${skipped} skipped.`);
