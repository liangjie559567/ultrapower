export class HookRegistry {
    processors = new Map();
    register(hookType, processor) {
        this.processors.set(hookType, processor);
    }
    get(hookType) {
        return this.processors.get(hookType);
    }
    has(hookType) {
        return this.processors.has(hookType);
    }
}
export const registry = new HookRegistry();
//# sourceMappingURL=HookRegistry.js.map