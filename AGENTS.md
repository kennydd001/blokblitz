# Codex Working Rules

Project: BlokBlitz: Dino Redders van Sterrenstad.

## Non-negotiable Objective

Build the full local-first educational action game, not an MVP, prototype, or vertical slice. Do not declare the work done until the completion criteria in `docs/GAME_SPEC.md` and `docs/PLAN.md` pass.

## Engineering Rules

- Keep educational logic separate from rendering and scene code.
- Keep challenge generation, mastery tracking, misconceptions, and adaptive rules in `src/education`.
- Keep scene flow and visual interaction in `src/scenes` and `src/gameplay`.
- Keep all runtime assets local. Prefer procedural SVG, canvas, Three.js primitives, and Web Audio.
- Document every external asset in `assets/ASSET_MANIFEST.json` before using it.
- Do not use paid APIs, server dependencies, runtime CDNs, or unclear-license assets.
- Run validation after each milestone and repair failures before moving on.
- Update `docs/STATUS.md` after each milestone with decisions, validation, issues, and next steps.
- Number structures must directly control gameplay. Do not build a normal runner with disconnected quiz popups.
- Mistakes must be safe and scaffolded. Do not add harsh failure loops or hard game over.

## Validation Habit

Use these commands whenever the related files change:

```powershell
npm.cmd install
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test
npm.cmd run build
npm.cmd run dev
```

PowerShell may block `npm.ps1`; prefer `npm.cmd` on Windows.

