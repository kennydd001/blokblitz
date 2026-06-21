# BlokBlitz: Dino Redders van Sterrenstad

Local-first TypeScript/Vite educational action game for children aged 4-7. Number structures are the game mechanics: gates, boosts, bridges, shields, anchors, train wagons, rescues, and city restoration all depend on canonical quantities, 5+n, and 10-structure.

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

Keyboard:

- `A` / `ArrowLeft`: move left
- `D` / `ArrowRight`: move right
- `W` / `ArrowUp` / `Space`: jump, swing, or confirm action
- `Enter`: confirm selected lane or anchor
- `Escape`: return toward menu

Mouse and touch:

- Tap lanes, anchors, gates, district cards, minigame tabs, or answer cards.
- Swipe left/right in Sprint or WebWoud to move between lanes or anchors.
- Swipe up in Sprint or WebWoud to use the selected lane or anchor.

Settings:

- Speed changes runner pace.
- Sound can be muted.
- Phone vibration feedback can be turned on or off.
- High contrast can be toggled.

## Game Flow

A full session runs:

1. Number Portal
2. BlokBlitz Sprint road gates
3. WebWoud Redders swing anchors
4. Sterrenstad Bouwers
5. Summary
6. Optional parent dashboard

The main menu has one session start, a tappable mission path, and compact access to practice, parent dashboard, and settings.

Sprint and WebWoud are not quiz popups: the child moves across lane gates or swing anchors, and the structured number choice controls speed, rescue, reward, and progression.
The session starts with a `Getalpoort`: the child wakes the number stone and sees the same quantity as eggs, ten-frame, beads, and numeral before Sprint.
The practice area is `Oefenwereld`: each minigame uses themed objects such as gates, caves, bridges, shields, wagons, platforms, or rescue pens instead of generic answer cards.
Sterrenstad is a build hub: districts are city plots, and restoration choices are construction pads in a build yard.

## Architecture

- `src/game`: app shell, Three.js world, input, audio, haptics, persistence, scene manager
- `src/scenes`: Boot, menu, number of day, runner, WebWoud, city, minigames, summary, dashboard, settings
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

