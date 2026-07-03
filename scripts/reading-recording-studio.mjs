import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const port = Number.parseInt(process.env.READING_RECORDING_PORT ?? "5393", 10) || 5393;
const rootDir = path.resolve(".qa-artifacts", "reading-recordings");
const rawDir = path.join(rootDir, "raw");
const wordDir = path.join(rootDir, "words");
const blendDir = path.join(rootDir, "blends");
const generatedBlendDir = path.join(rootDir, "blends-generated");
const manualBlendDir = path.join(rootDir, "blends-manual");

const phonemes = [
  { key: "m", kind: "continuous", prompt: "mmm" },
  { key: "s", kind: "continuous", prompt: "sss" },
  { key: "v", kind: "continuous", prompt: "vvv" },
  { key: "r", kind: "continuous", prompt: "rrr" },
  { key: "n", kind: "continuous", prompt: "nnn" },
  { key: "z", kind: "continuous", prompt: "zzz" },
  { key: "h", kind: "continuous", prompt: "hhh" },
  { key: "l", kind: "continuous", prompt: "lll" },
  { key: "f", kind: "continuous", prompt: "fff" },
  { key: "w", kind: "continuous", prompt: "www" },
  { key: "b", kind: "stop", prompt: "buh" },
  { key: "d", kind: "stop", prompt: "duh" },
  { key: "k", kind: "stop", prompt: "kuh" },
  { key: "p", kind: "stop", prompt: "puh" },
  { key: "t", kind: "stop", prompt: "tuh" },
  { key: "a", kind: "short-vowel", prompt: "aaa" },
  { key: "e", kind: "short-vowel", prompt: "eh" },
  { key: "i", kind: "short-vowel", prompt: "ih" },
  { key: "o", kind: "short-vowel", prompt: "oh" },
  { key: "u", kind: "short-vowel", prompt: "uh" },
  { key: "aa", kind: "long-vowel", prompt: "aa" },
  { key: "ee", kind: "long-vowel", prompt: "ee" },
  { key: "oo", kind: "long-vowel", prompt: "oo" },
  { key: "uu", kind: "long-vowel", prompt: "uu" },
  { key: "oe", kind: "digraph", prompt: "oe" },
  { key: "ie", kind: "digraph", prompt: "ie" },
  { key: "eu", kind: "digraph", prompt: "eu" },
  { key: "ui", kind: "digraph", prompt: "ui" },
  { key: "ei", kind: "digraph", prompt: "ei" },
  { key: "ij", kind: "digraph", prompt: "ij" },
  { key: "ou", kind: "digraph", prompt: "ou" },
  { key: "au", kind: "digraph", prompt: "au" }
];

const words = [
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

function json(response, status, body) {
  response.writeHead(status, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  });
  response.end(JSON.stringify(body, null, 2));
}

function send(response, status, body, contentType = "text/plain; charset=utf-8") {
  response.writeHead(status, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": contentType
  });
  response.end(body);
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function safeKey(value) {
  return String(value).replace(/[^a-z0-9_-]/gi, "");
}

async function listWavs(dir) {
  if (!existsSync(dir)) return [];
  return (await readdir(dir)).filter((file) => file.endsWith(".wav")).sort();
}

function readWav(buffer) {
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error("Expected a WAV file.");
  }
  let offset = 12;
  let fmt;
  let dataStart = -1;
  let dataSize = 0;
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (id === "fmt ") {
      fmt = {
        audioFormat: buffer.readUInt16LE(start),
        channels: buffer.readUInt16LE(start + 2),
        sampleRate: buffer.readUInt32LE(start + 4),
        bitsPerSample: buffer.readUInt16LE(start + 14)
      };
    }
    if (id === "data") {
      dataStart = start;
      dataSize = size;
      break;
    }
    offset = start + size + (size % 2);
  }
  if (!fmt || dataStart < 0) throw new Error("Invalid WAV: missing fmt or data chunk.");
  if (fmt.audioFormat !== 1 || fmt.bitsPerSample !== 16) throw new Error("Only 16-bit PCM WAV is supported.");

  const frameCount = Math.floor(dataSize / 2 / fmt.channels);
  const samples = new Float32Array(frameCount);
  for (let i = 0; i < frameCount; i += 1) {
    let total = 0;
    for (let channel = 0; channel < fmt.channels; channel += 1) {
      total += buffer.readInt16LE(dataStart + (i * fmt.channels + channel) * 2) / 32768;
    }
    samples[i] = total / fmt.channels;
  }
  return { sampleRate: fmt.sampleRate, samples };
}

function encodeWav(samples, sampleRate) {
  const dataBytes = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataBytes);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataBytes, 40);
  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }
  return buffer;
}

function trimSilence(samples, sampleRate, threshold = 0.012, marginMs = 35) {
  let start = 0;
  let end = samples.length - 1;
  while (start < samples.length && Math.abs(samples[start]) < threshold) start += 1;
  while (end > start && Math.abs(samples[end]) < threshold) end -= 1;
  const margin = Math.round((sampleRate * marginMs) / 1000);
  start = Math.max(0, start - margin);
  end = Math.min(samples.length - 1, end + margin);
  return samples.slice(start, end + 1);
}

function normalize(samples, peak = 0.82) {
  let max = 0;
  for (const sample of samples) max = Math.max(max, Math.abs(sample));
  if (max < 0.01) return samples;
  const gain = Math.min(6, peak / max);
  const out = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i += 1) out[i] = samples[i] * gain;
  return out;
}

function fade(samples, sampleRate, fadeMs = 8) {
  const out = new Float32Array(samples);
  const n = Math.min(out.length >> 1, Math.round((sampleRate * fadeMs) / 1000));
  for (let i = 0; i < n; i += 1) {
    const gain = i / n;
    out[i] *= gain;
    out[out.length - 1 - i] *= gain;
  }
  return out;
}

function resample(samples, fromRate, toRate) {
  if (fromRate === toRate) return samples;
  const out = new Float32Array(Math.max(1, Math.round((samples.length * toRate) / fromRate)));
  const ratio = fromRate / toRate;
  for (let i = 0; i < out.length; i += 1) {
    const pos = i * ratio;
    const left = Math.floor(pos);
    const right = Math.min(samples.length - 1, left + 1);
    const frac = pos - left;
    out[i] = samples[left] * (1 - frac) + samples[right] * frac;
  }
  return out;
}

function silence(sampleRate, ms) {
  return new Float32Array(Math.round((sampleRate * ms) / 1000));
}

function concatParts(parts) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Float32Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function copyInto(target, source, offset, gain = 1) {
  for (let i = 0; i < source.length && offset + i < target.length; i += 1) {
    target[offset + i] += source[i] * gain;
  }
}

function crossfadeParts(parts, sampleRate, crossfadeMs = 18) {
  if (parts.length === 0) return new Float32Array();
  const crossfade = Math.round((sampleRate * crossfadeMs) / 1000);
  const total = parts.reduce((sum, part) => sum + part.length, 0) - crossfade * (parts.length - 1);
  const out = new Float32Array(Math.max(1, total));
  let offset = 0;
  copyInto(out, parts[0], 0);
  offset = parts[0].length;
  for (let p = 1; p < parts.length; p += 1) {
    const part = parts[p];
    const start = Math.max(0, offset - crossfade);
    for (let i = 0; i < part.length && start + i < out.length; i += 1) {
      let gain = 1;
      if (i < crossfade) gain = i / crossfade;
      out[start + i] = out[start + i] * (i < crossfade ? 1 - gain : 1) + part[i] * gain;
    }
    offset = start + part.length;
  }
  return out;
}

async function loadUnit(key, targetRate) {
  const wav = readWav(await readFile(path.join(rawDir, `${key}.wav`)));
  return fade(normalize(trimSilence(resample(wav.samples, wav.sampleRate, targetRate), targetRate)), targetRate);
}

async function buildWords() {
  await mkdir(wordDir, { recursive: true });
  await mkdir(blendDir, { recursive: true });
  await mkdir(generatedBlendDir, { recursive: true });
  const sampleRate = 48000;
  const built = [];
  const missing = [];

  for (const entry of words) {
    const absent = entry.units.filter((unit) => !existsSync(path.join(rawDir, `${unit}.wav`)));
    if (absent.length) {
      missing.push({ word: entry.word, units: absent });
      continue;
    }

    const units = [];
    for (const unit of entry.units) units.push(await loadUnit(unit, sampleRate));

    const wordClip = crossfadeParts(units, sampleRate, 22);
    const blendClip = concatParts([
      ...units.flatMap((unit, index) => (index < units.length - 1 ? [unit, silence(sampleRate, 80)] : [unit])),
      silence(sampleRate, 230),
      wordClip
    ]);

    await writeFile(path.join(wordDir, `${entry.word}.wav`), encodeWav(normalize(wordClip, 0.82), sampleRate));
    const generated = encodeWav(normalize(blendClip, 0.82), sampleRate);
    await writeFile(path.join(generatedBlendDir, `${entry.word}.wav`), generated);
    const manualPath = path.join(manualBlendDir, `${entry.word}.wav`);
    if (existsSync(manualPath)) {
      await writeFile(path.join(blendDir, `${entry.word}.wav`), await readFile(manualPath));
      built.push({ word: entry.word, units: entry.units, blendSource: "manual" });
    } else {
      await writeFile(path.join(blendDir, `${entry.word}.wav`), generated);
      built.push({ word: entry.word, units: entry.units, blendSource: "generated" });
    }
  }
  return { built, missing };
}

async function state() {
  const raw = await listWavs(rawDir);
  const builtWords = await listWavs(wordDir);
  const blends = await listWavs(blendDir);
  const generatedBlends = await listWavs(generatedBlendDir);
  const manualBlends = await listWavs(manualBlendDir);
  return {
    phonemes,
    words,
    raw: raw.map((file) => file.replace(/\.wav$/, "")),
    builtWords: builtWords.map((file) => file.replace(/\.wav$/, "")),
    blends: blends.map((file) => file.replace(/\.wav$/, "")),
    generatedBlends: generatedBlends.map((file) => file.replace(/\.wav$/, "")),
    manualBlends: manualBlends.map((file) => file.replace(/\.wav$/, ""))
  };
}

function html() {
  const data = JSON.stringify({ phonemes, words }).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="nl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Leesklanken Studio</title>
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: #f5f7fb; color: #142033; }
    header { position: sticky; top: 0; z-index: 2; background: #ffffff; border-bottom: 1px solid #dbe4ef; padding: 14px 18px; }
    h1 { margin: 0 0 6px; font-size: 24px; }
    main { padding: 18px; display: grid; gap: 18px; }
    section { background: #fff; border: 1px solid #dbe4ef; border-radius: 8px; padding: 14px; }
    .tools { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    button { border: 1px solid #afbed0; background: #fff; border-radius: 7px; padding: 8px 10px; font: inherit; font-weight: 700; cursor: pointer; }
    button.primary { background: #1769aa; border-color: #1769aa; color: #fff; }
    button.recording { background: #c93434; border-color: #c93434; color: #fff; }
    button:disabled { opacity: .45; cursor: not-allowed; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 10px; }
    .card { border: 1px solid #e0e7f0; border-radius: 8px; padding: 10px; display: grid; gap: 8px; }
    .card.saved { border-color: #55a368; background: #f2fbf4; }
    .key { font-size: 28px; font-weight: 800; }
    .hint { color: #526173; font-size: 13px; }
    audio { width: 100%; height: 32px; }
    .status { font-weight: 700; }
    .word-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; }
    .word { border: 1px solid #e0e7f0; border-radius: 8px; padding: 10px; }
    code { background: #eef3f8; padding: 1px 4px; border-radius: 4px; }
  </style>
</head>
<body>
  <header>
    <h1>Leesklanken Studio</h1>
    <div class="tools">
      <button id="mic" class="primary">Microfoon aan</button>
      <button id="refresh">Refresh</button>
      <button id="build">Maak woorden</button>
      <span id="status" class="status">Klaar</span>
    </div>
  </header>
  <main>
    <section>
      <h2>Klanken opnemen</h2>
      <p class="hint">Klik Record, zeg alleen de klank, klik Stop. De tool trimt stilte en bewaart een mono WAV.</p>
      <div id="phoneme-grid" class="grid"></div>
    </section>
    <section>
      <h2>Woorden en zoemopnames</h2>
      <p class="hint">Neem zoemend lezen liefst per woord in één vloeiende beweging op. De generated versie blijft als fallback beschikbaar.</p>
      <div id="word-list" class="word-list"></div>
    </section>
  </main>
  <script type="application/json" id="data">${data}</script>
  <script>
    const DATA = JSON.parse(document.getElementById("data").textContent);
    const statusEl = document.getElementById("status");
    const grid = document.getElementById("phoneme-grid");
    const wordList = document.getElementById("word-list");
    let stream;
    let context;
    let source;
    let processor;
    let active = null;
    let chunks = [];
    let currentState = { raw: [], builtWords: [], blends: [], generatedBlends: [], manualBlends: [] };

    function setStatus(text) { statusEl.textContent = text; }

    async function ensureMic() {
      if (stream) return;
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      });
      context = new AudioContext();
      source = context.createMediaStreamSource(stream);
      processor = context.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (event) => {
        if (!active) return;
        chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
      };
      source.connect(processor);
      processor.connect(context.destination);
    }

    function mergeBuffers(parts) {
      const length = parts.reduce((sum, part) => sum + part.length, 0);
      const out = new Float32Array(length);
      let offset = 0;
      for (const part of parts) {
        out.set(part, offset);
        offset += part.length;
      }
      return out;
    }

    function encodeWav(samples, sampleRate) {
      const buffer = new ArrayBuffer(44 + samples.length * 2);
      const view = new DataView(buffer);
      const write = (offset, text) => [...text].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));
      write(0, "RIFF");
      view.setUint32(4, 36 + samples.length * 2, true);
      write(8, "WAVE");
      write(12, "fmt ");
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      write(36, "data");
      view.setUint32(40, samples.length * 2, true);
      let offset = 44;
      for (const sample of samples) {
        const clamped = Math.max(-1, Math.min(1, sample));
        view.setInt16(offset, Math.round(clamped * 32767), true);
        offset += 2;
      }
      return new Blob([buffer], { type: "audio/wav" });
    }

    async function startRecord(type, key) {
      await ensureMic();
      if (context.state === "suspended") await context.resume();
      active = { type, key };
      chunks = [];
      render();
      setStatus("Opnemen: " + key);
    }

    async function stopRecord() {
      const current = active;
      active = null;
      if (!current) return;
      const samples = mergeBuffers(chunks);
      chunks = [];
      const blob = encodeWav(samples, context.sampleRate);
      const endpoint = current.type === "blend" ? "/api/manual-blends/" : "/api/recordings/";
      const response = await fetch(endpoint + encodeURIComponent(current.key), {
        method: "POST",
        headers: { "Content-Type": "audio/wav" },
        body: blob
      });
      if (!response.ok) throw new Error(await response.text());
      setStatus("Bewaard: " + current.key);
      await refresh();
    }

    async function refresh() {
      const response = await fetch("/api/state");
      currentState = await response.json();
      render();
    }

    async function buildWords() {
      setStatus("Woorden maken...");
      const response = await fetch("/api/build-words", { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(JSON.stringify(result));
      setStatus("Gebouwd: " + result.built.length + " woorden, ontbrekend: " + result.missing.length);
      await refresh();
    }

    function render() {
      const saved = new Set(currentState.raw);
      grid.innerHTML = "";
      for (const item of DATA.phonemes) {
        const card = document.createElement("div");
        card.className = "card" + (saved.has(item.key) ? " saved" : "");
        const isActive = active?.type === "phoneme" && active.key === item.key;
        card.innerHTML = \`
          <div class="key">\${item.key}</div>
          <div><code>\${item.prompt}</code> <span class="hint">\${item.kind}</span></div>
          <div class="tools">
            <button class="\${isActive ? "recording" : ""}" data-action="\${isActive ? "stop" : "record"}" data-key="\${item.key}">\${isActive ? "Stop" : "Record"}</button>
            <button data-action="play" data-key="\${item.key}" \${saved.has(item.key) ? "" : "disabled"}>Play</button>
          </div>
          <audio controls preload="none" src="\${saved.has(item.key) ? "/recordings/raw/" + item.key + ".wav?ts=" + Date.now() : ""}"></audio>
        \`;
        grid.appendChild(card);
      }

      const built = new Set(currentState.builtWords);
      const blends = new Set(currentState.blends);
      const generated = new Set(currentState.generatedBlends || []);
      const manual = new Set(currentState.manualBlends || []);
      const promptByUnit = new Map(DATA.phonemes.map((item) => [item.key, item.prompt]));
      wordList.innerHTML = "";
      for (const item of DATA.words) {
        const missing = item.units.filter((unit) => !saved.has(unit));
        const isActive = active?.type === "blend" && active.key === item.word;
        const zoemPrompt = item.units.map((unit) => promptByUnit.get(unit) || unit).join(" ... ") + " ... " + item.word;
        const el = document.createElement("div");
        el.className = "word";
        el.innerHTML = \`
          <strong>\${item.word}</strong>
          <div class="hint">\${item.units.join(" - ")}</div>
          <div><code>\${zoemPrompt}</code></div>
          <div class="tools">
            <button class="\${isActive ? "recording" : ""}" data-action="\${isActive ? "stop" : "record-blend"}" data-word="\${item.word}">\${isActive ? "Stop" : "Record Zoem"}</button>
            <button data-action="play-manual" data-word="\${item.word}" \${manual.has(item.word) ? "" : "disabled"}>Play handmatig</button>
            <button data-action="play-final" data-word="\${item.word}" \${blends.has(item.word) ? "" : "disabled"}>Play eindclip</button>
            <button data-action="play-generated" data-word="\${item.word}" \${generated.has(item.word) ? "" : "disabled"}>Play generated</button>
          </div>
          <div class="hint">\${missing.length ? "Ontbreekt: " + missing.join(", ") : "Klaar om te bouwen"}</div>
          <div>Handmatige zoemopname</div>
          <audio controls preload="none" src="\${manual.has(item.word) ? "/recordings/blends-manual/" + item.word + ".wav?ts=" + Date.now() : ""}"></audio>
          <div>Eindclip</div>
          <audio controls preload="none" src="\${blends.has(item.word) ? "/recordings/blends/" + item.word + ".wav?ts=" + Date.now() : ""}"></audio>
          <div>Woord</div>
          <audio controls preload="none" src="\${built.has(item.word) ? "/recordings/words/" + item.word + ".wav?ts=" + Date.now() : ""}"></audio>
          <div>Generated fallback</div>
          <audio controls preload="none" src="\${generated.has(item.word) ? "/recordings/blends-generated/" + item.word + ".wav?ts=" + Date.now() : ""}"></audio>
        \`;
        wordList.appendChild(el);
      }
    }

    document.getElementById("mic").addEventListener("click", async () => {
      try {
        await ensureMic();
        setStatus("Microfoon klaar");
      } catch (error) {
        setStatus("Microfoon fout: " + error.message);
      }
    });
    document.getElementById("refresh").addEventListener("click", refresh);
    document.getElementById("build").addEventListener("click", () => buildWords().catch((error) => setStatus("Fout: " + error.message)));
    grid.addEventListener("click", async (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      const key = button.dataset.key;
      try {
        if (button.dataset.action === "record") await startRecord("phoneme", key);
        if (button.dataset.action === "stop") await stopRecord();
        if (button.dataset.action === "play") new Audio("/recordings/raw/" + key + ".wav?ts=" + Date.now()).play();
      } catch (error) {
        setStatus("Fout: " + error.message);
      }
    });
    wordList.addEventListener("click", async (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      const word = button.dataset.word;
      try {
        if (button.dataset.action === "record-blend") await startRecord("blend", word);
        if (button.dataset.action === "stop") await stopRecord();
        if (button.dataset.action === "play-manual") new Audio("/recordings/blends-manual/" + word + ".wav?ts=" + Date.now()).play();
        if (button.dataset.action === "play-final") new Audio("/recordings/blends/" + word + ".wav?ts=" + Date.now()).play();
        if (button.dataset.action === "play-generated") new Audio("/recordings/blends-generated/" + word + ".wav?ts=" + Date.now()).play();
      } catch (error) {
        setStatus("Fout: " + error.message);
      }
    });
    refresh();
  </script>
</body>
</html>`;
}

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    send(response, 204, "");
    return;
  }

  const url = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);
  try {
    if (request.method === "GET" && url.pathname === "/") {
      send(response, 200, html(), "text/html; charset=utf-8");
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/state") {
      json(response, 200, await state());
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/build-words") {
      json(response, 200, await buildWords());
      return;
    }
    if (request.method === "POST" && url.pathname.startsWith("/api/recordings/")) {
      const key = safeKey(decodeURIComponent(url.pathname.split("/").pop() ?? ""));
      if (!phonemes.some((item) => item.key === key)) {
        json(response, 400, { ok: false, error: "Unknown phoneme key." });
        return;
      }
      await mkdir(rawDir, { recursive: true });
      const body = await readBody(request);
      const wav = readWav(body);
      const cleaned = fade(normalize(trimSilence(wav.samples, wav.sampleRate)), wav.sampleRate);
      await writeFile(path.join(rawDir, `${key}.wav`), encodeWav(cleaned, wav.sampleRate));
      json(response, 200, { ok: true, key, bytes: body.length, file: path.join(rawDir, `${key}.wav`) });
      return;
    }
    if (request.method === "POST" && url.pathname.startsWith("/api/manual-blends/")) {
      const word = safeKey(decodeURIComponent(url.pathname.split("/").pop() ?? ""));
      if (!words.some((item) => item.word === word)) {
        json(response, 400, { ok: false, error: "Unknown word." });
        return;
      }
      await mkdir(manualBlendDir, { recursive: true });
      await mkdir(blendDir, { recursive: true });
      const body = await readBody(request);
      const wav = readWav(body);
      const cleaned = fade(normalize(trimSilence(wav.samples, wav.sampleRate), 0.82), wav.sampleRate);
      const encoded = encodeWav(cleaned, wav.sampleRate);
      await writeFile(path.join(manualBlendDir, `${word}.wav`), encoded);
      await writeFile(path.join(blendDir, `${word}.wav`), encoded);
      json(response, 200, { ok: true, word, bytes: body.length, file: path.join(manualBlendDir, `${word}.wav`) });
      return;
    }
    if (request.method === "GET" && url.pathname.startsWith("/recordings/")) {
      const parts = url.pathname.split("/").map(decodeURIComponent);
      const bucket = safeKey(parts[2] ?? "");
      const file = safeKey((parts[3] ?? "").replace(/\.wav$/, ""));
      const dir =
        bucket === "raw"
          ? rawDir
          : bucket === "words"
            ? wordDir
            : bucket === "blends"
              ? blendDir
              : bucket === "blends-generated"
                ? generatedBlendDir
                : bucket === "blends-manual"
                  ? manualBlendDir
                  : "";
      if (!dir || !file) {
        json(response, 404, { ok: false, error: "Not found." });
        return;
      }
      const wav = await readFile(path.join(dir, `${file}.wav`));
      send(response, 200, wav, "audio/wav");
      return;
    }
    json(response, 404, { ok: false, error: "Not found." });
  } catch (error) {
    json(response, 500, { ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});

await mkdir(rootDir, { recursive: true });
server.listen(port, "127.0.0.1", () => {
  console.log(`Reading recording studio: http://127.0.0.1:${port}/`);
  console.log(`Recordings: ${rootDir}`);
});
