/**
 * Simple in-memory cache with TTL (Time To Live).
 * Used for high-frequency aggregated dashboard cards with 60-second caching per academy.
 */

const cacheStore = new Map();

/**
 * Gets a cached item if it exists and has not expired.
 *
 * @param {string} key - Cache key
 * @returns {any|null} - Cached value or null
 */
export function getCache(key) {
  const item = cacheStore.get(key);
  if (!item) {
    return null;
  }

  if (Date.now() > item.expiresAt) {
    cacheStore.delete(key);
    return null;
  }

  return item.data;
}

/**
 * Stores an item in the cache with a specified TTL.
 *
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttlSeconds - Time to live in seconds (default: 60)
 */
export function setCache(key, data, ttlSeconds = 60) {
  cacheStore.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Invalidates a specific cache key.
 *
 * @param {string} key - Cache key to remove
 */
export function invalidateCache(key) {
  cacheStore.delete(key);
}

/**
 * Clears dashboard overview cache for a specific academy.
 *
 * @param {number} academyId
 */
export function clearDashboardCache(academyId) {
  if (academyId) {
    cacheStore.delete(`dashboard_overview_${academyId}`);
  }
}

/**
 * Clears the entire cache store.
 */
export function clearAllCache() {
  cacheStore.clear();
}

export default {
  getCache,
  setCache,
  invalidateCache,
  clearDashboardCache,
  clearAllCache,
};
