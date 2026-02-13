import { Preferences } from '@capacitor/preferences';
import { Mantra, MantraSession, MantraTradition } from '../types/SatiTypes';

const MANTRA_STORAGE_KEY = 'user_mantras';
const SESSION_STORAGE_KEY = 'mantra_sessions';

const DEFAULT_MANTRAS: Mantra[] = [
    {
        id: 'default_avalokitesvara',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        basic: {
            name: 'Great Compassion Mantra',
            deity: 'Avalokiteśvara',
            icon: '🌟'
        },
        text: {
            primaryScript: 'devanagari',
            primaryText: 'ॐ मणि पद्मे हूँ',
            transliteration: 'Oṃ Maṇi Padme Hūṃ'
        },
        tradition: 'mahayana',
        purpose: 'Cultivating compassion for all beings',
        practice: {
            defaultReps: 108,
            defaultDurationMinutes: 15,
            bellAtCompletion: true
        },
        stats: {
            totalSessions: 0,
            totalReps: 0,
            totalDurationMinutes: 0,
            currentStreak: 0
        }
    },
    {
        id: 'default_tara',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        basic: {
            name: 'Green Tārā Mantra',
            deity: 'Green Tārā',
            icon: '☸️'
        },
        text: {
            primaryScript: 'devanagari',
            primaryText: 'ॐ तारे तुत्तारे तुरे स्वाहा',
            transliteration: 'Oṃ Tāre Tuttāre Ture Svāhā'
        },
        tradition: 'tibetan',
        purpose: 'Protection and overcoming fear',
        practice: {
            defaultReps: 108,
            defaultDurationMinutes: 15,
            bellAtCompletion: true
        },
        stats: {
            totalSessions: 0,
            totalReps: 0,
            totalDurationMinutes: 0,
            currentStreak: 0
        }
    },
    {
        id: 'default_medicine_buddha',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        basic: {
            name: 'Medicine Buddha Mantra',
            deity: 'Bhaiṣajyaguru',
            icon: '✨'
        },
        text: {
            primaryScript: 'devanagari',
            primaryText: 'ॐ भैषज्ये भैषज्ये महाभैषज्ये भैषज्य समुद्गते स्वाहा',
            transliteration: 'Oṃ Bhaiṣajye Bhaiṣajye Mahābhaiṣajye Bhaiṣajya Samudgate Svāhā'
        },
        tradition: 'mahayana',
        purpose: 'Healing and purification',
        practice: {
            defaultReps: 108,
            defaultDurationMinutes: 15,
            bellAtCompletion: true
        },
        stats: {
            totalSessions: 0,
            totalReps: 0,
            totalDurationMinutes: 0,
            currentStreak: 0
        }
    }
];

export const MantraService = {

    async getMantras(): Promise<Mantra[]> {
        const { value } = await Preferences.get({ key: MANTRA_STORAGE_KEY });
        if (!value) {
            // Seed defaults if empty
            await this.saveMantras(DEFAULT_MANTRAS);
            return DEFAULT_MANTRAS;
        }
        return JSON.parse(value);
    },

    async saveMantras(mantras: Mantra[]): Promise<void> {
        await Preferences.set({
            key: MANTRA_STORAGE_KEY,
            value: JSON.stringify(mantras)
        });
    },

    async addMantra(mantra: Mantra): Promise<void> {
        const mantras = await this.getMantras();
        mantras.push(mantra);
        await this.saveMantras(mantras);
    },

    async updateMantra(updatedMantra: Mantra): Promise<void> {
        const mantras = await this.getMantras();
        const index = mantras.findIndex(m => m.id === updatedMantra.id);
        if (index !== -1) {
            mantras[index] = updatedMantra;
            await this.saveMantras(mantras);
        }
    },

    async deleteMantra(id: string): Promise<void> {
        const mantras = await this.getMantras();
        const filtered = mantras.filter(m => m.id !== id);
        await this.saveMantras(filtered);
    },

    async getSessions(): Promise<MantraSession[]> {
        const { value } = await Preferences.get({ key: SESSION_STORAGE_KEY });
        return value ? JSON.parse(value) : [];
    },

    async saveSession(session: MantraSession): Promise<void> {
        const sessions = await this.getSessions();
        sessions.push(session);
        await Preferences.set({
            key: SESSION_STORAGE_KEY,
            value: JSON.stringify(sessions)
        });

        // Update stats for the mantra
        await this.updateMantraStats(session);
    },

    async deleteSession(id: string): Promise<void> {
        let sessions = await this.getSessions();
        const sessionToDelete = sessions.find(s => s.id === id);
        if (sessionToDelete) {
            sessions = sessions.filter(s => s.id !== id);
            await Preferences.set({
                key: SESSION_STORAGE_KEY,
                value: JSON.stringify(sessions)
            });

            await this.recalculateMantraStats(sessionToDelete.mantraId);
        }
    },

    async updateSession(updatedSession: MantraSession): Promise<void> {
        let sessions = await this.getSessions();
        const index = sessions.findIndex(s => s.id === updatedSession.id);
        if (index !== -1) {
            sessions[index] = updatedSession;
            await Preferences.set({
                key: SESSION_STORAGE_KEY,
                value: JSON.stringify(sessions)
            });
            await this.recalculateMantraStats(updatedSession.mantraId);
        }
    },

    async recalculateMantraStats(mantraId: string): Promise<void> {
        const allSessions = await this.getSessions();
        const mantraSessions = allSessions.filter(s => s.mantraId === mantraId);

        const mantras = await this.getMantras();
        const mantraIndex = mantras.findIndex(m => m.id === mantraId);

        if (mantraIndex !== -1) {
            const m = mantras[mantraIndex];

            m.stats.totalSessions = mantraSessions.length;
            m.stats.totalReps = mantraSessions.reduce((acc, s) => acc + s.reps, 0);
            m.stats.totalDurationMinutes = mantraSessions.reduce((acc, s) => acc + s.durationMinutes, 0);

            const uniqueDates = Array.from(new Set(mantraSessions.map(s => s.timestamp.split('T')[0]))).sort().reverse();
            m.stats.lastPracticeDate = uniqueDates.length > 0 ? uniqueDates[0] : undefined;

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
            m.stats.currentStreak = currentStreak;

            mantras[mantraIndex] = m;
            await this.saveMantras(mantras);
        }
    },

    async updateMantraStats(session: MantraSession) {
        const mantras = await this.getMantras();
        const mantra = mantras.find(m => m.id === session.mantraId);

        if (mantra) {
            mantra.stats.totalSessions += 1;
            mantra.stats.totalReps += session.reps;
            mantra.stats.totalDurationMinutes += session.durationMinutes;
            mantra.stats.lastPracticeDate = session.timestamp;

            // Simple streak calculation (mock logic for now, similar to EmptinessService)
            // check if last practice date was yesterday/today...
            // For now, just increment if practiced today and different day than last time?
            // Actually, let's keep it simple: just saved fields.
            // A clearer streak calculation would require parsing dates.

            // Very basic daily check
            const today = new Date().toISOString().split('T')[0];
            const lastDate = mantra.stats.lastPracticeDate ? mantra.stats.lastPracticeDate.split('T')[0] : null;

            if (lastDate !== today) {
                // If consecutive or just simple +1? 
                // Let's implement full logic later if needed. For now just increment if updated.
                // Or simplistic:
                mantra.stats.currentStreak += 1; // This is naive, but okay for MVP.
            }

            mantra.updated = new Date().toISOString();
            await this.updateMantra(mantra);
        }
    },

    // Helper to create a new Mantra object with defaults
    createNewMantra(): Mantra {
        return {
            id: crypto.randomUUID(),
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            basic: {
                name: '',
                icon: '📿'
            },
            text: {
                primaryScript: 'roman', // Default
                primaryText: ''
            },
            tradition: 'custom',
            practice: {
                defaultReps: 108,
                defaultDurationMinutes: 15,
                bellAtCompletion: true
            },
            stats: {
                totalSessions: 0,
                totalReps: 0,
                totalDurationMinutes: 0,
                currentStreak: 0
            }
        };
    }
};
