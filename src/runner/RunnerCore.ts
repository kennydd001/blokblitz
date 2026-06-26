// RunnerCore — the pure, render-free simulation of the endless-style voxel run.
//
// It owns lanes, the forward scroll, coin/obstacle/number-gate placement, the
// jump, collisions, combo and scoring, and the "no game over" safe-stumble rule.
// It knows nothing about Three.js or the DOM, so it is fully unit-testable, and
// the number content is injected through a GateProvider (the scene wires that to
// the adaptive education engine).

export type RunnerInput = "left" | "right" | "jump";

export const LANE_COUNT = 3;
/** World-space x distance between lane centres. */
export const LANE_WIDTH = 2.1;
/** How far ahead (world units) an item is when it pops into view. */
export const SPAWN_AHEAD = 64;
/** How far behind the hero an item travels before it is recycled. */
export const DESPAWN_BEHIND = 8;

export interface GateLaneSpec {
  quantity: number;
  correct: boolean;
  numeral: string;
  /** Physical lane (0..2) this choice sits in. Defaults to the array index. */
  lane?: number;
  /** Index into the education Challenge's options, for attempt logging. */
  optionIndex?: number;
}

export interface GateSpec {
  id: string;
  lanes: GateLaneSpec[];
  correctLane: number;
  targetText: string;
  skill: string;
  /** Which getalbeeld the lane quantities are drawn in (dice, beads, tenframe...). */
  representation?: string;
  /** Opaque payload the scene uses to log the attempt (the education Challenge). */
  meta?: unknown;
}

export interface GateProvider {
  /** Produce the next number gate. Called once per gate while building the run plan. */
  next(roundIndex: number): GateSpec;
}

export type EntityKind = "coin" | "obstacle" | "gate" | "finish" | "swing" | "build";

interface TrackItem {
  id: number;
  kind: EntityKind;
  /** Absolute track distance (world units) at which this item reaches the hero. */
  at: number;
  lane: number;
  gate?: GateSpec;
  processed: boolean;
  collected: boolean;
  resolved: boolean;
  correctResolved: boolean;
  startedAt: number;
}

export interface EntityView {
  id: number;
  kind: EntityKind;
  z: number;
  lane: number;
  gate?: GateSpec;
  collected: boolean;
  resolved: boolean;
  correctResolved: boolean;
}

export type RunnerEvent =
  | { type: "coin"; lane: number; combo: number }
  | { type: "gate"; gate: GateSpec; chosenLane: number; chosenOptionIndex?: number; correct: boolean; reactionMs: number; combo: number }
  | { type: "obstacle-cleared"; lane: number }
  | { type: "stumble"; lane: number }
  | { type: "boost"; combo: number }
  | { type: "swing" }
  | { type: "build"; blocks: number }
  | { type: "finished"; summary: RunSummary };

export interface RunSummary {
  distanceMeters: number;
  coins: number;
  runStars: number;
  bonusStars: number;
  gatesCorrect: number;
  gatesTotal: number;
  bestCombo: number;
  perfect: boolean;
}

export interface RunnerSnapshot {
  state: "running" | "finished";
  laneTarget: number;
  laneX: number;
  airborne: boolean;
  jumpHeight: number;
  speed: number;
  speedRatio: number;
  distanceMeters: number;
  coins: number;
  runStars: number;
  bonusStars: number;
  combo: number;
  bestCombo: number;
  gatesCorrect: number;
  gatesResolved: number;
  gatesTotal: number;
  entities: EntityView[];
  target?: GateSpec;
}

export interface RunnerMechanics {
  obstacleChance: number;
  swingRounds: number[];
  build: boolean;
  coinDensity: number;
}

export interface RunnerOptions {
  provider: GateProvider;
  gatesTotal?: number;
  rng?: () => number;
  /** Global pace multiplier (the parent Settings speed). 1 = normal. */
  speedScale?: number;
  /** Per-world mechanic mix (coins, swings, obstacles, build moment). */
  mechanics?: Partial<RunnerMechanics>;
}

const METERS_PER_UNIT = 0.6;
const JUMP_DURATION = 0.62;
const START_SPEED = 10;
const MAX_SPEED = 19;
const LANE_LERP = 13; // higher = snappier lane changes
// How far ahead (world units) a gate starts pulling the run into slow-motion so
// the child has time to read the two numbers and commit to a lane.
const GATE_SLOWMO_RANGE = 19;

export class RunnerCore {
  state: "running" | "finished" = "running";

  private readonly provider: GateProvider;
  private readonly gatesTotal: number;
  private readonly rng: () => number;
  private readonly minSpeed: number;
  private readonly maxSpeed: number;
  private readonly mechanics: RunnerMechanics;

  private items: TrackItem[] = [];
  private nextId = 1;

  private traveled = 0;
  private distanceMeters = 0;
  private speed: number;

  private laneTarget = 1;
  private laneX = 1;
  private jumpTimer = 0;

  private coins = 0;
  private runStars = 0;
  private bonusStars = 0;
  private combo = 0;
  private bestCombo = 0;
  private gatesCorrect = 0;
  private gatesResolved = 0;

  private events: RunnerEvent[] = [];
  private finishedEmitted = false;
  private clock = 0;

  constructor(options: RunnerOptions) {
    this.provider = options.provider;
    this.gatesTotal = Math.max(1, options.gatesTotal ?? 7);
    this.rng = options.rng ?? Math.random;
    const scale = Math.max(0.5, Math.min(1.8, options.speedScale ?? 1));
    this.minSpeed = START_SPEED * scale;
    this.maxSpeed = MAX_SPEED * scale;
    this.speed = this.minSpeed;
    this.mechanics = {
      obstacleChance: options.mechanics?.obstacleChance ?? 0.45,
      swingRounds: options.mechanics?.swingRounds ?? [],
      build: options.mechanics?.build ?? true,
      coinDensity: options.mechanics?.coinDensity ?? 1
    };
    this.buildPlan();
  }

  private randomLane(): number {
    return Math.floor(this.rng() * LANE_COUNT) % LANE_COUNT;
  }

  private push(kind: EntityKind, at: number, lane: number, gate?: GateSpec): void {
    this.items.push({
      id: this.nextId++,
      kind,
      at,
      lane,
      gate,
      processed: false,
      collected: false,
      resolved: false,
      correctResolved: false,
      startedAt: 0
    });
  }

  private buildPlan(): void {
    // A gentle warm-up, then repeating "coin run -> maybe a jump -> number gate"
    // rounds so the rhythm feels designed rather than random.
    let at = 22;
    for (let round = 0; round < this.gatesTotal; round += 1) {
      const coinLane = this.randomLane();
      const coinCount = Math.round((4 + Math.floor(this.rng() * 3)) * this.mechanics.coinDensity);
      for (let c = 0; c < coinCount; c += 1) {
        this.push("coin", at, coinLane);
        at += 2.4;
      }
      at += 4;
      // A web-swing interlude (Spiderman vibe) on the rounds this world asks for.
      if (this.mechanics.swingRounds.includes(round)) {
        this.push("swing", at, 1);
        at += 9;
      }
      if (round > 0 && this.rng() < this.mechanics.obstacleChance) {
        // a jumpable barrier; the child can hop it or swerve around it.
        this.push("obstacle", at, this.randomLane());
        at += 6;
      }
      const gate = this.provider.next(round);
      this.push("gate", at, 0, gate);
      at += 13 + round * 0.8; // a little more breathing room is fine; speed rises too
    }
    // A build moment (Minecraft vibe): collected blocks snap into a tower.
    if (this.mechanics.build) {
      this.push("build", at, 1);
      at += 10;
    }
    // Victory lap: a fan of coins then the finish line.
    for (let c = 0; c < 7; c += 1) {
      this.push("coin", at, 1);
      at += 2.2;
    }
    at += 6;
    this.push("finish", at, 1);
  }

  input(action: RunnerInput): void {
    if (this.state !== "running") return;
    if (action === "left") this.laneTarget = Math.max(0, this.laneTarget - 1);
    else if (action === "right") this.laneTarget = Math.min(LANE_COUNT - 1, this.laneTarget + 1);
    else if (action === "jump" && this.jumpTimer <= 0) this.jumpTimer = JUMP_DURATION;
  }

  get jumping(): boolean {
    return this.jumpTimer > 0;
  }

  update(dt: number): void {
    if (this.state !== "running") return;
    this.clock += dt;

    // Speed eases up over the run for that "getting faster" rush...
    const progress = Math.min(1, this.gatesResolved / this.gatesTotal);
    // ...but eases DOWN into slow-motion as a number gate approaches, so a 5yo
    // has time to read the two numbers and pick a lane (down to ~58% as it nears).
    const gateDist = this.nearestGateDistance();
    const slow = gateDist < GATE_SLOWMO_RANGE ? 0.58 + 0.42 * (gateDist / GATE_SLOWMO_RANGE) : 1;
    const targetSpeed = (this.minSpeed + (this.maxSpeed - this.minSpeed) * progress + this.combo * 0.35) * slow;
    this.speed += (Math.min(this.maxSpeed, targetSpeed) - this.speed) * Math.min(1, dt * (slow < 1 ? 3 : 1.5));

    this.traveled += this.speed * dt;
    this.distanceMeters += this.speed * dt * METERS_PER_UNIT;

    // Smooth lane glide + jump arc.
    this.laneX += (this.laneTarget - this.laneX) * Math.min(1, dt * LANE_LERP);
    if (this.jumpTimer > 0) this.jumpTimer = Math.max(0, this.jumpTimer - dt);

    for (const item of this.items) {
      if (item.processed) continue;
      const z = this.traveled - item.at;
      // Stamp a gate's "shown" time as it comes into view, for reaction logging.
      if (item.kind === "gate" && item.startedAt === 0 && z >= -SPAWN_AHEAD) {
        item.startedAt = this.clock;
      }
      if (z >= 0) this.resolveItem(item);
    }

    if (!this.finishedEmitted && this.gatesResolved >= this.gatesTotal) {
      const finish = this.items.find((item) => item.kind === "finish");
      if (finish && this.traveled >= finish.at) this.finish();
    }
  }

  private resolveItem(item: TrackItem): void {
    item.processed = true;
    const heroLane = this.laneTarget;
    if (item.kind === "coin") {
      if (item.lane === heroLane) {
        item.collected = true;
        this.coins += 1;
        this.events.push({ type: "coin", lane: item.lane, combo: this.combo });
      }
      return;
    }
    if (item.kind === "obstacle") {
      if (item.lane === heroLane && !this.jumping) {
        // Safe stumble: lose a couple of collected coins and a touch of speed. Never fatal.
        this.coins = Math.max(0, this.coins - 2);
        this.speed = Math.max(this.minSpeed * 0.7, this.speed - 5);
        this.combo = 0;
        this.events.push({ type: "stumble", lane: item.lane });
      } else if (item.lane === heroLane) {
        this.events.push({ type: "obstacle-cleared", lane: item.lane });
      }
      return;
    }
    if (item.kind === "gate" && item.gate) {
      item.resolved = true;
      const entry = item.gate.lanes.find((lane, i) => (lane.lane ?? i) === heroLane);
      const correct = heroLane === item.gate.correctLane;
      item.correctResolved = correct;
      this.gatesResolved += 1;
      if (correct) {
        this.gatesCorrect += 1;
        this.runStars += 1;
        this.combo += 1;
        this.bestCombo = Math.max(this.bestCombo, this.combo);
        this.speed = Math.min(this.maxSpeed, this.speed + 2.2);
        if (this.combo > 0 && this.combo % 3 === 0) {
          this.bonusStars += 1;
          this.events.push({ type: "boost", combo: this.combo });
        }
      } else {
        this.combo = 0;
        this.speed = Math.max(this.minSpeed * 0.8, this.speed - 2.5);
      }
      const reactionMs = Math.max(150, (this.clock - item.startedAt) * 1000);
      this.events.push({
        type: "gate",
        gate: item.gate,
        chosenLane: heroLane,
        chosenOptionIndex: entry?.optionIndex,
        correct,
        reactionMs,
        combo: this.combo
      });
      return;
    }
    if (item.kind === "swing") {
      // A free web-zip: a burst of coins and a speed boost.
      this.coins += 3;
      this.speed = Math.min(this.maxSpeed, this.speed + 3);
      this.events.push({ type: "swing" });
      return;
    }
    if (item.kind === "build") {
      this.bonusStars += 1;
      this.events.push({ type: "build", blocks: this.coins });
    }
  }

  private finish(): void {
    this.finishedEmitted = true;
    this.state = "finished";
    this.events.push({ type: "finished", summary: this.summary() });
  }

  summary(): RunSummary {
    return {
      distanceMeters: Math.round(this.distanceMeters),
      coins: this.coins,
      runStars: this.runStars,
      bonusStars: this.bonusStars,
      gatesCorrect: this.gatesCorrect,
      gatesTotal: this.gatesTotal,
      bestCombo: this.bestCombo,
      perfect: this.gatesCorrect === this.gatesTotal
    };
  }

  /** Pull and clear the events accumulated since the last drain. */
  drainEvents(): RunnerEvent[] {
    const out = this.events;
    this.events = [];
    return out;
  }

  /** Distance (world units) to the nearest unresolved gate ahead, or Infinity. */
  private nearestGateDistance(): number {
    let best = Infinity;
    for (const item of this.items) {
      if (item.kind !== "gate" || item.resolved || item.processed) continue;
      const d = item.at - this.traveled;
      if (d >= -0.5 && d < best) best = d;
    }
    return best;
  }

  private currentTarget(): GateSpec | undefined {
    // The nearest unresolved gate ahead of (or at) the hero.
    let best: TrackItem | undefined;
    for (const item of this.items) {
      if (item.kind !== "gate" || item.resolved) continue;
      if (!best || item.at < best.at) best = item;
    }
    return best?.gate;
  }

  snapshot(): RunnerSnapshot {
    const entities: EntityView[] = [];
    for (const item of this.items) {
      const z = this.traveled - item.at;
      if (z < -SPAWN_AHEAD - 2 || z > DESPAWN_BEHIND) continue;
      if (item.kind === "coin" && item.collected) continue;
      entities.push({
        id: item.id,
        kind: item.kind,
        z,
        lane: item.lane,
        gate: item.gate,
        collected: item.collected,
        resolved: item.resolved,
        correctResolved: item.correctResolved
      });
    }
    const jumpHeight = this.jumpTimer > 0 ? Math.sin(Math.PI * (1 - this.jumpTimer / JUMP_DURATION)) : 0;
    return {
      state: this.state,
      laneTarget: this.laneTarget,
      laneX: this.laneX,
      airborne: this.jumpTimer > 0,
      jumpHeight,
      speed: this.speed,
      speedRatio: (this.speed - this.minSpeed) / Math.max(0.001, this.maxSpeed - this.minSpeed),
      distanceMeters: this.distanceMeters,
      coins: this.coins,
      runStars: this.runStars,
      bonusStars: this.bonusStars,
      combo: this.combo,
      bestCombo: this.bestCombo,
      gatesCorrect: this.gatesCorrect,
      gatesResolved: this.gatesResolved,
      gatesTotal: this.gatesTotal,
      entities,
      target: this.currentTarget()
    };
  }
}

/** World-space x for a lane index. Lane 1 (middle) is centred at x=0. */
export function laneToX(lane: number): number {
  return (lane - (LANE_COUNT - 1) / 2) * LANE_WIDTH;
}
