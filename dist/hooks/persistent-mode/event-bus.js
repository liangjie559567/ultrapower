/**
 * Simple event bus for hook decoupling
 */
class EventBus {
    handlers = new Map();
    on(event, handler) {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, []);
        }
        this.handlers.get(event).push(handler);
    }
    async emit(event, data) {
        const handlers = this.handlers.get(event) || [];
        await Promise.allSettled(handlers.map(h => h(data)));
    }
}
export const hookEventBus = new EventBus();
//# sourceMappingURL=event-bus.js.map