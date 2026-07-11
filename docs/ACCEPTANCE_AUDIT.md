# Acceptance Audit

Last updated: 2026-07-11.

This audit maps the Codex goal completion criteria to concrete project evidence. It is intentionally stricter than the automated test suite and includes browser UI/gameplay verification.

## Evidence Summary

- Install: `npm.cmd install` has passed for this project and dependencies are locked.
- Static checks: `npm.cmd run typecheck` and `npm.cmd run lint` pass.
- Tests: `npm.cmd run test` passes with 30 test files / 257 tests.
- Production build: `npm.cmd run build` passes without warnings.
- Full verification: `npm.cmd run verify` passes with typecheck, lint, tests, and production build.
- Local server smoke: `http://127.0.0.1:5273/` returned HTTP 200.
- Cloudflare smoke: `https://definition-some-cat-involvement.trycloudflare.com` returned HTTP 200.
- Browser UI/gameplay QA: `npm.cmd run qa:viewport` passes 24 Chrome scenarios covering the Sterrenreis, the personal-mission Speeltuin, the real runner, core reading/math modes, bosses, narrow phones, desktop fullscreen, and mobile landscape.
- Mobile touch QA: `npm.cmd run qa:mobile-touch` passes a phone-like Chrome route using real `Input.dispatchTouchEvent` touches. The latest 29-step run exercised runner controls and swipes, tapped through the three-beat Sterrenreis intro, completed the current journey quest, selected the reading category, finished Klankgrot, logged 14 attempts, advanced one node, and returned to a Hub showing two checked daily missions.
- Browser layout checks: no console errors, no horizontal overflow, no tiny visible buttons, no visible button overlap, non-flat screenshots, and nonzero Three.js canvas across the automated viewport set.
- Story-mode browser QA: in-app browser at `390x844` opened the 48-node Sterrenreis with one active frontier, Buddy, the friend meadow, a child-facing quest card, and progress pill; completing a story activity moves the frontier without page-level map overflow.
- Personal trajectory QA: pure tests verify balanced math/reading/discovery recommendations, curriculum-stage gating, weak-domain prioritization, repeat avoidance, local-day stability, profile-local persistence, and idempotent rewards. Browser and viewport checks verify three mission cards, five complete categories, no gift/progress overlap, and usable 360 px/fullscreen layouts.
- Visual inspection: latest mobile screenshots for menu, 360px narrow menu, Number Portal, real runner with big in-world numerals, runner, 360px narrow runner, runner gate clarity, WebWoud, reward state, city overview, city build, 360px narrow city build, summary, 360px narrow summary, real-touch summary, and Sterrenreis story mode including the expanded quest-card state were inspected during product-readiness passes.
- Procedural device-feedback checks: tests verify distinct local Web Audio cue patterns, short optional vibration patterns, persisted haptic settings, and shared attempt-pipeline routing for Snap, rescue, city-building, herd rescue, and gentle retry feedback.
- Asset policy: `assets/ASSET_MANIFEST.json` documents generated local assets and no external runtime assets.

## Completion Criteria

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | The app installs locally. | Proven | `npm.cmd install` passed; dependencies are locked in `package-lock.json`. |
| 2 | The app runs locally. | Proven | Vite served this project at `http://127.0.0.1:5273/` with HTTP 200; Cloudflare tunnel browser smoke also returned HTTP 200. |
| 3 | Production build succeeds. | Proven | `npm.cmd run build` passed without warnings. |
| 4 | Main menu works. | Proven | Automated runtime flow and browser QA both navigate from the main menu without console or layout errors. |
| 5 | Number of the Day works. | Proven | `NumberOfDayScene` is registered, shows concrete/schematic/abstract representations, logs a tracked number-name practice attempt, and was clicked through in browser QA. |
| 6 | BlokBlitz runner is playable. | Proven | Runner scene supports lane input, jump/pause, all required mechanics, safe wrong attempts, and Subitize Snap; browser QA completed runner progression. |
| 7 | WebWoud rescue is playable. | Proven | Deterministic WebWoud plan covers all nine anchor decision types and browser QA completed the rescue section through real option clicks. |
| 8 | Sterrenstad hub is playable. | Proven | City scene restores districts through deterministic number-structure tasks, persists progress, exposes a direct child-first `Bouw nu` action for the next district, and browser QA restored a district. |
| 9 | All 12 representations render quantities 1-10. | Proven | `tests/education.test.ts` renders every `REPRESENTATIONS` entry for quantities 1 through 10. |
| 10 | All 12 minigames can be launched. | Proven | `tests/flow.test.ts` launches every minigame through the real `MinigameScene`; browser QA also opened the minigame surface on mobile. |
| 11 | All minigames report attempts to MasteryTracker. | Proven | Education and flow tests record attempts for every `MINIGAME_TYPES` entry, and Number of Day naming practice also uses the same attempt pipeline. |
| 12 | AdaptiveEngine changes challenge selection based on performance. | Proven | Adaptive tests cover weak-skill priority, no exact repeat after failure, make-10 focus, timing changes, concrete scaffolds, and fluent progression. |
| 13 | localStorage/IndexedDB persistence works. | Proven | `SaveManager` localStorage persistence is covered by tests, including attempts, rewards, restored districts, unlocked level, sessions, and settings. |
| 14 | Parent dashboard shows real saved mastery data. | Proven | Flow tests record attempts, open the dashboard, verify all required readout panels from saved data, export JSON, and reset with confirmation; browser QA confirmed dashboard real data after gameplay. |
| 15 | Assets are local at runtime. | Proven | Runtime source tests reject remote URLs and network APIs, visuals are procedural SVG/CSS/Three.js/Web Audio, and asset audit tests enforce this policy. |
| 16 | Asset manifest exists and is accurate. | Proven | `assets/ASSET_MANIFEST.json` exists, lists no external assets, and documents generated local asset categories. |
| 17 | README explains setup, controls, architecture, asset policy, adding representations, adding challenges, and the learning model. | Proven | README contains the required sections, documents viewport/touch QA commands, and acceptance tests check the section names. |
| 18 | The player cannot ignore number structures and still play optimally. | Proven | Runner gates, boosts, bridges, shields, anchors, deterministic city restoration, minigames, and level unlocking all require structured number choices; tests and browser QA verify structured-choice progression. |
| 19 | Mistakes are safe and scaffolded. | Proven | Safe wrong-attempt handling, visible scaffold feedback, retryable scenes, hints, lower-pressure adaptive choices, and no hard game over are implemented, tested, and browser-checked. |
| 20 | Subitize Snap rewards fast visual recognition. | Proven | Fast correct runner recognition logs fluent mastery and renders a `.snap-burst` reward; browser QA observed visible Snap after a fast correct runner choice. |
| 21 | No educational fidelity rule is violated. | Proven | Education logic is separated from scenes, all required representations/templates exist, naming quantities is trained and tracked, canonical 5+n and 10-structure drive mechanics, runtime source stays local-first, settings cover speed/mute/haptics/contrast, and automated plus browser checks verify presentation fidelity. |

## Browser QA Details

- Desktop viewport: main menu, direct runner, Subitize Snap, full session flow, safe runner miss, WebWoud completion, city challenge/restoration, summary, parent dashboard, and settings.
- Mobile viewport `390x844`: main menu, number portal, runner, safe runner scaffold, minigames surface, WebWoud anchors/reward, Sterrenstad overview, Sterrenstad build, and summary.
- Narrow mobile viewport `360x740`: main menu, Runner, Sterrenstad build, and Summary, with child actions reachable and no control overlap or blocked playfield.
- Mobile touch route `390x844`: start adventure, wake Number Portal, enter Sprint, move with left/right controls and swipes, complete runner choices, move through WebWoud controls and swipes, complete WebWoud choices, use city `Bouw nu`, move through city build controls and swipes, restore a district, and reach Summary through coordinate touch events rather than DOM `.click()`.
- Story-mode viewport `390x844`: Sterrenreis default route, active frontier node, Buddy, free-play backpack, progress pill, quest card, friend meadow, story activity completion, bloom return state, and no document-level page scroll.
- QA URL: `https://definition-some-cat-involvement.trycloudflare.com`.
- Result: no console errors, no horizontal overflow, no tiny visible buttons, no visible button overlap, and nonzero canvas size.

## Remaining Required Proof

No required proof remains open for the original completion checklist as of the latest validation pass. The newer product-readiness goal remains active and is tracked below.

## Product Readiness Follow-Up

After the original checklist was completed, real-phone feedback showed the game still did not feel production-ready on mobile. The newer product-readiness goal remains active and is tracked in `docs/STATUS.md`.

Current follow-up evidence:

- Live Sprint, WebWoud, Oefenwereld, and Sterrenstad build mode use full-screen world-first play layers rather than blocking flashcard panels.
- DOM choice cards in live play act as transparent large touch zones while Three.js renders the visible targets, hero, pickups, landmarks, and outcome objects.
- Sprint mechanics render distinct 3D objects for gates, boosts, shields, bridges, jumps, split chests, enemy waves, one-more/less platforms, rescue cages, shortcuts, and dino streaks.
- Number structures remain embedded in gameplay through selected-path 5+n pickup chains, quantity blocks, make-10 shields, train/bridge/build tasks, anchor decisions, and city restoration tasks.
- Live target HUDs keep the concrete target representation visible with direct `Zoek` / `Bouw` labels instead of hiding Sprint flash-gate prompts behind a question-mark memory card.
- The hero is a multi-part low-poly dino with progress-driven motion, WebWoud cape motion, boost streaks, and city build mode identity.
- Mobile live HUDs use compact target panels, micro-goal chips, left/action/right icon controls, and non-blocking reward pickup badges.
- Live utility controls use compact local CSS icons for menu/back/refresh while preserving accessible labels, reducing text-heavy controls in the active phone play surface.
- Viewport QA now verifies live mobile controls expose `left, act, right` pad actions with a labelled central action button.
- Sprint's central action control now follows the active micro-goal across all 11 runner mechanics, so gates, boosts, shields, bridges, splits, waves, rescues, and routes do not all present as the same generic action.
- Live Runner, WebWoud, Oefenwereld, and Sterrenstad build mode now turn adaptive display timing into auto-run pressure: weak mastery receives a longer window and slower progress, while fluent mastery receives tighter pressure.
- Wrong live choices now move the safe retry hint to the correct lane/anchor/object/build choice and add local Three.js scaffold beacons, so scaffolding is visible in the world rather than only as explanatory copy.
- The child-facing main menu now enforces one adventure route: the dominant `Start avontuur` button and route markers all begin at the Number Portal, while direct Sprint/WebWoud/Stad scene opening is limited to the `?qa=` viewport-test hook.
- The child menu no longer shows a separate dashboard-like stats card; saved progress is represented as child-facing rewards in the compact progress strip, with detailed statistics left to the parent dashboard.
- Sterrenstad overview now presents one dominant `Bouw nu` action for the next un-restored district and marks the same district on the city map, so the child reaches full-screen city build play without first parsing a 14-district choice grid.
- `qa:mobile-touch` now gives stronger phone-like evidence than viewport screenshots alone by dispatching real Chrome touch events through the complete child-facing route, verifying movement controls/swipes across live worlds, and confirming attempts/city restoration from current game state.
- The app shell now includes local installable mobile metadata and offline shell support: fullscreen display, portrait orientation, `viewport-fit=cover`, `100dvh` shell sizing, theme color, mobile web app capability, local SVG icon references, and a production-scoped same-origin service worker documented in `assets/ASSET_MANIFEST.json`.
- Child start and replay gestures now make a safe best-effort fullscreen request through `requestFullscreenPlay`; denied or unsupported requests are caught so gameplay continues normally.
- Visible child-facing progression now exists in the menu progress strip, non-skippable Number Portal wake gate, Number Portal adventure bridge, route transition toasts, route/rescue milestone rewards, city build rewards, summary treasure trail, and first-viewport summary replay actions.
- The revamp branch now uses De Sterrenreis as the default adventure shell: boot opens the journey map, the hub `Sterrenreis` card returns to it, story-launched runner/minigame nodes advance saved journey progress, friend nodes rescue companions into the meadow, the final star completes the route, and the child returns to the map through `Verder` instead of falling back into disconnected activity menus.
- Runner gates now use high-contrast in-world lane readability: distinct colored lane pads, dark sign panels, dominant voxel numerals, larger quantity art, 5+n shelves, lane runway tokens, and near-hero 3D preview signs make the current three choices readable on mobile without relying only on color or adding flashcard overlays.
- Memory now participates correctly in Sterrenreis progression: a story-launched Memory board advances its journey node and returns through `Verder`, so the route cannot get stuck before later runner gates.
- The child-facing Summary now keeps detailed attempt/streak stats inside a closed `Voor ouders` details panel by default, reducing dashboard-like noise while keeping parent evidence accessible.
- `npm.cmd run qa:viewport` covers menu, 360px narrow menu, number portal, real mobile runner, legacy mobile runner, 360px narrow runner, mobile wrong-choice scaffold, short desktop runner, mobile WebWoud, live WebWoud reward feedback, mobile Oefenwereld, mobile Sterrenstad overview, mobile Sterrenstad build, 360px narrow Sterrenstad build, mobile summary, and 360px narrow summary.
- `npm.cmd run qa:mobile-touch` touches the real `run` controls, covers the longer child route with real touch events, and produces `.qa-artifacts/mobile-touch-qa/report.json` plus `summary-touch-mobile.png`.
- Latest validation: `npm.cmd run verify` passes with 30 files / 257 tests and production build, `npm.cmd run qa:viewport` passes 29 scenarios, `npm.cmd run qa:mobile-touch` passes a 39-step real-touch journey with 12 tracked attempts, and the local ElevenLabs audit passes at 1487/1487 current lines plus 32/32 reading phonemes.

Remaining for the active product-readiness goal:

- Physical hands-on phone QA through the latest Cloudflare URL. Automated Chrome viewport and real-touch emulation are strong evidence for layout and hit targets, but they are still not a substitute for actual phone feel in a child's hands.
- A final requirement-by-requirement audit against `docs/GAME_SPEC.md` and `docs/PLAN.md` using current evidence, not the older original-checklist evidence.
- Any findings from that phone QA or final audit must be fixed before marking the goal complete.
