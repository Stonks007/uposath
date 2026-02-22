
import { Preferences } from '@capacitor/preferences';
import { UposathaObservance, UposathaStats } from '../types/ObservanceTypes';

const STORE_KEY_OBSERVANCE = 'uposatha_observance_entries';

export const UposathaObservanceService = {

    async getHistory(): Promise<UposathaObservance[]> {
        const { value } = await Preferences.get({ key: STORE_KEY_OBSERVANCE });
        if (!value) return [];
        try {
            const data = JSON.parse(value);
            // Sort by date descending
            return data.sort((a: UposathaObservance, b: UposathaObservance) => new Date(b.date).getTime() - new Date(a.date).getTime());
        } catch (e) {
            console.error('Error parsing uposatha observance history', e);
            return [];
        }
    },

    async getObservance(date: Date): Promise<UposathaObservance | null> {
        const dateStr = date.toISOString().split('T')[0];
        const history = await UposathaObservanceService.getHistory();
        return history.find(o => o.date === dateStr) || null;
    },

    async saveObservance(observance: UposathaObservance): Promise<void> {
        let history = await UposathaObservanceService.getHistory();
        // Remove existing entry for the same date if any
        history = history.filter(o => o.date !== observance.date);
        history.unshift(observance);

        await Preferences.set({
            key: STORE_KEY_OBSERVANCE,
            value: JSON.stringify(history)
        });
    },

    async deleteObservance(id: string): Promise<void> {
        let history = await UposathaObservanceService.getHistory();
        history = history.filter(o => o.id !== id);
        await Preferences.set({
            key: STORE_KEY_OBSERVANCE,
            value: JSON.stringify(history)
        });
    },

    async clearHistory(): Promise<void> {
        await Preferences.remove({ key: STORE_KEY_OBSERVANCE });
    },

    async getStats(): Promise<UposathaStats> {
        const history = await UposathaObservanceService.getHistory();
        const totalTracked = history.length;
        const observed = history.filter(o => o.status === 'observed').length;
        const skipped = history.filter(o => o.status === 'skipped').length;
        const rate = totalTracked > 0 ? (observed / totalTracked) * 100 : 0;

        // Moon Phase Breakdown
        const byPhase = {
            full: { observed: 0, total: 0 },
            new: { observed: 0, total: 0 },
            quarter: { observed: 0, total: 0 },
            chaturdashi: { observed: 0, total: 0 }
        };

        history.forEach(o => {
            if (o.moonPhase === 'full') {
                byPhase.full.total++;
                if (o.status === 'observed') byPhase.full.observed++;
            } else if (o.moonPhase === 'new') {
                byPhase.new.total++;
                if (o.status === 'observed') byPhase.new.observed++;
            } else if (o.moonPhase === 'chaturdashi') {
                byPhase.chaturdashi.total++;
                if (o.status === 'observed') byPhase.chaturdashi.observed++;
            } else {
                byPhase.quarter.total++;
                if (o.status === 'observed') byPhase.quarter.observed++;
            }
        });

        // Monthly Stats (Last 6 months)
        const monthlyMap = new Map<string, { observed: number, total: number }>();
        history.forEach(o => {
            const month = o.date.substring(0, 7); // YYYY-MM
            const current = monthlyMap.get(month) || { observed: 0, total: 0 };
            current.total++;
            if (o.status === 'observed') current.observed++;
            monthlyMap.set(month, current);
        });

        const monthlyStats = Array.from(monthlyMap.entries())
            .map(([month, stats]) => ({ month, ...stats }))
            .sort((a, b) => b.month.localeCompare(a.month)); // Descending

        // Streak Calculation
        // Sort history by date descending
        const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        // Current Streak
        // Iterating from most recent. 
        // Logic: If the MOST RECENT entry is observed, we start counting.
        // If there are skipped days in between observed days, streak breaks.
        // Note: Uposatha days are not consecutive days. They are specific dates.
        // So we just check the sequence of *tracked* Uposatha days.

        for (const obs of sortedHistory) {
            if (obs.status === 'observed') {
                currentStreak++;
            } else {
                break; // Skipped breaks the streak
            }
        }

        // Longest Streak
        for (const obs of sortedHistory) { // Working backwards in time
            if (obs.status === 'observed') {
                tempStreak++;
            } else {
                if (tempStreak > longestStreak) longestStreak = tempStreak;
                tempStreak = 0;
            }
        }
        if (tempStreak > longestStreak) longestStreak = tempStreak;

        return {
            totalTracked,
            observed,
            skipped,
            rate,
            currentStreak,
            longestStreak,
            byMoonPhase: byPhase,
            monthlyStats
        };
    }
};
