export type InputAction = "left" | "right" | "up" | "confirm" | "pause";
export type InputEvent = KeyboardEvent | PointerEvent | TouchEvent;
export type InputHandler = (action: InputAction, event: InputEvent) => void;

interface PointerStart {
  x: number;
  y: number;
}

export class InputManager {
  private static readonly minSwipeDistance = 46;
  private handlers = new Set<InputHandler>();
  private attached = false;
  private pointerStart?: PointerStart;
  private touchStart?: PointerStart;
  private lastSwipeEmitAt = 0;
  private lastSwipeEventKind?: "pointer" | "touch";

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    const action = this.mapKey(event);
    if (!action) return;
    event.preventDefault();
    this.emit(action, event);
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (!this.isPrimaryPointer(event)) return;
    this.pointerStart = { x: event.clientX, y: event.clientY };
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    if (!this.pointerStart || !this.isPrimaryPointer(event)) return;
    const dx = event.clientX - this.pointerStart.x;
    const dy = event.clientY - this.pointerStart.y;
    this.pointerStart = undefined;

    const action = this.mapSwipe(dx, dy);
    if (!action) return;
    if (event.cancelable) event.preventDefault();
    this.emitSwipe(action, event);
  };

  private readonly onPointerCancel = (): void => {
    this.pointerStart = undefined;
  };

  private readonly onTouchStart = (event: TouchEvent): void => {
    const touch = event.changedTouches[0];
    if (!touch) return;
    this.touchStart = { x: touch.clientX, y: touch.clientY };
  };

  private readonly onTouchEnd = (event: TouchEvent): void => {
    const start = this.touchStart;
    const touch = event.changedTouches[0];
    if (!start || !touch) return;
    this.touchStart = undefined;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const action = this.mapSwipe(dx, dy);
    if (!action) return;
    if (event.cancelable) event.preventDefault();
    this.emitSwipe(action, event);
  };

  private readonly onTouchCancel = (): void => {
    this.touchStart = undefined;
  };

  attach(): void {
    if (this.attached) return;
    this.attached = true;
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("pointerdown", this.onPointerDown, { passive: true });
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.onPointerCancel);
    window.addEventListener("touchstart", this.onTouchStart, { passive: true });
    window.addEventListener("touchend", this.onTouchEnd);
    window.addEventListener("touchcancel", this.onTouchCancel);
  }

  detach(): void {
    if (!this.attached) return;
    this.attached = false;
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointercancel", this.onPointerCancel);
    window.removeEventListener("touchstart", this.onTouchStart);
    window.removeEventListener("touchend", this.onTouchEnd);
    window.removeEventListener("touchcancel", this.onTouchCancel);
    this.pointerStart = undefined;
    this.touchStart = undefined;
    this.handlers.clear();
  }

  subscribe(handler: InputHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  private emit(action: InputAction, event: InputEvent): void {
    for (const handler of this.handlers) handler(action, event);
  }

  private emitSwipe(action: InputAction, event: PointerEvent | TouchEvent): void {
    const now = Date.now();
    const kind = "changedTouches" in event ? "touch" : "pointer";
    if (this.lastSwipeEventKind && this.lastSwipeEventKind !== kind && now - this.lastSwipeEmitAt < 120) return;
    this.lastSwipeEmitAt = now;
    this.lastSwipeEventKind = kind;
    this.emit(action, event);
  }

  private isPrimaryPointer(event: PointerEvent): boolean {
    return !("isPrimary" in event) || event.isPrimary;
  }

  private mapSwipe(dx: number, dy: number): InputAction | undefined {
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (absX < InputManager.minSwipeDistance && absY < InputManager.minSwipeDistance) return undefined;
    if (absX > absY * 1.15) return dx < 0 ? "left" : "right";
    if (dy < 0 && absY > absX * 1.15) return "up";
    return undefined;
  }

  private mapKey(event: KeyboardEvent): InputAction | undefined {
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") return "left";
    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") return "right";
    if (event.key === "ArrowUp" || event.key.toLowerCase() === "w" || event.key === " ") return "up";
    if (event.key === "Enter") return "confirm";
    if (event.key === "Escape") return "pause";
    return undefined;
  }
}
