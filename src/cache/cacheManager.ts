interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private ttlMinutes: number;

  constructor(ttlMinutes: number = 1440) {
    this.ttlMinutes = ttlMinutes;
  }

  private createKey(namespace: string, key: string): string {
    return `${namespace}:${key}`;
  }

  set<T>(namespace: string, key: string, value: T): void {
    const cacheKey = this.createKey(namespace, key);
    const expiresAt = Date.now() + this.ttlMinutes * 60 * 1000;
    this.cache.set(cacheKey, { value, expiresAt });
  }

  get<T>(namespace: string, key: string): T | null {
    const cacheKey = this.createKey(namespace, key);
    const entry = this.cache.get(cacheKey);

    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.value as T;
  }

  has(namespace: string, key: string): boolean {
    return this.get(namespace, key) !== null;
  }

  clear(): void {
    this.cache.clear();
  }

  stats(): { size: number; entries: string[] } {
    const now = Date.now();
    const valid = Array.from(this.cache.entries())
      .filter(([_, entry]) => now <= entry.expiresAt)
      .map(([key]) => key);

    return {
      size: valid.length,
      entries: valid,
    };
  }
}

export const cacheManager = new CacheManager();
