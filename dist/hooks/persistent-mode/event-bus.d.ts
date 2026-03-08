/**
 * Simple event bus for hook decoupling
 */
type EventHandler = (data: any) => void | Promise<void>;
declare class EventBus {
    private handlers;
    on(event: string, handler: EventHandler): void;
    emit(event: string, data?: any): Promise<void>;
}
export declare const hookEventBus: EventBus;
export {};
//# sourceMappingURL=event-bus.d.ts.map