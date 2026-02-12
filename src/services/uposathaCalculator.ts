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
import { tithiNames, type Panchangam } from '@ishubhamx/panchangam-js';
import { getPanchangam } from './panchangamService';
import type { Observer } from 'astronomy-engine';

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
    /** Whether this is a "Skipped" (Kshaya) tithi observance */
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
    const tithi = p.tithi; // 0-indexed, computed at sunrise
    const tithiNumber = tithi + 1; // 1-30
    let isUposatha = UPOSATHA_INDICES.has(tithi);
    // Optional Flags
    let isOptional = false;
    let isKshaya = false;
    let isVridhi = false;
    let kshayaTithi: number | null = null;

    // 1. Handle Tithi Kshaya (Skipped Tithi) - Restoration as Optional
    // Performance optimization: Only check if current tithi is close to an Uposatha tithi
    const potentialKshayaTargets = [6, 7, 12, 13, 14, 21, 22, 27, 28, 29];
    if (potentialKshayaTargets.includes(tithi)) {
        const tomorrow = new Date(date);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const pTomorrow = getPanchangam(tomorrow, observer);
        const nextTithi = pTomorrow.tithi;

        // Check if an Uposatha tithi is skipped between this sunrise and next
        for (const target of UPOSATHA_INDICES) {
            let isSkipped = false;
            if (nextTithi > tithi) {
                isSkipped = target > tithi && target < nextTithi;
            } else if (nextTithi < tithi) {
                // Wrap around at 29 -> 0
                isSkipped = target > tithi || target < nextTithi;
            }

            if (isSkipped) {
                // Mark as optional observance for the skipped tithi
                isOptional = true;
                isKshaya = true;
                kshayaTithi = target;
                break;
            }
        }
    }

    // 2. Handle Tithi Vridhi (Extended Tithi) - Optional
    // If today is an Uposatha tithi, but yesterday was ALSO the same tithi,
    // then today is the "extended" observance (second day).
    if (isUposatha) {
        const yesterday = new Date(date);
        yesterday.setDate(yesterday.getDate() - 1);
        const pYesterday = getPanchangam(yesterday, observer);
        if (pYesterday.tithi === tithi) {
            // It's the same tithi as yesterday
            isUposatha = false; // It's not the primary observance
            isOptional = true;
            isVridhi = true;
        }
    }

    const activeTithi = kshayaTithi !== null ? kshayaTithi : tithi;
    const paliLabel = PALI_LABELS[activeTithi] ?? '';
    const uposathaType = UPOSATHA_TYPE[activeTithi] ?? '';

    let label = `${tithiNames[tithi]} — ${p.paksha} Paksha`;
    if (isUposatha) {
        label = `${uposathaType} (${paliLabel}) — Pakkha Uposatha`;
    } else if (isOptional) {
        if (isKshaya && kshayaTithi !== null) {
            label = `Kshaya: ${tithiNames[kshayaTithi]} (${UPOSATHA_TYPE[kshayaTithi]})`;
        } else if (isVridhi) {
            label = `Vridhi: ${uposathaType}`;
        }
    }

    return {
        isUposatha,
        isAshtami: activeTithi === 7 || activeTithi === 22,
        isChaturdashi: activeTithi === 13 || activeTithi === 28,
        isFullMoon: activeTithi === 14,
        isNewMoon: activeTithi === 29,
        tithiIndex: tithi,
        tithiNumber,
        tithiName: tithiNames[tithi],
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
