/**
 * Anmol Lipi and Asees (Gurmukhi ASCII fonts) ⇄ Unicode Punjabi.
 *
 * Both fonts type one key per letter or sign, with sihari (ਿ) before its consonant,
 * subjoined letters (੍ਰ ੍ਹ ੍ਵ …) as separate keys after it, and vowel letters built from
 * a carrier (ੳ ਅ ੲ) plus a sign: ਆ = ਅ + ਾ. They differ in which key holds which glyph.
 *
 * Anmol Lipi follows the Gurbani Akhar mapping of KhalisFoundation/anvaad-js (MIT),
 * checked against the Anmol Lipi font. Asees (the Punjab government's font) was mapped
 * by rendering the Asees font byte by byte beside Unicode text in Nirmala UI.
 */

type Pairs = [string, string][];

interface GurmukhiFont {
  letters: Pairs;
  vowels: Pairs;
  /** Subjoined letters, typed after their consonant. */
  subjoined: Pairs;
  signs: Pairs;
  other: Pairs;
  /** Other spellings of the same text, read but never written. */
  alternates: Pairs;
  sihari: string;
  /** Lower ੁ / ੂ glyphs used under a subjoined letter, where the font has them. */
  lowU?: string;
  lowUu?: string;
  /** Glyphs that carry no text (spacers, headline fillers). */
  ignore: RegExp;
}

const chars = (...codes: number[]) => String.fromCharCode(...codes);
const CONS = "[\\u0A15-\\u0A39\\u0A59-\\u0A5E]";
/** Consonant (+ nukta), subjoined letters, and a sihari that belongs before them. */
const SIHARI_SYLLABLE = new RegExp(`(${CONS}਼?(?:੍[ਰਹਵਯਚਟਤਨ])*)ਿ`, "gu");

/** Longest key in `keys` at `at`. */
const matchAt = (text: string, at: number, keys: string[]) => keys.find((key) => text.startsWith(key, at));
const nfc = (pairs: Pairs): Pairs => pairs.map(([unicode, legacy]) => [unicode.normalize("NFC"), legacy]);
const byLength = (keys: Iterable<string>) => [...keys].sort((a, b) => b.length - a.length);

function build(font: GurmukhiFont) {
  const all = nfc([...font.letters, ...font.vowels, ...font.subjoined, ...font.signs, ...font.other]);
  const encodeMap = new Map<string, string>(all);
  const encodeKeys = byLength(encodeMap.keys());
  const decodeMap = new Map<string, string>([...all.map(([u, l]): [string, string] => [l, u]), ...font.alternates]);
  const decodeKeys = byLength(decodeMap.keys());
  const vowelDecode = new Map(nfc(font.vowels).map(([u, l]) => [l, u]));
  const vowelKeys = byLength(vowelDecode.keys());
  const letterKeys = font.letters.map(([, legacy]) => legacy);
  const subjoinedKeys = [
    ...font.subjoined.map(([, legacy]) => legacy),
    ...font.alternates.filter(([, unicode]) => unicode.startsWith("੍")).map(([legacy]) => legacy),
  ];
  const isSubjoined = new Set(nfc(font.subjoined).map(([unicode]) => unicode));

  function encode(input: string) {
    const text = input.normalize("NFC").replace(SIHARI_SYLLABLE, "ਿ$1");
    let out = "";
    let at = 0;
    let afterSubjoined = false;
    while (at < text.length) {
      if (text[at] === "ਿ") {
        out += font.sihari;
        at++;
        continue;
      }
      const key = matchAt(text, at, encodeKeys);
      if (!key) {
        out += text[at++];
        afterSubjoined = false;
        continue;
      }
      // ੁ and ੂ under a subjoined letter use their lower glyphs.
      if (afterSubjoined && key === "ੁ" && font.lowU) out += font.lowU;
      else if (afterSubjoined && key === "ੂ" && font.lowUu) out += font.lowUu;
      else out += encodeMap.get(key)!;
      afterSubjoined = isSubjoined.has(key);
      at += key.length;
    }
    return out;
  }

  function decode(input: string) {
    const text = input.replace(font.ignore, "");
    let out = "";
    let at = 0;
    while (at < text.length) {
      const vowel = matchAt(text, at, vowelKeys);
      if (vowel && vowel.startsWith(font.sihari)) {
        out += vowelDecode.get(vowel);
        at += vowel.length;
        continue;
      }
      // Sihari is typed before its consonant and any subjoined letters: "ik" = ਕਿ, "ikR" = ਕ੍ਰਿ.
      if (text.startsWith(font.sihari, at)) {
        const letter = matchAt(text, at + font.sihari.length, letterKeys);
        if (letter) {
          let end = at + font.sihari.length + letter.length;
          let cluster = decodeMap.get(letter)!;
          for (let sub = matchAt(text, end, subjoinedKeys); sub; sub = matchAt(text, end, subjoinedKeys)) {
            cluster += decodeMap.get(sub)!;
            end += sub.length;
          }
          out += `${cluster}ਿ`;
          at = end;
          continue;
        }
      }
      const key = matchAt(text, at, decodeKeys);
      out += key ? decodeMap.get(key) : text[at];
      at += key ? key.length : 1;
    }
    return out.normalize("NFC");
  }

  return { encode, decode };
}

const ANMOL_LIPI = build({
  letters: [
    ["ੳ", "a"], ["ਅ", "A"], ["ੲ", "e"], ["ਸ", "s"], ["ਹ", "h"], ["ਕ", "k"], ["ਖ", "K"], ["ਗ", "g"], ["ਘ", "G"], ["ਙ", "|"],
    ["ਚ", "c"], ["ਛ", "C"], ["ਜ", "j"], ["ਝ", "J"], ["ਞ", "\\"], ["ਟ", "t"], ["ਠ", "T"], ["ਡ", "f"], ["ਢ", "F"], ["ਣ", "x"],
    ["ਤ", "q"], ["ਥ", "Q"], ["ਦ", "d"], ["ਧ", "D"], ["ਨ", "n"], ["ਪ", "p"], ["ਫ", "P"], ["ਬ", "b"], ["ਭ", "B"], ["ਮ", "m"],
    ["ਯ", "X"], ["ਰ", "r"], ["ਲ", "l"], ["ਵ", "v"], ["ੜ", "V"],
    // Nukta letters (NFC keeps these as letter + ਼).
    ["ਸ਼", "S"], ["ਖ਼", "^"], ["ਗ਼", "Z"], ["ਜ਼", "z"], ["ਫ਼", "&"], ["ਲ਼", "L"],
  ],
  vowels: [["ਆ", "Aw"], ["ਇ", "ie"], ["ਈ", "eI"], ["ਉ", "au"], ["ਊ", "aU"], ["ਏ", "ey"], ["ਐ", "AY"], ["ਓ", "E"], ["ਔ", "AO"]],
  subjoined: [["੍ਰ", "R"], ["੍ਹ", "H"], ["੍ਵ", "Í"], ["੍ਯ", "Î"], ["੍ਚ", "ç"], ["੍ਟ", "†"], ["੍ਤ", "œ"], ["੍ਨ", "˜"]],
  signs: [
    ["ਾਂ", "W"], ["ਾ", "w"], ["ੀ", "I"], ["ੁ", "u"], ["ੂ", "U"], ["ੇ", "y"], ["ੈ", "Y"], ["ੋ", "o"], ["ੌ", "O"],
    ["ੰ", "M"], ["ਂ", "N"], ["ੱ", "`"], ["ਃ", "Ú"], ["਼", "æ"], ["ੵ", "´"], ["ੑ", "@"],
  ],
  other: [
    ["ੴ", "<>"], ["।", "["], ["॥", "]"], ["☬", "Ç"],
    ["੦", "ú"], ["੧", "ñ"], ["੨", "ò"], ["੩", "ó"], ["੪", "ô"], ["੫", "õ"], ["੬", "ö"], ["੭", "÷"], ["੮", "ø"], ["੯", "ù"],
  ],
  alternates: [["®", "੍ਰ"], ["ü", "ੁ"], ["¨", "ੂ"], ["µ", "ੰ"], ["ˆ", "ਂ"], ["~", "ੱ"], ["¤", "ੱ"], ["Ï", "ੵ"], ["í", "੍ਯ"], ["ì", "ਯ"], ["ƒ", "ਨੂੰ"], ["¡", "ੴ"], ["Å", "ੴ"], ["<", "ੴ"]],
  sihari: "i",
  lowU: "ü",
  lowUu: "¨",
  // ">" is the tail of ੴ ("<>"); Ø and Æ are spacing glyphs.
  ignore: /[>ØÆ]/g,
});

const ASEES = build({
  letters: [
    ["ੳ", "T"], ["ਅ", "n"], ["ੲ", "J"], ["ਸ", ";"], ["ਹ", "j"], ["ਕ", "e"], ["ਖ", "y"], ["ਗ", "r"], ["ਘ", "x"], ["ਙ", "C"],
    ["ਚ", "u"], ["ਛ", "S"], ["ਜ", "i"], ["ਝ", "M"], ["ਟ", "N"], ["ਠ", "m"], ["ਡ", "v"], ["ਢ", "Y"], ["ਣ", "D"], ["ਤ", "s"],
    ["ਥ", "E"], ["ਦ", "d"], ["ਧ", "X"], ["ਨ", "B"], ["ਪ", "g"], ["ਫ", "c"], ["ਬ", "p"], ["ਭ", "G"], ["ਮ", "w"], ["ਯ", ":"],
    ["ਰ", "o"], ["ਲ", "b"], ["ਵ", "t"], ["ੜ", "V"],
    ["ਸ਼", "P"], ["ਖ਼", "\\"], ["ਗ਼", "}"], ["ਜ਼", "I"], ["ਫ਼", "|"], ["ਲ਼", "+"],
  ],
  vowels: [["ਆ", "nk"], ["ਇ", "fJ"], ["ਈ", "Jh"], ["ਉ", "T["], ["ਊ", "T{"], ["ਏ", "J/"], ["ਐ", "n?"], ["ਓ", "U"], ["ਔ", "n\""]],
  subjoined: [["੍ਰ", "q"], ["੍ਹ", chars(0x2020)], ["੍ਵ", "_"], ["੍ਯ", chars(0xcf)], ["੍ਚ", chars(0xe7)], ["੍ਤ", chars(0x153)], ["੍ਨ", chars(0x2dc)]],
  signs: [
    ["ਾਂ", "K"], ["ਾ", "k"], ["ੀ", "h"], ["ੁ", "["], ["ੂ", "{"], ["ੇ", "/"], ["ੈ", "?"], ["ੋ", "'"], ["ੌ", "\""],
    ["ੰ", "z"], ["ਂ", chars(0x2c6)], ["ੱ", "Z"], ["ਃ", chars(0xda)], ["਼", "a"], ["੍", "-"],
  ],
  other: [
    ["ੴ", ">"], ["।", "."], ["॥", "]"], ["☬", chars(0xc7)],
    ["੦", chars(0xfa)], ["੧", chars(0xf1)], ["੨", chars(0xf2)], ["੩", chars(0xf3)], ["੪", chars(0xf4)], ["੫", chars(0xf5)], ["੬", chars(0xf6)],
    ["੭", chars(0xf7)], ["੮", chars(0xf8)], ["੯", chars(0xf9)],
    // The ASCII punctuation keys hold letters, so punctuation lives elsewhere.
    [".", "H"], ["!", "`"], ["?", "<"], [":", "L"], [";", "l"], ["*", "!"], ["%", "#"], ["/", "$"], ["×", "%"], ["=", "&"], ["+", "O"],
    ["-", "^"], ["‘", chars(0x2018)], ["’", chars(0x2019)], ["“", chars(0x201c)], ["”", chars(0x201d)],
  ],
  alternates: [
    ["=", "ੁ"], ["Q", "ੁ"], [chars(0xfc), "ੁ"], [chars(0xa7), "ੂ"], [chars(0xa8), "ੂ"], [chars(0xae), "੍ਰ"], ["~", "ੱ"], [chars(0xa4), "ੱ"],
    [chars(0xb5), "ੰ"], [chars(0xa1), "ੴ"], [chars(0xc5), "ੴ"], [chars(0xc6), "ੴ"], [chars(0xe5), "ੴ"], [chars(0x2039), "ੴ"], ["*", "’"], ["@", "”"],
  ],
  sihari: "f",
  // "F" is a headline filler.
  ignore: /F/g,
});

export const unicodeToAnmolLipi = ANMOL_LIPI.encode;
export const anmolLipiToUnicode = ANMOL_LIPI.decode;
export const unicodeToAsees = ASEES.encode;
export const aseesToUnicode = ASEES.decode;
