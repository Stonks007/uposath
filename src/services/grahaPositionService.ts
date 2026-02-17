import { nakshatraNames, type Panchangam } from '@ishubhamx/panchangam-js';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GrahaCard {
    id: string;          // 'sun', 'moon', 'mars', etc.
    englishName: string; // "Sun"
    sanskritName: string; // "Sūrya"
    icon: string;        // "☉"
    rashiName: string;   // "Capricorn"
    rashiSymbol: string; // "♑"
    degree: number;      // 21.2
    isRetrograde: boolean;
    dignity: string;     // 'exalted' | 'debilitated' | 'own' | 'neutral'
    nakshatraName: string;
    nakshatraPada: number;
    avastha: string;      // Baladi Avastha: Bala, Kumara, Yuva, Vriddha, Mrita
    intensity: number;    // Exaltation Intensity (0-100)
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PLANET_META: Record<string, { english: string; sanskrit: string; icon: string }> = {
    sun: { english: 'Sun', sanskrit: 'Sūrya', icon: '☉' },
    moon: { english: 'Moon', sanskrit: 'Chandra', icon: '☽' },
    mars: { english: 'Mars', sanskrit: 'Maṅgala', icon: '♂' },
    mercury: { english: 'Mercury', sanskrit: 'Budha', icon: '☿' },
    jupiter: { english: 'Jupiter', sanskrit: 'Guru', icon: '♃' },
    venus: { english: 'Venus', sanskrit: 'Śukra', icon: '♀' },
    saturn: { english: 'Saturn', sanskrit: 'Śani', icon: '♄' },
    rahu: { english: 'Rahu', sanskrit: 'Rāhu', icon: '☊' },
    ketu: { english: 'Ketu', sanskrit: 'Ketu', icon: '☋' },
};

const RASHI_SYMBOLS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', ' Pisces'];

const DEEP_EXALTATION: Record<string, number> = {
    sun: 10,       // 10 Aries
    moon: 33,      // 3 Taurus
    mars: 298,     // 28 Capricorn
    mercury: 165,  // 15 Virgo
    jupiter: 95,   // 5 Cancer
    venus: 357,    // 27 Pisces
    saturn: 200,   // 20 Libra
    rahu: 45,      // 15 Taurus
    ketu: 225      // 15 Scorpio
};

// ─── Core Function ───────────────────────────────────────────────────────────

function getAvastha(rashiIndex: number, degree: number): string {
    const isOdd = rashiIndex % 2 === 0;
    const stage = Math.floor(degree / 6);

    const stages = ['Bala', 'Kumara', 'Yuva', 'Vriddha', 'Mrita'];
    if (isOdd) {
        return stages[stage] || 'Mrita';
    } else {
        return stages[4 - stage] || 'Bala';
    }
}

function getIntensity(totalLong: number, planet: string): number {
    const exaltPoint = DEEP_EXALTATION[planet];
    if (exaltPoint === undefined) return 0;

    let diff = Math.abs(totalLong - exaltPoint);
    if (diff > 180) diff = 360 - diff;

    // Intensity: 100% at exalt point, 0% at debilitation point (180deg away)
    return Math.round(((180 - diff) / 180) * 100);
}

/**
 * Get display cards for all 9 Grahas based on the panchangam data.
 */
export function getGrahaCards(panchangam: Panchangam): GrahaCard[] {
    const positions = panchangam.planetaryPositions;
    const planetKeys = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'] as const;

    return planetKeys.map((key) => {
        const planetData = positions[key];
        const meta = PLANET_META[key];

        const degree = typeof planetData.degree === 'number'
            ? planetData.degree
            : (planetData.longitude % 30);

        const totalLong = planetData.longitude;

        // Nakshatra Index (0-26)
        const nakIndex = Math.floor(totalLong / (360 / 27));
        // Pada Index (1-4)
        const pada = Math.floor((totalLong % (360 / 27)) / (360 / 108)) + 1;

        return {
            id: key,
            englishName: meta.english,
            sanskritName: meta.sanskrit,
            icon: meta.icon,
            rashiName: planetData.rashiName,
            rashiSymbol: RASHI_SYMBOLS[planetData.rashi] || '?',
            degree: Number(degree.toFixed(2)),
            isRetrograde: planetData.isRetrograde,
            dignity: planetData.dignity,
            nakshatraName: nakshatraNames[nakIndex % 27],
            nakshatraPada: pada,
            avastha: getAvastha(planetData.rashi, degree),
            intensity: getIntensity(totalLong, key)
        };
    });
}
