
import { MalaService } from './MalaService';
import { AnapanasatiService } from './AnapanasatiService';
import { MantraService } from './MantraService';
import { EmptinessService } from './EmptinessService';
import { GlobalStats, UnifiedSession, PracticeCategory } from '../types/SatiTypes';
import { StatsCalculator } from './StatsCalculator';

export const SatiStatsService = {

    async getGlobalStats(): Promise<GlobalStats> {
        // Fetch all sessions/stats concurrently
        const [
            malaStats,
            anapanasatiStats,
            mantraSessions,
            emptinessStats
        ] = await Promise.all([
            MalaService.getStats(),
            AnapanasatiService.getStats(),
            MantraService.getSessions(), // MantraService stats are per-mantra, need session count
            EmptinessService.getStats()
        ]);

        const totalSessions =
            malaStats.overall.totalSessions +
            anapanasatiStats.totalSessions +
            mantraSessions.length +
            emptinessStats.totalSessions;

        const totalBeads =
            malaStats.overall.totalBeads +
            mantraSessions.reduce((acc, s) => acc + (Number(s.reps) || 0), 0);

        // Date Aggregation for Streak Calculation
        const malaEntries = await MalaService.getEntries();
        const anaSessions = await AnapanasatiService.getSessions();
        const empSessions = await EmptinessService.getSessions();

        const allDates = new Set<string>();

        // Mala Dates
        malaEntries.filter(e => e.timestamp).forEach(e => allDates.add(e.timestamp.split('T')[0]));
        // Anapanasati Dates
        anaSessions.filter(s => s.timestamp && (s.completed || s.durationMinutes > 5)).forEach(s => allDates.add(s.timestamp.split('T')[0]));
        // Mantra Dates
        mantraSessions.filter(s => s.timestamp).forEach(s => allDates.add(s.timestamp.split('T')[0]));
        // Emptiness Dates
        empSessions.filter(s => s.timestamp && (s.completed || s.durationMinutes > 5)).forEach(s => allDates.add(s.timestamp.split('T')[0]));

        const uniqueDates = Array.from(allDates).sort().reverse();

        // Calculate Global Streak
        const currentStreak = StatsCalculator.calculateStreak(uniqueDates);

        return {
            totalSessions,
            currentStreak,
            totalBeads,
            lastPracticeDate: uniqueDates.length > 0 ? uniqueDates[0] : ''
        };
    },

    async getUnifiedHistory(): Promise<UnifiedSession[]> {
        const history: UnifiedSession[] = [];

        // 1. Mala
        const malaEntries = await MalaService.getEntries();
        malaEntries.forEach(e => {
            history.push({
                id: e.id,
                timestamp: e.timestamp,
                category: 'mala',
                title: `${e.practiceType || 'Buddha'} Recollection`,
                detail: `${e.beads} beads`,
                notes: e.notes
            });
        });

        // 2. Anapanasati
        const anaSessions = await AnapanasatiService.getSessions();
        anaSessions.forEach(s => {
            const detail = s.durationSeconds !== undefined
                ? `${s.durationMinutes}:${s.durationSeconds < 10 ? '0' : ''}${s.durationSeconds} mins`
                : `${s.durationMinutes} mins`;
            history.push({
                id: s.id,
                timestamp: s.timestamp,
                category: 'anapanasati',
                title: 'Anapanasati',
                detail,
                durationSeconds: s.durationSeconds,
                notes: s.reflection
            });
        });

        // 3. Mantra
        const mantraSessions = await MantraService.getSessions();
        const mantras = await MantraService.getMantras(); // Efficient lookup map would be better but array is small
        mantraSessions.forEach(s => {
            const m = mantras.find(m => m.id === s.mantraId);
            history.push({
                id: s.id,
                timestamp: s.timestamp,
                category: 'mantra',
                title: m ? m.basic.name : 'Mantra Practice',
                detail: `${s.reps} beads`,
                notes: s.notes
            });
        });

        // 4. Emptiness
        const empSessions = await EmptinessService.getSessions();
        empSessions.forEach(s => {
            const detail = s.durationSeconds !== undefined
                ? `${s.durationMinutes}:${s.durationSeconds < 10 ? '0' : ''}${s.durationSeconds} mins`
                : `${s.durationMinutes} mins`;
            history.push({
                id: s.id,
                timestamp: s.timestamp,
                category: 'emptiness',
                title: 'Emptiness',
                detail,
                durationSeconds: s.durationSeconds,
                notes: s.reflection || (s as any).notes
            });
        });

        // Sort Descending
        return history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },

    async updateSession(session: any, category: PracticeCategory): Promise<void> {
        switch (category) {
            case 'mala':
                await MalaService.updateEntry(session);
                break;
            case 'anapanasati':
                await AnapanasatiService.updateSession(session);
                break;
            case 'mantra':
                await MantraService.updateSession(session);
                break;
            case 'emptiness':
                await EmptinessService.updateSession(session);
                break;
        }
    },

    async deleteSession(id: string, category: PracticeCategory): Promise<void> {
        switch (category) {
            case 'mala':
                await MalaService.deleteEntry(id);
                break;
            case 'anapanasati':
                await AnapanasatiService.deleteSession(id);
                break;
            case 'mantra':
                await MantraService.deleteSession(id);
                break;
            case 'emptiness':
                await EmptinessService.deleteSession(id);
                break;
        }
    }
};
