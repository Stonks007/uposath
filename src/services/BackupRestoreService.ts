
import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { UposathaObservance } from '../types/ObservanceTypes';
import {
    MalaEntry,
    SatiPreferences,
    DEFAULT_PREFERENCES,
    Mantra,
    MantraSession,
    EmptinessSession
} from '../types/SatiTypes';
import { AnapanasatiSession, AnapanasatiSettings } from './AnapanasatiService';

// ─── Storage Keys (must match the ones used in each service) ───
const KEYS = {
    observances: 'uposatha_observance_entries',
    malaEntries: 'sati_mala_entries',
    malaPrefs: 'sati_mala_preferences',
    anapanasatiSessions: 'anapanasati_sessions',
    anapanasatiSettings: 'anapanasati_settings',
    mantras: 'user_mantras',
    mantraSessions: 'mantra_sessions',
    emptinessSessions: 'emptiness_sessions',
} as const;

// ─── Payload Types ─────────────────────────────────────────────
export interface BackupData {
    uposathaObservances: UposathaObservance[];
    malaEntries: MalaEntry[];
    malaPreferences: SatiPreferences;
    anapanasatiSessions: AnapanasatiSession[];
    anapanasatiSettings: AnapanasatiSettings | null;
    mantras: Mantra[];
    mantraSessions: MantraSession[];
    emptinessSessions: EmptinessSession[];
    userImages?: Record<string, string>; // path -> base64
}

export interface BackupPayload {
    version: 1;
    appVersion: string;
    createdAt: string;
    data: BackupData;
}

export interface RestoreResult {
    uposathaObservances: number;
    malaEntries: number;
    anapanasatiSessions: number;
    mantras: number;
    mantraSessions: number;
    emptinessSessions: number;
}

const APP_VERSION = __APP_VERSION__;
const BACKUP_FILENAME = () =>
    `uposatha_backup_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`;

// ─── Helpers ───────────────────────────────────────────────────
async function readKey<T>(key: string, fallback: T): Promise<T> {
    const { value } = await Preferences.get({ key });
    if (!value) return fallback;
    try {
        return JSON.parse(value) as T;
    } catch {
        return fallback;
    }
}

// ─── Service ───────────────────────────────────────────────────
export const BackupRestoreService = {

    /**
     * Collect all user data into a versioned payload.
     */
    async createBackup(): Promise<BackupPayload> {
        const [
            uposathaObservances,
            malaEntries,
            malaPreferences,
            anapanasatiSessions,
            anapanasatiSettings,
            mantras,
            mantraSessions,
            emptinessSessions,
        ] = await Promise.all([
            readKey<UposathaObservance[]>(KEYS.observances, []),
            readKey<MalaEntry[]>(KEYS.malaEntries, []),
            readKey<SatiPreferences>(KEYS.malaPrefs, DEFAULT_PREFERENCES),
            readKey<AnapanasatiSession[]>(KEYS.anapanasatiSessions, []),
            readKey<AnapanasatiSettings | null>(KEYS.anapanasatiSettings, null),
            readKey<Mantra[]>(KEYS.mantras, []),
            readKey<MantraSession[]>(KEYS.mantraSessions, []),
            readKey<EmptinessSession[]>(KEYS.emptinessSessions, []),
        ]);

        return {
            version: 1,
            appVersion: APP_VERSION,
            createdAt: new Date().toISOString(),
            data: {
                uposathaObservances,
                malaEntries,
                malaPreferences,
                anapanasatiSessions,
                anapanasatiSettings,
                mantras,
                mantraSessions,
                emptinessSessions,
                userImages: await this.collectUserImages(mantras),
            },
        };
    },

    /**
     * Helper to read all user images from filesystem for backup embedding.
     */
    async collectUserImages(mantras: Mantra[]): Promise<Record<string, string>> {
        const images: Record<string, string> = {};
        const userImagePaths = mantras
            .filter(m => m.basic.deityImageType === 'user' && m.basic.deityImagePath)
            .map(m => m.basic.deityImagePath!);

        for (const path of userImagePaths) {
            try {
                const file = await Filesystem.readFile({
                    directory: Directory.Data,
                    path: path
                });
                images[path] = typeof file.data === 'string' ? file.data : '';
            } catch (e) {
                console.error(`Backup: Failed to read image ${path}`, e);
            }
        }
        return images;
    },

    /**
     * Export a backup file and open the native share sheet.
     * Returns the temporary file URI.
     */
    async exportBackup(): Promise<string> {
        const payload = await this.createBackup();
        const json = JSON.stringify(payload, null, 2);
        const filename = BACKUP_FILENAME();

        // Write to cache directory (auto-cleaned by OS)
        const result = await Filesystem.writeFile({
            path: filename,
            data: json,
            directory: Directory.Cache,
            encoding: Encoding.UTF8,
        });

        // Trigger native share sheet
        await Share.share({
            title: 'Uposatha Backup',
            text: 'My Uposatha app backup',
            url: result.uri,
            dialogTitle: 'Save or share your backup',
        });

        return result.uri;
    },

    /**
     * Validate raw JSON and return a typed payload.
     * Throws a human-readable error on failure.
     */
    validateBackup(json: string): BackupPayload {
        let parsed: any;
        try {
            parsed = JSON.parse(json);
        } catch {
            throw new Error('The selected file is not valid JSON.');
        }

        if (!parsed || typeof parsed !== 'object') {
            throw new Error('The file does not contain a valid backup object.');
        }

        if (parsed.version !== 1) {
            throw new Error(
                `Unsupported backup version "${parsed.version}". This app supports version 1.`
            );
        }

        if (!parsed.data || typeof parsed.data !== 'object') {
            throw new Error('The backup file is missing its data section.');
        }

        // Ensure all arrays are present (default to empty if missing)
        const d = parsed.data;
        const payload: BackupPayload = {
            version: 1,
            appVersion: parsed.appVersion || 'unknown',
            createdAt: parsed.createdAt || new Date().toISOString(),
            data: {
                uposathaObservances: Array.isArray(d.uposathaObservances) ? d.uposathaObservances : [],
                malaEntries: Array.isArray(d.malaEntries) ? d.malaEntries : [],
                malaPreferences: d.malaPreferences && typeof d.malaPreferences === 'object'
                    ? { ...DEFAULT_PREFERENCES, ...d.malaPreferences }
                    : DEFAULT_PREFERENCES,
                anapanasatiSessions: Array.isArray(d.anapanasatiSessions) ? d.anapanasatiSessions : [],
                anapanasatiSettings: d.anapanasatiSettings || null,
                mantras: Array.isArray(d.mantras) ? d.mantras : [],
                mantraSessions: Array.isArray(d.mantraSessions) ? d.mantraSessions : [],
                emptinessSessions: Array.isArray(d.emptinessSessions) ? d.emptinessSessions : [],
                userImages: d.userImages && typeof d.userImages === 'object' ? d.userImages : {},
            },
        };

        return payload;
    },

    /**
     * Count items in a backup for the confirmation dialog.
     */
    summarize(payload: BackupPayload): RestoreResult {
        return {
            uposathaObservances: payload.data.uposathaObservances.length,
            malaEntries: payload.data.malaEntries.length,
            anapanasatiSessions: payload.data.anapanasatiSessions.length,
            mantras: payload.data.mantras.length,
            mantraSessions: payload.data.mantraSessions.length,
            emptinessSessions: payload.data.emptinessSessions.length,
        };
    },

    /**
     * Write the backup data into Preferences, fully replacing current data.
     */
    async restoreBackup(payload: BackupPayload): Promise<RestoreResult> {
        const d = payload.data;

        await Promise.all([
            Preferences.set({ key: KEYS.observances, value: JSON.stringify(d.uposathaObservances) }),
            Preferences.set({ key: KEYS.malaEntries, value: JSON.stringify(d.malaEntries) }),
            Preferences.set({ key: KEYS.malaPrefs, value: JSON.stringify(d.malaPreferences) }),
            Preferences.set({ key: KEYS.anapanasatiSessions, value: JSON.stringify(d.anapanasatiSessions) }),
            d.anapanasatiSettings
                ? Preferences.set({ key: KEYS.anapanasatiSettings, value: JSON.stringify(d.anapanasatiSettings) })
                : Promise.resolve(),
            Preferences.set({ key: KEYS.mantras, value: JSON.stringify(d.mantras) }),
            Preferences.set({ key: KEYS.mantraSessions, value: JSON.stringify(d.mantraSessions) }),
            Preferences.set({ key: KEYS.emptinessSessions, value: JSON.stringify(d.emptinessSessions) }),
            this.restoreUserImages(d.userImages || {}),
        ]);

        return this.summarize(payload);
    },

    /**
     * Trigger a hidden file input, read the chosen JSON, and validate.
     * Returns the validated payload ready for restoreBackup().
     */
    importFromFile(): Promise<BackupPayload> {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json,application/json';
            input.style.display = 'none';

            input.addEventListener('change', async () => {
                const file = input.files?.[0];
                if (!file) {
                    reject(new Error('No file selected.'));
                    input.remove();
                    return;
                }

                try {
                    const text = await file.text();
                    const payload = BackupRestoreService.validateBackup(text);
                    resolve(payload);
                } catch (e: any) {
                    reject(e);
                } finally {
                    input.remove();
                }
            });

            // Handle cancel (no 'change' event fires)
            input.addEventListener('cancel', () => {
                reject(new Error('File selection cancelled.'));
                input.remove();
            });

            document.body.appendChild(input);
            input.click();
        });
    },

    /**
     * Helper to write restored images back to filesystem.
     */
    async restoreUserImages(images: Record<string, string>): Promise<void> {
        // Ensure directory exists
        try {
            await Filesystem.mkdir({
                directory: Directory.Data,
                path: 'mantra-images',
                recursive: true
            });
        } catch (e) { }

        for (const [path, base64] of Object.entries(images)) {
            try {
                await Filesystem.writeFile({
                    directory: Directory.Data,
                    path: path,
                    data: base64
                });
            } catch (e) {
                console.error(`Restore: Failed to write image ${path}`, e);
            }
        }
    }
};
