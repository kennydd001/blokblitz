// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { defaultSaveData, SaveManager } from "../src/game/SaveManager";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe("SaveManager child profiles", () => {
  it("keeps two profiles isolated across awards and reloads", () => {
    const save = new SaveManager();
    const first = save.createProfile("A", "blitz", 100);
    save.award({ stars: 7 });

    const second = save.createProfile("B", "aqua", 200);
    expect(save.getData().progress.stars).toBe(0);
    expect(save.getData().progress.cosmetics.activeSkin).toBe("blitz");
    save.award({ stars: 3 });

    save.switchProfile(first.id);
    expect(save.getData().progress.stars).toBe(7);
    save.switchProfile(second.id);
    expect(save.getData().progress.stars).toBe(3);

    const reloaded = new SaveManager();
    expect(reloaded.activeProfile()?.id).toBe(second.id);
    expect(reloaded.getData().progress.stars).toBe(3);
    reloaded.switchProfile(first.id);
    expect(reloaded.getData().progress.stars).toBe(7);
  });

  it("round-trips the selected profile data when switching", () => {
    const save = new SaveManager();
    const first = save.createProfile("Noor", "blitz");
    save.updateProgress((progress) => {
      progress.stars = 11;
      progress.buddyLevelSeen = 4;
    });
    const second = save.createProfile("Sem", "ember");
    save.updateSettings((settings) => {
      settings.muted = true;
    });

    save.switchProfile(first.id);
    expect(save.getData().progress.stars).toBe(11);
    expect(save.getData().progress.buddyLevelSeen).toBe(4);
    expect(save.getData().settings.muted).toBe(false);

    save.switchProfile(second.id);
    expect(save.getData().progress.stars).toBe(0);
    expect(save.getData().settings.muted).toBe(true);
  });

  it("migrates a legacy save into the active p1 profile without losing stars", () => {
    localStorage.setItem(
      "blokblitz-save-v1",
      JSON.stringify({
        version: 1,
        settings: { muted: false },
        progress: { stars: 13, cosmetics: { activeSkin: "ember", unlockedSkins: ["blitz", "ember"] } }
      })
    );

    const save = new SaveManager();
    expect(save.hasChosenProfile()).toBe(true);
    expect(save.activeProfile()).toEqual({ id: "p1", name: "Speler 1", avatar: "ember", createdAt: 0 });
    expect(save.getData().progress.stars).toBe(13);
    expect(save.getData().progress.cosmetics.activeSkin).toBe("ember");
    expect(JSON.parse(localStorage.getItem("blokblitz-save-v1::p1")!).progress.stars).toBe(13);
    expect(localStorage.getItem("blokblitz-save-v1")).not.toBeNull();
  });

  it("keeps an old profile sign but resets a locked avatar skin to Blitz", () => {
    localStorage.setItem(
      "blokblitz-save-v1",
      JSON.stringify({
        version: 1,
        settings: { muted: false },
        progress: { stars: 0, cosmetics: { activeSkin: "gold", unlockedSkins: ["blitz"] } }
      })
    );

    const save = new SaveManager();
    expect(save.activeProfile()?.avatar).toBe("gold");
    expect(save.getData().progress.cosmetics.activeSkin).toBe("blitz");
    expect(save.getData().progress.cosmetics.unlockedSkins).toEqual(["blitz"]);
  });

  it("deletes a profile and reactivates the first remaining profile", () => {
    const save = new SaveManager();
    const first = save.createProfile("Evi", "blitz");
    save.award({ stars: 5 });
    const second = save.createProfile("Mats", "aqua");
    save.award({ stars: 2 });
    save.renameProfile(first.id, "Evelien");

    save.deleteProfile(second.id);

    expect(save.listProfiles()).toEqual([{ ...first, name: "Evelien" }]);
    expect(save.activeProfile()?.id).toBe(first.id);
    expect(save.getData().progress.stars).toBe(5);
    expect(localStorage.getItem(`blokblitz-save-v1::${second.id}`)).toBeNull();
  });

  it("starts with default data and no chosen profile when storage is empty", () => {
    const save = new SaveManager();
    const actual = save.getData();
    const expected = defaultSaveData();
    const { sessionId: _actualSessionId, sessions: _actualSessions, ...actualProgress } = actual.progress;
    const { sessionId: _expectedSessionId, sessions: _expectedSessions, ...expectedProgress } = expected.progress;

    expect(save.hasChosenProfile()).toBe(false);
    expect(save.activeProfile()).toBeUndefined();
    expect(actual.version).toBe(expected.version);
    expect(actual.settings).toEqual(expected.settings);
    expect(actualProgress).toEqual(expectedProgress);
  });
});
