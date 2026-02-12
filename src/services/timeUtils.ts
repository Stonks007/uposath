
/**
 * Time Utilities
 * Handles 12-hour formatting and timezone-aware displays.
 */

export interface TimeFormatOptions {
    hour: '2-digit' | 'numeric';
    minute: '2-digit' | 'numeric';
    hour12: boolean;
}

const DEFAULT_OPTIONS: TimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
};

/**
 * Formats a Date object to a string.
 * Defaults to 12-hour AM/PM format.
 */
export function formatTime(date: Date | null | undefined, timezone?: string): string {
    if (!date) return '';

    try {
        return date.toLocaleTimeString([], {
            ...DEFAULT_OPTIONS,
            timeZone: timezone || 'Asia/Kolkata'
        });
    } catch (e) {
        // Fallback if timezone is invalid
        return date.toLocaleTimeString([], {
            ...DEFAULT_OPTIONS,
            timeZone: 'Asia/Kolkata'
        });
    }
}

/**
 * Gets a list of common timezones for manual selection.
 */
export function getTimezones(): string[] {
    try {
        // Modern approach to get all supported timezones
        return (Intl as any).supportedValuesOf('timeZone');
    } catch (e) {
        // Fallback list
        return [
            'UTC',
            'Asia/Kolkata',
            'Asia/Colombo',
            'Asia/Bangkok',
            'Asia/Yangon',
            'Asia/Ho_Chi_Minh',
            'Asia/Singapore',
            'Asia/Tokyo',
            'Australia/Sydney',
            'Europe/London',
            'Europe/Paris',
            'Europe/Berlin',
            'Europe/Moscow',
            'America/New_York',
            'America/Chicago',
            'America/Denver',
            'America/Los_Angeles',
            'America/Sao_Paulo',
        ];
    }
}


/**
 * Sanskrit Weekday names (Vara)
 */
export const SANSKRIT_WEEKDAYS = [
    'Ravivara',     // Sunday
    'Somavara',     // Monday
    'Mangalavara',  // Tuesday
    'Budhavara',    // Wednesday
    'Guruvara',     // Thursday
    'Shukravara',   // Friday
    'Shanivara'     // Saturday
];

/**
 * Formats a date using Sanskrit weekday names.
 */
export function formatSanskritDate(date: Date): string {
    const day = date.getDate();
    const weekday = SANSKRIT_WEEKDAYS[date.getDay()];
    return `${day} ${weekday}`;
}

/**
 * Tries to guess timezone from current environment.
 */
export function guessTimezone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
    } catch (e) {
        return 'Asia/Kolkata';
    }
}
