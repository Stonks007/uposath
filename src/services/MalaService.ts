
import { Preferences } from '@capacitor/preferences';
import { MalaEntry, MalaStats, SatiPreferences, DEFAULT_PREFERENCES, PracticeStats } from '../types/SatiTypes';

const STORE_KEY_ENTRIES = 'sati_mala_entries';
const STORE_KEY_PREFS = 'sati_mala_preferences';

// Helper: Parse dates safely
const parseDate = (dateStr: string) => new Date(dateStr);

export const MalaService = {
    // --- Entries ---

    async getEntries(): Promise<MalaEntry[]> {
        const { value } = await Preferences.get({ key: STORE_KEY_ENTRIES });
        if (!value) return [];
        try {
            return JSON.parse(value);
        } catch (e) {
            console.error('Error parsing mala entries', e);
            return [];
        }
    },

    async saveEntry(entry: MalaEntry): Promise<void> {
        const entries = await MalaService.getEntries();
        entries.unshift(entry); // Add to top
        await Preferences.set({
            key: STORE_KEY_ENTRIES,
            value: JSON.stringify(entries)
        });
    },

    async updateEntry(updatedEntry: MalaEntry): Promise<void> {
        let entries = await MalaService.getEntries();
        entries = entries.map(e => e.id === updatedEntry.id ? updatedEntry : e);
        await Preferences.set({
            key: STORE_KEY_ENTRIES,
            value: JSON.stringify(entries)
        });
    },

    async deleteEntry(id: string): Promise<void> {
        let entries = await MalaService.getEntries();
        entries = entries.filter(e => e.id !== id);
        await Preferences.set({
            key: STORE_KEY_ENTRIES,
            value: JSON.stringify(entries)
        });
    },

    // --- Stats Calculation ---

    async getStats(): Promise<MalaStats> {
        const entries = await MalaService.getEntries();
        const emptyStats: PracticeStats = { totalBeads: 0, totalSessions: 0, currentStreak: 0, lastPracticeDate: '' };

        // Initialize aggregation structure
        const stats: MalaStats = {
            overall: { ...emptyStats },
            byType: {
                buddha: { ...emptyStats },
                dhamma: { ...emptyStats },
                sangha: { ...emptyStats }
            },
            practiceDays: 0
        };

        if (entries.length === 0) return stats;

        // Calculate Totals and Sessions
        entries.forEach(e => {
            const type = e.practiceType || 'buddha'; // Default to buddha for old entries

            // Update Overall
            stats.overall.totalBeads += e.beads;
            stats.overall.totalSessions += 1;

            // Update Type Specific
            if (stats.byType[type]) {
                stats.byType[type].totalBeads += e.beads;
                stats.byType[type].totalSessions += 1;
            }
        });

        // Calculate Unique Practice Days (Overall)
        const allDates = Array.from(new Set(entries.map(e => e.timestamp.split('T')[0]))).sort();
        stats.practiceDays = allDates.length;
        stats.overall.lastPracticeDate = allDates[allDates.length - 1] || '';

        // Calculate Streaks safely for each context
        const calculateStreak = (dates: string[]) => {
            if (dates.length === 0) return 0;
            const uniqueSorted = Array.from(new Set(dates)).sort().reverse(); // Descending
            const today = new Date().toISOString().split('T')[0];
            const yesterdayDate = new Date();
            yesterdayDate.setDate(yesterdayDate.getDate() - 1);
            const yesterday = yesterdayDate.toISOString().split('T')[0];

            if (!uniqueSorted.includes(today) && !uniqueSorted.includes(yesterday)) return 0;

            let streak = 0;
            let prevDate: Date | null = null;

            for (const dateStr of uniqueSorted) {
                const d = new Date(dateStr);
                if (!prevDate) {
                    prevDate = d;
                    streak = 1;
                    continue;
                }
                const diffTime = Math.abs(prevDate.getTime() - d.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    streak++;
                    prevDate = d;
                } else {
                    break;
                }
            }
            return streak;
        };

        // Overall Streak
        stats.overall.currentStreak = calculateStreak(allDates);

        // Type Specific Streaks and Last Dates
        (['buddha', 'dhamma', 'sangha'] as const).forEach(type => {
            const typeEntries = entries.filter(e => (e.practiceType || 'buddha') === type);
            const typeDates = Array.from(new Set(typeEntries.map(e => e.timestamp.split('T')[0]))).sort();

            if (stats.byType[type]) {
                stats.byType[type].currentStreak = calculateStreak(typeDates);
                stats.byType[type].lastPracticeDate = typeDates[typeDates.length - 1] || '';
            }
        });

        return stats;
    },

    async getTodayTotal(type?: string): Promise<number> {
        const entries = await MalaService.getEntries();
        const today = new Date().toISOString().split('T')[0];

        return entries
            .filter(e => e.timestamp.startsWith(today))
            .filter(e => !type || (e.practiceType || 'buddha') === type)
            .reduce((sum, e) => sum + e.beads, 0);
    },

    // --- Preferences ---

    async getPreferences(): Promise<SatiPreferences> {
        const { value } = await Preferences.get({ key: STORE_KEY_PREFS });
        if (!value) return DEFAULT_PREFERENCES;
        try {
            return { ...DEFAULT_PREFERENCES, ...JSON.parse(value) };
        } catch {
            return DEFAULT_PREFERENCES;
        }
    },

    async savePreferences(prefs: SatiPreferences): Promise<void> {
        await Preferences.set({
            key: STORE_KEY_PREFS,
            value: JSON.stringify(prefs)
        });
    }
};
