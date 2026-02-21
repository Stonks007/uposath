import { Preferences } from '@capacitor/preferences';
import anapanasatiData from '../assets/data/anapanasati.json';
import { BasePracticeRepository } from './BasePracticeRepository';
import { StatsCalculator } from './StatsCalculator';

// Types
export interface AnapanasatiSession {
    id: string;
    timestamp: string; // ISO string
    durationMinutes: number;
    durationSeconds?: number;
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
    byFocus: {
        [key: string]: {
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

const sessionRepository = new BasePracticeRepository<AnapanasatiSession>(SESSION_KEY);

export const AnapanasatiService = {
    // Content
    getContent: () => anapanasatiData,

    // Sessions
    getSessions: async (): Promise<AnapanasatiSession[]> => {
        return sessionRepository.getAll();
    },

    saveSession: async (session: AnapanasatiSession): Promise<void> => {
        await sessionRepository.add(session);
    },

    deleteSession: async (id: string): Promise<void> => {
        await sessionRepository.delete(id);
    },

    updateSession: async (updatedSession: AnapanasatiSession): Promise<void> => {
        await sessionRepository.update(updatedSession);
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

        const currentStreak = StatsCalculator.calculateStreak(uniqueDates);
        let longestStreak = 0;
        let lastPracticeDate = uniqueDates.length > 0 ? uniqueDates[0] : null;

        // Longest streak logic could be more complex, simpler version for now:
        // (Just returning current for longest if it's the max for simplicity, could implement full scan later)
        longestStreak = Math.max(currentStreak, longestStreak);

        // Breakdown by Focus
        const byFocus: { [key: string]: { sessions: number, totalMinutes: number } } = {
            'all_16': { sessions: 0, totalMinutes: 0 },
            'body': { sessions: 0, totalMinutes: 0 },
            'feelings': { sessions: 0, totalMinutes: 0 },
            'mind': { sessions: 0, totalMinutes: 0 },
            'dhammas': { sessions: 0, totalMinutes: 0 }
        };

        completedSessions.forEach(s => {
            const focus = s.focus || 'all_16';
            if (byFocus[focus]) {
                byFocus[focus].sessions++;
                byFocus[focus].totalMinutes += s.durationMinutes;
            }
        });

        return {
            totalSessions,
            totalMinutes,
            currentStreak,
            longestStreak,
            practiceDays: uniqueDates.length,
            lastPracticeDate,
            byFocus
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
