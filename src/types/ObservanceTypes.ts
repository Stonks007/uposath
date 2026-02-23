export interface UposathaObservance {
    id: string;
    date: string; // ISO YYYY-MM-DD
    moonPhase: 'full' | 'new' | 'quarter' | 'chaturdashi';
    paksha?: 'Shukla' | 'Krishna';
    tithi?: string; // Formatted as 'Paksha: TithiName'
    status: 'observed' | 'skipped' | 'ignored';
    level?: 'full' | 'partial' | 'minimal';
    precepts?: string[]; // e.g., '8_precepts', 'monastery', 'study'
    practiceMinutes?: {
        meditation: number;
        chanting: number;
        study: number;
    };
    quality?: number; // 1-5
    reflection?: string;
    skipReason?: 'work' | 'travel' | 'health' | 'forgot' | 'other';
    skipNote?: string;
    timestamp: string; // ISO for when the record was created/updated
}

export interface UposathaStats {
    totalTracked: number;
    observed: number;
    skipped: number;
    ignored: number;
    rate: number; // 0-100
    currentStreak: number;
    longestStreak: number;
    byMoonPhase: {
        full: { observed: number; total: number };
        new: { observed: number; total: number };
        quarter: { observed: number; total: number };
        chaturdashi: { observed: number; total: number };
    };
    monthlyStats: {
        month: string; // YYYY-MM
        observed: number;
        total: number;
    }[];
}
