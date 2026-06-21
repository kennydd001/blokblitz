# Codex Implementation Runbook

Follow `docs/PLAN.md` milestone by milestone. Keep the app runnable at all times.

## Loop

1. Read the current milestone in `docs/PLAN.md`.
2. Implement the smallest coherent slice that satisfies that milestone.
3. Run the milestone validation commands.
4. Fix failures immediately.
5. Smoke-test the relevant flow.
6. Update `docs/STATUS.md` with completed work, decisions, validation results, known issues, and next steps.
7. Continue until all completion criteria pass.

## Windows Command Notes

PowerShell may block `npm.ps1`, so use:

```powershell
npm.cmd install
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test
npm.cmd run build
npm.cmd run dev
```

## Educational Integrity Checks

Before marking a feature complete, verify that:

- Number structures control the action, reward, unlock, route, or restoration.
- The player benefits from recognizing canonical structures.
- Mistakes produce safe scaffolding, not harsh punishment.
- Attempts are logged to MasteryTracker with skill, representation, quantity, correctness, reaction time, and hint data.
- AdaptiveEngine can use the result to influence future challenges.

## Asset Rules

Prefer generated local assets:

- SVG strings rendered by representation modules
- Three.js primitive geometry
- Procedural canvas textures
- Web Audio API tones

If any external asset is downloaded:

- Confirm permissive license first.
- Store the file locally.
- Keep license files when provided.
- Add a complete entry to `assets/ASSET_MANIFEST.json`.
- Do not use protected brands or unclear licensing.

