export type TickHandler = (dt: number, elapsed: number) => void;

export class GameLoop {
  private animationId = 0;
  private last = 0;
  private elapsed = 0;

  constructor(private readonly onTick: TickHandler) {}

  start(): void {
    this.last = performance.now();
    const tick = (time: number): void => {
      const dt = Math.min(0.05, (time - this.last) / 1000);
      this.last = time;
      this.elapsed += dt;
      this.onTick(dt, this.elapsed);
      this.animationId = requestAnimationFrame(tick);
    };
    this.animationId = requestAnimationFrame(tick);
  }

  stop(): void {
    cancelAnimationFrame(this.animationId);
  }
}

