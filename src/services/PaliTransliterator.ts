
// Basic Pali Transliteration Map
// Note: This is a simplified transliterator. Complex ligatures might need more advanced handling, 
// but this covers the standard character mapping for Pali.

const VOWELS = {
    'a': { dev: 'अ' },
    'ā': { dev: 'आ' },
    'i': { dev: 'इ' },
    'ī': { dev: 'ई' },
    'u': { dev: 'उ' },
    'ū': { dev: 'ऊ' },
    'e': { dev: 'ए' },
    'o': { dev: 'ओ' }
};

const CONSONANTS = {
    'k': { dev: 'क' },
    'kh': { dev: 'ख' },
    'g': { dev: 'ग' },
    'gh': { dev: 'घ' },
    'ṅ': { dev: 'ङ' },
    'c': { dev: 'च' },
    'ch': { dev: 'छ' },
    'j': { dev: 'ज' },
    'jh': { dev: 'झ' },
    'ñ': { dev: 'ञ' },
    'ṭ': { dev: 'ट' },
    'ṭh': { dev: 'ठ' },
    'ḍ': { dev: 'ड' },
    'ḍh': { dev: 'ढ' },
    'ṇ': { dev: 'ण' },
    't': { dev: 'त' },
    'th': { dev: 'थ' },
    'd': { dev: 'द' },
    'dh': { dev: 'ध' },
    'n': { dev: 'न' },
    'p': { dev: 'प' },
    'ph': { dev: 'फ' },
    'b': { dev: 'ब' },
    'bh': { dev: 'भ' },
    'm': { dev: 'म' },
    'y': { dev: 'य' },
    'r': { dev: 'र' },
    'l': { dev: 'ल' },
    'v': { dev: 'व' },
    's': { dev: 'स' },
    'h': { dev: 'ह' },
    'ḷ': { dev: 'ळ' },
    'ṃ': { dev: 'ं', isModifier: true }, // Anusvara (dot below)
    'ṁ': { dev: 'ं', isModifier: true }  // Anusvara (dot above)
};

// Vowel signs (matras) when following a consonant
const VOWEL_SIGNS = {
    'ā': { dev: 'ा' },
    'i': { dev: 'ि' },
    'ī': { dev: 'ी' },
    'u': { dev: 'ु' },
    'ū': { dev: 'ू' },
    'e': { dev: 'े' },
    'o': { dev: 'ो' }
};

// Virama (stop) for consonants without vowel
const VIRAMA = { dev: '्' };

export const PaliTransliterator = {
    transliterate: (text: string, script: 'roman' | 'devanagari') => {
        if (!text || script === 'roman') return text;

        let out = '';
        let i = 0;
        const len = text.length;

        text = text.toLowerCase();

        while (i < len) {
            let char = text[i];
            let nextChar = text[i + 1];
            let twoChars = char + (nextChar || '');

            // Check for 2-char consonants (kh, gh, etc.)
            let cons = CONSONANTS[twoChars as keyof typeof CONSONANTS];
            let consLen = 2;

            if (!cons) {
                cons = CONSONANTS[char as keyof typeof CONSONANTS];
                consLen = 1;
            }

            if (cons) {
                // It's a consonant. Check next char for vowel.
                i += consLen;

                let vowelChar = text[i];
                let mappedCons = (cons as any).dev;
                out += mappedCons;

                // Modifiers (like Anusvara) don't take vowel signs or virama
                if (!(cons as any).isModifier) {
                    if (vowelChar === 'a') {
                        // Inherent 'a', skip in input
                        i++;
                    } else if (VOWEL_SIGNS[vowelChar as keyof typeof VOWEL_SIGNS]) {
                        // Explicit other vowel
                        out += (VOWEL_SIGNS[vowelChar as keyof typeof VOWEL_SIGNS] as any).dev;
                        i++;
                    } else {
                        // No vowel follows -> Virama (Halant)
                        out += VIRAMA.dev;
                    }
                }
            } else if (VOWELS[char as keyof typeof VOWELS]) {
                out += (VOWELS[char as keyof typeof VOWELS] as any).dev;
                i++;
            } else if (char === ' ') {
                out += ' ';
                i++;
            } else {
                out += char;
                i++;
            }
        }
        return out;
    }
};
