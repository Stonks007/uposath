/**
 * Hora Calculator Service
 *
 * Calculates the planetary hours (Horas) for a given day.
 * Each day is divided into 12 day horas and 12 night horas.
 * The sequence of rulers follows the Chaldean order.
 */

import { type Observer } from '@ishubhamx/panchangam-js';
import { getPanchangam } from './panchangamService';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface HoraSegment {
    horaNumber: number; // 1-24
    planet: string; // 'Sun', 'Moon', etc.
    planetSymbol: string;
    startTime: Date;
    endTime: Date;
    isDayHora: boolean;
    isCurrent: boolean;
    rulerIndex: number; // 0-6 index in CHALDEAN_ORDER
}

// ─── Constants ───────────────────────────────────────────────────────────────

// Chaldean order: Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon
// This is the order in which planetary rulers cycle.
const CHALDEAN_ORDER = [
    'Saturn',
    'Jupiter',
    'Mars',
    'Sun',
    'Venus',
    'Mercury',
    'Moon',
];

const PLANET_SYMBOLS: Record<string, string> = {
    Sun: '☉',
    Moon: '☽',
    Mars: '♂',
    Mercury: '☿',
    Jupiter: '♃',
    Venus: '♀',
    Saturn: '♄',
};

// Map weekday (0=Sun, 1=Mon...) to starting planet index in Chaldean order
// Sunday (0) -> Sun (index 3)
// Monday (1) -> Moon (index 6)
// Tuesday (2) -> Mars (index 2)
// Wednesday (3) -> Mercury (index 5)
// Thursday (4) -> Jupiter (index 1)
// Friday (5) -> Venus (index 4)
// Saturday (6) -> Saturn (index 0)
const DAY_START_INDEX = [3, 6, 2, 5, 1, 4, 0];

// ─── Core Function ───────────────────────────────────────────────────────────

/**
 * Compute the 24 Horas for a given day.
 *
 * Needs sunrise/sunset for the current day, and sunrise for the next day.
 * Since the library doesn't expose next-day sunrise directly in the
 * today-panchangam, we calculate it by requesting the panchangam for
 * the next day.
 */
export function computeHoras(date: Date, observer: Observer): HoraSegment[] {
    // 1. Get Today's details (sunrise, sunset, weekday)
    const todayPanchang = getPanchangam(date, observer);
    const sunrise = todayPanchang.sunrise;
    const sunset = todayPanchang.sunset;
    const weekday = todayPanchang.vara; // 0=Sun, ... 6=Sat

    // 2. Get Next Day's sunrise
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextDayPanchang = getPanchangam(tomorrow, observer);
    const nextSunrise = nextDayPanchang.sunrise;

    // If we can't get astronomical data (e.g. polar region), return empty
    if (!sunrise || !sunset || !nextSunrise) {
        return [];
    }

    const segments: HoraSegment[] = [];
    const now = new Date(); // To mark current hora

    // Calculate durations
    const dayDurationMs = sunset.getTime() - sunrise.getTime();
    const nightDurationMs = nextSunrise.getTime() - sunset.getTime();

    const dayHoraDuration = dayDurationMs / 12;
    const nightHoraDuration = nightDurationMs / 12;

    // Determine starting planet index
    let currentPlanetIndex = DAY_START_INDEX[weekday];

    // ─── Day Horas (1-12) ───
    for (let i = 0; i < 12; i++) {
        const startMs = sunrise.getTime() + i * dayHoraDuration;
        const endMs = startMs + dayHoraDuration;
        const startTime = new Date(startMs);
        const endTime = new Date(endMs);

        const planetName = CHALDEAN_ORDER[currentPlanetIndex];

        segments.push({
            horaNumber: i + 1,
            planet: planetName,
            planetSymbol: PLANET_SYMBOLS[planetName] || '',
            startTime,
            endTime,
            isDayHora: true,
            isCurrent: now >= startTime && now < endTime,
            rulerIndex: currentPlanetIndex,
        });

        // Move to next planet (cyclic)
        currentPlanetIndex = (currentPlanetIndex + 1) % 7;
    }

    // ─── Night Horas (13-24) ───
    for (let i = 0; i < 12; i++) {
        const startMs = sunset.getTime() + i * nightHoraDuration;
        const endMs = startMs + nightHoraDuration;
        const startTime = new Date(startMs);
        const endTime = new Date(endMs);

        const planetName = CHALDEAN_ORDER[currentPlanetIndex];

        segments.push({
            horaNumber: 13 + i,
            planet: planetName,
            planetSymbol: PLANET_SYMBOLS[planetName] || '',
            startTime,
            endTime,
            isDayHora: false,
            isCurrent: now >= startTime && now < endTime,
            rulerIndex: currentPlanetIndex,
        });

        // Move to next planet (cyclic)
        currentPlanetIndex = (currentPlanetIndex + 1) % 7;
    }

    return segments;
}

/**
 * Get the current active Hora segment.
 */
export function getCurrentHora(
    date: Date,
    observer: Observer
): HoraSegment | null {
    const horas = computeHoras(date, observer);
    const now = new Date();
    return horas.find((h) => now >= h.startTime && now < h.endTime) || null;
}
