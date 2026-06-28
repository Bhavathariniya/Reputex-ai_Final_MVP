/**
 * Minimal in-memory TTL cache.
 *
 * Good enough for a single-instance MVP and to politely rate-limit ourselves
 * against upstream providers. For multi-instance production, swap this module
 * for Redis (same interface) — see SCALING notes in backend/README.md.
 */
interface Entry {
  value: unknown;
  expiresAt: number;
}

const store = new Map<string, Entry>();

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function cacheSet(key: string, value: unknown, ttlSeconds: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

/** Memoize an async function by key for `ttlSeconds`. */
export async function cached<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
  const hit = cacheGet<T>(key);
  if (hit !== undefined) return hit;
  const value = await fn();
  cacheSet(key, value, ttlSeconds);
  return value;
}

/**
 * Like `cached`, but only stores the result when `shouldCache(value)` is true.
 * This prevents a transient provider failure (which yields an "unavailable"
 * result) from poisoning the cache for the whole TTL — failures are retried on
 * the next request instead of being served stale.
 */
export async function cachedIf<T>(
  key: string,
  ttlSeconds: number,
  shouldCache: (value: T) => boolean,
  fn: () => Promise<T>,
): Promise<T> {
  const hit = cacheGet<T>(key);
  if (hit !== undefined) return hit;
  const value = await fn();
  if (shouldCache(value)) cacheSet(key, value, ttlSeconds);
  return value;
}
