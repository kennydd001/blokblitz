import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const outDir = path.resolve(process.env.ELEVENLABS_OUT_DIR ?? path.join(".qa-artifacts", "elevenlabs-reading-shootout"));
const sampleSet = process.env.ELEVENLABS_SAMPLE_SET ?? "base";
const modelPreference = (process.env.ELEVENLABS_MODELS ?? "eleven_v3,eleven_multilingual_v2,eleven_flash_v2_5")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);
const maxVoices = Math.max(1, Number.parseInt(process.env.ELEVENLABS_MAX_VOICES ?? "2", 10) || 2);

const baseSampleLines = [
  { id: "control-full-sentence", label: "Control: full sentence", group: "Control", text: "Zoem de klanken samen. Welk plaatje is het?" },
  { id: "m-isolated", label: "m isolated", group: "Isolated continuous", text: "mmm" },
  { id: "s-isolated", label: "s isolated", group: "Isolated continuous", text: "sss" },
  { id: "v-isolated", label: "v isolated", group: "Isolated continuous", text: "vvv" },
  { id: "aa-isolated", label: "aa isolated", group: "Isolated vowels", text: "aa" },
  { id: "ui-isolated", label: "ui isolated", group: "Isolated vowels", text: "ui" },
  { id: "eu-isolated", label: "eu isolated", group: "Isolated vowels", text: "eu" },
  { id: "b-isolated", label: "b isolated", group: "Short consonants", text: "b" },
  { id: "buh-isolated", label: "buh fallback", group: "Short consonants", text: "buh" },
  { id: "k-isolated", label: "k isolated", group: "Short consonants", text: "k" },
  { id: "m-carrier", label: "m in carrier phrase", group: "Carrier phrases", text: "Zeg de klank: mmm." },
  { id: "aa-carrier", label: "aa in carrier phrase", group: "Carrier phrases", text: "Zeg de klank: aa." },
  { id: "maan-raw", label: "maan raw zoem", group: "Zoemend lezen", text: "mmm... aa... nnn... maan" },
  { id: "vis-raw", label: "vis raw zoem", group: "Zoemend lezen", text: "vvv... i... sss... vis" },
  { id: "boek-raw", label: "boek raw zoem", group: "Zoemend lezen", text: "buh... oe... k... boek" },
  { id: "maan-carrier", label: "maan carrier zoem", group: "Zoemend lezen", text: "Zoem: mmm... aa... nnn... maan." }
];

const slowPreciseSettings = {
  stability: 0.62,
  similarity_boost: 0.78,
  style: 0,
  use_speaker_boost: true,
  speed: 0.82
};

const problemPhonemeLines = [
  { id: "control-v3", label: "Control: full sentence", group: "Control", text: "Zoem de klanken samen. Welk plaatje is het?" },
  { id: "aa-raw", label: "aa raw baseline", group: "aa variants", text: "aa" },
  { id: "aa-dot", label: "aa with stop", group: "aa variants", text: "aa.", voiceSettings: slowPreciseSettings, applyTextNormalization: "off" },
  { id: "aa-long", label: "aaa stretched", group: "aa variants", text: "aaa", voiceSettings: slowPreciseSettings, applyTextNormalization: "off" },
  { id: "aa-ipa-token", label: "aa IPA token /a:/", group: "aa variants", text: "AAKLANK", voiceSettings: slowPreciseSettings, applyTextNormalization: "off", pronunciationDictionary: true },
  { id: "aa-carrier-maan", label: "aa carrier: maan", group: "aa variants", text: "Zeg de aa-klank zoals in maan.", voiceSettings: slowPreciseSettings },
  { id: "aa-in-zoem-maan", label: "aa inside zoem word", group: "aa variants", text: "mmm... aa... nnn... maan", voiceSettings: slowPreciseSettings },
  { id: "ui-raw", label: "ui raw baseline", group: "ui variants", text: "ui" },
  { id: "ui-dot", label: "ui with stop", group: "ui variants", text: "ui.", voiceSettings: slowPreciseSettings, applyTextNormalization: "off" },
  { id: "ui-word-onion", label: "ui as Dutch word", group: "ui variants", text: "ui", voiceSettings: slowPreciseSettings },
  { id: "ui-ipa-token-oe-y", label: "ui IPA token /oe-y/", group: "ui variants", text: "UIKLANK", voiceSettings: slowPreciseSettings, applyTextNormalization: "off", pronunciationDictionary: true },
  { id: "ui-ipa-token-oe-y-short", label: "ui IPA token /oe-i/", group: "ui variants", text: "UI2KLANK", voiceSettings: slowPreciseSettings, applyTextNormalization: "off", pronunciationDictionary: true },
  { id: "ui-carrier-huis", label: "ui carrier: huis", group: "ui variants", text: "Zeg de ui-klank zoals in huis.", voiceSettings: slowPreciseSettings },
  { id: "ui-in-zoem-huis", label: "ui inside zoem word", group: "ui variants", text: "hhh... ui... sss... huis", voiceSettings: slowPreciseSettings },
  { id: "eu-raw", label: "eu raw baseline", group: "eu variants", text: "eu" },
  { id: "eu-dot", label: "eu with stop", group: "eu variants", text: "eu.", voiceSettings: slowPreciseSettings, applyTextNormalization: "off" },
  { id: "eu-ipa-token-long", label: "eu IPA token /oe:/", group: "eu variants", text: "EUKLANK", voiceSettings: slowPreciseSettings, applyTextNormalization: "off", pronunciationDictionary: true },
  { id: "eu-ipa-token-short", label: "eu IPA token /oe/", group: "eu variants", text: "EU2KLANK", voiceSettings: slowPreciseSettings, applyTextNormalization: "off", pronunciationDictionary: true },
  { id: "eu-carrier-neus", label: "eu carrier: neus", group: "eu variants", text: "Zeg de eu-klank zoals in neus.", voiceSettings: slowPreciseSettings },
  { id: "eu-in-zoem-neus", label: "eu inside zoem word", group: "eu variants", text: "nnn... eu... sss... neus", voiceSettings: slowPreciseSettings },
  { id: "b-raw", label: "b raw baseline", group: "b variants", text: "b" },
  { id: "buh-good", label: "buh accepted fallback", group: "b variants", text: "buh", voiceSettings: slowPreciseSettings, applyTextNormalization: "off" },
  { id: "buh-dot", label: "buh with stop", group: "b variants", text: "buh.", voiceSettings: slowPreciseSettings, applyTextNormalization: "off" },
  { id: "bu-short", label: "bu short spelling", group: "b variants", text: "bu", voiceSettings: slowPreciseSettings, applyTextNormalization: "off" },
  { id: "b-ipa-token-buh", label: "b IPA token /buh/", group: "b variants", text: "BKLANK", voiceSettings: slowPreciseSettings, applyTextNormalization: "off", pronunciationDictionary: true },
  { id: "b-in-zoem-boek", label: "buh inside zoem word", group: "b variants", text: "buh... oe... k... boek", voiceSettings: slowPreciseSettings }
];

const finalCarrierLines = [
  { id: "control-v3", label: "Control: full sentence", group: "Control", text: "Zoem de klanken samen. Welk plaatje is het?" },
  { id: "aa-known-good", label: "aa known good carrier", group: "aa short carriers", text: "Zeg de aa-klank zoals in maan.", voiceSettings: slowPreciseSettings },
  { id: "aa-zeg", label: "Zeg: aa", group: "aa short carriers", text: "Zeg: aa.", voiceSettings: slowPreciseSettings },
  { id: "aa-klank", label: "aa-klank", group: "aa short carriers", text: "aa-klank", voiceSettings: slowPreciseSettings },
  { id: "aa-de-klank", label: "de aa-klank", group: "aa short carriers", text: "de aa-klank", voiceSettings: slowPreciseSettings },
  { id: "aa-zoals-maan", label: "aa zoals in maan", group: "aa short carriers", text: "aa zoals in maan", voiceSettings: slowPreciseSettings },
  { id: "aa-van-maan", label: "aa van maan", group: "aa short carriers", text: "aa van maan", voiceSettings: slowPreciseSettings },
  { id: "aa-chain-dot", label: "maan chain with dots", group: "zoem chain candidates", text: "mmm. aa zoals in maan. nnn. maan.", voiceSettings: slowPreciseSettings },
  { id: "aa-chain-comma", label: "maan chain with commas", group: "zoem chain candidates", text: "mmm, aa zoals in maan, nnn, maan.", voiceSettings: slowPreciseSettings },

  { id: "ui-known-good", label: "ui known good carrier", group: "ui short carriers", text: "Zeg de ui-klank zoals in huis.", voiceSettings: slowPreciseSettings },
  { id: "ui-zeg", label: "Zeg: ui", group: "ui short carriers", text: "Zeg: ui.", voiceSettings: slowPreciseSettings },
  { id: "ui-klank", label: "ui-klank", group: "ui short carriers", text: "ui-klank", voiceSettings: slowPreciseSettings },
  { id: "ui-de-klank", label: "de ui-klank", group: "ui short carriers", text: "de ui-klank", voiceSettings: slowPreciseSettings },
  { id: "ui-zoals-huis", label: "ui zoals in huis", group: "ui short carriers", text: "ui zoals in huis", voiceSettings: slowPreciseSettings },
  { id: "ui-van-huis", label: "ui van huis", group: "ui short carriers", text: "ui van huis", voiceSettings: slowPreciseSettings },
  { id: "ui-chain-dot", label: "huis chain with dots", group: "zoem chain candidates", text: "hhh. ui zoals in huis. sss. huis.", voiceSettings: slowPreciseSettings },
  { id: "ui-chain-comma", label: "huis chain with commas", group: "zoem chain candidates", text: "hhh, ui zoals in huis, sss, huis.", voiceSettings: slowPreciseSettings },

  { id: "eu-known-good", label: "eu known good carrier", group: "eu short carriers", text: "Zeg de eu-klank zoals in neus.", voiceSettings: slowPreciseSettings },
  { id: "eu-zeg", label: "Zeg: eu", group: "eu short carriers", text: "Zeg: eu.", voiceSettings: slowPreciseSettings },
  { id: "eu-klank", label: "eu-klank", group: "eu short carriers", text: "eu-klank", voiceSettings: slowPreciseSettings },
  { id: "eu-de-klank", label: "de eu-klank", group: "eu short carriers", text: "de eu-klank", voiceSettings: slowPreciseSettings },
  { id: "eu-zoals-neus", label: "eu zoals in neus", group: "eu short carriers", text: "eu zoals in neus", voiceSettings: slowPreciseSettings },
  { id: "eu-van-neus", label: "eu van neus", group: "eu short carriers", text: "eu van neus", voiceSettings: slowPreciseSettings },
  { id: "eu-chain-dot", label: "neus chain with dots", group: "zoem chain candidates", text: "nnn. eu zoals in neus. sss. neus.", voiceSettings: slowPreciseSettings },
  { id: "eu-chain-comma", label: "neus chain with commas", group: "zoem chain candidates", text: "nnn, eu zoals in neus, sss, neus.", voiceSettings: slowPreciseSettings },

  { id: "buh-known-good", label: "buh known good", group: "b candidates", text: "buh", voiceSettings: slowPreciseSettings, applyTextNormalization: "off" },
  { id: "buh-dot-known-good", label: "buh dot known good", group: "b candidates", text: "buh.", voiceSettings: slowPreciseSettings, applyTextNormalization: "off" },
  { id: "boek-chain-dot", label: "boek chain with dots", group: "zoem chain candidates", text: "buh. oe. kuh. boek.", voiceSettings: slowPreciseSettings },
  { id: "boek-chain-comma", label: "boek chain with commas", group: "zoem chain candidates", text: "buh, oe, kuh, boek.", voiceSettings: slowPreciseSettings }
];

const sampleSets = {
  base: baseSampleLines,
  "problem-phonemes-v2": problemPhonemeLines,
  "problem-phonemes-v3": finalCarrierLines
};

const sampleLines = sampleSets[sampleSet];
if (!sampleLines) {
  console.error(`Unknown ELEVENLABS_SAMPLE_SET "${sampleSet}". Available: ${Object.keys(sampleSets).join(", ")}`);
  process.exit(1);
}

const pronunciationDictionaryRules = [
  { string_to_replace: "AAKLANK", type: "phoneme", alphabet: "ipa", phoneme: "aː" },
  { string_to_replace: "UIKLANK", type: "phoneme", alphabet: "ipa", phoneme: "œy" },
  { string_to_replace: "UI2KLANK", type: "phoneme", alphabet: "ipa", phoneme: "œʏ" },
  { string_to_replace: "EUKLANK", type: "phoneme", alphabet: "ipa", phoneme: "øː" },
  { string_to_replace: "EU2KLANK", type: "phoneme", alphabet: "ipa", phoneme: "ø" },
  { string_to_replace: "BKLANK", type: "phoneme", alphabet: "ipa", phoneme: "bə" }
];

function getKey(...names) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

function safeName(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function jsonForHtmlScript(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

async function checkedFetch(url, options, label) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`${label} failed with HTTP ${response.status}: ${body.slice(0, 500)}`);
  }
  return response;
}

async function listModels(apiKey) {
  const response = await checkedFetch(
    "https://api.elevenlabs.io/v1/models",
    { headers: { "xi-api-key": apiKey } },
    "ElevenLabs model list"
  );
  const models = await response.json();
  const byId = new Map(models.map((model) => [model.model_id, model]));
  return modelPreference
    .map((modelId) => byId.get(modelId))
    .filter((model) => model?.can_do_text_to_speech)
    .map((model) => ({
      id: model.model_id,
      name: model.name ?? model.model_id,
      supportsDutch: (model.languages ?? []).some((language) => language.language_id === "nl" || /dutch/i.test(language.name ?? "")),
      description: model.description ?? ""
    }));
}

function voiceScore(voice) {
  const blob = [
    voice.name,
    voice.description,
    voice.category,
    JSON.stringify(voice.labels ?? {}),
    JSON.stringify(voice.verified_languages ?? []),
    JSON.stringify(voice.sharing?.labels ?? {})
  ]
    .join(" ")
    .toLowerCase();
  let score = 0;
  if (/dutch|nederlands|netherlands|\bnl\b/.test(blob)) score += 10;
  if (/female|feminine|vrouw/.test(blob)) score += 5;
  if (/warm|friendly|kind|clear|calm|educational|studio/.test(blob)) score += 2;
  if (voice.is_legacy) score -= 2;
  if (voice.is_owner) score += 1;
  return score;
}

async function listVoiceSearch(apiKey, search) {
  const url = new URL("https://api.elevenlabs.io/v2/voices");
  url.searchParams.set("search", search);
  url.searchParams.set("page_size", "50");
  const response = await checkedFetch(url, { headers: { "xi-api-key": apiKey } }, `ElevenLabs voice search "${search}"`);
  const data = await response.json();
  return data.voices ?? [];
}

async function getVoice(apiKey, voiceId) {
  try {
    const response = await checkedFetch(
      `https://api.elevenlabs.io/v1/voices/${voiceId}`,
      { headers: { "xi-api-key": apiKey } },
      `ElevenLabs voice ${voiceId}`
    );
    return await response.json();
  } catch {
    return { voice_id: voiceId, name: voiceId, description: "Provided via ELEVENLABS_VOICE_IDS", labels: {} };
  }
}

async function listVoices(apiKey) {
  if (process.env.ELEVENLABS_VOICE_IDS?.trim()) {
    const voiceIds = process.env.ELEVENLABS_VOICE_IDS.split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    return Promise.all(voiceIds.map((voiceId) => getVoice(apiKey, voiceId)));
  }

  const searches = ["Dutch female", "Nederlands vrouw", "Dutch", "nl", "female"];
  const found = new Map();
  for (const search of searches) {
    try {
      for (const voice of await listVoiceSearch(apiKey, search)) {
        if (voice.voice_id) found.set(voice.voice_id, voice);
      }
    } catch (error) {
      console.warn(error instanceof Error ? error.message : String(error));
    }
  }

  return [...found.values()]
    .sort((a, b) => voiceScore(b) - voiceScore(a) || String(a.name).localeCompare(String(b.name)))
    .slice(0, maxVoices);
}

async function synthesize(apiKey, voice, model, line, pronunciationLocator) {
  const url = new URL(`https://api.elevenlabs.io/v1/text-to-speech/${voice.voice_id}`);
  url.searchParams.set("output_format", "mp3_44100_128");
  const pronunciationLocators =
    line.pronunciationDictionary && pronunciationLocator
      ? [
          {
            pronunciation_dictionary_id: pronunciationLocator.pronunciation_dictionary_id,
            version_id: pronunciationLocator.version_id
          }
        ]
      : undefined;
  const voiceSettings = {
      stability: 0.48,
      similarity_boost: 0.78,
      style: 0.18,
      use_speaker_boost: true,
      speed: 0.9
    };
  const baseBody = {
    text: line.text,
    model_id: model.id,
    voice_settings: { ...voiceSettings, ...(line.voiceSettings ?? {}) },
    seed: line.seed ?? 11611
  };
  if (model.id !== "eleven_multilingual_v2") baseBody.language_code = "nl";
  if (line.previousText) baseBody.previous_text = line.previousText;
  if (line.nextText) baseBody.next_text = line.nextText;
  if (line.applyTextNormalization) baseBody.apply_text_normalization = line.applyTextNormalization;
  if (pronunciationLocators) baseBody.pronunciation_dictionary_locators = pronunciationLocators;

  const attempts = [
    baseBody,
    { ...baseBody, language_code: undefined },
    {
      text: line.text,
      model_id: model.id,
      ...(model.id === "eleven_multilingual_v2" ? {} : { language_code: "nl" }),
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        use_speaker_boost: true,
        ...(line.voiceSettings ?? {})
      },
      seed: line.seed ?? 11611,
      ...(line.previousText ? { previous_text: line.previousText } : {}),
      ...(line.nextText ? { next_text: line.nextText } : {}),
      ...(line.applyTextNormalization ? { apply_text_normalization: line.applyTextNormalization } : {}),
      ...(pronunciationLocators ? { pronunciation_dictionary_locators: pronunciationLocators } : {})
    }
  ];

  let lastError;
  for (const body of attempts) {
    const cleanBody = JSON.parse(JSON.stringify(body));
    try {
      const response = await checkedFetch(
        url,
        {
          method: "POST",
          headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(cleanBody)
        },
        `ElevenLabs ${model.id}/${voice.name}/${line.id}`
      );
      return {
        bytes: Buffer.from(await response.arrayBuffer()),
        contentType: response.headers.get("content-type") ?? "audio/mpeg",
        request: cleanBody
      };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function isPaidLibraryVoiceError(error) {
  return error instanceof Error && /paid_plan_required|library voices/i.test(error.message);
}

async function createPronunciationDictionary(apiKey) {
  const response = await checkedFetch(
    "https://api.elevenlabs.io/v1/pronunciation-dictionaries/add-from-rules",
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: `BlokBlitz phoneme QA ${new Date().toISOString()}`,
        description: "Temporary QA dictionary for Dutch first-grade phoneme TTS samples.",
        rules: pronunciationDictionaryRules
      })
    },
    "ElevenLabs pronunciation dictionary"
  );
  const data = await response.json();
  return {
    pronunciation_dictionary_id: data.id,
    version_id: data.version_id,
    archived: false
  };
}

async function archivePronunciationDictionary(apiKey, locator) {
  if (!locator?.pronunciation_dictionary_id) return;
  try {
    await checkedFetch(
      `https://api.elevenlabs.io/v1/pronunciation-dictionaries/${locator.pronunciation_dictionary_id}`,
      {
        method: "PATCH",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ archived: true })
      },
      "Archive ElevenLabs pronunciation dictionary"
    );
    locator.archived = true;
  } catch (error) {
    console.warn(error instanceof Error ? error.message : String(error));
  }
}

async function writeAudio(model, voice, line, bytes) {
  const fileName = `elevenlabs-${safeName(model.id)}-${safeName(voice.name)}-${safeName(line.id)}.mp3`;
  await writeFile(path.join(outDir, fileName), bytes);
  return fileName;
}

function renderHtml(rows, skipped, voices, models) {
  const grouped = new Map();
  for (const row of rows) {
    const key = `${row.modelName} / ${row.voice}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  }

  const skippedHtml = skipped.length
    ? `<section><h2>Skipped</h2><ul>${skipped.map((item) => `<li><strong>${escapeHtml(item.label)}</strong>: ${escapeHtml(item.reason)}</li>`).join("")}</ul></section>`
    : "";

  const voiceHtml = voices
    .map((voice) => `<li><strong>${escapeHtml(voice.name)}</strong> <code>${escapeHtml(voice.voice_id)}</code> score ${voiceScore(voice)}<br><small>${escapeHtml(voice.description ?? JSON.stringify(voice.labels ?? {}))}</small></li>`)
    .join("");

  const modelHtml = models
    .map((model) => `<li><strong>${escapeHtml(model.name)}</strong> <code>${escapeHtml(model.id)}</code>${model.supportsDutch ? " - Dutch listed" : ""}</li>`)
    .join("");

  const sections = [...grouped.entries()]
    .map(([key, items]) => {
      const rowsHtml = items
        .map((item) => {
          const rowId = item.fileName;
          return `<tr data-row="${escapeHtml(rowId)}">
            <td>${escapeHtml(item.group)}</td>
            <td>${escapeHtml(item.label)}</td>
            <td><code>${escapeHtml(item.text)}</code></td>
            <td><audio controls preload="none" src="./${escapeHtml(item.fileName)}"></audio></td>
            <td>
              <div class="rating-buttons" data-row="${escapeHtml(rowId)}" aria-label="Score ${escapeHtml(item.label)}">
                <button type="button" data-rating="++">++</button>
                <button type="button" data-rating="+">+</button>
                <button type="button" data-rating="-">-</button>
                <button type="button" data-rating="--">--</button>
              </div>
            </td>
            <td>${item.bytes}</td>
          </tr>`;
        })
        .join("\n");
      return `<section>
        <h2>${escapeHtml(key)}</h2>
        <table>
          <thead><tr><th>Group</th><th>Sample</th><th>Text</th><th>Audio</th><th>Score</th><th>Bytes</th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </section>`;
    })
    .join("\n");

  const ratingRows = rows.map((item) => ({
    id: item.fileName,
    provider: item.provider,
    model: item.model,
    modelName: item.modelName,
    voice: item.voice,
    voiceId: item.voiceId,
    group: item.group,
    label: item.label,
    text: item.text,
    fileName: item.fileName,
    bytes: item.bytes
  }));

  return `<!doctype html>
<html lang="nl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ElevenLabs Reading Audio Shootout</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 24px; background: #f6f8fb; color: #142033; }
    h1 { margin-bottom: 4px; }
    section { margin: 22px 0; padding: 16px; border: 1px solid #d7e1ec; border-radius: 8px; background: #fff; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; border-top: 1px solid #e7eef6; vertical-align: top; text-align: left; }
    audio { width: 260px; max-width: 100%; }
    code { white-space: normal; }
    .criteria li { margin: 4px 0; }
    .rating-buttons { display: grid; grid-template-columns: repeat(2, minmax(42px, 1fr)); gap: 6px; min-width: 96px; }
    .rating-buttons button, .rating-tools button {
      border: 1px solid #b8c6d8;
      border-radius: 6px;
      background: #fff;
      color: #142033;
      font: inherit;
      font-weight: 700;
      padding: 7px 8px;
      cursor: pointer;
    }
    .rating-buttons button:hover, .rating-tools button:hover { border-color: #53708f; background: #f1f6fb; }
    .rating-buttons button.active[data-rating="++"] { background: #0f7a45; border-color: #0f7a45; color: #fff; }
    .rating-buttons button.active[data-rating="+"] { background: #72b043; border-color: #72b043; color: #10220c; }
    .rating-buttons button.active[data-rating="-"] { background: #f1b24a; border-color: #d99422; color: #2b1b02; }
    .rating-buttons button.active[data-rating="--"] { background: #c93737; border-color: #c93737; color: #fff; }
    .rating-tools { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin: 10px 0; }
    #rating-summary { font-weight: 700; }
    #rating-json { width: 100%; min-height: 160px; box-sizing: border-box; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 12px; }
  </style>
</head>
<body>
  <h1>ElevenLabs Reading Audio Shootout</h1>
  <p>QA-only samples for Dutch first-grade reading audio. Do not ship this folder directly.</p>
  <p><strong>Sample set:</strong> <code>${escapeHtml(sampleSet)}</code></p>
  <section>
    <h2>Listen for</h2>
    <ul class="criteria">
      <li>Does the clip say the phoneme, not the letter name?</li>
      <li>Are short consonants short enough for beginning readers?</li>
      <li>Do vowel digraphs such as <code>ui</code> and <code>eu</code> sound Dutch?</li>
      <li>Does zoemend lezen stay smooth without adding extra words?</li>
      <li>Is the full-sentence control still warm and natural?</li>
    </ul>
  </section>
  <section>
    <h2>Ratings</h2>
    <p>Klik per clip op <strong>++</strong>, <strong>+</strong>, <strong>-</strong> of <strong>--</strong>. De scores blijven lokaal bewaard in deze browser.</p>
    <div class="rating-tools">
      <span id="rating-summary">0/${rows.length} rated</span>
      <button type="button" id="copy-ratings">Copy JSON</button>
      <button type="button" id="download-ratings">Download JSON</button>
      <button type="button" id="save-ratings">Save to Codex</button>
      <button type="button" id="clear-ratings">Clear</button>
      <span id="save-status"></span>
    </div>
    <textarea id="rating-json" spellcheck="false" readonly></textarea>
  </section>
  <section>
    <h2>Selected voices</h2>
    <ul>${voiceHtml}</ul>
  </section>
  <section>
    <h2>Selected models</h2>
    <ul>${modelHtml}</ul>
  </section>
  ${skippedHtml}
  ${sections}
  <script type="application/json" id="rating-row-data">${jsonForHtmlScript(ratingRows)}</script>
  <script>
    (() => {
      const rows = JSON.parse(document.getElementById("rating-row-data").textContent);
      const storageKey = "blokblitz:tts-ratings:" + location.pathname;
      const buttons = [...document.querySelectorAll(".rating-buttons button")];
      const summary = document.getElementById("rating-summary");
      const output = document.getElementById("rating-json");
      const saveStatus = document.getElementById("save-status");
      const byId = new Map(rows.map((row) => [row.id, row]));
      let saveTimer = 0;

      function readRatings() {
        try {
          return JSON.parse(localStorage.getItem(storageKey) || "{}");
        } catch {
          return {};
        }
      }

      function writeRatings(ratings) {
        localStorage.setItem(storageKey, JSON.stringify(ratings));
      }

      function buildExport(ratings) {
        const rated = Object.entries(ratings)
          .map(([id, value]) => ({ ...byId.get(id), rating: value.rating, ratedAt: value.ratedAt }))
          .filter((item) => item.id);
        const counts = rated.reduce((acc, item) => {
          acc[item.rating] = (acc[item.rating] || 0) + 1;
          return acc;
        }, {});
        return {
          page: location.pathname,
          sampleSet: ${JSON.stringify(sampleSet)},
          exportedAt: new Date().toISOString(),
          totalRows: rows.length,
          ratedRows: rated.length,
          counts,
          ratings: rated
        };
      }

      function render() {
        const ratings = readRatings();
        buttons.forEach((button) => {
          const row = button.parentElement.dataset.row;
          button.classList.toggle("active", ratings[row]?.rating === button.dataset.rating);
        });
        const exported = buildExport(ratings);
        summary.textContent = exported.ratedRows + "/" + exported.totalRows + " rated";
        output.value = JSON.stringify(exported, null, 2);
      }

      async function saveToCodex() {
        const payload = JSON.parse(output.value || "{}");
        saveStatus.textContent = "Saving...";
        try {
          const response = await fetch("http://127.0.0.1:5391/ratings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          if (!response.ok) throw new Error("HTTP " + response.status);
          saveStatus.textContent = "Saved to .qa-artifacts/tts-ratings/latest.json";
        } catch {
          saveStatus.textContent = "Start: npm.cmd run voice:ratings-server";
        }
      }

      function scheduleSave() {
        window.clearTimeout(saveTimer);
        saveTimer = window.setTimeout(saveToCodex, 300);
      }

      buttons.forEach((button) => {
        button.addEventListener("click", () => {
          const row = button.parentElement.dataset.row;
          const ratings = readRatings();
          const next = button.dataset.rating;
          if (ratings[row]?.rating === next) delete ratings[row];
          else ratings[row] = { rating: next, ratedAt: new Date().toISOString() };
          writeRatings(ratings);
          render();
          scheduleSave();
        });
      });

      document.getElementById("copy-ratings").addEventListener("click", async () => {
        output.select();
        try {
          await navigator.clipboard.writeText(output.value);
        } catch {
          document.execCommand("copy");
        }
      });

      document.getElementById("download-ratings").addEventListener("click", () => {
        const blob = new Blob([output.value], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "elevenlabs-reading-ratings.json";
        a.click();
        URL.revokeObjectURL(a.href);
      });

      document.getElementById("save-ratings").addEventListener("click", saveToCodex);

      document.getElementById("clear-ratings").addEventListener("click", () => {
        if (!confirm("Alle scores op deze pagina wissen?")) return;
        localStorage.removeItem(storageKey);
        render();
      });

      render();
      scheduleSave();
    })();
  </script>
</body>
</html>`;
}

const apiKey = getKey("ELEVENLABS_API_KEY", "XI_API_KEY");
if (process.env.ELEVENLABS_RENDER_ONLY === "1") {
  await mkdir(outDir, { recursive: true });
  const existing = JSON.parse(await readFile(path.join(outDir, "results.json"), "utf8"));
  await writeFile(path.join(outDir, "index.html"), renderHtml(existing.rows ?? [], existing.skipped ?? [], existing.voices ?? [], existing.models ?? []));
  console.log(`Rendered ratings HTML from ${path.join(outDir, "results.json")}`);
  process.exit(0);
}

if (!apiKey) {
  console.error("Missing ELEVENLABS_API_KEY.");
  process.exit(1);
}

await mkdir(outDir, { recursive: true });
const models = await listModels(apiKey);
const voices = await listVoices(apiKey);
if (models.length === 0) {
  console.error(`None of the requested models are available: ${modelPreference.join(", ")}`);
  process.exit(1);
}
if (voices.length === 0) {
  console.error("No ElevenLabs voices found. Set ELEVENLABS_VOICE_IDS=voiceId1,voiceId2 to test specific voices.");
  process.exit(1);
}

const rows = [];
const skipped = [];
let pronunciationLocator;
if (sampleLines.some((line) => line.pronunciationDictionary)) {
  try {
    pronunciationLocator = await createPronunciationDictionary(apiKey);
    console.log(`Created temporary pronunciation dictionary ${pronunciationLocator.pronunciation_dictionary_id}`);
  } catch (error) {
    skipped.push({
      label: "pronunciation dictionary",
      reason: error instanceof Error ? error.message : String(error)
    });
  }
}

for (const voice of voices) {
  let blockedVoice = false;
  for (const model of models) {
    if (blockedVoice) break;
    for (const line of sampleLines) {
      if (line.pronunciationDictionary && !pronunciationLocator) {
        skipped.push({
          label: `${model.id} / ${voice.name} / ${line.id}`,
          reason: "No pronunciation dictionary locator was available."
        });
        continue;
      }
      try {
        const result = await synthesize(apiKey, voice, model, line, pronunciationLocator);
        const fileName = await writeAudio(model, voice, line, result.bytes);
        rows.push({
          provider: "ElevenLabs",
          model: model.id,
          modelName: model.name,
          voice: voice.name,
          voiceId: voice.voice_id,
          group: line.group,
          label: line.label,
          text: line.text,
          fileName,
          bytes: result.bytes.length,
          contentType: result.contentType
        });
        console.log(`${model.id} / ${voice.name} / ${line.id}: ${fileName}`);
      } catch (error) {
        if (isPaidLibraryVoiceError(error)) {
          skipped.push({
            label: `${voice.name}`,
            reason: "ElevenLabs refused this library/professional voice for the current account plan."
          });
          blockedVoice = true;
          break;
        }
        skipped.push({
          label: `${model.id} / ${voice.name} / ${line.id}`,
          reason: error instanceof Error ? error.message : String(error)
        });
        console.warn(`Skipped ${model.id} / ${voice.name} / ${line.id}`);
      }
    }
  }
}

if (pronunciationLocator) await archivePronunciationDictionary(apiKey, pronunciationLocator);

await writeFile(path.join(outDir, "index.html"), renderHtml(rows, skipped, voices, models));
await writeFile(
  path.join(outDir, "results.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      models,
      voices: voices.map((voice) => ({
        voice_id: voice.voice_id,
        name: voice.name,
        description: voice.description,
        labels: voice.labels,
        score: voiceScore(voice)
      })),
      sampleLines,
      pronunciationDictionary: pronunciationLocator
        ? {
            id: pronunciationLocator.pronunciation_dictionary_id,
            version_id: pronunciationLocator.version_id,
            archived: pronunciationLocator.archived
          }
        : null,
      rows,
      skipped
    },
    null,
    2
  )
);

console.log(`Wrote ${rows.length} ElevenLabs clips to ${outDir}`);
if (skipped.length) console.log(`Skipped ${skipped.length} samples; see results.json.`);
