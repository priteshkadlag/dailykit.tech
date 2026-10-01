/**
 * Devanagari (Hindi / Marathi) → Bharati Braille, as Unicode braille cells.
 *
 * Bharati Braille spells words phonetically:
 * - vowel signs are written as full vowels after their consonant (कि = K I), in speaking order;
 * - the inherent "a" is not written, except before another vowel (कइ = K A I, unlike कि = K I);
 * - a dead consonant takes the virama cell *before* it (क् = ⠈⠅), and conjuncts are
 *   written as dead consonants, except क्ष and ज्ञ which have their own cells.
 */

/** A braille cell from its dot numbers: cell("135") = ⠕. */
const cell = (dots: string) => String.fromCharCode(0x2800 + [...dots].reduce((bits, dot) => bits | (1 << (Number(dot) - 1)), 0));
const cells = (...dots: string[]) => dots.map(cell).join("");

const VOWELS: Record<string, string> = {
  अ: cell("1"), आ: cell("345"), इ: cell("24"), ई: cell("35"), उ: cell("136"), ऊ: cell("1256"), ऋ: cells("5", "1235"),
  ए: cell("15"), ऐ: cell("34"), ओ: cell("135"), औ: cell("246"),
};
const VOWEL_SIGNS: Record<string, string> = {
  "ा": VOWELS.आ, "ि": VOWELS.इ, "ी": VOWELS.ई, "ु": VOWELS.उ, "ू": VOWELS.ऊ, "ृ": VOWELS.ऋ,
  "े": VOWELS.ए, "ै": VOWELS.ऐ, "ो": VOWELS.ओ, "ौ": VOWELS.औ,
};
const CONSONANTS: Record<string, string> = {
  क: cell("13"), ख: cell("46"), ग: cell("1245"), घ: cell("126"), ङ: cell("346"),
  च: cell("14"), छ: cell("16"), ज: cell("245"), झ: cell("356"), ञ: cell("25"),
  ट: cell("23456"), ठ: cell("2456"), ड: cell("1246"), ढ: cell("123456"), ण: cell("3456"),
  त: cell("2345"), थ: cell("1456"), द: cell("145"), ध: cell("2346"), न: cell("1345"),
  प: cell("1234"), फ: cell("235"), ब: cell("12"), भ: cell("45"), म: cell("134"),
  य: cell("13456"), र: cell("1235"), ल: cell("123"), ळ: cell("456"), व: cell("1236"),
  श: cell("146"), ष: cell("12346"), स: cell("234"), ह: cell("125"),
  "क्ष": cell("12345"), "ज्ञ": cell("156"),
  // Nukta letters with their own cells.
  "ड़": cell("12456"), "ढ़": cells("5", "12456"), "फ़": cell("124"), "ज़": cell("1356"),
};
const SIGNS: Record<string, string> = { "ं": cell("56"), "ँ": cell("3"), "ः": cell("6"), "ऽ": cell("2") };
const PUNCTUATION: Record<string, string> = {
  "।": cell("256"), "॥": cells("256", "256"), ".": cell("256"), ",": cell("2"), "?": cell("236"), "!": cell("235"),
  ";": cell("23"), ":": cell("25"), "-": cell("36"),
};
const VIRAMA_CELL = cell("4");
const NUMBER_SIGN = cell("3456");
/** Digits 1–9, 0 are the letters a–j after the number sign. */
const DIGIT_CELLS = ["245", "1", "12", "14", "145", "15", "124", "1245", "125", "24"].map(cell);

const CONSONANT_KEYS = Object.keys(CONSONANTS).map((key) => key.normalize("NFD")).sort((a, b) => b.length - a.length);
const CONSONANT_CELLS = new Map(Object.entries(CONSONANTS).map(([key, value]) => [key.normalize("NFD"), value]));

export function devanagariToBraille(input: string): string {
  // NFD keeps nukta letters as letter + ़, so one lookup covers both spellings.
  const text = input.normalize("NFD");
  let out = "";
  let at = 0;
  while (at < text.length) {
    const consonant = CONSONANT_KEYS.find((key) => text.startsWith(key, at));
    if (consonant) {
      at += consonant.length;
      if (text[at] === "़") at++; // nukta letters without their own cell are written as the plain letter
      const letter = CONSONANT_CELLS.get(consonant)!;
      if (text[at] === "्") {
        out += VIRAMA_CELL + letter;
        at++;
        continue;
      }
      out += letter;
      const sign = VOWEL_SIGNS[text[at]];
      if (sign) {
        out += sign;
        at++;
      } else if (VOWELS[text[at]]) out += VOWELS.अ; // the inherent a is written before another vowel
      continue;
    }
    const char = text[at];
    const digit = /[०-९0-9]/u.test(char) ? (char.charCodeAt(0) - (char < "a" ? 0x30 : 0x966)) : -1;
    if (digit >= 0) {
      // One number sign per run of digits.
      if (!/[०-९0-9]/u.test(text[at - 1] ?? "")) out += NUMBER_SIGN;
      out += DIGIT_CELLS[digit];
    } else out += VOWELS[char] ?? VOWEL_SIGNS[char] ?? SIGNS[char] ?? PUNCTUATION[char] ?? (char === "़" ? "" : char);
    at++;
  }
  return out.normalize("NFC");
}
