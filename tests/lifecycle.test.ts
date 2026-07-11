// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { GameLoop } from "../src/game/GameLoop";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  Reflect.deleteProperty(document, "hidden");
  document.body.innerHTML = "";
  localStorage.clear();
});

describe("mobile lifecycle", () => {
  it("runs one animation loop and can restart cleanly after a pause", () => {
    let callback: FrameRequestCallback | undefined;
    let nextId = 0;
    const request = vi.fn((next: FrameRequestCallback) => {
      callback = next;
      nextId += 1;
      return nextId;
    });
    const cancel = vi.fn();
    vi.stubGlobal("requestAnimationFrame", request);
    vi.stubGlobal("cancelAnimationFrame", cancel);

    const tick = vi.fn();
    const loop = new GameLoop(tick);
    loop.start();
    loop.start();
    expect(request).toHaveBeenCalledTimes(1);

    callback?.(100);
    expect(tick).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledTimes(2);

    loop.stop();
    expect(cancel).toHaveBeenCalledTimes(1);
    callback?.(200);
    expect(tick).toHaveBeenCalledTimes(1);

    loop.start();
    expect(request).toHaveBeenCalledTimes(3);
  });

  it("defers 3D warmup, pauses media while hidden, and exposes status messages", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    document.body.innerHTML = '<div id="app"></div>';

    const { Game } = await import("../src/game/Game");
    const game = new Game(document.querySelector<HTMLElement>("#app")!);
    const warm = vi.spyOn(game, "ensureStage3d").mockResolvedValue(undefined as never);
    const voicePause = vi.spyOn(game.voice, "pause");
    const voiceResume = vi.spyOn(game.voice, "resume");
    const musicPause = vi.spyOn(game.audio, "pauseForBackground");
    const musicResume = vi.spyOn(game.audio, "resumeFromBackground");

    game.start();
    expect(warm).not.toHaveBeenCalled();
    window.dispatchEvent(new Event("pointerdown"));
    expect(warm).toHaveBeenCalledTimes(1);

    voicePause.mockClear();
    voiceResume.mockClear();
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(voicePause).toHaveBeenCalledTimes(1);
    expect(musicPause).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(voiceResume).toHaveBeenCalledTimes(1);
    expect(musicResume).toHaveBeenCalledTimes(1);

    game.flashMessage("Klaar!");
    expect(document.querySelector('.toast[role="status"][aria-atomic="true"]')?.textContent).toBe("Klaar!");
    voicePause.mockClear();
    game.stop();
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(voicePause).not.toHaveBeenCalled();
  });
});
