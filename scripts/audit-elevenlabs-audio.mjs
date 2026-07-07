import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const voiceSlug = process.env.ELEVENLABS_PACK_SLUG ?? "elevenlabs-lily-v3";
const voiceDir = path.resolve("public", "audio", "voice", "nl", voiceSlug);
const readingDir = path.resolve("public", "audio", "reading", "nl", voiceSlug, "phonemes");
const sourceManifestPath = existsSync(path.join(voiceDir, "voice-lines.json"))
  ? path.join(voiceDir, "voice-lines.json")
  : path.resolve("public", "audio", "voice", "nl", "hestia", "voice-lines.json");
const voiceManifestTsPath = path.resolve("src", "game", "voiceLineManifest.ts");
const readingManifestTsPath = path.resolve("src", "game", "readingAudioManifest.ts");
const legacyHestiaDir = path.resolve("public", "audio", "voice", "nl", "hestia");

const requiredReadingKeys = [
  "m",
  "s",
  "v",
  "r",
  "n",
  "z",
  "h",
  "l",
  "f",
  "w",
  "b",
  "d",
  "k",
  "p",
  "t",
  "a",
  "e",
  "i",
  "o",
  "u",
  "aa",
  "ee",
  "oo",
  "uu",
  "oe",
  "ie",
  "eu",
  "ui",
  "ei",
  "ij",
  "ou",
  "au"
];

const RESERVED_FILE_NAMES = /^(nul|con|aux|prn|com[1-9]|lpt[1-9])$/;

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

function voiceLineFile(slug) {
  return RESERVED_FILE_NAMES.test(slug) ? `${slug}-clip.mp3` : `${slug}.mp3`;
}

function readingFile(key) {
  return `${key}.mp3`;
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

if (!existsSync(sourceManifestPath)) {
  fail(`Missing source voice manifest: ${sourceManifestPath}`);
} else {
  const manifest = JSON.parse(readFileSync(sourceManifestPath, "utf8"));
  const lines = manifest.lines ?? [];
  const slugs = new Set(lines.map((line) => line.slug));
  const missingVoice = lines
    .map((line) => voiceLineFile(line.slug))
    .filter((file) => !existsSync(path.join(voiceDir, file)));
  console.log(`Voice lines: ${lines.length}`);
  console.log(`Voice MP3s present: ${lines.length - missingVoice.length}`);
  console.log(`Voice MP3s missing: ${missingVoice.length}`);
  if (missingVoice.length) {
    console.log(`First missing voice files: ${missingVoice.slice(0, 20).join(", ")}`);
    fail("ElevenLabs sentence voice-pack is incomplete.");
  }

  const requiredRuntimeTexts = [
    "Buddy groeit! Sterrendino!",
    "Hoi! Ik ben Bram de kikker!",
    "Hoera! Bram de kikker is gered en gaat mee! Bram de kikker springt van blok naar blok!",
    "Welkom in Webwoud! In het Webwoud raakte een vriendje verstrikt. Help het los!",
    "Kijk! De kleuren zijn terug in Bouwdorp!",
    "Grauwgrijs! Geen kleur voor jou!",
    "Grauwgrijs is verslagen! Het grasland is weer groen!",
    "De Sterrenrover laat de ster los! De sterrenhemel schittert weer!",
    "Je verdiende een nieuwe sticker: Alle werelden!",
    "De sterren willen nog een reis. Het wordt ietsje moeilijker. Ga je mee?",
    "De sterren willen nog een reis! Dezelfde weg, maar alles is een beetje moeilijker. Laat zien hoe sterk je geworden bent!",
    "Hoera! De ster is thuis en schijnt weer! Alle kleuren zijn terug en 6 vriendjes vieren mee. Knap gedaan!"
  ];
  const missingRuntimeTexts = requiredRuntimeTexts.filter((text) => {
    const slug = voiceLineSlug(text);
    return !slugs.has(slug) || !existsSync(path.join(voiceDir, voiceLineFile(slug)));
  });
  console.log(`Runtime dynamic voice checks: ${requiredRuntimeTexts.length - missingRuntimeTexts.length}/${requiredRuntimeTexts.length}`);
  if (missingRuntimeTexts.length) {
    console.log(`Missing runtime voice texts: ${missingRuntimeTexts.join(" | ")}`);
    fail("ElevenLabs runtime dynamic voice coverage is incomplete.");
  }
}

const missingReading = requiredReadingKeys.filter((key) => !existsSync(path.join(readingDir, readingFile(key))));
console.log(`Reading phonemes required: ${requiredReadingKeys.length}`);
console.log(`Reading phoneme MP3s present: ${requiredReadingKeys.length - missingReading.length}`);
console.log(`Reading phoneme MP3s missing: ${missingReading.length}`);
if (missingReading.length) {
  console.log(`Missing reading phonemes: ${missingReading.join(", ")}`);
  fail("ElevenLabs reading phoneme pack is incomplete.");
}

if (!existsSync(voiceManifestTsPath)) {
  fail("src/game/voiceLineManifest.ts is missing.");
} else {
  const voiceManifestTs = readFileSync(voiceManifestTsPath, "utf8");
  if (!voiceManifestTs.includes(`/audio/voice/nl/${voiceSlug}/`)) {
    fail("Runtime voice manifest is not pointing at the ElevenLabs voice-pack.");
  }
}

if (!existsSync(readingManifestTsPath)) {
  fail("src/game/readingAudioManifest.ts is missing.");
} else {
  const readingManifestTs = readFileSync(readingManifestTsPath, "utf8");
  if (!readingManifestTs.includes(`/audio/reading/nl/${voiceSlug}/phonemes/`)) {
    fail("Runtime reading manifest is not pointing at the ElevenLabs phoneme pack.");
  }
  for (const key of requiredReadingKeys) {
    if (!readingManifestTs.includes(`"${key}"`)) {
      fail(`Runtime reading manifest is missing key "${key}".`);
      break;
    }
  }
}

if (existsSync(legacyHestiaDir)) {
  fail("Legacy Hestia runtime directory still exists.");
}

if (!process.exitCode) {
  console.log("ElevenLabs audio audit passed.");
}
