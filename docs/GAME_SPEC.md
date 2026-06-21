# BlokBlitz: Dino Redders van Sterrenstad - Game Specification

## Vision

BlokBlitz is a local-first educational action game for children aged 4-7. The child plays as a Dino Keeper and BlokBlitz hero restoring Sterrenstad after a Chaos Storm shattered the city of living number structures.

The game is not a quiz wrapper. Number structures are the mechanics. Fast recognition, 5+n, 10-structure, part-whole thinking, comparison, one more and one less, and representation matching directly drive speed, routes, bridges, shields, rescue cages, buildings, train wagons, and rewards.

## Player Fit

The game supports a child who likes fast movement, blocky worlds, swinging, dinosaurs, rescue missions, visible rewards, building, and world restoration. It uses minimal reading, large visual prompts, repeated patterns, animation, audio feedback, and simple Dutch labels.

## Canonical Number Structures

- 1: single
- 2: pair
- 3: triangle
- 4: square or 2+2
- 5: complete five-group
- 6: 5+1
- 7: 5+2
- 8: 5+3 or 4+4
- 9: 5+4
- 10: 5+5

Default layouts must be canonical, not random scatter.

## Required Representations

Reusable renderable quantity representations:

1. Dot cards
2. Dice patterns
3. Domino patterns
4. Finger and hand patterns
5. Five-frames
6. Ten-frames
7. Bead strings or rekenrek red-white bead patterns
8. Block stacks
9. Egg nests
10. Paw-print groups
11. Numerals 1-10
12. Mixed representation matching

## Learning Progression

Concrete to schematic to abstract:

- Concrete: eggs, paw prints, dinos, block stacks, fingers
- Schematic: dot cards, dice, dominoes, five-frames, ten-frames, bead strings
- Abstract: numerals 1-10, mixed equivalence, child-friendly part-whole notation

Track these skills separately:

- Recognizing quantities
- Naming quantities
- Matching quantity to numeral
- Matching numeral to structured quantity
- Building quantities
- Decomposing quantities
- Completing quantities to 10
- Comparing quantities
- One more and one less

## Scene Flow

A normal 10-15 minute session contains:

1. Number of the Day reveal
2. BlokBlitz Sprint run
3. WebWoud rescue section
4. Sterrenstad build or restoration moment
5. Summary screen
6. Optional parent dashboard

Required scenes:

- BootScene
- MainMenuScene
- NumberOfDayScene
- BlokBlitzScene
- WebWoudScene
- SterrenstadScene
- MinigameScene
- SummaryScene
- ParentDashboardScene
- SettingsScene

## Layer 1: BlokBlitz Sprint

A complete three-lane runner in a blocky world. The player runs automatically, switches lanes, jumps, collects stars, activates boosts, opens gates, repairs bridges, uses shields, dodges safe enemies, rescues dinos, and unlocks routes.

Implemented mechanic types:

- Flash Gates
- Subitize Boost pads
- Make-10 Shield portals
- Bead Bridges
- Jump platforms
- Split Chests
- Enemy Wave Compare
- One More / One Less platforms
- Rescue cages
- Shortcut routes
- Dino rescue streaks

Subitize Snap rewards fast correct visual recognition:

- 1-3 under 400 ms
- 4-5 under 600 ms
- 6-8 under 900 ms
- 9-10 under 1200 ms

Fast correct snaps trigger a canonical snap animation, particles, a bright audio cue, a larger speed boost, and fluent recognition logging.

## Layer 2: WebWoud Redders

A swing/web/vine rescue layer. The player chooses anchors with number representations. Correct anchors open cages, grow routes, rescue dinos or Numerianen, and advance the section. Wrong anchors cause safe bounce, lower route, rescue delay, or scaffold animation.

Anchor decisions cover:

- Quantity matching
- Numeral matching
- Numeral to structured quantity
- Structured quantity to numeral
- Make-10 complement
- Part-whole relation
- One more / one less
- Compare larger or smaller
- Representation equivalence

Anchor layout reinforces 5, 5+n, 4+4, and 5+5 structures.

## Layer 3: Sterrenstad Bouwers

A persistent buildable hub world. It is a reward space and learning space, not just a menu. Rescued dinos, Numerianen, stars, and number blocks restore city districts.

Districts:

- Dot Card Plaza
- Dice Cave
- Domino Dock
- Finger Treehouse
- Five-Frame Farm
- Ten-Frame Tower
- Rekenrek Bridge
- Block Stack Yard
- Egg Nest Nursery
- Pawprint Rescue HQ
- Numeral Library
- Mixed Match Observatory
- Train of Ten Station
- Dino Park

Restoration tasks are number-based: build exact quantities, complete totals of 10, match numerals and structures, light lamps with one more / one less, and restore routes through 5+n arrangements.

## Minigame Templates

All 12 templates are implemented and feed the same MasteryTracker:

1. Flash Gates
2. Dice Hunt
3. Bead Bridge
4. Make-Ten Shield
5. Split Chests
6. Web Anchors
7. Train of Ten
8. Enemy Wave Compare
9. Build the Number
10. One More / One Less
11. Double Track
12. Rescue the Herd

## Adaptive Engine

The adaptive engine chooses future challenges from mastery data:

- Prefer emerging and weak cells while avoiding frustration loops.
- Do not spam exact repeats after failure.
- If accuracy drops, use concrete representations and slower timing.
- If reaction time improves, reduce display time or increase route pressure.
- If secure, mix representations.
- If fluent, add faster timing, distractors, part-whole, and mixed equivalence.
- If N is confused with N-1, force 5+n and ten-frame scaffolds.
- If numeral matching is weak, pair numerals with concrete representations first.
- If make-10 is weak, increase Make-Ten Shield and Train of Ten.
- If one-more/one-less is weak, use visual before/after sequences.
- Never punish harshly.

Mastery levels:

- Emerging: fewer than 5 exposures or accuracy below 70 percent
- Secure: at least 5 exposures, accuracy at least 75 percent, hint rate below 30 percent
- Fluent: at least 8 exposures, accuracy at least 85 percent, fast median RT, hint rate below 15 percent

## Parent Dashboard

Accessible from the main menu. Shows mastery by skill, mastery by representation, weakest quantities, weakest ranges, misconception patterns, reaction time trend, hint rate, play sessions, recent progress, suggested next focus, JSON export, and reset progress with confirmation.

## Controls

Keyboard:

- A / ArrowLeft: move left
- D / ArrowRight: move right
- W / ArrowUp / Space: jump or swing
- Enter: confirm
- Escape: pause

Mouse and touch:

- Tap or click lane, anchor, object, block, gate, or button.
- Swipe left/right in Sprint and WebWoud to move between lanes or anchors.
- Swipe up in Sprint and WebWoud to use the selected lane or anchor.
- Drag is supported in build moments where useful.

## Accessibility

- Minimal reading
- Big buttons
- Simple icons and repeated visual grammar
- No hard game over
- Short retry loops
- Adjustable speed
- Mute button
- Parent export and reset
- Readable visuals at gameplay distance

## Completion Criteria

1. The app installs locally.
2. The app runs locally.
3. Production build succeeds.
4. Main menu works.
5. Number of the Day works.
6. BlokBlitz runner is playable.
7. WebWoud rescue is playable.
8. Sterrenstad hub is playable.
9. All 12 representations render quantities 1-10.
10. All 12 minigames can be launched.
11. All minigames report attempts to MasteryTracker.
12. AdaptiveEngine changes challenge selection based on performance.
13. localStorage persistence works.
14. Parent dashboard shows real saved mastery data.
15. Assets are local at runtime.
16. Asset manifest exists and is accurate.
17. README explains setup, controls, architecture, asset policy, adding representations, adding challenges, and the learning model.
18. The player cannot ignore number structures and still play optimally.
19. Mistakes are safe and scaffolded.
20. Subitize Snap rewards fast visual recognition.
21. No educational fidelity rule is violated.
