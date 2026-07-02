import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const apiKey = process.env.DEEPGRAM_API_KEY?.trim();
if (!apiKey) {
  console.error("DEEPGRAM_API_KEY is required.");
  process.exit(1);
}

const outDir = path.resolve(".qa-artifacts", "deepgram-agent-tts-samples");
const endpoint = process.env.DEEPGRAM_AGENT_ENDPOINT ?? "wss://api.eu.deepgram.com/v1/agent/converse";

const lines = [
  {
    id: "reward",
    label: "Reward",
    text: "Goed zo! Je hebt de vijf gevonden."
  },
  {
    id: "reading",
    label: "Zoemend lezen",
    text: "Zing de klanken aan elkaar: mmm, aa, n. Maan."
  }
];

const configs = [
  {
    id: "deepgram-hestia",
    provider: "Deepgram Agent + Aura-2",
    voice: "Hestia",
    extension: "wav",
    output: {
      encoding: "linear16",
      sample_rate: 24000,
      container: "none"
    },
    speak: {
      provider: {
        type: "deepgram",
        model: "aura-2-hestia-nl",
        speed: 0.95
      }
    }
  },
  {
    id: "deepgram-rhea",
    provider: "Deepgram Agent + Aura-2",
    voice: "Rhea",
    extension: "wav",
    output: {
      encoding: "linear16",
      sample_rate: 24000,
      container: "none"
    },
    speak: {
      provider: {
        type: "deepgram",
        model: "aura-2-rhea-nl",
        speed: 0.95
      }
    }
  },
  {
    id: "cartesia-sonic35-katie",
    provider: "Deepgram-managed Cartesia",
    voice: "Katie",
    extension: "wav",
    output: {
      encoding: "linear16",
      sample_rate: 24000,
      container: "none"
    },
    speak: {
      provider: {
        type: "cartesia",
        model_id: "sonic-3.5",
        voice: {
          mode: "id",
          id: "f786b574-daa5-4673-aa0c-cbe3e8534c02"
        },
        language: "nl",
        speed: "normal"
      }
    }
  },
  {
    id: "cartesia-sonic35-skylar",
    provider: "Deepgram-managed Cartesia",
    voice: "Skylar",
    extension: "wav",
    output: {
      encoding: "linear16",
      sample_rate: 24000,
      container: "none"
    },
    speak: {
      provider: {
        type: "cartesia",
        model_id: "sonic-3.5",
        voice: {
          mode: "id",
          id: "db6b0ed5-d5d3-463d-ae85-518a07d3c2b4"
        },
        language: "nl",
        speed: "normal"
      }
    }
  },
  {
    id: "cartesia-sonic35-gemma",
    provider: "Deepgram-managed Cartesia",
    voice: "Gemma",
    extension: "wav",
    output: {
      encoding: "linear16",
      sample_rate: 24000,
      container: "none"
    },
    speak: {
      provider: {
        type: "cartesia",
        model_id: "sonic-3.5",
        voice: {
          mode: "id",
          id: "62ae83ad-4f6a-430b-af41-a9bede9286ca"
        },
        language: "nl",
        speed: "normal"
      }
    }
  }
];

function safeName(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
}

function pcm16ToWav(pcm, sampleRate) {
  const channels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

function buildSettings(config, text) {
  return {
    type: "Settings",
    mip_opt_out: true,
    tags: ["blokblitz", "voice-pack-qa", config.id],
    audio: {
      input: {
        encoding: "linear16",
        sample_rate: 16000
      },
      output: {
        ...config.output
      }
    },
    agent: {
      listen: {
        provider: {
          type: "deepgram",
          model: "nova-3",
          language: "nl"
        }
      },
      think: {
        provider: {
          type: "open_ai",
          model: "gpt-4o-mini",
          temperature: 0
        },
        prompt: "Je bent alleen een TTS-testagent. Als je moet antwoorden, herhaal exact de tekst van de gebruiker zonder extra woorden."
      },
      speak: config.speak,
      greeting: text
    }
  };
}

async function synthesize(config, line) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(endpoint, ["token", apiKey]);
    const audioChunks = [];
    const events = [];
    const timeout = setTimeout(() => {
      try {
        ws.close();
      } catch {
        // ignore close race
      }
      reject(new Error(`${config.id}/${line.id} timed out waiting for audio`));
    }, 30000);

    function finish(ok, value) {
      clearTimeout(timeout);
      try {
        ws.close();
      } catch {
        // ignore close race
      }
      ok ? resolve(value) : reject(value);
    }

    ws.addEventListener("open", () => {
      // Wait for Welcome before sending Settings.
    });

    ws.addEventListener("message", async (event) => {
      if (typeof event.data !== "string") {
        const buffer = Buffer.from(await event.data.arrayBuffer());
        if (buffer.length > 0) audioChunks.push(buffer);
        return;
      }

      let message;
      try {
        message = JSON.parse(event.data);
      } catch {
        events.push({ type: "NonJsonText", value: event.data.slice(0, 200) });
        return;
      }
      events.push(message);

      if (message.type === "Welcome") {
        ws.send(JSON.stringify(buildSettings(config, line.text)));
      } else if (message.type === "SettingsApplied") {
        // Greeting should trigger synthesis by itself.
      } else if (message.type === "AgentAudioDone") {
        const audio = Buffer.concat(audioChunks);
        finish(true, { audio, events });
      } else if (message.type === "Error") {
        finish(false, new Error(`${config.id}/${line.id}: ${JSON.stringify(message)}`));
      }
    });

    ws.addEventListener("error", (event) => {
      finish(false, new Error(`${config.id}/${line.id}: WebSocket error ${event.message ?? ""}`));
    });

    ws.addEventListener("close", () => {
      if (audioChunks.length > 0) {
        const audio = Buffer.concat(audioChunks);
        finish(true, { audio, events });
      }
    });
  });
}

await mkdir(outDir, { recursive: true });
const rows = [];
const skipped = [];

for (const config of configs) {
  for (const line of lines) {
    try {
      const result = await synthesize(config, line);
      if (result.audio.length === 0) {
        skipped.push({ id: config.id, lineId: line.id, reason: "No audio returned", events: result.events });
        continue;
      }
      const audio =
        config.output.encoding === "linear16" && config.extension === "wav" ? pcm16ToWav(result.audio, config.output.sample_rate) : result.audio;
      const fileName = `${safeName(config.id)}-${line.id}.${config.extension}`;
      await writeFile(path.join(outDir, fileName), audio);
      rows.push({
        id: config.id,
        provider: config.provider,
        voice: config.voice,
        lineId: line.id,
        lineLabel: line.label,
        text: line.text,
        fileName,
        bytes: audio.length,
        events: result.events.map((event) => event.type ?? "unknown")
      });
      console.log(`${config.id} / ${line.label}: ${fileName} (${audio.length} bytes)`);
    } catch (error) {
      skipped.push({
        id: config.id,
        lineId: line.id,
        reason: error instanceof Error ? error.message : String(error)
      });
      console.log(`Skipped ${config.id} / ${line.label}: ${skipped.at(-1).reason}`);
    }
  }
}

const sections = rows
  .map(
    (row) => `<section>
      <h2>${row.provider} - ${row.voice} <small>${row.lineLabel}</small></h2>
      <p><code>${row.text}</code></p>
      <audio controls preload="none" src="./${row.fileName}"></audio>
      <p>${row.fileName} - ${row.bytes} bytes</p>
    </section>`
  )
  .join("\n");

const skippedHtml = skipped.length
  ? `<section><h2>Skipped/failed</h2><pre>${JSON.stringify(skipped, null, 2)}</pre></section>`
  : "";

await writeFile(
  path.join(outDir, "index.html"),
  `<!doctype html>
<html lang="nl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Deepgram Agent TTS Samples</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 24px; background: #f8fafc; color: #142033; }
    section { margin: 18px 0; padding: 16px; border: 1px solid #d7e1ec; border-radius: 8px; background: #fff; }
    audio { width: 320px; max-width: 100%; }
    pre { white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>Deepgram Agent TTS Samples</h1>
  <p>Tests Deepgram Aura and Deepgram-managed Cartesia through the Voice Agent API.</p>
  ${skippedHtml}
  ${sections}
</body>
</html>`
);

await writeFile(
  path.join(outDir, "results.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), endpoint, rows, skipped }, null, 2)
);

console.log(`Wrote ${rows.length} clips to ${outDir}`);
