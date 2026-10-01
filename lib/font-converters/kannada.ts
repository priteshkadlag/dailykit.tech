/**
 * Nudi / Baraha (Kannada ASCII fonts) ⇄ Unicode Kannada.
 *
 * Nudi draws a syllable from pieces: a base glyph (often carrying its vowel sign, ಕಿ = "Q"),
 * then subscript consonant glyphs (vattakshara: ಕ್ಕ = "PÀ" + "Ì"), trailing vowel-sign
 * glyphs that combine with what came before (ಕಿ + "Ã" = ಕೀ) and the arkavattu "ð" (ರ್ on
 * a syllable). Nudi → Unicode follows Kannada Ganaka Parishat's official converter;
 * Unicode → Nudi builds each syllable from the same tables.
 */

import { NUDI_ADDITIONAL, NUDI_BROKEN, NUDI_MAPPING, NUDI_VATTAKSHARA } from "@/lib/font-converters/tables/nudi.generated";

const HALANT = "್";
const ZWJ = String.fromCharCode(0x200d);
const IS_CONSONANT = /^[ಕ-ಹೞ]$/u;
const ARKAVATTU = "ð";
const DEPENDENT_VOWELS = new Set(["್", "ಾ", "ಿ", "ೀ", "ು", "ೂ", "ೃ", "ೆ", "ೇ", "ೈ", "ೊ", "ೋ", "ೌ", "ಂ", "ಃ"]);
/** Glyphs that are only there for spacing. */
const IGNORED = new Set(["ö", "÷"]);
/** Typing slips the official converter tidies first. */
const CLEANUPS: [string, string][] = [["P À", "PÀ"], ["g À å", "gÀå"], ["ÀÀ", "À"], ["ÉÉ", "É"], ["ðÀ", "ð"], ["ÉÀ", "É"]];

const MAX_KEY = Math.max(...Object.keys(NUDI_MAPPING).map((key) => key.length));
const KEY_PREFIXES = new Set(Object.keys(NUDI_MAPPING).flatMap((key) => [...key].map((_, i) => key.slice(0, i + 1))));

/** Longest mapping at `at`, as [length, Unicode]. */
function longestMatch(text: string, at: number): [number, string] | undefined {
  for (let length = Math.min(MAX_KEY, text.length - at); length > 0; length--) {
    const piece = text.slice(at, at + length);
    const value = NUDI_MAPPING[piece];
    // Don't let a sequence ending in "A" (ಂ) swallow the start of "AiÀ…" (ಯ).
    if (value !== undefined && !(piece.endsWith("A") && /^i[ÀÁ]/.test(text.slice(at + length)))) return [length, value];
    if (NUDI_ADDITIONAL[piece] !== undefined) return [length, NUDI_ADDITIONAL[piece]];
  }
  return undefined;
}

/** A vowel sign that ended up before a halant (ಪಿ + ್ರ) moves after the consonant it now belongs to. */
function fixOrdering(out: string[]) {
  const current = out[out.length - 1];
  const previous = out[out.length - 2];
  if (!previous || !current.startsWith(HALANT) && current !== ZWJ + HALANT) return;
  const vowel = [...DEPENDENT_VOWELS].find((sign) => previous.endsWith(sign));
  if (!vowel) return;
  out[out.length - 2] = previous.slice(0, -vowel.length);
  out.push(vowel);
}

export function nudiToUnicode(input: string): string {
  let text = input;
  for (const [from, to] of CLEANUPS) text = text.split(from).join(to);
  let out: string[] = [];
  let at = 0;
  while (at < text.length) {
    const char = text[at];
    if (IGNORED.has(char)) {
      at++;
      continue;
    }
    const match = longestMatch(text, at);
    if (match) {
      const [length, value] = match;
      // A letter after a halant needs a joiner to keep the halant visible.
      if (out.length && !value.startsWith(HALANT) && out[out.length - 1].endsWith(HALANT)) out.push(ZWJ);
      out.push(value);
      at += length;
    } else {
      const letters = [...out.join("")];
      const last = letters[letters.length - 1] ?? "";
      if (char === ARKAVATTU) {
        // ರ್ goes before the syllable it was typed after, including any subscript consonants
        // (the official converter only moves it past one letter).
        let start = letters.length - 1;
        while (start > 0 && DEPENDENT_VOWELS.has(letters[start]) && letters[start] !== HALANT) start--;
        while (start >= 2 && letters[start - 1] === HALANT) {
          const previous = letters[start - 2] === ZWJ ? start - 3 : start - 2;
          if (previous < 0 || !IS_CONSONANT.test(letters[previous])) break;
          start = previous;
        }
        if (start >= 0 && IS_CONSONANT.test(letters[start] ?? "")) letters.splice(start, 0, "ರ", HALANT);
        else letters.push("ರ");
        out = letters;
      } else if (NUDI_VATTAKSHARA[char]) {
        // A subscript consonant goes before the vowel sign already typed.
        if (DEPENDENT_VOWELS.has(last)) letters.splice(-1, 1, ZWJ + HALANT, NUDI_VATTAKSHARA[char], last);
        else letters.push(HALANT, NUDI_VATTAKSHARA[char]);
        out = letters;
      } else if (NUDI_BROKEN[char]) {
        const { value, mapping } = NUDI_BROKEN[char];
        if (mapping[last]) letters[letters.length - 1] = mapping[last];
        else letters.push(value);
        out = letters;
      } else if (!(char === "À" && !KEY_PREFIXES.has(text.slice(at, at + 2)))) out.push(char);
      at++;
    }
    if (out.length >= 2) fixOrdering(out);
  }
  // Keep the joiner only where it changes the letter (ರ‍್ = ರ with a visible halant, not an arkavattu).
  return out.join("").replace(new RegExp(`(?<!ರ)${ZWJ}`, "g"), "").normalize("NFC");
}

// ---- Unicode → Nudi

/** Unicode → Nudi, first spelling wins. */
const GLYPHS = new Map<string, string>();
for (const [nudi, unicode] of Object.entries(NUDI_MAPPING)) if (!GLYPHS.has(unicode)) GLYPHS.set(unicode, nudi);
// "i" alone is only the right half of ಯ.
GLYPHS.set("ಯ", "AiÀÄ");
const SUBSCRIPTS = new Map<string, string>(Object.entries(NUDI_VATTAKSHARA).map(([nudi, consonant]) => [consonant, nudi]));
SUBSCRIPTS.set("ರ", "ç");

/** Vowel signs typed as another sign plus a trailing glyph (ೀ = ಿ + "Ã"); the trailing glyph follows any subscripts. */
const TRAILING: Record<string, [string, string]> = { "ೀ": ["ಿ", "Ã"], "ೇ": ["ೆ", "Ã"], "ೈ": ["ೆ", "Ê"], "ೊ": ["ೆ", "Æ"], "ೋ": ["ೆ", "ÆÃ"], "ು": ["", "Ä"], "ೂ": ["", "Æ"], "ೃ": ["", "È"] };

/** The base glyph of a consonant + vowel sign, and the vowel glyph typed after its subscripts. */
function syllableGlyph(consonant: string, vowel: string, hasSubscripts: boolean): [string, string] {
  const direct = GLYPHS.get(consonant + vowel);
  if (direct !== undefined && !(hasSubscripts && TRAILING[vowel])) return [direct, ""];
  const trailing = TRAILING[vowel];
  if (trailing) return [syllableGlyph(consonant, trailing[0], hasSubscripts)[0], trailing[1]];
  return [(GLYPHS.get(consonant) ?? consonant) + (vowel ? GLYPHS.get(vowel) ?? vowel : ""), ""];
}

const CONS = "[\\u0C95-\\u0CB9\\u0CDE]";
const SYLLABLE = new RegExp(`(ರ್(?=${CONS}))?(${CONS})((?:${ZWJ}?್${CONS})*)(್?)([ಾ-ೌೃ]?)([ಂಃ]?)`, "gu");
const KANNADA_DIGITS = /[೦-೯]/gu;

export function unicodeToNudi(input: string): string {
  const text = input.normalize("NFC").replace(KANNADA_DIGITS, (digit) => String(digit.charCodeAt(0) - 0xce6));
  const syllables = text.replace(SYLLABLE, (_, reph: string | undefined, first: string, rest: string, dead: string, vowel: string, sign: string) => {
    const subscripts = [...rest.matchAll(new RegExp(CONS, "gu"))].map(([consonant]) => SUBSCRIPTS.get(consonant) ?? HALANT + consonant);
    // A lone dead consonant has its own glyph (ಕ್ = "Pï").
    const [base, trailing] = dead && !subscripts.length ? [GLYPHS.get(first + HALANT) ?? syllableGlyph(first, "", false)[0], ""] : syllableGlyph(first, vowel, subscripts.length > 0);
    // Nudi types the subscripts, then the rest of the vowel sign, then the arkavattu.
    return base + subscripts.join("") + trailing + (reph ? ARKAVATTU : "") + (sign ? GLYPHS.get(sign) ?? sign : "");
  });
  return syllables.replace(/[ಀ-೿]/gu, (char) => GLYPHS.get(char) ?? char);
}
