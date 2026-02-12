import { Preferences } from '@capacitor/preferences';
import anapanasatiData from '../assets/data/anapanasati.json';

// Types
export interface AnapanasatiSession {
    id: string;
    timestamp: string; // ISO string
    durationMinutes: number;
    plannedDurationMinutes: number;
    focus: 'all_16' | 'body' | 'feelings' | 'mind' | 'dhammas';
    completed: boolean;
    endedEarly: boolean;
    quality?: number; // 1-5
    reflection?: string;
    tags?: string[];
}

export interface AnapanasatiStats {
    totalSessions: number;
    totalMinutes: number;
    currentStreak: number;
    longestStreak: number;
    practiceDays: number;
    lastPracticeDate: string | null; // YYYY-MM-DD
    monthlyStats?: {
        [key: string]: { // "YYYY-MM"
            sessions: number;
            totalMinutes: number;
        }
    };
}

export interface AnapanasatiSettings {
    defaultDuration: number;
    defaultFocus: string;
    bellAtStart: boolean;
    bellAtIntervals: boolean;
    intervalMinutes: number;
    bellAtEnd: boolean;
    bellSound: string;
}

const SESSION_KEY = 'anapanasati_sessions';
const SETTINGS_KEY = 'anapanasati_settings';
const DEFAULT_SETTINGS: AnapanasatiSettings = {
    defaultDuration: 20,
    defaultFocus: 'all_16',
    bellAtStart: true,
    bellAtIntervals: false,
    intervalMinutes: 5,
    bellAtEnd: true,
    bellSound: 'tibetan_bowl'
};

export const AnapanasatiService = {
    // Content
    getContent: () => anapanasatiData,

    // Sessions
    getSessions: async (): Promise<AnapanasatiSession[]> => {
        const { value } = await Preferences.get({ key: SESSION_KEY });
        return value ? JSON.parse(value) : [];
    },

    saveSession: async (session: AnapanasatiSession): Promise<void> => {
        const sessions = await AnapanasatiService.getSessions();
        sessions.unshift(session); // Add to top
        await Preferences.set({ key: SESSION_KEY, value: JSON.stringify(sessions) });
    },

    // Stats
    getStats: async (): Promise<AnapanasatiStats> => {
        const sessions = await AnapanasatiService.getSessions();
        const completedSessions = sessions.filter(s => s.completed || (s.durationMinutes > 5)); // Count significant sessions

        const totalSessions = completedSessions.length;
        const totalMinutes = completedSessions.reduce((acc, s) => acc + s.durationMinutes, 0);

        // Calculate streaks
        const uniqueDates = Array.from(new Set(
            completedSessions.map(s => s.timestamp.split('T')[0])
        )).sort().reverse(); // Descending order

        let currentStreak = 0;
        let longestStreak = 0;
        let lastPracticeDate = uniqueDates.length > 0 ? uniqueDates[0] : null;

        if (uniqueDates.length > 0) {
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

            // Check if streak is active (practiced today or yesterday)
            if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
                currentStreak = 1;
                // Count backwards
                for (let i = 0; i < uniqueDates.length - 1; i++) {
                    const d1 = new Date(uniqueDates[i]);
                    const d2 = new Date(uniqueDates[i + 1]);
                    const diffTime = Math.abs(d1.getTime() - d2.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays === 1) {
                        currentStreak++;
                    } else {
                        break;
                    }
                }
            }
        }

        // Longest streak logic could be more complex, simpler version for now:
        // (Just returning current for longest if it's the max for simplicity, could implement full scan later)
        longestStreak = Math.max(currentStreak, longestStreak);

        return {
            totalSessions,
            totalMinutes,
            currentStreak,
            longestStreak,
            practiceDays: uniqueDates.length,
            lastPracticeDate
        };
    },

    getTodaySummary: async () => {
        const sessions = await AnapanasatiService.getSessions();
        const today = new Date().toISOString().split('T')[0];
        const todaySessions = sessions.filter(s => s.timestamp.startsWith(today));

        return {
            count: todaySessions.length,
            minutes: todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0)
        };
    },

    // Settings
    getSettings: async (): Promise<AnapanasatiSettings> => {
        const { value } = await Preferences.get({ key: SETTINGS_KEY });
        return value ? { ...DEFAULT_SETTINGS, ...JSON.parse(value) } : DEFAULT_SETTINGS;
    },

    saveSettings: async (settings: AnapanasatiSettings): Promise<void> => {
        await Preferences.set({ key: SETTINGS_KEY, value: JSON.stringify(settings) });
    }
};
