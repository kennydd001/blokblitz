import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const outDir = path.resolve(".qa-artifacts", "tts-provider-shootout");
const selectedProviders = new Set(
  (process.env.TTS_PROVIDERS ?? "deepgram,openai,elevenlabs,cartesia")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
);

const sampleLines = [
  {
    id: "reward",
    label: "Reward",
    text: "Goed zo! Je hebt de vijf gevonden."
  },
  {
    id: "instruction",
    label: "Instruction",
    text: "Pak de vijf. Kijk eerst naar het groepje."
  },
  {
    id: "scaffold",
    label: "Scaffold",
    text: "Bijna. Eerst vijf, dan de extra blokjes."
  },
  {
    id: "split",
    label: "Split fact",
    text: "Vijf is drie en twee. Drie en twee maken samen vijf."
  },
  {
    id: "reading",
    label: "Reading blend",
    text: "Zing de klanken aan elkaar: mmm, aa, n. Maan."
  }
];

const providerDocs = {
  deepgram: "https://developers.deepgram.com/docs/tts-models",
  openai: "https://developers.openai.com/api/docs/guides/text-to-speech",
  elevenlabs: "https://elevenlabs.io/docs/overview/models",
  cartesia: "https://docs.cartesia.ai/build-with-cartesia/tts-models/latest"
};

function safeName(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96);
}

function getKey(...names) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

async function writeAudio(provider, model, voice, line, bytes, extension = "mp3") {
  const fileName = `${safeName(provider)}-${safeName(model)}-${safeName(voice)}-${line.id}.${extension}`;
  await writeFile(path.join(outDir, fileName), bytes);
  return fileName;
}

async function checkedFetch(url, options, label) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`${label} failed with HTTP ${response.status}: ${body.slice(0, 500)}`);
  }
  return response;
}

async function runDeepgram() {
  const apiKey = getKey("DEEPGRAM_API_KEY");
  if (!apiKey) return { skipped: true, reason: "Missing DEEPGRAM_API_KEY" };

  const voices = [
    ["aura-2-beatrix-nl", "Beatrix", "feminine, cheerful, enthusiastic, friendly, warm"],
    ["aura-2-daphne-nl", "Daphne", "feminine, calm, clear, confident, smooth"],
    ["aura-2-cornelia-nl", "Cornelia", "feminine, approachable, friendly, polite, warm"],
    ["aura-2-hestia-nl", "Hestia", "feminine, caring, expressive, friendly"],
    ["aura-2-rhea-nl", "Rhea", "feminine, caring, positive, smooth, warm"],
    ["aura-2-leda-nl", "Leda", "feminine, empathetic, friendly, sincere"]
  ];

  const rows = [];
  for (const [model, voice, notes] of voices) {
    for (const line of sampleLines) {
      const url = new URL("https://api.deepgram.com/v1/speak");
      url.searchParams.set("model", model);
      url.searchParams.set("encoding", "mp3");
      const response = await checkedFetch(
        url,
        {
          method: "POST",
          headers: {
            Authorization: `Token ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ text: line.text })
        },
        `Deepgram ${model}`
      );
      const bytes = Buffer.from(await response.arrayBuffer());
      const fileName = await writeAudio("deepgram", model, voice, line, bytes);
      rows.push({
        provider: "Deepgram",
        model,
        voice,
        notes,
        lineId: line.id,
        lineLabel: line.label,
        text: line.text,
        fileName,
        bytes: bytes.length,
        contentType: response.headers.get("content-type") ?? "audio/mpeg"
      });
      console.log(`Deepgram ${voice} / ${line.label}: ${fileName}`);
    }
  }
  return { skipped: false, rows };
}

async function runOpenAI() {
  const apiKey = getKey("OPENAI_API_KEY");
  if (!apiKey) return { skipped: true, reason: "Missing OPENAI_API_KEY" };

  const model = "gpt-4o-mini-tts";
  const voices = ["alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer", "verse", "marin", "cedar"];
  const instructions =
    "Spreek Nederlands met een warme, natuurlijke vrouwelijke educatieve stem voor een kind in het eerste leerjaar. Spreek helder, rustig, vriendelijk en niet robotachtig.";

  const rows = [];
  for (const voice of voices) {
    for (const line of sampleLines) {
      const response = await checkedFetch(
        "https://api.openai.com/v1/audio/speech",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model,
            voice,
            input: line.text,
            instructions,
            response_format: "mp3"
          })
        },
        `OpenAI ${model}/${voice}`
      );
      const bytes = Buffer.from(await response.arrayBuffer());
      const fileName = await writeAudio("openai", model, voice, line, bytes);
      rows.push({
        provider: "OpenAI",
        model,
        voice,
        notes: "13 built-in voices; OpenAI notes voices are optimized for English.",
        lineId: line.id,
        lineLabel: line.label,
        text: line.text,
        fileName,
        bytes: bytes.length,
        contentType: response.headers.get("content-type") ?? "audio/mpeg"
      });
      console.log(`OpenAI ${voice} / ${line.label}: ${fileName}`);
    }
  }
  return { skipped: false, rows };
}

function voiceLooksDutchFemale(voice) {
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
  return /female|feminine|vrouw|dutch|nederlands|netherlands|nl\b/.test(blob) && /dutch|nederlands|netherlands|\bnl\b/.test(blob);
}

async function findElevenLabsVoices(apiKey) {
  if (process.env.ELEVENLABS_VOICE_IDS?.trim()) {
    return process.env.ELEVENLABS_VOICE_IDS.split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((voiceId) => ({ voice_id: voiceId, name: voiceId, description: "Provided via ELEVENLABS_VOICE_IDS" }));
  }

  const url = new URL("https://api.elevenlabs.io/v2/voices");
  url.searchParams.set("search", "Dutch female");
  url.searchParams.set("page_size", "30");
  const response = await checkedFetch(
    url,
    { headers: { "xi-api-key": apiKey } },
    "ElevenLabs voice search"
  );
  const data = await response.json();
  return (data.voices ?? []).filter(voiceLooksDutchFemale).slice(0, 4);
}

async function runElevenLabs() {
  const apiKey = getKey("ELEVENLABS_API_KEY", "XI_API_KEY");
  if (!apiKey) return { skipped: true, reason: "Missing ELEVENLABS_API_KEY or XI_API_KEY" };

  const voices = await findElevenLabsVoices(apiKey);
  if (voices.length === 0) {
    return {
      skipped: true,
      reason: "No Dutch/female ElevenLabs voices found. Set ELEVENLABS_VOICE_IDS=voiceId1,voiceId2 to test chosen library voices."
    };
  }

  const models = ["eleven_v3", "eleven_multilingual_v2", "eleven_flash_v2_5"];
  const rows = [];
  for (const voice of voices) {
    for (const model of models) {
      for (const line of sampleLines) {
        const url = new URL(`https://api.elevenlabs.io/v1/text-to-speech/${voice.voice_id}`);
        url.searchParams.set("output_format", "mp3_44100_128");
        const response = await checkedFetch(
          url,
          {
            method: "POST",
            headers: {
              "xi-api-key": apiKey,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              text: line.text,
              model_id: model,
              language_code: model === "eleven_multilingual_v2" ? undefined : "nl",
              voice_settings: {
                stability: 0.45,
                similarity_boost: 0.75,
                style: 0.25,
                use_speaker_boost: true,
                speed: 0.95
              }
            })
          },
          `ElevenLabs ${model}/${voice.name}`
        );
        const bytes = Buffer.from(await response.arrayBuffer());
        const fileName = await writeAudio("elevenlabs", model, voice.name, line, bytes);
        rows.push({
          provider: "ElevenLabs",
          model,
          voice: voice.name,
          voiceId: voice.voice_id,
          notes: voice.description ?? "",
          lineId: line.id,
          lineLabel: line.label,
          text: line.text,
          fileName,
          bytes: bytes.length,
          contentType: response.headers.get("content-type") ?? "audio/mpeg"
        });
        console.log(`ElevenLabs ${voice.name} / ${model} / ${line.label}: ${fileName}`);
      }
    }
  }
  return { skipped: false, rows };
}

async function findCartesiaVoices(apiKey) {
  if (process.env.CARTESIA_VOICE_IDS?.trim()) {
    return process.env.CARTESIA_VOICE_IDS.split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((id) => ({ id, name: id, description: "Provided via CARTESIA_VOICE_IDS" }));
  }

  const url = new URL("https://api.cartesia.ai/voices");
  url.searchParams.set("limit", "12");
  url.searchParams.set("language", "nl");
  url.searchParams.set("gender", "feminine");
  const response = await checkedFetch(
    url,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Cartesia-Version": "2026-03-01"
      }
    },
    "Cartesia voice list"
  );
  const data = await response.json();
  return (data.data ?? []).slice(0, 4);
}

async function runCartesia() {
  const apiKey = getKey("CARTESIA_API_KEY");
  if (!apiKey) return { skipped: true, reason: "Missing CARTESIA_API_KEY" };

  const voices = await findCartesiaVoices(apiKey);
  if (voices.length === 0) {
    return {
      skipped: true,
      reason: "No feminine Dutch Cartesia voices found. Set CARTESIA_VOICE_IDS=voiceId1,voiceId2 to test chosen voices."
    };
  }

  const models = ["sonic-3.5", "sonic-3"];
  const rows = [];
  for (const voice of voices) {
    for (const model of models) {
      for (const line of sampleLines) {
        const response = await checkedFetch(
          "https://api.cartesia.ai/tts/bytes",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Cartesia-Version": "2026-03-01",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model_id: model,
              transcript: line.text,
              voice: { mode: "id", id: voice.id },
              language: "nl",
              output_format: {
                container: "mp3",
                sample_rate: 44100,
                bit_rate: 128000
              },
              generation_config: {
                speed: 0.95,
                volume: 1
              }
            })
          },
          `Cartesia ${model}/${voice.name}`
        );
        const bytes = Buffer.from(await response.arrayBuffer());
        const fileName = await writeAudio("cartesia", model, voice.name, line, bytes);
        rows.push({
          provider: "Cartesia",
          model,
          voice: voice.name,
          voiceId: voice.id,
          notes: voice.description ?? "",
          lineId: line.id,
          lineLabel: line.label,
          text: line.text,
          fileName,
          bytes: bytes.length,
          contentType: response.headers.get("content-type") ?? "audio/mpeg"
        });
        console.log(`Cartesia ${voice.name} / ${model} / ${line.label}: ${fileName}`);
      }
    }
  }
  return { skipped: false, rows };
}

function renderHtml(rows, skipped) {
  const grouped = new Map();
  for (const row of rows) {
    const key = `${row.provider} / ${row.model} / ${row.voice}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  }

  const skippedHtml = skipped.length
    ? `<section><h2>Skipped providers</h2><ul>${skipped.map((item) => `<li><strong>${item.provider}</strong>: ${item.reason}</li>`).join("")}</ul></section>`
    : "";

  const sections = [...grouped.entries()]
    .map(([key, items]) => {
      const rowsHtml = items
        .map(
          (item) => `<tr>
            <td>${item.lineLabel}</td>
            <td><code>${item.text}</code></td>
            <td><audio controls preload="none" src="./${item.fileName}"></audio></td>
            <td>${item.bytes}</td>
          </tr>`
        )
        .join("\n");
      return `<section>
        <h2>${key}</h2>
        <p>${items[0].notes ?? ""}</p>
        <table>
          <thead><tr><th>Use case</th><th>Text</th><th>Audio</th><th>Bytes</th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </section>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="nl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>TTS Provider Shootout</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 24px; background: #f8fafc; color: #142033; }
    h1 { margin-bottom: 4px; }
    section { margin: 22px 0; padding: 16px; border: 1px solid #d7e1ec; border-radius: 8px; background: #fff; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; border-top: 1px solid #e7eef6; vertical-align: top; text-align: left; }
    audio { width: 260px; max-width: 100%; }
    code { white-space: normal; }
  </style>
</head>
<body>
  <h1>TTS Provider Shootout</h1>
  <p>Build-time samples for BlokBlitz Dutch voice-pack evaluation. Do not ship these QA files directly.</p>
  <p>Provider docs: ${Object.entries(providerDocs)
    .map(([provider, url]) => `<a href="${url}">${provider}</a>`)
    .join(" | ")}</p>
  ${skippedHtml}
  ${sections}
</body>
</html>`;
}

await mkdir(outDir, { recursive: true });

const runners = {
  deepgram: runDeepgram,
  openai: runOpenAI,
  elevenlabs: runElevenLabs,
  cartesia: runCartesia
};

const rows = [];
const skipped = [];

for (const [provider, runner] of Object.entries(runners)) {
  if (!selectedProviders.has(provider)) continue;
  try {
    const result = await runner();
    if (result.skipped) skipped.push({ provider, reason: result.reason });
    else rows.push(...result.rows);
  } catch (error) {
    skipped.push({ provider, reason: error instanceof Error ? error.message : String(error) });
  }
}

await writeFile(path.join(outDir, "index.html"), renderHtml(rows, skipped));
await writeFile(
  path.join(outDir, "results.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      providers: [...selectedProviders],
      providerDocs,
      sampleLines,
      rows,
      skipped
    },
    null,
    2
  )
);

console.log(`Wrote ${rows.length} clips to ${outDir}`);
if (skipped.length) {
  for (const item of skipped) console.log(`Skipped ${item.provider}: ${item.reason}`);
}
