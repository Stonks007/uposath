
import tripleGemData from '../assets/data/triple_gem_recollection.json';
import { TripleGemData, LocalizedString } from '../types/SatiTypes';

// Type assertion since JSON import might be inferred loosely
const data: TripleGemData = tripleGemData as unknown as TripleGemData;

export const getTripleGemData = (): TripleGemData => {
    return data;
};

export const getLocalizedText = (obj: LocalizedString | undefined, lang: string, fallbackLang: string = 'en'): string => {
    if (!obj) return '';
    if (obj[lang]) return obj[lang];
    if (obj[fallbackLang]) return obj[fallbackLang];
    // Return first available key if fallback missing
    const keys = Object.keys(obj);
    if (keys.length > 0) return obj[keys[0]];
    return '';
};

import { PaliTransliterator } from './PaliTransliterator';

export const getPaliScriptText = (textObj: any, script: string): string => {
    if (!textObj) return '';

    // If exact script exists in JSON, use it (highest quality)
    if (textObj[script]) return textObj[script];

    // If not, and we have Roman, transliterate it
    if (textObj['roman']) {
        return PaliTransliterator.transliterate(textObj['roman'], script as any);
    }

    // Fallback to first available key
    const keys = Object.keys(textObj);
    return keys.length > 0 ? textObj[keys[0]] : '';
};

export const AVAILABLE_LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'Hindi (हिंदी)' },
    { code: 'pa', label: 'Punjabi (ပဉ္စ)' }, // Placeholder label
    { code: 'si', label: 'Sinhala (සිංහල)' },
    { code: 'th', label: 'Thai (ไทย)' },
    { code: 'my', label: 'Burmese (မြန်မာ)' },
    { code: 'zh', label: 'Chinese (中文)' },
    { code: 'ja', label: 'Japanese (日本語)' },
    { code: 'ko', label: 'Korean (한국어)' },
    { code: 'es', label: 'Spanish (Español)' },
    { code: 'pt', label: 'Portuguese (Português)' },
    { code: 'de', label: 'German (Deutsch)' },
    { code: 'fr', label: 'French (Français)' }
];

export const AVAILABLE_SCRIPTS = [
    { code: 'roman', label: 'Roman (Latin)' },
    { code: 'devanagari', label: 'Devanagari (देवनागरी)' },
    { code: 'sinhala', label: 'Sinhala (සිංහල)' },
    { code: 'thai', label: 'Thai (ไทย)' },
    { code: 'burmese', label: 'Burmese (မြန်မာ)' }
];
