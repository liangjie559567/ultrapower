/**
 * Simple event bus for hook decoupling
 */

type EventHandler = (data: unknown) => void | Promise<void>;

class EventBus {
  private handlers = new Map<string, EventHandler[]>();

  on(event: string, handler: EventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);
  }

  async emit(event: string, data?: unknown): Promise<void> {
    const handlers = this.handlers.get(event) || [];
    await Promise.allSettled(handlers.map(h => h(data)));
  }
}

export const hookEventBus = new EventBus();
