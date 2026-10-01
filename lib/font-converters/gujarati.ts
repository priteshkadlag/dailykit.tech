/**
 * LMG Arun and Gujarati Lys (Gujarati typewriter-layout fonts) ⇄ Unicode Gujarati.
 *
 * Both fonts share one keyboard layout for the ASCII keys and differ in the upper half,
 * where each keeps its own ligatures. They type િ before its consonant cluster, the reph
 * (ર્) after the syllable and its vowel signs, and the rakar (્ર) after the letter it
 * joins. Joined consonants use a half letter where the font has one (સ્ત = ":T"), a
 * ligature for common conjuncts (ક્ષ, દ્ધ, હ્ય …), and otherwise the letter with a
 * visible halant. A half letter plus the ા stem is the full letter, as in Kruti Dev.
 * Independent vowels are built from અ and એ plus vowel signs, as on a typewriter.
 *
 * No published table exists for these fonts. Every glyph below was identified by
 * rendering the fonts byte by byte beside Unicode text in Nirmala UI and Hind Vadodara.
 * Glyphs that could not be identified with confidence are left unmapped.
 */

type Pairs = [string, number[]][];

interface GujaratiFont {
  consonants: Pairs;
  /** Conjuncts drawn as one glyph. */
  conjuncts: Pairs;
  /** Half letters, used when the consonant joins the next one. */
  half: Pairs;
  vowels: Pairs;
  /** Vowel and nasal signs typed after the cluster. */
  signs: Pairs;
  /** A consonant and sign drawn as one glyph ("ીં" is the sign with anusvara). */
  syllables: Pairs;
  other: Pairs;
  /** Other glyphs for the same text; read but never written. */
  readOnly: Pairs;
  /** િ drawn with an anusvara, and the reph drawn with one, where the font has them. */
  iAnusvara?: number;
  rephAnusvara?: number;
  /** A second glyph for િ. */
  iAlt: number;
}

/** The Unicode character that Windows-1252 byte `b` becomes when legacy text is pasted. */
const CP1252_HIGH: Record<number, number> = {
  0x80: 0x20ac, 0x82: 0x201a, 0x83: 0x192, 0x84: 0x201e, 0x85: 0x2026, 0x86: 0x2020, 0x87: 0x2021, 0x88: 0x2c6, 0x89: 0x2030,
  0x8a: 0x160, 0x8b: 0x2039, 0x8c: 0x152, 0x8e: 0x17d, 0x91: 0x2018, 0x92: 0x2019, 0x93: 0x201c, 0x94: 0x201d, 0x95: 0x2022,
  0x96: 0x2013, 0x97: 0x2014, 0x98: 0x2dc, 0x99: 0x2122, 0x9a: 0x161, 0x9b: 0x203a, 0x9c: 0x153, 0x9e: 0x17e, 0x9f: 0x178,
};
const glyph = (bytes: number[]) => String.fromCharCode(...bytes.map((b) => CP1252_HIGH[b] ?? b));

// ---- The shared ASCII layout

const CONSONANTS: Pairs = [
  ["ક", [0x53]], ["ખ", [0x42]], ["ગ", [0x55]], ["ઘ", [0x33]], ["ચ", [0x52]], ["છ", [0x4b]], ["જ", [0x48]], ["ઝ", [0x68]], ["ટ", [0x38]],
  ["ઠ", [0x39]], ["ડ", [0x30]], ["ઢ", [0x2d]], ["ણ", [0x36]], ["ત", [0x54]], ["થ", [0x59]], ["દ", [0x4e]], ["ધ", [0x57]], ["ન", [0x47]],
  ["પ", [0x35]], ["ફ", [0x4f]], ["બ", [0x41]], ["ભ", [0x45]], ["મ", [0x44]], ["ય", [0x49]], ["ર", [0x5a]], ["લ", [0x2c]], ["વ", [0x4a]],
  ["શ", [0x58]], ["સ", [0x3b]], ["હ", [0x43]], ["ળ", [0x2f]],
];
const CONJUNCTS: Pairs = [["જ્ઞ", [0x37]], ["ત્ર", [0x2b]], ["શ્ર", [0x7a]]];
const HALF: Pairs = [
  ["ક્ષ", [0x31]], ["ખ", [0x62]], ["ગ", [0x75]], ["ઘ", [0x77]], ["ત", [0x74]], ["થ", [0x79]], ["ન", [0x67]], ["પ", [0x25]], ["બ", [0x61]],
  ["ભ", [0x65]], ["મ", [0x64]], ["ય", [0x69]], ["લ", [0x3c]], ["વ", [0x6a]], ["શ", [0x78]], ["ષ", [0x51]], ["સ", [0x3a]], ["ળ", [0x3f]],
];
const VOWELS: Pairs = [
  ["અ", [0x56]], ["આ", [0x56, 0x46]], ["ઇ", [0x3e]], ["ઈ", [0x2e]], ["ઉ", [0x70]], ["ઋ", [0x6b]], ["એ", [0x5e]], ["ઐ", [0x5e, 0x5b]],
  ["ઓ", [0x56, 0x4d]],
];
const SIGNS: Pairs = [
  ["ા", [0x46]], ["ી", [0x4c]], ["ુ", [0x5d]], ["ૂ", [0x7d]], ["ૃ", [0x27]], ["ે", [0x5b]], ["ૈ", [0x7b]], ["ો", [0x4d]], ["ં", [0x5c]],
  ["્", [0x7c]],
];
const OTHER: Pairs = [
  ["૦", [0x5f]], ["૧", [0x21]], ["૨", [0x72]], ["૩", [0x23]], ["૪", [0x24]], ["૫", [0x35]], ["૬", [0x26]], ["૭", [0x2a]], ["૮", [0x28]], ["૯", [0x29]],
  [",", [0x34]], [".", [0x50]], ["'", [0x63]], ["(", [0x73]], [")", [0x66]], ["/", [0x71]], [":", [0x6f]], ["?", [0x6d]], ["%", [0x40]],
  ["-", [0x76]], ["×", [0x32]],
];
const READ_ONLY: Pairs = [["ઘ", [0x6e]], ["ય્", [0x72]], ["ઐ", [0x5e, 0x7b]]];

const LMG_ARUN: GujaratiFont = {
  consonants: [...CONSONANTS, ["ઙ", [0xa2]], ["ષ", [0xd8]]],
  conjuncts: [
    ...CONJUNCTS, ["ક્ષ્ય", [0xd3]], ["સ્ત્ર", [0xe0]], ["ક્ષ", [0xd9]], ["ક્ર", [0xca]], ["ફ્ર", [0xcb]], ["દ્ર", [0xa7]], ["ક્ક", [0xde]],
    ["ક્ત", [0xc9]], ["ક્લ", [0xa4]], ["ટ્ટ", [0xce]], ["ટ્ઠ", [0xf5]], ["ઠ્ઠ", [0xf4]], ["ડ્ડ", [0xbb]], ["ત્ત", [0xbf]], ["ત્ય", [0xc0]],
    ["ટ્ય", [0xc8]], ["ત્મ", [0xba]], ["દ્દ", [0xa1]], ["દ્ધ", [0xe2]], ["દ્મ", [0xcd]], ["દ્વ", [0xa3]], ["ફ્ય", [0xb1]], ["ષ્ટ", [0xda]],
    ["શ્ચ", [0xfc]], ["હ્ન", [0xed]], ["હ્મ", [0xef]], ["હ્ય", [0xe6]], ["હ્લ", [0xee]], ["હ્વ", [0xf0]],
  ],
  half: [...HALF, ["ફ", [0x9a]]],
  vowels: [
    ...VOWELS, ["ઊ", [0xb5]], ["ઔ", [0x56, 0xc1]], ["ઍ", [0x56, 0xb6]], ["ઑ", [0x56, 0x46, 0xb6]],
    ["ઇં", [0xe8]], ["ઈં", [0xe7]], ["ઉં", [0xeb]], ["ઊં", [0xea]],
  ],
  signs: [...SIGNS, ["ૌ", [0xc1]], ["ૅ", [0xb6]], ["ૉ", [0x46, 0xb6]], ["ઁ", [0xa5]]],
  syllables: [["રૂ", [0x7e]], ["જા", [0xd4]], ["ણુ", [0xaa]], ["હૃ", [0xec]], ["ીં", [0xc4]]],
  other: [...OTHER, ["ૐ", [0x9b]], ["卐", [0xe1]], [";", [0xb8]], ["+", [0xb4]], ["[", [0xf2]], ["]", [0xf3]], ["‘", [0x97]], ["’", [0x88]]],
  readOnly: [
    ...READ_ONLY, ["જ", [0xdf]], ["ઝ", [0xa8]], ["ઝ", [0xdc]], ["જા", [0xab]], ["ઈ", [0xae]], ["ઊ", [0xe9]], ["ક્ર", [0xcc]], ["શ્ર", [0xc6]],
    ["શ્ર", [0xc7]], ["દ્દ", [0xdb]], ["દ્વ", [0xe4]], ["દ્વ", [0xe5]], ["દ્ર", [0xe3]], ["હૃ", [0xf1]], ["ક્ષ્", [0xa9]], ["ે", [0x9f]],
    ["્", [0x99]], ["ુ", [0xd5]], ["ૂ", [0xd6]],
  ],
  iAlt: 0xc2,
  iAnusvara: 0xc3,
  rephAnusvara: 0xc5,
};

const GUJARATI_LYS: GujaratiFont = {
  // Lys has no full ષ glyph: it is the half letter plus the ા stem.
  consonants: [...CONSONANTS, ["ઙ", [0xa2]]],
  conjuncts: [
    ...CONJUNCTS, ["ક્ષ્ય", [0x94]], ["સ્ત્ર", [0x87]], ["ક્ષ", [0x9f]], ["ક્ર", [0xc3]], ["ફ્ર", [0xc0]], ["દ્ર", [0x84]], ["ક્ત", [0x85]],
    ["ક્લ", [0xa7]], ["ટ્ટ", [0x8c]], ["ઠ્ઠ", [0xd9]], ["ડ્ડ", [0xaa]], ["ત્ત", [0xf8]], ["ત્ય", [0xbf]], ["ટ્ય", [0xbb]], ["ત્ન", [0xd3]],
    ["દ્દ", [0xa4]], ["દ્ધ", [0x82]], ["દ્મ", [0xd5]], ["દ્વ", [0x89]], ["ફ્ય", [0xb1]], ["શ્ચ", [0xb8]], ["શ્વ", [0xf9]], ["હ્મ", [0xd4]],
    ["હ્ય", [0xca]], ["હ્લ", [0xcc]],
  ],
  half: [...HALF, ["ફ", [0xf6]]],
  vowels: [...VOWELS, ["ઊ", [0xb5]], ["ઔ", [0x56, 0xa1]], ["ઇં", [0xcb]], ["ઈં", [0xc1]], ["ઉં", [0xce]], ["ઊં", [0xcd]]],
  signs: [...SIGNS, ["ૌ", [0xa1]], ["ઁ", [0x95]]],
  syllables: [["રૂ", [0x7e]], ["જા", [0x91]], ["જી", [0x93]], ["ણુ", [0x99]], ["હૃ", [0xcf]], ["દૃ", [0x9c]], ["ીં", [0x83]]],
  other: [...OTHER, ["ૐ", [0xf5]], ["卐", [0xb7]], ["+", [0xa5]], ["!", [0xb6]], ['"', [0xa8]], ["[", [0xda]], ["]", [0xdb]], ["‘", [0xf3]], ["’", [0xf2]]],
  readOnly: [
    ...READ_ONLY, ["ઈ", [0xc6]], ["ઊ", [0xc8]], ["દ્ર", [0xdf]], ["દ્વ", [0xa3]], ["દ્વ", [0xc2]], ["હૃ", [0xd2]], ["ક્ષ્", [0xa9]],
    ["ઝ", [0xae]], ["ઝ", [0x8b]], ["જ", [0xb4]], ["ુ", [0x92]], ["ૂ", [0xd8]], ["ૂ", [0xf7]], ["્", [0xf4]], ["ત્ન", [0xe6]], ["શ્ર", [0xab]],
    ["પ્ર", [0x9b]],
  ],
  iAlt: 0xac,
};

// ---- Engine

const RA = "ર";
const HALANT = "્";
const I_SIGN = "િ";
const I_GLYPH = glyph([0x6c]);
const REPH = glyph([0x22]);
const RAKAR = glyph([0x3d]);
const STEM = glyph([0x46]);
const CONS = "[\\u0A95-\\u0AB9]";
const SIGN_CLASS = "[\\u0ABE-\\u0ACC]";
const IS_CONS = new RegExp(`^${CONS}`, "u");
/** Optional reph, a consonant cluster, and its vowel sign or final halant, and nasal sign. */
const SYLLABLE = new RegExp(`(ર્(?=${CONS}))?(${CONS}(?:્${CONS})*)(${SIGN_CLASS}|્(?!${CONS}))?([ંઁ])?`, "gu");
const CLUSTER = `(?:${CONS}્)*${CONS}`;
const I_MARK = String.fromCharCode(0xe000);
const REPH_MARK = String.fromCharCode(0xe001);
const I_BEFORE = new RegExp(`${I_MARK}(ં?)(${CLUSTER})`, "gu");
const REPH_AFTER = new RegExp(`(${CLUSTER}${SIGN_CLASS}*)${REPH_MARK}`, "gu");
/** ૨ shares its glyph with half ય, and ૫ with પ. */
const YA_OR_TWO = glyph([0x72]);
const PA_OR_FIVE = glyph([0x35]);

const toMap = (pairs: Pairs) => new Map(pairs.map(([unicode, bytes]) => [unicode, glyph(bytes)]));
const byLength = (keys: Iterable<string>) => [...keys].sort((a, b) => b.length - a.length);
const matchAt = (text: string, at: number, keys: string[]) => keys.find((key) => text.startsWith(key, at));

function build(font: GujaratiFont) {
  const halfGlyph = toMap(font.half);
  const halfKeys = byLength(halfGlyph.keys());
  const full = toMap([...font.conjuncts, ...font.consonants]);
  // A letter with only a half glyph is written as the half letter plus the ા stem.
  for (const [letter, half] of halfGlyph) if ([...letter].length === 1 && !full.has(letter)) full.set(letter, half + STEM);
  const fullKeys = byLength(full.keys());
  const signGlyph = toMap(font.signs);
  const signKeys = byLength(signGlyph.keys());
  const syllableGlyph = toMap(font.syllables);
  const textGlyph = toMap([...font.vowels, ...font.other]);
  const textKeys = byLength(textGlyph.keys());
  const halant = signGlyph.get(HALANT)!;

  function clusterGlyphs(cluster: string) {
    let out = "";
    let at = 0;
    while (at < cluster.length) {
      // ્ર after a letter is the rakar stroke.
      if (cluster.startsWith("્ર", at)) {
        out += RAKAR;
        at += 2;
        continue;
      }
      const letter = matchAt(cluster, at, fullKeys)!;
      const end = at + letter.length;
      if (cluster[end] === HALANT && end + 1 < cluster.length && cluster[end + 1] !== RA) {
        // A half letter before the next consonant, or the full letter with a halant.
        const half = matchAt(cluster, at, halfKeys);
        out += half && half.length === letter.length ? halfGlyph.get(half)! : full.get(letter)! + halant;
        at = end + 1;
        continue;
      }
      out += full.get(letter);
      at = end;
    }
    return out;
  }

  function syllableGlyphs(reph: string | undefined, cluster: string, sign = "", nasal = "") {
    const combined = syllableGlyph.get(cluster.slice(-1) + sign);
    let prefix = "";
    let body: string;
    let after = "";
    if (combined && cluster.length === 1) body = combined;
    else if (combined && cluster.at(-2) !== HALANT) body = clusterGlyphs(cluster.slice(0, -1)) + combined;
    else {
      body = clusterGlyphs(cluster);
      if (sign === I_SIGN) {
        if (nasal === "ં" && font.iAnusvara) {
          prefix = glyph([font.iAnusvara]);
          nasal = "";
        } else prefix = I_GLYPH;
      } else if (sign === "ી" && nasal === "ં") {
        after = syllableGlyph.get("ીં")!;
        nasal = "";
      } else if (sign) after = signGlyph.get(sign) ?? sign;
    }
    if (reph && nasal === "ં" && font.rephAnusvara) return prefix + body + after + glyph([font.rephAnusvara]);
    return prefix + body + after + (reph ? REPH : "") + (nasal ? signGlyph.get(nasal) ?? nasal : "");
  }

  function plainGlyphs(text: string) {
    let out = "";
    let at = 0;
    while (at < text.length) {
      const key = matchAt(text, at, textKeys) ?? matchAt(text, at, signKeys);
      if (!key) {
        out += text[at++];
        continue;
      }
      out += textGlyph.get(key) ?? signGlyph.get(key);
      at += key.length;
    }
    return out;
  }

  function encode(input: string) {
    // These fonts have no ASCII digits (their keys hold letters), so digits are written in Gujarati.
    const text = input.normalize("NFC").replace(/[‌‍]/g, "").replace(/[0-9]/g, (d) => String.fromCharCode(0x0ae6 + Number(d)));
    let out = "";
    let at = 0;
    for (const match of text.matchAll(SYLLABLE)) {
      out += plainGlyphs(text.slice(at, match.index)) + syllableGlyphs(match[1], match[2], match[3], match[4]);
      at = match.index + match[0].length;
    }
    return out + plainGlyphs(text.slice(at));
  }

  const decodeMap = new Map<string, string>();
  for (const [unicode, bytes] of [...font.readOnly, ...font.other, ...font.signs, ...font.syllables, ...font.vowels, ...font.consonants, ...font.conjuncts]) {
    decodeMap.set(glyph(bytes), unicode);
  }
  for (const [unicode, bytes] of font.half) {
    decodeMap.set(glyph(bytes), unicode + HALANT);
    decodeMap.set(glyph(bytes) + STEM, unicode);
  }
  decodeMap.set(RAKAR, "્ર");
  decodeMap.set(I_GLYPH, I_MARK);
  decodeMap.set(glyph([font.iAlt]), I_MARK);
  if (font.iAnusvara) decodeMap.set(glyph([font.iAnusvara]), `${I_MARK}ં`);
  decodeMap.set(REPH, REPH_MARK);
  if (font.rephAnusvara) decodeMap.set(glyph([font.rephAnusvara]), `${REPH_MARK}ં`);
  const decodeKeys = byLength(decodeMap.keys());
  const digits = new Set(font.other.filter(([unicode]) => /[૦-૯]/u.test(unicode)).map(([, bytes]) => glyph(bytes)));
  digits.delete(PA_OR_FIVE);
  const isDigitAt = (text: string, at: number) => digits.has(text[at]) || (text[at] === PA_OR_FIVE && digits.has(text[at + 1] ?? ""));

  function decode(input: string) {
    let out = "";
    let at = 0;
    while (at < input.length) {
      if (input[at] === YA_OR_TWO) {
        // Half ય before a consonant, the digit ૨ otherwise.
        const next = decodeMap.get(matchAt(input, at + 1, decodeKeys) ?? "") ?? "";
        out += IS_CONS.test(next) ? "ય્" : "૨";
        at++;
        continue;
      }
      if (input[at] === PA_OR_FIVE && (isDigitAt(input, at - 1) || isDigitAt(input, at + 1))) {
        out += "૫";
        at++;
        continue;
      }
      const key = matchAt(input, at, decodeKeys);
      out += key ? decodeMap.get(key) : input[at];
      at += key ? key.length : 1;
    }
    return out
      // ્ + ્ર from a half letter followed by the rakar stroke.
      .replace(/્્ર/g, "્ર")
      .replace(I_BEFORE, "$2િ$1")
      .replace(REPH_AFTER, "ર્$1")
      .replace(new RegExp(`[${I_MARK}${REPH_MARK}]`, "gu"), "")
      // Anusvara typed before a vowel sign.
      .replace(/ં([ા-ૌ])/gu, "$1ં")
      .normalize("NFC");
  }

  return { encode, decode };
}

const LMG = build(LMG_ARUN);
const LYS = build(GUJARATI_LYS);

export const unicodeToLmgArun = LMG.encode;
export const lmgArunToUnicode = LMG.decode;
export const unicodeToGujaratiLys = LYS.encode;
export const gujaratiLysToUnicode = LYS.decode;
