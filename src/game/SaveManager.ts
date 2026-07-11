import { stableQuantityFromDate } from "../education/quantityLayouts";
import type {
  AttemptLog,
  ChildProfile,
  DayStreak,
  DistrictProgress,
  GameProgress,
  GameSettings,
  ProfileRoster,
  SaveData,
  WorldProgress
} from "../education/types";
import { districtSeeds } from "../data/districts";
import { JOURNEY, backfillCompleted, frontierIndex } from "../data/journey";
import { earnedStickerIds } from "../data/stickers";
import { WORLDS, nextWorldId } from "../runner/worlds";

const STORAGE_KEY = "blokblitz-save-v1";
const ROSTER_STORAGE_KEY = "blokblitz-profiles-v1";
const PROFILE_STORAGE_PREFIX = `${STORAGE_KEY}::`;
const memoryStorage = new Map<string, string>();
const migratedLegacySources = new Map<string, string>();

function profileStorageKey(id: string): string {
  return `${PROFILE_STORAGE_PREFIX}${id}`;
}

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
    music: true,
    sound: true,
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
    stickers: [],
    journey: { nodeIndex: 0, completed: [], round: 1 },
    dailyChestDay: "",
    streak: { count: 0, best: 0, lastDay: "" },
    sessionChestFill: 0,
    buddyLevelSeen: 1
  };
}

/** The yyyy-mm-dd one day before the given day key. */
export function previousDayKey(dayKey: string): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  if (!y || !m || !d) return "";
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
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
  private memoryValue = memoryStorage;
  private roster: ProfileRoster;

  constructor() {
    this.roster = this.initializeRoster();
    this.data = this.load();
  }

  getData(): SaveData {
    return structuredClone(this.data);
  }

  getMutableData(): SaveData {
    return this.data;
  }

  listProfiles(): ChildProfile[] {
    return structuredClone(this.roster.profiles);
  }

  activeProfile(): ChildProfile | undefined {
    const profile = this.roster.activeId ? this.roster.profiles.find((item) => item.id === this.roster.activeId) : undefined;
    return profile ? structuredClone(profile) : undefined;
  }

  hasChosenProfile(): boolean {
    return Boolean(this.activeProfile());
  }

  createProfile(name: string, avatar: string, createdAt = 0): ChildProfile {
    const profile: ChildProfile = {
      id: this.nextProfileId(),
      name,
      avatar,
      createdAt
    };
    const profileData = defaultSaveData();
    profileData.progress.cosmetics.activeSkin = avatar;
    this.writeStorage(profileStorageKey(profile.id), JSON.stringify(profileData));
    this.roster.profiles.push(profile);
    this.roster.activeId = profile.id;
    this.data = profileData;
    this.persistRoster();
    return structuredClone(profile);
  }

  switchProfile(id: string): void {
    if (!this.roster.profiles.some((profile) => profile.id === id)) return;
    this.roster.activeId = id;
    this.data = this.load();
    this.persistRoster();
  }

  renameProfile(id: string, name: string): void {
    const profile = this.roster.profiles.find((item) => item.id === id);
    if (!profile) return;
    profile.name = name;
    this.persistRoster();
  }

  deleteProfile(id: string): void {
    const wasActive = this.roster.activeId === id;
    const remaining = this.roster.profiles.filter((profile) => profile.id !== id);
    if (remaining.length === this.roster.profiles.length) return;

    this.roster.profiles = remaining;
    this.removeStorage(profileStorageKey(id));
    if (wasActive) {
      const next = remaining[0];
      if (next) {
        this.roster.activeId = next.id;
        this.data = this.load();
      } else {
        this.roster.activeId = "";
        this.data = defaultSaveData();
      }
    }
    this.persistRoster();
  }

  load(): SaveData {
    const raw = this.readStorage(this.storageKey());
    if (!raw) return defaultSaveData();
    try {
      const parsed = JSON.parse(raw) as SaveData;
      return this.migrate(parsed);
    } catch {
      return defaultSaveData();
    }
  }

  save(): void {
    this.writeStorage(this.storageKey(), JSON.stringify(this.data));
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

  /** Mark a journey node done and move the glowing frontier to the next not-done node. */
  advanceJourney(nodeId: string): SaveData {
    const journey = this.data.progress.journey;
    if (!journey.completed.includes(nodeId)) journey.completed.push(nodeId);
    journey.nodeIndex = frontierIndex(journey.completed);
    this.save();
    return this.getData();
  }

  /** Whether every node on De Sterrenreis is done. */
  journeyComplete(): boolean {
    return this.data.progress.journey.nodeIndex >= JOURNEY.length;
  }

  /** The current Sterrenronde (1 = the first journey). */
  journeyRound(): number {
    return this.data.progress.journey.round ?? 1;
  }

  /**
   * Start the next Sterrenronde: the path continues on the same map, one
   * difficulty tier higher. Node progress resets so the world "sleeps" again;
   * stars, stickers, friends-in-the-bag and Buddy's level all stay earned.
   */
  startNewJourneyRound(): SaveData {
    const journey = this.data.progress.journey;
    journey.round = this.journeyRound() + 1;
    journey.completed = [];
    journey.nodeIndex = 0;
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
    // Old saves only had a single `muted` master; split it into music + sound
    // so a returning child keeps whatever they had (both off if it was muted).
    const savedSettings = data.settings ?? {};
    const legacyMuted = savedSettings.muted === true;
    return {
      version: 1,
      settings: {
        ...fallback.settings,
        ...savedSettings,
        music: savedSettings.music ?? !legacyMuted,
        sound: savedSettings.sound ?? !legacyMuted
      },
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
        stickers: data.progress?.stickers ?? [],
        // Back-fill the journey so saves that predate inserted nodes (e.g. the
        // region bosses) keep a clean linear prefix instead of jumping backwards.
        journey: (() => {
          const completed = backfillCompleted(data.progress?.journey?.completed ?? []);
          return { nodeIndex: frontierIndex(completed), completed, round: data.progress?.journey?.round ?? 1 };
        })(),
        dailyChestDay: data.progress?.dailyChestDay ?? "",
        streak: data.progress?.streak ?? { count: 0, best: 0, lastDay: "" },
        sessionChestFill: data.progress?.sessionChestFill ?? 0,
        buddyLevelSeen: data.progress?.buddyLevelSeen ?? 1
      }
    };
  }

  /** Count a finished activity toward the treasure chest; caps at 3 (= full). */
  bumpTreasure(): number {
    this.data.progress.sessionChestFill = Math.min(3, (this.data.progress.sessionChestFill ?? 0) + 1);
    this.save();
    return this.data.progress.sessionChestFill;
  }

  treasureFull(): boolean {
    return (this.data.progress.sessionChestFill ?? 0) >= 3;
  }

  /** Open the treasure chest (only when full); resets the meter. */
  claimTreasure(): boolean {
    if (!this.treasureFull()) return false;
    this.data.progress.sessionChestFill = 0;
    this.save();
    return true;
  }

  /** Remember that the child saw Buddy reach this level. */
  markBuddyLevelSeen(level: number): void {
    this.data.progress.buddyLevelSeen = Math.max(this.data.progress.buddyLevelSeen ?? 1, level);
    this.save();
  }

  /** Whether today's gift chest is still unopened. */
  dailyChestAvailable(dayKey: string): boolean {
    return this.data.progress.dailyChestDay !== dayKey;
  }

  /** The come-back-tomorrow streak. */
  dayStreak(): DayStreak {
    return this.data.progress.streak ?? { count: 0, best: 0, lastDay: "" };
  }

  /**
   * Open today's chest (idempotent): returns true only the first time today.
   * Also advances the day streak — +1 if the last claim was yesterday, reset to
   * 1 on a gap (never shamed) — and keeps the best.
   */
  claimDailyChest(dayKey: string): boolean {
    if (!this.dailyChestAvailable(dayKey)) return false;
    const streak = this.dayStreak();
    const count = streak.lastDay === previousDayKey(dayKey) ? streak.count + 1 : 1;
    this.data.progress.streak = { count, best: Math.max(streak.best, count), lastDay: dayKey };
    this.data.progress.dailyChestDay = dayKey;
    this.save();
    return true;
  }

  private initializeRoster(): ProfileRoster {
    const rosterRaw = this.readStorage(ROSTER_STORAGE_KEY);
    const roster = rosterRaw ? this.parseRoster(rosterRaw) : undefined;
    if (roster && roster.activeId && roster.profiles.some((profile) => profile.id === roster.activeId)) {
      // Keep old callers that still rewrite the legacy key in the same runtime
      // compatible, while a normal reload continues to trust the active profile.
      const legacyRaw = this.readStorage(STORAGE_KEY);
      const migratedSource = migratedLegacySources.get(roster.activeId);
      if (legacyRaw && migratedSource !== undefined && legacyRaw !== migratedSource) {
        const legacyData = this.parseSaveData(legacyRaw);
        if (legacyData) {
          this.writeStorage(profileStorageKey(roster.activeId), JSON.stringify(legacyData));
          migratedLegacySources.set(roster.activeId, legacyRaw);
        }
      }
      return roster;
    }

    const legacyRaw = this.readStorage(STORAGE_KEY);
    const legacyData = legacyRaw ? this.parseSaveData(legacyRaw) : undefined;
    if (legacyData) {
      const profile: ChildProfile = {
        id: "p1",
        name: "Speler 1",
        avatar: legacyData.progress.cosmetics.activeSkin,
        createdAt: 0
      };
      this.writeStorage(profileStorageKey(profile.id), JSON.stringify(legacyData));
      if (legacyRaw) migratedLegacySources.set(profile.id, legacyRaw);
      const migratedRoster: ProfileRoster = { activeId: profile.id, profiles: [profile] };
      this.writeStorage(ROSTER_STORAGE_KEY, JSON.stringify(migratedRoster));
      return migratedRoster;
    }

    const emptyRoster: ProfileRoster = { activeId: "", profiles: [] };
    this.writeStorage(ROSTER_STORAGE_KEY, JSON.stringify(emptyRoster));
    return emptyRoster;
  }

  private persistRoster(): void {
    this.writeStorage(ROSTER_STORAGE_KEY, JSON.stringify(this.roster));
  }

  private storageKey(): string {
    return this.hasChosenProfile() ? profileStorageKey(this.roster.activeId) : STORAGE_KEY;
  }

  private nextProfileId(): string {
    let number = 1;
    while (this.roster.profiles.some((profile) => profile.id === `p${number}`)) number += 1;
    return `p${number}`;
  }

  private parseRoster(raw: string): ProfileRoster | undefined {
    try {
      const parsed = JSON.parse(raw) as Partial<ProfileRoster>;
      if (!parsed || typeof parsed.activeId !== "string" || !Array.isArray(parsed.profiles)) return undefined;
      if (
        !parsed.profiles.every(
          (profile) =>
            Boolean(profile) &&
            typeof profile.id === "string" &&
            typeof profile.name === "string" &&
            typeof profile.avatar === "string" &&
            typeof profile.createdAt === "number"
        )
      ) {
        return undefined;
      }
      return {
        activeId: parsed.activeId,
        profiles: parsed.profiles.map((profile) => ({ ...profile })) as ChildProfile[]
      };
    } catch {
      return undefined;
    }
  }

  private parseSaveData(raw: string): SaveData | undefined {
    try {
      const parsed = JSON.parse(raw) as SaveData;
      if (!parsed || typeof parsed !== "object") return undefined;
      return this.migrate(parsed);
    } catch {
      return undefined;
    }
  }

  private readStorage(key: string): string | null {
    if (typeof localStorage !== "undefined") return localStorage.getItem(key);
    return this.memoryValue.get(key) ?? null;
  }

  private writeStorage(key: string, value: string): void {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, value);
      return;
    }
    this.memoryValue.set(key, value);
  }

  private removeStorage(key: string): void {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(key);
      return;
    }
    this.memoryValue.delete(key);
  }
}
