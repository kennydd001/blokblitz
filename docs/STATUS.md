# Status

## Current Milestone

Product Quality Hardening - mobile/adaptive UX in progress.

## Completed Work

- Read the attached Codex goal objective.
- Confirmed the repository started empty except for Git metadata.
- Created the required durable files: `AGENTS.md`, `docs/GAME_SPEC.md`, `docs/PLAN.md`, `docs/IMPLEMENT.md`, `docs/STATUS.md`, and `assets/ASSET_MANIFEST.json`.
- Scaffolded a local-first TypeScript, Vite, Three.js game app.
- Implemented the required education types, canonical quantity layouts, 12 reusable representations, MasteryTracker, misconception detection, AdaptiveEngine, challenge logging, and ChallengeFactory.
- Implemented required scenes: Boot, Main Menu, Number of Day, BlokBlitz Sprint, WebWoud, Sterrenstad, Minigame, Summary, Parent Dashboard, and Settings.
- Implemented the 3-lane runner mechanics, WebWoud anchor rescue, persistent city districts, all 12 minigame templates, settings, generated audio cues, and localStorage persistence.
- Made the WebWoud rescue sequence deterministic across all nine required anchor decision types instead of relying on random challenge selection.
- Added an explicit parent-dashboard recent-progress panel backed by saved attempt logs.
- Added README setup, controls, architecture, asset policy, representation/challenge extension notes, and learning model documentation.
- Added automated tests for representation coverage, all minigames logging to MasteryTracker, Subitize Snap fluency, adaptive make-10 selection, boundary-safe challenge generation, full WebWoud decision-plan coverage, and localStorage persistence.
- Added an acceptance-audit test for required durable files, scene registration, education dimensions, city districts, local asset policy, and README sections.
- Added a jsdom runtime-flow test that instantiates the real `Game` class with a mocked Three.js renderer, navigates core scenes, launches a minigame, records an attempt, verifies dashboard mastery data, opens city/settings, and updates saved settings.
- Added runner-mechanic coverage for every required BlokBlitz Sprint mechanic and runtime reward coverage for fast Subitize Snap plus safe wrong-attempt handling.
- Added DOM playthrough coverage that launches every minigame through the real MinigameScene, completes every runner mechanic, completes every deterministic WebWoud anchor decision, and restores a city district through real option clicks.
- Added workflow coverage for menu-to-session navigation, keyboard lane/pause controls, and parent-dashboard JSON export/reset with confirmation.
- Added broader adaptive-engine coverage for weak/fluent timing changes, concrete representation scaffolding, no-repeat minigame selection, and weak-skill focus guidance.
- Added a visible Subitize Snap burst with local CSS particles in the runner UI, plus DOM coverage proving the burst renders after fast recognition.
- Split Three.js into a dedicated production chunk so Vite builds without the previous chunk-size warning.
- Added `.gitignore` for generated dependency/build output.
- Added `docs/ACCEPTANCE_AUDIT.md` to map each completion criterion to concrete evidence and the remaining visual-QA blocker.
- Added `npm.cmd run verify` support through the `verify` package script and documented it in the README.
- Added the acceptance audit file to the durable-file acceptance test.
- Made Sterrenstad district restoration deterministic by district so named city areas consistently route to their intended number-structure task.
- Added automated acceptance tests for deterministic city restoration examples, local-only runtime source policy, full parent-dashboard readout coverage, and scaffolded retry behavior after wrong scene choices.
- Connected successful number-structure city restoration to level unlocking and surfaced the current level on the main menu.
- Added runtime/persistence coverage for level unlocks, speed/mute/high-contrast settings, and the full runner-to-WebWoud-to-city-to-summary session path.
- Added a Number of Day naming practice activity with Dutch number names that logs through the shared MasteryTracker attempt pipeline.
- Added tests for Dutch quantity names and tracked Number of Day naming attempts.
- Added Vite `allowedHosts` support for `trycloudflare.com` so Cloudflare tunnel QA can reach the local dev server.
- Completed browser UI/gameplay QA through the Cloudflare URL on desktop and mobile-sized viewports.
- Started a new product-readiness pass after real-phone feedback showed the runner still felt like stacked quiz cards on mobile.
- Added child-facing adaptive focus labels in `src/education/focusLabels.ts`.
- Added visible Dino Coach panels to the main menu, runner, and minigame surfaces so adaptive focus is obvious to children and parents.
- Updated minigames to apply adaptive representation and display-time choices when generating the next challenge.
- Reworked mobile runner layout so lane choices stay as three compact left/middle/right lanes instead of becoming a vertical answer stack.
- Added lane names and accessible labels to answer buttons.
- Fixed the runner HUD so `Afstand` updates without overwriting the `Streak` stat.
- Added regression tests for Dino Coach visibility, lane labels, lane mode, and runner HUD labels.
- Added Dino Coach adaptive focus panels to WebWoud, Sterrenstad, the summary screen, and the parent dashboard.
- Added explicit left/middle/right anchor labels and accessible names to WebWoud choices.
- Translated challenge mechanics, success feedback, scaffolds, hints, adaptive recommendations, and city restoration tasks into simple Dutch UI copy.
- Replaced raw parent-dashboard skill/representation enum labels with child/parent-facing Dutch labels.
- Reworked mobile WebWoud and Sterrenstad breakpoints so anchor choices, city districts, and city challenge options remain large and scannable.
- Fixed mobile Sterrenstad district selection so the chosen city challenge scrolls into view instead of appearing partly above the phone viewport.
- Added regression tests for WebWoud coach/anchor labels, city coach/selected districts, dashboard guide, summary coach, and Dutch scaffold copy.
- Added a shared reward-strip UI with compact earned-reward badges.
- Added visible reward strips after Number of the Day naming, runner choices, WebWoud rescues, minigame success, and Sterrenstad restoration.
- Made Sterrenstad restoration rewards persist after the challenge closes so the city-build payoff remains visible.
- Tightened the mobile Number of the Day layout so reward feedback fits in the first phone viewport.
- Added regression tests for reward strips across naming, runner, WebWoud, city restoration, minigames, and Subitize Snap.
- Added a tappable four-step mission path to the main menu: Getal, Sprint, WebWoud, Stad.
- Added local CSS-drawn Dino Coach face badges to coach surfaces instead of adding external art assets.
- Added regression coverage for the menu mission path.
- Added a shared visual scaffold-strip UI for wrong choices with simple retry cues: `Kijk`, `Eerst 5`, and `Nog eens`.
- Added scaffold strips to BlokBlitz, WebWoud, Sterrenstad, and Minigames after wrong choices, while keeping reward strips hidden on misses.
- Added regression coverage proving wrong choices show scaffold strips across runner, WebWoud, city, and minigames.
- Added visible Sterrenstad post-restoration next actions so `Missie afronden` appears directly beside the city reward instead of only in the bottom action row.
- Updated the full runner-to-WebWoud-to-city-to-summary DOM playthrough to finish through the new city reward action.
- Added shared mobile pointer-swipe controls: left/right swipes move Sprint lanes and WebWoud anchors, and up swipes use the selected lane/anchor.
- Added action-scene touch handling so Sprint and WebWoud gestures are not treated as browser page gestures.
- Added regression coverage for swipe gesture mapping and real runner lane movement through pointer swipes.
- Simplified the main menu into one primary session button, the four-step mission path, and a compact utility row for `Oefenen`, `Ouders`, and `Instellingen`.
- Removed duplicate direct Sprint/WebWoud/Sterrenstad buttons from the child-facing menu because those destinations are already reachable through the mission path.
- Added regression coverage proving the compact menu tools render, duplicate direct Sprint access is gone, and mission step 2 still opens Sprint.
- Added a shared procedural celebration burst for ordinary correct choices, using local CSS shapes instead of external assets.
- Wired celebration bursts into BlokBlitz, WebWoud, Sterrenstad, and Minigames while keeping the stronger Subitize Snap burst reserved for fast recognition.
- Added regression coverage proving correct minigame, WebWoud, and city choices show celebration bursts, and wrong runner choices do not.
- Added a shared in-session mission ribbon for Getal, Sprint, WebWoud, and Stad so the child can see the current session step outside the main menu.
- Rendered the mission ribbon in Number of Day, BlokBlitz Sprint, WebWoud, Sterrenstad, and Summary, with completed/active/todo states.
- Added regression coverage for ribbon active-step state across Number of Day, Sprint, WebWoud, City, and Summary.
- Added a shared icon-style action pad for Sprint lanes and WebWoud anchors, with CSS-drawn left/right/confirm controls and accessible labels.
- Replaced the text-heavy `Kies baan` and `Kies anker` action rows with the action pad plus a compact `Menu` escape button.
- Added regression coverage proving Sprint and WebWoud render the action pad, expose left/confirm/right actions, and still change the selected lane/anchor.
- Upgraded local Web Audio feedback to richer multi-note cues for success, Subitize Snap, rescues, gentle retries, and city building.
- Centralized correct-attempt cue selection in `Game.recordAttempt` so mastery logging, rewards, and audio all come from the same learning event.
- Removed the duplicate Sterrenstad build sound call so city restoration now produces one intentional build cue.
- Added regression coverage for procedural cue definitions and scene-specific audio routing through the shared attempt pipeline.
- Added optional mobile haptic feedback with short local vibration patterns for success, Subitize Snap, rescue, build, and gentle retry outcomes.
- Added a persisted `Trillen` setting and wired it through Settings, SaveManager migration, and the shared attempt pipeline.
- Added a visual selected-choice beacon for Sprint lanes and WebWoud anchors so the current lane/anchor is clearer on mobile without adding more reading.
- Added a reduced-motion CSS guard for child feedback animations.
- Documented generated browser vibration cues in `README.md` and `assets/ASSET_MANIFEST.json`.
- Added regression coverage for haptic patterns/settings, haptic attempt routing, selected-choice beacons, and persisted haptic settings.
- Reworked Sprint and WebWoud choices after user feedback that the experience still felt like clicking cards instead of playing a game.
- Changed Sprint lane choices into a shared road/gate playfield with lane roads, gate arches, selected hero marker, and game-field metadata while preserving tap, swipe, keyboard, and adaptive attempt logging.
- Changed WebWoud anchor choices into a shared canopy/swing playfield with vines, anchor rings, selected swing hero marker, and game-field metadata while preserving tap, swipe, keyboard, and adaptive attempt logging.
- Tightened the mobile playfield heights so the road/canopy fields and action pads fit in the first phone viewport without horizontal overflow.
- Added regression coverage proving Sprint renders road lanes/gate arches and WebWoud renders vines/anchor rings.
- Reworked the minigame practice surface from `Minigames` plus an option grid into `Oefenwereld` with a reusable world field and themed game objects.
- Added Dutch child-facing labels for all 12 minigame tabs.
- Rendered minigame choices as local CSS world objects such as gates, caves, bridges, shields, chests, anchors, wagons, waves, build spots, platforms, tracks, and rescue pens.
- Fixed mobile minigame tabs by turning the 12-template selector into a horizontal scroll strip so the practice field and actions stay visible in the first phone viewport.
- Added regression coverage proving every launched minigame renders a `minigame-field` with playable `mini-object` buttons.
- Reworked Sterrenstad from a plain district-card grid plus answer grid into a city map and construction-yard interaction.
- Rendered districts as local CSS city plots on a `sterrenstad` map, with restored/selected plot states preserved.
- Rendered restoration choices as construction build pads inside a `restoration-yard` with a crane, road, and build objects instead of generic answer cards.
- Capped the mobile city map to a scrollable panel and tightened plot sizing so the city hub stays navigable on a phone.
- Added regression coverage proving Sterrenstad renders city plot shells, the restoration yard, and build-choice buttons while preserving the district restoration flow.
- Reworked Number of Day from a static naming panel into a `Getalpoort` world reveal.
- Added a local CSS number portal, number stone, ground, and four structure runes for eggs, ten-frame, beads, and numeral.
- Changed the naming action into a portal wake interaction (`Wek ...` / `Poort wakker`) while preserving the shared attempt logging and reward flow.
- Added regression coverage proving the Number Portal, four runes, awake state, and reward logging render through the normal session start.
- Removed the live Sprint `Onthoud ?` target cover so flash-gate play always keeps the concrete target representation visible in the compact HUD while Subitize Snap remains timing-based.
- Changed live target HUD language from abstract `Doel` to direct child-facing `Zoek` for Runner, WebWoud, and Oefenwereld, and `Bouw` for Sterrenstad build mode.
- Added regression coverage proving the live Sprint target is visible, renders a quantity SVG, and does not render a memory question mark.
- Reworked live mobile controls from a two-button movement pad into a three-button symbolic pad: left, scene-specific action, right. Runner uses `Spring`, WebWoud uses `Zwaai`, Oefenwereld uses `Pak`, and Sterrenstad build uses `Bouw`, while the existing lane/anchor/object learning logic stays unchanged.
- Restyled the directional pad icons so left/right read as arrows with shafts instead of play-like triangles.
- Strengthened viewport QA to require `left, act, right` pad actions and a labelled central action button in live play scenarios.
- Made the Sprint central action contextual for all 11 runner mechanics by reusing the micro-goal layer: `Poort open`, `Boost pakken`, `Schild vol`, `Brug bouwen`, `Spring goed`, `Kist kraken`, `Golf voorbij`, `Volgende stap`, `Kooi open`, `Geheime route`, and `Dino maatje`.
- Added local CSS control icons for Sprint action kinds: gate, boost, shield, bridge, jump, split, wave, rescue, route, and match/build variants. This keeps the mobile control grammar game-like without external assets.
- Added regression coverage proving every runner mechanic renders a central action button whose label and icon class match `runnerMicroGoals`.
- Added adaptive live-pressure pacing for Runner, WebWoud, Oefenwereld, and Sterrenstad build mode. Live auto-run/dash progress now uses `AdaptiveEngine.displayTimeFor`: weak mastery slows the route window, while fluent mastery tightens the timing.
- Improved adaptive timing fallback so a newly introduced representation still inherits mastery pressure from the same skill and quantity range instead of resetting to neutral timing.
- Strengthened viewport QA to require every live play scenario to expose an adaptive window in the HUD metrics.

## Decisions Made

- Use TypeScript, Vite, Three.js, localStorage, procedural SVG, Three.js primitives, CSS, and Web Audio.
- Use `npm.cmd` on Windows because PowerShell blocks `npm.ps1` execution in this environment.
- Use generated/procedural local assets only. No external art or audio assets are used.
- Keep educational logic in `src/education` and rendering/scene flow in `src/scenes`, `src/game`, and `src/gameplay`.
- Start this project on port `5273` for local verification because port `5173` was already serving a different local app.
- Use `docs/ACCEPTANCE_AUDIT.md` as the durable requirement-by-requirement evidence trail, with browser visual QA tracked as the remaining required proof.
- Bind each Sterrenstad district to a specific challenge template instead of using random restoration task selection.
- Treat Sterrenstad restoration as the level-unlock gate so progression remains tied to number-structure play.
- Treat Number of Day naming as `quantityToNumeral` practice so it fits the required `Skill` union while still explicitly training quantity names.
- Use the Cloudflare tunnel only as an ephemeral QA/share route. It is not a runtime dependency of the game.
- Treat real phone feedback as authoritative product input, not just a browser-test edge case.
- Keep answer choices lane-like on mobile for runner gameplay; do not collapse lanes into a one-column quiz stack.
- Do not expose raw internal education enum names such as `subitize` or `dots` in child-facing or parent-facing UI.
- On mobile, selecting a Sterrenstad district should bring the active challenge into view immediately because the challenge is the next action.
- Correct choices should show what the child earned immediately in the same scene; wrong choices should stay scaffolded and retryable without reward noise.
- Reward badges must stay compact enough for phone screens and should not turn successful gameplay back into a tall quiz-card stack.
- The main menu should show the session route visually, not only as a vertical list of named scenes.
- Coach character visuals should remain procedural/local and lightweight.
- Wrong choices should produce visual retry scaffolds, not only explanatory text.
- Wrong-choice scaffold panels must not overlap reward feedback or create cramped phone layouts.
- After a city district is restored, the primary next action must appear where the child is already looking: beside the reward feedback.
- Mobile action controls should feel game-like: swipes map to the same shared actions as keyboard controls while taps remain available on visible cards and buttons.
- The child-facing main menu should favor one clear session start and a visual mission path instead of duplicating the same destinations in multiple button lists.
- Correct choices should get a visible, playful payoff beyond text, but the payoff must stay compact and must not appear on scaffolded mistakes.
- The mission path should stay visible during the session, not only on the main menu, so children can anticipate what comes next.
- Core action scenes should expose game-like icon controls in addition to direct lane/anchor taps and swipes, so mobile play does not feel like only reading text buttons.
- Directional controls must not look like media play buttons. Live mobile controls should read as left/action/right at a glance for a child.
- Runner actions should not all feel like the same generic jump. The central action button should follow the active mechanic so number-structure play reads as opening, boosting, shielding, bridging, splitting, rescuing, or routing.
- Adaptive learning must affect live play pressure, not only future menu/minigame selection. If mastery is weak, the route should give more time; if mastery is fluent, the live action can safely tighten.
- Audio cues should stay procedural/local and distinct by learning outcome: Snap is bright, rescues are warm, building is block-like, and retries are gentle.
- Scene-specific sound routing belongs in the shared attempt pipeline instead of individual scenes duplicating reward logic.
- Mobile vibration should be optional, short, and tied to the same learning outcome as audio/reward feedback.
- Selected lane/anchor cues should be symbolic and visual, not another text instruction layer.
- Motion polish should include a reduced-motion fallback.
- User feedback showed that styling answer options as cards is not enough; core action choices must be staged as game-world objects such as gates, roads, vines, and anchors.
- Game-field visuals must not push mobile action controls below the first phone viewport.
- Practice/minigame choices should also be staged as world objects, not generic answer cards.
- Long template selectors should scroll horizontally on mobile instead of pushing gameplay below the fold.
- Sterrenstad should behave like a reward/build hub: districts are map plots and restoration choices are construction sites, not cards.
- Large hub maps need internal mobile scrolling so the active restoration task and controls remain reachable.
- A session should start as a world interaction. Number of Day should wake a portal/stone, not look like a worksheet panel.
- Fast recognition should not make the live target disappear into a question-mark memory card for this age group. Keep Subitize Snap timing-based while leaving the target representation visible and game-like.

## Validation Results

- `node --version`: v24.14.0.
- `npm.cmd --version`: 11.9.0.
- `npm.cmd install`: passed. Installed Vite, TypeScript, Vitest, Three.js, Three.js types, Node test typings, and jsdom.
- `npm.cmd run typecheck`: passed.
- `npm.cmd run lint`: passed. The lint script is currently a strict TypeScript no-emit check.
- `npm.cmd run test`: passed, 3 test files / 28 tests.
- `npm.cmd run build`: passed without warnings. Output splits app code and Three.js into separate local chunks.
- `npm.cmd run verify`: passed. This ran typecheck, lint, tests, and production build.
- Dev server smoke: `http://127.0.0.1:5273/` returned HTTP 200 and served this project's `BlokBlitz` HTML.
- Cloudflare smoke: `https://translations-estimates-surgeons-relief.trycloudflare.com` returned HTTP 200 and served this project's `BlokBlitz` HTML.
- Browser QA: passed on desktop and mobile-sized viewports. Checked main menu, Number of Day naming, BlokBlitz Sprint, safe runner miss, Subitize Snap, WebWoud rescue, Sterrenstad restoration, summary, parent dashboard, settings, and mobile minigames. No console errors, no horizontal overflow, no tiny visible buttons, no visible button overlap, and canvas rendered at nonzero size.
- Product hardening validation: `npm.cmd run verify` passed after the mobile/adaptive UI changes, with 3 test files / 28 tests and production build.
- Real Chrome mobile-sized runner QA at `390x844` passed through Cloudflare: lane cards are on one row, card size is 113x118, HUD labels are `Baan`, `Snelheid`, `Afstand`, `Streak`, no horizontal overflow, no tiny buttons, and no visible button overlap. Screenshot artifact: `%TEMP%\\blokblitz-mobile-runner-fixed.png`.
- Product hardening validation, second pass: `npm.cmd run verify` passed after WebWoud/Sterrenstad/dashboard/summary hardening, with 3 test files / 28 tests and production build.
- In-app Browser mobile QA at `390x844` passed for WebWoud: anchor cards stayed on one row, each 113x118, with `Links`, `Midden`, `Rechts`, visible Dino Coach, no horizontal overflow, and no tiny buttons.
- In-app Browser mobile QA at `390x844` passed for Sterrenstad: 14 districts rendered in a two-column layout with 175x144 cards, selected district challenges scrolled to the top of the viewport, challenge options were 154x142, no horizontal overflow, and no tiny buttons.
- In-app Browser mobile QA at `390x844` passed for parent dashboard and summary: Dino Coach guide panels were visible, no raw `subitize`/`dots` enum labels leaked into the dashboard guide, no horizontal overflow, no tiny buttons, and browser console error count was 0.
- Product hardening validation, reward pass: `npm.cmd run verify` passed after reward UI changes, with 3 test files / 28 tests and production build.
- In-app Browser mobile QA at `390x844` passed for reward strips: Number of the Day reward was fully in viewport at 321x80, runner reward was 345x78, WebWoud reward was 345x78, Sterrenstad reward was 330x78, and minigame reward was 319x78. All reward surfaces had no horizontal overflow, no tiny buttons, and browser console error count was 0.
- Product hardening validation, mission/coach polish pass: `npm.cmd run verify` passed after menu mission path and coach visual updates, with 3 test files / 28 tests and production build.
- In-app Browser mobile QA at `390x844` passed for the main menu mission path: four steps stayed on one row, each 76x86, the mission map was 321x86, no horizontal overflow, no tiny buttons, CSS Dino Coach face width was 27px, mission step 2 opened `BlokBlitz Sprint`, and browser console error count was 0.
- Product hardening validation, scaffold pass: `npm.cmd run verify` passed after visual scaffold UI changes, with 3 test files / 28 tests and production build.
- In-app Browser mobile QA at `390x844` passed for wrong-choice scaffold strips: runner scaffold was 351x115, WebWoud scaffold was 351x115, Sterrenstad scaffold was 315x107, minigame scaffold was 324x107. All scaffold surfaces had no horizontal overflow, no tiny buttons, reward strips hidden after wrong choices, and browser console error count was 0.
- Product hardening validation, city finish-action pass: `npm.cmd run verify` passed after Sterrenstad next-action changes, with 3 test files / 28 tests and production build.
- In-app Browser mobile QA at `390x844` passed for the Sterrenstad restoration finish flow: city reward was 337x79, `Missie afronden` and `Nog een wijk` buttons were visible at 337x48 each, no horizontal overflow, browser console error count was 0, and tapping `Missie afronden` opened the `Missie klaar` summary without overflow.
- Cloudflare smoke after the city finish-action pass: `https://translations-estimates-surgeons-relief.trycloudflare.com` returned HTTP 200.
- Product hardening validation, mobile swipe pass: `npm.cmd run verify` passed after shared pointer-swipe input changes, with 3 test files / 29 tests and production build.
- In-app Browser mobile QA at `390x844` passed for swipe gestures: Sprint opened with middle lane selected, left swipe selected lane 0, right swipe returned to lane 1, up swipe triggered visible reward/feedback, WebWoud left/right swipes selected anchors 0 and 1, `touch-action` was `none` on both action scenes, no horizontal overflow, and browser console error count was 0.
- Cloudflare smoke after the mobile swipe pass: `https://translations-estimates-surgeons-relief.trycloudflare.com` returned HTTP 200.
- Product hardening validation, compact menu pass: `npm.cmd run verify` passed after main-menu simplification, with 3 test files / 29 tests and production build.
- In-app Browser mobile QA at `390x844` passed for the compact main menu: 8 total buttons, play button 336x56, mission map 336x86, mission steps 80x86 each, utility buttons 108x46 each, no duplicate `BlokBlitz Sprint` button, no horizontal overflow, browser console error count was 0, and mission step 2 opened `BlokBlitz Sprint`.
- Cloudflare smoke after the compact menu pass: `https://translations-estimates-surgeons-relief.trycloudflare.com` returned HTTP 200.
- Product hardening validation, celebration pass: `npm.cmd run verify` passed after adding shared celebration bursts, with 3 test files / 29 tests and production build.
- In-app Browser mobile QA at `390x844` passed for minigame celebration feedback: reward strip was 324x79, celebration burst was visible at 82x76 with 6 local CSS pieces and `TOP` center text, no horizontal overflow, and browser console error count was 0.
- Cloudflare smoke after the celebration pass: `https://translations-estimates-surgeons-relief.trycloudflare.com` returned HTTP 200.
- Product hardening validation, mission ribbon pass: `npm.cmd run verify` passed after adding the in-session mission ribbon, with 3 test files / 29 tests and production build.
- In-app Browser mobile QA at `390x844` passed for the mission ribbon: Number of Day showed active step 1, Sprint showed step 1 done and step 2 active, ribbon was 374x67 with four visible 90x67 steps, no horizontal overflow, Sprint stage remained visible at 374x402, and browser console error count was 0.
- Cloudflare smoke after the mission ribbon pass: `https://translations-estimates-surgeons-relief.trycloudflare.com` returned HTTP 200.
- Product hardening validation, action-pad pass: `npm.cmd run verify` passed after adding shared Sprint/WebWoud action pads, with 3 test files / 29 tests and production build.
- In-app Browser mobile QA at `390x844` passed for the Sprint action pad: pad was 374x50, buttons were 113x50 / 136x50 / 113x50, Menu was 374x47, no horizontal overflow, and browser console error count was 0.
- In-app Browser mobile QA at `390x844` passed for the WebWoud action pad: pad was 374x50, buttons were 113x50 / 136x50 / 113x50, Menu was 374x53, left/right controls moved selected anchor from 1 to 0 and back to 1, no horizontal overflow, and browser console error count was 0.
- Cloudflare smoke after the action-pad pass: `https://translations-estimates-surgeons-relief.trycloudflare.com` returned HTTP 200.
- Product hardening validation, audio pass: `npm.cmd run typecheck` passed after the procedural audio refactor.
- Product hardening validation, audio pass: `npm.cmd run test` passed with 4 test files / 32 tests.
- Product hardening validation, audio pass: `npm.cmd run verify` passed after adding cue-pattern and cue-routing coverage, with 4 test files / 32 tests and production build.
- Local smoke after the audio pass: `http://127.0.0.1:5273/` returned HTTP 200 and served the BlokBlitz HTML.
- Cloudflare smoke after the audio pass: `https://translations-estimates-surgeons-relief.trycloudflare.com` returned HTTP 200 and served the BlokBlitz HTML.
- Product hardening validation, haptics/beacon pass: `npm.cmd run typecheck` passed.
- Product hardening validation, haptics/beacon pass: `npm.cmd run test` passed with 4 test files / 34 tests.
- Product hardening validation, haptics/beacon pass: `npm.cmd run verify` passed with 4 test files / 34 tests and production build.
- Local smoke after the haptics/beacon pass: `http://127.0.0.1:5273/` returned HTTP 200 and served the BlokBlitz HTML.
- Cloudflare smoke after the haptics/beacon pass: `https://translations-estimates-surgeons-relief.trycloudflare.com` returned HTTP 200 and served the BlokBlitz HTML.
- In-app Browser mobile QA at `390x844` passed after the haptics/beacon pass: Sprint selected beacon was visible at 40x25, left action-pad moved selection from lane 1 to lane 0 with the beacon still visible, WebWoud selected beacon was visible, `Trillen` setting was present and checked, no horizontal overflow, minimum visible button height was at least 47px in Sprint and 50px in WebWoud, and browser console error count was 0.
- Product hardening validation, game-field pass: `npm.cmd run typecheck` passed.
- Product hardening validation, game-field pass: `npm.cmd run test` passed with 4 test files / 34 tests.
- Product hardening validation, game-field pass: `npm.cmd run verify` passed with 4 test files / 34 tests and production build.
- Local smoke after the game-field pass: `http://127.0.0.1:5273/` returned HTTP 200 and served the BlokBlitz HTML.
- Cloudflare smoke after the game-field pass: `https://translations-estimates-surgeons-relief.trycloudflare.com` returned HTTP 200 and served the BlokBlitz HTML.
- In-app Browser mobile QA at `390x844` passed after the game-field pass: Sprint rendered `runner-road` with 3 lane roads, 3 gate arches, selected hero marker, 224px field height, 202px lane buttons, fully visible action pad, and no horizontal overflow; WebWoud rendered `web-canopy` with 3 vines, 3 anchor rings, selected swing hero marker, 224px field height, 202px anchor buttons, fully visible action pad, and no horizontal overflow; browser console error count was 0.
- Product hardening validation, minigame world pass: `npm.cmd run typecheck` passed.
- Product hardening validation, minigame world pass: `npm.cmd run test` passed with 4 test files / 34 tests.
- Product hardening validation, minigame world pass: `npm.cmd run verify` passed with 4 test files / 34 tests and production build.
- Local smoke after the minigame world pass: `http://127.0.0.1:5273/` returned HTTP 200 and served the BlokBlitz HTML.
- Cloudflare smoke after the minigame world pass: `https://translations-estimates-surgeons-relief.trycloudflare.com` returned HTTP 200 and served the BlokBlitz HTML.
- In-app Browser mobile QA at `390x844` passed after the minigame world pass: Oefenwereld rendered a `minigame-field` at 352x232 with 3 `mini-object` world choices, mini hero visible, horizontal Dutch tab strip at 374x63, actions visible in the first viewport, no horizontal overflow, minimum visible button height 45px, reward/celebration appeared after a correct mini-object click, and browser console error count was 0.
- Product hardening validation, Sterrenstad world pass: `npm.cmd run typecheck` passed.
- Product hardening validation, Sterrenstad world pass: `npm.cmd run test` passed with 4 test files / 34 tests.
- Product hardening validation, Sterrenstad world pass: `npm.cmd run verify` passed with 4 test files / 34 tests and production build.
- Local smoke after the Sterrenstad world pass: `http://127.0.0.1:5273/` returned HTTP 200 and served the BlokBlitz HTML.
- Cloudflare smoke after the Sterrenstad world pass: `https://translations-estimates-surgeons-relief.trycloudflare.com` returned HTTP 200 and served the BlokBlitz HTML.
- In-app Browser mobile QA at `390x844` passed after the Sterrenstad world pass: city map rendered `sterrenstad` with 14 plot shells, map panel was capped at 359x390 with internal scrolling, first plot was 157x136, restoration yard rendered at 315x222 with 3 build choices and crane, field/actions were visible, no horizontal overflow, and browser console error count was 0.
- Product hardening validation, Number Portal pass: `npm.cmd run typecheck` passed.
- Product hardening validation, Number Portal pass: `npm.cmd run test` passed with 4 test files / 34 tests.
- Product hardening validation, Number Portal pass: `npm.cmd run verify` passed with 4 test files / 34 tests and production build.
- Local smoke after the Number Portal pass: `http://127.0.0.1:5273/` returned HTTP 200 and served the BlokBlitz HTML.
- Cloudflare smoke after the Number Portal pass: `https://translations-estimates-surgeons-relief.trycloudflare.com` returned HTTP 200 and served the BlokBlitz HTML.
- In-app Browser mobile QA at `390x844` passed after the Number Portal pass: portal panel 374x534, portal 348x150, 4 structure runes, wake button 180x53, no horizontal overflow, reward after waking, portal awake state visible, Sprint button visible at 138x53, and browser console error count was 0.
- Product hardening validation, menu/finish-world pass: `npm.cmd run typecheck` passed.
- Product hardening validation, menu/finish-world pass: `npm.cmd run test` passed with 4 test files / 34 tests.
- Product hardening validation, menu/finish-world pass: `npm.cmd run verify` passed with 4 test files / 34 tests and production build.
- Local smoke after the menu/finish-world pass: `http://127.0.0.1:5273/` returned HTTP 200 and served the BlokBlitz HTML.
- Cloudflare smoke after the menu/finish-world pass: `https://translations-estimates-surgeons-relief.trycloudflare.com` returned HTTP 200 and served the BlokBlitz HTML.
- In-app Browser mobile QA at `390x844` passed after the menu/finish-world pass: the main menu rendered a `sterrenroute` mission world with 4 route nodes, menu actions 359x326, mission map 321x154, play button 321x64, no horizontal overflow, and no tiny buttons; the completion summary rendered a `finish` reward world at 374x224 with visible dino, gate, city, and rescue token, scoreboard 374x152, coach 374x201, no horizontal overflow, no tiny buttons, and browser console error count was 0.
- Product hardening validation, action-field loop pass: `npm.cmd run typecheck` passed.
- Product hardening validation, action-field loop pass: `npm.cmd run test` passed with 4 test files / 35 tests.
- Product hardening validation, action-field loop pass: `npm.cmd run verify` passed with 4 test files / 35 tests and production build.
- Local smoke after the action-field loop pass: `http://127.0.0.1:5273/` returned HTTP 200 and served the BlokBlitz HTML.
- Cloudflare smoke after the action-field loop pass: `https://translations-estimates-surgeons-relief.trycloudflare.com` returned HTTP 200 and served the BlokBlitz HTML.
- In-app Browser mobile QA at `390x844` passed after the action-field loop pass: Sprint rendered a timed `runner-road` action field with approach phase, progress advanced to 29%, field 337x194, 3 lane buttons 104x172, progress meter 311x9, action pad 359x50, Menu button fully in viewport at bottom 843, no horizontal overflow, no tiny buttons, and browser console error count was 0; WebWoud rendered a timed `web-canopy` action field with approach phase, progress advanced to 25%, field 352x224, 3 anchor buttons 109x202, progress meter 291x6, action pad 374x50, Menu button fully in viewport at bottom 814, no horizontal overflow, no tiny buttons, and browser console error count was 0.
- User pivot request: the game must move away from flashcards hovering over or blocking the 3D world and toward a real mobile-first 3D playable experience.
- Product hardening validation, 3D gameplay pivot pass: `npm.cmd run typecheck` passed.
- Product hardening validation, 3D gameplay pivot pass: `npm.cmd run test` passed with 4 test files / 36 tests.
- Product hardening validation, 3D gameplay pivot pass: `npm.cmd run verify` passed with 4 test files / 36 tests and production build.
- Local smoke after the 3D gameplay pivot pass: `http://127.0.0.1:5273/` returned HTTP 200 and served the BlokBlitz HTML.
- Cloudflare smoke after the 3D gameplay pivot pass: `https://translations-estimates-surgeons-relief.trycloudflare.com` returned HTTP 200 and served the BlokBlitz HTML.
- In-app Browser mobile QA at `390x844` passed after the 3D gameplay pivot pass: Sprint and WebWoud now render dynamic Three.js gameplay objects driven by the current choices, with visible 3D gates/anchors, selected hero, and 5+n quantity block structures; DOM prompt art is hidden (`display:none`), option art is hidden (`opacity:0`), and the remaining overlay acts as HUD/touch targets. Sprint field was 352x194, action pad 374x50, Menu bottom 748, no tiny buttons, no horizontal overflow; WebWoud field was 352x224, action pad 374x50, Menu bottom 757, no tiny buttons, no horizontal overflow, and browser console error count was 0.
- Screenshot pixel checks after the 3D gameplay pivot pass: mobile Sprint viewport screenshot `390x844` had 5 unique sampled colors across world/field points; mobile WebWoud viewport screenshot `390x844` had 5 unique sampled colors; desktop Sprint screenshot `1280x720` had 4 unique sampled colors. This proves the rendered scene is not blank, but visual polish and fuller 3D interaction are still required before completion.
- Product hardening validation, transparent world-hit-zone pass: `npm.cmd run typecheck` passed.
- Product hardening validation, transparent world-hit-zone pass: `npm.cmd run test` passed with 4 test files / 36 tests.
- Product hardening validation, transparent world-hit-zone pass: `npm.cmd run verify` passed with 4 test files / 36 tests and production build.
- Local smoke after the transparent world-hit-zone pass: `http://127.0.0.1:5273/` returned HTTP 200 and served the BlokBlitz HTML.
- Cloudflare smoke after the transparent world-hit-zone pass: `https://translations-estimates-surgeons-relief.trycloudflare.com` returned HTTP 200 and served the BlokBlitz HTML.
- In-app Browser mobile QA at `390x844` passed after the transparent world-hit-zone pass: Sprint and WebWoud lane/anchor buttons are now marked as `data-world-hit-zone="true"` and remain large accessible touch zones, but their visible card contents are transparent. Sprint hit zones were 109x172 with transparent backgrounds/borders, selected label/lane/index opacity 0, prompt art hidden, option art opacity 0, action pad 374x50, Menu bottom 748, no tiny buttons, and no horizontal overflow. WebWoud hit zones were 109x202 with transparent backgrounds/borders, selected label/anchor/index opacity 0, prompt art hidden, option art opacity 0, action pad 374x50, Menu bottom 757, no tiny buttons, no horizontal overflow, and browser console error count was 0.
- User pivot request, world-first UI pass: Sprint and WebWoud must no longer feel like flashcards blocking the world. The live play scenes now use a full-screen fixed play layer with a compact target HUD, transparent full-height lane/anchor touch zones, bottom action controls, and compact outcome toasts instead of scene headers, mission ribbons, coach cards, and challenge cards during live play.
- Product hardening validation, world-first UI pass: `npm.cmd run verify` passed with 4 test files / 37 tests and production build.
- Local smoke after the world-first UI pass: `http://127.0.0.1:5273/` returned HTTP 200 and served the BlokBlitz HTML.
- Cloudflare smoke after the world-first UI pass: `https://translations-estimates-surgeons-relief.trycloudflare.com` returned HTTP 200 and served the BlokBlitz HTML.
- In-app Browser mobile QA at `390x844` passed after the world-first UI pass: Sprint rendered `data-gameplay-hud="runner"`, no `.challenge-card`, no `.runner-coach`, no `.mission-ribbon`, three transparent world hit zones at 130x644 each, controls at 370x56 fully within the viewport, no horizontal overflow, and a lane tap produced a compact success outcome at 363x78 above the controls. WebWoud rendered `data-gameplay-hud="webwoud"`, no `.challenge-card`, no `.web-coach`, no `.mission-ribbon`, three transparent anchor hit zones at 130x644 each, controls at 370x56 fully within the viewport, no horizontal overflow, a correct anchor tap produced a compact rescue outcome at 363x78 above the controls, and browser console error count was 0.
- Browser screenshot capture note for the world-first UI pass: in-app Browser `Page.captureScreenshot` timed out twice on the WebGL page, and the isolated canvas object did not expose `toDataURL`; this pass used direct browser geometry, interaction, and console-log checks instead of screenshot pixel sampling.
- User pivot request, Oefenwereld world-first pass: Oefenwereld now uses the full-screen play layer instead of visible coach/challenge cards, renders 3D minigame choice objects for the 12 minigame templates, updates the selected 3D target when an object is tapped, and uses compact outcome feedback above the controls.
- Product hardening validation, Oefenwereld world-first pass: `npm.cmd run verify` passed with 4 test files / 37 tests and production build.
- Local smoke after the Oefenwereld world-first pass: `http://127.0.0.1:5273/` returned HTTP 200 and served the BlokBlitz HTML.
- Cloudflare smoke after the Oefenwereld world-first pass: `https://translations-estimates-surgeons-relief.trycloudflare.com` returned HTTP 200 and served the BlokBlitz HTML.
- In-app Browser mobile QA at `390x844` passed after the Oefenwereld world-first pass: Oefenwereld rendered `data-gameplay-hud="minigame"`, no `.challenge-card`, no `.mini-coach`, no `.scene-header`, compact mode strip 374x48, Menu button 49x44, bottom controls 370x56, three transparent object hit zones at 130x562 each, no horizontal overflow, minimum visible button height 44px, a correct object tap kept `data-selected-index="1"` and produced a compact `Opdracht klaar` outcome at 363x78 above the controls, and browser console error count was 0.
- User pivot request, Sterrenstad build world-first pass: selecting a city district now opens a full-screen city build mode instead of an in-panel build card, with a compact city HUD, transparent build hit zones, shared action-pad controls, selected build state, and 3D construction choices/outcomes in the city world.
- Product hardening validation, Sterrenstad build world-first pass: `npm.cmd run verify` passed with 4 test files / 37 tests and production build.
- Local smoke after the Sterrenstad build world-first pass: `http://127.0.0.1:5273/` returned HTTP 200 and served the BlokBlitz HTML.
- Cloudflare smoke after the Sterrenstad build world-first pass: `https://translations-estimates-surgeons-relief.trycloudflare.com` returned HTTP 200 and served the BlokBlitz HTML.
- In-app Browser mobile QA at `390x844` passed after the Sterrenstad build world-first pass: opening Domino Dock rendered `data-city-build-live="true"`, `data-gameplay-hud="city"`, no `.challenge-card` or `.city-challenge`, full-screen city build field 390x844, bottom controls 370x56, three transparent build hit zones at 130x604 each, no horizontal overflow, minimum visible button height 51px, and a correct build tap closed the live layer, showed the city reward/next actions, kept no blocking build card, and produced browser console error count 0.
- User pivot request, runner mechanic object pass: Sprint no longer renders every runner challenge as the same three gate arches in Three.js. The runner renderer now receives the full challenge, uses the route mechanic and challenge type to draw distinct 3D targets, and keeps the 5+n quantity structure on the target: flash gates stay gates, subitize boost uses boost pads, make-10 uses shields, bead/train/double routes use bridge/track objects, jump uses raised platforms, split uses chests, compare uses enemy waves, rescue uses cage/friend objects, shortcut uses route markers, and dino streak uses paired tracks.
- Regression coverage, runner mechanic object pass: added a runtime flow test that inspects mocked Three geometries for non-gate runner mechanics so make-10 shields, enemy waves, and shortcut routes cannot silently fall back to generic lane gates.
- Product hardening validation, runner mechanic object pass: `npm.cmd run verify` passed with 4 test files / 38 tests and production build.
- Local smoke after the runner mechanic object pass: `http://127.0.0.1:5273/` returned HTTP 200 and served the BlokBlitz HTML.
- Cloudflare smoke after the runner mechanic object pass: `https://translations-estimates-surgeons-relief.trycloudflare.com` returned HTTP 200 and served the BlokBlitz HTML.
- Browser QA note for the runner mechanic object pass: in-app Browser connection failed at the tool layer during setup, and this repo does not include a local Playwright/Puppeteer package. Because the change is isolated to Three.js object selection and automated runtime coverage passed, no screenshot/mobile browser inspection was completed in this pass.
- User pivot request, live-control simplification pass: Sprint and WebWoud no longer show a middle confirm button in the live action pad. Those scenes now use a two-button movement pad for left/right lane or anchor movement, while direct world-hit-zone taps and the timed auto-run/auto-swing loop remain the primary way to commit a choice. Later passes extended the same movement-first pattern to Oefenwereld and Sterrenstad build mode.
- Product hardening validation, live-control simplification pass: `npm.cmd run verify` passed with 4 test files / 38 tests and production build.
- Local smoke after the live-control simplification pass: `http://127.0.0.1:5273/` returned HTTP 200 and served the BlokBlitz HTML.
- Cloudflare smoke after the live-control simplification pass: `https://translations-estimates-surgeons-relief.trycloudflare.com` returned HTTP 200 and served the BlokBlitz HTML.
- User pivot request, child-first live HUD pass: Sprint and WebWoud no longer use label-heavy stat pills during live play. Their HUDs now show the target, the route progress, and compact game tokens for lane/speed/distance/streak or anchor/rescue/stars, with labels kept in accessible names instead of visible dashboard text.
- Product hardening validation, child-first live HUD pass: `npm.cmd run verify` passed with 4 test files / 38 tests and production build.
- Local smoke after the child-first live HUD pass: `http://127.0.0.1:5273/` returned HTTP 200 and served the BlokBlitz HTML.
- Cloudflare smoke after the child-first live HUD pass: `https://translations-estimates-surgeons-relief.trycloudflare.com` returned HTTP 200 and served the BlokBlitz HTML.
- User pivot request, Oefenwereld timed object-dash pass: Oefenwereld no longer relies on a bottom confirm button for live play. The selected 3D object now drives a timed dash loop: left/right movement changes the target and resets the dash, direct object taps still commit immediately, and reaching the selected object automatically records the attempt. A slim in-world dash meter exposes progress without adding card overlays.
- Regression coverage, Oefenwereld timed object-dash pass: flow tests now assert movement-only object controls, dash progress data, the dash meter, and auto-commit after scene update.
- Product hardening validation, Oefenwereld timed object-dash pass: `npm.cmd run verify` passed with 4 test files / 38 tests and production build. A separate attempted `npm.cmd run test -- --runInBand` failed because this Vitest version does not support `--runInBand`; the normal project test and verify commands passed.
- Local smoke after the Oefenwereld timed object-dash pass: `http://127.0.0.1:5273/` returned HTTP 200 and served the BlokBlitz HTML.
- Cloudflare smoke after the Oefenwereld timed object-dash pass: `https://translations-estimates-surgeons-relief.trycloudflare.com` returned HTTP 200 and served the BlokBlitz HTML.
- User pivot request, Sterrenstad timed build-dash pass: Sterrenstad build mode no longer depends on a confirm-button object picker. Selecting a district opens a timed build dash: left/right movement changes the build target and resets progress, direct build-target taps still commit immediately, and reaching the selected build target automatically restores the district when the number structure is correct. The full-screen build layer now exposes a slim in-world build meter instead of adding instructional cards.
- Regression coverage, Sterrenstad timed build-dash pass: flow tests now assert movement-only build controls, build progress data, the build dash meter, and auto-restoration after scene update.
- Product hardening validation, Sterrenstad timed build-dash pass: `npm.cmd run verify` passed with 4 test files / 38 tests and production build.
- Local smoke after the Sterrenstad timed build-dash pass: `http://127.0.0.1:5273/` returned HTTP 200 and served the BlokBlitz HTML.
- Cloudflare smoke after the Sterrenstad timed build-dash pass: `https://translations-estimates-surgeons-relief.trycloudflare.com` returned HTTP 200 and served the BlokBlitz HTML.
- User pivot request, structured 3D pickup-trail pass: live runner, WebWoud, Oefenwereld, and Sterrenstad build paths now add number-structured 3D pickups on the selected route. The pickup count comes from the selected option quantity and is arranged/color-coded as first-five plus extras, so the moving path itself carries the number structure instead of only the target object.
- Regression coverage, structured 3D pickup-trail pass: added a flow test that inspects mocked Three geometry and proves runner, minigame, and city live paths render one pickup per selected quantity.
- Product hardening validation, structured 3D pickup-trail pass: `npm.cmd run verify` passed with 4 test files / 39 tests and production build.
- Local smoke after the structured 3D pickup-trail pass: `http://127.0.0.1:5273/` returned HTTP 200 and served the BlokBlitz HTML.
- Cloudflare smoke after the structured 3D pickup-trail pass: `https://translations-estimates-surgeons-relief.trycloudflare.com` returned HTTP 200 and served the BlokBlitz HTML.
- User pivot request, low-poly dino hero pass: the live 3D player is no longer a simple two-block placeholder. The hero now renders as a multi-part low-poly dino with body, belly, head, snout, eye, tail, legs, dorsal spikes, and a WebWoud cape variant, using only local Three.js primitives.
- Regression coverage, low-poly dino hero pass: added a flow test that inspects tagged Three gameplay objects and proves live play renders the dino hero parts, including the WebWoud cape variant.
- Product hardening validation, low-poly dino hero pass: `npm.cmd run verify` passed with 4 test files / 40 tests and production build.
- Local smoke after the low-poly dino hero pass: `http://127.0.0.1:5273/` returned HTTP 200 and served the BlokBlitz HTML.
- Cloudflare smoke after the low-poly dino hero pass: `https://translations-estimates-surgeons-relief.trycloudflare.com` returned HTTP 200 and served the BlokBlitz HTML.
- User pivot request, live-world landmark pass: the 3D worlds are no longer just generic lanes, trees, practice blocks, and city boxes. Sprint now has a star arch and dino flags, WebWoud has rescue friends/cages and a canopy star, Oefenwereld has practice towers and a number portal, and Sterrenstad has a 10-block tower plus star beacon. All are local Three.js primitives tagged by world role for verification.
- Regression coverage, live-world landmark pass: added a flow test that resets each live world and proves the theme-specific landmark roles are present, including exactly 10 city tower blocks.
- Product hardening validation, live-world landmark pass: `npm.cmd run verify` passed with 4 test files / 41 tests and production build.
- Local smoke after the live-world landmark pass: `http://127.0.0.1:5273/` returned HTTP 200 and served the BlokBlitz HTML.
- Cloudflare smoke after the live-world landmark pass: `https://translations-estimates-surgeons-relief.trycloudflare.com` returned HTTP 200 and served the BlokBlitz HTML.
- Product hardening, short-height gameplay compaction pass: added a targeted `max-height: 760px` and `min-width: 700px` media query for short desktop/landscape viewports. Live play now uses smaller target HUDs, token rows, route padding, meters, mode tabs, outcomes, and bottom controls in short-height layouts, including Oefenwereld and Sterrenstad build-dash layers.
- Regression coverage, short-height gameplay compaction pass: added a CSS contract test that proves the short-height media query keeps live gameplay controls at 44px, reduces route padding, and compacts Oefenwereld/Sterrenstad live-object areas.
- Product hardening validation, short-height gameplay compaction pass: `npm.cmd run verify` passed with 5 test files / 42 tests and production build.
- Local smoke after the short-height gameplay compaction pass: `http://127.0.0.1:5273/` returned HTTP 200 and served the BlokBlitz HTML.
- Cloudflare smoke after the short-height gameplay compaction pass: `https://translations-estimates-surgeons-relief.trycloudflare.com` returned HTTP 200 and served the BlokBlitz HTML.
- User pivot request, arcade live gameplay redesign pass: the live 3D views now prioritize the canvas as the game surface. The blocking foreground runner arch was moved to the far background, decorative runner cubes were moved off the lanes, selected choices get 3D pads, quantity structures are larger/closer, the live camera is lower and more runner-like, and the visible UI is now a compact arcade HUD plus rounded movement controls instead of wide web-form controls.
- UX polish, arcade live gameplay redesign pass: wrong-choice outcome copy changed from `Nog eens.` to `Bijna!`, runner mechanic labels are now short Dutch child-facing labels, Sterrenstad build hides the underlying city/map/coach UI during full-screen live build mode, and a local generated SVG favicon was added at `public/favicon.svg` to avoid resource noise.
- Automation, viewport QA pass: added `npm.cmd run qa:viewport`, a dependency-free Chrome DevTools QA script that starts Vite, drives real Chrome through mobile Runner, short desktop Runner, mobile WebWoud, mobile Oefenwereld, and mobile Sterrenstad build mode, checks no horizontal overflow, visible HUD/controls, large touch hit zones, no blocking visible card/coach/ribbon overlays, and non-flat screenshot pixels. Screenshots and `report.json` are written to `.qa-artifacts/viewport-qa/`.
- Product hardening validation, arcade live gameplay/viewport QA pass: `npm.cmd run qa:viewport` passed for `runner-mobile`, `runner-short-desktop`, `web-mobile`, `minigame-mobile`, and `city-build-mobile`.
- Product hardening validation, arcade live gameplay/viewport QA pass: `npm.cmd run verify` passed with 5 test files / 42 tests and production build.
- Local smoke after the arcade live gameplay/viewport QA pass: `http://127.0.0.1:5273/` returned HTTP 200 and served the BlokBlitz HTML.
- Cloudflare smoke after the arcade live gameplay/viewport QA pass: `https://translations-estimates-surgeons-relief.trycloudflare.com` returned HTTP 200 and served the BlokBlitz HTML.
- User pivot request, kid-first toy-3D simplification pass: the live 3D worlds now use renderer shadows, tone mapping, soft toy materials, translucent inactive targets, larger selected pads, a stronger dino hero with glow/boost trail details, soft hills, clouds, side sparkles, and fewer loose runner blocks. Mobile live HUDs now hide score/stat rows during play, Oefenwereld hides the minigame tab strip during mobile live play, and scene headings are short action prompts: `Rennen!`, `Zwaai!`, `Pak!`, and `Bouw!`.
- Validation, kid-first toy-3D simplification pass: `npm.cmd run typecheck` passed, `npm.cmd run test` passed with 5 test files / 42 tests, `npm.cmd run qa:viewport` passed for mobile Runner, short desktop Runner, mobile WebWoud, mobile Oefenwereld, and mobile Sterrenstad build mode, and `npm.cmd run verify` passed with production build.
- Browser/tooling note, kid-first toy-3D simplification pass: the explicit Chrome plugin connection failed at the tool layer before a tab could be claimed, so visual verification used the project Chrome DevTools viewport QA script and local image inspection instead.
- Local smoke after the kid-first toy-3D simplification pass: `http://127.0.0.1:5273/` returned HTTP 200 and served the latest CSS marker `Kid-first simplification pass`.
- Cloudflare smoke after the kid-first toy-3D simplification pass: new tunnel `https://adam-pages-branches-indexed.trycloudflare.com` returned HTTP 200 and served the latest CSS marker `Kid-first simplification pass`.
- User pivot request, instant reward collect-loop pass: live success feedback now behaves more like mobile game pickups instead of a blocking card. Reward badges render as small typed icons, live Sprint/WebWoud/Oefenwereld/Sterrenstad outcomes use a compact corner pickup cluster, and the success text remains in the DOM for tests/accessibility without covering the 3D play space.
- Haptics hardening, instant reward collect-loop pass: `HapticManager` now checks `navigator.userActivation` before calling `navigator.vibrate`, preventing automated/mobile browser smoke tests from logging blocked vibration errors while keeping haptics available after real user interaction.
- Regression coverage, instant reward collect-loop pass: flow tests now assert visible reward badges in live WebWoud and Oefenwereld success outcomes, and viewport QA now includes a `web-reward-mobile` scenario that taps a correct WebWoud anchor and verifies reward pickup badges are visible and large enough.
- Product hardening validation, instant reward collect-loop pass: `npm.cmd run test` passed with 5 test files / 42 tests, `npm.cmd run qa:viewport` passed for `runner-mobile`, `runner-short-desktop`, `web-mobile`, `web-reward-mobile`, `minigame-mobile`, and `city-build-mobile`, and `npm.cmd run verify` passed with typecheck, lint, tests, and production build.
- Visual QA, instant reward collect-loop pass: inspected `.qa-artifacts/viewport-qa/web-reward-mobile.png`; the reward now appears as compact collectible badges near the top-right HUD area and no longer blocks the hero, WebWoud anchors, or bottom controls.
- Local smoke after the instant reward collect-loop pass: `http://127.0.0.1:5273/` returned HTTP 200.
- Cloudflare smoke after the instant reward collect-loop pass: `https://adam-pages-branches-indexed.trycloudflare.com` returned HTTP 200.
- User pivot request, moment-to-moment game-feel pass: live 3D play now has stronger progress-driven motion instead of static target selection. The low-poly dino hero bounces, leans, strides, stretches boost streaks, and swings its WebWoud cape based on route progress and outcome phase. Sterrenstad build mode now uses a city hero mode instead of reusing the generic minigame hero identity.
- Game-feel detail, pickup-chain pass: selected-path pickups now expose collected/uncollected state, first-five/extras grouping, and visible chain links between pickups. This keeps the 5+n number structure embedded in the moving route while making the path feel more like an arcade collectible chain.
- Game-feel detail, rescue/build win pass: successful WebWoud and Sterrenstad actions now add explicit 3D win objects: freed friend, open cage bars, rescue stars, built roof, built blocks, and build stars. Wrong-choice scaffolds are also tagged as scaffold steps for safer future QA.
- Regression coverage, moment-to-moment game-feel pass: flow tests now prove hero progress/motion state, boosted speed-streak scale, pickup-chain count, collected pickup state, first-five/extras pickup grouping, WebWoud freed-friend/open-cage/rescue-star roles, Sterrenstad built-roof/built-block/build-star roles, and city-specific hero mode.
- Product hardening validation, moment-to-moment game-feel pass: `npm.cmd run test` passed with 5 test files / 44 tests, `npm.cmd run verify` passed with typecheck, lint, 44 tests, and production build, and `npm.cmd run qa:viewport` passed for `runner-mobile`, `runner-short-desktop`, `web-mobile`, `web-reward-mobile`, `minigame-mobile`, and `city-build-mobile`.
- Visual QA, moment-to-moment game-feel pass: inspected `.qa-artifacts/viewport-qa/runner-mobile.png` and `.qa-artifacts/viewport-qa/web-reward-mobile.png`; the route pickups and hero remain visible in the 3D world, and controls/HUD are not blocked.
- Local smoke after the moment-to-moment game-feel pass: `http://127.0.0.1:5273/` returned HTTP 200.
- Cloudflare smoke after the moment-to-moment game-feel pass: `https://adam-pages-branches-indexed.trycloudflare.com` returned HTTP 200.
- User pivot request, full-session visible progression pass: the main menu now shows a child-facing progress strip for stars, blocks, rescues, and city growth next to the playable route, so saved rewards are visible before starting a session instead of living only in dashboard-style stat cards.
- End-of-session progression pass: Summary now shows a treasure trail with session stars, rescues, remaining blocks, city growth, and a city restoration meter before the numeric scoreboard. This makes the 10-minute loop read as "I rescued, collected, and rebuilt" instead of only "I answered attempts."
- Regression coverage, full-session visible progression pass: flow tests now assert the menu progress strip, four progress tokens, summary treasure trail, four treasure steps, and city restored meter after a real runner -> WebWoud -> city -> summary playthrough.
- Viewport QA expansion, full-session visible progression pass: `npm.cmd run qa:viewport` now includes `menu-mobile` and `summary-mobile`; the summary scenario reaches the finish screen through real correct Sprint, WebWoud, and Sterrenstad clicks before checking the treasure trail and city meter.
- Product hardening validation, full-session visible progression pass: `npm.cmd run test` passed with 5 test files / 44 tests, `npm.cmd run qa:viewport` passed for `menu-mobile`, `runner-mobile`, `runner-short-desktop`, `web-mobile`, `web-reward-mobile`, `minigame-mobile`, `city-build-mobile`, and `summary-mobile`, and `npm.cmd run verify` passed with typecheck, lint, tests, and production build.
- Visual QA, full-session visible progression pass: inspected `.qa-artifacts/viewport-qa/menu-mobile.png` and `.qa-artifacts/viewport-qa/summary-mobile.png`; both show the new progression UI without horizontal overflow.
- Local smoke after the full-session visible progression pass: `http://127.0.0.1:5273/` returned HTTP 200.
- Cloudflare smoke after the full-session visible progression pass: `https://adam-pages-branches-indexed.trycloudflare.com` returned HTTP 200.
- User pivot request, adventure-transition clarity pass: added visual adventure bridges for Number Portal -> Sprint and City -> Summary, plus compact transition toasts for Number Portal -> Sprint, Sprint -> WebWoud, and WebWoud -> City. These cues use the same icon language as the route map so the child can follow the adventure chain with minimal reading.
- UX correction, adventure-transition clarity pass: removed the temporary City -> Summary toast after screenshot inspection because it overlapped the summary header/ribbon. The finish screen now uses a stable bridge under the mission ribbon instead of a blocking overlay.
- Regression coverage, adventure-transition clarity pass: flow tests now assert the Number Portal bridge, portal-to-runner transition toast, city-to-summary bridge after restoration, and summary bridge after finishing the mission.
- Viewport QA expansion, adventure-transition clarity pass: `npm.cmd run qa:viewport` now includes `number-mobile` and checks the portal adventure bridge. Summary QA also verifies the stable bridge while still playing through the real Sprint -> WebWoud -> City -> Summary flow.
- Product hardening validation, adventure-transition clarity pass: `npm.cmd run test` passed with 5 test files / 44 tests, `npm.cmd run qa:viewport` passed for `menu-mobile`, `number-mobile`, `runner-mobile`, `runner-short-desktop`, `web-mobile`, `web-reward-mobile`, `minigame-mobile`, `city-build-mobile`, and `summary-mobile`, and `npm.cmd run verify` passed with typecheck, lint, tests, and production build.
- Visual QA, adventure-transition clarity pass: inspected `.qa-artifacts/viewport-qa/number-mobile.png` and `.qa-artifacts/viewport-qa/summary-mobile.png`; the portal bridge and finish bridge are visible, compact, and do not cause horizontal overflow.
- Local smoke after the adventure-transition clarity pass: `http://127.0.0.1:5273/` returned HTTP 200.
- Cloudflare smoke after the adventure-transition clarity pass: `https://adam-pages-branches-indexed.trycloudflare.com` returned HTTP 200.
- User pivot request, micro-goal variation pass: added a gameplay/session micro-goal layer in `src/gameplay/session/microGoals.ts`. Runner mechanics, WebWoud decisions, Oefenwereld templates, and Sterrenstad build mode now expose compact child-facing action beats such as open, boost, shield, bridge, rescue, split, match, and build.
- Mobile HUD variation, micro-goal pass: live mobile play now keeps only a compact micro-goal chip visible while hiding old score/stat rows, so the child sees what kind of action is happening without bringing back a dashboard-heavy UI.
- Reward pacing, micro-goal pass: runner route milestones now add an extra visible route badge and star reward every third completed beat and at the end of the route. WebWoud milestones add an extra rescue badge/Numeriaan on the same pacing, making repeated correct choices feel more like route progress.
- Regression coverage, micro-goal pass: flow tests now assert runner and WebWoud micro-goal chips, updated compact token sets, and visible runner route milestone rewards. Test coverage increased to 45 tests.
- Product hardening validation, micro-goal pass: `npm.cmd run test` passed with 5 test files / 45 tests, `npm.cmd run qa:viewport` passed for `menu-mobile`, `number-mobile`, `runner-mobile`, `runner-short-desktop`, `web-mobile`, `web-reward-mobile`, `minigame-mobile`, `city-build-mobile`, and `summary-mobile`, and `npm.cmd run verify` passed with typecheck, lint, tests, and production build.
- Visual QA, micro-goal pass: inspected `.qa-artifacts/viewport-qa/runner-mobile.png` and `.qa-artifacts/viewport-qa/web-mobile.png`; the micro-goal chip is visible and compact without covering the 3D world or controls.
- Local smoke after the micro-goal pass: `http://127.0.0.1:5273/` returned HTTP 200.
- Cloudflare smoke after the micro-goal pass: `https://adam-pages-branches-indexed.trycloudflare.com` returned HTTP 200.
- Product hardening validation, visible target pass: `npm.cmd run test` passed with 5 test files / 45 tests, `npm.cmd run qa:viewport` passed for `menu-mobile`, `number-mobile`, `runner-mobile`, `runner-short-desktop`, `web-mobile`, `web-reward-mobile`, `minigame-mobile`, `city-build-mobile`, and `summary-mobile`, and `npm.cmd run verify` passed with typecheck, lint, tests, and production build.
- Visual QA, visible target pass: inspected `.qa-artifacts/viewport-qa/runner-mobile.png` and `.qa-artifacts/viewport-qa/web-mobile.png`; the HUD now shows `Zoek 4` with the target representation and does not cover the 3D route, hero, touch zones, or controls.
- Local smoke after the visible target pass: `http://127.0.0.1:5273/` returned HTTP 200.
- Cloudflare smoke after the visible target pass: `https://adam-pages-branches-indexed.trycloudflare.com` returned HTTP 200.
- Product hardening validation, left/action/right control pass: `npm.cmd run typecheck` passed, `npm.cmd run test` passed with 5 test files / 45 tests, the strengthened `npm.cmd run qa:viewport` passed all 9 scenarios while verifying live pad actions are `left, act, right`, and `npm.cmd run verify` passed with typecheck, lint, tests, and production build.
- Visual QA, left/action/right control pass: inspected `.qa-artifacts/viewport-qa/runner-mobile.png`, `web-mobile.png`, `minigame-mobile.png`, and `city-build-mobile.png`; the bottom controls now show distinct left/action/right symbols plus the scene escape button without covering the 3D world.
- Product hardening validation, contextual Sprint action pass: `npm.cmd run typecheck` passed, `npm.cmd run test` passed with 5 test files / 45 tests, `npm.cmd run qa:viewport` passed all 9 scenarios with the runner pad reporting `Poort open`, and `npm.cmd run verify` passed with typecheck, lint, tests, and production build.
- Visual QA, contextual Sprint action pass: inspected `.qa-artifacts/viewport-qa/runner-mobile.png`; the central Sprint control now shows a gate icon for the first route beat instead of a generic jump/play symbol while preserving compact mobile layout.
- Product hardening validation, adaptive live-pressure pass: `npm.cmd run typecheck` passed, `npm.cmd run test` passed with 5 test files / 47 tests, `npm.cmd run qa:viewport` passed all 9 scenarios while verifying live HUD adaptive-window metrics, and `npm.cmd run verify` passed with typecheck, lint, tests, and production build.
- User pivot request, one-adventure menu pass: the child-facing main menu no longer offers direct Sprint/WebWoud/Stad shortcuts from the route markers. All route markers and the dominant `Start avontuur` button start the same full session at the Number Portal, while developer viewport QA uses a `?qa=`-only scene hook to open live scenes directly.
- Menu simplification, one-adventure pass: removed the separate dashboard-style stats card from the child menu. Saved rewards remain visible only as the compact child progress strip, and detailed stats stay in the parent dashboard.
- Regression and viewport coverage, one-adventure menu pass: flow tests now assert route markers are not standalone scene shortcuts, the stats card is absent from the child menu, and the main session still starts from `Start avontuur`. `npm.cmd run typecheck`, `npm.cmd run test -- tests/flow.test.ts`, `npm.cmd run qa:viewport`, and `npm.cmd run verify` passed; the full test suite remains 5 files / 47 tests and the regenerated mobile menu screenshot was inspected.
- Local and Cloudflare smoke after the one-adventure menu pass: `http://127.0.0.1:5273/` and `https://adam-pages-branches-indexed.trycloudflare.com` both returned HTTP 200.
- User pivot request, safe in-world scaffold pass: wrong live choices now move the selected hint target to the correct lane/anchor/object/build choice instead of leaving the child parked on the mistake. The next retry is still logged with `hintUsed`, but the visual guidance is in the world.
- 3D scaffold feedback, safe in-world scaffold pass: Runner, WebWoud, Oefenwereld, and Sterrenstad build mode now add local Three.js scaffold beacons and pointers on the safe retry target, alongside the existing non-blocking scaffold strip.
- Regression and viewport coverage, safe in-world scaffold pass: flow tests now assert wrong choices select the correct hint target and create `scaffold-target-beacon` / `scaffold-target-pointer` 3D objects. `npm.cmd run qa:viewport` now includes `runner-scaffold-mobile` and passed 10 scenarios, including browser checks for correct-hint selection and the 3D scaffold beacon. The regenerated `runner-scaffold-mobile.png` screenshot was inspected.
- Product hardening validation, safe in-world scaffold pass: `npm.cmd run typecheck`, `npm.cmd run test`, `npm.cmd run qa:viewport`, and `npm.cmd run verify` passed. The full suite remains 5 files / 47 tests, viewport QA now covers 10 scenarios, and production build completed.
- Local and Cloudflare smoke after the safe in-world scaffold pass: `http://127.0.0.1:5273/` and `https://adam-pages-branches-indexed.trycloudflare.com` both returned HTTP 200.
- User pivot request, immediate replay loop pass: the mobile Summary screen now shows `Nog een missie` and `Bouw verder` directly under the finish bridge and before the reward world/stat cards, so the next play action is visible in the first viewport instead of hidden below coach text.
- Regression and viewport coverage, immediate replay loop pass: flow tests now assert the `summary-replay-actions` zone, verify `Nog een missie` starts a fresh Number Portal session, and ensure the coach no longer owns the primary replay buttons. `npm.cmd run qa:viewport` now checks the summary replay action bar is visible in the first mobile viewport and both buttons are at least 44px.
- Product hardening validation, immediate replay loop pass: `npm.cmd run typecheck`, `npm.cmd run test -- tests/flow.test.ts`, `npm.cmd run qa:viewport`, and `npm.cmd run verify` passed. The full suite remains 5 files / 47 tests, viewport QA covers 10 scenarios, and production build completed.
- Local and Cloudflare smoke after the immediate replay loop pass: `http://127.0.0.1:5273/` and `https://adam-pages-branches-indexed.trycloudflare.com` both returned HTTP 200.
- User pivot request, Number Portal gate pass: the session can no longer skip straight from the Number Portal to Sprint. `Naar Sprint` appears only after the child wakes the portal by saying the number name, so the first learning beat is a real gate in the adventure flow.
- Regression and viewport coverage, Number Portal gate pass: flow tests now assert Sprint is unavailable before the wake action, the bridge reads `Wek eerst`, and Sprint appears only after the tracked number-name attempt. `npm.cmd run qa:viewport` now performs the same wake-gate check in Chrome before capturing `number-mobile.png`.
- Product hardening validation, Number Portal gate pass: `npm.cmd run typecheck`, `npm.cmd run test -- tests/flow.test.ts`, `npm.cmd run qa:viewport`, `npm.cmd run verify`, and the final `npm.cmd run test` passed. The full suite remains 5 files / 47 tests, viewport QA covers 10 scenarios, and production build completed.
- Local and Cloudflare smoke after the Number Portal gate pass: `http://127.0.0.1:5273/` and `https://adam-pages-branches-indexed.trycloudflare.com` both returned HTTP 200.
- Product hardening, mobile app shell pass: added local installable-app metadata to `index.html` and `public/site.webmanifest`, including fullscreen display, portrait orientation, theme color, mobile web app capability, and local SVG icon references. This keeps the phone experience closer to a fullscreen game shell without adding remote assets.
- Asset/test coverage, mobile app shell pass: documented the generated manifest/icon shell in `assets/ASSET_MANIFEST.json` and added an acceptance test proving the manifest is local-first, fullscreen, portrait, and uses only local icon paths.
- Product hardening validation, mobile app shell pass: `npm.cmd run typecheck`, `npm.cmd run test -- tests/acceptance.test.ts`, `npm.cmd run qa:viewport`, and `npm.cmd run verify` passed. The full suite is now 5 files / 48 tests, viewport QA covers 10 scenarios, and production build completed.
- Local and Cloudflare smoke after the mobile app shell pass: `http://127.0.0.1:5273/` and `https://adam-pages-branches-indexed.trycloudflare.com` both returned HTTP 200.
- Product hardening, offline local-first shell pass: added `public/sw.js` and production-only service-worker registration in `src/main.ts`. The worker caches only same-origin local app-shell files and uses runtime same-origin caching for installed/offline play, without remote URLs or CDN dependencies.
- Asset/test coverage, offline local-first shell pass: documented the service worker in `assets/ASSET_MANIFEST.json`, documented installed/offline behavior in `README.md`, and added acceptance coverage proving the service worker registration is production-scoped and same-origin.
- Product hardening validation, offline local-first shell pass: `npm.cmd run test` and `npm.cmd run verify` passed on the current state. The full suite is now 5 files / 49 tests and production build completed.
- Local/Cloudflare shell smoke after the offline local-first pass: `/`, `/site.webmanifest`, and `/sw.js` returned HTTP 200 locally, and `/sw.js` returned HTTP 200 through the Cloudflare URL.
- Product hardening, installed safe-area shell pass: added `viewport-fit=cover`, `100dvh` app-shell sizing, global overscroll suppression, transparent mobile tap highlight, and app-wide user-select prevention so installed/fullscreen phone play behaves more like a game surface around browser bars and notches.
- Test coverage, installed safe-area shell pass: acceptance tests now assert the viewport safe-area opt-in and global mobile shell CSS contract.
- Product hardening validation, installed safe-area shell pass: `npm.cmd run test -- tests/acceptance.test.ts tests/style-contract.test.ts`, `npm.cmd run typecheck`, `npm.cmd run qa:viewport`, and `npm.cmd run verify` passed. The full suite remains 5 files / 49 tests, viewport QA covers 10 scenarios, and production build completed.
- Local and Cloudflare smoke after the installed safe-area shell pass: `http://127.0.0.1:5273/` and `https://adam-pages-branches-indexed.trycloudflare.com` both returned HTTP 200; `/site.webmanifest` returned HTTP 200 locally.
- User pivot request, child-first Sterrenstad entry pass: the city hub now surfaces one dominant `Bouw nu` action for the next un-restored district before the district map, and the same recommended district is visibly marked on the city map. This keeps Sterrenstad as a reward/build world while removing the need for a 5-year-old to choose from 14 districts before reaching live 3D build play.
- Mobile simplification, child-first Sterrenstad entry pass: the long restoration task list is hidden on mobile so the first phone viewport shows the mission ribbon, the next build target, the large `Bouw nu` button, compact coach/reward stats, and then the recommended district map.
- Regression and viewport coverage, child-first Sterrenstad entry pass: flow tests now assert the direct city quick-build action opens full-screen Sterrenstad build mode and preserves recommended-district highlighting. `npm.cmd run typecheck`, `npm.cmd run test -- tests/flow.test.ts`, and `npm.cmd run qa:viewport` passed; viewport QA now includes `city-overview-mobile` and covers 11 scenarios. The regenerated `city-overview-mobile.png` screenshot was inspected.
- Product hardening validation, child-first Sterrenstad entry pass: `npm.cmd run verify` passed with typecheck, lint, 5 test files / 50 tests, and production build. A final `npm.cmd run test` also passed with 5 files / 50 tests.
- Local and Cloudflare smoke after the child-first Sterrenstad entry pass: `http://127.0.0.1:5273/` and `https://adam-pages-branches-indexed.trycloudflare.com` both returned HTTP 200.
- Product-readiness QA, mobile touch pass: added `npm.cmd run qa:mobile-touch`, a Chrome DevTools mobile automation that uses real `Input.dispatchTouchEvent` touch taps instead of DOM `.click()` to play the normal child route from Start -> Number Portal -> Sprint -> WebWoud -> Sterrenstad `Bouw nu` -> city restoration -> Summary.
- Mobile touch evidence: `npm.cmd run qa:mobile-touch` passed with 38 touch steps, 23 tracked attempts through the real attempt pipeline, and 1 restored district. The report now explicitly includes runner, WebWoud, and city left/right control taps plus swipe-left/swipe-right gestures. The final screenshot is stored at `.qa-artifacts/mobile-touch-qa/summary-touch-mobile.png`.
- Mobile input hardening: `InputManager` now has an explicit `touchstart`/`touchend` swipe fallback with pointer/touch duplicate suppression, so mobile swipes do not depend on browser-specific pointer-event synthesis. Regression tests cover both pointer-style and touch-event swipe actions.
- Test/documentation coverage, mobile touch pass: README now documents `qa:viewport` and `qa:mobile-touch`, and acceptance tests now assert that the mobile touch QA script exists, uses `Input.dispatchTouchEvent`, touches the city `Bouw nu` path, and reaches the summary replay actions.
- Product hardening validation, mobile touch pass: `npm.cmd run test -- tests/acceptance.test.ts` passed with 11 tests, `npm.cmd run test -- tests/flow.test.ts` passed with 23 tests, `npm.cmd run typecheck` passed, `npm.cmd run qa:viewport` passed 11 scenarios, `npm.cmd run qa:mobile-touch` passed, and `npm.cmd run verify` passed with typecheck, lint, 5 test files / 51 tests, and production build.
- Local and Cloudflare smoke after the mobile touch pass: `http://127.0.0.1:5273/` and `https://adam-pages-branches-indexed.trycloudflare.com` both returned HTTP 200.
- Child-first Summary polish pass: moved the dashboard-like `Pogingen` and `Streak` summary stats behind a closed `Voor ouders` details panel. The child-facing Summary now keeps the replay buttons, finish world, treasure trail, and city growth visible first, while detailed stats remain available for parents and in the parent dashboard.
- Regression and viewport coverage, child-first Summary polish pass: flow tests now assert that `.summary-parent-details` exists, is closed by default, and still contains the scoreboard. Viewport QA now fails if summary dashboard stat cards are visibly open by default on mobile. The regenerated `summary-mobile.png` and `summary-touch-mobile.png` screenshots were inspected.
- Live control icon polish pass: live Sprint, WebWoud, Oefenwereld, and Sterrenstad build utility controls now use compact CSS icons for menu/back/refresh instead of visible text labels. The accessible labels and `data-action` values remain intact, but the phone controls now read more like game controls and less like dashboard buttons.
- Regression and visual coverage, live control icon polish pass: flow tests now assert live icon buttons for Runner menu, WebWoud menu, Oefenwereld refresh/menu, and Sterrenstad back. The regenerated `runner-mobile.png`, `minigame-mobile.png`, and `city-build-mobile.png` screenshots were inspected and show icon-only utility controls.
- Product hardening validation, live control icon polish pass: `npm.cmd run typecheck`, `npm.cmd run test -- tests/flow.test.ts tests/style-contract.test.ts`, `npm.cmd run qa:viewport`, and `npm.cmd run qa:mobile-touch` passed. The latest mobile touch route passed with 38 touch steps, 24 tracked attempts, and 1 restored district.
- Fullscreen mobile shell pass: the child `Start avontuur` action and the Summary `Nog een missie` replay action now make a safe best-effort fullscreen request from the user gesture. Browsers that deny or lack fullscreen support continue normally, while supported Android/desktop browsers can reduce browser chrome for a more game-like play surface.
- Regression coverage, fullscreen mobile shell pass: flow tests now assert fullscreen is requested from the start and replay gestures, and denied fullscreen promises are treated as safe optional enhancement. Acceptance coverage also checks the mobile shell keeps `requestFullscreenPlay` wired from menu and summary.
- Product hardening validation, fullscreen mobile shell pass: `npm.cmd run test -- tests/acceptance.test.ts tests/flow.test.ts`, `npm.cmd run typecheck`, `npm.cmd run qa:viewport`, and `npm.cmd run qa:mobile-touch` passed. The latest mobile touch route passed with 38 touch steps, 23 tracked attempts, and 1 restored district.
- Narrow-phone viewport QA pass: `npm.cmd run qa:viewport` now covers 15 scenarios, adding 360x740 checks for the main menu, Runner, Sterrenstad build mode, and Summary. The regenerated `menu-narrow-mobile.png`, `runner-narrow-mobile.png`, `city-build-narrow-mobile.png`, and `summary-narrow-mobile.png` screenshots were visually inspected and showed no control overlap, no blocked playfield, and first-screen child actions remaining reachable.
- Product hardening validation, narrow-phone pass: `npm.cmd run verify` passed with typecheck, lint, 5 test files / 52 tests, and production build. `npm.cmd run qa:mobile-touch` also passed again with 38 touch steps, 23 tracked attempts, and 1 restored district.
- Claude revamp continuation, Sterrenreis completion pass: finished the half-wired `ReisScene` story mode by registering it in `Game`, making boot and the hub `Sterrenreis` card route to the winding journey map, keeping free-play runs separate from story progress, and returning story-launched runs/minigames back to the journey map.
- Story-mode UX pass: added responsive ReisScene CSS for the single-screen mobile shell: top rewards/free-play bar, internally scrolling journey road, one glowing frontier node, Buddy standing on the current node, bloom feedback on completed nodes, star-home progress rail, and a friend meadow that remains visible without document-level page scrolling.
- Story-mode regression coverage: flow tests now prove boot opens De Sterrenreis, the map renders every journey node with exactly one active frontier, tapping the active stop launches a real learning activity, finishing it advances `progress.journey`, and the done screen uses `Verder` back to the story map.
- Story-mode browser evidence: in-app browser QA at `390x844` opened `http://127.0.0.1:5273/?qa=1`, verified 26 journey nodes / one active node / Buddy / friend meadow, completed the first story activity, returned with 1 done node and 1 new active node, and confirmed no document-level page scroll. Screenshot: `.qa-artifacts/story-mode/reis-mobile-fixed.png`.
- Product hardening validation, Sterrenreis pass: `npm.cmd run verify` passed with typecheck, lint, 5 test files / 60 tests, and production build. Local smoke `http://127.0.0.1:5273/` returned HTTP 200 and Cloudflare smoke `https://logged-intend-chat-medicaid.trycloudflare.com` returned HTTP 200.
- Sterrenreis expansion pass: added shared journey copy helpers for child-facing node titles/actions/progress and surfaced them in a compact `Volgende stap` quest card above the map. The map now shows a `2/26`-style progress badge and a small label under the active node, making the route read as one story objective rather than only a chain of icons.
- Story progression hardening pass: regression coverage now proves story runner gates advance after a real run, friend nodes are rescued into the meadow, and the final star completes the journey. This closes the main untested story-mode branches beyond the first calm activity.
- Story-mode visual QA, quest-card pass: in-app browser QA at `390x844` verified the expanded quest card, active-node label, `2/26` progress pill, no document-level page scroll, no quest/progress-rail overlap, and visible friend meadow. Screenshot: `.qa-artifacts/story-mode/reis-expanded-quest-fixed.png`.
- Product hardening validation, expanded Sterrenreis pass: `npm.cmd run verify` passed with typecheck, lint, 5 test files / 61 tests, and production build. Local smoke `http://127.0.0.1:5273/` returned HTTP 200 and Cloudflare smoke `https://logged-intend-chat-medicaid.trycloudflare.com` returned HTTP 200.
- User feedback, runner gate clarity pass: Sprint gates now render as distinct high-contrast lane portals instead of three similar distant frames. Each lane gets its own colored floor pad, dark readable sign panel, larger quantity art, a 5+n shelf, and extra first-five/extra runway blocks on the lane pad so quantities stay readable by structure and not by hue alone.
- Live readability, runner gate clarity pass: RunnerView now also draws a small in-world choice preview on the road just ahead of the dino. The preview mirrors the current gate's three lane quantities using 5+n blocks and highlights the selected lane, so the child can read the next choice before the gate is fully close without adding a blocking card overlay.
- Story route hardening, Memory return pass: Memory now behaves like the other story-launched calm modes: `Terug` returns to Sterrenreis, finishing the board advances the active journey node, and the done screen shows `Verder` instead of dropping the child back into Speeltuin.
- Regression coverage, runner gate clarity pass: flow tests now assert 3D gates expose distinct lane portals, lane pads, quantity panels, 5+n gate shelves, lane runway tokens, and selected-lane road previews. A new story regression proves Memory nodes advance and return to the next Sterrenreis frontier.
- Browser visual QA, runner gate clarity pass: in-app browser QA at `390x844` played through Sterrenreis to fresh runner gates, verified the mobile runner scene has a 390x844 canvas, no horizontal overflow, controls within the viewport, visible high-contrast gate panels, colored lane pads, lane runway blocks, and near-hero 5+n lane previews. Screenshot: `.qa-artifacts/runner-gate-clarity/mobile-gate-lane-previews.png`.
- Product hardening validation, runner gate clarity pass: `npm.cmd run typecheck`, `npm.cmd run test -- tests/flow.test.ts`, and `npm.cmd run verify` passed. Full verification is now 5 test files / 63 tests with production build.
- Claude continuation visual pass: confirmed the latest commit `2895896` is active on `revamp/real-runner`, including the glossy Sterrenreis map, richer runner gate panels, colored lane pads, and clearer in-world 5+n lane previews.
- QA maintenance, Sterrenreis default pass: updated `scripts/viewport-qa.mjs` so the menu scenarios validate the current `ReisScene` journey map instead of the retired `.mission-step`/menu progress UI, and so Number Portal and Oefenwereld scenarios open via the QA scene hook.
- Product hardening validation, current hosted pass: `npm.cmd run qa:viewport` passed all 15 scenarios and `npm.cmd run verify` passed with typecheck, lint, 5 test files / 67 tests, and production build. Local smoke `http://127.0.0.1:5273/` and Cloudflare smoke `https://definition-some-cat-involvement.trycloudflare.com` both returned HTTP 200.
- Runner readability revamp pass: the real Sterrenreis `run` scene now renders a large voxel numeral as the dominant mark on every in-world gate lane, keeps the smaller structured getalbeeld underneath, and adds near-hero 3D preview signs so the child can see `links/midden/rechts = getal` before the far gate reaches the dino.
- QA maintenance, real runner coverage pass: `npm.cmd run qa:viewport` now includes `real-runner-mobile` and validates the real `run` scene for visible canvas, on-screen controls, big in-world gate numerals, near-hero preview signs, and near-hero preview numerals. `npm.cmd run qa:mobile-touch` now starts by touching the real `run` controls before running the longer Number Portal -> Sprint -> WebWoud -> City -> Summary touch path.
- Product hardening validation, runner readability pass: `npm.cmd run test -- tests/flow.test.ts`, `npm.cmd run typecheck`, `npm.cmd run qa:viewport`, `npm.cmd run qa:mobile-touch`, and `npm.cmd run verify` passed. The official screenshot `.qa-artifacts/viewport-qa/real-runner-mobile.png` was inspected and clearly shows lanes `4`, `2`, and `5` with target `Pak de 5!`.
- Runner gate CLARITY revamp (supersedes the previous "readability" pass): the parent still could not tell which number was which gate, so the gate was rebuilt around a single either/or choice. Each gate is now a big left/right **fork** (two lanes, lanes 0 and 2, with a clear gap between them) instead of three lanes; the in-world clutter (per-lane chevrons, number runways, 5+ shelves, and the near-hero 3D preview signs) was removed. Every gate now reads by (1) a stable **per-number colour** — `numberColor(q)` in `src/runner/voxelNumber.ts`, 1=red … 10=gold — applied to the doorway posts, lintel, sign frame and a glowing floor carpet, (2) a giant voxel **numeral** as the dominant mark, and (3) the matching getalbeeld beneath it. The HUD target card is tinted the same number colour, and `RunnerCore` eases the run into **slow-motion** (down to ~58%, ~5.8 from ~14 units/s in the live check) as a gate approaches so a 5-year-old has time to read and commit. Correct/wrong now give instant feedback (the wrong-answer beat shows and speaks "Het was de N!"). `gateProvider` emits the fork with a per-lane `optionIndex`; `RunnerCore` carries `chosenOptionIndex` so the attempt log stays accurate. Verified: `npx tsc --noEmit`, `npm run lint`, `npx vitest run` (5 files / 68 tests), `vite build`, plus a live in-browser `?qa` run on `grasland` (scene-graph confirmed a 2-lane fork with number-matched colours, 6/6 gates correct when steered, slow-mo engaged, no console errors). The Chrome `qa:viewport` `real-runner-mobile` assertions were updated to the new roles (big numeral + getalbeeld + number-coloured floor) but the full real-Chrome `qa:*` harness was not re-run in this environment.

## Known Issues

- Port `5173` is occupied by another local app in this environment, so use `5273` or another free port when running this project here.
- The Cloudflare quick tunnel URL is ephemeral and stays live only while the local Vite and `cloudflared` processes are running. Latest verified URL: `https://definition-some-cat-involvement.trycloudflare.com`.
- The new product-readiness goal is not complete yet. The latest pivot removes the live Sprint/WebWoud/Oefenwereld/Sterrenstad-build card/coach/ribbon/header overlays, enlarges 3D number structures, adds 3D guide/outcome objects, makes the DOM layer act as transparent mobile input, makes Sprint runner targets visually match the actual mechanic instead of rendering every challenge as generic gates, keeps live target representations visible instead of replacing them with a question mark, replaces ambiguous two-button movement controls with left/action/right icon controls, uses compact icon-only live utility controls, makes Sprint's central action contextual to each mechanic, applies adaptive live-pressure timing to route/dash progress, reduces live HUD reading load with compact micro-goal chips, converts Oefenwereld into a timed object-dash loop, converts Sterrenstad build mode into a timed build-dash loop, adds selected-path 5+n pickup trails to live play, replaces the placeholder hero with a multi-part low-poly dino, adds progress-driven hero motion, pickup-chain collection state, explicit rescue/build 3D win moments, themed 3D landmarks to all live worlds, child-facing menu/summary progression, visible first-viewport summary replay actions, a non-skippable Number Portal wake gate, visual adventure-transition bridges/toasts, route milestone reward pacing, a locked one-adventure child menu, safe in-world scaffold beacons after wrong choices, local installable fullscreen/offline/safe-area mobile shell metadata plus a best-effort fullscreen request from start/replay gestures, a direct child-first `Bouw nu` city entry, robust touch swipe input, a Chrome real-touch mobile playthrough QA script, a short-height gameplay compaction CSS contract, and real Chrome viewport/screenshot QA for mobile menu, 360px narrow menu, number portal, live play, 360px narrow runner, wrong-choice scaffold, city overview, city build, 360px narrow city build, summary, 360px narrow summary, plus `1280x720`. More work is required before the whole product feels like a finished mobile 3D game. Number Portal, Runner, WebWoud, Oefenwereld minigames, Sterrenstad city map/restoration yard, dashboard, summary finish world, non-blocking reward pickup feedback, celebration bursts, wrong-choice scaffolds, city finish flow, mobile swipe controls, action pads, timed runner/webwoud/object/build loops, game-world menu mission route, tested local audio/haptic cue routing, selected lane/anchor beacons, road/canopy/minigame/city/portal game-field corrections, adaptive live-window metrics, immediate replay loop controls, installable/offline/safe-area mobile shell metadata, automated 390px and 360px viewport screenshots, and automated real-touch mobile playthrough now pass checks. The game still needs physical hands-on phone QA and a final full-session fun/intuitiveness pass before calling it production-ready.

## Next Steps

- Continue the 3D pivot: use the latest 390px and 360px viewport screenshots plus `.qa-artifacts/mobile-touch-qa/summary-touch-mobile.png` as the baseline, then run a full-session hands-on phone fun/intuitiveness pass.
- Next product pass should focus on hands-on phone QA and final product-readiness audit against `docs/GAME_SPEC.md` / `docs/PLAN.md`: verify that all required mechanics are not only implemented but feel coherent across a full session, then close any acceptance gaps before considering completion.
- Run hands-on phone QA through the Cloudflare URL with the latest game-world menu route and progress strip, Number Portal adventure bridge, full-screen mechanic-specific 3D Sprint with micro-goal chips and route milestones, full-screen 3D timed canopy/anchor WebWoud with rescue milestones, transition toasts, themed 3D live-world landmarks, low-poly animated dino hero, selected-path 5+n pickup chains, movement-only live controls, non-blocking reward pickups, Oefenwereld timed object-dash minigames, Sterrenstad city map/timed build-dash restoration yard, rescue/build 3D win moments, treasure-trail summary with finish bridge, dashboard, city finish-flow, mobile swipe-control changes, audio cues with mute off, and haptics on.

## Curriculum Expansion Research - 2026-06-27

Completed work:

- Read the current game specification, milestone plan, implementation runbook, status log, education types, challenge factory, minigame templates, journey data, mastery tracker, adaptive engine, misconceptions, and voice manager.
- Researched first-grade curriculum signals for Flanders using official minimumdoelen rollout information, the onderwijsdoelen entry point, a 2025-2026 first-grade school info booklet, and Veilig leren lezen Zoem-version didactic notes.
- Added `docs/CURRICULUM_GAME_MODES_PROPOSAL.md` as the detailed Claude hand-off for more game modes and curriculum expansion.

Decisions made:

- Treat official Flemish goals as anchor goals rather than separate first-grade-only requirements, then map first-grade game content through common L1 method practice.
- Keep the existing number-structure game as the foundation, but expand into a generic curriculum layer so reading, measurement, geometry, time, money, and traffic tasks are not forced into numeric-only attempt logs.
- Prioritize `Splitbord Builder` first because it directly implements the 3-box part-whole board and all splits such as 5 = 0+5, 1+4, 2+3, 3+2, 4+1, and 5+0.
- Prioritize literacy next with Klankgrot, Zoemroute, Woordbouwplaats, and Letterkompas, because first grade has a major reading focus.
- Keep letter order and word lists configurable and local; do not clone one commercial reading method wholesale.

Validation:

- Docs-only research/proposal pass. No runtime files changed and no app validation was run.

Next steps for Claude:

- Start from `docs/CURRICULUM_GAME_MODES_PROPOSAL.md`.
- Add curriculum type scaffolding without breaking existing number tests.
- Implement Splitbord Builder, then the first literacy data/modes, then number-line/20, operations-to-20, and measurement/geometry/time/money.
- Add tests, adaptive selection, persistence, dashboard panels, and mobile viewport QA for each new mode before marking it complete.

## TTS Provider Shootout - 2026-06-30

Completed work:

- Researched current build-time TTS options for a natural female Dutch voice-pack: Deepgram Aura-2 Dutch voices, OpenAI `gpt-4o-mini-tts`, ElevenLabs current TTS models, and Cartesia Sonic models.
- Added `scripts/deepgram-voice-samples.mjs` for a focused Deepgram-only Dutch female voice sample set.
- Added `scripts/tts-provider-shootout.mjs`, a conditional multi-provider sample generator for Deepgram, OpenAI, ElevenLabs, and Cartesia.
- Added `docs/TTS_PROVIDER_SHOOTOUT.md` with provider notes, required environment keys, generated artifact paths, and selection guidance.
- Generated 30 Deepgram MP3 clips under `.qa-artifacts/tts-provider-shootout/` and a local listening page at `.qa-artifacts/tts-provider-shootout/index.html`.

Decisions made:

- Keep TTS as build-time generation only. The game should ship local voice clips and should not call paid TTS APIs during child play.
- Use provider shootouts only to select a voice. Final approved clips must be copied into `public/audio/voice/...` and added to `assets/ASSET_MANIFEST.json`.
- OpenAI, ElevenLabs, and Cartesia were not generated in this pass because no `OPENAI_API_KEY`, `ELEVENLABS_API_KEY` / `XI_API_KEY`, or `CARTESIA_API_KEY` was found in the local environment/OpenClaw scan.

Validation:

- `node --check scripts\tts-provider-shootout.mjs` passed.
- `node --check scripts\deepgram-voice-samples.mjs` passed.
- The multi-provider report confirmed 6 Deepgram voices with 5 clips each, and correctly marked OpenAI, ElevenLabs, and Cartesia as skipped due to missing keys.

Next steps:

- Listen to `.qa-artifacts/tts-provider-shootout/index.html` and shortlist the best Deepgram voices.
- Add provider keys and rerun `node scripts\tts-provider-shootout.mjs` to generate OpenAI, ElevenLabs, and Cartesia samples on the same five lines.
- Pick a primary voice and generate the full final BlokBlitz voice-pack.

## Deepgram Agent Managed TTS Test - 2026-06-30

Completed work:

- Added `scripts/deepgram-agent-tts-samples.mjs` to test Deepgram Voice Agent TTS routing with the existing Deepgram key.
- Verified the Voice Agent settings from Deepgram docs: wait for `Welcome`, send `Settings`, use `agent.greeting` for a direct spoken line, collect binary audio until `AgentAudioDone`.
- Generated 6 working Deepgram-managed Cartesia Sonic 3.5 clips under `.qa-artifacts/deepgram-agent-tts-samples/`.
- Added a listening page at `.qa-artifacts/deepgram-agent-tts-samples/index.html`.

Findings:

- Deepgram-managed Cartesia works with only the Deepgram key using `agent.speak.provider.type = "cartesia"`, `model_id = "sonic-3.5"`, and `language = "nl"`.
- Cartesia Agent output must use `linear16`, `mulaw`, or `alaw`; the script wraps `linear16` output as local WAV files.
- Deepgram Aura-2 Dutch voices still work through the direct `/v1/speak` route, but the tested Voice Agent Aura settings returned `FAILED_TO_SPEAK`, so direct Deepgram TTS remains the right route for Aura voice-pack generation.
- OpenAI and ElevenLabs through Deepgram Agent remain BYO-key routes, not Deepgram-key-only routes.

Validation:

- `node scripts\deepgram-agent-tts-samples.mjs` generated 6 Cartesia WAV clips successfully.

Next steps:

- Listen to both `.qa-artifacts/tts-provider-shootout/index.html` and `.qa-artifacts/deepgram-agent-tts-samples/index.html`.
- Compare Deepgram Aura-2 Dutch voices against Deepgram-managed Cartesia Sonic 3.5 voices for the child-game use case.

Voice selection update:

- User listened to the Deepgram shootout and picked `aura-2-hestia-nl` / Hestia as the likely best Dutch female voice.
- Treat Hestia as the primary candidate for the first full local voice-pack generation pass.
- Use direct Deepgram `/v1/speak` for Hestia MP3 generation, not Voice Agent.

## Hestia Voice-Pack Generation - 2026-06-30

Completed work:

- Added `scripts/generate-hestia-voice-pack.mjs`, a resumable Deepgram `/v1/speak` generator for the selected Hestia voice.
- Generated 737 local MP3 clips under `public/audio/voice/nl/hestia/`.
- Generated `public/audio/voice/nl/hestia/voice-lines.json` with the full line inventory and `src/game/voiceLineManifest.ts` with runtime slug lookup.
- Added `npm.cmd run voice:hestia` for future regeneration.
- Replaced browser-first speech with local Hestia-first playback in `src/game/VoiceManager.ts`; Web Speech remains fallback for dynamic lines without a pre-generated clip.
- Updated `assets/ASSET_MANIFEST.json` to document the Deepgram-generated local runtime voice-pack.
- Updated README and TTS docs to describe the local Hestia voice-pack path.
- Added automated checks that the voice-pack manifest maps common spoken lines to local MP3 files.

Decisions made:

- Keep the voice-pack same-origin/local at runtime. Deepgram is used only at build-time.
- Keep direct Deepgram Aura-2 `/v1/speak` as the Hestia generation route because it reliably returns MP3 clips.
- Do not try to pre-record highly dynamic lines with friend/sticker names yet; those continue through the fallback path.

Validation:

- Generation completed after a resumable retry: 737 line inventory, 737 local MP3 files.
- Script retry logic was added after a transient socket close during generation.

Next steps:

- Run typecheck/tests/build after the voice-pack integration.
- Listen to a small final sample directly from `public/audio/voice/nl/hestia/` during browser QA.

## Reading Phoneme Audio Correction - 2026-07-01

Completed work:

- Added `src/education/literacy/phonemeInventory.ts` with a didactic reading-audio inventory for current letters, phoneme units, Dutch digraphs, and word clips.
- Tried a generated Hestia reading phoneme pack, then rejected it after listening QA because it sounded worse than the older browser/computer voice for isolated letters and "zoemend lezen".
- Removed the rejected generated reading clips from `public/audio/reading/`, removed the reading audio manifest, and removed the `reading:hestia` regeneration script.
- Added `src/game/ReadingAudioManager.ts`, which now forces browser speech for reading prompts so generated Hestia sentence clips cannot be selected for `m`, `aa`, `n`, etc.
- Wired Klankgrot, Letterkompas, Zoemroute, and Woordbouwplaats to `game.readingAudio`.
- Updated `assets/ASSET_MANIFEST.json`, README, and the TTS shootout notes.

Decisions made:

- Keep normal Hestia sentence voice and reading phoneme audio as separate runtime paths.
- Use the browser/computer voice for early reading until a genuinely better source is available, likely human-recorded clips or a provider proven on isolated Dutch phonemes.
- Do not ship the rejected Hestia reading phoneme pack.
- Keep Deepgram build-time only. The game does not call paid TTS APIs during child play.

Validation:

- Focused audio/acceptance test run passed after the correction: 5 files / 27 tests.
- `npm.cmd run verify` passed after the correction with typecheck, lint, 14 test files / 116 tests, and production build.
- Confirmed `public/audio/reading/`, `src/game/readingAudioManifest.ts`, and `scripts/generate-reading-audio-pack.mjs` are no longer present.

Next steps:

- Listen in-game to Klankgrot, Letterkompas, Zoemroute, and Woordbouwplaats with the browser voice. If that is still not good enough, switch strategy to a small human-recorded Dutch phoneme set instead of generated TTS.

## Journey Order and ElevenLabs Reading Shootout - 2026-07-02

Completed work:

- Moved `kloktoren` out of the early Muntgrot region and into the final `sterrenrace` region, after `zoemroute` and `tienbrug`.
- Reordered the Speeltuin hub cards so clock reading is also visually late in the free-play list.
- Restored `src/game/ReadingAudioManager.ts` to browser-only speech for isolated letters, phoneme sequences, and zoemend lezen. Normal Hestia sentence clips remain active through `VoiceManager`.
- Added `scripts/elevenlabs-reading-shootout.mjs` plus `npm.cmd run voice:elevenlabs-reading` for QA-only ElevenLabs phoneme tests.
- Generated 144 ElevenLabs MP3 samples under `.qa-artifacts/elevenlabs-reading-shootout/`, covering Lily, Alice, and Sarah across `eleven_v3`, `eleven_multilingual_v2`, and `eleven_flash_v2_5`.

Decisions made:

- Do not route reading phonemes through the Hestia voice-pack. It regressed the actual reading use case even if full-sentence speech is acceptable.
- Do not call ElevenLabs at runtime. If a sample wins listening QA, generate a local reading pack from that exact voice/model later.
- If ElevenLabs still fails on isolated Dutch phonemes, use a tiny human-recorded Dutch phoneme pack instead of more generic TTS attempts.

Artifacts:

- Listening page: `.qa-artifacts/elevenlabs-reading-shootout/index.html`.
- Metadata: `.qa-artifacts/elevenlabs-reading-shootout/results.json`.

Validation:

- `npm.cmd run typecheck` passed.
- `npm.cmd run test -- tests/audio.test.ts tests/flow.test.ts` passed: 2 files / 74 tests.
- `npm.cmd run verify` passed: typecheck, lint, 18 test files / 140 tests, and production build.
- `node --check scripts\elevenlabs-reading-shootout.mjs` passed.

Next steps:

- Listen to the ElevenLabs page and score first on isolated phonemes (`m`, `s`, `aa`, `ui`, `eu`) and only then on full-sentence warmth.
- If one model/voice passes, generate a local `public/audio/reading/...` pack and keep it separate from the normal sentence voice-pack.

## ElevenLabs Reading Iteration - 2026-07-02

Completed work:

- User selected `eleven_v3` as the best current ElevenLabs model family.
- User rejected the raw isolated `aa`, `ui`, `eu`, and `b` clips, while confirming `buh` works better for the `b` phoneme.
- Extended `scripts/elevenlabs-reading-shootout.mjs` with `ELEVENLABS_SAMPLE_SET=problem-phonemes-v2`, per-line voice settings, text-normalization control, and temporary IPA pronunciation-dictionary support.
- Generated a focused Lily / `eleven_v3` iteration set under `.qa-artifacts/elevenlabs-reading-iteration-v2/`.

Artifacts:

- Listening page: `.qa-artifacts/elevenlabs-reading-iteration-v2/index.html`.
- Metadata: `.qa-artifacts/elevenlabs-reading-iteration-v2/results.json`.

Generation details:

- 26 clips generated.
- 0 skipped.
- Temporary ElevenLabs pronunciation dictionary was archived after generation.

Validation:

- `node --check scripts\elevenlabs-reading-shootout.mjs` passed.
- Iteration metadata check passed: 26 rows, 0 skipped, temporary dictionary archived.

Decision update:

- Treat raw `b` as rejected for generated reading packs. Use the existing `buh` fallback text for `b`.
- Score the new `aa`, `ui`, and `eu` rows by isolated phoneme quality first. Carrier rows are only useful if we decide a longer prompt is acceptable.

## ElevenLabs Rating Page Update - 2026-07-02

Completed work:

- Added `++`, `+`, `-`, and `--` rating buttons to the ElevenLabs QA HTML renderer.
- Ratings persist in browser `localStorage` per listening page.
- Added live JSON summary, copy button, download button, and clear button so the ratings can be reused for later iteration.
- Added `ELEVENLABS_RENDER_ONLY=1` so an existing `results.json` can be re-rendered as HTML without calling the ElevenLabs API again.
- Added `scripts/tts-rating-server.mjs` and `npm.cmd run voice:ratings-server` so the ratings page can save to `.qa-artifacts/tts-ratings/latest.json` through a local-only endpoint.
- Added a `Save to Codex` button plus autosave attempts to the rating page.
- Re-rendered `.qa-artifacts/elevenlabs-reading-iteration-v2/index.html` from its existing metadata.
- Started the local rating server on `http://127.0.0.1:5391`.

Validation:

- `node --check scripts\elevenlabs-reading-shootout.mjs` passed.
- `node --check scripts\tts-rating-server.mjs` passed.
- Confirmed the rendered HTML contains rating buttons, localStorage persistence, JSON copy, and JSON download controls.
- Confirmed `GET http://127.0.0.1:5391/ratings` returns 404 before the first save, which means the server is reachable and waiting for saved ratings.

## ElevenLabs V2 Ratings and Final TTS Iteration - 2026-07-02

Completed work:

- Read `.qa-artifacts/tts-ratings/latest.json` after the user saved ratings from the browser page.
- Ratings covered all 26 V2 rows: 7 `++`, 3 `+`, 6 `-`, and 10 `--`.
- Added `ELEVENLABS_SAMPLE_SET=problem-phonemes-v3`, focused on short carrier forms and chain-ready fragments rather than raw isolated vowel tokens.
- Generated `.qa-artifacts/elevenlabs-reading-iteration-v3/` with 29 Lily / `eleven_v3` clips and the same `++/+/-/--` rating UI.

Score conclusions from V2:

- Good: full-sentence control, `aa/ui/eu` carrier phrases (`Zeg de ...-klank zoals in ...`), `buh`, `buh.`, and the `b` IPA token.
- Weak or rejected: raw isolated `aa`, all raw/IPA `ui` attempts, raw/IPA `eu` attempts, and long zoem blends such as `hhh... ui... sss... huis`.
- Practical interpretation: ElevenLabs can likely provide reading instructions and carrier prompts, but it is still not reliable enough for pure phoneme stones or full generated zoem blends.

Artifacts:

- V2 saved ratings: `.qa-artifacts/tts-ratings/latest.json`.
- V3 listening page: `.qa-artifacts/elevenlabs-reading-iteration-v3/index.html`.
- V3 metadata: `.qa-artifacts/elevenlabs-reading-iteration-v3/results.json`.

Decision update:

- If V3 short carriers do not produce enough `++` clips for `aa`, `ui`, and `eu`, stop iterating with generic TTS and record the small phoneme set manually.
- For a production reading pack, prefer separate local clips for each sound/unit and chain them in `ReadingAudioManager`; do not depend on one generated full zoem sentence.

## Human Reading Recording Studio - 2026-07-02

Completed work:

- Added `scripts/reading-recording-studio.mjs`, a local-only recording studio for first-grade reading sounds.
- Added `npm.cmd run voice:record-reading`.
- The studio runs at `http://127.0.0.1:5393/` and records browser microphone input as mono WAV.
- Recordings are trimmed, normalized, and saved under `.qa-artifacts/reading-recordings/raw/<klank>.wav`.
- Added a local word builder that assembles current `PHONICS_WORDS` into:
  - `.qa-artifacts/reading-recordings/words/<word>.wav`
  - `.qa-artifacts/reading-recordings/blends/<word>.wav`
- The word builder uses pure Node WAV parsing/encoding because `ffmpeg` is not installed on this machine.

Validation:

- `node --check scripts\reading-recording-studio.mjs` passed.
- `GET http://127.0.0.1:5393/` returned 200.
- `GET http://127.0.0.1:5393/api/state` returned 32 phonemes.
- `POST http://127.0.0.1:5393/api/build-words` returned 200 and correctly listed missing phonemes before any recordings exist.

Next steps:

- Record the needed phonemes in the studio.
- Click `Maak woorden` after recording; then review the generated word and zoem WAVs.
- Once the human clips pass listening QA, copy the approved WAVs into a runtime reading pack and update `ReadingAudioManager` to prefer local human clips before browser fallback.

## Human Zoem Recording Update - 2026-07-02

Completed work:

- User recorded all 32 reading phonemes and built 14 generated word/zoem clips.
- The generated zoem clips still did not sound natural enough.
- Updated `scripts/reading-recording-studio.mjs` so every word now has a `Record Zoem` button.
- Manual zoem recordings are saved under `.qa-artifacts/reading-recordings/blends-manual/<word>.wav`.
- Final blend clips live under `.qa-artifacts/reading-recordings/blends/<word>.wav`; if a manual clip exists it is used as the final clip, otherwise the generated fallback is used.
- Generated fallbacks now live separately under `.qa-artifacts/reading-recordings/blends-generated/<word>.wav`.
- Improved generated fallback assembly with light crossfade and shorter gaps, but manual full-word zoem recording is now the preferred path.
- Restarted the studio on `http://127.0.0.1:5393/`.

Validation:

- `node --check scripts\reading-recording-studio.mjs` passed.
- Rebuilt generated fallback clips for all 14 current reading words.
- `GET /api/state` now reports 32 raw phonemes, 14 word clips, 14 final blend clips, 14 generated blend clips, and 0 manual blend clips before manual word recording starts.

Next steps:

- Refresh `http://127.0.0.1:5393/`.
- For each target word, use `Record Zoem` and speak the shown prompt as one smooth phrase, e.g. `mmm ... aa ... nnn ... maan`.
- Use `Play handmatig` and `Play eindclip` to QA. The game integration should use `blends/` as the final approved source.

## Fullscreen Landscape Visibility Fix - 2026-07-04

Completed work:

- Reproduced the browser fullscreen visibility issue as a mobile-landscape runner regression at `844x390`.
- Expanded `scripts/viewport-qa.mjs` with desktop fullscreen coverage for journey, hub, real runner, Klankgrot, and boss scenes, plus a mobile-landscape real runner case.
- Added a targeted `max-height: 520px` and `min-width: 700px` runner HUD compaction rule.
- In short landscape/fullscreen heights, the runner now uses a smaller top bar, progress meter, target card, target art, and compact but still 64px-high controls.

Validation:

- `npm.cmd run qa:viewport` passed with the new fullscreen and landscape scenarios.
- Inspected `.qa-artifacts/viewport-qa/real-runner-landscape-mobile.png`: target, road, dino, progress, menu, stats, and bottom controls are fully visible.
- Inspected `.qa-artifacts/viewport-qa/real-runner-fullscreen-desktop.png`: desktop fullscreen remains spacious and intact.
- `npm.cmd install` passed with no package changes; npm still reports one low-severity audit item.
- `npm.cmd run typecheck` passed.
- `npm.cmd run lint` passed.
- `npm.cmd run test` passed: 19 files, 153 tests. Vitest still logs the known jsdom canvas `getContext()` warnings.
- `npm.cmd run build` passed.

Next steps:

- If the user sees another hidden UI case, reproduce it as a viewport scenario before changing layout.
- Add landscape coverage for more minigame scenes if children are expected to play in phone landscape routinely.

## Sprintsite Hosting Setup - 2026-07-04

Completed work:

- Checked OpenClaw and WSL sprintsite context.
- Confirmed WSL `Ubuntu-24.04` loads a Cloudflare token from `/home/kenny/.openclaw/credentials/cloudflare.token`; the token value was not copied into the repo.
- Confirmed `wrangler whoami` works in WSL for account `07ae25240af8e83084372827b6d5a9a2`.
- Confirmed Cloudflare Pages currently fails with auth code `10000`, so the current token is not suitable for Pages deploys.
- Added Cloudflare Worker Static Assets config in `wrangler.toml` for Worker `blokblitz`.
- Added explicit `workers_dev = true` and a custom-domain route for `blokblitz.sprintsite.be`.
- Added `deploy:sprintsite` and `deploy:sprintsite:dry-run` package scripts for environments where Wrangler has auth.
- Wrote the durable handoff guide at `C:\Users\de_do\Documents\BLOKBLITZ_SPRINTSITE_HANDLEIDING.md`.
- Deployed Worker `blokblitz` through WSL Wrangler.

Decisions made:

- Use Cloudflare Worker Static Assets first because existing WSL Wrangler auth works for Workers, while Pages auth does not.
- Keep the game local-first at runtime; hosting is only static distribution of built local assets.
- Do not store Cloudflare, TTS, or other API keys in this repository or the handoff guide.
- Use `blokblitz.sprintsite.be` as the sprintsite custom domain; leave existing sprintsite production subdomains untouched.

Validation:

- `npm.cmd install` passed; npm still reports one low-severity audit item.
- `npm.cmd run typecheck` passed.
- `npm.cmd run lint` passed.
- `npm.cmd run test` passed: 19 files, 153 tests. Vitest still logs the known jsdom canvas `getContext()` warnings.
- `npm.cmd run build` passed.
- `npm.cmd run qa:viewport` passed across 18 scenarios.
- WSL Wrangler dry-run passed for Worker Static Assets.
- WSL Wrangler deploy succeeded for Worker `blokblitz`; latest deployed version with `workers.dev`, preview URLs disabled, and custom domain config is `06de0106-679a-4eb2-b3e0-6b662b2e5fd7`.
- `https://blokblitz.kennydd001.workers.dev/` returned 200 for HTML, JS, CSS, and SPA fallback.
- Cloudflare DNS (`1.1.1.1`) returned A/AAAA records for `blokblitz.sprintsite.be`.
- A forced-resolve HTTP check for `https://blokblitz.sprintsite.be/` returned 200. The default Windows/provider resolver had not picked up the new DNS record yet immediately after deploy.

Next steps:

- Recheck `https://blokblitz.sprintsite.be/` from normal browsers after local/provider DNS cache catches up.
- Use the same WSL Wrangler deploy command after future Claude changes.

## Adventure Road AAA + Game Signature Moments + Offline Cache - 2026-07-04

Completed work (Claude, merged to master in five milestones):

- FIXED `regionBands()`: the top/bottom special cases were swapped, so the
  sterrenrace band covered the whole map and hid all six world colours.
- Adventure road: healing veils per region (grey lifts with completion, soft
  mist edge), a golden progress trail over the travelled road, and portal
  arches with world name plates at every border (sleeping grey / awake
  colour, doorstep-aware name plates, exact bezier road anchoring).
- Living world: fully healed regions render 7 animated critters keyed to
  their world (butterflies/sparks/snow/fireflies/work-sparks/twinkles), the
  rescued friend wanders around its rescue spot, a just-healed region's veil
  sweeps away LIVE on arrival, and border gates flash gold when Buddy walks
  through.
- Finale cinematic: full-screen night sky, the star rises home, fireworks +
  staggered chimes, all rescued friends hop in a parade, "Hoera!" returns to
  a fully-coloured living map. Re-watchable via the star node.
- Mini-game juice pack (all 22 modes): staggered tile entrances, a star that
  flies into the round's progress dot (dot pops gold + coin chime), fever
  glow at 3-in-a-row (breaks on a wrong answer), plus a protected
  `onCorrect` hook.
- Signature moments for EVERY mode: count wave, match twin-glow, compare
  crown, fill cell-wave, one-more/less arrow, order row-dance, memory pair
  sparks, splitbord snap + landing numbers, klankgrot crystal burst,
  letterkompas compass spin, zoemroute bee + stone hops, woordbouw sound
  snap, tientalhuis house glow + roof star, vormenburcht castle pop,
  meetwerf tape slide, verkeerspad traffic light + green safe glow,
  luisterbos story bloom + leaves, getallenlijn slide, tienbrug bridge
  light-wave + runner, kloktoren bell, geldmarkt coin hops.
- Service worker v2 for the live sprintsite deploy: content-hashed
  `/assets/` bundles and the `/audio/` voice pack are now cache-first
  (instant repeat loads, full offline play); the HTML shell stays
  network-first so new deploys are picked up next visit.

Validation:

- Each signature moment was verified in a real browser with a freeze-frame
  technique (block scene timers around the correct tap, then pause all CSS
  animations mid-flight and screenshot). This caught and fixed the Splitbord
  "?" box not receiving the real landing value and the Tienbrug light-wave
  targeting circles while the ten-frame uses rects.
- typecheck, lint, test (19 files / 154 tests), build, qa:viewport all green.

Next steps:

- Deploy via the WSL Wrangler command from the handleiding and smoke-test
  both URLs.
- Candidates: per-world ambient audio layer, parent dashboard depth,
  lazy-loading the Three.js chunk (Game.ts owns the renderer, so this is a
  bigger refactor).

Deploy note (Claude, 2026-07-04): after the milestones above, deployed via
the WSL Wrangler command from the handleiding. Worker version
`a6987cf0-d825-45a9-b4c3-bc8d0d1841da`; 4 changed assets uploaded
(index.html, hashed JS/CSS, sw.js). Smoke tests: workers.dev root,
blokblitz.sprintsite.be root, /sw.js and a voice clip all returned 200, and
the live HTML references the freshly built bundle.

## Lazy Three.js: 63% smaller boot bundle - 2026-07-05

Completed work (Claude):

- Split the WebGL layer out of `Game` into `src/game/Stage3D.ts`
  (renderer/scene/camera/menu backdrop/per-frame render). `Game` no longer
  imports three; it exposes `stage3d?` + `ensureStage3d()` (dynamic import)
  and warms the chunk in `start()` while the child is on the DOM-only map.
- `resetWorld(theme)` remembers the requested theme and applies it when the
  chunk lands; resize/update are no-ops until then.
- `RunScene` runs HEADLESS until the view lands: HUD, countdown, input and
  RunnerCore all work without 3D; the view attaches via
  `Promise.all([ensureStage3d(), import(RunnerView)])` guarded by a mount
  token. In practice the chunk is warm before the first run.
- `numberColor` moved to three-free `src/runner/numberColor.ts` (re-exported
  from voxelNumber) so the HUD tint doesn't drag three into the boot bundle.
- `scripts/viewport-qa.mjs`: scene-graph metrics now read
  `game.stage3d.world` and the real-runner open step polls until in-world
  gate numerals exist before validating.

Result: boot JS 745 kB -> 262 kB (gzip 190 kB -> 71 kB). three (475 kB),
Stage3D and RunnerView are lazy chunks fetched in the background after boot,
cache-first offline via sw.js v2.

Validation: typecheck, lint, 153 tests, build, qa:viewport 18/18 green; live
preview check confirmed the runner builds its world via the lazy chunks with
zero console errors.

## Dynamic Difficulty + Sterrenrondes (the path continues) - 2026-07-05

Completed work (Claude):

- New pure `src/education/difficulty.ts`: `journeyTier()` combines three
  transparent signals into a tier 1..3 — the Sterrenronde (base), how deep
  into the path the launching node sits (second half = +1), and recent
  accuracy over the last 20 attempts (>=0.9 bumps up, <0.6 drops down,
  ignored under 10 attempts, never below tier 1).
- `Game.difficultyTier()` exposes it (story mode uses the launching node,
  free play the frontier); `MiniGameScene.tier()` + tiered `focusQuantity`
  (tier 1 caps quantities at 5, tier 3 biases 4+) gives ALL number modes
  dynamic difficulty for free.
- Tier-aware generators: getallenlijn (1..9 / full line / 9..19 + no
  "before" mode at tier 1), tienbrug (to-ten-heavy / mix / add-sub only),
  kloktoren (whole hours / mix / half-hour heavy), klankgrot (begin-end /
  mix / blend-heavy). Runner pace scales 0.92/1/1.08 by tier.
- Sterrenrondes: `journey.round` (additive save field, migrated to 1),
  `SaveManager.startNewJourneyRound()`. The finale cinematic now offers
  "Nog een reis!" next to "Hoera!": the road resets (world sleeps again),
  the round-2+ story card reframes the journey ("Sterrenronde N"), the
  progress pill shows "RN •", and every mode plays one tier higher. Stars,
  stickers, Buddy level AND the friend meadow stay earned (friendships
  survive the reset).

Validation: 162 tests (new difficulty.test.ts + Sterrenronde flow test +
migration fix), build, qa:viewport 18/18; live preview click-through of
finale -> Nog een reis -> R2 map with veils back, story card, tier 2.

## Per-Domain Difficulty + Hands-on Splitbord + Playable Intro - 2026-07-05

Completed work (Claude, from the ChatGPT idea list: picked #4, #3 and #2):

- Per-domain difficulty: recentAccuracy() now scopes to ONE learning domain
  (undefined = the classic number modes) and SCENE_DOMAINS maps every
  curriculum scene to its domain. Game.difficultyTier(domain?) +
  MiniGameScene.tier() pass the mode's own domain, so a child strong in
  rekenen but growing in lezen plays each at its own level.
- Hands-on Splitbord: "3 is 2 en hoeveel?" rounds get a tray with ALL the
  eggs (the samen-amount); the child taps eggs INTO the dashed empty box
  (and back out), the numeral matching what they built lights up as a
  suggestion, and the tap on the numeral stays the confirmation — same
  challenge + logging as before. Overshoot is allowed on purpose: seeing
  "too many" is part of the learning.
- Playable intro micro-cinematic (round 1): three visual beats with barely
  any reading — the star falls from the night sky, the world's colour blocks
  drain grey, Buddy catches the star — tap anywhere to skip ahead, voice
  carries the story, then "Start het avontuur!". All beat content stays in
  the DOM (CSS reveals), so screen readers and tests see everything.
  Sterrenronde 2+ keeps the short round card.
- QA harness robustness: collectMetrics now neutralises CSS animations
  synchronously while measuring. This fixed a REAL flake: the journey quest
  card has a pulsing scale animation, so getBoundingClientRect sampled a
  random animation phase and the width check failed intermittently. Also:
  the menu scenario dismisses the (dark) intro cinematic before validating,
  and .reis-quest is border-box so its 96% width includes borders.

Validation: 164 tests (per-domain accuracy test, hands-on splitbord DOM
test, cinematic beats in the intro flow test), build, qa:viewport 18/18;
live checks of the cinematic (all beats + centered Buddy) and the egg tray.

## Audio Pass: cold-start voice + independent mixer + new stingers - 2026-07-05

Audio check + three safe, audible improvements (the reading-audio browser-only
path was left untouched — that is the user's separate iteration and is pinned
by audio.test.ts):

- Cold-start Dutch voice: VoiceManager now warms up getVoices() and caches the
  Dutch voice on `voiceschanged`. Chrome (esp. tablet) returns an empty voice
  list on the first synchronous call, so the very first spoken line ("Op een
  nacht viel er een sterretje...") was being read by the English default
  voice. Verified live: the first browser-only line now uses "Microsoft Frank
  - Dutch". This also improves the reading fallback (guaranteed Dutch).
- Independent audio mixer: split the single "Geluid uit" master into three
  positive toggles — Muziek, Geluidjes, Voorlezen (stem). GameSettings gains
  `music` + `sound`; AudioManager gates music and effects separately;
  SaveManager migrates old `muted` saves (fully muted -> both off). A parent
  can now silence the music but keep the effects (or vice versa) on a tablet.
- Richer stingers: a sparkly ascending "golden" jingle for golden bonus rounds
  (replaces the reused snap) and a triumphant "boss-defeat" stinger, both with
  matching haptic patterns.

Earlier finding, now superseded by the 2026-07-06 ElevenLabs migration below:
Hestia clip coverage of prompts was partial and reading phoneme clips were not
good enough for isolated sounds.

Validation: 166 tests (golden/boss cue patterns, legacy-mute migration split),
build, qa:viewport 18/18 (one transient kloktoren "too flat" flake, green on
re-run), live browser checks of the cached Dutch voice + three-toggle screen.

## ElevenLabs Voice-Pack Migration - 2026-07-06

Goal:

- Replace the normal game voice-pack with local ElevenLabs `eleven_v3` clips
  using voice `Lily - Velvety Actress`.
- Use ElevenLabs for all normal voice lines and isolated reading phoneme taps.
- Keep word splitting / zoemend lezen on the separate fallback path; generated
  stretched blend clips were not accepted in listening QA.

Implemented:

- Added `scripts/generate-elevenlabs-voice-pack.mjs`, a resumable generator for
  the full sentence/instruction inventory. It reads the current voice-line
  inventory, skips already-generated MP3 files, and only rewrites
  `src/game/voiceLineManifest.ts` after a complete successful run.
- Added `scripts/generate-elevenlabs-reading-phoneme-pack.mjs` for the 32
  isolated reading phoneme clips used by `ReadingAudioManager.playPhoneme()`.
- Added `scripts/audit-elevenlabs-audio.mjs` plus `npm.cmd run
  voice:elevenlabs-audit` to prove the pack is complete and active.
- Updated `ReadingAudioManager` so isolated phonemes can use the dedicated local
  reading pack, while `playPhonemeSequence()` and `playZoemWord()` still use the
  browser-only fallback.
- Generated the full local ElevenLabs runtime pack:
  `public/audio/voice/nl/elevenlabs-lily-v3/` now has 940 MP3 clips plus
  `voice-lines.json`.
- Generated the full isolated reading phoneme pack:
  `public/audio/reading/nl/elevenlabs-lily-v3/phonemes/` now has 32 MP3 clips
  plus `phonemes.json`.
- `src/game/voiceLineManifest.ts` now points at
  `/audio/voice/nl/elevenlabs-lily-v3/`.
- `src/game/readingAudioManifest.ts` now points at
  `/audio/reading/nl/elevenlabs-lily-v3/phonemes/`.
- Updated tests, README, and `assets/ASSET_MANIFEST.json` so ElevenLabs is the
  documented active runtime audio source.
- Removed the old `public/audio/voice/nl/hestia/` runtime asset directory so the
  app no longer ships two complete voice-packs.
- Follow-up fix 2026-07-07: removed the automatic boot-to-intro jump so the
  child's Start tap unlocks MP3 playback before the opening cinematic speaks.
  Added the three individual opening cinematic lines, title, and start prompt to
  the ElevenLabs pack. `VoiceManager` no longer replaces an existing local clip
  with browser speech when `audio.play()` is rejected by autoplay policy.
- Validation for the follow-up: `voice:elevenlabs-audit` passed with 940/940
  voice clips, 32/32 reading phonemes, and 17/17 runtime voice checks;
  `typecheck`, `lint`, `test` (167 tests), and `build` passed.

Regeneration command:

```powershell
$env:ELEVENLABS_API_KEY = "<key>"
npm.cmd run voice:elevenlabs
npm.cmd run voice:elevenlabs-audit
Remove-Item Env:\ELEVENLABS_API_KEY
```

Validation:

- `npm.cmd run voice:elevenlabs-audit` passed: 940/940 general voice clips and
  32/32 reading phoneme clips present, 17/17 dynamic runtime voice examples
  present, runtime manifests point at ElevenLabs, and the old Hestia runtime
  directory is gone.
- `npm.cmd install` passed.
- `npm.cmd run typecheck` passed.
- `npm.cmd run lint` passed.
- `npm.cmd run test` passed: 20 files, 166 tests.
- `npm.cmd run build` passed.
- Vite dev server was started and checked at `http://127.0.0.1:5287/`.

## Visual glow-up: "Sunlit playground" - 2026-07-07

A multi-agent visual audit (6 surface auditors + synthesis) produced a coherent
"Sunlit playground" direction; implemented the shared, high-leverage wins:

- FIXED the 3D-rock bleed: the lazy Three.js menu world stayed mounted for the
  runner and showed through behind every DOM scene. .scene-layer now has an
  opaque sunlit-sky background (transparent only for .scene.run via :has), and
  .scene.mini-scene gets its own ambient world background (bright sun, soft
  bokeh, green meadow rise, multi-hue sky). Journey mode's themeArena() still
  overrides per region.
- Shared depth: layered --shadow + new --glow token wired into the panel group;
  bouncy --spring easing + hover scale on the shared .btn group; gradient
  primary/secondary/ghost buttons; warm sunrise :root background.
- Shared mini chrome: top-lit beveled answer cards; done-dot ✨ twinkle; warmer
  whole-screen fever glow; star-halo + spinning-star confetti + gold fever
  checkmark on the correct-answer burst.
- Hub: gradient bouncing "Speeltuin" sign, tilting dino logo, pulsing card
  emojis. Buddy: warm sunlit ground-glow. Map: denser life (7->11 critters),
  dusk-indigo sleeping veil (atmospheric, was flat grey), breathing halo on
  locked nodes.
- Harness fix: viewport-qa now keeps its animation-freeze applied THROUGH the
  screenshot. Removing it first restarted entrance animations (.tile-in opacity
  0) so screenshots caught a mid-fade washed frame — a real self-inflicted
  flake, not a visual regression.

Validation: 166 tests, build, qa:viewport 18/18 all green; live browser checks
of hub, mini modes (mobile + desktop), and the map confirm the cohesive warm
look with no 3D bleed.

## Quick-wins batch (from the 7-dimension audit) - 2026-07-08

Implemented the six audit-recommended quick wins, each its own commit:

- Voice-first clarity: the mini-mode instruction bar is now a 🔊 button that
  re-speaks the prompt (reading modes re-play the sound); wrong answers now
  SPEAK the specific teaching hint (reteach() helper) instead of showing silent
  text — the recorded clip already existed for most.
- Perf: gate the WebGL render loop to the runner only (was rendering 60fps
  behind the opaque DOM sky every scene ~90% of playtime).
- Daglint: a consecutive-day streak (progress.streak) with a reward growing
  +3->+6, a 🔥 + 7-day ribbon, and streak/comeback Buddy lines; the daily chest
  moved to shared treasure.ts and now also appears on the hub.
- Literacy content: PHONICS_WORDS 14->44, LETTERS 18->28 (added f/w + 8
  digraph tiles), LISTEN_STORIES 6->12 — fixes the "memorised in a week" gap.
- Boss Rush "Sterrenarena": a tier-scaling gauntlet of all six bosses,
  unlocked once the star is home (hub 🏆 tile), ending on a champion screen.

Validation: 169 tests (+ new streak, Boss Rush, content), tsc, build,
qa:viewport 18/18 green; live-verified the replay button, spoken hint, hub
chest + daglint, expanded reading content, and the Sterrenarena unlock.

## Fully local natural voice and overlap fix - 2026-07-10

Completed work:

- Reproduced the robot voice in Luisterbos after the literacy expansion. The old
  audit checked its own 940-line manifest rather than the current game data, so
  all new stories, questions, answer labels, words, hints, and the Sterrenarena
  line could silently fall back to browser speech.
- Added `src/game/voiceLineCatalog.ts`. It derives required lines from the live
  story, phonics, letter, traffic, journey, sticker, world, boss, and Buddy data,
  plus the finite generated math prompts and spoken re-teach lines.
- Added `scripts/load-voice-line-catalog.mjs` and wired both ElevenLabs generation
  and auditing to the same catalog. Slug collisions now fail generation/audit.
- The loader also scans static `voice.speak(...)`, `reteach(...)`, and fixed
  `instruction` strings in `src/`; it immediately found and added the previously
  missed "Tel nog eens rustig mee." line.
- Generated 261 missing Lily / `eleven_v3` clips. The sentence pack now contains
  1201 local MP3s; the current game is covered 1133/1133 and the reading phoneme
  pack remains covered 32/32.
- Rebuilt `VoiceManager` as one serial local-audio queue. `interrupt: true`
  cancels the active clip and pending queue; `interrupt: false` queues behind the
  current clip. Scene changes and `Game.stop()` clear all pending voice.
- Removed Web Speech from runtime. A missing or failed local clip is never
  replaced by a robotic OS/browser voice.
- Routed isolated phonemes and normal sentences through the same queue. Whole
  words and zoem actions now play natural local Lily word clips more slowly;
  rejected generated stretched blends are not used.
- Luisterbos no longer estimates story duration with a text-length timer. It
  queues the question immediately after the story, so it starts on the real
  `ended` event and cannot overlap.
- A new Luisterbos story no longer starts by speaking 250 ms of the question
  before interrupting it; the mode suppresses that base announcement and starts
  cleanly with story -> question.
- Made the unbounded daily-streak sentence finite after day four, so every
  possible spoken reward line can be generated and audited.

Claude handoff rules:

- Add/change spoken content in the source data as usual, then run
  `npm.cmd run voice:elevenlabs` with `ELEVENLABS_API_KEY` set and finish with
  `npm.cmd run voice:elevenlabs-audit`.
- Do not reintroduce `speechSynthesis`, `SpeechSynthesisUtterance`, runtime TTS,
  or a second independent voice player.
- Use `interrupt: true` for a newly selected prompt and `interrupt: false` only
  when the new line should follow the current line.
- Keep isolated letter/phoneme playback in `ReadingAudioManager`; use cataloged
  whole-word Lily clips for word playback.

Validation:

- `npm.cmd install` passed (one existing low-severity npm audit item).
- `npm.cmd run voice:elevenlabs-audit` passed: 1201/1201 sentence clips,
  1133/1133 current game lines, and 32/32 reading phonemes.
- `npm.cmd run verify` passed: typecheck, lint, 20 test files / 172 tests, and
  production build.
- In-app browser verification loaded the current Luisterbos question and full
  story from local Lily MP3 URLs with no warning/error logs.
- No API keys are stored in the repository.

## Sprintsite deploy - 2026-07-10

- Rebuilt the current worktree after the fully local voice/queue pass.
- Deployed Worker Static Assets app `blokblitz` through the existing WSL
  OpenClaw Cloudflare authentication.
- Wrangler read 1253 assets and uploaded 266 new or modified files, including
  the 261 new Lily clips and the fresh application bundles.
- Active Worker version: `d03c272c-8902-4c0c-bb9e-fda2105d33b4`.
- Live URLs: `https://blokblitz.sprintsite.be/` and
  `https://blokblitz.kennydd001.workers.dev/`.
- Smoke checks passed for both HTML roots, bundle `index-Dvd2vTZU.js`, the
  voice manifest, an existing clip, and the new
  `tel-nog-eens-rustig-mee.mp3` clip (HTTP 200, `audio/mpeg`).
- In-app browser verification loaded the custom domain, rendered the `Start`
  screen using `index-Dvd2vTZU.js`, and reported no warning/error logs.

## Curriculum Deepening and Batch 3 - 2026-07-11

Completed work:

- Added in-game minimal-pair listening rounds to Klankgrot. The education layer
  derives every duel from real local picture words and detects repeated
  confusions from each child's own attempt log (for example `b/p` or `i/o`).
- The remediation flow starts only after two matching errors, alternates with
  normal phonemic work, and backs off again after a successful pair round.
- Added Rijmrivier, a full rhyme-awareness mode derived from the existing
  phonics pool. Children hear a target word, choose its rhyme, and build a
  bridge across the river. Attempts log as `literacy-phonemic` / `rhyme`.
- Added Sprongpad, a full skip-counting mode. Number stones form the actual
  route and use jumps of 2 to 20, 5 to 50, and 10 to 100, tiered per child.
  Attempts log as `math-number` / `skipCount` with misconception labels.
- Added both modes to free play, the scene registry, domain-scoped adaptive
  difficulty, and curriculum-ordered Sterrenreis stops (rhyme after phonemic
  awareness; skip-counting after the number line).
- Deepened Dubbelspel: mirrored groups now have distinct visual roles,
  near-doubles expose the extra `+1`, even/odd builds real two-dot pairs, and a
  strategy strip explains the structure after success or a mistake.
- Deepened Vriendjes 10: one live ten-frame now shows the known part, empty
  partner cells, the second colour filling on success, and visible gaps or
  overflow for pairs that do not make ten.
- Locked profile switching behind an adult-controlled flow. Normal boot keeps
  the last selected child active; the hub profile chip now requires the parent
  sum and then a 1.2-second press-and-hold before the roster opens. Profile save
  namespaces and mastery trajectories remain fully isolated.
- This local gate prevents accidental/casual sibling switching; it is not a
  cryptographic identity system. A school-wide self-login would require a
  separate child PIN or managed account design.

Audio:

- Expanded the source-driven voice catalog to include every reachable dynamic
  Dubbelspel and Vriendjes prompt/hint, all batch-3 prompts, profile setup lines,
  and avatar names.
- Generated 352 new local ElevenLabs Lily `eleven_v3` clips. The sentence pack
  now contains 1553 MP3s and covers 1485/1485 current game lines; the dedicated
  reading pack remains 32/32 phonemes.
- No runtime TTS, Web Speech fallback, API call, or API key was added.

Validation:

- Pure education tests cover minimal-pair derivation and resolution, rhyme
  groups, skip-counting ranges/options, misconception labels, and challenge
  contracts.
- Flow tests cover both new journey modes, auto-served remediation, per-child
  profile gating, journey completion, and adaptive attempt logging.
- `npm.cmd run voice:elevenlabs-audit` passed: 1553/1553 sentence clips,
  1485/1485 current game lines, and 32/32 reading phonemes.
- `npm.cmd run verify` passed after the final profile hold refinement: 29 test
  files / 242 tests, typecheck, lint, and production build.
- Viewport QA was expanded from 18 to 24 scenarios and passed on narrow mobile
  and desktop for Rijmrivier, Sprongpad, Vriendjes, and Dubbelspel. Interactive
  in-app browser checks confirmed rhyme bridge payoff, skip-path fit at 332 px,
  ten-frame filling, doubles strategy reveal, and the parent-gated profile flow.

## Personal Daily Plan and Speeltuin Focus - 2026-07-11

Completed work:

- Replaced the 26-choice free-play wall with a focused child flow: three
  profile-specific daily missions, one prominent Sterrenreis action, and five
  category tabs that expose all 25 calm modes without showing them at once.
- Added `src/data/playModes.ts` as the single catalog for mode labels,
  categories, learning tracks, recommendation stages, domains, and attempt keys.
- Added a pure recommendation engine in `src/education/dailyPlan.ts`. Every plan
  balances one math, one literacy, and one discovery activity while combining
  trajectory stage, repeated errors, due practice, novelty, and recent-mode
  fatigue. Advanced content is never recommended to a new child.
- Added profile-local activity history and persisted daily-plan state. Plans are
  stable for the child's local calendar day, reset without losing history, and
  remain isolated across sibling profiles and old-save migration.
- Completing a recommended mode checks it off on the shared result screen. All
  three pay one 10-star/5-block bonus; replays are idempotent and cannot pay it
  twice. Memory now also fills the existing three-game treasure meter.
- Moved the daily gift into the Hub badge row, removed its overlap with mission
  progress, fitted all five tabs on 360 px, and removed the temporary Hub speech
  bubble that visually covered free-play controls.

Audio:

- Generated two new local ElevenLabs Lily `eleven_v3` clips for mission
  completion. The sentence pack now contains 1555 MP3s and covers 1487/1487
  current game lines; reading phonemes remain 32/32. No runtime API or fallback
  voice was introduced.

Validation:

- Added `tests/dailyPlan.test.ts` plus flow coverage for balanced plans,
  stage-gating, weak-reading selection, repeat avoidance, daily persistence,
  one-time rewards, category reachability, and completed mission state.
- `npm.cmd run verify` passed: 30 files / 252 tests, typecheck, lint, and
  production build. `npm.cmd run voice:elevenlabs-audit` passed at 1487/1487 +
  32/32.
- `npm.cmd run qa:viewport` passed all 24 scenarios after replacing the obsolete
  "20 cards at once" assertion with three-mission, five-tab, clipping, and touch
  target checks. Mobile screenshots and an interactive 360x740 browser pass were
  visually inspected.
- `npm.cmd run qa:mobile-touch` passed with 29 real touch steps, 14 tracked
  attempts, one completed journey node, category selection, and two visible
  checked missions on the final Hub screenshot.
- GitHub `main` now contains commit `bf76a13`. WSL Wrangler deployed the same
  build as Worker version `aa787aab-8e65-4ddb-8a7e-cf1773c5d378`; both live
  roots returned HTTP 200, served `index-CX3H29Yv.js` / `index-DNuqrtDr.css`,
  and both new mission MP3s returned HTTP 200 with `audio/mpeg`.

## Core Number Mode Deepening - 2026-07-11

Completed work:

- Turned `Tel mee` into a five-round animal rescue instead of a disconnected
  numeral quiz. Every animal must be touched and counted before the numeral
  answers unlock; each completed group visibly hatches into the rescue trail.
  The introductory tier stays within 5, while later trajectories reach 8 and
  10. Counted state, unlock state, and rescue progress are screen-reader safe.
- Extended `Zoek hetzelfde` from a fixed ceiling of 8 to a staged 5/8/10
  trajectory so stronger children continue into ten-structure work without
  raising the entry difficulty for a new profile.
- Gave `Wat is meer?` a continuous feeding goal. Every correct quantity now
  flies from the chosen group to the dino and fills one of seven visible bites;
  a mistake keeps the dino hungry and re-teaches by comparing both groups.
- Rebuilt `Eentje erbij` around an explicit `NU -> +/-1 -> DAARNA` structure.
  The unknown side reveals the same dots, frame, blocks, or beads after success
  and during a safe retry, making the number change visible instead of relying
  on the spoken question alone.
- Increased every count-animal touch target to at least 52x52 CSS pixels after
  the new narrow-phone QA caught a 40px-high hit area.

Audio:

- Reused existing natural ElevenLabs Lily `eleven_v3` instructions and hints;
  no new spoken line or browser speech fallback was introduced.
- `npm.cmd run voice:elevenlabs-audit` remains green at 1555/1555 sentence
  clips, 1487/1487 currently reachable game lines, and 32/32 reading phonemes.

Validation:

- Added regression coverage for answer locking, animal rescue progress,
  accessible live labels, dino feeding, and before/after re-teaching.
- `npm.cmd run verify` passed: 30 files / 255 tests, typecheck, lint, and the
  production build.
- `npm.cmd run qa:viewport` now covers 27 scenarios and passed new 332px Count
  and OneMoreLess screens plus mobile Compare, including structural and minimum
  touch-target assertions. All three screenshots were visually inspected.
- `npm.cmd run qa:mobile-touch` passed a 37-step coordinate-touch journey,
  including touching every Count animal, with 12 tracked attempts, one journey
  node completed, and two checked daily missions visible on the final Hub.
- GitHub `main` contains commit `fe3768e`. WSL Wrangler deployed that build as
  Worker version `43d0e67b-fc1a-494a-9fff-464b86b81eb2` to
  `https://blokblitz.sprintsite.be/`.
- Live HTTP smoke checks returned 200 for the root and production assets
  `index-Dr5H-yqG.js` and `index-C_x5RXlF.css`, with the expected JavaScript and
  CSS content types.

## Discovery Mode Progression - 2026-07-11

Completed work:

- Turned `Vormenburcht` into a continuous seven-stone castle build. Every
  solved shape becomes a persistent coloured stone; the goal and completed
  count remain visible and accessible across rounds.
- Added concept-specific visual re-teaching to Vormenburcht: pattern questions
  fill the missing shape, corner questions reveal the counted corner total, and
  recognition questions name the correct shape. A later correct retry switches
  the same explanation from teaching to success state.
- Tiered the geometry content itself. Tier 1 stays with circle, triangle,
  square, rectangle and AB patterns; tier 2 introduces all six shapes and AABB;
  tier 3 adds ABC patterns. Pentagon, hexagon and complex patterns therefore no
  longer appear for a brand-new profile.
- Turned `Verkeerspad` into a seven-step route from home to school. Every safe
  answer moves the dino exactly one visible road segment; a mistake pauses the
  route and shows the relevant complete safety rule alongside the correct
  picture before a safe retry.
- Tiered traffic cards from everyday crossing, lights, visibility, pavement,
  ball and hand-holding situations through helmet/belt, with the truck blind
  spot reserved for tier 3. The stage-1 deck has seven unique cards, preventing
  repetition inside one activity.
- Added a 332px long-title header rule after QA exposed that Vormenburcht was
  truncated between the back button and seven progress dots.

Audio:

- All prompts, answer labels and safety lessons already existed in the local
  natural ElevenLabs pack. No new spoken line, runtime request or fallback was
  added; the audit remains 1487/1487 plus 32/32 reading phonemes.

Validation:

- Added pure tests for tiered shape/pattern complexity and traffic staging, and
  journey-flow assertions for castle progress, contextual re-teaching, traffic
  rules, safe steps, and accessible progress labels.
- `npm.cmd run verify` passed with 30 files / 257 tests and a production build.
- `npm.cmd run qa:viewport` passed 29 scenarios, including visually inspected
  332px Vormenburcht and 390px Verkeerspad screens with structural progression,
  clipping, title-fit, and touch-size checks.
- `npm.cmd run qa:mobile-touch` passed a 39-step touch journey with 12 tracked
  attempts and one completed Sterrenreis node.
- GitHub `main` contains commit `651e897`. WSL Wrangler deployed that exact
  production build as Worker version `c88d32ed-e968-4d58-8663-e2d1cb8fabae`.
- Live HTTP checks returned 200 for `https://blokblitz.sprintsite.be/`,
  `index-C8TEZ9ne.js`, and `index-wxPHmbqC.css` with the expected content types.

## Natural Audio, Accessibility and Tablet Lifecycle - 2026-07-11

Completed work:

- Extended the single local voice queue with completion callbacks. Praise now
  queues behind the active instruction, number, word, or answer instead of
  interrupting it. Scene changes remain a hard boundary, so old feedback still
  cannot leak into the next activity.
- Voice-first Verkeerspad and Luisterbos choices disable their alternatives,
  expose `aria-busy`, preserve the child's original reaction time, and resolve
  only after the selected local ElevenLabs label has ended.
- `Tel mee` now queues the complete natural number sequence and keeps numeral
  choices locked until the final number clip ends. `Op volgorde` similarly
  waits for its final spoken numeral before completing the round; Memory hears
  both flipped numbers in order before resolving the pair.
- Result praise and daily-mission lines queue after final-round feedback rather
  than cutting it off. No browser voice or runtime network fallback was added.
- Added pause/resume semantics for active HTML voice and procedural music.
  Backgrounding the app pauses media and the idempotent animation loop; return
  resumes from the same audio position and current world theme.
- Deferred the Three.js/WebGL warmup until the first pointer or keyboard
  interaction. Production HTML contains no preload for the 118.96 kB gzip
  Three.js chunk; runner scenes still request it directly and retain their
  countdown loading window.
- Hardened fullscreen lifecycle for standard and WebKit fullscreen state,
  resize/fullscreen listener cleanup, and safe restarts.
- Made transient toast feedback a screen-reader status region and applied a
  consistent focus-visible ring to every button/tab. Viewport QA now audits
  every visible button for an accessible name and a 44x44px minimum target.
- That broader audit found Splitsbord eggs at roughly 37x34px. Tray eggs are now
  48x48px and eggs moved into a nest remain at least 44x44px.

Audio and performance evidence:

- Added MP3-end-controlled tests proving Count stays locked through the full
  sequence and voice-first attempts are not scored before the answer label
  finishes. Queue tests also prove praise does not pause active speech and
  background pause/resume keeps playback position.
- Added lifecycle tests for single-loop restart, deferred 3D warmup,
  background media pause/resume, and accessible status announcements.
- `npm.cmd run voice:elevenlabs-audit` passes at 1555/1555 files, 1487/1487
  currently reachable lines, and 32/32 reading phonemes.

Validation:

- `npm.cmd run verify` passed with 31 files / 260 tests, typecheck, lint, and a
  production build. The initial app chunk is 96.89 kB gzip; Three.js remains a
  separate 118.96 kB gzip dynamic chunk.
- `npm.cmd run qa:viewport` passed all 29 scenarios with the new global button
  naming/size audit and proof that journey/hub first paint has no eager canvas.
- `npm.cmd run qa:mobile-touch` passed 38 coordinate-touch steps, including the
  audio-gated Count rescue, with 12 attempts and one journey node completed.
- GitHub `main` contains commit `6e634a9`. WSL Wrangler deployed that exact
  build as Worker version `ca6088fd-2a45-463d-8630-05424f523966`.
- Live Sprintsite checks returned 200 for the cache-busted root,
  `index-DZ4RsT24.js`, `index-mfJ8LEtW.css`, and a representative Lily MP3;
  content types were respectively HTML, JavaScript, CSS, and `audio/mpeg`.

## First-Install Offline Hardening - 2026-07-11

- Upgraded the service-worker caches to v3. During installation the worker now
  reads the current production HTML, precaches its content-hashed entry JS/CSS,
  scans the entry JavaScript for lazy chunk references, and precaches the
  RunnerView, Stage3D, and Three.js chunks before activation.
- This closes the first-visit gap where bundles loaded before the new worker
  controlled the page and were therefore only guaranteed offline after a
  second online visit. Local voice clips remain cache-on-first-hear to avoid a
  forced 1587-file download; repeated clips are available offline.
- Added an executable service-worker installation test with mocked caches and
  production-style hashed references. It proves all two entry and three lazy
  assets are fetched and stored before `skipWaiting`.
- The parser was also run against the real production build and found exactly
  `index-DZ4RsT24.js`, `index-mfJ8LEtW.css`, `RunnerView-COrt3nEL.js`,
  `Stage3D-Ebj8xytC.js`, and `three-CsgmhPiE.js`.
- `node --check public/sw.js`, targeted acceptance/offline tests, and typecheck
  passed. Full validation follows in the release gate below.
- `npm.cmd run verify` passed with 32 files / 261 tests and the production
  build. GitHub `main` contains commit `6dc63e8`.
- WSL Wrangler deployed the service-worker release as Worker version
  `83117e2c-f56d-4cf3-ba2f-a9fcbc9c3549`; live `/sw.js` returned HTTP 200 as
  JavaScript and contained cache v3, `precacheProductionBundles`, and lazy
  dependency discovery.
- The final current-state requirement audit is recorded in
  `docs/ACCEPTANCE_AUDIT.md`. No technical/curriculum/automated finding remains;
  physical child-in-hand phone feel is the sole external proof still open.

## Return-Aware Opening and Reduced Motion - 2026-07-11

Completed work:

- Replaced the generic first-load numeral card with a full-viewport opening
  frame showing the BlokBlitz brand, Buddy, the fallen star, and colourful
  Sterrenstad. The required first tap still unlocks browser audio, but now feels
  like the first beat of the adventure instead of a loading gate.
- New children get one large `Start avontuur` action. Returning children see
  their own name, selected Buddy skin, stars, current Sterrenreis position, and
  one `Verder spelen` action. Profile names are inserted with `textContent`.
- Kept the opening entirely local and light: semantic DOM, the existing Buddy
  SVG, and CSS block scenery; no Three.js, external assets, or new spoken line.
  The complete 1555-file ElevenLabs pack remains unchanged and fully covered.
- Added a global `prefers-reduced-motion: reduce` fallback that ends decorative
  CSS animation and transitions in 1 ms and prevents infinite loops while
  leaving JavaScript-driven controls and runner simulation functional.
- Expanded viewport QA with narrow portrait, desktop, mobile landscape, and
  emulated reduced-motion opening scenarios. It now asserts Buddy/city/story
  presence, a >=60px primary action, no legacy number mark, no critical element
  overlaps, no eager canvas, and actual reduced animation durations.

Validation and release:

- `npm.cmd run verify` passed with 32 files / 263 tests, typecheck, lint, and a
  production build. Current entry assets are `index-hNdOFqAq.js` (97.33 kB
  gzip) and `index-fCTg8hpA.css` (31.68 kB gzip).
- `npm.cmd run qa:viewport` passed all 33 scenarios. The three primary opening
  screenshots were inspected directly; an independent in-app-browser render
  at 844x390 confirmed the live layout after a local PNG decoder anomaly.
- `npm.cmd run qa:mobile-touch` passed 39 coordinate-touch steps with 12
  tracked attempts and one completed journey node.
- `npm.cmd run voice:elevenlabs-audit` passed at 1555/1555 files, 1487/1487
  current lines, and 32/32 reading phonemes. No audio generation was needed.
- WSL Wrangler deployed Worker version
  `365d99e1-4120-4a48-983f-15fb66a9f13b`. Live root, JS, and CSS returned HTTP
  200 with the correct content types; the served bundles contain the new boot
  scene and reduced-motion rules.

## Long-Term Profile Storage Resilience - 2026-07-11

Completed work:

- Bounded each child's stored history at 1200 attempts, 180 sessions, 120
  completed activities, and eight recent challenge ids. This prevents months
  of replay across siblings from growing one origin toward localStorage quota.
- Attempt compaction is target-aware rather than a blunt newest-only slice. It
  first reserves the six newest examples for each curriculum target or classic
  number-skill/representation/range/quantity cell, then fills remaining room
  with the newest attempts globally. Weak old targets therefore remain visible
  to mastery, review, and adaptation while recent play still dominates.
- Migration compacts the active save and every oversized inactive profile
  before the next write. The live MasteryTracker is resynchronised after each
  persisted attempt, so the in-memory and reload views use exactly the same
  bounded evidence.
- Limited new profile creation to four children per device. Existing progress
  is never overwritten: at the cap the parent-gated picker removes the `Nieuw`
  tile, keeps all four large profile cards, and explains that `Beheer` can make
  room. Direct storage calls enforce the same invariant.

Validation and release:

- Added storage-resilience tests. A 1350-attempt/240-session legacy save is
  migrated to 1200/180, all 75 represented learning targets survive, recent
  order and latest evidence are preserved, activity history is bounded, and
  the pretty-printed exported profile remains below 1 MB.
- `npm.cmd run verify` passed with 33 files / 267 tests, typecheck, lint, and a
  production build. Current entry assets are `index-OmOLSFaN.js` (97.83 kB
  gzip) and `index-DdtH3iyW.css` (31.71 kB gzip).
- `npm.cmd run qa:viewport` passed all 34 scenarios, including direct visual
  inspection of four profiles at 332x807 with no add tile, clipping, small
  button, or overflow. `npm.cmd run qa:mobile-touch` passed 39 touch steps.
- The unchanged ElevenLabs pack still passes at 1555/1555 files, 1487/1487
  current lines, and 32/32 reading phonemes.
- WSL Wrangler deployed Worker version
  `091d0d05-7ded-4452-86b2-47eea8280c10`. Live root, JS, and CSS returned HTTP
  200; the served bundles contain both the profile cap and profile-limit UI.

## Complete Three-Tier Curriculum Adaptivity - 2026-07-11

Completed work:

- Audited all 25 calm curriculum modes against the child-specific difficulty
  tier. Sixteen already changed meaningful content; the remaining nine now do
  as well: Geldmarkt, Meetwerf, Tientalhuis, Letterkompas, Rijmrivier,
  Zoemroute, Woordbouwplaats, Luisterbos, and Memory.
- Tier 1 now starts with smaller ranges, simpler operation families, one clear
  distractor, short single-grapheme words, one recall question per story, and
  three Memory pairs. Tier 2 introduces the full core exercise forms. Tier 3
  reaches money to 10, close length comparisons, teen numbers through 19,
  digraphs, consonant clusters, harder distractors, longer listening sets, and
  five Memory pairs with quantities through 10.
- Kept the difficulty change in `src/education`; scenes only pass their scoped
  tier into the pure generators. The same domain-specific recent-accuracy,
  Sterrenreis position, round, weak-target, and spaced-review signals therefore
  drive every mode without coupling learning rules to rendering.
- Made the 6/8/10-card Memory board responsive, accessible, and score-aware.
  Phone layouts use balanced 3, 4-4, or 4-4-2 grids, short landscape uses a
  compact 5-by-2 board, card labels expose revealed quantities, and matched
  pairs are marked disabled to assistive technology.
- Fixed an ambiguous Luisterbos pair that asked `Waar glijdt Pim op?` twice for
  two different answers. The second question is now `Hoe glijdt Pim over het
  ijs?`; its new Lily `eleven_v3` clip was generated build-time and stored
  locally. No runtime TTS or browser-voice fallback was added.

Validation:

- `npm.cmd run verify` passed with 33 files / 277 tests, typecheck, lint, and a
  production build. Current entry assets are `index-gbFA0j8Q.js` (98.77 kB
  gzip) and `index-4gnngdiB.css` (31.84 kB gzip).
- Generator and flow tests prove every tier boundary, operation pool, option
  count, word complexity, story load, Memory pair count, and quantities to 10.
- `npm.cmd run qa:viewport` passed all 37 scenarios. New direct screenshots at
  332x807, 390x844, and 844x390 prove tier-1 and tier-3 Memory cards remain
  unclipped, at least 44x44px, and visually balanced.
- `npm.cmd run qa:mobile-touch` passed 38 real touch steps with 12 tracked
  attempts and one completed journey node.
- `npm.cmd run voice:elevenlabs-audit` passed at 1556/1556 sentence clips,
  1488/1488 current game lines, and 32/32 reading phonemes.

Release:

- WSL Wrangler deployed the validated build as Worker version
  `322f16bd-8076-4b24-aae5-bd30ca3f2e80`.
- Live Sprintsite returned HTTP 200 for the cache-busted root,
  `index-gbFA0j8Q.js`, `index-4gnngdiB.css`, and the new Pim MP3. The audio
  response is `audio/mpeg` with the expected 39,332 bytes; the served JS/CSS
  contain the tiered Memory and responsive-grid rules.
- A fresh in-app-browser production render showed the full Buddy/Sterrenstad
  opening at `?release=322f16bd` with no warning or error logs.

## Advanced Content Small-Screen Proof - 2026-07-11

Completed work:

- Extended viewport QA from 37 to 47 scenarios with deterministic tier-3
  rounds for every newly adaptive visual mode. The suite now forces €10 at
  Geldmarkt, nine units at Meetwerf, 19 as 10+? at Tientalhuis, the `ij`
  grapheme, four rhyme choices, `d-r-ui-f` in Zoemroute, five sound boxes for
  `b-a-n-aa-n`, an eight-round Luisterbos header, and advanced Zoem/Woordbouw
  in 844x390 landscape.
- Added exact assertions for choice count, advanced letter presence, sound
  stones, word boxes, round dots, horizontal and vertical clipping, title
  clipping, and 44px minimum choice targets. Random values are temporarily
  seeded only while each QA scene mounts, then immediately restored.
- The stricter pass exposed two real layout defects: `Woordbouwplaats` was
  ellipsized at 332px, and its four advanced answer tiles extended 13px below
  a 390px-high landscape viewport. The compact child-facing header now says
  `Woordbouw`; short landscape only reduces that mode's decorative image,
  gaps, sound boxes, and tile padding while preserving large touch targets.
- Directly inspected all ten new screenshots. The advanced content is legible,
  balanced, and conceptually clear; the 4-4-2 Memory grid, four-choice reading
  layouts, five sound boxes, and short-landscape answer rows remain fully
  visible without crowding.

Validation and release:

- `npm.cmd run verify` passed with 33 files / 277 tests, typecheck, lint, and a
  production build. Entry assets are `index-Byz1mxQh.js` (98.78 kB gzip) and
  `index-Cw5L57YG.css` (31.89 kB gzip).
- `npm.cmd run qa:viewport` passed all 47 scenarios; `npm.cmd run
  qa:mobile-touch` passed 38 real touch steps with 12 attempts and one journey
  node; the ElevenLabs audit remains 1556/1556 clips, 1488/1488 current lines,
  and 32/32 reading phonemes.
- WSL Wrangler deployed Worker version
  `87523ca4-fdbf-410f-8187-46c1e09c0369`. Live root,
  `index-Byz1mxQh.js`, and `index-Cw5L57YG.css` returned HTTP 200; the served
  code contains the compact title and short-landscape rules.

## Profile-Local Hero Reward Choice - 2026-07-11

Completed work:

- Audited every hero-skin reward source. Runner results already announced new
  looks, but stars earned in the 25 calm modes, daily missions, and treasure
  chests could silently unlock a hero without giving the child a collection
  moment or choice. All reward paths now use one profile-local unlock helper.
- Added a full-screen `Nieuwe held!` reveal with the actual evolved Buddy in
  the earned colours and two large choices: equip the hero now or keep it for
  later. Choosing immediately updates the saved active skin, Hub Buddy, and
  garage selection without re-rendering away a simultaneous Buddy level-up or
  daily gift.
- Sticker and hero reveals are explicitly serialized after calm games and
  Memory. Runner results, legacy earned progress discovered on Hub/menu entry,
  daily gifts, and three-session treasure chests surface the same choice.
- Delayed chest reveals are tied to the original chest element. Leaving the
  scene during its opening animation can no longer inject an obsolete modal
  over the next activity.
- The reveal is a labelled modal with initial focus on the positive choice,
  >=48px actions, a compact two-column short-landscape layout, and no internal
  scroll at 332x807 or 844x390. It reuses the five existing local Lily skin-name
  clips; no browser voice, runtime API, or new spoken line was introduced.

Validation:

- Added a dedicated reward test file plus end-to-end flow coverage for
  one-time unlocks, two-child isolation, `Later`, immediate equip, calm-mode
  earning, Hub refresh, chest earning, and stale-timer prevention.
- `npm.cmd run verify` passed with 34 files / 284 tests, typecheck, lint, and a
  production build. Entry assets are `index-iPaDLrus.js` (99.61 kB gzip) and
  `index-i1Aa8ApN.css` (32.27 kB gzip).
- `npm.cmd run qa:viewport` passed all 49 scenarios. Both new reward screenshots
  were inspected directly; the Buddy, copy, and two choices stay visible and
  unclipped in narrow portrait and short mobile landscape.
- `npm.cmd run qa:mobile-touch` passed 39 real touch steps. The route now earns
  Aqua at 12 stars, touches `Kies Aqua`, logs 12 attempts, advances one journey
  node, and returns to the Hub.
- `npm.cmd run voice:elevenlabs-audit` remains green at 1556/1556 sentence
  clips, 1488/1488 current lines, and 32/32 reading phonemes.

Release:

- GitHub `main` contains the validated implementation as commit `1b00353`.
- WSL Wrangler deployed it as Worker version
  `967d4f11-b6df-4660-8e84-0192353e1a3c`. Cache-busted live root,
  `index-iPaDLrus.js`, and `index-i1Aa8ApN.css` returned HTTP 200 with the
  correct content types; the served bundles contain `Nieuwe held!` and the
  responsive `.skin-reveal` rules.

## Profile Identity / Hero Economy Separation - 2026-07-11

Completed work:

- Found and closed a progression loophole: profile creation offered every hero
  colour and copied that choice into `activeSkin`, so a new child could start
  as Goud or Schaduw while the same garage card still claimed to be locked.
- Split identity from rewards. A child now chooses one of six high-contrast
  profile signs (star, wave, spark, mountain, moon, diamond); every new playable
  Buddy starts as Blitz. Profile cards and the locked Hub chip use the sign,
  while the opening frame, calm games, journey, and runner use the genuinely
  selected and unlocked hero skin.
- Kept all existing profiles compatible. Legacy migration preserves the old
  colour id as that child's profile sign, keeps a legitimately unlocked active
  hero, and resets only impossible `activeSkin` values that are absent from the
  profile-local unlocked list. Blitz is always restored to that list.
- Removed hero-name speech from profile-sign taps, so identity selection cannot
  imply a free hero and cannot interrupt the existing natural profile greeting.
  This introduced no new spoken line or runtime asset.
- Added pressed-state semantics to the six sign choices. On 332px portrait the
  name label/input stack cleanly; at 844x390 the six signs form one compact row.
  Four-profile cards show distinct signs without exposing playable Buddy skins.

Validation:

- Save/flow regressions cover new-profile defaults, legitimate and impossible
  legacy active skins, preserved profile signs, six non-Buddy choices, pressed
  state, Hub identity/Buddy separation, locked garage cards, and opening-screen
  use of the actual active hero.
- `npm.cmd run verify` passed with 34 files / 285 tests, typecheck, lint, and a
  production build. Entry assets are `index-8H64ID8Q.js` (100.00 kB gzip) and
  `index-Clly7zk0.css` (32.47 kB gzip).
- `npm.cmd run qa:viewport` passed all 51 scenarios, including new first-profile
  portrait/landscape checks and four distinct capped-profile signs. Directly
  inspected both create layouts, the full roster, and the narrow Hub; controls,
  labels, and input stay unclipped and the Hub sign differs clearly from Buddy.
- `npm.cmd run qa:mobile-touch` passed 39 steps with 12 tracked attempts and one
  journey node. The unchanged audio pack passes at 1556/1556 clips, 1488/1488
  current lines, and 32/32 reading phonemes.

Release:

- GitHub `main` contains the validated implementation as commit `7e8753d`.
- WSL Wrangler deployed Worker version
  `9b574b6f-f024-4c5d-a774-df24892b9e80`. Cache-busted live root,
  `index-8H64ID8Q.js`, and `index-Clly7zk0.css` returned HTTP 200 with correct
  content types; served code contains the profile-sign semantics and
  `.profile-token` visuals.

## Calm-Mode 75-Star Replay Collection - 2026-07-11

Completed work:

- Audited voluntary replay after the first journey and found that every calm
  mode's 1-3 star rating disappeared with its result screen. Children had no
  persistent way to see which favourite game still had a star to improve.
- Added profile-local `activityBestStars`: each of the 25 calm modes keeps its
  best 1-3 rating, a weaker replay can never lower it, reset still clears it,
  and legacy values are defensively rounded/clamped while malformed entries are
  discarded.
- Every free-play card now shows a stable three-star strip. `Kies zelf` shows
  the combined collection (`0/75` through `75/75`), turning the complete mode
  library into a visible long-term goal without locking educational content.
- Improving an already-played mode adds a compact `Nieuwe beste` medal to the
  existing friendly result screen. A first attempt stays uncluttered; mistakes
  remain safe, untimed, and replayable regardless of rating.
- The collection follows the active child only. Profile switching preserves
  each sibling's own bests and cannot transfer stars between trajectories.
- Made mobile touch QA deterministic with a fixed browser-side random seed.
  Two consecutive full runs now produce the same interaction count instead of
  varying with the random number of Count animals.

Validation:

- Save tests prove 2→1 remains 2, 2→3 becomes 3, profile isolation, reload
  persistence, and corrupt legacy normalization. Flow coverage completes Count
  perfectly over a prior one-star best, sees the medal, returns to the Hub, and
  verifies `3/75` plus three earned card stars and accessible labels.
- `npm.cmd run verify` passed with 34 files / 288 tests, typecheck, lint, and a
  production build. Entry assets are `index-DsCSeR9w.js` (100.55 kB gzip) and
  `index-BMA7HzhA.css` (32.59 kB gzip).
- `npm.cmd run qa:viewport` passed all 52 scenarios. A deterministic 332x807
  screenshot with 3/2/1/3 saved ratings shows `9/75`, legible earned/empty
  stars, all six Getallen cards, and no clipping before the hero garage.
- `npm.cmd run qa:mobile-touch` passed twice consecutively at exactly 40 touch
  steps, 12 tracked attempts, one journey node, and the Aqua equip action.
- Added the one required Lily `eleven_v3` announcement build-time and locally:
  `Je verdiende een nieuwe sticker: Sterrenmeester!` (48,527 bytes). The audio
  audit passes at 1557/1557 clips, 1489/1489 current lines, and 32/32 reading
  phonemes; runtime still makes no TTS request.

Release:

- GitHub `main` contains the validated implementation and local MP3 as commit
  `b85d593`.
- WSL Wrangler deployed Worker version
  `e2381707-0344-4f27-b2b4-6cb3947d74b9`. Cache-busted live root,
  `index-DsCSeR9w.js`, `index-BMA7HzhA.css`, and the Sterrenmeester MP3 all
  returned HTTP 200 with correct content types. The MP3 response is the expected
  48,527 bytes; served JS/CSS contain the collection, sticker, and star-strip
  code.

## Serialized Scene and Reward Voice - 2026-07-11

Completed work:

- Audited runtime ordering rather than just clip coverage and found two real
  automatic cuts: Hub's `Hoi` immediately interrupted `Buddy groeit`, while a
  return/arrival line interrupted the newly queued region welcome and marked it
  as already heard. Both were valid Lily clips, but their scene timing made them
  effectively inaudible.
- Reis now runs an explicit completion chain: return/arrival narration finishes,
  then a new-region welcome finishes, then the Buddy level-up appears and speaks.
  Fresh round cinematics defer level-up until the child starts the road, so a
  reward can no longer cover or talk across the opening story.
- Region banners now prepare their welcome instead of speaking during render.
  Friend rescues also finish their rescue story before a pending next-region
  welcome, so every automatic line has exactly one owner and one place in the
  shared queue.
- Hub now serializes two simultaneous progression rewards. Buddy growth is shown
  first; only dismissing that focused dialog opens the earned hero choices, and
  only finishing all hero cards plays the ordinary Hub greeting. Dismissing any
  reward also retires that card's narration immediately, so a fast child cannot
  leave a hidden card talking behind the next visible one.
- Buddy's level dialog is labelled, keyboard dismissible, safe-area padded, and
  focused on open. Its voice uses `interrupt: false`, preserving the scene line
  already ahead of it.
- Corrected the first-profile voice/UI mismatch from `Maak je eigen dino` to
  `Hoi! Kies jouw teken.` A single Lily `eleven_v3` MP3 was generated build-time
  and stored locally (33,062 bytes); no runtime TTS path was added.

Validation:

- Flow tests prove no level/skin stacking, Buddy growth→Aqua→Web→Hub greeting
  order, and return→Muntgrot welcome→Buddy growth callbacks with interrupt flags. The
  existing level test now proves the reward waits behind the first cinematic.
- `npm.cmd run verify` passed with 34 files / 290 tests, typecheck, lint, and a
  production build. Entry assets are `index-DWEEaG7y.js` (100.81 kB gzip) and
  `index-D1BbbXxX.css` (32.61 kB gzip).
- `npm.cmd run qa:viewport` passed all 54 scenarios. New 332x807 and 844x390
  screenshots show one focused, unclipped Buddy dialog and assert that no skin
  dialog exists beneath or above it; both were inspected directly.
- Fixed-seed `npm.cmd run qa:mobile-touch` still passes at 40 touches, 12 tracked
  attempts, one journey node, and Aqua equip, proving the new callbacks do not
  stall story start or return navigation.
- `npm.cmd run voice:elevenlabs-audit` passes at 1558/1558 sentence clips,
  1489/1489 current lines, and 32/32 reading phonemes.

Release:

- GitHub `main` contains the validated implementation and local profile-sign MP3
  as commit `97dfef1`.
- WSL Wrangler deployed Worker version
  `c334bf9c-dd1e-4fb6-9844-1f87af444689`. Cache-busted live root,
  `index-DWEEaG7y.js`, `index-D1BbbXxX.css`, and
  `hoi-uitroep-kies-jouw-teken.mp3` all returned HTTP 200 with correct content
  types. The served JS contains both the corrected profile line and Buddy growth
  sequence, the CSS contains the level dialog rules, and the MP3 response is the
  expected 33,062 bytes.

## Continuous Personal Play and Reward Runway - 2026-07-11

Completed work:

- Calm-mode endings now expose the short reward loop instead of stopping at a
  generic replay choice. Every completed game shows profile-local treasure
  progress from 1/3 through 3/3; before the chest is full, the dominant action
  launches the next unfinished recommendation from that child's stable daily
  plan. It starts a fresh session and preserves the same adaptive mode entry.
- A full 3/3 chest takes priority over the next mission. The ending sends the
  child straight to the Hub or Sterrenreis where the earned chest is already
  waiting. Runner results show the same meter and prioritize the same payoff,
  closing a previously hidden runner-to-chest gap.
- Sticker, hero, and completion narration now share one visible reward sequence:
  sticker card and matching Lily line, then hero choice and hero name, then the
  completion/daily-mission line on the visible result card. A fast dismissal
  cancels the retiring card's line before the next visual reward appears.
- Daily and three-game chests no longer use a 350 ms reveal timer. Their own
  local narration completes first, then the chest is removed and any earned hero
  appears. Scene changes cancel the callback, so a delayed reward cannot leak
  into another game screen.
- Practice sessions are now real bounded records. Finishing a calm activity or
  runner closes its profile-local session; replay and next-mission actions start
  a new one, and `startNewSession` safely closes any abandoned predecessor.
  Parent practice-time evidence can no longer inherit open-ended sessions.
- Short landscape results are viewport-bounded and internally scrollable. Their
  actions and treasure state remain reachable at 844x390, while Buddy's speech
  bubble is suppressed only where it would overlap the result card.

Validation:

- New flow tests prove 1/3 treasure progress, full-chest priority, next mission
  routing to `Tel mee`, a new session id, session closure, chest narration before
  Aqua, and strict sticker -> Aqua -> completion narration. Save tests prove a
  new session closes the active predecessor.
- `npm.cmd run verify` passes with 34 files / 294 tests, typecheck, lint, and a
  production build. Entry assets are `index-ByvwfFXU.js` (101.55 kB gzip) and
  `index-0gvDj0sz.css` (33.04 kB gzip).
- `npm.cmd run qa:viewport` passes all 56 scenarios. New deterministic 332x807
  and 844x390 endings assert the correct recommendation/chest priority, meter,
  focused action size, viewport bounds, and no Buddy/card overlap. Both final
  screenshots were inspected directly; the QA now waits for two paint frames
  after freezing animation to avoid stale headless compositing captures.
- Fixed-seed `npm.cmd run qa:mobile-touch` passes at 40 real touch steps, 12
  tracked attempts, one journey node, and Aqua equip through the new reward
  flow. `npm.cmd run voice:elevenlabs-audit` passes at 1558/1558 stored clips,
  1489/1489 current lines, and 32/32 reading phonemes. No new speech was needed;
  the two variable-routed daily lines are explicitly retained in the catalog.

Release:

- GitHub `main` contains the validated continuous-play and reward implementation
  as commit `62de6be`.
- WSL Wrangler deployed Worker version
  `f5db30df-0f4c-4cce-a895-4cead5aa47d2`. Cache-busted live root,
  `index-ByvwfFXU.js`, and `index-0gvDj0sz.css` returned HTTP 200 with correct
  content types. Served JS contains the next-mission, chest-priority, and sticker
  sequence code; served CSS contains the treasure and short-landscape rules.
  The representative existing `Dagmissie klaar!` Lily clip is live as
  `audio/mpeg` with the expected 21,359 bytes.

## Child-Safe Returning Profile Confirmation - 2026-07-11

Completed work:

- Closed the remaining accidental sibling-play gap at startup. A returning child
  no longer gets a blind `Verder spelen` action for whichever profile happened
  to be active last. Boot shows three large visual signs and only the active
  profile's own sign opens the Sterrenreis.
- A wrong sign is safe: the screen stays put, the sign shakes, Buddy asks the
  child to look again, and the existing natural Lily `Kijk nog eens goed.` clip
  plays. The correct sign disables the choices, uses the existing `Hoi! Daar
  gaan we!` clip, and changes scene only after that line completes.
- `Andere speler` is available from boot but passes through the same adult sum
  and hold-confirmation as the locked Hub profile chip. Creating another child
  disables signs already used by siblings, keeping newly created profiles
  visually distinguishable without passwords or reading pressure.
- This is deliberately an accidental-use guard, not authentication: all data is
  local and a determined child can learn another sign. It prevents the common
  wrong-profile tap while preserving independent child access and parent control.
- Returning portrait and short-landscape layouts were separately refined. The
  city/ground move above the taller identity block on narrow phones; decorative
  landscape sparkles are removed where they could cover the sign prompt.

Validation:

- Flow tests prove wrong sign -> still boot + natural feedback, correct sign ->
  journey, used sibling sign -> disabled, and boot-time player switching -> sum
  + hold gate -> profile picker. The full suite passes with 34 files / 295 tests.
- `npm.cmd run verify` passes typecheck, lint, tests, and production build. Entry
  assets are `index-DGcIRWX1.js` (102.07 kB gzip) and `index-iuJE1TLI.css`
  (33.34 kB gzip).
- `npm.cmd run qa:viewport` passes all 58 scenarios. New 332x807 and 844x390
  returning-boot checks require three large signs, exactly one correct sign that
  matches the active profile, an adult switch, no clipping, and no Buddy/profile
  overlap. Both final screenshots were inspected directly.
- Fixed-seed `npm.cmd run qa:mobile-touch` passes 41 real touch steps: it taps a
  wrong sign and remains on boot, taps the correct sign, then completes the full
  runner/journey/reading/reward route with 12 tracked attempts and one journey
  node. `npm.cmd run voice:elevenlabs-audit` remains green at 1558/1558 stored,
  1489/1489 current, and 32/32 phonemes; no new MP3 was needed.

Release:

- GitHub `main` contains the validated returning-profile confirmation as commit
  `295f03e`.
- WSL Wrangler deployed Worker version
  `a3ef169d-05a5-4f07-833c-b8172875a843`. The cache-busted live root serves
  `index-DGcIRWX1.js` and `index-iuJE1TLI.css` with HTTP 200. Served code
  contains the personal-sign prompt, adult-gated switch, retry line, returning
  sign layout, and used-sign state. The existing Lily
  `kijk-nog-eens-goed.mp3` is live as `audio/mpeg` with exactly 18,852 bytes.

## Durable Profile Signs and Audible Entry - 2026-07-11

Completed work:

- Moved the six child identity signs into shared data so storage and UI use one
  canonical inventory. New profiles now receive a valid unused sign even when
  a non-UI caller requests a duplicate or unknown id.
- Existing rosters are repaired deterministically on load: profile order and
  active child stay unchanged, the first valid owner keeps a sign, and later
  duplicate/invalid signs receive the first unused sign. Per-child progress,
  settings, mastery, rewards, and storage keys are untouched.
- Profile creation/selection now disables every control, marks the screen busy,
  visually holds the chosen sign, and waits until the existing natural Lily
  `Hoi! Daar gaan we!` line finishes before opening the Sterrenreis. A rapid
  second tap can no longer create an accidental extra sibling.
- Hardened `VoiceManager.speakThen`: when a browser exposes `Audio` but throws
  while constructing it, the completion callback still runs. Audio-gated
  navigation therefore degrades to silent progress instead of a frozen screen.
- Removed a first-session message collision found during live browser review:
  the Grasland banner no longer renders behind the full-screen Sterrenreis
  cinematic. It appears with its own narration on the child's first successful
  return, leaving the opening story as the only message before play.

Validation:

- New storage tests prove duplicate requests and persisted duplicate/invalid
  legacy rosters become `blitz`, `aqua`, `web` while preserving active `p2`.
  Flow coverage holds the profile screen until narration completion and proves
  a disabled second tap cannot create another profile. Audio coverage forces a
  throwing `Audio` constructor and proves the gated callback still fires. The
  opening-cinematic flow asserts that no region banner exists before or after
  its start action while the journey is still untouched.
- `npm.cmd run verify` passes typecheck, lint, 34 test files / 299 tests, and a
  clean production build. Entry assets are `index-CC4LJWEL.js` (102.37 kB gzip)
  and `index-By3veXyl.css` (33.42 kB gzip).
- `npm.cmd run qa:viewport` passes all 59 scenarios. Its new 332x807 first-
  journey case advances to decision beat 3 and requires a full-viewport,
  unclipped cinematic, a visible/clickable >=180x52 start action, and zero
  competing region banners. The resulting mobile screenshot and a live desktop
  in-app-browser capture were both inspected directly. In addition,
  `npm.cmd run qa:mobile-touch` passes the 41-step real-touch route with 12
  attempts and one completed journey node.
- `npm.cmd run voice:elevenlabs-audit` remains green at 1558/1558 stored clips,
  1489/1489 current lines, and 32/32 reading phonemes. The transition reuses an
  existing Lily clip, so no generated audio or manifest update was required.

Release:

- GitHub `main` contains the validated identity/audio/onboarding hardening as
  commit `cabbb11`.
- WSL Wrangler deployed Worker version
  `bbe3600b-cde9-4117-9516-0261c9ecccdc`. The cache-busted live root serves
  `index-CC4LJWEL.js` and `index-By3veXyl.css` with HTTP 200; served code/CSS
  contain the canonical signs, busy transition, natural welcome line, journey
  intro, and selected-profile animation. The Lily
  `hoi-uitroep-daar-gaan-we-uitroep.mp3` is live as `audio/mpeg` with exactly
  26,793 bytes.
- A final in-app-browser check on the canonical Sprintsite confirmed the live
  returning sign opens the fresh journey with `intro=true`, `journey=true`, and
  `regionBanners=0`; the resulting clean cinematic screenshot was inspected.

## Interleaved Practice and Round Variety - 2026-07-11

Completed work:

- Added a pure curriculum interleaving selector. It keeps shaky and due targets
  ordered by priority but skips the target just attempted in the same learning
  domain and session. If no other priority target exists, the scene gets one
  discovery round before the weak target can return.
- Calm curriculum scenes now remember their previous target and boundedly
  re-roll an accidental immediate duplicate. An explicit adaptive focus remains
  stronger than the cooldown, so necessary remediation is never discarded.
- `Tel mee` now excludes the just-rescued animal from the next round's visual
  pool. Even a deterministic/random-zero session changes species while keeping
  the quantity chosen by the adaptive number engine.

Validation:

- Review tests prove `letter-s` yields to `letter-m` inside one session, returns
  first in a fresh session, and yields no forced focus when it is the only
  immediate candidate. New behavioral scene tests prove free generation
  `a -> a -> b` renders `a -> b`, explicit focus still renders `a -> a`, and
  consecutive Count rounds change animal under fixed randomness.
- `npm.cmd run verify` passes typecheck, lint, 35 test files / 303 tests, and a
  production build. Entry assets are `index-Bnc1LDNH.js` (102.53 kB gzip) and
  `index-By3veXyl.css` (33.42 kB gzip).
- `npm.cmd run qa:viewport` passes all 59 scenarios and the fixed-seed
  `npm.cmd run qa:mobile-touch` route passes 41 real touches, 12 tracked
  attempts, and one completed journey node after playing the changed Count flow.
- No spoken line or phoneme inventory changed; the validated local Lily packs
  remain the only runtime speech source.

Release:

- GitHub `main` contains the validated interleaving and Count-variation change
  as commit `92f5b26`.
- WSL Wrangler deployed Worker version
  `d79899f8-c23b-4cc5-b83f-4165bb7bc0ba`. The cache-busted live root serves
  `index-Bnc1LDNH.js` and unchanged `index-By3veXyl.css` with HTTP 200. Served
  JavaScript contains the session-aware curriculum-focus path and current Count
  flow and has the expected 386,537 bytes.

## Answer-Position Fairness and Day-Boundary QA - 2026-07-12

Completed work:

- Added a shared calm-mode answer-layout guard for challenges with exactly one
  correct option. Random placement remains untouched for the first two rounds;
  only a third identical correct position is swapped to another slot. This
  prevents `always tap left/middle/right` pattern learning without introducing
  a predictable alternating pattern.
- Repaired a pre-existing date-dependent flow test exposed when this run crossed
  local midnight. The daily-mission completion test now pins the same local day
  for planning, completion, and Hub rendering instead of mixing a fixed date
  with the machine clock.

Validation:

- Behavioral coverage proves correct option positions `0, 0, 0` render as
  `0, 0, 1`; the existing tests still prove explicit adaptive target repetition
  and interleaving. The day-mission flow now passes independently of wall-clock
  date.
- `npm.cmd run verify` passes typecheck, lint, 35 test files / 304 tests, and a
  production build. Entry assets are `index-DuYYqNZK.js` (102.70 kB gzip) and
  unchanged `index-By3veXyl.css` (33.42 kB gzip).
- `npm.cmd run qa:mobile-touch` passes 41 real touch steps with 12 tracked
  attempts and one journey node; `npm.cmd run qa:viewport` passes all 59
  scenarios after answer objects can change position.
- No audio content or routing changed in this fairness pass.

Release:

- GitHub `main` contains the validated answer-position and day-boundary change
  as commit `7ca7263`.
- WSL Wrangler deployed Worker version
  `aed1164a-308c-4f25-9416-041a433fb38d`. The cache-busted live root serves
  `index-DuYYqNZK.js` and unchanged `index-By3veXyl.css` with HTTP 200. The
  served JavaScript contains the current Count, curriculum-focus, and correct-
  option paths and has the expected 387,198 bytes.

## Earned Letters and Adaptive Remediation - 2026-07-12

Audit outcome:

- The proposed minimal-pair and voice-audit gaps were stale: Klankgrot already
  serves misconception-triggered pair duels in-game, and the local Lily audit
  already rejects missing runtime clips and browser speech fallback.
- Letterkompas was tiered, but its first jump was still broad (12 then 20
  graphemes) and was not earned per profile. Misconception labels did resurface
  weak targets, but the immediate help did not distinguish the child's exact
  error or fade with mastery. `sessionWarmup()` was pure and tested but unused.
- A default playtime lock, seventh world, and orphan trace-scorer foundation
  were not added. Playtime policy needs an explicit parent-controlled product
  decision; another region would broaden a 49-node journey before deepening it;
  handwriting should arrive as a complete playable mode, not dead plumbing.

Completed work:

- Added a profile-local Letterkompas book in an initial-reading order beginning
  with `i, k, m, s`. Two correct, unhinted responses on a grapheme earn one new
  grapheme. New profiles therefore see 4/28, the generator deliberately spreads
  evidence over the least-practised unlocked letters, and legacy-seen letters
  never become locked again. A newly earned grapheme gets a visible unlock beat.
- Activated the three-item spaced-review warm-up at the start of each real play
  session. Warm-up queues are isolated per profile/session/domain, consumed
  before ordinary shaky/due focus, visibly marked only when a real old target is
  served, and reset on profile or session change. Adaptive target generation now
  gets enough cheap data-only rolls to make large word pools genuinely obey the
  requested focus; Letterkompas can force its selected grapheme directly.
- Added a pure fading-remediation contract: unseen/shaky targets receive a full
  worked model, secure targets receive a guided step, fluent targets receive a
  small nudge, and a second/third miss in the same round escalates support again.
- Connected the existing misconception classifiers to child-facing teaching in
  Splitsbord, Vriendjes 10, Tientalhuis, Getallenlijn, and Tienbrug. Splitsbord
  now logs profile-local `math-number` split facts and exact error types while
  preserving its established activity identity; its full model renders the
  actual fact (for example `3 = 1 + 2`) rather than a disconnected quantity.
- Added 26 natural Lily `eleven_v3` remediation clips. They are generated at
  build time, committed locally, catalogued, and never call a paid runtime API.
- Compact mini-game headers now use one stable phone size below 400px, fixing
  real clipping found for Letterkompas and Vormenburcht during viewport QA.

Validation:

- Pure and behavioral regressions cover fresh discovery versus true warm-up,
  three queued due targets, full/guided/nudge support and same-round escalation,
  starter/earned/legacy letters, deliberate letter rotation, and Splitbord's
  curriculum error logging plus worked model.
- `npm.cmd run verify` passes typecheck, lint, 36 test files / 312 tests, and a
  production build. Entry assets are `index-DnUDxhxt.js` (106.48 kB gzip) and
  `index-DDjuguac.css` (34.15 kB gzip).
- `npm.cmd run qa:viewport` passes all 61 scenarios, including explicit 332px
  4/28 starter letters, an 18/28 advanced `IJ` profile, and a rendered wrong-
  answer Splitbord model. The starter and remediation screenshots were inspected
  directly. `npm.cmd run qa:mobile-touch` passes 41 real touch steps, 12 tracked
  attempts, and one completed journey node.
- `npm.cmd run voice:elevenlabs-audit` passes at 1584/1584 stored Lily clips,
  1515/1515 current spoken lines, and 32/32 reading phonemes.

Release:

- GitHub `main` contains Claude's validated gradual number curve (`2bd86c9`) and
  this earned-letter/adaptive-remediation milestone (`8558478`).
- WSL Wrangler deployed Worker version
  `28b5c13f-788a-42f2-b23d-8e9e12f47e2c`. The cache-busted canonical root serves
  `index-DnUDxhxt.js` (400,367 bytes) and `index-DDjuguac.css` (173,835 bytes)
  with HTTP 200. Served JavaScript contains both the letter unlock and support-
  level paths; `sw.js` remains JavaScript with HTTP 200.
- The live remediation clip `kijk-alleen-naar-het-lege-vak.mp3` is `audio/mpeg`
  with exactly 28,047 bytes, and the live voice manifest reports 1,584 lines.
  A direct in-app-browser load confirmed the same entry assets, a complete
  returning-profile opening, and no live console warnings or errors.
