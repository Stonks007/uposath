
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

export const DEFAULT_PREFERENCES: SatiPreferences = {
    quickButtons: [108, 54, 27, 100, 50],
    reminderEnabled: false,
    reminderTime: "21:00",
    translationLanguage: "en",
    paliScript: "roman",
    showTranslations: true,
    paliTextSize: "medium"
};
