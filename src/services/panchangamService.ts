
import { getPanchangam as getPanchangamRaw, type Panchangam } from '@ishubhamx/panchangam-js';
import type { Observer } from '@ishubhamx/panchangam-js';

const panchangamCache = new Map<string, Panchangam>();

/**
 * Cached version of getPanchangam to avoid redundant expensive calculations.
 */
export function getPanchangam(date: Date, observer: Observer): Panchangam {
    // We use YYYY-MM-DD + Lat/Long as the cache key
    // astronomy-engine's Observer has latitude and longitude
    const dateKey = date.toISOString().split('T')[0];
    const key = `${dateKey}_${observer.latitude.toFixed(4)}_${observer.longitude.toFixed(4)}`;

    if (panchangamCache.has(key)) {
        return panchangamCache.get(key)!;
    }

    const p = getPanchangamRaw(date, observer);
    panchangamCache.set(key, p);

    // Keep cache size reasonable (~500 entries covers >1 year of lookups)
    if (panchangamCache.size > 500) {
        const firstKey = panchangamCache.keys().next().value;
        if (firstKey) panchangamCache.delete(firstKey);
    }

    return p;
}

/**
 * Clear the cache (useful for testing or manual refresh)
 */
export function clearPanchangamCache() {
    panchangamCache.clear();
}
