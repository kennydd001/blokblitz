import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { loadVoiceLineCatalog } from "./load-voice-line-catalog.mjs";

const voiceSlug = process.env.ELEVENLABS_PACK_SLUG ?? "elevenlabs-lily-v3";
const voiceDir = path.resolve("public", "audio", "voice", "nl", voiceSlug);
const readingDir = path.resolve("public", "audio", "reading", "nl", voiceSlug, "phonemes");
const sourceManifestPath = existsSync(path.join(voiceDir, "voice-lines.json"))
  ? path.join(voiceDir, "voice-lines.json")
  : path.resolve("public", "audio", "voice", "nl", "hestia", "voice-lines.json");
const voiceManifestTsPath = path.resolve("src", "game", "voiceLineManifest.ts");
const readingManifestTsPath = path.resolve("src", "game", "readingAudioManifest.ts");
const legacyHestiaDir = path.resolve("public", "audio", "voice", "nl", "hestia");
const currentVoiceCatalog = await loadVoiceLineCatalog();

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

const catalogSlugs = new Map();
for (const line of currentVoiceCatalog) {
  const slug = voiceLineSlug(line.text);
  const existing = catalogSlugs.get(slug);
  if (existing && existing !== line.text) fail(`Current game voice slug collision: "${existing}" and "${line.text}" -> ${slug}`);
  catalogSlugs.set(slug, line.text);
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

  const missingRuntimeLines = currentVoiceCatalog.filter((line) => {
    const slug = voiceLineSlug(line.text);
    return !slugs.has(slug) || !existsSync(path.join(voiceDir, voiceLineFile(slug)));
  });
  console.log(`Current game voice coverage: ${currentVoiceCatalog.length - missingRuntimeLines.length}/${currentVoiceCatalog.length}`);
  if (missingRuntimeLines.length) {
    console.log(`Missing current game voice texts (${missingRuntimeLines.length}):`);
    for (const line of missingRuntimeLines.slice(0, 40)) console.log(`- ${line.text}`);
    if (missingRuntimeLines.length > 40) console.log(`- ... and ${missingRuntimeLines.length - 40} more`);
    fail("ElevenLabs voice-pack does not cover the current game content.");
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
