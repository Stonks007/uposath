/**
 * Uposatha Calculator Service
 *
 * Central logic for detecting Pakkha Uposatha days based on the
 * tithi (lunar day) prevailing at sunrise (Udaya Tithi).
 *
 * Uposatha days are:
 *   - 8th Tithi (Ashtami) in Shukla Paksha  → Sukka Aṭṭhamī
 *   - 8th Tithi (Ashtami) in Krishna Paksha → Kanhā Aṭṭhamī
 *   - 14th Tithi (Chaturdashi) in Shukla    → Sukka Cātuddasī
 *   - 14th Tithi (Chaturdashi) in Krishna   → Kanhā Cātuddasī
 *   - 15th Tithi (Purnima) — Full Moon      → Puṇṇamī
 *   - 30th Tithi (Amavasya) — New Moon      → Amāvāsī
 */
import { tithiNames, getTithiAtTime, type Panchangam } from '@ishubhamx/panchangam-js';
import { getPanchangam } from './panchangamService';
import type { Observer } from '@ishubhamx/panchangam-js';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UposathaStatus {
    /** Whether this day is an Uposatha day */
    isUposatha: boolean;
    /** 8th tithi (Shukla or Krishna) */
    isAshtami: boolean;
    /** 14th tithi (Shukla or Krishna) */
    isChaturdashi: boolean;
    /** Full Moon (Purnima, index 14) */
    isFullMoon: boolean;
    /** New Moon (Amavasya, index 29) */
    isNewMoon: boolean;
    /** Raw 0-indexed tithi from the library (0-29) */
    tithiIndex: number;
    /** Human-readable 1-indexed tithi number (1-30) */
    tithiNumber: number;
    /** Tithi name from the library constants */
    tithiName: string;
    /** "Shukla" or "Krishna" */
    paksha: string;
    /** Pali label for the Uposatha type, or empty string */
    paliLabel: string;
    /** Full display label */
    label: string;
    /** Sunrise time */
    sunrise: Date | null;
    /** Sunset time */
    sunset: Date | null;
    /** The raw panchangam for this day (for reuse by other services) */
    panchangam: Panchangam;
    /** Whether this is an optional/secondary observance (e.g. Skipped/Extended) */
    isOptional: boolean;
    /** Whether this is an "Optional" (Kshaya) tithi observance */
    isKshaya: boolean;
    /** Whether this is an "Extended" (Vridhi) tithi observance */
    isVridhi: boolean;
}

export interface UposathaDay {
    date: Date;
    status: UposathaStatus;
}

// ─── Constants ───────────────────────────────────────────────────────────────

/**
 * Uposatha tithi indices (0-indexed).
 *   7  = Shukla Ashtami (8th)
 *  13  = Shukla Chaturdashi (14th)
 *  14  = Purnima (Full Moon, 15th)
 *  22  = Krishna Ashtami (8th)
 *  28  = Krishna Chaturdashi (14th)
 *  29  = Amavasya (New Moon, 30th)
 */
const UPOSATHA_INDICES = new Set([7, 13, 14, 22, 28, 29]);

/** Pali names for each Uposatha tithi */
const PALI_LABELS: Record<number, string> = {
    7: 'Sukka Aṭṭhamī',
    13: 'Sukka Cātuddasī',
    14: 'Puṇṇamī (Pūrṇimā)',
    22: 'Kanhā Aṭṭhamī',
    28: 'Kanhā Cātuddasī',
    29: 'Amāvāsī (Amāvasyā)',
};

/** Short Uposatha type labels */
const UPOSATHA_TYPE: Record<number, string> = {
    7: 'Ashtami Uposatha',
    13: 'Chaturdashi Uposatha',
    14: 'Purnima Uposatha',
    22: 'Ashtami Uposatha',
    28: 'Chaturdashi Uposatha',
    29: 'Amavasya Uposatha',
};

// ─── Core Functions ──────────────────────────────────────────────────────────

/**
 * Get the Uposatha status for a specific date and location.
 *
 * The library's getPanchangam() already computes the tithi at sunrise
 * (it anchors all calculations to the sunrise time internally), so
 * panchangam.tithi IS the Udaya Tithi.
 */
export function getUposathaStatus(date: Date, observer: Observer): UposathaStatus {
    const p = getPanchangam(date, observer);

    // Use getTithiAtTime precisely at sunrise to find Udaya Tithi (0-indexed)
    let tithiAtSunrise = Math.floor(getTithiAtTime(p.sunrise || date)) - 1;
    if (isNaN(tithiAtSunrise) || tithiAtSunrise < 0) tithiAtSunrise = p.tithi;

    const tithiNumber = tithiAtSunrise + 1; // 1-30
    let isUposatha = UPOSATHA_INDICES.has(tithiAtSunrise);

    let isOptional = false;
    let isKshaya = false;
    let isVridhi = false;
    let kshayaTithi: number | null = null;
    let activeTithi = tithiAtSunrise;

    // Get tomorrow's Udaya Tithi
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const pTomorrow = getPanchangam(tomorrow, observer);
    let nextTithi = Math.floor(getTithiAtTime(pTomorrow.sunrise || tomorrow)) - 1;
    if (isNaN(nextTithi) || nextTithi < 0) nextTithi = pTomorrow.tithi;

    // Get yesterday's Udaya Tithi for Vridhi check
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    const pYesterday = getPanchangam(yesterday, observer);
    let prevTithi = Math.floor(getTithiAtTime(pYesterday.sunrise || yesterday)) - 1;
    if (isNaN(prevTithi) || prevTithi < 0) prevTithi = pYesterday.tithi;

    // 1. Determine Tithi Differences
    const tithiDiff = (nextTithi - tithiAtSunrise + 30) % 30;

    // 2. Resolve 14-day Paksha (Chaturdashi Uposatha)
    if (tithiAtSunrise === 13 || tithiAtSunrise === 28) {
        // If the upcoming Purnima (14) or Amavasya (29) is skipped before the next sunrise (tithiDiff > 1)
        // Then today becomes the PRIMARY Chaturdashi Uposatha.
        if (tithiDiff > 1) {
            isUposatha = true;
            activeTithi = tithiAtSunrise;
        }
    }
    if (tithiDiff > 1 && !isUposatha) {
        for (let i = 1; i < tithiDiff; i++) {
            const skipped = (tithiAtSunrise + i) % 30;
            // If an Uposatha target is skipped, mark today as an optional observance, BUT NOT a primary Uposatha.
            if (UPOSATHA_INDICES.has(skipped)) {
                isOptional = true;
                isKshaya = true;
                kshayaTithi = skipped;
                activeTithi = skipped;
                break;
            }
        }
    }

    // 3. Handle Vridhi (Extended) Tithis
    if (isUposatha && prevTithi === tithiAtSunrise) {
        // Same tithi at sunrise two days in a row! 
        // We mark the second day as the optional/extended observance.
        isUposatha = false; // Primary was yesterday
        isOptional = true;
        isVridhi = true;
    }

    const paliLabel = PALI_LABELS[activeTithi] ?? '';
    const uposathaType = UPOSATHA_TYPE[activeTithi] ?? '';

    let label = `${tithiNames[tithiAtSunrise]} — ${p.paksha} Paksha`;
    if (isUposatha) {
        label = `${uposathaType} (${paliLabel}) — Pakkha Uposatha`;
        if (isKshaya) label += ` [Kshaya: ${tithiNames[activeTithi]}]`;
    } else if (isOptional) {
        if (isVridhi) {
            label = `Vridhi: ${uposathaType}`;
        } else if (isKshaya) { // Fallback if optional kshaya was ever set
            label = `Kshaya: ${tithiNames[activeTithi]} (${uposathaType})`;
        }
    }

    return {
        isUposatha,
        isAshtami: activeTithi === 7 || activeTithi === 22,
        isChaturdashi: activeTithi === 13 || activeTithi === 28,
        isFullMoon: activeTithi === 14,
        isNewMoon: activeTithi === 29,
        tithiIndex: tithiAtSunrise,
        tithiNumber,
        tithiName: tithiNames[tithiAtSunrise],
        paksha: p.paksha,
        paliLabel,
        label,
        sunrise: p.sunrise,
        sunset: p.sunset,
        panchangam: p,
        isOptional,
        isKshaya,
        isVridhi,
    };
}

/**
 * Get all Uposatha days in a given Gregorian month.
 * Returns only the days that are Uposatha.
 */
export function getMonthUposathaDays(
    year: number,
    month: number, // 0-indexed (0 = January)
    observer: Observer
): UposathaDay[] {
    const results: UposathaDay[] = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day, 6, 0, 0); // 6 AM local for stable sunrise calc
        const status = getUposathaStatus(date, observer);
        if (status.isUposatha || status.isOptional) {
            results.push({ date, status });
        }
    }

    return results;
}

/**
 * Get all Uposatha days in a given year.
 * Aggregates all 12 months. Expect ~72 Uposatha days per year.
 */
export function getYearUposathaDays(
    year: number,
    observer: Observer
): UposathaDay[] {
    const results: UposathaDay[] = [];
    for (let month = 0; month < 12; month++) {
        results.push(...getMonthUposathaDays(year, month, observer));
    }
    return results;
}

/**
 * Find the next upcoming Uposatha day (including today if applies).
 * Search limit: 30 days to prevent infinite loops.
 */
export function getNextUposatha(
    startDate: Date,
    observer: Observer
): UposathaDay | null {
    const date = new Date(startDate);
    date.setHours(6, 0, 0, 0); // Normalize check time

    for (let i = 0; i < 30; i++) {
        const status = getUposathaStatus(date, observer);
        if (status.isUposatha || status.isOptional) {
            return { date: new Date(date), status };
        }
        date.setDate(date.getDate() + 1);
    }
    return null;
}
