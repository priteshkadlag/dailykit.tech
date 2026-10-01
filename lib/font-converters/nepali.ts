/**
 * Preeti and Kantipur (Nepali) ⇄ Unicode.
 *
 * Both are font-based encodings on the same keyboard layout: lowercase keys are full
 * letters, uppercase keys half letters, and a few keys modify their neighbours:
 * - "m" is a hook that turns the letter before it into another one: k (प) + m = फ, e (भ) + m = झ;
 * - "l" (ि) is typed before its consonant cluster, "{" (reph) after its syllable;
 * - a half letter + "f" (the ा stem) is the full letter: 0 (ण्) + f = ण.
 * Kantipur differs only in "F" (ा instead of ँ) and "“" (ँ).
 *
 * The layout was checked glyph by glyph against the Kantipur font and against
 * Preeti / Kantipur sample words.
 */

import { greedyMap, iAfterCluster, iBeforeCluster, rephAfter, rephBefore, tidyUnicode, unicodeInput } from "@/lib/font-converters/legacy-devanagari";

type Pairs = [string, string][];

// Private-use placeholders for signs that are moved after the table lookup.
const I_MARK = String.fromCharCode(0xe000);
const REPH_MARK = String.fromCharCode(0xe001);
const EYELASH_MARK = String.fromCharCode(0xe002);
const RA_STROKE_MARK = String.fromCharCode(0xe003);
const RA_MARK = String.fromCharCode(0xe004);
/** Eyelash ra: र् + zero-width joiner. */
const EYELASH = `र्${String.fromCharCode(0x200d)}`;

/** Unicode → Preeti. Longer keys win, so ligatures beat their parts. */
const LETTERS: Pairs = [
  // Vowels
  ["अ", "c"], ["आ", "cf"], ["इ", "O"], ["ई", "O{"], ["उ", "p"], ["ऊ", "pm"], ["ऋ", "C"], ["ए", "P"], ["ऐ", "P]"], ["ओ", "cf]"], ["औ", "cf}"],
  // Full consonants
  ["क", "s"], ["ख", "v"], ["ग", "u"], ["घ", "3"], ["ङ", "ª"], ["च", "r"], ["छ", "5"], ["ज", "h"], ["झ", "em"], ["ञ", "`"],
  ["ट", "6"], ["ठ", "7"], ["ड", "8"], ["ढ", "9"], ["ण", "0f"], ["त", "t"], ["थ", "y"], ["द", "b"], ["ध", "w"], ["न", "g"],
  ["प", "k"], ["फ", "km"], ["ब", "a"], ["भ", "e"], ["म", "d"], ["य", "o"], ["र", "/"], ["ल", "n"], ["व", "j"],
  ["श", "z"], ["ष", "if"], ["स", ";"], ["ह", "x"],
  // Half consonants
  ["क्", "S"], ["ख्", "V"], ["ग्", "U"], ["घ्", "£"], ["च्", "R"], ["ज्", "H"], ["झ्", "¤"], ["ञ्", "~"], ["ण्", "0"], ["त्", "T"], ["थ्", "Y"],
  ["ध्", "W"], ["न्", "G"], ["प्", "K"], ["फ्", "Km"], ["ब्", "A"], ["भ्", "E"], ["म्", "D"], ["ल्", "N"], ["व्", "J"], ["श्", "Z"], ["ष्", "i"],
  ["स्", ":"], ["ह्", "X"],
  // Conjuncts
  ["क्ष", "If"], ["क्ष्", "I"], ["ज्ञ", "1"], ["ज्ञ्", "¡"], ["त्र", "q"], ["त्र्", "œ"], ["क्र", "qm"], ["त्त", "Q"], ["त्त्", "Œ"], ["क्त", "Qm"],
  ["फ्र", "k|m"], ["श्र", ">"], ["द्द", "2"], ["द्ध", "4"], ["द्य", "B"], ["द्व", "å"], ["द्म", "ß"], ["द्घ", "¢"], ["ध्र", "„"],
  ["ट्ट", "§"], ["ठ्ठ", "¶"], ["ड्ड", "°"], ["ड्ढ", "•"], ["न्न", "Ì"], ["ङ्क", "Í"], ["ङ्ग", "Ë"], ["ङ्घ", "‹"],
  ["रु", "?"], ["रू", "¿"], ["हृ", "Å"],
  // Signs
  ["ा", "f"], ["ी", "L"], ["ु", "'"], ["ू", "\""], ["ृ", "["], ["े", "]"], ["ै", "}"], ["ो", "f]"], ["ौ", "f}"],
  ["ं", "+"], ["ँ", "F"], ["ः", "M"], ["्", "\\"], ["्र", "|"], ["ॅ", "‘"], ["ऽ", "˜"], ["ॐ", "ç"],
  // Digits and punctuation
  ["०", ")"], ["१", "!"], ["२", "@"], ["३", "#"], ["४", "$"], ["५", "%"], ["६", "^"], ["७", "&"], ["८", "*"], ["९", "("],
  ["।", "."], ["?", "<"], [".", "="], ["(", "-"], [")", "_"], ["/", "÷"], ["‘", "…"], ["’", "Ú"], ["“", "æ"], ["”", "Æ"], ["!", "†"], ["+", "±"],
];

/** Other Preeti spellings of the same letters. */
const ALTERNATES: Pairs = [["s|", "क्र"], ["«", "्र"], ["´", "झ"], ["Ô", "क्ष"], ["È", "ष"], ["©", "र"], ["®", "र"], ["µ", "र"], ["Â", "र"], ["‰", "झ्"], ["ˆ", "फ्"], ["¥", EYELASH]];

function tables(kantipur: boolean) {
  const encode: Pairs = LETTERS.map(([unicode, legacy]) => [unicode, unicode === "ँ" && kantipur ? "“" : legacy]);
  const decode: Pairs = [...encode.map(([unicode, legacy]): [string, string] => [legacy, unicode]), ...ALTERNATES];
  if (kantipur) decode.push(["F", "ा"]);
  return { encode, decode };
}

const PREETI = tables(false);
const KANTIPUR = tables(true);

/** Letters the "m" hook turns into others. */
const HOOKED: Record<string, string> = { k: "फ", K: "फ्", e: "झ", Q: "क्त", q: "क्र", p: "ऊ" };

function toUnicode(input: string, table: Pairs) {
  let text = input
    .replace(/O\{/g, "ई")
    // Signs typed in the "wrong" order that still look right in the font: ]f = ो, +} = ैं.
    .replace(/([\]}])f/g, "f$1")
    .replace(/\+([\]}])/g, "$1+")
    // The hook may follow the letter's signs: e]m = झे, hfpFm = जाऊँ.
    .replace(/([kKeQqp])([\]}'"F“[|\\+]*)m/g, (_, letter: string, signs: string) => HOOKED[letter] + signs)
    // The reph may sit inside ो / ौ or before other signs; it belongs after all of them.
    .replace(/\{([f\]}'"F“[+]+)/g, "$1{")
    // ्र ("«" / "|") may be typed after the vowel signs.
    .replace(/([\]}'"F“[+]+)([«|])/g, "$2$1");
  text = greedyMap(text, [...table, ["l", I_MARK], ["{", REPH_MARK]]);
  // ु / ू typed after a half letter belong to the letter after it: :'t = स्तु.
  text = text.replace(/्ा/g, "").replace(/्([ुू])([क-ह])/g, "्$2$1");
  text = iAfterCluster(text, I_MARK);
  text = rephBefore(text, REPH_MARK);
  return tidyUnicode(text).normalize("NFC");
}

function fromUnicode(input: string, table: Pairs) {
  let text = unicodeInput(input.normalize("NFC").split(EYELASH).join(EYELASH_MARK).replace(/ऱ्/g, EYELASH_MARK));
  text = iBeforeCluster(text, I_MARK);
  text = rephAfter(text, REPH_MARK);
  // ्र is a stroke on the full letter ("k|" = प्र), slanted for round letters. क्र त्र श्र फ्र have glyphs.
  text = text.replace(/([छटठडढ])्र/g, `$1${RA_STROKE_MARK}`).replace(/([खगघङचजझञणथदधनपबभमयलवषसह])्र/g, `$1${RA_MARK}`);
  return greedyMap(text, [...table, [I_MARK, "l"], [REPH_MARK, "{"], [EYELASH_MARK, "¥"], [RA_STROKE_MARK, "«"], [RA_MARK, "|"]]);
}

export const preetiToUnicode = (text: string) => toUnicode(text, PREETI.decode);
export const unicodeToPreeti = (text: string) => fromUnicode(text, PREETI.encode);
export const kantipurToUnicode = (text: string) => toUnicode(text, KANTIPUR.decode);
export const unicodeToKantipur = (text: string) => fromUnicode(text, KANTIPUR.encode);
