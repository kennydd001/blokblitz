import { stableQuantityFromDate } from "../education/quantityLayouts";
import type { AttemptLog, DistrictProgress, GameProgress, GameSettings, SaveData, WorldProgress } from "../education/types";
import { districtSeeds } from "../data/districts";
import { earnedStickerIds } from "../data/stickers";
import { WORLDS, nextWorldId } from "../runner/worlds";

const STORAGE_KEY = "blokblitz-save-v1";

function makeSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeDistrictRecord(): Record<string, DistrictProgress> {
  return Object.fromEntries(districtSeeds.map((district) => [district.id, { ...district }]));
}

function makeWorldRecord(): Record<string, WorldProgress> {
  return Object.fromEntries(
    WORLDS.map((world, index) => [world.id, { unlocked: index === 0, completed: false, bestStars: 0 }])
  );
}

export function defaultSettings(): GameSettings {
  return {
    speed: 1,
    muted: false,
    haptics: true,
    highContrast: false,
    voice: true
  };
}

export function defaultProgress(): GameProgress {
  const sessionId = makeSessionId();
  return {
    sessionId,
    stars: 0,
    numberBlocks: 0,
    rescuedDinos: 0,
    rescuedNumerianen: 0,
    dinoStreak: 0,
    numberOfDay: stableQuantityFromDate(),
    currentLevel: 1,
    cityDistricts: makeDistrictRecord(),
    attempts: [],
    sessions: [
      {
        id: sessionId,
        startedAt: Date.now(),
        starsEarned: 0,
        rescued: 0,
        attempts: 0
      }
    ],
    lastChallengeIds: [],
    bestRunDistance: 0,
    runsCompleted: 0,
    cosmetics: { activeSkin: "blitz", unlockedSkins: ["blitz"] },
    worlds: makeWorldRecord(),
    stickers: []
  };
}

export function defaultSaveData(): SaveData {
  return {
    version: 1,
    settings: defaultSettings(),
    progress: defaultProgress()
  };
}

export class SaveManager {
  private data: SaveData;
  private memoryValue = "";

  constructor() {
    this.data = this.load();
  }

  getData(): SaveData {
    return structuredClone(this.data);
  }

  getMutableData(): SaveData {
    return this.data;
  }

  load(): SaveData {
    const raw = this.readStorage();
    if (!raw) return defaultSaveData();
    try {
      const parsed = JSON.parse(raw) as SaveData;
      return this.migrate(parsed);
    } catch {
      return defaultSaveData();
    }
  }

  save(): void {
    this.writeStorage(JSON.stringify(this.data));
  }

  updateSettings(mutator: (settings: GameSettings) => void): SaveData {
    mutator(this.data.settings);
    this.save();
    return this.getData();
  }

  updateProgress(mutator: (progress: GameProgress) => void): SaveData {
    mutator(this.data.progress);
    this.save();
    return this.getData();
  }

  appendAttempt(attempt: AttemptLog): SaveData {
    this.data.progress.attempts.push(attempt);
    this.data.progress.lastChallengeIds = [...this.data.progress.lastChallengeIds, attempt.challengeType].slice(-8);
    const session = this.data.progress.sessions.find((item) => item.id === this.data.progress.sessionId);
    if (session) session.attempts += 1;
    this.save();
    return this.getData();
  }

  award(params: { stars?: number; blocks?: number; dinos?: number; numerianen?: number; streakDelta?: number }): SaveData {
    this.data.progress.stars += params.stars ?? 0;
    this.data.progress.numberBlocks += params.blocks ?? 0;
    this.data.progress.rescuedDinos += params.dinos ?? 0;
    this.data.progress.rescuedNumerianen += params.numerianen ?? 0;
    this.data.progress.dinoStreak = Math.max(0, this.data.progress.dinoStreak + (params.streakDelta ?? 0));
    const session = this.data.progress.sessions.find((item) => item.id === this.data.progress.sessionId);
    if (session) {
      session.starsEarned += params.stars ?? 0;
      session.rescued += (params.dinos ?? 0) + (params.numerianen ?? 0);
    }
    this.save();
    return this.getData();
  }

  /** Record the outcome of a finished run: best distance + run counter. Stars/blocks go through award(). */
  recordRunResult(distanceMeters: number): SaveData {
    this.data.progress.bestRunDistance = Math.max(this.data.progress.bestRunDistance, Math.round(distanceMeters));
    this.data.progress.runsCompleted += 1;
    this.save();
    return this.getData();
  }

  /** Mark a world finished, keep the best star score, and unlock the next world. Returns whether a new world opened. */
  recordWorldResult(worldId: string, stars: number): { newWorldUnlocked: boolean } {
    const world = this.data.progress.worlds[worldId];
    let newWorldUnlocked = false;
    if (world) {
      world.completed = true;
      world.bestStars = Math.max(world.bestStars, stars);
    }
    const nextId = nextWorldId(worldId);
    if (nextId) {
      const next = this.data.progress.worlds[nextId];
      if (next && !next.unlocked) {
        next.unlocked = true;
        newWorldUnlocked = true;
      }
    }
    this.save();
    return { newWorldUnlocked };
  }

  /** Make every skin the current star total has earned available, without losing the active choice. */
  syncUnlockedSkins(ids: string[]): SaveData {
    const merged = new Set([...this.data.progress.cosmetics.unlockedSkins, ...ids]);
    this.data.progress.cosmetics.unlockedSkins = [...merged];
    this.save();
    return this.getData();
  }

  /** Award any newly earned stickers from current progress. Returns the ids that are new. */
  syncStickers(): string[] {
    const earned = earnedStickerIds(this.data.progress);
    const have = new Set(this.data.progress.stickers);
    const fresh = earned.filter((id) => !have.has(id));
    if (fresh.length > 0) {
      this.data.progress.stickers = [...this.data.progress.stickers, ...fresh];
      this.save();
    }
    return fresh;
  }

  setActiveSkin(id: string): SaveData {
    if (this.data.progress.cosmetics.unlockedSkins.includes(id)) {
      this.data.progress.cosmetics.activeSkin = id;
      this.save();
    }
    return this.getData();
  }

  restoreDistrict(id: string): SaveData {
    const district = this.data.progress.cityDistricts[id];
    if (district) {
      district.level += 1;
      district.restored = district.level >= 1;
      const restoredCount = Object.values(this.data.progress.cityDistricts).filter((item) => item.restored).length;
      this.data.progress.currentLevel = Math.max(this.data.progress.currentLevel, Math.min(restoredCount + 1, 15));
      this.data.progress.numberBlocks = Math.max(0, this.data.progress.numberBlocks - 1);
      this.data.progress.stars += 2;
    }
    this.save();
    return this.getData();
  }

  endSession(): SaveData {
    const session = this.data.progress.sessions.find((item) => item.id === this.data.progress.sessionId);
    if (session && !session.endedAt) session.endedAt = Date.now();
    this.save();
    return this.getData();
  }

  startNewSession(): SaveData {
    const sessionId = makeSessionId();
    this.data.progress.sessionId = sessionId;
    this.data.progress.sessions.push({
      id: sessionId,
      startedAt: Date.now(),
      starsEarned: 0,
      rescued: 0,
      attempts: 0
    });
    this.save();
    return this.getData();
  }

  reset(): SaveData {
    this.data = defaultSaveData();
    this.save();
    return this.getData();
  }

  exportJson(): string {
    return JSON.stringify(this.data, null, 2);
  }

  private migrate(data: SaveData): SaveData {
    const fallback = defaultSaveData();
    const districts = { ...fallback.progress.cityDistricts, ...(data.progress?.cityDistricts ?? {}) };
    const savedCosmetics = data.progress?.cosmetics;
    const cosmetics = {
      activeSkin: savedCosmetics?.activeSkin ?? fallback.progress.cosmetics.activeSkin,
      unlockedSkins:
        savedCosmetics?.unlockedSkins?.length ? [...new Set(savedCosmetics.unlockedSkins)] : [...fallback.progress.cosmetics.unlockedSkins]
    };
    return {
      version: 1,
      settings: { ...fallback.settings, ...(data.settings ?? {}) },
      progress: {
        ...fallback.progress,
        ...(data.progress ?? {}),
        cityDistricts: districts,
        attempts: data.progress?.attempts ?? [],
        sessions: data.progress?.sessions?.length ? data.progress.sessions : fallback.progress.sessions,
        lastChallengeIds: data.progress?.lastChallengeIds ?? [],
        bestRunDistance: data.progress?.bestRunDistance ?? 0,
        runsCompleted: data.progress?.runsCompleted ?? 0,
        cosmetics,
        worlds: { ...makeWorldRecord(), ...(data.progress?.worlds ?? {}) },
        stickers: data.progress?.stickers ?? []
      }
    };
  }

  private readStorage(): string | null {
    if (typeof localStorage !== "undefined") return localStorage.getItem(STORAGE_KEY);
    return this.memoryValue || null;
  }

  private writeStorage(value: string): void {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, value);
      return;
    }
    this.memoryValue = value;
  }
}
