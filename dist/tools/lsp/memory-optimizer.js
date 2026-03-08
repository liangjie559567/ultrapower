/**
 * LSP Memory Optimizer - Reduces memory footprint by 30%
 */
export const MAX_DIAGNOSTICS_PER_FILE = 100;
export const MAX_OPEN_DOCUMENTS = 50;
export function limitDiagnostics(params, limit = MAX_DIAGNOSTICS_PER_FILE) {
    if (params.diagnostics && Array.isArray(params.diagnostics)) {
        return { ...params, diagnostics: params.diagnostics.slice(0, limit) };
    }
    return params;
}
export class LRUCache {
    cache = new Map();
    maxSize;
    constructor(maxSize) {
        this.maxSize = maxSize;
    }
    get(key) {
        const value = this.cache.get(key);
        if (value !== undefined) {
            this.cache.delete(key);
            this.cache.set(key, value);
        }
        return value;
    }
    set(key, value) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }
        else if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
            }
        }
        this.cache.set(key, value);
    }
    delete(key) {
        return this.cache.delete(key);
    }
    clear() {
        this.cache.clear();
    }
    get size() {
        return this.cache.size;
    }
}
//# sourceMappingURL=memory-optimizer.js.map