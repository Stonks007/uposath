/**
 * Buddhist Festival Service
 * 
 * Detects Buddhist-only festivals based on the Indian Masa calendar system.
 * Uses the Sanskrit Masa months and specific tithis (lunar days).
 * 
 * IMPORTANT: No Hindu festivals are included.
 */
import { getPanchangam, type Panchangam, Observer } from '@ishubhamx/panchangam-js';

// ─── Types ───────────────────────────────────────────────────────────────────

export type BuddhistTradition = 'Theravada' | 'Mahayana' | 'Vajrayana';

export interface BuddhistFestival {
    id: string;
    name: string;
    /** Sanskrit Month Index (0 = Chaitra, 1 = Vaishakha, etc.) */
    masaIndex: number;
    /** Tithi Index (0-29. 14 = Purnima, 29 = Amavasya) */
    tithiIndex: number | number[];
    description: string;
    tradition: BuddhistTradition;
    region?: string;
}

export interface FestivalMatch {
    festival: BuddhistFestival;
    date: Date;
    daysRemaining: number;
}

// ─── Month Mapping ───────────────────────────────────────────────────────────

const MASA_MAP: Record<string, number> = {
    'Chaitra': 0,
    'Vaiśākha': 1,
    'Jyeṣṭha': 2,
    'Āṣāḍha': 3,
    'Śrāvaṇa': 4,
    'Bhādrapada': 5,
    'Āśvina': 6,
    'Kārttika': 7,
    'Mārgaśīrṣa': 8,
    'Pauṣa': 9,
    'Māgha': 10,
    'Phālguna': 11
};

function parseTithi(tithiStr: string): number | number[] {
    if (tithiStr === 'Purnima') return 14;
    if (tithiStr === 'Amavasya') return 29;
    if (tithiStr.includes('-')) {
        const [start, end] = tithiStr.split('-').map(s => parseInt(s.trim()) - 1);
        const range = [];
        for (let i = start; i <= end; i++) range.push(i);
        return range;
    }
    const val = parseInt(tithiStr);
    if (!isNaN(val)) return val - 1;
    return -1;
}

// ─── Festival Definitions ────────────────────────────────────────────────────

const RAW_FESTIVALS = {
    "Theravada": [
        { "name": "Māgha Pūjā", "lunar_day": "Purnima", "masa": "Māgha", "desc": "Sangha Day - Gathering of 1,250 Arahants" },
        { "name": "Vesak", "lunar_day": "Purnima", "masa": "Vaiśākha", "desc": "Buddha's Birth, Enlightenment, Parinirvana" },
        { "name": "Āsāḷha Pūjā", "lunar_day": "Purnima", "masa": "Āṣāḍha", "desc": "First Sermon (Dhammacakka Day)" },
        { "name": "Pavāraṇā", "lunar_day": "Purnima", "masa": "Āśvina", "desc": "End of Vassa (Rains Retreat)" },
        { "name": "Abhidhamma Day", "lunar_day": "Purnima", "masa": "Bhādrapada", "desc": "Buddha taught Abhidhamma in Tavatimsa" },
        { "name": "Madhu Pūrṇimā", "lunar_day": "Purnima", "masa": "Bhādrapada", "desc": "Honey Full Moon - Parileyyaka Forest" },
        { "name": "Poson Poya", "lunar_day": "Purnima", "masa": "Jyeṣṭha", "desc": "Arrival of Buddhism in Sri Lanka", "region": "Sri Lanka" },
        { "name": "Esala Poya", "lunar_day": "Purnima", "masa": "Āṣāḍha", "desc": "Celebration of First Sermon", "region": "Sri Lanka" }
    ],
    "Mahayana": [
        { "name": "Buddha's Birthday", "lunar_day": "8", "masa": "Vaiśākha", "desc": "Siddhartha Gautama's Birthday (Hanamatsuri)" },
        { "name": "Parinirvāṇa Day", "lunar_day": "15", "masa": "Pauṣa", "desc": "Buddha's passing into Parinirvana" },
        { "name": "Bodhi Day", "lunar_day": "8", "masa": "Pauṣa", "desc": "Buddha's Enlightenment (Rohatsu)" },
        { "name": "Avalokiteśvara Birthday", "lunar_day": "Purnima", "masa": "Phālguna", "desc": "Compassion Bodhisattva's Birthday" },
        { "name": "Ullambana", "lunar_day": "15", "masa": "Bhādrapada", "desc": "Ghost Festival - Merit for ancestors" },
        { "name": "Medicine Buddha Birthday", "lunar_day": "8", "masa": "Kārttika", "desc": "Bhaisajyaguru's Birthday" },
        { "name": "Manjuśrī Birthday", "lunar_day": "4", "masa": "Vaiśākha", "desc": "Wisdom Bodhisattva's Birthday" },
        { "name": "Kṣitigarbha Birthday", "lunar_day": "30", "masa": "Bhādrapada", "desc": "Dizang Pusa's Birthday" },
        { "name": "Guanyin Enlightenment", "lunar_day": "19", "masa": "Āṣāḍha", "desc": "Avalokiteśvara's attainment" },
        { "name": "Loy Krathong", "lunar_day": "Purnima", "masa": "Kārttika", "desc": "Lantern Festival - Releasing karma", "region": "Thailand" }
    ],
    "Vajrayana": [
        { "name": "Losar", "lunar_day": "Amavasya", "masa": "Phālguna", "desc": "Tibetan New Year" },
        { "name": "Chotrul Düchen", "lunar_day": "Purnima", "masa": "Māgha", "desc": "Festival of Miracles" },
        { "name": "Saga Dawa", "lunar_day": "Purnima", "masa": "Vaiśākha", "desc": "Birth, Enlightenment, and Parinirvana" },
        { "name": "Chokhor Düchen", "lunar_day": "4", "masa": "Āṣāḍha", "desc": "Turning the Dhamma Wheel" },
        { "name": "Lhabab Düchen", "lunar_day": "22", "masa": "Pauṣa", "desc": "Descent from Heaven" },
        { "name": "Monlam Chenmo", "lunar_day": "4-25", "masa": "Māgha", "desc": "Great Prayer Festival" },
        { "name": "Ganden Ngamchoe", "lunar_day": "25", "masa": "Vaiśākha", "desc": "Tsongkhapa Memorial Day" }
    ]
};

const BUDDHIST_FESTIVALS: BuddhistFestival[] = [];

Object.entries(RAW_FESTIVALS).forEach(([tradition, festivals]) => {
    festivals.forEach(f => {
        BUDDHIST_FESTIVALS.push({
            id: f.name.toLowerCase().replace(/\s+/g, '_'),
            name: f.name,
            masaIndex: MASA_MAP[f.masa],
            tithiIndex: parseTithi(f.lunar_day),
            description: f.desc,
            tradition: tradition as BuddhistTradition,
            region: (f as any).region
        });
    });
});

// ─── Core Functions ──────────────────────────────────────────────────────────

export function checkFestival(
    date: Date,
    observer: Observer,
    panchangam?: Panchangam
): BuddhistFestival | null {
    const p = panchangam ?? getPanchangam(date, observer);

    return BUDDHIST_FESTIVALS.find(f => {
        if (f.masaIndex !== p.masa.index) return false;

        if (Array.isArray(f.tithiIndex)) {
            return f.tithiIndex.includes(p.tithi);
        }
        return f.tithiIndex === p.tithi;
    }) ?? null;
}

export function checkFestivalByTradition(
    date: Date,
    observer: Observer,
    tradition: BuddhistTradition,
    panchangam?: Panchangam
): BuddhistFestival | null {
    const festival = checkFestival(date, observer, panchangam);
    if (!festival) return null;
    return festival.tradition === tradition ? festival : null;
}

export function getUpcomingFestivals(
    startDate: Date,
    observer: Observer,
    days = 365
): FestivalMatch[] {
    const results: FestivalMatch[] = [];
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);

    const current = new Date(startDate);

    while (current < endDate) {
        const p = getPanchangam(current, observer);
        const festival = checkFestival(current, observer, p);

        if (festival) {
            const daysRemaining = Math.max(0, Math.ceil(
                (current.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
            ));

            results.push({
                festival,
                date: new Date(current),
                daysRemaining,
            });
        }
        current.setDate(current.getDate() + 1);
    }

    return results;
}

export function getAllFestivalDefinitions(): BuddhistFestival[] {
    return [...BUDDHIST_FESTIVALS];
}

/**
 * Returns CSS variable names for a specific tradition.
 */
export function getTraditionColors(tradition: BuddhistTradition) {
    const lower = tradition.toLowerCase();
    return {
        primary: `var(--color-${lower}-primary)`,
        secondary: `var(--color-${lower}-secondary)`,
        accent: `var(--color-${lower}-accent)`,
        background: `var(--color-${lower}-bg)`,
        text: `var(--color-${lower}-text)`
    };
}
