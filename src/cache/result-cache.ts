interface CacheEntry<T> {
  value: T;
  expiry: number;
  userId: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
}

export class ResultCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder: string[] = [];
  private hits = 0;
  private misses = 0;

  constructor(
    private maxSize: number = 1000,
    private ttlMs: number = 300000
  ) {}

  set(key: string, value: T, userId: string): void {
    const fullKey = `${userId}:${key}`;

    if (this.cache.size >= this.maxSize && !this.cache.has(fullKey)) {
      const oldest = this.accessOrder.shift();
      if (oldest) this.cache.delete(oldest);
    }

    this.cache.set(fullKey, {
      value,
      expiry: Date.now() + this.ttlMs,
      userId
    });

    const idx = this.accessOrder.indexOf(fullKey);
    if (idx > -1) this.accessOrder.splice(idx, 1);
    this.accessOrder.push(fullKey);
  }

  get(key: string, userId: string): T | null {
    const fullKey = `${userId}:${key}`;
    const entry = this.cache.get(fullKey);

    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiry || entry.userId !== userId) {
      this.cache.delete(fullKey);
      this.misses++;
      return null;
    }

    this.hits++;
    const idx = this.accessOrder.indexOf(fullKey);
    if (idx > -1) {
      this.accessOrder.splice(idx, 1);
      this.accessOrder.push(fullKey);
    }

    return entry.value;
  }

  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0
    };
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.hits = 0;
    this.misses = 0;
  }
}
