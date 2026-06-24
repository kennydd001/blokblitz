// RunnerView — the Three.js voxel rendering for the runner. It reads RunnerCore
// snapshots and draws a scrolling Minecraft-style world: an animated blocky hero,
// number gates whose quantities are shown as canonical cube patterns, coins,
// jumpable barriers, particle bursts, speed lines, screen shake and a chase cam.

import * as THREE from "three";
import { buildVoxelNumber } from "./voxelNumber";
import {
  DESPAWN_BEHIND,
  LANE_COUNT,
  LANE_WIDTH,
  SPAWN_AHEAD,
  laneToX,
  type EntityView,
  type RunnerEvent,
  type RunnerSnapshot
} from "./RunnerCore";
import type { HeroSkin } from "./skins";
import type { PropStyle, WorldPalette } from "./worlds";

const DEFAULT_PALETTE: WorldPalette = {
  sky: 0x8fd6ff,
  fog: 0x8fd6ff,
  ground: 0x6cc36a,
  stripeLight: 0x86e08a,
  stripeDark: 0x5bb262,
  rail: 0xffffff,
  curb: 0xf6c453,
  props: [0x2f9e54, 0x39b06a, 0x7bd389],
  propStyle: "tree"
};

interface EntityHandle {
  group: THREE.Group;
  kind: string;
}

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  spin: number;
}

const CUBE = new THREE.BoxGeometry(1, 1, 1);
const GEM = new THREE.OctahedronGeometry(0.5, 0);
const TRACK_WIDTH = LANE_WIDTH * LANE_COUNT;

function lightenColor(color: number, amount: number): number {
  const mix = (channel: number): number => Math.max(0, Math.min(255, Math.round(channel + (255 - channel) * amount)));
  return (mix((color >> 16) & 255) << 16) | (mix((color >> 8) & 255) << 8) | mix(color & 255);
}

// A soft vertical gradient sky (real browsers only); falls back to a flat colour in tests.
function gradientSky(top: number, bottom: number): THREE.Texture | null {
  if (typeof document === "undefined" || !THREE.CanvasTexture) return null;
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, `#${top.toString(16).padStart(6, "0")}`);
  grad.addColorStop(1, `#${bottom.toString(16).padStart(6, "0")}`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 4, 256);
  return new THREE.CanvasTexture(canvas);
}

const LANE_VISUALS = [
  { name: "blue-triangle", primary: 0x1687ff, dark: 0x0a3e87, accent: 0xbfe8ff },
  { name: "gold-square", primary: 0xffc928, dark: 0x8c5a00, accent: 0xfff1a6 },
  { name: "pink-diamond", primary: 0xff5fb8, dark: 0x8a1b56, accent: 0xffc8e5 }
] as const;

// Materials are cached and reused across every run, so building a new world per
// run no longer leaks MeshStandardMaterials (world.clear just detaches them).
const matCache = new Map<string, THREE.MeshStandardMaterial>();
function mat(color: number, options: { emissive?: number; intensity?: number; rough?: number } = {}): THREE.MeshStandardMaterial {
  const emissive = options.emissive ?? color;
  const intensity = options.intensity ?? 0.06;
  const rough = options.rough ?? 0.55;
  const key = `${color}|${emissive}|${intensity}|${rough}`;
  let material = matCache.get(key);
  if (!material) {
    material = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0, emissive, emissiveIntensity: intensity });
    matCache.set(key, material);
  }
  return material;
}

function block(x: number, y: number, z: number, sx: number, sy: number, sz: number, material: THREE.MeshStandardMaterial): THREE.Mesh {
  const mesh = new THREE.Mesh(CUBE, material);
  mesh.position.set(x, y, z);
  mesh.scale.set(sx, sy, sz);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function tag<T extends THREE.Object3D>(object: T, role: string, data: Record<string, unknown> = {}): T {
  object.userData = { ...object.userData, blokblitzRole: role, ...data };
  return object;
}

interface RenderableGate {
  id?: string;
  correctLane?: number;
  lanes: Array<{ quantity: number; correct?: boolean }>;
  representation?: string;
}

export class RunnerView {
  private root = new THREE.Group();
  private ground = new THREE.Group();
  private scenery = new THREE.Group();
  private hero = new THREE.Group();
  private gatePreview = new THREE.Group();
  private heroParts: Record<string, THREE.Mesh> = {};
  private entities = new Map<number, EntityHandle>();
  private particles: Particle[] = [];
  private particleMaterials = new Map<number, THREE.MeshStandardMaterial>();

  private stripes: THREE.Mesh[] = [];
  private props: THREE.Object3D[] = [];

  private scroll = 0;
  private elapsed = 0;
  private shake = 0;
  private fovPunch = 0;
  private heroSquash = 0;
  private swingTimer = 0;
  private cameraX = 0;
  private skin: HeroSkin;
  private palette: WorldPalette;
  private lastPreviewGateId = "";

  private readonly range = SPAWN_AHEAD + DESPAWN_BEHIND;

  constructor(
    private readonly world: THREE.Scene,
    private readonly camera: THREE.PerspectiveCamera,
    skin: HeroSkin,
    palette: WorldPalette = DEFAULT_PALETTE
  ) {
    this.skin = skin;
    this.palette = palette;
  }

  build(): void {
    this.world.clear();
    this.entities.clear();
    this.particles = [];
    this.stripes = [];
    this.props = [];
    this.root = new THREE.Group();
    this.ground = new THREE.Group();
    this.scenery = new THREE.Group();
    this.gatePreview = tag(new THREE.Group(), "runner-gate-preview");
    this.lastPreviewGateId = "";

    const sky = gradientSky(lightenColor(this.palette.sky, 0.55), this.palette.sky);
    this.world.background = sky ?? new THREE.Color(this.palette.sky);
    this.world.fog = new THREE.Fog(this.palette.fog, 28, 64);

    // Warm key light + a soft cool fill for a richer, friendlier look.
    const hemi = new THREE.HemisphereLight(lightenColor(this.palette.sky, 0.3), this.palette.ground, 1.7);
    this.world.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff0d0, 2.0);
    sun.position.set(5, 10, 6);
    sun.castShadow = true;
    this.world.add(sun);
    const fill = new THREE.DirectionalLight(0x9fc0ff, 0.5);
    fill.position.set(-6, 5, -4);
    this.world.add(fill);

    // A glowing sun disc + faded distant hills for depth.
    const sunDisc = block(7.5, 12.5, -36, 5, 5, 0.4, mat(0xfff3b0, { emissive: 0xfff3b0, intensity: 0.95, rough: 0.3 }));
    this.world.add(sunDisc);
    const hillMat = mat(lightenColor(this.palette.ground, -0.18), { rough: 0.95, intensity: 0.02 });
    for (let i = 0; i < 5; i += 1) {
      const hill = block((i - 2) * 9.5, 1.2, -54 - (i % 2) * 3, 9, 6.5, 4, hillMat);
      this.world.add(hill);
    }

    this.buildGround();
    this.buildScenery();
    this.buildHero();

    this.root.add(this.ground, this.scenery, this.gatePreview, this.hero);
    this.world.add(this.root);
    this.camera.position.set(0, 3.5, 6.6);
    this.camera.lookAt(0, 1, -6);
    this.cameraX = 0;
  }

  setSkin(skin: HeroSkin): void {
    this.skin = skin;
  }

  private buildGround(): void {
    const trackMat = mat(this.palette.ground, { rough: 0.9, intensity: 0.02 });
    const base = block(0, -0.5, -(SPAWN_AHEAD - DESPAWN_BEHIND) / 2, TRACK_WIDTH + 3.4, 1, this.range + 8, trackMat);
    this.ground.add(base);

    // Bright running stripes streaming toward the camera for a strong speed read.
    const lightMat = mat(this.palette.stripeLight, { rough: 0.85, intensity: 0.04 });
    const darkMat = mat(this.palette.stripeDark, { rough: 0.9, intensity: 0.02 });
    const STRIPE = 4;
    const count = Math.ceil(this.range / STRIPE) + 2;
    for (let i = 0; i < count; i += 1) {
      const stripe = block(0, 0.01, 0, TRACK_WIDTH + 2.6, 0.06, 2, i % 2 === 0 ? lightMat : darkMat);
      stripe.userData.baseZ = i * STRIPE;
      this.ground.add(stripe);
      this.stripes.push(stripe);
    }

    // Lane divider rails so the three lanes read clearly.
    const railMat = mat(this.palette.rail, { intensity: 0.12, rough: 0.5 });
    [-0.5, 0.5].forEach((side) => {
      const rail = block(side * 2.1, 0.05, -(SPAWN_AHEAD - DESPAWN_BEHIND) / 2, 0.08, 0.08, this.range, railMat);
      this.ground.add(rail);
    });
    // Side curbs.
    const curbMat = mat(this.palette.curb, { intensity: 0.08 });
    [-1, 1].forEach((side) => {
      const curb = block(side * (TRACK_WIDTH / 2 + 0.6), 0.18, -(SPAWN_AHEAD - DESPAWN_BEHIND) / 2, 0.5, 0.5, this.range, curbMat);
      this.ground.add(curb);
    });
  }

  private buildScenery(): void {
    // Roadside props in this world's style, recycled toward the camera.
    const colors = this.palette.props;
    const SPACING = 7;
    const count = Math.ceil(this.range / SPACING) + 2;
    for (let i = 0; i < count; i += 1) {
      [-1, 1].forEach((side) => {
        const prop = this.buildProp(colors[(i + (side > 0 ? 1 : 0)) % colors.length], this.palette.propStyle);
        const x = side * (TRACK_WIDTH / 2 + 1.8 + (i % 3) * 0.9);
        prop.position.set(x, 0, 0);
        prop.userData.baseZ = i * SPACING + (side > 0 ? SPACING / 2 : 0);
        prop.userData.x = x;
        this.scenery.add(prop);
        this.props.push(prop);
      });
    }
    // Floating voxel clouds (or stars in space).
    const space = this.palette.propStyle === "star";
    const cloudMat = mat(space ? 0xfff7d6 : 0xffffff, { intensity: space ? 0.4 : 0.05, rough: 0.7 });
    for (let i = 0; i < 5; i += 1) {
      const cloud = new THREE.Group();
      if (space) {
        cloud.add(block(0, 0, 0, 0.5, 0.5, 0.5, cloudMat));
      } else {
        for (let p = 0; p < 3; p += 1) cloud.add(block((p - 1) * 0.9, (p % 2) * 0.3, 0, 1.4, 0.8, 1.2, cloudMat));
      }
      cloud.position.set((i % 2 === 0 ? -1 : 1) * (5 + i), 5 + (i % 2), 0);
      cloud.userData.baseZ = i * 14;
      cloud.userData.x = cloud.position.x;
      this.scenery.add(cloud);
      this.props.push(cloud);
    }
  }

  private buildProp(color: number, style: PropStyle): THREE.Group {
    const group = new THREE.Group();
    if (style === "crystal") {
      group.add(block(0, 0.9, 0, 0.7, 1.8, 0.7, mat(color, { intensity: 0.24, rough: 0.3 })));
      group.add(block(0, 2, 0, 0.4, 0.8, 0.4, mat(color, { intensity: 0.32, rough: 0.3 })));
    } else if (style === "ice") {
      group.add(block(0, 0.9, 0, 0.6, 1.8, 0.6, mat(color, { intensity: 0.18, rough: 0.2 })));
      group.add(block(0, 2.1, 0, 0.34, 1.0, 0.34, mat(0xffffff, { intensity: 0.3, rough: 0.2 })));
    } else if (style === "mushroom") {
      group.add(block(0, 0.7, 0, 0.5, 1.4, 0.5, mat(0xf2ead2, { intensity: 0.03 })));
      group.add(block(0, 1.8, 0, 1.8, 0.7, 1.8, mat(color, { intensity: 0.08 })));
      group.add(block(0.4, 2.0, 0.4, 0.3, 0.2, 0.3, mat(0xffffff, { intensity: 0.1 })));
      group.add(block(-0.4, 2.0, -0.2, 0.3, 0.2, 0.3, mat(0xffffff, { intensity: 0.1 })));
    } else if (style === "cactus") {
      group.add(block(0, 1.0, 0, 0.6, 2.0, 0.6, mat(color, { intensity: 0.05 })));
      group.add(block(0.5, 1.3, 0, 0.5, 0.5, 0.5, mat(color, { intensity: 0.05 })));
      group.add(block(0.5, 1.7, 0, 0.4, 0.8, 0.4, mat(color, { intensity: 0.05 })));
    } else if (style === "star") {
      group.add(block(0, 1.4, 0, 0.16, 2.8, 0.16, mat(0x4a4070, { intensity: 0.05 })));
      group.add(block(0, 3.0, 0, 0.7, 0.7, 0.7, mat(color, { emissive: color, intensity: 0.6, rough: 0.3 })));
    } else {
      group.add(block(0, 0.6, 0, 0.5, 1.2, 0.5, mat(0x8a5a3c, { intensity: 0.03 })));
      group.add(block(0, 1.7, 0, 1.6, 1.6, 1.6, mat(color, { intensity: 0.05 })));
      group.add(block(0, 2.7, 0, 1.0, 1.0, 1.0, mat(color, { intensity: 0.05 })));
    }
    return group;
  }

  private buildHero(): void {
    this.hero = new THREE.Group();
    this.heroParts = {};
    const c = this.skin.colors;
    const bodyMat = mat(c.body, { intensity: 0.08 });
    const bellyMat = mat(c.belly, { intensity: 0.05 });
    const accentMat = mat(c.accent, { intensity: 0.14, rough: 0.4 });
    const inkMat = mat(0x141b2e, { intensity: 0, rough: 0.4 });

    const add = (name: string, mesh: THREE.Mesh): void => {
      this.heroParts[name] = mesh;
      this.hero.add(mesh);
    };

    add("body", block(0, 0.74, 0, 0.78, 0.62, 0.86, bodyMat));
    add("belly", block(0, 0.66, -0.42, 0.46, 0.4, 0.12, bellyMat));
    add("head", block(0.0, 1.18, -0.34, 0.5, 0.46, 0.5, bodyMat));
    add("snout", block(0, 1.1, -0.62, 0.32, 0.22, 0.26, bellyMat));
    add("eyeL", block(-0.14, 1.26, -0.58, 0.08, 0.1, 0.06, inkMat));
    add("eyeR", block(0.14, 1.26, -0.58, 0.08, 0.1, 0.06, inkMat));
    add("tail", block(0, 0.72, 0.5, 0.3, 0.3, 0.5, bodyMat));
    add("legL", block(-0.22, 0.28, -0.05, 0.22, 0.5, 0.26, bellyMat));
    add("legR", block(0.22, 0.28, -0.05, 0.22, 0.5, 0.26, bellyMat));
    add("bootL", block(-0.22, 0.06, -0.12, 0.28, 0.16, 0.34, accentMat));
    add("bootR", block(0.22, 0.06, -0.12, 0.28, 0.16, 0.34, accentMat));
    add("scarf", block(0, 0.96, 0.18, 0.6, 0.16, 0.2, accentMat));
    [-0.18, 0.02, 0.22].forEach((sx, i) => add(`spike${i}`, block(sx, 1.02 - i * 0.04, 0.18, 0.16, 0.22, 0.16, accentMat)));
    this.hero.position.set(0, 0, 0);
  }

  // ---- per-frame ------------------------------------------------------------

  sync(snapshot: RunnerSnapshot, dt: number): void {
    this.elapsed += dt;
    this.scroll += snapshot.speed * dt;
    this.updateGround();
    this.reconcileEntities(snapshot.entities);
    this.updateEntities(snapshot);
    this.updateGatePreview(snapshot.target, snapshot.laneTarget);
    this.updateHero(snapshot, dt);
    this.updateCamera(snapshot, dt);
    this.updateParticles(dt);
  }

  private wrapZ(baseZ: number): number {
    // Map a base offset + scroll into the visible band, moving toward the camera.
    let z = -SPAWN_AHEAD + (((baseZ + this.scroll) % this.range) + this.range) % this.range;
    if (z > DESPAWN_BEHIND) z -= this.range;
    return z;
  }

  private updateGround(): void {
    for (const stripe of this.stripes) stripe.position.z = this.wrapZ(stripe.userData.baseZ as number);
    for (const prop of this.props) {
      prop.position.z = this.wrapZ(prop.userData.baseZ as number);
      prop.position.x = prop.userData.x as number;
    }
  }

  private reconcileEntities(views: EntityView[]): void {
    const seen = new Set<number>();
    for (const view of views) {
      seen.add(view.id);
      if (!this.entities.has(view.id)) this.spawnEntity(view);
    }
    for (const [id, handle] of this.entities) {
      if (!seen.has(id)) {
        this.root.remove(handle.group);
        this.entities.delete(id);
      }
    }
  }

  private spawnEntity(view: EntityView): void {
    let group: THREE.Group;
    if (view.kind === "coin") group = this.buildCoin();
    else if (view.kind === "obstacle") group = this.buildObstacle();
    else if (view.kind === "gate" && view.gate) group = this.buildGate(view.gate);
    else if (view.kind === "swing") group = this.buildSwing();
    else if (view.kind === "build") group = this.buildBuildHouse();
    else group = this.buildFinish();
    this.root.add(group);
    this.entities.set(view.id, { group, kind: view.kind });
  }

  private updateEntities(snapshot: RunnerSnapshot): void {
    for (const view of snapshot.entities) {
      const handle = this.entities.get(view.id);
      if (!handle) continue;
      const g = handle.group;
      if (view.kind === "coin") {
        g.position.set(laneToX(view.lane), 0.8 + Math.sin(this.elapsed * 4 + view.id) * 0.12, view.z);
        g.rotation.y = this.elapsed * 3 + view.id;
      } else if (view.kind === "obstacle") {
        g.position.set(laneToX(view.lane), 0, view.z);
      } else if (view.kind === "gate") {
        g.position.set(0, 0, view.z);
        this.updateGateFocus(g, snapshot.laneTarget, view.z, view.resolved);
        if (view.resolved) {
          // Gently sink the passed gate so the path stays clear.
          g.position.y = Math.max(-2.4, g.position.y - 0.12);
        }
      } else if (view.kind === "swing") {
        g.position.set(0, 0, view.z);
        g.rotation.y = Math.sin(this.elapsed * 2) * 0.06;
      } else if (view.kind === "build") {
        g.position.set(-4.8, 0, view.z);
      } else {
        g.position.set(0, 0, view.z);
        g.rotation.y = Math.sin(this.elapsed * 1.5) * 0.15;
      }
    }
  }

  private buildCoin(): THREE.Group {
    const group = new THREE.Group();
    const coin = new THREE.Mesh(GEM, mat(0xf7c531, { emissive: 0xffe27a, intensity: 0.4, rough: 0.25 }));
    coin.scale.set(0.6, 0.6, 0.6);
    group.add(coin);
    return group;
  }

  private buildObstacle(): THREE.Group {
    const group = new THREE.Group();
    const warn = mat(0xe4564b, { intensity: 0.12 });
    const stripe = mat(0xfff2cc, { intensity: 0.1 });
    for (let i = 0; i < 3; i += 1) group.add(block((i - 1) * 0.5, 0.45, 0, 0.46, 0.9, 0.6, i % 2 === 0 ? warn : stripe));
    group.add(block(0, 0.95, 0, 1.7, 0.18, 0.7, stripe));
    return group;
  }

  private buildGate(gate: RenderableGate): THREE.Group {
    const group = tag(new THREE.Group(), "runner-gate", {
      gateId: gate.id ?? "",
      representation: gate.representation ?? "blocks"
    });
    const baseMat = mat(0x10192c, { intensity: 0.08, rough: 0.65 });
    group.add(tag(block(0, 0.03, 1.2, TRACK_WIDTH + 0.8, 0.08, 3.5, baseMat), "runner-gate-foundation"));

    gate.lanes.forEach((lane, index) => {
      const visual = LANE_VISUALS[index % LANE_VISUALS.length];
      const sub = tag(new THREE.Group(), "runner-gate-lane", {
        gateId: gate.id ?? "",
        lane: index,
        quantity: lane.quantity,
        correct: Boolean(lane.correct ?? index === gate.correctLane),
        gateColorName: visual.name,
        selectedFocus: false
      });
      sub.position.x = laneToX(index);

      const laneMat = mat(visual.primary, { emissive: visual.primary, intensity: 0.32, rough: 0.38 });
      const darkMat = mat(visual.dark, { emissive: visual.dark, intensity: 0.18, rough: 0.55 });
      const accentMat = mat(visual.accent, { emissive: visual.accent, intensity: 0.28, rough: 0.45 });
      const whiteMat = mat(0xffffff, { intensity: 0.16, rough: 0.48 });
      const inkMat = mat(0x10192c, { intensity: 0.02, rough: 0.72 });

      sub.add(tag(block(0, 0.09, 1.28, 1.74, 0.12, 3.18, laneMat), "runner-gate-lane-pad", {
        lane: index,
        quantity: lane.quantity,
        gateColorName: visual.name
      }));
      sub.add(tag(block(-0.92, 0.18, 1.28, 0.12, 0.2, 3.18, darkMat), "runner-gate-pad-rail", { lane: index }));
      sub.add(tag(block(0.92, 0.18, 1.28, 0.12, 0.2, 3.18, darkMat), "runner-gate-pad-rail", { lane: index }));
      sub.add(this.buildLaneChevrons(visual.primary, visual.accent, index, lane.quantity));
      sub.add(this.buildLaneNumberRunway(lane.quantity, index));

      // Big dark sign with a bright frame: this makes the number structure read
      // clearly at mobile distance and avoids relying on hue alone.
      sub.add(tag(block(0, 1.5, 0.18, 1.86, 1.74, 0.16, inkMat), "runner-gate-panel", { lane: index, quantity: lane.quantity }));
      sub.add(tag(block(0, 2.42, 0.24, 2.04, 0.18, 0.22, whiteMat), "runner-gate-panel-frame", { lane: index }));
      sub.add(tag(block(0, 0.58, 0.24, 2.04, 0.18, 0.22, whiteMat), "runner-gate-panel-frame", { lane: index }));
      sub.add(tag(block(-1.0, 1.5, 0.24, 0.18, 1.9, 0.22, whiteMat), "runner-gate-panel-frame", { lane: index }));
      sub.add(tag(block(1.0, 1.5, 0.24, 0.18, 1.9, 0.22, whiteMat), "runner-gate-panel-frame", { lane: index }));

      sub.add(tag(block(-1.08, 1.18, 0, 0.2, 2.36, 0.24, darkMat), "runner-gate-post", { lane: index }));
      sub.add(tag(block(1.08, 1.18, 0, 0.2, 2.36, 0.24, darkMat), "runner-gate-post", { lane: index }));
      sub.add(tag(block(0, 2.66, 0, 1.42, 0.24, 0.24, accentMat), "runner-gate-lane-beacon", {
        lane: index,
        gateColorName: visual.name
      }));

      const art = buildVoxelNumber(gate.representation ?? "blocks", lane.quantity);
      tag(art, "runner-gate-quantity-art", {
        lane: index,
        quantity: lane.quantity,
        representation: gate.representation ?? "blocks"
      });
      art.position.set(0, 1.62, 0.46);
      art.scale.set(1.5, 1.5, 1.5);
      sub.add(art);

      const shelf = this.buildFivePlusShelf(lane.quantity, index);
      shelf.position.set(0, 0.88, 0.5);
      sub.add(shelf);

      group.add(sub);
    });
    return group;
  }

  private buildLaneChevrons(primary: number, accent: number, lane: number, quantity: number): THREE.Group {
    const group = tag(new THREE.Group(), "runner-gate-lane-arrows", { lane, quantity });
    const primaryMat = mat(primary, { emissive: primary, intensity: 0.35, rough: 0.32 });
    const accentMat = mat(accent, { emissive: accent, intensity: 0.32, rough: 0.38 });
    for (let step = 0; step < 4; step += 1) {
      const z = 2.55 - step * 0.62;
      group.add(tag(block(0, 0.19, z - 0.08, 0.42, 0.1, 0.18, step % 2 === 0 ? accentMat : primaryMat), "runner-gate-arrow-block", { lane, step, quantity }));
      group.add(tag(block(-0.34, 0.18, z, 0.24, 0.1, 0.16, accentMat), "runner-gate-arrow-block", { lane, step, side: "left", quantity }));
      group.add(tag(block(0.34, 0.18, z, 0.24, 0.1, 0.16, accentMat), "runner-gate-arrow-block", { lane, step, side: "right", quantity }));
    }
    return group;
  }

  private buildLaneNumberRunway(quantity: number, lane: number): THREE.Group {
    const q = Math.max(1, Math.min(10, Math.round(quantity)));
    const group = tag(new THREE.Group(), "runner-gate-number-runway", { lane, quantity: q });
    const fiveMat = mat(0xfff36d, { emissive: 0xfff36d, intensity: 0.44, rough: 0.32 });
    const extraMat = mat(0xff7a59, { emissive: 0xff7a59, intensity: 0.38, rough: 0.38 });
    for (let i = 0; i < q; i += 1) {
      const row = i < 5 ? 0 : 1;
      const col = i % 5;
      const inRow = row === 0 ? Math.min(5, q) : q - 5;
      const startX = -((inRow - 1) * 0.27) / 2;
      const token = block(startX + col * 0.27, 0.3, 2.28 - row * 0.42, 0.22, 0.16, 0.22, i < 5 ? fiveMat : extraMat);
      tag(token, "runner-gate-runway-token", {
        lane,
        quantity: q,
        tokenIndex: i + 1,
        fiveGroup: i < 5
      });
      group.add(token);
    }
    return group;
  }

  private updateGatePreview(target: RenderableGate | undefined, selectedLane: number): void {
    this.gatePreview.visible = Boolean(target);
    if (!target) {
      this.lastPreviewGateId = "";
      this.gatePreview.clear();
      return;
    }
    const id = `${target.id ?? ""}:${target.lanes.map((lane) => lane.quantity).join("-")}`;
    if (id !== this.lastPreviewGateId) {
      this.lastPreviewGateId = id;
      this.gatePreview.clear();
      target.lanes.forEach((lane, index) => {
        const visual = LANE_VISUALS[index % LANE_VISUALS.length];
        const laneGroup = tag(new THREE.Group(), "runner-gate-preview-lane", {
          lane: index,
          quantity: lane.quantity,
          gateColorName: visual.name,
          selectedFocus: false
        });
        laneGroup.position.set(laneToX(index), 0.16, -2.65);
        laneGroup.add(tag(block(0, 0.02, 0, 1.34, 0.08, 0.72, mat(visual.dark, { intensity: 0.16, rough: 0.5 })), "runner-gate-preview-pad", {
          lane: index,
          quantity: lane.quantity
        }));
        laneGroup.add(this.buildPreviewTokens(lane.quantity, index));
        this.gatePreview.add(laneGroup);
      });
    }
    for (const child of this.gatePreview.children) {
      if (child.userData.blokblitzRole !== "runner-gate-preview-lane") continue;
      const lane = Number(child.userData.lane);
      const selected = lane === selectedLane;
      child.userData.selectedFocus = selected;
      const s = selected ? 1.12 : 1;
      child.scale.set(s, s, s);
      child.position.y = selected ? 0.22 + Math.sin(this.elapsed * 8) * 0.02 : 0.16;
    }
  }

  private buildPreviewTokens(quantity: number, lane: number): THREE.Group {
    const q = Math.max(1, Math.min(10, Math.round(quantity)));
    const group = tag(new THREE.Group(), "runner-gate-preview-tokens", { lane, quantity: q });
    const fiveMat = mat(0xfff36d, { emissive: 0xfff36d, intensity: 0.5, rough: 0.3 });
    const extraMat = mat(0xff7a59, { emissive: 0xff7a59, intensity: 0.42, rough: 0.34 });
    for (let i = 0; i < q; i += 1) {
      const row = i < 5 ? 0 : 1;
      const col = i % 5;
      const inRow = row === 0 ? Math.min(5, q) : q - 5;
      const token = block(-((inRow - 1) * 0.2) / 2 + col * 0.2, 0.12, row * 0.24 - 0.12, 0.15, 0.16, 0.15, i < 5 ? fiveMat : extraMat);
      tag(token, "runner-gate-preview-token", {
        lane,
        quantity: q,
        tokenIndex: i + 1,
        fiveGroup: i < 5
      });
      group.add(token);
    }
    return group;
  }

  private buildFivePlusShelf(quantity: number, lane: number): THREE.Group {
    const q = Math.max(1, Math.min(10, Math.round(quantity)));
    const group = tag(new THREE.Group(), "runner-gate-five-structure", { lane, quantity: q });
    const fiveMat = mat(0xf7c531, { emissive: 0xf7c531, intensity: 0.38, rough: 0.35 });
    const extraMat = mat(0xff7a59, { emissive: 0xff7a59, intensity: 0.34, rough: 0.38 });
    const emptyMat = mat(0x3a455c, { intensity: 0.05, rough: 0.8 });
    for (let i = 0; i < 10; i += 1) {
      const row = i < 5 ? 0 : 1;
      const col = i % 5;
      const filled = i < q;
      const material = filled ? (i < 5 ? fiveMat : extraMat) : emptyMat;
      const token = block(-0.52 + col * 0.26, row * 0.26, 0, filled ? 0.22 : 0.13, filled ? 0.22 : 0.1, 0.14, material);
      tag(token, "runner-gate-five-token", {
        lane,
        quantity: q,
        tokenIndex: i + 1,
        filled,
        fiveGroup: i < 5
      });
      group.add(token);
    }
    return group;
  }

  private updateGateFocus(group: THREE.Group, selectedLane: number, gateZ: number, resolved: boolean): void {
    const focusVisible = !resolved && gateZ > -34 && gateZ < 5;
    for (const child of group.children) {
      const lane = child.userData.blokblitzRole === "runner-gate-lane" ? Number(child.userData.lane) : Number.NaN;
      if (!Number.isFinite(lane)) continue;
      const selected = focusVisible && lane === selectedLane;
      child.userData.selectedFocus = selected;
      const s = selected ? 1.08 : 1;
      child.scale.set(s, s, s);
      child.position.y = selected ? 0.08 + Math.sin(this.elapsed * 9) * 0.03 : 0;
    }
  }

  // A web-swing anchor (Spiderman vibe): tall poles + a glowing web the hero zips through.
  private buildSwing(): THREE.Group {
    const group = new THREE.Group();
    const poleMat = mat(0xede9ff, { intensity: 0.1 });
    const webMat = mat(0x9be3ff, { emissive: 0x9be3ff, intensity: 0.5, rough: 0.3 });
    group.add(block(-2.4, 2.2, 0, 0.22, 4.4, 0.22, poleMat));
    group.add(block(2.4, 2.2, 0, 0.22, 4.4, 0.22, poleMat));
    group.add(block(0, 4.3, 0, 5.0, 0.24, 0.24, poleMat));
    // A simple voxel web hanging from the beam.
    for (let i = 0; i < 5; i += 1) {
      group.add(block(-1.6 + i * 0.8, 3.4, 0, 0.07, 1.6, 0.07, webMat));
      group.add(block(0, 3.9 - i * 0.4, 0, 3.4, 0.07, 0.07, webMat));
    }
    group.add(block(0, 2.6, 0, 0.5, 0.5, 0.5, webMat));
    return group;
  }

  // A little Minecraft house built at the roadside from the run's blocks.
  private buildBuildHouse(): THREE.Group {
    const group = new THREE.Group();
    const wall = mat(0xcda87a, { intensity: 0.04 });
    const wood = mat(0x8a5a3c, { intensity: 0.03 });
    const roof = mat(0xd6533f, { intensity: 0.06 });
    const door = mat(0x5a3b22, { intensity: 0.03 });
    const glass = mat(0x9be3ff, { emissive: 0x9be3ff, intensity: 0.3 });
    for (let x = 0; x < 3; x += 1) {
      for (let y = 0; y < 3; y += 1) {
        group.add(block(-1 + x, 0.6 + y, 0, 1, 1, 1, (x === 1 && y < 2) ? door : wall));
      }
    }
    group.add(block(1, 1.6, 0.05, 0.6, 0.6, 0.2, glass));
    // roof
    group.add(block(0, 3.2, 0, 3.6, 0.5, 1.4, roof));
    group.add(block(0, 3.7, 0, 2.4, 0.5, 1.0, roof));
    group.add(block(0, 4.1, 0, 1.2, 0.5, 0.7, roof));
    group.add(block(0, 0.1, 0, 3.6, 0.3, 1.4, wood));
    return group;
  }

  private buildFinish(): THREE.Group {
    const group = new THREE.Group();
    const a = mat(0x172033, { intensity: 0.05 });
    const b = mat(0xfff2cc, { intensity: 0.12 });
    const post = mat(0xf4b942, { intensity: 0.16 });
    group.add(block(-3.4, 1.6, 0, 0.3, 3.2, 0.3, post));
    group.add(block(3.4, 1.6, 0, 0.3, 3.2, 0.3, post));
    group.add(block(0, 3.1, 0, 7.2, 0.5, 0.3, post));
    for (let i = 0; i < 8; i += 1) {
      group.add(block(-3 + i * 0.86, 2.6, 0, 0.8, 0.5, 0.16, i % 2 === 0 ? a : b));
      group.add(block(-3 + i * 0.86, 2.1, 0, 0.8, 0.5, 0.16, i % 2 === 0 ? b : a));
    }
    return group;
  }

  private updateHero(snapshot: RunnerSnapshot, dt: number): void {
    const x = laneToX(snapshot.laneX);
    this.swingTimer = Math.max(0, this.swingTimer - dt);
    const swingLift = this.swingTimer > 0 ? Math.sin(Math.PI * (1 - this.swingTimer / 0.7)) * 1.8 : 0;
    const jump = snapshot.jumpHeight * 1.5 + swingLift;
    this.heroSquash = Math.max(0, this.heroSquash - dt * 4);
    const runPhase = this.elapsed * (8 + snapshot.speedRatio * 4);
    this.hero.position.set(x, jump, 0);
    // Lean into speed, bank into lane changes.
    const bank = (snapshot.laneTarget - snapshot.laneX) * -0.5;
    this.hero.rotation.z = bank;
    this.hero.rotation.x = -0.06 - snapshot.speedRatio * 0.12 + (snapshot.airborne ? 0.16 : 0) - swingLift * 0.08;

    const squash = 1 - this.heroSquash * 0.3;
    const stretch = 1 + this.heroSquash * 0.3;
    this.hero.scale.set(stretch, squash, stretch);

    const stride = snapshot.airborne ? 0.5 : Math.sin(runPhase) * 0.6;
    if (this.heroParts.legL) this.heroParts.legL.rotation.x = stride;
    if (this.heroParts.legR) this.heroParts.legR.rotation.x = -stride;
    if (this.heroParts.bootL) this.heroParts.bootL.rotation.x = stride;
    if (this.heroParts.bootR) this.heroParts.bootR.rotation.x = -stride;
    if (this.heroParts.tail) this.heroParts.tail.rotation.y = Math.sin(runPhase * 0.5) * 0.3;
    const bob = snapshot.airborne ? 0 : Math.abs(Math.sin(runPhase)) * 0.05;
    if (this.heroParts.body) this.heroParts.body.position.y = 0.74 + bob;
    if (this.heroParts.head) this.heroParts.head.position.y = 1.18 + bob;
    if (this.heroParts.scarf) this.heroParts.scarf.position.z = 0.18 + Math.sin(runPhase) * 0.06 + snapshot.speedRatio * 0.1;
  }

  private updateCamera(snapshot: RunnerSnapshot, dt: number): void {
    const heroX = laneToX(snapshot.laneX);
    this.cameraX += (heroX * 0.45 - this.cameraX) * Math.min(1, dt * 6);
    this.camera.position.set(this.cameraX, 3.5 + snapshot.jumpHeight * 0.3, 6.6);

    // Decaying juice.
    this.shake = Math.max(0, this.shake - dt * 2.4);
    this.fovPunch = Math.max(0, this.fovPunch - dt * 2.5);
    if (this.shake > 0) {
      this.camera.position.x += (Math.sin(this.elapsed * 90) * 0.5) * this.shake;
      this.camera.position.y += (Math.cos(this.elapsed * 80) * 0.5) * this.shake;
    }
    this.camera.lookAt(this.cameraX * 0.5, 1, -6);
    this.camera.fov = 60 + snapshot.speedRatio * 6 + this.fovPunch * 10;
    this.camera.updateProjectionMatrix();
  }

  // ---- events / particles ---------------------------------------------------

  onEvent(event: RunnerEvent): void {
    if (event.type === "coin") {
      this.burst(laneToX(event.lane), 0.9, 0.2, 0xffe27a, 8, 2.2);
    } else if (event.type === "gate") {
      const x = laneToX(event.chosenLane);
      if (event.correct) {
        this.burst(x, 1.6, 0.1, 0x7ef08a, 22, 4);
        this.shake = Math.min(1, this.shake + 0.35);
        this.fovPunch = Math.min(1, this.fovPunch + 0.5);
        this.heroSquash = 1;
        this.markCorrectGate(event.gate.correctLane);
      } else {
        this.burst(x, 1.4, 0.1, 0xff9aa0, 12, 2.6);
        this.shake = Math.min(1, this.shake + 0.18);
        this.markCorrectGate(event.gate.correctLane);
      }
    } else if (event.type === "stumble") {
      this.burst(laneToX(event.lane), 0.7, 0.1, 0xff9aa0, 14, 3);
      this.shake = Math.min(1, this.shake + 0.4);
      this.heroSquash = 1;
    } else if (event.type === "obstacle-cleared") {
      this.burst(laneToX(event.lane), 1.4, 0.1, 0xfff27a, 8, 2.4);
    } else if (event.type === "boost") {
      this.fovPunch = Math.min(1, this.fovPunch + 0.7);
      this.burst(0, 1.2, 0.2, this.skin.colors.trail, 18, 4);
    } else if (event.type === "swing") {
      this.swingTimer = 0.7;
      this.fovPunch = Math.min(1, this.fovPunch + 0.7);
      this.shake = Math.min(1, this.shake + 0.2);
      this.burst(0, 1.6, 0.2, this.skin.colors.trail, 18, 4.5);
    } else if (event.type === "build") {
      this.burst(-4.8, 1.6, 0.2, 0xf7c531, 22, 4);
      this.shake = Math.min(1, this.shake + 0.22);
      this.fovPunch = Math.min(1, this.fovPunch + 0.4);
    }
  }

  // Light up the correct gate so a wrong choice still teaches the structure.
  private markCorrectGate(correctLane: number): void {
    const x = laneToX(correctLane);
    this.burst(x, 1.5, 0.05, 0x9be3ff, 10, 2.2);
  }

  private burst(x: number, y: number, z: number, color: number, count: number, power: number): void {
    let material = this.particleMaterials.get(color);
    if (!material) {
      material = mat(color, { emissive: color, intensity: 0.5, rough: 0.3 });
      this.particleMaterials.set(color, material);
    }
    for (let i = 0; i < count; i += 1) {
      const mesh = new THREE.Mesh(CUBE, material);
      const size = 0.1 + Math.random() * 0.14;
      mesh.scale.set(size, size, size);
      mesh.position.set(x + (Math.random() - 0.5) * 0.4, y + (Math.random() - 0.5) * 0.3, z);
      this.root.add(mesh);
      this.particles.push({
        mesh,
        vx: (Math.random() - 0.5) * power,
        vy: Math.random() * power * 0.8 + 1,
        vz: (Math.random() - 0.5) * power + 1.5,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1,
        spin: (Math.random() - 0.5) * 8
      });
    }
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.root.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }
      p.vy -= 6 * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.mesh.rotation.x += p.spin * dt;
      p.mesh.rotation.y += p.spin * dt;
      const s = Math.max(0.02, p.life * 0.3);
      p.mesh.scale.set(s, s, s);
    }
  }

  dispose(): void {
    this.world.clear();
    this.world.fog = null;
    this.entities.clear();
    this.particles = [];
  }
}
