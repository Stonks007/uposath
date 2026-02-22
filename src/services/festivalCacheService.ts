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
 * If `year` is given, scans Jan 1–Dec 31 of that year instead of 365 days from today.
 */
export async function getPersistentFestivals(
    observer: Observer,
    forceRefresh = false,
    year?: number
): Promise<FestivalMatch[]> {
    const now = new Date();
    const targetYear = year ?? now.getFullYear();
    const cacheKey = year ? `${CACHE_KEY}_${year}` : CACHE_KEY;

    if (!forceRefresh) {
        const { value } = await Preferences.get({ key: cacheKey });
        if (value) {
            try {
                const data: CachedData = JSON.parse(value);
                const cacheDate = new Date(data.timestamp);

                const isSameDay = cacheDate.toDateString() === now.toDateString();
                const isSameLocation = Math.abs(data.lat - observer.latitude) < 0.1 &&
                    Math.abs(data.lng - observer.longitude) < 0.1;

                if (isSameDay && isSameLocation && data.year === targetYear) {
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

    let startDate: Date;
    let days: number;
    if (year) {
        startDate = new Date(year, 0, 1, 12, 0, 0);
        days = 365 + (new Date(year, 1, 29).getDate() === 29 ? 1 : 0); // leap year aware
    } else {
        startDate = now;
        days = 365;
    }

    const festivals = await getUpcomingFestivals(startDate, observer, days);

    // Save to cache
    const cacheData: CachedData = {
        timestamp: now.getTime(),
        lat: observer.latitude,
        lng: observer.longitude,
        year: targetYear,
        festivals: festivals
    };

    await Preferences.set({
        key: cacheKey,
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
