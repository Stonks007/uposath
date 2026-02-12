/**
 * Panchang Timeline Service
 *
 * Transforms raw Panchangam transition data into normalized timeline
 * segments suitable for rendering a horizontal 24-hour visualization.
 */
import { dayNames, type Panchangam, type TithiTransition, type NakshatraTransition, type YogaTransition, type KaranaTransition } from '@ishubhamx/panchangam-js';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TimelineSegment {
    /** Display name of the element (e.g. "Dashami", "Rohini") */
    name: string;
    /** Segment start time */
    startTime: Date;
    /** Segment end time */
    endTime: Date;
    /** True if this segment is the one active at sunrise */
    isPrimary: boolean;
}

export interface TimelineRow {
    /** Row type identifier */
    type: 'tithi' | 'nakshatra' | 'yoga' | 'karana' | 'vara';
    /** Display label */
    label: string;
    /** Icon/emoji for the row */
    icon: string;
    /** Array of segments spanning the day, ordered by time */
    segments: TimelineSegment[];
}

export interface TimelineData {
    /** All timeline rows */
    rows: TimelineRow[];
    /** Sunrise time (for marker rendering) */
    sunrise: Date | null;
    /** Sunset time (for marker rendering) */
    sunset: Date | null;
    /** Moonrise time */
    moonrise: Date | null;
    /** Moonset time */
    moonset: Date | null;
    /** Raw panchangam for festival detection */
    panchangam: Panchangam;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapTransitions<T extends { name: string; startTime: Date; endTime: Date }>(
    transitions: T[],
    sunrise: Date | null
): TimelineSegment[] {
    if (!transitions || transitions.length === 0) return [];

    return transitions.map((t, i) => ({
        name: t.name,
        startTime: t.startTime,
        endTime: t.endTime,
        // The first segment starts at sunrise, so mark it as primary
        isPrimary: i === 0,
    }));
}

// ─── Core Function ───────────────────────────────────────────────────────────

/**
 * Build timeline data from a Panchangam result.
 *
 * The library's transitions already span from sunrise to next sunrise,
 * so we map them directly into our normalized format.
 */
export function buildTimelineData(panchangam: Panchangam): TimelineData {
    const { sunrise, sunset, moonrise, moonset, vara } = panchangam;

    const rows: TimelineRow[] = [
        {
            type: 'tithi',
            label: 'Tithi',
            icon: '🌙',
            segments: mapTransitions(panchangam.tithiTransitions, sunrise),
        },
        {
            type: 'nakshatra',
            label: 'Nakshatra',
            icon: '⭐',
            segments: mapTransitions(panchangam.nakshatraTransitions, sunrise),
        },
        {
            type: 'yoga',
            label: 'Yoga',
            icon: '☯',
            segments: mapTransitions(panchangam.yogaTransitions, sunrise),
        },
        {
            type: 'karana',
            label: 'Karana',
            icon: '◐',
            segments: mapTransitions(panchangam.karanaTransitions, sunrise),
        },
        {
            type: 'vara',
            label: 'Weekday',
            icon: '📆',
            segments: [
                {
                    name: dayNames[vara] ?? `Day ${vara}`,
                    startTime: sunrise ?? new Date(),
                    endTime: sunset ?? new Date(),
                    isPrimary: true,
                },
            ],
        },
    ];

    return {
        rows,
        sunrise,
        sunset,
        moonrise,
        moonset,
        panchangam,
    };
}

/**
 * Utility: Get the percentage position of a time within a 24-hour window.
 * Used for rendering segments proportionally in the timeline.
 *
 * @param time - The time to position
 * @param dayStart - The start of the 24h window (typically midnight or sunrise)
 * @returns Percentage 0-100
 */
export function getTimePercent(time: Date, dayStart: Date): number {
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const elapsed = time.getTime() - dayStart.getTime();
    return Math.max(0, Math.min(100, (elapsed / MS_PER_DAY) * 100));
}
