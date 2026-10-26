import { env } from '../config/env.js';
import { logger } from './logger.js';

/**
 * In-memory TTL cache with automatic cleanup and statistics
 * Used to deduplicate repeated searches and comply with provider API limits
 */
class MemoryCache {
  constructor(defaultTtlSeconds = env.CACHE_TTL_SECONDS) {
    this.defaultTtlMs = defaultTtlSeconds * 1000;
    this.store = new Map();
    this.hits = 0;
    this.misses = 0;

    // Periodic sweep every 5 minutes to prevent memory leaks
    this.cleanupInterval = setInterval(() => this.cleanupExpired(), 5 * 60 * 1000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  generateKey(prefix, params) {
    const sorted = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        if (params[key] !== undefined && params[key] !== null) {
          acc[key] = params[key];
        }
        return acc;
      }, {});
    return `${prefix}:${JSON.stringify(sorted)}`;
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses += 1;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses += 1;
      return null;
    }

    this.hits += 1;
    return entry.value;
  }

  set(key, value, ttlMs = this.defaultTtlMs) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
      createdAt: new Date().toISOString(),
    });
  }

  cleanupExpired() {
    const now = Date.now();
    let purged = 0;
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        purged += 1;
      }
    }
    if (purged > 0) {
      logger.debug(`Cache cleanup purged ${purged} expired entries`);
    }
  }

  getStats() {
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0 ? (this.hits / (this.hits + this.misses)).toFixed(2) : 0,
    };
  }

  clear() {
    this.store.clear();
  }
}

export const flightCache = new MemoryCache();
