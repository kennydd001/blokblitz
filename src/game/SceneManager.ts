import type { Game } from "./Game";

export interface GameScene {
  readonly name: string;
  mount(params?: unknown): void;
  unmount(): void;
  update(dt: number): void;
}

export type SceneFactory = (game: Game) => GameScene;

export class SceneManager {
  private factories = new Map<string, SceneFactory>();
  private current?: GameScene;

  constructor(private readonly game: Game) {}

  register(name: string, factory: SceneFactory): void {
    this.factories.set(name, factory);
  }

  goTo(name: string, params?: unknown): void {
    // A scene change is a hard audio boundary. No delayed line from the old
    // scene may continue over the next activity.
    this.game.voice.cancel();
    this.current?.unmount();
    const factory = this.factories.get(name);
    if (!factory) throw new Error(`Unknown scene: ${name}`);
    this.game.overlay.replaceChildren();
    this.current = factory(this.game);
    this.current.mount(params);
  }

  update(dt: number): void {
    this.current?.update(dt);
  }

  getCurrentName(): string | undefined {
    return this.current?.name;
  }
}
