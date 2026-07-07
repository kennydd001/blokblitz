# TTS Provider Shootout

Date: 2026-06-30, updated 2026-07-06

Goal: compare natural female Dutch TTS for a local-first BlokBlitz voice-pack.
QA samples remain under `.qa-artifacts`.

## Current Production Result

- Active sentence/instruction voice-pack:
  `C:\Users\de_do\Documents\miel\public\audio\voice\nl\elevenlabs-lily-v3\`
- 935 local ElevenLabs MP3 clips, generated build-time with `eleven_v3` and
  voice `Lily - Velvety Actress`.
- Active isolated reading phoneme pack:
  `C:\Users\de_do\Documents\miel\public\audio\reading\nl\elevenlabs-lily-v3\phonemes\`
- 32 local ElevenLabs MP3 clips for isolated phoneme taps.
- Runtime manifests:
  `C:\Users\de_do\Documents\miel\src\game\voiceLineManifest.ts` and
  `C:\Users\de_do\Documents\miel\src\game\readingAudioManifest.ts`.
- Word splitting and zoemend lezen still use the browser fallback because
  generated stretched blend clips did not pass listening QA.

Verify with:

```powershell
npm.cmd run voice:elevenlabs-audit
```

## 2026-06-30 Deepgram/Hestia Result

Generated in the first pass; the old runtime Hestia directory was removed after
the 2026-07-06 ElevenLabs migration:

- `C:\Users\de_do\Documents\miel\public\audio\voice\nl\hestia\`
- 737 local Hestia MP3 clips for the first full voice-pack pass
- `C:\Users\de_do\Documents\miel\public\audio\voice\nl\hestia\voice-lines.json`
- `C:\Users\de_do\Documents\miel\src\game\voiceLineManifest.ts`
- `C:\Users\de_do\Documents\miel\.qa-artifacts\tts-provider-shootout\index.html`
- 30 Deepgram clips
- 6 Deepgram Aura-2 Dutch feminine voices
- 5 child-game lines per voice:
  - reward
  - instruction
  - scaffold
  - split fact
  - reading blend
- `C:\Users\de_do\Documents\miel\.qa-artifacts\deepgram-agent-tts-samples\index.html`
- 6 Deepgram Voice Agent clips using Deepgram-managed Cartesia Sonic 3.5
- 3 public Cartesia feminine voice IDs from Cartesia docs, each tested on:
  - reward
  - reading blend

The local key scan found only a Deepgram key. No `OPENAI_API_KEY`,
`ELEVENLABS_API_KEY` / `XI_API_KEY`, or `CARTESIA_API_KEY` was available, so
those providers are wired in the script but not generated yet.

## Provider Research

### Deepgram

Docs: https://developers.deepgram.com/docs/tts-models

Tested model family:

- `aura-2-beatrix-nl`
- `aura-2-daphne-nl`
- `aura-2-cornelia-nl`
- `aura-2-hestia-nl`
- `aura-2-rhea-nl`
- `aura-2-leda-nl`

Practical note: Deepgram has explicit Dutch voices and is currently the only
provider with working local credentials in this environment.

Direct `/v1/speak` worked for Dutch Aura-2 MP3 generation. Voice Agent with
Dutch Aura-2 returned `FAILED_TO_SPEAK` in this environment, so prefer direct
Deepgram TTS for Aura voice-pack generation.

### Deepgram Voice Agent / Managed Cartesia

Docs:

- https://developers.deepgram.com/docs/build-a-voice-agent
- https://developers.deepgram.com/docs/voice-agent-message-flow
- https://developers.deepgram.com/docs/voice-agent-tts-models

Script:

```powershell
node scripts\deepgram-agent-tts-samples.mjs
```

Generated working clips with only the Deepgram key:

- `cartesia-sonic35-katie`
- `cartesia-sonic35-skylar`
- `cartesia-sonic35-gemma`

Settings used:

- `agent.speak.provider.type = "cartesia"`
- `agent.speak.provider.model_id = "sonic-3.5"`
- `agent.speak.provider.language = "nl"`
- audio output `linear16` at 24000 Hz, wrapped locally as WAV

Practical note: this proves Deepgram can reach managed Cartesia without a
separate Cartesia key. It does not provide ElevenLabs or OpenAI TTS without
their own BYO credentials.

### OpenAI

Docs: https://developers.openai.com/api/docs/guides/text-to-speech

Scripted model:

- `gpt-4o-mini-tts`

Scripted voices:

- `alloy`
- `ash`
- `ballad`
- `coral`
- `echo`
- `fable`
- `nova`
- `onyx`
- `sage`
- `shimmer`
- `verse`
- `marin`
- `cedar`

Practical note: the script sends Dutch input plus instructions for a warm,
natural female educational voice. OpenAI voices are not Dutch-specific voice IDs,
so this needs actual listening before choosing.

### ElevenLabs

Docs:

- https://elevenlabs.io/docs/overview/models
- https://elevenlabs.io/docs/api-reference/text-to-speech/convert

Scripted model families:

- `eleven_v3`
- `eleven_multilingual_v2`
- `eleven_flash_v2_5`

Practical note: the script searches account voices for Dutch/female metadata.
If the account voice library does not expose usable matches, set
`ELEVENLABS_VOICE_IDS=voiceId1,voiceId2` before running.

### Cartesia

Docs:

- https://docs.cartesia.ai/build-with-cartesia/tts-models/latest
- https://docs.cartesia.ai/api-reference/tts/bytes
- https://docs.cartesia.ai/api-reference/voices/list

Scripted model families:

- `sonic-3.5`
- `sonic-3`

Practical note: the script lists feminine Dutch voices with `language=nl` and
then generates MP3 clips with `language: "nl"`.

## Script

Main script:

```powershell
node scripts\tts-provider-shootout.mjs
```

Deepgram Voice Agent managed-provider script:

```powershell
node scripts\deepgram-agent-tts-samples.mjs
```

Full Hestia voice-pack generation:

```powershell
$env:DEEPGRAM_API_KEY = "..."
npm.cmd run voice:hestia
```

The generator skips existing MP3s unless `--force` is passed directly to
`scripts/generate-hestia-voice-pack.mjs`.

Reading phoneme status:

The attempted Hestia reading phoneme pack was rejected after listening QA. It
did not sound good enough for isolated letters or "zoemend lezen". Runtime
reading scenes now use `ReadingAudioManager` to force the browser speech engine
for reading prompts, while Hestia remains the primary voice for normal sentences,
instructions, and feedback.

ElevenLabs reading-phoneme shootout:

```powershell
$env:ELEVENLABS_API_KEY = "..."
npm.cmd run voice:elevenlabs-reading
```

Generated QA page:

```text
.qa-artifacts/elevenlabs-reading-shootout/index.html
```

The 2026-07-02 run generated 144 local MP3 clips for:

- models: `eleven_v3`, `eleven_multilingual_v2`, `eleven_flash_v2_5`
- voices: `Lily - Velvety Actress`, `Alice - Clear, Engaging Educator`, `Sarah - Mature, Reassuring, Confident`
- test cases: isolated `m`, `s`, `v`, `aa`, `ui`, `eu`, `b`, `k`, carrier phrases, and zoem blends such as `mmm... aa... nnn... maan`

One Dutch/Flemish professional library voice was discoverable
(`Dynamische Vlaamse Vrouwenstem`), but the current ElevenLabs account rejected
library/professional API synthesis with `paid_plan_required`, so it is not part
of the generated sample set.

Use the listening page to decide. If no ElevenLabs model says isolated Dutch
phonemes cleanly, stop trying generic TTS for this path and use a tiny
human-recorded Dutch reading pack. Keep reading phoneme clips separate from the
normal Hestia sentence pack.

Iteration note - 2026-07-02:

The user selected `eleven_v3` as the best ElevenLabs model family so far, but
rejected raw isolated `aa`, `ui`, `eu`, and `b`. The `buh` fallback was accepted
as a better `b` phoneme prompt.

Focused rerun:

```powershell
$env:ELEVENLABS_API_KEY = "..."
$env:ELEVENLABS_OUT_DIR = ".qa-artifacts\elevenlabs-reading-iteration-v2"
$env:ELEVENLABS_SAMPLE_SET = "problem-phonemes-v2"
$env:ELEVENLABS_MODELS = "eleven_v3"
$env:ELEVENLABS_VOICE_IDS = "pFZP5JQG7iQjIQuC4Bku"
npm.cmd run voice:elevenlabs-reading
```

Generated QA page:

```text
.qa-artifacts/elevenlabs-reading-iteration-v2/index.html
```

This run generated 26 Lily / `eleven_v3` clips with:

- raw baselines for the rejected clips
- slower, more stable voice settings
- `apply_text_normalization = off` for short phoneme attempts
- IPA pronunciation-dictionary token attempts for `aa`, `ui`, `eu`, and `b`
- carrier phrase and zoem-word variants for context comparison

The temporary pronunciation dictionary was archived after generation.

Rating workflow:

The generated ElevenLabs listening pages include `++`, `+`, `-`, and `--`
buttons per clip. Ratings are stored in browser `localStorage` for that page and
shown as JSON in the page. Use `Copy JSON` or `Download JSON` after listening so
the next iteration can target only the weak clips.

To re-render an existing results file without spending API credits:

```powershell
$env:ELEVENLABS_RENDER_ONLY = "1"
$env:ELEVENLABS_OUT_DIR = ".qa-artifacts\elevenlabs-reading-iteration-v2"
$env:ELEVENLABS_SAMPLE_SET = "problem-phonemes-v2"
npm.cmd run voice:elevenlabs-reading
```

To let Codex read ratings without browser `localStorage` access:

```powershell
npm.cmd run voice:ratings-server
```

Then refresh the listening page and click `Save to Codex`. The page writes the
current rating JSON to:

```text
.qa-artifacts/tts-ratings/latest.json
```

V2 score readout:

- 26/26 clips rated.
- Counts: 7 `++`, 3 `+`, 6 `-`, 10 `--`.
- Good: normal sentence, `aa/ui/eu` carrier prompts, `buh`, `buh.`, and the `b` IPA token.
- Bad: raw isolated `ui` and `eu`, raw/IPA attempts for those vowels, and one-piece zoem blends.

Final TTS iteration:

```powershell
$env:ELEVENLABS_API_KEY = "..."
$env:ELEVENLABS_OUT_DIR = ".qa-artifacts\elevenlabs-reading-iteration-v3"
$env:ELEVENLABS_SAMPLE_SET = "problem-phonemes-v3"
$env:ELEVENLABS_MODELS = "eleven_v3"
$env:ELEVENLABS_VOICE_IDS = "pFZP5JQG7iQjIQuC4Bku"
npm.cmd run voice:elevenlabs-reading
```

Generated QA page:

```text
.qa-artifacts/elevenlabs-reading-iteration-v3/index.html
```

This run tests shorter carrier prompts such as `ui zoals in huis`, `de ui-klank`,
and chain-ready candidates such as `hhh. ui zoals in huis. sss. huis.`. If these
still do not score well, use a small human-recorded phoneme pack for the pure
reading sounds.

Human-recording route:

```powershell
npm.cmd run voice:record-reading
```

Open:

```text
http://127.0.0.1:5393/
```

The studio records mono WAV clips per phoneme and saves them under:

```text
.qa-artifacts/reading-recordings/raw/
```

Click `Maak woorden` to assemble the current reading words from those clips:

```text
.qa-artifacts/reading-recordings/words/
.qa-artifacts/reading-recordings/blends/
```

Zoem update:

Generated zoem clips made from separate phoneme recordings still sounded too
blocky. The studio therefore has a `Record Zoem` button per word. Manual
zoem-word recordings are saved under:

```text
.qa-artifacts/reading-recordings/blends-manual/
```

The final approved blend path remains:

```text
.qa-artifacts/reading-recordings/blends/
```

If a manual zoem recording exists for a word, it becomes the final blend clip.
Otherwise the improved generated fallback from `blends-generated/` is used.

Provider selection:

```powershell
$env:TTS_PROVIDERS = "deepgram,openai,elevenlabs,cartesia"
```

Expected keys:

```powershell
$env:DEEPGRAM_API_KEY = "..."
$env:OPENAI_API_KEY = "..."
$env:ELEVENLABS_API_KEY = "..."
$env:CARTESIA_API_KEY = "..."
```

Optional fixed provider voices:

```powershell
$env:ELEVENLABS_VOICE_IDS = "voiceId1,voiceId2"
$env:CARTESIA_VOICE_IDS = "voiceId1,voiceId2"
```

## Recommendation

Use a build-time voice-pack, not runtime TTS. Runtime TTS would add network,
latency, account, and pricing dependencies during child play. The final game
should only load local audio clips.

Current preferred voice after listening pass:

- Primary candidate: Deepgram `aura-2-hestia-nl` / Hestia
- Rationale: user picked Hestia as the best current Dutch female sample from the
  generated shootout.
- Route: direct Deepgram `/v1/speak`, not Voice Agent, because direct Aura-2
  Dutch generation already works reliably as MP3.
- First full pack status: generated and wired into `VoiceManager` as the primary
  speech path, with Web Speech fallback for dynamic lines.
- Reading phoneme status: generated Hestia phoneme clips were rejected after
  listening QA; Klankgrot, Letterkompas, Zoemroute, and Woordbouwplaats use
  browser-only `ReadingAudioManager` prompts instead.

Decision workflow:

1. Keep Hestia as the primary candidate.
2. Generate OpenAI, ElevenLabs, and Cartesia only when keys are available if a
   broader comparison is still wanted.
3. Compare all providers on the same five lines.
4. Pick one primary voice for normal game speech and optionally one alternate
   voice for characters.
5. Regenerate the final voice line inventory with deterministic filenames.
6. Copy only approved clips into `public/audio/voice/nl/...`.
7. Update `assets/ASSET_MANIFEST.json`.
8. Replace browser `SpeechSynthesis` as the primary path; keep it as fallback.

For BlokBlitz, judge by:

- natural Dutch pronunciation
- kind but not babyish tone
- clear numbers
- safe and warm mistake feedback
- correct isolated phoneme and digraph pronunciation
- good "zoemend lezen" transitions
