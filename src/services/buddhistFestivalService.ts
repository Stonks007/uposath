/**
 * Buddhist Festival Service — Complete Overhaul
 *
 * Three independent detection systems for three Buddhist traditions:
 *   1. Theravada  → Indian Masa (Panchang) — tithi/masa matching
 *   2. Mahayana   → Chinese Lunar calendar — chinese-lunar library
 *   3. Vajrayana  → Tibetan calendar — pre-computed Gregorian date tables
 *
 * IMPORTANT: No Hindu festivals are included.
 */
import { type Panchangam, Observer } from '@ishubhamx/panchangam-js';
import { getPanchangam } from './panchangamService';
import { THERAVADA_PURNIMA_DATA, type FestivalEvent, type PurnimaEntry } from './theravadaPurnimaData';

// Re-export for consumers
export type { FestivalEvent } from './theravadaPurnimaData';

// ─── Types ───────────────────────────────────────────────────────────────────

export type BuddhistTradition = 'Theravada' | 'Mahayana' | 'Vajrayana';

export interface BuddhistFestival {
    id: string;
    name: string;
    description: string;
    tradition: BuddhistTradition;
    region?: string;
    /** Rich event data (Theravada Purnimas) */
    events?: FestivalEvent[];
    /** Alternative names */
    alsoKnownAs?: string;
    /** Pali/Sanskrit textual references */
    paliReferences?: string[];

    // ─ Internal detection fields (not for display) ─
    /** Indian Masa index 0-11 (Theravada only) */
    masaIndex?: number;
    /** Tithi index 0-29 (Theravada only) */
    tithiIndex?: number | number[];
    /** Fixed Gregorian month 1-12 (for fixed-date observances) */
    fixedMonth?: number;
    /** Fixed Gregorian day 1-31 (for fixed-date observances) */
    fixedDay?: number;
    /** Chinese lunar month 1-12 (Mahayana only) */
    chineseLunarMonth?: number;
    /** Chinese lunar day 1-30 (Mahayana only) */
    chineseLunarDay?: number;
}

export interface FestivalMatch {
    festival: BuddhistFestival;
    date: Date;
    daysRemaining: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. THERAVADA — Indian Masa / Panchang-based Detection
// ═══════════════════════════════════════════════════════════════════════════════

const MASA_MAP: Record<string, number> = {
    'Chaitra': 0, 'Vaiśākha': 1, 'Jyeṣṭha': 2, 'Āṣāḍha': 3,
    'Śrāvaṇa': 4, 'Bhādrapada': 5, 'Āśvina': 6, 'Kārttika': 7,
    'Mārgaśīrṣa': 8, 'Pauṣa': 9, 'Māgha': 10, 'Phālguna': 11
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

/** Look up rich Theravada Purnima event data by masa index */
function getTheravadaPurnimaEvents(masaIndex: number): PurnimaEntry | undefined {
    return THERAVADA_PURNIMA_DATA.find(p => p.masaIndex === masaIndex);
}

const RAW_THERAVADA_FESTIVALS = [
    { name: "Māgha Pūjā", lunar_day: "Purnima", masa: "Māgha", desc: "Sangha Day — Gathering of 1,250 Arahants", region: "Thailand, Cambodia, Laos, Sri Lanka" },
    { name: "Vesak", lunar_day: "Purnima", masa: "Vaiśākha", desc: "Buddha's Birth, Enlightenment, Parinirvana", region: "Global" },
    { name: "Āsāḷha Pūjā", lunar_day: "Purnima", masa: "Āṣāḍha", desc: "First Sermon (Dhammacakka Day)", region: "Thailand, Myanmar, Sri Lanka" },
    { name: "Pavāraṇā", lunar_day: "Purnima", masa: "Āśvina", desc: "End of Vassa (Rains Retreat)", region: "Theravada Countries" },
    { name: "Abhidhamma Day", lunar_day: "Purnima", masa: "Āśvina", desc: "Buddha taught Abhidhamma in Tavatimsa", region: "Myanmar" },
    { name: "Madhu Pūrṇimā", lunar_day: "Purnima", masa: "Bhādrapada", desc: "Honey Full Moon — Parileyyaka Forest", region: "Bangladesh, India, Thailand" },
    { name: "Poson Poya", lunar_day: "Purnima", masa: "Jyeṣṭha", desc: "Arrival of Buddhism in Sri Lanka", region: "Sri Lanka" },
    { name: "Esala Poya", lunar_day: "Purnima", masa: "Āṣāḍha", desc: "Celebration of First Sermon", region: "Sri Lanka" },
    { name: "Loy Krathong", lunar_day: "Purnima", masa: "Kārttika", desc: "Lantern Festival — Releasing karma", region: "Thailand" },
    // Additional Purnima-based entries for months without a named festival
    { name: "Pausha Purnima", lunar_day: "Purnima", masa: "Pauṣa", desc: "Kassapa brothers' conversion; First visit to Lanka", region: "India, Sri Lanka" },
    { name: "Phālguṇa Purnima", lunar_day: "Purnima", masa: "Phālguna", desc: "Buddha's journey to Kapilavatthu with 20,000 Arahants", region: "India, Nepal" },
    { name: "Caitra Purnima", lunar_day: "Purnima", masa: "Chaitra", desc: "First of the Four Signs; Second visit to Lanka", region: "India, Sri Lanka" },
    { name: "Śrāvaṇa Purnima", lunar_day: "Purnima", masa: "Śrāvaṇa", desc: "First Dhamma Saṅgīti; Rāhula's Arahantship", region: "India, Sri Lanka" },
    { name: "Kārtika Purnima", lunar_day: "Purnima", masa: "Kārttika", desc: "60 Arahants' mission; Sāriputta's Parinibbāna", region: "India, Sri Lanka" },
    { name: "Mārgaśīrṣa Purnima", lunar_day: "Purnima", masa: "Mārgaśīrṣa", desc: "Saṅghamittā's arrival with Mahābodhi branch", region: "Sri Lanka" },
    // ─ Non-Purnima tithi-based festivals ─
    { name: "Atthami Bucha", lunar_day: "23", masa: "Vaiśākha", desc: "Cremation of the Buddha — 8 days after Parinirvana", region: "Thailand" },
    { name: "Vassa Begins", lunar_day: "1", masa: "Śrāvaṇa", desc: "Start of the 3-month Rains Retreat (Vassāna)", region: "Theravada Countries" },
    { name: "Kathina", lunar_day: "Purnima", masa: "Kārttika", desc: "Post-Vassa robe offering ceremony to the Sangha", region: "Theravada Countries" },
];

const THERAVADA_FESTIVALS: BuddhistFestival[] = RAW_THERAVADA_FESTIVALS.map(f => {
    const masaIndex = MASA_MAP[f.masa];
    const purnimaData = getTheravadaPurnimaEvents(masaIndex);
    const paliRefs = purnimaData?.keyEvents
        .map(e => e.paliReference)
        .filter((ref): ref is string => !!ref) ?? [];

    return {
        id: f.name.toLowerCase().replace(/\s+/g, '_'),
        name: f.name,
        masaIndex,
        tithiIndex: parseTithi(f.lunar_day),
        description: f.desc,
        tradition: 'Theravada' as BuddhistTradition,
        region: f.region,
        events: purnimaData?.keyEvents,
        alsoKnownAs: purnimaData?.alsoKnownAs,
        paliReferences: paliRefs.length > 0 ? paliRefs : undefined,
    };
});

// ─── Fixed Gregorian Date Festivals (Theravada) ─────────────────────────────

const FIXED_DATE_FESTIVALS: BuddhistFestival[] = [
    {
        id: 'ambedkar_jayanti', name: "Ambedkar Jayanti",
        fixedMonth: 4, fixedDay: 14,
        description: "Birth Anniversary of Bodhisattva Dr. Babasaheb Ambedkar (1891)",
        tradition: 'Theravada', region: "India"
    },
    {
        id: 'ambedkar_death_anniversary', name: "Ambedkar Death Anniversary",
        fixedMonth: 12, fixedDay: 6,
        description: "Death Anniversary of Bodhisattva Dr. Babasaheb Ambedkar (1956)",
        tradition: 'Theravada', region: "India"
    },
    {
        id: 'dharmapala_day', name: "Dharmapala Day",
        fixedMonth: 9, fixedDay: 17,
        description: "Birth Anniversary of Anagarika Dharmapala (1864) — pioneer of Buddhist revival",
        tradition: 'Theravada', region: "Sri Lanka, India, Global"
    },
    {
        id: 'dharmapala_memorial', name: "Dharmapala Memorial",
        fixedMonth: 4, fixedDay: 29,
        description: "Death Anniversary of Anagarika Dharmapala (1933)",
        tradition: 'Theravada', region: "Sri Lanka, India"
    },
];

// ─── Ashoka Vijayadashami / Dhamma Diksha Detection ─────────────────────────

/**
 * Separate detection for Ashoka Vijayadashami (Ashwin Shukla Dashami).
 * Checks both current and next day panchangam to capture the tithi
 * at its start time rather than only at sunrise.
 */
function checkVijayadashami(
    date: Date,
    observer: Observer,
    panchangam?: Panchangam
): BuddhistFestival | null {
    // Ashwin = masaIndex 6, Dashami = tithi 9 (0-indexed)
    const ASHWIN_INDEX = 6;
    const DASHAMI_TITHI = 9;

    const p = panchangam ?? getPanchangam(date, observer);

    // Check current day
    if (p.masa.index === ASHWIN_INDEX && p.tithi === DASHAMI_TITHI) {
        return {
            id: 'ashoka_vijayadashami',
            name: "Ashoka Vijayadashami / Dhamma Diksha Day",
            description: "Emperor Ashoka's embrace of Buddhism; Dhamma Diksha Day — Dr. Ambedkar and ~500,000 followers converted to Buddhism at Deekshabhoomi, Nagpur (14 Oct 1956)",
            tradition: 'Theravada',
            region: "India",
        };
    }

    // Also check next day's panchangam to detect tithi that started after sunrise
    try {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        const pNext = getPanchangam(nextDay, observer);
        if (pNext?.masa?.index === ASHWIN_INDEX && pNext?.tithi === DASHAMI_TITHI) {
            return {
                id: 'ashoka_vijayadashami',
                name: "Ashoka Vijayadashami / Dhamma Diksha Day",
                description: "Emperor Ashoka's embrace of Buddhism; Dhamma Diksha Day — Dr. Ambedkar and ~500,000 followers converted to Buddhism at Deekshabhoomi, Nagpur (14 Oct 1956)",
                tradition: 'Theravada',
                region: "India",
            };
        }
    } catch { /* next-day panchangam unavailable */ }

    return null;
}

function checkTheravadaFestival(
    date: Date,
    observer: Observer,
    panchangam?: Panchangam
): BuddhistFestival | null {
    const p = panchangam ?? getPanchangam(date, observer);

    // 1. Check fixed Gregorian date observances
    const gMonth = date.getMonth() + 1;
    const gDay = date.getDate();
    const fixedMatch = FIXED_DATE_FESTIVALS.find(f =>
        f.fixedMonth === gMonth && f.fixedDay === gDay
    );
    if (fixedMatch) return fixedMatch;

    // 2. Check Ashoka Vijayadashami / Dhamma Diksha (separate tithi logic)
    const vijayadashami = checkVijayadashami(date, observer, p);
    if (vijayadashami) return vijayadashami;

    // 3. Standard masa/tithi matching
    return THERAVADA_FESTIVALS.find(f => {
        if (f.masaIndex !== p.masa.index) return false;
        if (Array.isArray(f.tithiIndex)) {
            return f.tithiIndex.includes(p.tithi);
        }
        return f.tithiIndex === p.tithi;
    }) ?? null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. MAHAYANA — Chinese Lunar Calendar Detection
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Chinese Lunar Calendar conversion.
 * Uses `chinese-lunar-calendar` library:
 *   getLunar(year, month, date) → { lunarMonth, lunarDate, isLeap, ... }
 */
let chineseLunarModule: any = null;

function getChineseLunarDateSync(date: Date): { month: number; day: number } | null {
    try {
        if (chineseLunarModule) {
            const result = chineseLunarModule.getLunar(
                date.getFullYear(),
                date.getMonth() + 1,
                date.getDate()
            );
            if (result) {
                return { month: result.lunarMonth, day: result.lunarDate };
            }
        }
    } catch { /* module not loaded or invalid date */ }
    return null;
}

const MAHAYANA_FESTIVALS: BuddhistFestival[] = [
    {
        id: 'maitreya_birthday', name: "Maitreya Buddha's Birthday",
        chineseLunarMonth: 1, chineseLunarDay: 1,
        description: "Birthday of the future Buddha Maitreya",
        tradition: 'Mahayana', region: "East Asia"
    },
    {
        id: 'shakyamuni_renunciation', name: "Shakyamuni's Renunciation Day",
        chineseLunarMonth: 2, chineseLunarDay: 8,
        description: "Siddhartha Gautama's Great Departure from the palace",
        tradition: 'Mahayana', region: "East Asia"
    },
    {
        id: 'parinirvana_day', name: "Parinirvāṇa Day",
        chineseLunarMonth: 2, chineseLunarDay: 15,
        description: "Buddha's passing into Parinirvana",
        tradition: 'Mahayana', region: "Global"
    },
    {
        id: 'guanyin_birthday', name: "Guanyin Birthday",
        chineseLunarMonth: 2, chineseLunarDay: 19,
        description: "Birthday of Avalokiteśvara (Guanyin) Bodhisattva — Compassion",
        tradition: 'Mahayana', region: "East Asia"
    },
    {
        id: 'samantabhadra_birthday', name: "Samantabhadra Birthday",
        chineseLunarMonth: 2, chineseLunarDay: 21,
        description: "Birthday of Samantabhadra (Pu Xian) Bodhisattva — Great Practice",
        tradition: 'Mahayana', region: "East Asia"
    },
    {
        id: 'manjushri_birthday', name: "Mañjuśrī Birthday",
        chineseLunarMonth: 4, chineseLunarDay: 4,
        description: "Birthday of Mañjuśrī Bodhisattva — Wisdom",
        tradition: 'Mahayana', region: "East Asia"
    },
    {
        id: 'buddha_birthday_mahayana', name: "Buddha's Birthday",
        chineseLunarMonth: 4, chineseLunarDay: 8,
        description: "Siddhartha Gautama's Birthday (Hanamatsuri / 佛誕)",
        tradition: 'Mahayana', region: "East Asia",
        alsoKnownAs: "Hanamatsuri / 佛誕"
    },
    {
        id: 'guanyin_enlightenment', name: "Guanyin Enlightenment",
        chineseLunarMonth: 6, chineseLunarDay: 19,
        description: "Avalokiteśvara's attainment of enlightenment",
        tradition: 'Mahayana', region: "East Asia"
    },
    {
        id: 'ullambana', name: "Ullambana",
        chineseLunarMonth: 7, chineseLunarDay: 15,
        description: "Ghost Festival — Merit offerings for ancestors (盂蘭盆節)",
        tradition: 'Mahayana', region: "China, Vietnam, Japan",
        alsoKnownAs: "Yu Lan Pen / Obon"
    },
    {
        id: 'ksitigarbha_birthday', name: "Kṣitigarbha Birthday",
        chineseLunarMonth: 7, chineseLunarDay: 30,
        description: "Birthday of Kṣitigarbha (Dizang / Jizō) Bodhisattva — Earth Store",
        tradition: 'Mahayana', region: "East Asia"
    },
    {
        id: 'guanyin_renunciation', name: "Guanyin Renunciation Day",
        chineseLunarMonth: 9, chineseLunarDay: 19,
        description: "Avalokiteśvara's renunciation and attainment of Bodhisattvahood",
        tradition: 'Mahayana', region: "East Asia"
    },
    {
        id: 'medicine_buddha_birthday', name: "Medicine Buddha Birthday",
        chineseLunarMonth: 9, chineseLunarDay: 30,
        description: "Birthday of Bhaiṣajyaguru — the Medicine Buddha (藥師佛)",
        tradition: 'Mahayana', region: "East Asia"
    },
    {
        id: 'amitabha_birthday', name: "Amitābha Birthday",
        chineseLunarMonth: 11, chineseLunarDay: 17,
        description: "Birthday of Amitābha Buddha — Infinite Light (阿彌陀佛)",
        tradition: 'Mahayana', region: "East Asia"
    },
    {
        id: 'bodhi_day', name: "Bodhi Day",
        chineseLunarMonth: 12, chineseLunarDay: 8,
        description: "Shakyamuni Buddha's Enlightenment (Rohatsu / 臘八)",
        tradition: 'Mahayana', region: "Japan, China, Korea",
        alsoKnownAs: "Rohatsu / 臘八節"
    },
];

// ─── Japanese Buddhist Festivals (Fixed Gregorian Dates) ─────────────────────

const JAPANESE_FESTIVALS: BuddhistFestival[] = [
    {
        id: 'shogatsu', name: "Shōgatsu",
        fixedMonth: 1, fixedDay: 1,
        description: "Japanese New Year — temple bell ringing (Joya no Kane) and first shrine visit",
        tradition: 'Mahayana', region: "Japan",
        alsoKnownAs: "正月"
    },
    {
        id: 'setsubun', name: "Setsubun",
        fixedMonth: 2, fixedDay: 3,
        description: "Bean-throwing festival — driving out evil spirits before the start of spring",
        tradition: 'Mahayana', region: "Japan",
        alsoKnownAs: "節分"
    },
    {
        id: 'spring_higan', name: "Spring Higan",
        fixedMonth: 3, fixedDay: 20,
        description: "Week of equinox observance — honoring ancestors and reflecting on the Six Pāramitās",
        tradition: 'Mahayana', region: "Japan",
        alsoKnownAs: "春彼岸"
    },
    {
        id: 'hanamatsuri', name: "Hanamatsuri",
        fixedMonth: 4, fixedDay: 8,
        description: "Flower Festival — Birthday of Shakyamuni Buddha (bathing the baby Buddha statue)",
        tradition: 'Mahayana', region: "Japan",
        alsoKnownAs: "花祭り"
    },
    {
        id: 'obon', name: "Obon",
        fixedMonth: 8, fixedDay: 13,
        description: "Festival of the Dead — honoring ancestors, lantern floating, and Bon Odori dances",
        tradition: 'Mahayana', region: "Japan",
        alsoKnownAs: "お盆"
    },
    {
        id: 'autumn_higan', name: "Autumn Higan",
        fixedMonth: 9, fixedDay: 22,
        description: "Autumn equinox observance — visiting graves, offering flowers, and chanting sūtras",
        tradition: 'Mahayana', region: "Japan",
        alsoKnownAs: "秋彼岸"
    },
];

function checkMahayanaFestival(date: Date): BuddhistFestival | null {
    // 1. Check fixed-date Japanese festivals
    const gMonth = date.getMonth() + 1;
    const gDay = date.getDate();
    const fixedMatch = JAPANESE_FESTIVALS.find(f =>
        f.fixedMonth === gMonth && f.fixedDay === gDay
    );
    if (fixedMatch) return fixedMatch;

    // 2. Chinese Lunar calendar matching
    const lunarDate = getChineseLunarDateSync(date);
    if (!lunarDate) return null;

    return MAHAYANA_FESTIVALS.find(f =>
        f.chineseLunarMonth === lunarDate.month && f.chineseLunarDay === lunarDate.day
    ) ?? null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. VAJRAYANA — Tibetan Calendar Pre-computed Date Tables
// ═══════════════════════════════════════════════════════════════════════════════

interface VajrayanaFestivalDef {
    id: string;
    name: string;
    description: string;
    region: string;
    tibetanMonth: number;
    tibetanDay: number;
    /** Gregorian dates indexed by year */
    dates: Record<number, string>; // year → "YYYY-MM-DD"
}

const VAJRAYANA_FESTIVAL_DEFS: VajrayanaFestivalDef[] = [
    {
        id: 'losar', name: "Losar",
        description: "Tibetan New Year — beginning of the Tibetan calendar year",
        region: "Tibet, Nepal, Bhutan",
        tibetanMonth: 1, tibetanDay: 1,
        dates: {
            2024: '2024-02-10', 2025: '2025-02-28', 2026: '2026-02-18',
            2027: '2027-02-07', 2028: '2028-02-25', 2029: '2029-02-14',
            2030: '2030-03-05'
        }
    },
    {
        id: 'chotrul_duchen', name: "Chotrul Düchen",
        description: "Festival of Miracles — Buddha's display of miraculous powers",
        region: "Tibet, Himalaya",
        tibetanMonth: 1, tibetanDay: 15,
        dates: {
            2024: '2024-02-24', 2025: '2025-03-14', 2026: '2026-03-03',
            2027: '2027-02-21', 2028: '2028-03-10', 2029: '2029-02-28',
            2030: '2030-03-18'
        }
    },
    {
        id: 'saga_dawa_duchen', name: "Saga Dawa Düchen",
        description: "Most sacred day — Buddha's Birth, Enlightenment, and Parinirvana",
        region: "Tibet, Himalaya",
        tibetanMonth: 4, tibetanDay: 15,
        dates: {
            2024: '2024-05-23', 2025: '2025-06-11', 2026: '2026-05-31',
            2027: '2027-06-18', 2028: '2028-06-07', 2029: '2029-05-27',
            2030: '2030-06-16'
        }
    },
    {
        id: 'chokhor_duchen', name: "Chökhor Düchen",
        description: "Turning the Dharma Wheel — Buddha's first teaching at Deer Park",
        region: "Tibet, Himalaya",
        tibetanMonth: 6, tibetanDay: 4,
        dates: {
            2024: '2024-07-21', 2025: '2025-07-28', 2026: '2026-07-18',
            2027: '2027-08-06', 2028: '2028-07-26', 2029: '2029-07-15',
            2030: '2030-08-03'
        }
    },
    {
        id: 'lhabab_duchen', name: "Lhabab Düchen",
        description: "Buddha's descent from Tushita heaven after teaching his mother",
        region: "Tibet, Himalaya",
        tibetanMonth: 9, tibetanDay: 22,
        dates: {
            2024: '2024-11-15', 2025: '2025-11-11', 2026: '2026-11-01',
            2027: '2027-11-20', 2028: '2028-11-11', 2029: '2029-10-29',
            2030: '2030-11-17'
        }
    },
    {
        id: 'ganden_ngamchoe', name: "Ganden Ngamchoe",
        description: "Tsongkhapa Memorial Day — anniversary of Lama Tsongkhapa's parinirvana",
        region: "Tibet, Himalaya (Gelug tradition)",
        tibetanMonth: 10, tibetanDay: 25,
        dates: {
            2024: '2024-12-25', 2025: '2025-12-14', 2026: '2026-12-03',
            2027: '2027-12-22', 2028: '2028-12-11', 2029: '2029-11-30',
            2030: '2030-12-19'
        }
    },
];

function checkVajrayanaFestival(date: Date): BuddhistFestival | null {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const year = date.getFullYear();

    for (const def of VAJRAYANA_FESTIVAL_DEFS) {
        if (def.dates[year] === dateStr) {
            return {
                id: def.id,
                name: def.name,
                description: def.description,
                tradition: 'Vajrayana',
                region: def.region,
            };
        }
    }
    return null;
}

function getVajrayanaFestivalsForYear(year: number): FestivalMatch[] {
    const results: FestivalMatch[] = [];
    const now = new Date();

    for (const def of VAJRAYANA_FESTIVAL_DEFS) {
        const dateStr = def.dates[year];
        if (!dateStr) continue;

        const date = new Date(dateStr + 'T12:00:00');
        const daysRemaining = Math.max(0, Math.ceil(
            (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        ));

        results.push({
            festival: {
                id: def.id,
                name: def.name,
                description: def.description,
                tradition: 'Vajrayana',
                region: def.region,
            },
            date,
            daysRemaining,
        });
    }

    return results;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Initialize the Mahayana detection system (loads chinese-lunar-calendar lazily).
 * Call once at app startup or before first use.
 */
export async function initMahayanaCalendar(): Promise<void> {
    try {
        chineseLunarModule = await import('chinese-lunar-calendar');
    } catch (e) {
        console.warn('Failed to load chinese-lunar-calendar module:', e);
    }
}

/**
 * Returns ALL festivals on a given date (multiple traditions may overlap).
 */
export function checkAllFestivals(
    date: Date,
    observer: Observer,
    panchangam?: Panchangam
): BuddhistFestival[] {
    const results: BuddhistFestival[] = [];

    const theravada = checkTheravadaFestival(date, observer, panchangam);
    if (theravada) results.push(theravada);

    const vajrayana = checkVajrayanaFestival(date);
    if (vajrayana) results.push(vajrayana);

    const mahayana = checkMahayanaFestival(date);
    if (mahayana) results.push(mahayana);

    return results;
}

export function checkFestival(
    date: Date,
    observer: Observer,
    panchangam?: Panchangam
): BuddhistFestival | null {
    const all = checkAllFestivals(date, observer, panchangam);
    return all.length > 0 ? all[0] : null;
}

export function checkFestivalByTradition(
    date: Date,
    observer: Observer,
    tradition: BuddhistTradition,
    panchangam?: Panchangam
): BuddhistFestival | null {
    if (tradition === 'Theravada') return checkTheravadaFestival(date, observer, panchangam);
    if (tradition === 'Vajrayana') return checkVajrayanaFestival(date);
    if (tradition === 'Mahayana') return checkMahayanaFestival(date);
    return null;
}

export async function getUpcomingFestivals(
    startDate: Date,
    observer: Observer,
    days = 365
): Promise<FestivalMatch[]> {
    const results: FestivalMatch[] = [];
    const seenIds = new Set<string>();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);

    // ── Vajrayana: fast lookup from date tables ──
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    for (let y = startYear; y <= endYear; y++) {
        const vajrayanaFestivals = getVajrayanaFestivalsForYear(y);
        for (const match of vajrayanaFestivals) {
            if (match.date >= startDate && match.date <= endDate && !seenIds.has(match.festival.id + match.date.toISOString())) {
                const daysRemaining = Math.max(0, Math.ceil(
                    (match.date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                ));
                seenIds.add(match.festival.id + match.date.toISOString());
                results.push({ ...match, daysRemaining });
            }
        }
    }

    // ── Theravada + Mahayana: daily scan ──
    const current = new Date(startDate);
    let daysProcessed = 0;
    while (current < endDate) {
        const p = getPanchangam(current, observer);

        // All traditions for this date
        const allFestivals = checkAllFestivals(current, observer, p);
        for (const fest of allFestivals) {
            const key = fest.id + current.toISOString().split('T')[0];
            if (!seenIds.has(key)) {
                seenIds.add(key);
                results.push({
                    festival: fest,
                    date: new Date(current),
                    daysRemaining: Math.max(0, Math.ceil(
                        (current.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                    )),
                });
            }
        }

        current.setDate(current.getDate() + 1);
        daysProcessed++;

        // Yield frequently to keep UI responsive on lower-end devices
        if (daysProcessed % 10 === 0) {
            await new Promise(r => setTimeout(r, 10));
        }
    }

    // Sort by date
    results.sort((a, b) => a.date.getTime() - b.date.getTime());

    return results;
}

export function getAllFestivalDefinitions(): BuddhistFestival[] {
    return [
        ...THERAVADA_FESTIVALS,
        ...FIXED_DATE_FESTIVALS,
        ...MAHAYANA_FESTIVALS,
        ...JAPANESE_FESTIVALS,
        ...VAJRAYANA_FESTIVAL_DEFS.map(d => ({
            id: d.id,
            name: d.name,
            description: d.description,
            tradition: 'Vajrayana' as BuddhistTradition,
            region: d.region,
        })),
    ];
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
