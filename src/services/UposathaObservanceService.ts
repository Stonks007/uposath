import { Preferences } from '@capacitor/preferences';
import { UposathaObservance, UposathaStats } from '../types/ObservanceTypes';
import { getUposathaStatus } from './uposathaCalculator';
import { Observer } from '@ishubhamx/panchangam-js';

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
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
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

    async syncMissedObservances(observer: Observer): Promise<void> {
        let history = await UposathaObservanceService.getHistory();
        let changed = false;

        // Cleanup: Remove any 'skipped' entries that are NO LONGER mathematically Uposatha days or Optional days.
        const cleanedHistory = history.filter(o => {
            if (o.status === 'observed') return true;
            const checkDate = new Date(`${o.date}T12:00:00`);
            const status = getUposathaStatus(checkDate, observer);
            return status.isUposatha || status.isOptional;
        });

        if (cleanedHistory.length !== history.length) {
            history = cleanedHistory;
            changed = true;
        }

        const now = new Date();
        now.setHours(0, 0, 0, 0); // Start boundary: strictly before today (00:00:00)

        // Find the earliest date we need to scan back to (max 45 days)
        const earliestScanDate = new Date(now);
        earliestScanDate.setDate(earliestScanDate.getDate() - 45);

        // Map existing recorded dates for fast lookup
        const recordedDates = new Set(history.map(o => o.date));

        let newEntries: UposathaObservance[] = [];

        // Scan backwards from yesterday
        let scanDate = new Date(now);
        scanDate.setDate(scanDate.getDate() - 1);

        while (scanDate >= earliestScanDate) {
            const year = scanDate.getFullYear();
            const month = String(scanDate.getMonth() + 1).padStart(2, '0');
            const day = String(scanDate.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            if (!recordedDates.has(dateStr)) {
                // Determine if this past day was an Uposatha Day using local noon check
                const checkDate = new Date(scanDate);
                checkDate.setHours(12, 0, 0, 0);
                const status = getUposathaStatus(checkDate, observer);

                if (status.isUposatha || status.isOptional) {
                    const moonPhase = status.isFullMoon ? 'full'
                        : status.isNewMoon ? 'new'
                            : status.isChaturdashi ? 'chaturdashi'
                                : 'quarter';

                    newEntries.push({
                        id: crypto.randomUUID(),
                        date: dateStr,
                        moonPhase,
                        paksha: status.paksha as 'Shukla' | 'Krishna',
                        status: 'skipped',
                        timestamp: new Date().toISOString()
                    });
                }
            }
            scanDate.setDate(scanDate.getDate() - 1);
        }

        if (newEntries.length > 0 || changed) {
            history.push(...newEntries);
            // Re-sort descending just in case
            history = history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            await Preferences.set({
                key: STORE_KEY_OBSERVANCE,
                value: JSON.stringify(history)
            });
        }
    },

    async getStats(): Promise<UposathaStats> {
        const history = await UposathaObservanceService.getHistory();
        const observed = history.filter(o => o.status === 'observed').length;
        const skipped = history.filter(o => o.status === 'skipped').length;

        // Rate: Simple comparison of observed vs skipped
        const total = observed + skipped;
        const rate = total > 0 ? (observed / total) * 100 : 0;

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
        for (const obs of sortedHistory) {
            if (obs.status === 'observed') {
                currentStreak++;
            } else {
                break; // Skipped breaks the streak
            }
        }

        // Longest Streak
        for (const obs of sortedHistory) {
            if (obs.status === 'observed') {
                tempStreak++;
            } else {
                if (tempStreak > longestStreak) longestStreak = tempStreak;
                tempStreak = 0;
            }
        }
        if (tempStreak > longestStreak) longestStreak = tempStreak;

        return {
            totalTracked: observed + skipped,
            observed,
            skipped,
            ignored: 0,
            rate,
            currentStreak,
            longestStreak,
            byMoonPhase: byPhase,
            monthlyStats
        };
    }
};
