/**
 * Simple event bus for hook decoupling
 */
type EventHandler = (data: unknown) => void | Promise<void>;
declare class EventBus {
    private handlers;
    on(event: string, handler: EventHandler): void;
    emit(event: string, data?: unknown): Promise<void>;
}
export declare const hookEventBus: EventBus;
export {};
//# sourceMappingURL=event-bus.d.ts.map