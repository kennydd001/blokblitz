// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Game } from "../src/game/Game";
import { SaveManager } from "../src/game/SaveManager";

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.innerHTML = "";
  localStorage.clear();
});

function game(): Game {
  return new Game(document.querySelector<HTMLElement>("#app")!);
}

describe("warm play-time stop", () => {
  it("keeps daily elapsed time isolated between child profiles", () => {
    const save = new SaveManager();
    const first = save.createProfile("Mila", "wave");
    save.updateSettings((settings) => (settings.dailyPlayMinutes = 10));
    save.addActivePlayTime(10 * 60_000);
    expect(save.playTimeStatus().reached).toBe(true);

    const second = save.createProfile("Noor", "triangle");
    expect(save.playTimeStatus().usedMs).toBe(0);
    expect(save.playTimeStatus().reached).toBe(false);

    save.switchProfile(first.id);
    expect(save.playTimeStatus().reached).toBe(true);
    save.switchProfile(second.id);
    expect(save.playTimeStatus().usedMs).toBe(0);
  });

  it("counts foreground child scenes but not parent settings", () => {
    const current = game();
    current.showScene("hub");
    const tick = current as unknown as { update(dt: number, elapsed: number): void };
    for (let frame = 0; frame < 300; frame += 1) tick.update(0.05, frame * 0.05);
    const afterHub = current.playTimeStatus().usedMs;
    expect(afterHub).toBeGreaterThanOrEqual(14_900);

    current.showScene("settings");
    for (let frame = 0; frame < 300; frame += 1) tick.update(0.05, 15 + frame * 0.05);
    expect(current.playTimeStatus().usedMs).toBe(afterHub);
  });

  it("finishes the current activity boundary, then opens a warm rest scene once", () => {
    const current = game();
    current.showScene("count");
    current.save.updateSettings((settings) => (settings.dailyPlayMinutes = 10));
    current.save.addActivePlayTime(10 * 60_000);

    expect(document.querySelector(".scene.count")).toBeTruthy();
    expect(current.allowPlayContinuation()).toBe(false);
    expect(document.querySelector(".rest-scene .rest-buddy.mood-sleep")).toBeTruthy();
    expect(document.querySelector(".rest-reward")?.textContent).toContain("+3 ruststerren");
    expect(current.data().progress.stars).toBe(3);

    current.showScene("rest");
    expect(document.querySelector(".rest-reward")).toBeNull();
    expect(current.data().progress.stars).toBe(3);
  });

  it("requires the adult gate and hold before granting ten extra minutes", () => {
    vi.useFakeTimers();
    const current = game();
    current.save.updateSettings((settings) => (settings.dailyPlayMinutes = 10));
    current.save.addActivePlayTime(10 * 60_000);
    current.showScene("hub");
    expect(document.querySelector(".rest-scene")).toBeTruthy();

    document.querySelector<HTMLButtonElement>('[aria-label="Voor volwassenen: geef 10 minuten extra"]')!.click();
    expect(document.querySelector(".parent-gate-card")?.getAttribute("role")).toBe("dialog");
    document.querySelector<HTMLButtonElement>('.parent-gate-option[data-correct="true"]')!.click();
    expect(document.querySelector(".parent-gate-question")?.textContent).toBe("Houd vast voor extra speeltijd");
    const hold = document.querySelector<HTMLButtonElement>(".parent-gate-hold")!;
    hold.dispatchEvent(new Event("pointerdown", { bubbles: true, cancelable: true }));
    vi.advanceTimersByTime(1_300);
    expect(document.querySelector(".rest-scene")).toBeTruthy();
    hold.dispatchEvent(new Event("pointerup", { bubbles: true, cancelable: true }));
    vi.advanceTimersByTime(1);

    expect(document.querySelector(".scene.hub")).toBeTruthy();
    expect(current.playTimeStatus()).toMatchObject({ reached: false, bonusMs: 10 * 60_000 });
  });

  it("persists the parent-selected daily limit", () => {
    const current = game();
    current.showScene("settings");
    const select = document.querySelector<HTMLSelectElement>("#playtime")!;
    select.value = "15";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    expect(current.data().settings.dailyPlayMinutes).toBe(15);
  });
});
