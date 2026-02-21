
export interface LocalizedString {
    [key: string]: string; // 'en', 'hi', 'pa', etc.
}

export interface PaliString {
    [key: string]: string; // 'roman', 'devanagari', etc.
}

export interface Quality {
    number: number;
    pali: PaliString;
    name: LocalizedString;
    explanation: LocalizedString;
}

export interface Recollection {
    id: 'buddha' | 'dhamma' | 'sangha';
    order: number;
    title: LocalizedString;
    icon: string;
    color: string;
    verse: PaliString;
    translation: LocalizedString;
    qualities: Quality[];
}

export interface TripleGemData {
    title: LocalizedString;
    subtitle: PaliString;
    recollections: Recollection[];
}

export type PracticeType = 'buddha' | 'dhamma' | 'sangha';

export interface MalaEntry {
    id: string; // UUID
    timestamp: string; // ISO 8601
    beads: number;
    practiceType: PracticeType;
    notes?: string;
}

export interface PracticeStats {
    totalBeads: number;
    currentStreak: number;
    totalSessions: number;
    lastPracticeDate: string; // YYYY-MM-DD
}

export interface MalaStats {
    overall: PracticeStats;
    byType: {
        [key in PracticeType]: PracticeStats;
    };
    practiceDays: number; // All types combined
}

export interface SatiPreferences {
    quickButtons: number[];
    reminderEnabled: boolean;
    reminderTime: string; // "HH:MM"
    translationLanguage: string;
    paliScript: string;
    showTranslations: boolean;
    paliTextSize: 'small' | 'medium' | 'large' | 'xl';
}

// --- Emptiness Contemplation Types ---

export interface EmptinessStep {
    number: number;
    title: { [key: string]: string };
    pali: string;
    translation: { [key: string]: string };
    guidance: { [key: string]: string };
}

export interface EmptinessSection {
    id: string;
    order: number;
    tradition: 'theravada' | 'mahayana';
    source: {
        reference: string;
        composed?: string;
        name: { [key: string]: string };
    };

    title: { [key: string]: string };
    icon: string;
    color: string;
    content?: string;
    steps: EmptinessStep[];
}

export interface EmptinessData {
    title: { [key: string]: string };
    sections: EmptinessSection[];
}

export interface EmptinessSession {
    id: string;
    timestamp: string; // ISO
    durationMinutes: number;
    durationSeconds?: number;
    focus: string; // section id (e.g. 'anatta', 'heart_sutra')
    tradition: 'theravada' | 'mahayana';
    completed: boolean;
    quality?: number; // 1-5
    reflection?: string;
    tags?: string[];
}

export interface EmptinessStats {
    totalSessions: number;
    totalMinutes: number;
    currentStreak: number;
    lastPracticeDate: string | null;
    byTradition: {
        theravada: number; // count
        mahayana: number; // count
    };
    byTechnique: {
        [key: string]: {
            sessions: number;
            totalMinutes: number;
        }
    };
}

export const DEFAULT_PREFERENCES: SatiPreferences = {
    quickButtons: [108, 54, 27, 100, 50],
    reminderEnabled: false,
    reminderTime: "21:00",
    translationLanguage: "en",
    paliScript: "roman",
    showTranslations: true,
    paliTextSize: "medium"
};

// --- Custom Mantras Types ---

export type MantraTradition =
    | 'theravada'
    | 'mahayana'
    | 'tibetan'
    | 'zen'
    | 'pureland'
    | 'hindu'
    | 'custom';

export interface MantraBasicInfo {
    name: string;
    deity?: string; // Optional Deity name
    icon: string; // Emoji
}

export interface MantraText {
    primaryScript: string; // 'roman', 'devanagari', etc.
    primaryText: string;
    transliteration?: string;
}

export interface MantraPracticeSettings {
    defaultReps: number;
    defaultDurationMinutes: number;
    bellAtCompletion: boolean;
}

export interface MantraStats {
    totalSessions: number;
    totalReps: number;
    totalDurationMinutes: number;
    lastPracticeDate?: string;
    currentStreak: number;
}

export interface Mantra {
    id: string;
    created: string;
    updated: string;

    basic: MantraBasicInfo;
    text: MantraText;

    tradition: MantraTradition;
    purpose?: string;

    practice: MantraPracticeSettings;
    stats: MantraStats;
}

export interface MantraSession {
    id: string;
    mantraId: string;
    timestamp: string;
    durationMinutes: number;
    durationSeconds?: number;
    reps: number;
    completed: boolean;
    quality?: number; // 1-5
    notes?: string;
}

// --- Unified Stats Types ---

export type PracticeCategory = 'mala' | 'anapanasati' | 'mantra' | 'emptiness';

export interface UnifiedSession {
    id: string;
    timestamp: string;
    category: PracticeCategory;
    title: string;
    detail: string; // e.g., "108 beads", "20 mins", "Green Tara"
    durationSeconds?: number;
    notes?: string;
}

export interface GlobalStats {
    totalSessions: number;
    currentStreak: number;
    totalBeads: number;
    lastPracticeDate: string; // YYYY-MM-DD
}
