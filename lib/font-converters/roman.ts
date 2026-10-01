/**
 * Devanagari ⇄ Roman helpers.
 *
 * `devanagariToRoman` writes Hindi in Latin letters, either as everyday
 * "Hinglish" (bharat, namaste) or as scholarly IAST (bhārata, namaste).
 * `romanToDevanagari` is the phonetic typing aid: "namaste" → नमस्ते.
 */

const VIRAMA = "्";
const NUKTA = "़";

const CONSONANTS: Record<string, [hinglish: string, iast: string]> = {
  क: ["k", "k"], ख: ["kh", "kh"], ग: ["g", "g"], घ: ["gh", "gh"], ङ: ["ng", "ṅ"],
  च: ["ch", "c"], छ: ["chh", "ch"], ज: ["j", "j"], झ: ["jh", "jh"], ञ: ["ny", "ñ"],
  ट: ["t", "ṭ"], ठ: ["th", "ṭh"], ड: ["d", "ḍ"], ढ: ["dh", "ḍh"], ण: ["n", "ṇ"],
  त: ["t", "t"], थ: ["th", "th"], द: ["d", "d"], ध: ["dh", "dh"], न: ["n", "n"],
  प: ["p", "p"], फ: ["ph", "ph"], ब: ["b", "b"], भ: ["bh", "bh"], म: ["m", "m"],
  य: ["y", "y"], र: ["r", "r"], ल: ["l", "l"], ळ: ["l", "ḷ"], व: ["v", "v"],
  श: ["sh", "ś"], ष: ["sh", "ṣ"], स: ["s", "s"], ह: ["h", "h"],
};
/** Consonant + nukta (क़ ख़ ग़ ज़ ड़ ढ़ फ़ य़). */
const NUKTA_CONSONANTS: Record<string, [string, string]> = {
  क: ["q", "q"], ख: ["kh", "ḵh"], ग: ["gh", "ġ"], ज: ["z", "z"], ड: ["r", "ṛ"], ढ: ["rh", "ṛh"], फ: ["f", "f"], य: ["y", "ẏ"],
};
const VOWELS: Record<string, [string, string]> = {
  अ: ["a", "a"], आ: ["aa", "ā"], इ: ["i", "i"], ई: ["ee", "ī"], उ: ["u", "u"], ऊ: ["oo", "ū"], ऋ: ["ri", "r̥"],
  ए: ["e", "e"], ऐ: ["ai", "ai"], ओ: ["o", "o"], औ: ["au", "au"], ऑ: ["o", "ô"], ऍ: ["e", "ê"],
};
const MATRAS: Record<string, [string, string]> = {
  "ा": ["a", "ā"], "ि": ["i", "i"], "ी": ["i", "ī"], "ु": ["u", "u"], "ू": ["u", "ū"], "ृ": ["ri", "r̥"],
  "े": ["e", "e"], "ै": ["ai", "ai"], "ो": ["o", "o"], "ौ": ["au", "au"], "ॉ": ["o", "ô"], "ॅ": ["e", "ê"],
};
const SIGNS: Record<string, [string, string]> = { "ं": ["n", "ṁ"], "ँ": ["n", "m̐"], "ः": ["h", "ḥ"], "ऽ": ["", "'"], "।": [".", "."], "॥": [".", ".."], "ॐ": ["om", "oṁ"] };
const DIGITS = "०१२३४५६७८९";

export type RomanScheme = "hinglish" | "iast";

/** One written syllable: an optional consonant plus its vowel ("" after a virama, "a" when inherent). */
interface Unit { consonant: string; vowel: string; inherent: boolean; sign: string }

export function devanagariToRoman(input: string, scheme: RomanScheme = "hinglish"): string {
  const s = scheme === "iast" ? 1 : 0;
  return input.normalize("NFC").replace(/[ऀ-ॿ]+/gu, (word) => {
    const chars = Array.from(word);
    const units: Unit[] = [];
    let passthrough = "";
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      if (CONSONANTS[char]) {
        const nukta = chars[i + 1] === NUKTA ? NUKTA_CONSONANTS[char] : undefined;
        if (nukta) i++;
        const next = chars[i + 1];
        const unit: Unit = { consonant: (nukta ?? CONSONANTS[char])[s], vowel: "a", inherent: true, sign: "" };
        if (next === VIRAMA) { unit.vowel = ""; unit.inherent = false; i++; }
        else if (next && MATRAS[next]) { unit.vowel = MATRAS[next][s]; unit.inherent = false; i++; }
        units.push(unit);
      } else if (VOWELS[char]) units.push({ consonant: "", vowel: VOWELS[char][s], inherent: false, sign: "" });
      else if (SIGNS[char] && units.length) units[units.length - 1].sign += SIGNS[char][s];
      else if (SIGNS[char]) passthrough += SIGNS[char][s];
      else if (DIGITS.includes(char)) passthrough += String(DIGITS.indexOf(char));
    }
    if (!units.length) return passthrough;

    // Hindi schwa deletion (IAST keeps every vowel): drop the word-final inherent
    // "a", then, right to left, drop any inherent "a" in a V C(a) C V pattern —
    // राजधानी → rajdhani, समझना → samajhna, but नमस्ते → namaste.
    if (scheme === "hinglish" && units.length > 1) {
      const last = units[units.length - 1];
      if (last.inherent && !last.sign) last.vowel = "";
      for (let k = units.length - 2; k > 0; k--) {
        const [prev, unit, next] = [units[k - 1], units[k], units[k + 1]];
        // Only after an open syllable: ज़िंदगी keeps its "a" (zindagi), since ज़िं is closed by the nasal.
        if (unit.inherent && !unit.sign && prev.vowel && !prev.sign && next.consonant && next.vowel) unit.vowel = "";
      }
    }
    return units.map((u) => u.consonant + u.vowel + u.sign).join("") + passthrough;
  });
}

// ---- Roman → Devanagari (phonetic typing)

const R_CONSONANTS: [string, string][] = [
  ["ksh", "क्ष"], ["chh", "छ"], ["gy", "ज्ञ"], ["dny", "ज्ञ"], ["shr", "श्र"], ["tr", "त्र"],
  ["kh", "ख"], ["gh", "घ"], ["ch", "च"], ["jh", "झ"], ["Th", "ठ"], ["Dh", "ढ"], ["th", "थ"], ["dh", "ध"],
  ["ph", "फ"], ["bh", "भ"], ["sh", "श"], ["Sh", "ष"], ["S", "ष"], ["ng", "ङ"], ["ny", "ञ"],
  ["k", "क"], ["g", "ग"], ["c", "क"], ["j", "ज"], ["T", "ट"], ["D", "ड"], ["N", "ण"], ["t", "त"], ["d", "द"], ["n", "न"],
  ["p", "प"], ["f", "फ़"], ["b", "ब"], ["m", "म"], ["y", "य"], ["r", "र"], ["l", "ल"], ["L", "ळ"], ["v", "व"], ["w", "व"],
  ["s", "स"], ["h", "ह"], ["z", "ज़"], ["q", "क़"], ["x", "क्स"],
];
const R_VOWELS: [string, string, string][] = [
  // roman, independent, matra
  ["aa", "आ", "ा"], ["ai", "ऐ", "ै"], ["au", "औ", "ौ"], ["ee", "ई", "ी"], ["ii", "ई", "ी"], ["oo", "ऊ", "ू"], ["uu", "ऊ", "ू"], ["ri", "ऋ", "ृ"],
  ["A", "आ", "ा"], ["I", "ई", "ी"], ["U", "ऊ", "ू"], ["a", "अ", ""], ["i", "इ", "ि"], ["u", "उ", "ु"], ["e", "ए", "े"], ["o", "ओ", "ो"],
];

/**
 * Transliterates one run of Latin letters. Capitals A I U T D N L S M H are
 * meaningful (ITRANS-style); other capitals are read as lower case. Final
 * consonants keep their inherent "a" (ram → रम, raam → राम).
 */
function romanWord(raw: string): string {
  // A capital first letter is just sentence case ("Delhi"), not retroflex D.
  const word = raw.replace(/^[A-Z](?=[a-z])/, (c) => c.toLowerCase()).replace(/[BCEFGJKOPQRVWXYZ]/g, (c) => c.toLowerCase());
  let out = "";
  let i = 0;
  let afterConsonant = false;
  while (i < word.length) {
    const rest = word.slice(i);
    // n after a vowel and before a stop is nasalised: sundar → सुंदर, hindi → हिंदी.
    if (rest[0] === "M" || (i > 0 && !afterConsonant && /^n[kgcjtdpb]/.test(rest))) {
      out += "ं";
      i++;
      continue;
    }
    if (rest[0] === "H") {
      out += "ः";
      i++;
      afterConsonant = false;
      continue;
    }
    // "ri" is ऋ only at the start of a word or after a consonant (krishna → कृष्ण), never in hari → हरि.
    const vowel = R_VOWELS.find(([roman]) => rest.startsWith(roman) && !(roman === "ri" && i > 0 && !afterConsonant));
    const consonant = R_CONSONANTS.find(([roman]) => rest.startsWith(roman));
    if (vowel) {
      out += afterConsonant ? vowel[2] : vowel[1];
      i += vowel[0].length;
      afterConsonant = false;
    } else if (consonant) {
      if (afterConsonant) out += VIRAMA;
      out += consonant[1];
      i += consonant[0].length;
      afterConsonant = true;
    } else {
      out += rest[0];
      i++;
      afterConsonant = false;
    }
  }
  return out;
}

export function romanToDevanagari(input: string): string {
  return input.replace(/[A-Za-z]+/g, romanWord);
}
