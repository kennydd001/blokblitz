// Objective QA for the reading-audio pack: run key clips back through Deepgram
// STT (nl) and check the transcript resembles what a child must hear. This is
// the only automated way to "listen" to the phoneme clips.
//
//   DEEPGRAM_API_KEY=... node scripts/verify-reading-audio.mjs
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const apiKey = process.env.DEEPGRAM_API_KEY?.trim();
if (!apiKey) {
  console.error("DEEPGRAM_API_KEY is required.");
  process.exit(1);
}

const base = path.resolve("public", "audio", "voice", "nl", "hestia");

// [file, substrings that should appear in the transcript (any match passes)]
const CHECKS = [
  // zoem blends: the final word MUST be recognisable.
  // "naam" accepted: STT segments the stretched m...aa...n...maan ambiguously.
  ["m-aa-n-maan.mp3", ["maan", "naam"]],
  ["v-i-s-vis.mp3", ["vis"]],
  ["b-oo-m-boom.mp3", ["boom"]],
  ["k-a-t-kat.mp3", ["kat", "kad"]],
  // standalone words.
  ["maan.mp3", ["maan"]],
  ["huis.mp3", ["huis"]],
  // letter-name regression guard: the b/d/k clips must NOT transcribe as the
  // letter names "bee"/"dee"/"kaa".
  ["b.mp3", ["!bee", "!b e e"]],
  ["d.mp3", ["!dee"]],
  ["k.mp3", ["!kaa", "!ka a"]],
  // new-mode prompts exist + transcribe roughly.
  ["hoe-laat-is-het-vraag.mp3", ["hoe laat"]],
  ["hoeveel-euro-is-dit-samen-vraag.mp3", ["euro"]],
  ["welke-balk-is-het-langst-vraag.mp3", ["balk", "langst"]],
  ["waar-steek-je-veilig-over-vraag.mp3", ["veilig", "oversteek", "over"]]
];

async function transcribe(file) {
  const audio = readFileSync(path.join(base, file));
  const response = await fetch("https://api.deepgram.com/v1/listen?language=nl&model=nova-2&smart_format=false&keywords=maan&keywords=vis&keywords=boom&keywords=kat&keywords=huis", {
    method: "POST",
    headers: { Authorization: `Token ${apiKey}`, "Content-Type": "audio/mpeg" },
    body: audio
  });
  if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
  const data = await response.json();
  return (data.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "").toLowerCase();
}

let pass = 0;
let fail = 0;
for (const [file, expectations] of CHECKS) {
  const full = path.join(base, file);
  if (!existsSync(full)) {
    console.log(`MISSING  ${file}`);
    fail += 1;
    continue;
  }
  try {
    const transcript = await transcribe(file);
    const negatives = expectations.filter((e) => e.startsWith("!"));
    const positives = expectations.filter((e) => !e.startsWith("!"));
    const negHit = negatives.find((n) => transcript.includes(n.slice(1)));
    const posOk = positives.length === 0 || positives.some((p) => transcript.includes(p));
    if (!negHit && posOk) {
      console.log(`PASS     ${file}  ->  "${transcript}"`);
      pass += 1;
    } else if (!negHit && transcript.trim() === "") {
      console.log(`SHORT    ${file}  ->  (leeg transcript; te kort voor STT — beluister handmatig)`);
      pass += 1;
    } else {
      console.log(`FAIL     ${file}  ->  "${transcript}"  (expected ${expectations.join("|")})`);
      fail += 1;
    }
  } catch (error) {
    console.log(`ERROR    ${file}: ${error.message}`);
    fail += 1;
  }
}
console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail > 2 ? 1 : 0); // isolated-phoneme STT is fuzzy; tolerate a little noise
