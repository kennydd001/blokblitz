import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const apiKey = process.env.DEEPGRAM_API_KEY?.trim();
if (!apiKey) {
  console.error("DEEPGRAM_API_KEY is required.");
  process.exit(1);
}

const outDir = path.resolve(".qa-artifacts", "deepgram-voice-samples");
const voices = [
  {
    model: "aura-2-beatrix-nl",
    name: "Beatrix",
    notes: "Cheerful, enthusiastic, friendly, trustworthy, warm"
  },
  {
    model: "aura-2-daphne-nl",
    name: "Daphne",
    notes: "Calm, clear, confident, professional, smooth"
  },
  {
    model: "aura-2-cornelia-nl",
    name: "Cornelia",
    notes: "Approachable, friendly, polite, positive, warm"
  },
  {
    model: "aura-2-hestia-nl",
    name: "Hestia",
    notes: "Approachable, caring, expressive, friendly, knowledgeable"
  },
  {
    model: "aura-2-rhea-nl",
    name: "Rhea",
    notes: "Caring, knowledgeable, positive, smooth, warm"
  },
  {
    model: "aura-2-leda-nl",
    name: "Leda",
    notes: "Caring, comfortable, empathetic, friendly, sincere"
  }
];

const lines = [
  {
    id: "reward",
    label: "Beloning",
    text: "Goed zo! Je hebt de vijf gevonden."
  },
  {
    id: "instruction",
    label: "Actie-instructie",
    text: "Pak de vijf. Kijk eerst naar het groepje."
  },
  {
    id: "scaffold",
    label: "Zachte fout",
    text: "Bijna. Eerst vijf, dan de extra blokjes."
  },
  {
    id: "split",
    label: "Splitsen",
    text: "Vijf is drie en twee. Drie en twee maken samen vijf."
  },
  {
    id: "reading",
    label: "Zoemend lezen",
    text: "Zing de klanken aan elkaar: mmm, aa, n. Maan."
  }
];

function safeName(value) {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
}

async function synthesize(model, text) {
  const url = new URL("https://api.deepgram.com/v1/speak");
  url.searchParams.set("model", model);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`${model} failed with HTTP ${response.status}: ${body.slice(0, 300)}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: response.headers.get("content-type") ?? "unknown",
    charCount: response.headers.get("dg-char-count") ?? String(text.length),
    requestId: response.headers.get("dg-request-id") ?? ""
  };
}

const results = [];
await mkdir(outDir, { recursive: true });

for (const voice of voices) {
  for (const line of lines) {
    const fileName = `${safeName(voice.name)}-${line.id}.mp3`;
    const filePath = path.join(outDir, fileName);
    const result = await synthesize(voice.model, line.text);
    await writeFile(filePath, result.buffer);
    results.push({
      ...voice,
      lineId: line.id,
      lineLabel: line.label,
      text: line.text,
      fileName,
      bytes: result.buffer.length,
      contentType: result.contentType,
      charCount: Number(result.charCount),
      requestId: result.requestId
    });
    console.log(`${voice.name} / ${line.label}: ${fileName} (${result.buffer.length} bytes)`);
  }
}

const grouped = voices
  .map((voice) => {
    const rows = results
      .filter((item) => item.model === voice.model)
      .map(
        (item) => `<tr>
          <td>${item.lineLabel}</td>
          <td><code>${item.text}</code></td>
          <td><audio controls src="./${item.fileName}"></audio></td>
        </tr>`
      )
      .join("\n");
    return `<section>
      <h2>${voice.name} <small>${voice.model}</small></h2>
      <p>${voice.notes}</p>
      <table>
        <thead><tr><th>Use case</th><th>Text</th><th>Audio</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>`;
  })
  .join("\n");

const html = `<!doctype html>
<html lang="nl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Deepgram Dutch Voice Samples</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 24px; color: #17202a; background: #f8fafc; }
    h1 { margin-bottom: 4px; }
    section { margin: 22px 0; padding: 16px; border: 1px solid #d8e0ea; border-radius: 8px; background: white; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; border-top: 1px solid #e6edf5; vertical-align: top; text-align: left; }
    audio { width: 260px; max-width: 100%; }
    code { white-space: normal; }
    small { font-weight: 500; color: #52616f; }
  </style>
</head>
<body>
  <h1>Deepgram Dutch Female Voice Samples</h1>
  <p>Generated build-time for BlokBlitz voice-pack evaluation. These are QA artifacts, not runtime assets yet.</p>
  ${grouped}
</body>
</html>
`;

await writeFile(path.join(outDir, "index.html"), html);
await writeFile(path.join(outDir, "samples.json"), JSON.stringify({ generatedAt: new Date().toISOString(), voices, lines, results }, null, 2));

console.log(`Wrote ${results.length} clips to ${outDir}`);
