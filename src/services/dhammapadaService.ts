import dhammapadaData from '../assets/data/dhammapada_max_muller_clean.json';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface DhammapadaVerse {
  globalVerseNumber: number;
  chapterNumber: number;
  chapterTitle: string;
  chapterVerseNumber: number;
  text: string;
}

interface DhammapadaChapter {
  chapterNumber: number;
  title: string;
  verses: {
    globalVerseNumber: number;
    chapterVerseNumber: number;
    text: string;
  }[];
}

interface DhammapadaData {
  title: string;
  translator: string;
  source: string;
  chapters: DhammapadaChapter[];
}

const data = dhammapadaData as DhammapadaData;

// Flatten all verses once at module load.
const allVerses: DhammapadaVerse[] = data.chapters.flatMap((chapter) =>
  chapter.verses.map((v) => ({
    globalVerseNumber: v.globalVerseNumber,
    chapterNumber: chapter.chapterNumber,
    chapterTitle: chapter.title,
    chapterVerseNumber: v.chapterVerseNumber,
    text: v.text,
  })),
);

// Fixed epoch so the same civil date maps to the same verse globally.
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const FIXED_EPOCH_UTC = Date.UTC(2020, 0, 1); // 2020‑01‑01 UTC

// ─── Helpers ───────────────────────────────────────────────────────────────────

function toUtcDateOnlyMs(date: Date): number {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  return Date.UTC(year, month, day);
}

function normaliseIndex(idx: number, length: number): number {
  const mod = idx % length;
  return mod < 0 ? mod + length : mod;
}

function stripHtml(raw: string): string {
  // Remove simple block-level tags and anchors used in the source.
  let cleaned = raw.replace(/<[^>]+>/g, ' ');
  // Decode a few common entities we know appear in the text.
  cleaned = cleaned
    .replace(/&mdash;/g, '—')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned;
}

// ─── Public API ────────────────────────────────────────────────────────────────

export function getAllVerses(): DhammapadaVerse[] {
  return allVerses;
}

export function getVerseByGlobalNumber(globalVerseNumber: number): DhammapadaVerse | undefined {
  return allVerses.find((v) => v.globalVerseNumber === globalVerseNumber);
}

export function getVerseForDate(date: Date): DhammapadaVerse {
  const utcMs = toUtcDateOnlyMs(date);
  const daysSinceEpoch = Math.floor((utcMs - FIXED_EPOCH_UTC) / MS_PER_DAY);
  const index = normaliseIndex(daysSinceEpoch, allVerses.length);
  return allVerses[index];
}

export function getRandomVerse(excludeGlobalVerseNumber?: number): DhammapadaVerse {
  if (allVerses.length === 0) {
    throw new Error('Dhammapada data not available');
  }

  if (allVerses.length === 1) {
    return allVerses[0];
  }

  let verse: DhammapadaVerse;
  do {
    const idx = Math.floor(Math.random() * allVerses.length);
    verse = allVerses[idx];
  } while (excludeGlobalVerseNumber && verse.globalVerseNumber === excludeGlobalVerseNumber);

  return verse;
}

export function getCleanVerseText(verse: DhammapadaVerse): string {
  return stripHtml(verse.text);
}

export function getVerseExcerpt(verse: DhammapadaVerse, maxChars = 120): string {
  const cleaned = getCleanVerseText(verse);
  if (cleaned.length <= maxChars) return cleaned;

  const truncated = cleaned.slice(0, maxChars);
  const lastSpace = truncated.lastIndexOf(' ');
  const safe = lastSpace > 40 ? truncated.slice(0, lastSpace) : truncated;
  return `${safe.trim()}…`;
}

export function getVerseDisplayReference(verse: DhammapadaVerse): string {
  return `Dhammapada ${verse.chapterNumber}:${verse.chapterVerseNumber}`;
}

