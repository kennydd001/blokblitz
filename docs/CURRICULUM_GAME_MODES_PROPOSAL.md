# Curriculum and Game Mode Expansion Proposal

Date: 2026-06-27

Scope: proposal only. This document is a hand-off for the next builder. It does
not implement code, but it gives the curriculum map, game modes, data model, and
acceptance checks needed to expand BlokBlitz beyond the current 1-10 number
structure core.

## Sources Checked

- Vlaanderen, "Nieuwe minimumdoelen basisonderwijs":
  https://www.vlaanderen.be/onderwijsprofessionals/lesgeven-en-begeleiden/opleidingsinhouden/opleidingsinhouden-basisonderwijs/nieuwe-minimumdoelen-basisonderwijs
- Onderwijsdoelen search entry point:
  https://onderwijsdoelen.be
- Vosbergschool, "Infoboekje L1 2025-2026":
  https://2023.vosbergschool.be/wp-content/uploads/2025/09/Infoboekje-L1-2025-2026.pdf
- Uitgeverij Zwijsen, "Veilig leren lezen Zoem-versie - Didactiek":
  https://www.uitgeverijzwijsen.be/veiliglerenlezen/visie/didactiek

Important interpretation: Flanders does not define official minimumdoelen per
separate first-grade year. The official structure uses anchor moments, and the
2026-2027 rollout makes Nederlands, wiskunde, and wetenschap en techniek
mandatory for years 1-3. First-grade detail therefore has to be inferred from
approved school methods, local leerplannen, and the bridge from end
kleuteronderwijs to later primary goals. The game should stay configurable so a
school or parent can adapt letter order and word sets.

## High-Level Finding

The current game already covers a strong part of first-grade number sense:
subitizing, structured quantities 1-10, numeral matching, comparing, one
more/one less, part-whole, make-10, and safe adaptive scaffolding.

The main missing curriculum areas are:

1. Literacy/reading: sound awareness, letter-sound links, blending, segmenting,
   early word reading, word building, listening comprehension, vocabulary, and
   reading motivation.
2. Math beyond 10: number line to 20, teen numbers, full tens 10 and 20,
   addition/subtraction to 20, bridge over 10, splits of 20, even/odd, doubles
   and halves.
3. Measurement and geometry: length/weight/capacity comparison, natural units,
   euro amounts to 10, yesterday/today/tomorrow, hour and half-hour,
   shapes/positions/patterns/views/mirror/shadow.
4. Problem solving: small story problems where the child selects the model
   before acting.
5. Optional WO/verkeer layer: seasons/body/water and traffic themes such as
   signs, being visible, passenger behavior, and blind spot.

## Specific Answers to the User Questions

### Zoemend leren lezen

Yes. This is central for first-grade reading. In game terms, "zoemen" should be
a mechanic where the child holds or swipes through letter/sound tokens and the
game stretches them into one word. It should prevent disconnected spelling as
the only strategy.

Implementation rule: use audio and motion. The child should hear or see
"vvv-iii-sss" join into "vis", then move through a gate or rescue a character.
Do not rely on a text-only prompt.

### Splitsen van woorden

Yes, but split it into two related skills:

- Sound segmentation: break a simple word into phonemes or graphemes, for
  example "maan" -> "m" + "aa" + "n".
- Later word chunks: short syllables or word parts, when words become longer.

For first implementation, use sound boxes, not grammar terms. A 3-box or 4-box
visual works well: beginning sound, middle sound, ending sound. This mirrors the
part-whole board visually and keeps the literacy logic game-like.

### Rekenbordje met 3 vakjes

Yes. This is the part-whole/split board. Model it as one total box and two part
boxes:

```text
      [ total ]
   [ part ] [ part ]
```

For 5, all first-grade split facts should be supported:

- 0 + 5
- 1 + 4
- 2 + 3
- 3 + 2
- 4 + 1
- 5 + 0

The current `split-chests` mode only partially covers this because it generates
some positive splits and does not make the physical 3-box board the main
mechanic. The new mode should make moving objects between the two lower boxes
control gameplay directly.

## Curriculum Coverage Map

### Math: Already Strong

- Getalbeelden 1-10
- Hoeveelheden 1-10
- Tellen and number names
- Numeral-to-quantity and quantity-to-numeral
- Meer/minder/evenveel
- One more/one less
- Structured five and ten frames
- Make 10
- Basic part-whole
- Doubles in the existing `double-track`

### Math: Add Next

- Zero as empty quantity, especially for split facts.
- All splits to 10, including reversal pairs and missing-part tasks.
- Splits of 20 in a concrete 10+10 model.
- Number line to 20: position, before/after, between, missing number.
- Full tens 10 and 20.
- Teen number structure: 11 as 10+1, 12 as 10+2, etc.
- Addition and subtraction to 20:
  - `+` and `-` to 10
  - teen plus/minus ones
  - subtraction to the ten
  - bridge over 10 as "first fill or empty the ten"
- Even/odd to 10, doubles, halves.
- Geld to 10 euro with local toy coin visuals.
- Time: yesterday/today/tomorrow, day rhythm, analog/digital hour and half-hour.
- Measurement: longer/shorter/equal, natural units, meter, kilogram, liter.
- Geometry: circle, triangle, square, rectangle, corners, polygons, positions,
  left/right, diagonal in a 3x3 grid, patterns, views, shadow, mirror.

### Literacy: Add New Domain

- Klankbewustzijn:
  - hear same/different sounds
  - beginning sound
  - ending sound
  - middle sound for simple words
  - rhyme
  - oral blending
  - oral segmentation
- Letter-sound mapping:
  - grapheme to sound
  - sound to grapheme
  - one new letter with known letters
  - letter discrimination: b/d/p, m/n, ui/uu, ei/ij, au/ou later
- Zoemend lezen:
  - connected sound blending
  - do not over-reward isolated letter naming
  - gradually reduce audio support
- Word building:
  - MKM/CVC style words
  - Dutch digraphs and long vowels as one sound token, e.g. aa, ee, oo, oe, ie
  - later CCVC/CVCC only after simple words are stable
- Early sentence reading:
  - short decodable phrases
  - picture matching
  - event order
- Listening comprehension and vocabulary:
  - hear a tiny story
  - choose the picture/action that answers the question
  - sequence first/then/last

## Proposed New Game Modes

Each mode below must log attempts through the same mastery system, use local
assets only, and make the learning structure control the action.

### 1. Splitbord Builder

Purpose: automate splits to 10 and later splits of 20.

Core mechanic: a moving build board has one total slot at the top and two part
slots below. The child drags, taps, or steers blocks into the two lower slots.
The bridge opens only when the parts make the total.

Challenge types:

- Total known, pick two parts: "maak 5".
- One part known, pick missing part: "5 is 4 en ?".
- Parts known, pick total: "3 en 2 maken ?".
- Find all splits over several rounds: collect all split badges for one number.
- Reversal recognition: 2+3 and 3+2 both work, but the game records the pair.
- Zero splits: empty box is a valid part.

Scaffolds:

- Show five-frame first when a child misses.
- Highlight one lower box at a time.
- Let wrong blocks bounce back safely.
- Voice: "Samen is het nog niet vijf. Kijk naar het lege vak."

Data needed:

- `src/education/math/splits.ts`
- All split pairs 0..n for n 1..10 and 20.
- Misconceptions: missing-zero-split, reversed-pair-unclear, missing-part-weak,
  counts-total-as-part, off-by-one-part.

### 2. Tienbrug Run

Purpose: addition/subtraction to 20 with bridge over 10.

Core mechanic: a route has a 10-bridge. To cross, the child first fills or
empties the ten, then moves the rest.

Examples:

- 8 + 5: take 2 to reach 10, then 3 more.
- 11 - 3: remove 1 to reach 10, then 2 more.
- 14 - 4: remove exactly to 10.

Scaffolds:

- Split the second number visually: 5 becomes 2+3 when starting from 8.
- Use a 10-frame or two 5-frames.
- Slow the runner before bridge choices.

### 3. Getallenlijn Glijbaan

Purpose: rangorde and number line to 20.

Core mechanic: the dino slides along a number line. The child lands on missing
numbers, jumps forward/backward, or chooses between paths.

Challenge types:

- Find number position to 20.
- Number before/after.
- Missing number between two markers.
- Jump +1, +2, -1, -2.
- Order three numbers.
- Full tens 10 and 20.

### 4. Tientalhuis

Purpose: teen numbers and 10+ structure.

Core mechanic: a house has a full ten room and loose ones. Doors open when the
child builds a teen number as 10+n.

Examples:

- 13 is 10 and 3.
- 20 is two full tens.
- Choose the correct 10-frame plus extra ones.

### 5. Geldmarkt Tot 10

Purpose: money amounts to 10 euro.

Core mechanic: buy rescue supplies by composing exact amounts with local toy
coins and notes. Use generic euro-like symbols or simple numbered coins drawn
locally, not external assets.

Challenge types:

- Make exact amount.
- Choose enough/not enough.
- Count money up to 10.
- Compare prices.

### 6. Kloktoren

Purpose: day rhythm, hour, half-hour, analog/digital matching.

Core mechanic: rotate a clock tower hand to open the correct time portal.

Challenge types:

- Match analog hour to digital hour.
- Match half-hour.
- Yesterday/today/tomorrow event order.
- Morning/afternoon/evening picture sorting.

### 7. Meetwerf

Purpose: measurement and comparison.

Core mechanic: rebuild a construction yard by choosing the longer beam, heavier
crate, fuller bottle, or measuring with repeated natural units.

Challenge types:

- Longer/shorter/equal.
- Natural-unit measuring.
- Meter/kilogram/liter vocabulary.
- Choose fitting beam by length.

### 8. Vormenburcht and Negenveld

Purpose: geometry and spatial language.

Core mechanic: gates use shapes, positions, views, and symmetry to control
paths.

Challenge types:

- Recognize circle, triangle, square, rectangle.
- Count corners.
- Three/four/five/six-sided shapes.
- Left/right/diagonal in a 3x3 grid.
- Continue a pattern.
- Match shadow, mirror, top/front/side view.

### 9. Klankgrot

Purpose: phonemic awareness before or alongside letters.

Core mechanic: sound crystals pulse. The child rescues objects that start or
end with the sound.

Challenge types:

- Same beginning sound.
- Same ending sound.
- Hear a sound in a word.
- Rhyme pair.
- Oral blend: hear "m-aa-n", choose the moon/word/picture.
- Oral segment: hear "maan", choose m-aa-n boxes.

Implementation note: do not require the child to read all labels. Use voice,
icons, and optional text.

### 10. Zoemroute

Purpose: connected blending for early word reading.

Core mechanic: the child holds or swipes through sound stones in order. Stones
light up continuously, then merge into one word gate.

Challenge types:

- Blend two sounds: "ik", "is".
- Blend three sound units: "m-aa-n", "v-i-s".
- Choose the picture that matches the blended word.
- Later: blend and then choose the written word.

Scaffolds:

- On miss, replay the connected sound with slower animation.
- Keep digraphs as one tile, e.g. "aa" is one sound tile.
- Avoid hard time pressure until a word is stable.

### 11. Woordbouwplaats

Purpose: sound segmentation and spelling foundations.

Core mechanic: put letter/sound tiles into sound boxes to build a word that
repairs a sign, bridge, or rescue label.

Challenge types:

- Picture + spoken word -> arrange sound tiles.
- Spoken word -> choose missing first/middle/last sound.
- Written word -> split into sound boxes.
- Minimal pairs later: man/maan, vis/vos, boom/boot.

Misconceptions:

- first-sound-weak
- final-sound-weak
- vowel-length-weak
- digraph-split-wrong
- letter-reversal-confusion

### 12. Letterkompas

Purpose: letter-sound mapping.

Core mechanic: a compass points toward the sound. The child chooses the matching
letter rune or chooses an object with that sound.

Important: letter order must be data-driven and configurable. Do not hard-code
one commercial method as the only path. Provide a default order, but allow a
local list such as Kim/Zoem/school order to be used.

### 13. Luisterbos

Purpose: listening comprehension, vocabulary, and story sequencing.

Core mechanic: a short spoken story moves characters in the world. The child
answers by tapping pictures, ordering scenes, or choosing the next action.

Challenge types:

- Who/what/where questions.
- First/then/last.
- Vocabulary picture match.
- Cause/effect: "Why did the bridge open?"

### 14. Schrijfspoor

Purpose: optional handwriting support.

Core mechanic: trace large paths, patterns, digits, and letters with the dino.

Limitations:

- Device input varies, so do not grade harshly.
- Track completion, direction, and confidence rather than exact penmanship.
- Keep it optional and parent-visible.

### 15. Verkeerspad

Purpose: optional WO/verkeer for first grade.

Core mechanic: safe route choices through a neighborhood.

Topics:

- Signs.
- Traffic rules.
- Seeing and being seen.
- Passenger behavior.
- Blind spot.

This should be lower priority than literacy/math, but it fits the first-grade
world and can become a useful non-number break.

## Recommended Architecture Changes

The current `Skill`, `Representation`, `QuantityRange`, and `AttemptLog` types
are number-first. Do not encode letters as fake quantities. Add a generic
curriculum layer while keeping existing number modes working.

### New Folders

- `src/education/curriculum/`
- `src/education/math/`
- `src/education/literacy/`
- `src/education/measurement/`
- `src/education/geometry/`
- `src/gameplay/literacy/`
- `src/scenes/literacy/` if dedicated scenes are needed

### New Core Types

```ts
export type LearningDomain =
  | "math-number"
  | "math-operations"
  | "math-measurement"
  | "math-geometry"
  | "literacy-phonemic"
  | "literacy-reading"
  | "literacy-writing"
  | "listening-comprehension"
  | "world-traffic";

export type CurriculumSkill =
  | Skill
  | "numberLine20"
  | "teenNumber"
  | "addSub20"
  | "bridge10"
  | "money10"
  | "timeHourHalf"
  | "measureCompare"
  | "shapeRecognize"
  | "spatialPosition"
  | "patternContinue"
  | "soundDiscriminate"
  | "soundBlend"
  | "soundSegment"
  | "letterSound"
  | "wordRead"
  | "wordBuild"
  | "rhyme"
  | "vocabulary"
  | "listeningQuestion";

export interface LearningTarget {
  id: string;
  domain: LearningDomain;
  skill: CurriculumSkill;
  rangeKey: string;
  label: string;
}
```

### Attempt Logging

Current numeric attempts should remain valid. Add optional generic fields:

```ts
interface AttemptLog {
  domain?: LearningDomain;
  targetKey?: string;
  rangeKey?: string;
  stimulusKey?: string;
  responseKey?: string;
}
```

Then update `MasteryTracker` to group by `rangeKey ?? quantityRange` and
`targetKey ?? String(quantity)`. This lets the dashboard show both "quantity 7"
and "letter/sound aa" without hacks.

### Content Data

Add local data files:

- `src/education/literacy/graphemes.ts`
  - single letters and digraphs as sound units
  - examples: m, s, v, p, n, r, t, k, aa, ee, oo, oe, ie, ui, eu, ij, ei, ou,
    au, ng, ch
- `src/education/literacy/decodableWords.ts`
  - id, word, soundUnits, pictureKey, difficulty, introducedAfter
  - include only clear, age-appropriate Dutch words
  - keep school-method order configurable
- `src/education/math/splits.ts`
  - all split facts 0..n
  - missing-part variants
  - reversal-pair metadata
- `src/education/math/math20.ts`
  - number line positions 0..20
  - ten-plus-one structures
  - bridge-over-10 decompositions
- `src/education/measurement/timeMoney.ts`
  - clock faces, hour/half-hour, toy money combinations
- `src/education/geometry/shapes.ts`
  - shape vocabulary, corners, grids, mirror/shadow/view tasks

## Progression Proposal

### Phase A: Stable 1-10 plus early sounds

- Current game remains default path.
- Add Splitbord Builder with all splits 0..10.
- Add Klankgrot: beginning sound, ending sound, oral blend.
- Add Letterkompas for a small configurable starter set.
- Dashboard gets a domain selector: Getallen / Lezen / Meten-vormen.

### Phase B: Words and number line

- Add Zoemroute and Woordbouwplaats for simple sound-unit words.
- Add Getallenlijn Glijbaan to 20.
- Add Tientalhuis for 10+n.
- Journey map interleaves number and reading nodes.

### Phase C: Operations to 20 and fluency

- Add Tienbrug Run.
- Add plus/minus facts to 20.
- Add adaptive timed fluency for splits and high-confidence word blending.
- Parent dashboard shows split automation and reading fluency separately.

### Phase D: Measurement, geometry, money, time

- Add Meetwerf, Geldmarkt, Kloktoren, Vormenburcht.
- Use these as lower-pressure rescue/build worlds between heavier reading and
  arithmetic nodes.

### Phase E: Optional WO/verkeer

- Add Verkeerspad after core literacy/math is solid.
- Keep it picture/audio heavy and not a blocker for main progression.

## Journey Integration

Do not dump all new modes into a menu. Extend `src/data/journey.ts` so the story
map becomes a curriculum spiral:

1. Count / one more / Klankgrot
2. Match / Splitbord / Letterkompas
3. Runner gate / Zoemroute / friend
4. Getallenlijn / Woordbouwplaats / boss
5. Tientalhuis / Luisterbos / Tienbrug
6. Measurement/geometry worlds as rescue side paths

Keep one active frontier node. Avoid exposing a long list of modes to the
child-facing menu.

## Parent Dashboard Additions

Add these panels:

- Number structures: existing.
- Splits: total, known pairs, automated pairs, weak pairs, median response time.
- Number line/20: numbers 0-20, teen structure, bridge-over-10 readiness.
- Reading:
  - sound awareness
  - letter-sound mapping
  - blending
  - segmentation
  - word reading
  - word building
- Measurement/geometry:
  - money/time/measure/shape/spatial.
- Misconceptions:
  - number: existing plus split-specific
  - reading: first sound weak, final sound weak, vowel length weak, digraph split
    wrong, letter reversal confusion, guessing from first letter only.

## Acceptance Criteria for New Work

For every new mode:

- The learning structure controls movement, building, rescue, route, or reward.
- There is no text-only task for early readers.
- Voice/audio support exists and can be muted.
- Wrong choices produce scaffolds, not failure loops.
- Attempts log domain, skill, representation, range/target, correctness,
  reaction time, hint state, and error type.
- AdaptiveEngine can pick the mode based on weak skills.
- Parent dashboard shows real saved data.
- Runtime assets are local and documented.
- Tests cover challenge generation, logging, mastery grouping, scene launch, safe
  wrong answer, and adaptive selection.
- Mobile viewport QA covers at least one scenario per new live mode.

## Implementation Priority for Claude

1. Add curriculum type scaffolding without breaking existing number tests.
2. Implement `Splitbord Builder` first because it directly answers the
   rekenbordje question and strengthens existing math architecture.
3. Implement literacy data and `Klankgrot` second.
4. Implement `Zoemroute` and `Woordbouwplaats` third.
5. Add number-line/20 modes.
6. Add measurement/geometry/time/money modes.
7. Only then add optional WO/verkeer.

## Non-Goals

- Do not clone or redistribute a commercial reading method.
- Do not depend on runtime CDNs, paid APIs, or external media.
- Do not turn reading into small-font worksheets.
- Do not make wrong answers remove progress or end the game.
- Do not declare the expansion complete until the new modes are covered by
  tests, persistence, adaptive selection, dashboard evidence, and viewport QA.
