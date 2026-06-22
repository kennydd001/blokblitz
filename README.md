# BlokBlitz Run

Local-first TypeScript/Vite **number-sense game for children aged 4-7**, built around a kid-first **Speeltuin (playground) hub** with several distinct game modes:

- **🐣 Tel mee** — tap each animal to count, then pick the numeral (counting & cardinality).
- **🧩 Zoek hetzelfde** — find the group with the same amount, shown across different getalbeelden (cross-representation equivalence).
- **🦖 Wat is meer?** — feed the hungry dino the bigger group (comparing).
- **🔟 Vul de tien** — fill a ten-frame to a target number (build quantity & 10-structure).
- **➕ Eentje erbij** — pick one more / one less than a number (oneMoreLess).
- **🔢 Op volgorde** — tap numbers from small to big (ordering).
- **🧠 Memory** — flip cards to match each number to a group with the same amount (cross-representation + memory).
- **🗺️ Avontuur** — a 3D voxel runner across six themed worlds, steering through **number gates** whose quantities appear as canonical cube/dice/bead/… patterns.

The calm tap modes have no timer and no game-over: a wrong tap gives a gentle nudge and a retry. A **spoken Dutch voice** reads each task aloud, counts along ("één… twee… drie…") and praises the child — the biggest help for a 4-7 year old who can't read yet. Every answer in every mode is logged by the shared adaptive education engine, so number sense *is* the gameplay and the parent dashboard stays accurate. Collect **stars** to unlock new voxel heroes and earn **stickers** for a collection book that keeps them coming back. A simple sum-based parent gate sits in front of the dashboard and settings.

## Run Locally

PowerShell on this machine blocks `npm.ps1`, so use `npm.cmd`:

```powershell
npm.cmd install
npm.cmd run dev
```

Open the local URL printed by Vite, normally `http://127.0.0.1:5173/`. If that port is occupied, run a strict alternate port such as:

```powershell
npm.cmd run dev -- --port 5273 --strictPort
```

This workspace was verified on `http://127.0.0.1:5273/` because `5173` was already serving another local app.

## Validation

```powershell
npm.cmd run verify
```

The verify script runs the full local gate:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test
npm.cmd run build
```

The requirement-by-requirement audit is maintained in `docs/ACCEPTANCE_AUDIT.md`.

Phone-like Chrome QA is available for layout and real touch hit testing:

```powershell
npm.cmd run qa:viewport
npm.cmd run qa:mobile-touch
```

`qa:mobile-touch` uses Chrome DevTools touch events, not DOM `.click()`, to play the child route from Start -> Number Portal -> Sprint -> WebWoud -> Sterrenstad build -> Summary.

`qa:viewport` captures the core desktop/mobile scenes, including 360px narrow-phone checks for menu, live Runner, Sterrenstad build, and Summary.

The child start and replay buttons also make a best-effort fullscreen request from the user gesture. Browsers may deny it, but the game treats that as optional and continues normally.

## Controls

Touch (primary, for tablet/phone):

- Swipe left / right, or tap the on-screen ◀ ▶ buttons: change lane.
- Swipe up, or tap the big SPRING button: jump over a barrier.
- Tap the menu button (top-left): pause back to the menu, no penalty.

Keyboard:

- `A` / `ArrowLeft`, `D` / `ArrowRight`: change lane.
- `W` / `ArrowUp` / `Space`: jump.
- `Escape`: back to menu.

Mistakes are always safe: a wrong gate or a bump never ends the run — it only slows you briefly and shows the correct quantity, then you keep going.

Settings (behind the parent gate, from the menu):

- Speed changes the run pace (a gentle option for younger players).
- Sound can be muted.
- Spoken voice (reading + counting + praise) can be turned on or off.
- Phone vibration feedback can be turned on or off.
- High contrast can be toggled.

## Game Flow

1. **Speeltuin hub** (home): big tappable cards for each game mode (Avontuur + the four calm tap modes), a hero garage, and `Ouders` / `Instellingen`. Each calm mode is a short set of ~5 rounds with a 1–3 star screen at the end, then back to the hub.
2. **Avontuur → world map**: six themed worlds shown as tappable cards, unlocked one by one (🌳 Grasland → 🪙 Muntgrot → ❄️ IJsbaan → 🕸️ Webwoud → 🧱 Bouwdorp → 🚀 Sterrenrace). Each world has its own look, number cap (5 → 10), gate types (subitise → count → compare) and mechanic mix (coins, web-swings, build moments).
3. **A run**: a 3-2-1 countdown, then number gates with coin trails, jumpable barriers, web-swing zips and a Minecraft build moment in between. The gate getalbeeld rotates through every pattern (dice, dots, ten-frames, fingers, beads, dominoes, eggs, numerals, paws…). A wrong gate or a bump is safe — it only slows you briefly and shows the correct quantity.
4. **Results**: a 1–3 star rating, stars/blocks earned, distance and best record, and any newly unlocked world or hero — then `Volgende!`, `Nog eens!` or back to the map. Finishing a world unlocks the next.

Pace is tuned for young children: the runner is gentle by default (and the Settings speed can slow it further), and the calm modes are untimed.

The number gates *are* the running. The child reads the spoken-style target (e.g. `Ren door de 5!`) plus the canonical cube pattern shown on each lane, then steers into the matching gate. Picking the lane with the biggest group teaches comparing; matching the pattern teaches subitising and counting. Stars unlock new heroes; collected blocks and best distance persist between runs.

The full representation/mastery/adaptive education engine drives every gate underneath, and the earlier guided "Sterrenstad" practice scenes plus the parent dashboard remain in the codebase and reachable.

## Architecture

- `src/game`: app shell, Three.js world, input, audio, haptics, persistence, scene manager
- `src/runner`: the revamped real-time runner — pure `RunnerCore` simulation, `RunnerView` voxel rendering, the adaptive gate provider, and unlockable hero skins
- `src/scenes`: Boot, `HubScene` (Speeltuin), `MainMenuScene` (world map), `RunScene`, `ResultsScene`, plus the retained guided scenes (number of day, legacy runner, WebWoud, city, minigames, summary, dashboard, settings)
- `src/scenes/minigames`: the calm tap modes — `MiniGameScene` base + `miniUi` (shared done screen) + `CountScene`, `MatchScene`, `CompareScene`, `FillScene`, `OneMoreLessScene`, `OrderScene`, `MemoryScene`, and `miniChallenges` (their Challenge builders)
- `src/education`: educational types, canonical layouts, mastery tracker, adaptive engine, challenge factory, misconception detection
- `src/education/representations`: reusable SVG renderers for all 12 quantity representations
- `src/gameplay`: layer-specific mechanic labels and templates
- `assets/ASSET_MANIFEST.json`: local asset and license record
- `docs`: spec, plan, implementation runbook, and live status

## Learning Model

The shared `MasteryTracker` logs every attempt with skill, representation, range, quantity, prompt, answer, correctness, reaction time, hint use, and misconception. The `AdaptiveEngine` reads those attempts and shifts future challenges toward weak skills while avoiding exact-repeat loops.

Tracked skills:

- Subitizing
- Make 10
- Part-whole decomposition
- Compare
- One more / one less
- Quantity to numeral
- Numeral to quantity
- Build quantity

Mastery levels:

- Emerging: fewer than 5 exposures or accuracy below 70 percent
- Secure: at least 5 exposures, accuracy at least 75 percent, hint rate below 30 percent
- Fluent: at least 8 exposures, accuracy at least 85 percent, fast reaction time, hint rate below 15 percent

## Quantity Representations

All representations render quantities 1-10 using canonical arrangements by default:

- Dot cards
- Dice patterns
- Domino patterns
- Fingers
- Five-frames
- Ten-frames
- Bead strings
- Block stacks
- Egg nests
- Paw-print groups
- Numerals
- Mixed representation cards

Numbers are arranged as 1 single, 2 pair, 3 triangle, 4 square or 2+2, 5 complete group, 6 as 5+1, 7 as 5+2, 8 as 5+3 or 4+4, 9 as 5+4, and 10 as 5+5.

## Adding a Representation

1. Add the representation name to `Representation` and `REPRESENTATIONS` in `src/education/types.ts`.
2. Add canonical layout helpers if needed in `src/education/quantityLayouts.ts`.
3. Add an SVG renderer in `src/education/representations/svgGenerators.ts`.
4. Export it through `RepresentationFactory`.
5. Add tests confirming quantities 1-10 render.

## Adding a Challenge

1. Add a template id to `MINIGAME_TYPES` in `src/education/types.ts`.
2. Add a config to `templateConfigs` in `src/education/challengeFactory.ts`.
3. Map it to a skill in `AdaptiveEngine` if it should be selected adaptively.
4. Add it to scene or layer rotations if needed.
5. Ensure it calls `game.recordAttempt`, not a custom logger.

## Asset Policy

Runtime assets are local. Current visuals are generated from SVG, CSS, Three.js primitives, Web Audio, and optional browser vibration patterns. No downloaded external assets are used. The manifest is `assets/ASSET_MANIFEST.json`.

The production build also registers a local same-origin service worker from `public/sw.js` to cache the app shell for installed/offline play. It does not cache or request any remote assets.

External assets may be added only when the license is clear and permissive. Store the asset locally and document source, license, author, download date, used files, and notes in the manifest.

