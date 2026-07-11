// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Game } from "../src/game/Game";
import { SaveManager } from "../src/game/SaveManager";
import { showSkinUnlock, unlockEligibleSkins } from "../src/scenes/skinRewards";

function makeGame(): {
  game: Game;
  save: SaveManager;
  playAudio: ReturnType<typeof vi.fn>;
  playHaptics: ReturnType<typeof vi.fn>;
  speak: ReturnType<typeof vi.fn>;
  flashMessage: ReturnType<typeof vi.fn>;
} {
  const save = new SaveManager();
  const playAudio = vi.fn();
  const playHaptics = vi.fn();
  const speak = vi.fn();
  const flashMessage = vi.fn();
  const game = {
    save,
    data: () => save.getData(),
    audio: { play: playAudio },
    haptics: { play: playHaptics },
    voice: { speak },
    flashMessage
  } as unknown as Game;
  return { game, save, playAudio, playHaptics, speak, flashMessage };
}

describe("profile-local hero rewards", () => {
  beforeEach(() => {
    document.body.innerHTML = '<main id="root"></main>';
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("unlocks each earned skin once and never leaks it to another child", () => {
    const { game, save } = makeGame();
    const first = save.createProfile("Kind A", "blitz");
    save.award({ stars: 12 });

    expect(unlockEligibleSkins(game).map((skin) => skin.id)).toEqual(["aqua"]);
    expect(unlockEligibleSkins(game)).toEqual([]);
    expect(save.getData().progress.cosmetics.unlockedSkins).toContain("aqua");

    const second = save.createProfile("Kind B", "blitz");
    expect(unlockEligibleSkins(game)).toEqual([]);
    expect(save.getData().progress.cosmetics.unlockedSkins).toEqual(["blitz"]);

    save.switchProfile(first.id);
    expect(save.getData().progress.cosmetics.unlockedSkins).toContain("aqua");
    save.switchProfile(second.id);
    expect(save.getData().progress.cosmetics.unlockedSkins).not.toContain("aqua");
  });

  it("lets the child equip the earned hero immediately", () => {
    const { game, save, playAudio, playHaptics, speak, flashMessage } = makeGame();
    save.createProfile("Mila", "blitz");
    save.award({ stars: 12 });
    const skins = unlockEligibleSkins(game);
    const onSelect = vi.fn();
    const onDone = vi.fn();
    const root = document.querySelector<HTMLElement>("#root")!;

    const overlay = showSkinUnlock(root, game, skins, { onSelect, onDone })!;
    expect(overlay.getAttribute("role")).toBe("dialog");
    expect(overlay.dataset.skin).toBe("aqua");
    expect(overlay.querySelector('[data-buddy="aqua"]')).toBeTruthy();
    expect(document.activeElement).toBe(overlay.querySelector(".skin-reveal-choose"));

    overlay.querySelector<HTMLButtonElement>(".skin-reveal-choose")!.click();
    expect(save.getData().progress.cosmetics.activeSkin).toBe("aqua");
    expect(root.querySelector(".skin-reveal")).toBeNull();
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "aqua" }));
    expect(onDone).toHaveBeenCalledOnce();
    expect(playAudio).toHaveBeenCalledWith("success");
    expect(playHaptics).toHaveBeenCalledWith("success");
    expect(speak).toHaveBeenCalledWith("Aqua", { interrupt: false });
    expect(flashMessage).toHaveBeenCalledWith("Aqua speelt mee!", "good");
  });

  it("keeps the current hero when the child chooses Later", () => {
    const { game, save, playAudio } = makeGame();
    save.createProfile("Noor", "blitz");
    save.award({ stars: 12 });
    const root = document.querySelector<HTMLElement>("#root")!;
    const onSelect = vi.fn();

    const overlay = showSkinUnlock(root, game, unlockEligibleSkins(game), { onSelect })!;
    overlay.querySelector<HTMLButtonElement>(".skin-reveal-later")!.click();

    expect(save.getData().progress.cosmetics.activeSkin).toBe("blitz");
    expect(onSelect).not.toHaveBeenCalled();
    expect(playAudio).not.toHaveBeenCalled();
    expect(root.querySelector(".skin-reveal")).toBeNull();
  });
});
