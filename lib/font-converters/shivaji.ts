/**
 * Shivaji01 (Marathi ASCII font) ⇄ Unicode Devanagari.
 *
 * Like Kruti Dev, Shivaji types most letters as a half letter plus the ा stem
 * (ग = "ga"), ि before its consonant cluster and the reph after its syllable. The rakar
 * is "`" after letters with a stem (प्र) and the "/" caret under round ones (ट्र, द्र).
 * Punctuation lives in the upper half, because the ASCII keys hold letters.
 *
 * Every glyph was identified by rendering the Shivaji01 font beside Unicode text in
 * Nirmala UI; a community table (Rajbhasha converters) was used as a starting list and
 * corrected where the font disagrees with it (ह्य, ः, ृ, ॅ, त्त्).
 */

import { greedyMap, iAfterCluster, iBeforeCluster, rephAfter, rephBefore, unicodeInput } from "@/lib/font-converters/legacy-devanagari";

type Table = [string, string][];

const chars = (...codes: number[]) => String.fromCharCode(...codes);
const I_MARK = chars(0xe000);
const REPH_MARK = chars(0xe001);

/** Letters drawn as one glyph. */
const FULL: Table = [
  ["क", "k"], ["ख", "K"], ["ङ", "="], ["छ", "C"], ["ट", "T"], ["ठ", "z"], ["ड", "D"], ["ढ", "Z"], ["त", "t"], ["द", "d"], ["प", "p"],
  ["फ", "f"], ["र", "r"], ["ह", "h"], ["ळ", "L"],
];
/** Half letters; the full letter is the half letter plus the ा stem "a". */
const HALF: Table = [
  ["ग", "g"], ["घ", "G"], ["च", "c"], ["ज", "j"], ["झ", "J"], ["ञ", "H"], ["ण", "N"], ["थ", "q"], ["ध", "Q"], ["न", "n"], ["ब", "b"],
  ["भ", "B"], ["म", "m"], ["य", "y"], ["ल", "l"], ["व", "v"], ["श", "S"], ["ष", "Y"], ["स", "s"], ["क्ष", "x"], ["श्र", "E"],
];
/** Half forms of letters that also have a one-glyph full form. */
const HALF_ONLY: Table = [["क्", "@"], ["ख्", "#"], ["त्", "%"], ["प्", "P"], ["ह्", "*"], ["त्त्", "<"], ["त्त", "<a"]];
const CONJUNCTS: Table = [
  ["त्र", "~"], ["ज्ञ", "&"], ["द्य", "V"], ["द्ध", "w"], ["द्व", "W"], ["द्द", "_"], ["क्त", ">"], ["ट्ट", "+"], ["ल्ल", ";"], ["ड्ड", "{"],
  ["ह्य", "("], ["हृ", ")"], ["न्न", chars(0xd9)], ["क्र", chars(0xcb)], ["फ्र", chars(0xcd)], ["ह्न", chars(0x153)], ["रु", chars(0xc9)], ["रू", "$"],
  ["कृ", chars(0xcc)], ["फृ", chars(0xce)],
  // Precomposed nukta letters, as unicodeInput() writes them.
  [chars(0x959), chars(0xd3)], [chars(0x95e), chars(0xd4)], [chars(0x931), chars(0xcf)],
  [chars(0x958), "k,"], [chars(0x95c), "D,"], [chars(0x95d), "Z,"], [chars(0x95a), "g,a"], [chars(0x95b), "j,a"], [chars(0x95f), "y,a"], [chars(0x929), "n,a"],
];
const VOWELS: Table = [
  ["अ", "A"], ["आ", "Aa"], ["इ", "["], ["ई", chars(0x161)], ["उ", "]"], ["ऊ", "}"], ["ऋ", "?"], ["ए", "e"], ["ऐ", "eO"], ["ओ", "Aao"], ["औ", "AaO"],
  ["ॐ", "!"], ["ऽ", "|"],
];
const SIGNS: Table = [
  ["ा", "a"], ["ी", "I"], ["ु", "u"], ["ू", "U"], ["ृ", "R"], ["े", "o"], ["ै", "O"], ["ो", "ao"], ["ौ", "aO"], ["ं", "M"], ["ँ", "^M"],
  ["ः", ":"], ["ॅ", "^"], ["ॉ", "a^"], ["्", "\\"], ["़", ","],
];
/** Punctuation sits in the upper half of the font (Windows-1252 positions). */
const PUNCTUATION: Table = [
  ["!", chars(0xb2)], ["(", chars(0xb3)], [")", chars(0xb4)], [",", chars(0xb8)], ["-", chars(0xb9)], [":", chars(0xc1)], [";", chars(0xc2)],
  ["?", chars(0xc6)], ["/", chars(0xc0)], ["%", chars(0x2030)], ["+", chars(0x2020)], ["‘", chars(0x2018)], ["’", chars(0x2019)],
  ["“", chars(0x201c)], ["”", chars(0x201d)], ["=", chars(0xc4)], ["*", chars(0xb5)], ["[", chars(0xa4)], ["]", chars(0xa5)],
];
const DIGITS: Table = [..."०१२३४५६७८९"].map((digit, i) => [digit, String(i)]);
/** ्र: round letters take the "/" caret, letters with a stem take "`". */
const RAKAR: Table = FULL.map(([letter, glyph]) => [`${letter}्र`, glyph + ("छटठडढदहङ".includes(letter) ? "/" : "`")]);

const ENCODE: Table = [
  ...CONJUNCTS, ...RAKAR, ...FULL, ...HALF_ONLY, ...VOWELS, ...SIGNS, ...PUNCTUATION, ...DIGITS, ["्र", "`"],
  ...HALF.flatMap(([letter, half]): Table => [[letter, `${half}a`], [`${letter}्`, half], [`${letter}्र`, `${half}a\``]]),
  ["श्र्", "E"],
];
const DECODE: Table = [
  ...ENCODE.filter(([unicode]) => unicode !== "्र").map(([unicode, legacy]): [string, string] => [legacy, unicode]),
  ...HALF.map(([letter, half]): [string, string] => [half, `${letter}्`]),
  ["/", "्र"], ["`", "्र"], ["i", I_MARK], ["-", REPH_MARK],
  // Other glyphs for the same text.
  ["X", "श"], [chars(0xdc), "ो"], [chars(0xdd), "ौ"], [chars(0xd0), "ँ"], [chars(0x178), "जि"], [chars(0xba), "."],
];

export function unicodeToShivaji(input: string): string {
  let text = unicodeInput(input);
  text = iBeforeCluster(text, I_MARK);
  text = rephAfter(text, REPH_MARK);
  return greedyMap(text, ENCODE).split(I_MARK).join("i").split(REPH_MARK).join("-");
}

export function shivajiToUnicode(input: string): string {
  let text = greedyMap(input, DECODE)
    // A half letter plus the ा stem is the full letter (a nukta may sit between them).
    .replace(/्(़?)ा/g, "$1")
    .replace(/ॅं/g, "ँ")
    .replace(/([ंँ])([ािीुूृेैोौ])/g, "$2$1")
    .replace(/ाे/g, "ो").replace(/ाै/g, "ौ").replace(/ाॅ/g, "ॉ")
    .replace(/अा/g, "आ").replace(/आे/g, "ओ").replace(/आै/g, "औ").replace(/अो/g, "ओ").replace(/अौ/g, "औ").replace(/एै/g, "ऐ");
  text = iAfterCluster(text, I_MARK);
  text = rephBefore(text, REPH_MARK);
  return text.normalize("NFC");
}
