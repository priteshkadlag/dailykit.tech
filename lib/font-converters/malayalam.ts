/**
 * ML-TT (Karthika, Revathi and the other ML-TT fonts) ⇄ Unicode Malayalam.
 *
 * ML-TT types the vowel signs െ േ ൈ and the ്ര sign before their consonant cluster
 * (പ്രേ = "t{]"), ൊ ോ ൌ as a left part before and a right part after it (കൊ = "sIm"),
 * and uses one glyph per common conjunct (ക്ക = "¡"); other clusters show the
 * chandrakkala "v" between letters.
 *
 * Glyphs follow the community ML-TT map (libindic/unicode-conversion-maps), checked
 * against the ML-TT Karthika font.
 */

type Pairs = [string, string][];

const CONSONANTS: Pairs = [
  ["ക", "I"], ["ഖ", "J"], ["ഗ", "K"], ["ഘ", "L"], ["ങ", "M"], ["ച", "N"], ["ഛ", "O"], ["ജ", "P"], ["ഝ", "Q"], ["ഞ", "R"],
  ["ട", "S"], ["ഠ", "T"], ["ഡ", "U"], ["ഢ", "V"], ["ണ", "W"], ["ത", "X"], ["ഥ", "Y"], ["ദ", "Z"], ["ധ", "["], ["ന", "\\"],
  ["പ", "]"], ["ഫ", "^"], ["ബ", "_"], ["ഭ", "`"], ["മ", "a"], ["യ", "b"], ["ര", "c"], ["റ", "d"], ["ല", "e"], ["ള", "f"],
  ["ഴ", "g"], ["വ", "h"], ["ശ", "i"], ["ഷ", "j"], ["സ", "k"], ["ഹ", "l"],
];
/** Conjuncts drawn as one glyph. */
const CONJUNCTS: Pairs = [
  ["ക്ക", "¡"], ["ക്ല", "¢"], ["ക്ഷ", "£"], ["ഗ്ഗ", "¤"], ["ഗ്ല", "¥"], ["ങ്ക", "¦"], ["ങ്ങ", "§"], ["ച്ച", "¨"], ["ഞ്ച", "©"], ["ഞ്ഞ", "ª"],
  ["ട്ട", "«"], ["ണ്ണ", "®"], ["ത്ത", "¯"], ["ത്ഥ", "°"], ["ദ്ദ", "±"], ["ദ്ധ", "²"], ["ന്ത", "´"], ["ന്ദ", "µ"], ["ന്ന", "¶"], ["ന്മ", "·"],
  ["പ്പ", "¸"], ["പ്ല", "¹"], ["ബ്ബ", "º"], ["ബ്ല", "»"], ["മ്പ", "¼"], ["മ്മ", "½"], ["മ്ല", "¾"], ["യ്യ", "¿"], ["റ്റ", "Á"], ["ല്ല", "Ã"],
  ["ള്ള", "Å"], ["വ്വ", "Æ"], ["ശ്ല", "Ç"], ["ശ്ശ", "È"], ["സ്ല", "É"], ["സ്സ", "Ê"], ["ഹ്ല", "Ë"], ["സ്റ്റ", "Ì"], ["ഡ്ഡ", "Í"], ["ക്ട", "Î"],
  ["ബ്ധ", "Ï"], ["ബ്ദ", "Ð"], ["ച്ഛ", "Ñ"], ["ഹ്മ", "Ò"], ["ഹ്ന", "Ó"], ["ന്ധ", "Ô"], ["ത്സ", "Õ"], ["ജ്ജ", "Ö"], ["ണ്മ", "×"], ["സ്ഥ", "Ø"],
  ["ന്ഥ", "Ù"], ["ജ്ഞ", "Ú"], ["ത്ഭ", "Û"], ["ഗ്മ", "Ü"], ["ശ്ച", "Ý"], ["ണ്ഡ", "Þ"], ["ത്മ", "ß"], ["ക്ത", "à"], ["ഗ്ന", "á"], ["ന്റ", "â"], ["ഷ്ട", "ã"],
];
const CHILLU: Pairs = [["ൺ", "¬"], ["ൻ", "³"], ["ർ", "À"], ["ൽ", "Â"], ["ൾ", "Ä"]];
const VOWELS: Pairs = [
  ["അ", "A"], ["ആ", "B"], ["ഇ", "C"], ["ഈ", "Cu"], ["ഉ", "D"], ["ഊ", "Du"], ["ഋ", "E"], ["എ", "F"], ["ഏ", "G"], ["ഐ", "sF"], ["ഒ", "H"], ["ഓ", "Hm"], ["ഔ", "Hu"],
];
/** Vowel signs after the cluster. */
const AFTER: Pairs = [["ാ", "m"], ["ി", "n"], ["ീ", "o"], ["ു", "p"], ["ൂ", "q"], ["ൃ", "r"], ["ൗ", "u"], ["്", "v"], ["ം", "w"], ["ഃ", "x"]];
/** Vowel signs typed as a left part before the cluster and an optional right part after it. */
const AROUND: Record<string, [string, string]> = { "െ": ["s", ""], "േ": ["t", ""], "ൈ": ["ss", ""], "ൊ": ["s", "m"], "ോ": ["t", "m"], "ൌ": ["s", "u"] };
const RA_SIGN = "{";
const YA_SIGN = "y";
const VA_SIGN = "z";
const HALANT = "v";

/** Spellings found in other ML-TT fonts; read but never written. */
const SOFT_HYPHEN = String.fromCharCode(0xad);
const READ_ONLY: Pairs = [["€", "ഗ്ഗ"], ["Š", "ങ്ക"], ["š", "ച്ച"], ["Œ", "മ്പ"], ["œ", "മ്മ"], ["Ÿ", "മ്ല"], ["ï", "ണ്ട"], [SOFT_HYPHEN, "ണ്ട"], ["æ", "കു"], ["ê", "രു"], ["þ", "-"]];

const LETTER_GLYPH = new Map<string, string>([...CONSONANTS, ...CONJUNCTS]);
const LETTER_KEYS = [...LETTER_GLYPH.keys()].sort((a, b) => b.length - a.length);
const OTHER_GLYPH = new Map<string, string>([...CHILLU, ...VOWELS, ...AFTER]);

const ZWJ = String.fromCharCode(0x200d);
const CONS = "[\\u0D15-\\u0D39]";
/** A cluster (consonants joined by ്, possibly ്ര ്യ ്വ) and its vowel sign or final chandrakkala. */
const SYLLABLE = new RegExp(`(${CONS}(?:്${CONS})*)(്|[ാ-ൌൗ])?`, "gu");

/** Glyphs for a consonant cluster: ligatures where the font has them, chandrakkala between the rest. */
function clusterGlyphs(cluster: string) {
  const parts: string[] = [];
  let at = 0;
  while (at < cluster.length) {
    if (cluster[at] === "്") {
      const next = cluster[at + 1];
      // ്ര goes before the letter it follows, ്യ ്വ after it; other letters get a visible chandrakkala.
      if (next === "ര" && parts.length) parts[parts.length - 1] = RA_SIGN + parts[parts.length - 1];
      else if (next === "യ") parts.push(YA_SIGN);
      else if (next === "വ") parts.push(VA_SIGN);
      else {
        parts.push(HALANT);
        at++;
        continue;
      }
      at += 2;
      continue;
    }
    const key = LETTER_KEYS.find((candidate) => cluster.startsWith(candidate, at))!;
    parts.push(LETTER_GLYPH.get(key)!);
    at += key.length;
  }
  return parts.join("");
}

export function unicodeToMlTt(input: string): string {
  const text = input.normalize("NFC")
    // Old-style chillus: letter + ് + ZWJ.
    .replace(new RegExp(`([ണനരലള])്${ZWJ}`, "gu"), (_, letter: string) => ({ ണ: "ൺ", ന: "ൻ", ര: "ർ", ല: "ൽ", ള: "ൾ" })[letter]!)
    .replace(new RegExp(`[${ZWJ}\\u200C]`, "gu"), "");
  const syllables = text.replace(SYLLABLE, (_, cluster: string, sign = "") => {
    const around = AROUND[sign];
    if (around) return around[0] + clusterGlyphs(cluster) + around[1];
    return clusterGlyphs(cluster) + (sign ? OTHER_GLYPH.get(sign) ?? sign : "");
  });
  return syllables.replace(/[ഀ-ൿ]/gu, (char) => OTHER_GLYPH.get(char) ?? char);
}

// ---- ML-TT → Unicode

const READ = new Map<string, string>([
  ...[...CONSONANTS, ...CONJUNCTS, ...CHILLU, ...VOWELS].map(([unicode, glyph]): [string, string] => [glyph, unicode]),
  ...READ_ONLY,
]);
const READ_KEYS = [...READ.keys()].sort((a, b) => b.length - a.length);
const SIGN_OF = new Map(AFTER.map(([unicode, glyph]) => [glyph, unicode]));

export function mlTtToUnicode(input: string): string {
  let out = "";
  let at = 0;
  const letterAt = (i: number) => READ_KEYS.find((key) => input.startsWith(key, i) && /[ക-ഹ]$/u.test(READ.get(key)!));
  while (at < input.length) {
    // Left vowel part and ്ര sign, then the cluster they belong to.
    const left = input.startsWith("ss", at) ? "ss" : input[at] === "s" || input[at] === "t" ? input[at] : "";
    let i = at + left.length;
    const ra = input[i] === RA_SIGN;
    if (ra) i++;
    const first = letterAt(i);
    if ((left || ra) && first) {
      let cluster = READ.get(first)! + (ra ? "്ര" : "");
      i += first.length;
      // Further letters joined by chandrakkala / ്ര, and ്യ ്വ signs.
      for (;;) {
        if (input[i] === YA_SIGN || input[i] === VA_SIGN) {
          cluster += input[i] === YA_SIGN ? "്യ" : "്വ";
          i++;
        } else if (input[i] === HALANT && (letterAt(i + 1) || (input[i + 1] === RA_SIGN && letterAt(i + 2)))) {
          const innerRa = input[i + 1] === RA_SIGN;
          const next = letterAt(i + 1 + (innerRa ? 1 : 0))!;
          cluster += `്${READ.get(next)}${innerRa ? "്ര" : ""}`;
          i += 1 + (innerRa ? 1 : 0) + next.length;
        } else break;
      }
      // The right part completes the vowel: s…m = ൊ, t…m = ോ, s…u = ൌ.
      const right = input[i];
      const vowel = left === "ss" ? "ൈ" : left === "s" ? (right === "m" ? "ൊ" : right === "u" ? "ൌ" : "െ") : left === "t" ? (right === "m" ? "ോ" : "േ") : "";
      out += cluster + vowel;
      at = i + (["ൊ", "ോ", "ൌ"].includes(vowel) ? 1 : 0);
      continue;
    }
    const key = READ_KEYS.find((candidate) => input.startsWith(candidate, at));
    if (key) {
      out += READ.get(key);
      at += key.length;
    } else {
      out += SIGN_OF.get(input[at]) ?? (input[at] === YA_SIGN ? "്യ" : input[at] === VA_SIGN ? "്വ" : input[at]);
      at++;
    }
  }
  return out.normalize("NFC");
}
