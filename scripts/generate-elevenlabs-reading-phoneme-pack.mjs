import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const apiKey = process.env.ELEVENLABS_API_KEY?.trim() ?? process.env.XI_API_KEY?.trim();
if (!apiKey) {
  console.error("ELEVENLABS_API_KEY or XI_API_KEY is required.");
  process.exit(1);
}

const model = process.env.ELEVENLABS_MODEL ?? "eleven_v3";
const voiceId = process.env.ELEVENLABS_VOICE_ID ?? "pFZP5JQG7iQjIQuC4Bku";
const voice = process.env.ELEVENLABS_VOICE_NAME ?? "Lily - Velvety Actress";
const voiceSlug = process.env.ELEVENLABS_PACK_SLUG ?? "elevenlabs-lily-v3";
const baseDir = path.resolve("public", "audio", "reading", "nl", voiceSlug, "phonemes");
const manifestPath = path.join(baseDir, "phonemes.json");
const tsManifestPath = path.resolve("src", "game", "readingAudioManifest.ts");
const force = process.argv.includes("--force");

const defaultSettings = {
  stability: Number(process.env.ELEVENLABS_STABILITY ?? 0.62),
  similarity_boost: Number(process.env.ELEVENLABS_SIMILARITY ?? 0.78),
  style: Number(process.env.ELEVENLABS_STYLE ?? 0),
  use_speaker_boost: process.env.ELEVENLABS_SPEAKER_BOOST !== "false",
  speed: Number(process.env.ELEVENLABS_SPEED ?? 0.82)
};
const seed = Number(process.env.ELEVENLABS_SEED ?? 11611);

const readingPhonemes = [
  { key: "m", display: "m", spokenText: "mmm", durationMs: 520 },
  { key: "s", display: "s", spokenText: "sss", durationMs: 520 },
  { key: "v", display: "v", spokenText: "vvv", durationMs: 500 },
  { key: "r", display: "r", spokenText: "rrr", durationMs: 480 },
  { key: "n", display: "n", spokenText: "nnn", durationMs: 500 },
  { key: "z", display: "z", spokenText: "zzz", durationMs: 500 },
  { key: "h", display: "h", spokenText: "hhh", durationMs: 420 },
  { key: "l", display: "l", spokenText: "lll", durationMs: 480 },
  { key: "f", display: "f", spokenText: "fff", durationMs: 500 },
  { key: "w", display: "w", spokenText: "www", durationMs: 470 },
  { key: "b", display: "b", spokenText: "buh", durationMs: 230, applyTextNormalization: "off" },
  { key: "d", display: "d", spokenText: "duh", durationMs: 230, applyTextNormalization: "off" },
  { key: "k", display: "k", spokenText: "kuh", durationMs: 230, applyTextNormalization: "off" },
  { key: "p", display: "p", spokenText: "puh", durationMs: 230, applyTextNormalization: "off" },
  { key: "t", display: "t", spokenText: "tuh", durationMs: 230, applyTextNormalization: "off" },
  { key: "a", display: "a", spokenText: "a zoals in kat", durationMs: 500 },
  { key: "e", display: "e", spokenText: "e zoals in ster", durationMs: 420 },
  { key: "i", display: "i", spokenText: "i zoals in vis", durationMs: 420 },
  { key: "o", display: "o", spokenText: "o zoals in zon", durationMs: 450 },
  { key: "u", display: "u", spokenText: "u zoals in bus", durationMs: 420 },
  { key: "aa", display: "aa", spokenText: "aa zoals in maan", durationMs: 560 },
  { key: "ee", display: "ee", spokenText: "ee zoals in twee", durationMs: 540 },
  { key: "oo", display: "oo", spokenText: "oo zoals in boom", durationMs: 560 },
  { key: "uu", display: "uu", spokenText: "uu zoals in muur", durationMs: 540 },
  { key: "oe", display: "oe", spokenText: "oe zoals in boek", durationMs: 540 },
  { key: "ie", display: "ie", spokenText: "ie zoals in fiets", durationMs: 540 },
  { key: "eu", display: "eu", spokenText: "eu zoals in neus", durationMs: 540 },
  { key: "ui", display: "ui", spokenText: "ui zoals in huis", durationMs: 560 },
  { key: "ei", display: "ei", spokenText: "ei zoals in geit", durationMs: 540 },
  { key: "ij", display: "ij", spokenText: "ij zoals in ijs", durationMs: 540 },
  { key: "ou", display: "ou", spokenText: "ou zoals in hout", durationMs: 540 },
  { key: "au", display: "au", spokenText: "au zoals in pauw", durationMs: 540 }
];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fileFor(key) {
  return `${key.replace(/[^a-z0-9]+/g, "-")}.mp3`;
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
    voice_settings: defaultSettings,
    seed
  };
  if (line.applyTextNormalization) body.apply_text_normalization = line.applyTextNormalization;
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
    `ElevenLabs reading phoneme ${line.key}`
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
  const entries = lines
    .map((line) => `  "${line.key}": "${fileFor(line.key)}"`)
    .sort()
    .join(",\n");
  const content = `// Generated by scripts/generate-elevenlabs-reading-phoneme-pack.mjs. Do not edit by hand.
// These are isolated phonemes; whole-word reading uses local Lily clips through VoiceManager.

export const READING_PHONEME_BASE_PATH = "/audio/reading/nl/${voiceSlug}/phonemes/";

export const READING_PHONEME_FILES: Record<string, string> = {
${entries}
};

export const READING_PHONEME_KEYS = new Set<string>(Object.keys(READING_PHONEME_FILES));
`;
  await writeFile(tsManifestPath, content);
}

await mkdir(baseDir, { recursive: true });

let generated = 0;
let skipped = 0;
for (const line of readingPhonemes) {
  const filePath = path.join(baseDir, fileFor(line.key));
  if (!force && existsSync(filePath)) {
    skipped += 1;
    continue;
  }
  const audio = await synthesize(line);
  await writeFile(filePath, audio);
  generated += 1;
  console.log(`${fileFor(line.key)} (${audio.length} bytes)`);
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
      scope: "isolated reading phonemes only; whole-word reading uses the local Lily sentence pack",
      voiceSettings: defaultSettings,
      seed,
      lineCount: readingPhonemes.length,
      phonemes: readingPhonemes.map((line) => ({
        ...line,
        file: fileFor(line.key)
      }))
    },
    null,
    2
  )
);
await writeTsManifest(readingPhonemes);

console.log(`ElevenLabs reading phoneme pack complete: ${readingPhonemes.length} lines, ${generated} generated, ${skipped} skipped.`);
