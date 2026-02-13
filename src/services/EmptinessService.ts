import { Preferences } from '@capacitor/preferences';
import emptinessData from '../assets/data/emptiness.json';
import { EmptinessData, EmptinessSession, EmptinessStats } from '../types/SatiTypes';

// Type assertion for JSON import
const content: EmptinessData = emptinessData as unknown as EmptinessData;

const SESSION_KEY = 'emptiness_sessions';

export const EmptinessService = {
    // Content
    getContent: (): EmptinessData => content,

    // Sessions
    getSessions: async (): Promise<EmptinessSession[]> => {
        const { value } = await Preferences.get({ key: SESSION_KEY });
        return value ? JSON.parse(value) : [];
    },

    saveSession: async (session: EmptinessSession): Promise<void> => {
        const sessions = await EmptinessService.getSessions();
        sessions.unshift(session); // Add to top
        await Preferences.set({ key: SESSION_KEY, value: JSON.stringify(sessions) });
    },

    deleteSession: async (id: string): Promise<void> => {
        let sessions = await EmptinessService.getSessions();
        sessions = sessions.filter(s => s.id !== id);
        await Preferences.set({ key: SESSION_KEY, value: JSON.stringify(sessions) });
    },

    updateSession: async (updatedSession: EmptinessSession): Promise<void> => {
        let sessions = await EmptinessService.getSessions();
        sessions = sessions.map(s => s.id === updatedSession.id ? updatedSession : s);
        await Preferences.set({ key: SESSION_KEY, value: JSON.stringify(sessions) });
    },

    // Stats
    getStats: async (): Promise<EmptinessStats> => {
        const sessions = await EmptinessService.getSessions();
        const completedSessions = sessions.filter(s => s.completed || s.durationMinutes > 5);

        const totalSessions = completedSessions.length;
        const totalMinutes = completedSessions.reduce((acc, s) => acc + s.durationMinutes, 0);

        // Calculate streaks
        const uniqueDates = Array.from(new Set(
            completedSessions.map(s => s.timestamp.split('T')[0])
        )).sort().reverse();

        let currentStreak = 0;
        if (uniqueDates.length > 0) {
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

            if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
                currentStreak = 1;
                for (let i = 0; i < uniqueDates.length - 1; i++) {
                    const d1 = new Date(uniqueDates[i]);
                    const d2 = new Date(uniqueDates[i + 1]);
                    const diffTime = Math.abs(d1.getTime() - d2.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays === 1) currentStreak++;
                    else break;
                }
            }
        }

        // Breakdown by tradition
        const byTradition = {
            theravada: completedSessions.filter(s => s.tradition === 'theravada').length,
            mahayana: completedSessions.filter(s => s.tradition === 'mahayana').length
        };

        return {
            totalSessions,
            totalMinutes,
            currentStreak,
            lastPracticeDate: uniqueDates.length > 0 ? uniqueDates[0] : null,
            byTradition
        };
    },

    getTodaySummary: async () => {
        const sessions = await EmptinessService.getSessions();
        const today = new Date().toISOString().split('T')[0];
        const todaySessions = sessions.filter(s => s.timestamp.startsWith(today));

        return {
            count: todaySessions.length,
            minutes: todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0)
        };
    }
};
