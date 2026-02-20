/**
 * Festival Cache Service
 * 
 * Persistently stores the pre-calculated festival list to disk
 * using Capacitor Preferences to avoid expensive daily scans.
 */
import { Preferences } from '@capacitor/preferences';
import { Observer } from '@ishubhamx/panchangam-js';
import { getUpcomingFestivals, initMahayanaCalendar, type FestivalMatch } from './buddhistFestivalService';

const CACHE_KEY = 'buddhist_festivals_cache_v2';

interface CachedData {
    timestamp: number;
    lat: number;
    lng: number;
    year: number;
    festivals: any[]; // Serialized FestivalMatch
}

/**
 * Gets festivals from cache if valid, otherwise performs a fresh scan.
 */
export async function getPersistentFestivals(
    observer: Observer,
    forceRefresh = false
): Promise<FestivalMatch[]> {
    const now = new Date();
    const currentYear = now.getFullYear();

    if (!forceRefresh) {
        const { value } = await Preferences.get({ key: CACHE_KEY });
        if (value) {
            try {
                const data: CachedData = JSON.parse(value);
                const cacheDate = new Date(data.timestamp);

                // Cache is valid if:
                // 1. It was generated today (prevents stale "daysRemaining")
                // 2. Location is roughly the same (within ~10km for safety)
                // 3. Year matches
                const isSameDay = cacheDate.toDateString() === now.toDateString();
                const isSameLocation = Math.abs(data.lat - observer.latitude) < 0.1 &&
                    Math.abs(data.lng - observer.longitude) < 0.1;

                if (isSameDay && isSameLocation && data.year === currentYear) {
                    // Restore Date objects which were serialized to strings
                    return data.festivals.map(f => ({
                        ...f,
                        date: new Date(f.date)
                    })) as FestivalMatch[];
                }
            } catch (e) {
                console.warn('Failed to parse festival cache', e);
            }
        }
    }

    // Perform fresh scan
    await initMahayanaCalendar();
    const festivals = getUpcomingFestivals(now, observer, 365);

    // Save to cache
    const cacheData: CachedData = {
        timestamp: now.getTime(),
        lat: observer.latitude,
        lng: observer.longitude,
        year: currentYear,
        festivals: festivals
    };

    await Preferences.set({
        key: CACHE_KEY,
        value: JSON.stringify(cacheData)
    });

    return festivals;
}

/**
 * Warms up the cache in the background if it doesn't exist.
 */
export async function warmUpFestivalCache(observer: Observer) {
    const { value } = await Preferences.get({ key: CACHE_KEY });
    if (!value) {
        // Run in background without awaiting the scan
        getPersistentFestivals(observer).catch(console.error);
    }
}
