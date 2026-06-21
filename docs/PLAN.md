# Milestone Plan

## Milestone 1 - Foundation and Durable Docs

Acceptance criteria:

- `AGENTS.md`, `docs/GAME_SPEC.md`, `docs/PLAN.md`, `docs/IMPLEMENT.md`, `docs/STATUS.md`, and `assets/ASSET_MANIFEST.json` exist.
- Package metadata, TypeScript, Vite, tests, and app shell exist.
- Local-first asset policy is documented.

Validation:

```powershell
npm.cmd install
npm.cmd run typecheck
npm.cmd run build
```

## Milestone 2 - Education Core

Acceptance criteria:

- Required TypeScript types exist.
- All 12 representations render quantities 1-10 with canonical layouts.
- MasteryTracker logs attempts and computes mastery.
- AdaptiveEngine changes challenge selection from saved performance.
- ChallengeFactory exposes all 12 minigame templates.

Validation:

```powershell
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
```

## Milestone 3 - Scene Flow and Persistence

Acceptance criteria:

- Boot, main menu, number of the day, runner, WebWoud, city, minigame, summary, parent dashboard, and settings scenes are navigable.
- SaveManager stores progress, attempts, settings, city restoration, stars, and rescued dinos in localStorage.
- Parent dashboard reads real saved mastery and can export JSON or reset with confirmation.

Validation:

```powershell
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
```

## Milestone 4 - BlokBlitz Sprint

Acceptance criteria:

- Three-lane automatic runner is playable with keyboard and pointer.
- Gates, boosts, make-10 shields, bead bridges, jump platforms, split chests, compare waves, one more/less routes, rescue cages, shortcuts, and rescue streaks exist.
- Correct number-structure decisions control speed, route unlocks, shield, bridges, and rescues.
- Subitize Snap uses timing thresholds and logs fluent recognition.

Validation:

```powershell
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
```

Manual smoke:

- Start dev server.
- Navigate Main Menu -> Number of Day -> BlokBlitz.
- Confirm lane choices log attempts and affect speed.

## Milestone 5 - WebWoud and Sterrenstad

Acceptance criteria:

- Web anchors ask the required decision types and route choices rescue characters.
- Sterrenstad districts are persistent, unlockable, and restored through number-based tasks.
- The hub is a reward and learning space rather than a menu.

Validation:

```powershell
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
```

Manual smoke:

- Complete WebWoud anchors.
- Restore at least one city district and reload to confirm persistence.

## Milestone 6 - All Minigames and Dashboard

Acceptance criteria:

- All 12 minigames launch from the minigame scene.
- Each minigame reports attempts to MasteryTracker.
- Mistakes are safe and scaffolded.
- Dashboard shows mastery by skill, representation, weak quantities/ranges, misconceptions, RT trend, hint rate, sessions, progress, next focus, export, and reset.

Validation:

```powershell
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
```

Manual smoke:

- Launch every minigame once.
- Verify the dashboard changes after attempts.

## Milestone 7 - Final Verification

Acceptance criteria:

- All completion criteria in `docs/GAME_SPEC.md` pass.
- README is complete.
- `docs/STATUS.md` contains final validation results and known issues.
- Runtime assets are local and manifest is accurate.

Validation:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test
npm.cmd run build
npm.cmd run dev
```

Manual smoke:

- Inspect desktop and mobile viewport.
- Confirm app is nonblank, readable, interactive, and no core UI overlaps.

