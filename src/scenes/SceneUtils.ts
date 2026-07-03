import type { Game } from "../game/Game";
import type { InputAction } from "../game/InputManager";
import type { GameScene } from "../game/SceneManager";

export abstract class BaseScene implements GameScene {
  protected readonly root = document.createElement("section");
  private cleanups: Array<() => void> = [];

  protected constructor(protected readonly game: Game, readonly name: string) {
    this.root.className = `scene ${name}`;
  }

  mount(_params?: unknown): void {
    this.game.overlay.appendChild(this.root);
  }

  unmount(): void {
    for (const cleanup of this.cleanups) cleanup();
    this.cleanups = [];
    this.root.remove();
  }

  update(_dt: number): void {}

  protected onInput(handler: (action: InputAction) => void): void {
    this.cleanups.push(this.game.input.subscribe((action) => handler(action)));
  }

  protected addCleanup(cleanup: () => void): void {
    this.cleanups.push(cleanup);
  }

  protected button(label: string, onClick: () => void, className = "primary"): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = `btn ${className}`;
    button.type = "button";
    button.dataset.action = label;
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  protected iconButton(label: string, icon: "menu" | "back" | "refresh", onClick: () => void, className = "ghost"): HTMLButtonElement {
    const button = this.button(label, onClick, `${className} icon-btn ${icon}`);
    button.setAttribute("aria-label", label);
    button.innerHTML = `<span class="control-icon ${icon}" aria-hidden="true"></span><span class="sr-only">${label}</span>`;
    return button;
  }

  protected stat(label: string, value: string | number): HTMLElement {
    const pill = document.createElement("div");
    pill.className = "stat-pill";
    pill.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
    return pill;
  }
}

export function sceneHeader(title: string, subtitle?: string): HTMLElement {
  const header = document.createElement("header");
  header.className = "scene-header";
  header.innerHTML = `<h1>${title}</h1>${subtitle ? `<p>${subtitle}</p>` : ""}`;
  return header;
}
