
// Basic Pali Transliteration Map
// Note: This is a simplified transliterator. Complex ligatures might need more advanced handling, 
// but this covers the standard character mapping for Pali.

const VOWELS = {
    'a': { dev: 'अ', sinh: 'අ', thai: 'อะ', bur: 'အ' },
    'ā': { dev: 'आ', sinh: 'ආ', thai: 'อา', bur: 'အာ' },
    'i': { dev: 'इ', sinh: 'ඉ', thai: 'อิ', bur: 'ဣ' },
    'ī': { dev: 'ई', sinh: 'ඊ', thai: 'อี', bur: 'ဤ' },
    'u': { dev: 'उ', sinh: 'උ', thai: 'อุ', bur: 'ဥ' },
    'ū': { dev: 'ऊ', sinh: 'ඌ', thai: 'อู', bur: 'ဦ' },
    'e': { dev: 'ए', sinh: 'එ', thai: 'เอ', bur: 'ဧ' },
    'o': { dev: 'ओ', sinh: 'ඔ', thai: 'โอ', bur: 'ဩ' }
};

const CONSONANTS = {
    'k': { dev: 'क', sinh: 'ක', thai: 'ก', bur: 'က' },
    'kh': { dev: 'ख', sinh: 'ඛ', thai: 'ข', bur: 'ခ' },
    'g': { dev: 'ग', sinh: 'ග', thai: 'ค', bur: 'ဂ' },
    'gh': { dev: 'घ', sinh: 'ඝ', thai: 'ฆ', bur: 'ဃ' },
    'ṅ': { dev: 'ङ', sinh: 'ඞ', thai: 'ง', bur: 'င' },
    'c': { dev: 'च', sinh: 'ච', thai: 'จ', bur: 'စ' },
    'ch': { dev: 'छ', sinh: 'ඡ', thai: 'ฉ', bur: 'ဆ' },
    'j': { dev: 'ज', sinh: 'ජ', thai: 'ช', bur: 'ဇ' },
    'jh': { dev: 'झ', sinh: 'ඣ', thai: 'ฌ', bur: 'ဈ' },
    'ñ': { dev: 'ञ', sinh: 'ඤ', thai: 'ญ', bur: 'ဉ' },
    'ṭ': { dev: 'ट', sinh: 'ට', thai: 'ฏ', bur: 'ဋ' },
    'ṭh': { dev: 'ठ', sinh: 'ඨ', thai: 'ฐ', bur: 'ဌ' },
    'ḍ': { dev: 'ड', sinh: 'ඩ', thai: 'ฑ', bur: 'ဍ' },
    'ḍh': { dev: 'ढ', sinh: 'ඪ', thai: 'ฒ', bur: 'ဎ' },
    'ṇ': { dev: 'ण', sinh: 'ණ', thai: 'ณ', bur: 'ဏ' },
    't': { dev: 'त', sinh: 'ත', thai: 'ต', bur: 'တ' },
    'th': { dev: 'थ', sinh: 'ථ', thai: 'ถ', bur: 'ထ' },
    'd': { dev: 'द', sinh: 'ද', thai: 'ท', bur: 'ဒ' },
    'dh': { dev: 'ध', sinh: 'ධ', thai: 'ธ', bur: 'ဓ' },
    'n': { dev: 'न', sinh: 'න', thai: 'น', bur: 'န' },
    'p': { dev: 'प', sinh: 'ප', thai: 'ป', bur: 'ပ' },
    'ph': { dev: 'फ', sinh: 'ඵ', thai: 'ผ', bur: 'ဖ' },
    'b': { dev: 'ब', sinh: 'බ', thai: 'พ', bur: 'ဗ' },
    'bh': { dev: 'भ', sinh: 'භ', thai: 'ภ', bur: 'ဘ' },
    'm': { dev: 'म', sinh: 'ම', thai: 'ม', bur: 'မ' },
    'y': { dev: 'य', sinh: 'ය', thai: 'ย', bur: 'ယ' },
    'r': { dev: 'र', sinh: 'ර', thai: 'ร', bur: 'ရ' },
    'l': { dev: 'ल', sinh: 'ල', thai: 'ล', bur: 'လ' },
    'v': { dev: 'व', sinh: 'ව', thai: 'ว', bur: 'ဝ' },
    's': { dev: 'स', sinh: 'ස', thai: 'ส', bur: 'သ' },
    'h': { dev: 'ह', sinh: 'හ', thai: 'ห', bur: 'ဟ' },
    'ḷ': { dev: 'ळ', sinh: 'ළ', thai: 'ฬ', bur: 'ဠ' },
    'ṃ': { dev: 'ं', sinh: 'ං', thai: 'ํ', bur: 'ံ', isModifier: true }, // Anusvara (dot below)
    'ṁ': { dev: 'ं', sinh: 'ං', thai: 'ํ', bur: 'ံ', isModifier: true }  // Anusvara (dot above)
};

// Vowel signs (matras) when following a consonant
const VOWEL_SIGNS = {
    'ā': { dev: 'ा', sinh: 'ා', thai: 'า', bur: 'ာ' },
    'i': { dev: 'ि', sinh: 'ි', thai: 'ิ', bur: 'ိ' },
    'ī': { dev: 'ी', sinh: 'ී', thai: 'ี', bur: 'ီ' },
    'u': { dev: 'ु', sinh: 'ු', thai: 'ุ', bur: 'ု' },
    'ū': { dev: 'ू', sinh: 'ූ', thai: 'ู', bur: 'ူ' },
    'e': { dev: 'े', sinh: 'ෙ', thai: 'เ', bur: 'ေ' },
    'o': { dev: 'ो', sinh: 'ො', thai: 'โ', bur: 'ော' }
};

// Virama (stop) for consonants without vowel
const VIRAMA = { dev: '्', sinh: '්', thai: 'ฺ', bur: '်' };

export const PaliTransliterator = {
    transliterate: (text: string, script: 'roman' | 'devanagari' | 'sinhala' | 'thai' | 'burmese') => {
        if (!text || script === 'roman') return text;

        // Lowercase for easier mapping, though proper nouns might need handling. 
        // Pali is mostly case-insensitive for pronunciation mapping.
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
                let nextVowelChar = text[i + 1]; // Not really used for simple vowels but consistent check?

                // Need to handle inherent 'a' vs simplified mapping
                // If next is a vowel, use vowel sign. If next is consonant or space, use virama (sometimes).
                // Pali simplified: Consonant implies 'a' unless other vowel or virama.
                // But input 'text' usually has explicit 'a'?. No, roman usually works like: 'k' = 'k' + 'a' ?
                // Standard roman: 'ka' -> k + a. 'k' at end -> k + virama? 

                // Let's assume input text standard IAST/ISO:
                // 'ka' -> क
                // 'k' -> क (if followed by space/end? or inherent a?)
                // Actually in standard romanization, 'a' is explicit. 'k' without 'a' is rare unless at end?
                // Wait, 'Buddham' -> m with dot usually. 

                // Simple logic:
                // Output consonant char.
                // If next char is a Vowel Key:
                //    Output Vowel Sign.
                //    Increment i.
                // Else (consonant, space, punctuation, or 'ṃ'):
                //    Output Virama (Halant) ? 
                //    Wait, in Pali 'a' is implicit in Devanagari consonant. 
                //    So 'k' in Roman maps to 'k'+'virama' in Devanagari?
                //    NO. 'k' in Roman usually means just the consonant sound K. 
                //    BUT 'ka' means KA.
                //    So if I find 'k' and next is NOT 'a', I should add virama?
                //    Actually:
                //    If next is 'a': skip 'a', output nothing (inherent).
                //    If next is other vowel: output vowel sign.
                //    If next is consonant/space/end: output virama.

                let mappedCons = (cons as any)[script === 'burmese' ? 'bur' : script === 'devanagari' ? 'dev' : script === 'sinhala' ? 'sinh' : 'thai'];
                out += mappedCons;

                // Modifiers (like Anusvara) don't take vowel signs or virama
                if (!(cons as any).isModifier) {
                    if (vowelChar === 'a') {
                        // Inherent 'a', do nothing to script usually. 
                        // Just skip the 'a' in input.
                        i++;
                    } else if (VOWEL_SIGNS[vowelChar as keyof typeof VOWEL_SIGNS]) {
                        // Explicit other vowel
                        out += (VOWEL_SIGNS[vowelChar as keyof typeof VOWEL_SIGNS] as any)[script === 'burmese' ? 'bur' : script === 'devanagari' ? 'dev' : script === 'sinhala' ? 'sinh' : 'thai'];
                        i++;
                    } else {
                        // No vowel follows -> Virama (Halant)
                        if (['dev', 'sinh', 'bur'].includes(script === 'burmese' ? 'bur' : script === 'devanagari' ? 'dev' : script === 'sinhala' ? 'sinh' : 'thai' as any)) {
                            out += (VIRAMA as any)[script === 'burmese' ? 'bur' : script === 'devanagari' ? 'dev' : script === 'sinhala' ? 'sinh' : 'thai'];
                        }
                    }
                }
            } else if (VOWELS[char as keyof typeof VOWELS]) {
                // Independent vowel (at start of word or after vowel? rare in Roman Pali to have vowel after vowel without break)
                out += (VOWELS[char as keyof typeof VOWELS] as any)[script === 'burmese' ? 'bur' : script === 'devanagari' ? 'dev' : script === 'sinhala' ? 'sinh' : 'thai'];
                i++;
            } else if (char === ' ') {
                out += ' ';
                i++;
            } else {
                // Punctuation or unknown
                out += char;
                i++;
            }
        }
        return out;
    }
};
