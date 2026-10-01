/**
 * Bamini, Shree Lipi Tamil (SHREE-TAM7) and STMZH ⇄ Unicode Tamil.
 *
 * Tamil legacy fonts draw most consonant + vowel-sign pairs as one glyph (கி, கு, கூ),
 * and type the "left" vowel signs ெ ே ை before the consonant: கொ = ெ + க + ா.
 * Each font is described as rows of glyphs per consonant; both directions are built
 * from the same rows.
 *
 * All three glyph layouts were checked against the fonts themselves.
 */

import { greedyMap } from "@/lib/font-converters/legacy-devanagari";

type Pairs = [string, string][];
/** base, ி, ீ, ு, ூ and (optionally) ் glyphs of one consonant; "" where the font has no glyph. */
type Row = [base: string, i: string, ii: string, u: string, uu: string, virama?: string];

interface TamilFont {
  vowels: Record<string, string>;
  rows: Record<string, Row>;
  /** Separate glyphs for ா, the left signs ெ ே ை, the ௌ length mark and ் (when a row has no ் glyph). */
  signs: { aa: string; e: string; ee: string; ai: string; au: string; virama: string };
  /** Unicode → legacy for everything else (punctuation, ஸ்ரீ). */
  other: Record<string, string>;
  /** Extra legacy spellings to read. */
  alternates?: Pairs;
}

function build(font: TamilFont) {
  const { aa, e, ee, ai, au, virama } = font.signs;
  const encode: Pairs = [];
  for (const [consonant, [base, i, ii, u, uu, dead]] of Object.entries(font.rows)) {
    encode.push(
      [consonant, base], [`${consonant}ா`, base + aa], [`${consonant}ி`, i], [`${consonant}ீ`, ii], [`${consonant}ு`, u], [`${consonant}ூ`, uu],
      [`${consonant}்`, dead ?? base + virama],
      [`${consonant}ெ`, e + base], [`${consonant}ே`, ee + base], [`${consonant}ை`, ai + base],
      [`${consonant}ொ`, e + base + aa], [`${consonant}ோ`, ee + base + aa], [`${consonant}ௌ`, e + base + au],
    );
  }
  encode.push(...Object.entries(font.vowels), ...Object.entries(font.other));
  const normalized: Pairs = encode.filter(([, legacy]) => legacy).map(([unicode, legacy]) => [unicode.normalize("NFC"), legacy]);
  const decode: Pairs = [...normalized.map(([unicode, legacy]): [string, string] => [legacy, unicode]), ...(font.alternates ?? [])];
  return { encode: normalized, decode };
}

const BAMINI = build({
  vowels: { அ: "m", ஆ: "M", இ: ",", ஈ: "<", உ: "c", ஊ: "C", எ: "v", ஏ: "V", ஐ: "I", ஒ: "x", ஓ: "X", ஔ: "xs", ஃ: "/" },
  rows: {
    க: ["f", "fp", "fP", "F", "$"], ங: ["q", "qp", "qP", "q{", "q_"], ச: ["r", "rp", "rP", "R", "#"], ஞ: ["Q", "Qp", "QP", "Q{", "Q_"],
    ட: ["l", "b", "B", "L", "^"], ண: ["z", "zp", "zP", "Z", "Z}"], த: ["j", "jp", "jP", "J", "J}"], ந: ["e", "ep", "eP", "E", "E}"],
    ப: ["g", "gp", "gP", "G", "G+"], ம: ["k", "kp", "kP", "K", "%"], ய: ["a", "ap", "aP", "A", "A+"], ர: ["u", "up", "uP", "U", "&"],
    ல: ["y", "yp", "yP", "Y", "Y}"], வ: ["t", "tp", "tP", "T", "T+"], ழ: ["o", "op", "oP", "O", "*"], ள: ["s", "sp", "sP", "S", "Sh"],
    ற: ["w", "wp", "wP", "W", "W}"], ன: ["d", "dp", "dP", "D", "D}"],
    ஜ: ["[", "[p", "[P", "[{", "[_"], ஷ: ["\\", "\\p", "\\P", "\\{", "\\_"], ஸ: ["]", "]p", "]P", "]{", "]_"], ஹ: ["`", "`p", "`P", "`{", "`_"],
  },
  signs: { aa: "h", e: "n", ee: "N", ai: "i", au: "s", virama: ";" },
  // In Bamini "," is இ and ";" is the pulli, so real punctuation uses other keys.
  other: { "ஸ்ரீ": "=", ",": ">", ";": "@", "'": "|", "’": "|", "‘": "~", "“": "'", "”": "\"" },
  alternates: [["R+", "சூ"], ["H", "ர்"]],
});

const SHREE_LIPI_TAMIL = build({
  vowels: { அ: "A", ஆ: "B", இ: "C", ஈ: "D", உ: "E", ஊ: "F", எ: "G", ஏ: "H", ஐ: "I", ஒ: "J", ஓ: "K", ஔ: "JÍ", ஃ: "L" },
  rows: {
    க: ["P", "Q", "R", "S", "T", "U"], ங: ["V", "W", "X", "Y", "Z", "["], ச: ["\\", "]", "^", "_", "`", "a"], ஞ: ["b", "c", "d", "e", "f", "g"],
    ட: ["h", "i", "j", "k", "l", "m"], ண: ["n", "o", "p", "q", "r", "s"], த: ["u", "v", "w", "x", "y", "z"], ந: ["|", "{", "}", "~", "¡", "¢"],
    ப: ["£", "¤", "¥", "¦", "§", "¨"], ம: ["©", "ª", "«", "•", "‰", "®"], ய: ["¯", "°", "±", "²", "³", "´"], ர: ["µ", "›", "Ÿ", "¸", "¹", "º"],
    ல: ["»", "¼", "½", "¾", "¿", "À"], வ: ["Á", "Â", "Ã", "Ä", "Å", "Æ"], ழ: ["Ç", "È", "É", "Ê", "Ë", "Ì"], ள: ["Í", "Î", "Ï", "Ð", "Ñ", "Ò"],
    ற: ["Ó", "Ô", "Õ", "Ö", "×", "Ø"], ன: ["Ú", "Û", "Ü", "Ý", "Þ", "ß"],
    // Grantha letters take separate ு / ூ signs.
    ஶ: ["†", "‡", "‚", "†û", "†ý", "ƒ"], ஜ: ["á", "â", "ã", "áû", "áý", "ä"], ஷ: ["å", "æ", "ç", "åû", "åý", "è"],
    ஸ: ["é", "ê", "ë", "éû", "éý", "ì"], ஹ: ["í", "î", "ï", "íû", "íý", "ð"], "க்ஷ": ["ñ", "ò", "ó", "ñû", "ñý", "ô"],
  },
  signs: { aa: "õ", e: "ö", ee: "÷", ai: "ø", au: "Í", virama: "" },
  other: { "ஸ்ரீ": "ÿ" },
});

export const baminiToUnicode = (text: string) => greedyMap(text, BAMINI.decode).normalize("NFC");
export const unicodeToBamini = (text: string) => greedyMap(text.normalize("NFC"), BAMINI.encode);
export const shreeLipiTamilToUnicode = (text: string) => greedyMap(text, SHREE_LIPI_TAMIL.decode).normalize("NFC");
export const unicodeToShreeLipiTamil = (text: string) => greedyMap(text.normalize("NFC"), SHREE_LIPI_TAMIL.encode);

/**
 * STMZH is a symbol font: Word stores its text as U+F020–U+F0FF, so that is what we write.
 * Its ஷ sits at 0xAD, which as a plain character would be an invisible soft hyphen.
 */
const pua = (...bytes: number[]) => String.fromCharCode(...bytes.map((b) => 0xf000 + b));
const row = (...bytes: number[]): Row => bytes.map((b) => (b ? pua(b) : "")) as Row;

const STMZH = build({
  vowels: {
    அ: pua(0xb6), ஆ: pua(0x67), இ: pua(0xd6), ஈ: pua(0x7e), உ: pua(0x63), ஊ: pua(0xbb), எ: pua(0xa8), ஏ: pua(0xb0), ஐ: pua(0x6e),
    ஒ: pua(0xce), ஓ: pua(0x7b), ஔ: pua(0xc1), ஃ: pua(0xe0),
  },
  rows: {
    க: row(0xef, 0xfe, 0xff, 0x7a, 0xed, 0xc2), ங: row(0xf4, 0, 0, 0, 0, 0xba), ச: row(0xc4, 0x45, 0xe6, 0xb7, 0xf3, 0xdf),
    ஞ: row(0x51, 0, 0, 0, 0, 0xde), ட: row(0xa6, 0xbd, 0xcf, 0x7c, 0xf9, 0xe2), ண: row(0xf0, 0xe8, 0xa7, 0x62, 0x49, 0xf5),
    த: row(0x3e, 0x5d, 0x79, 0x6d, 0x23, 0xdd), ந: row(0xe5, 0x57, 0xc0, 0x4f, 0xb1, 0xcd), ப: row(0xc3, 0xb8, 0xac, 0x41, 0xaf, 0xa9),
    ம: row(0x5c, 0x74, 0x2a, 0x78, 0x4a, 0x44), ய: row(0x42, 0x6c, 0x58, 0xa5, 0x52, 0x46), ர: row(0xab, 0xf6, 0x5a, 0xf2, 0xd4, 0xec),
    ல: row(0xe9, 0x6f, 0xdc, 0x4b, 0xd9, 0x5f), வ: row(0x6b, 0x73, 0x54, 0xa1, 0xc6, 0xcb), ழ: row(0x77, 0x61, 0xd1, 0xbf, 0xf1, 0xb5),
    ள: row(0x65, 0xb9, 0x43, 0xd3, 0x6a, 0x5e), ற: row(0xc5, 0xa4, 0x53, 0xae, 0x47, 0x75), ன: row(0xaa, 0x4d, 0xcc, 0xd0, 0xfb, 0x5b),
    ஜ: row(0xdb, 0xf7, 0xfd, 0x68, 0xc9, 0xeb), ஷ: row(0xad, 0xb4, 0x55, 0xd7, 0xa3, 0x69), ஸ: row(0x76, 0x4c, 0xa2, 0x71, 0x60, 0xfc),
    ஹ: row(0xc7, 0x4e, 0xea, 0xf8, 0xda, 0xe3), "க்ஷ": row(0xb3, 0x48, 0xc8, 0x59, 0x66, 0xd5),
  },
  signs: { aa: pua(0x56), e: pua(0xd8), ee: pua(0xbc), ai: pua(0xe7), au: pua(0xe1), virama: "" },
  other: {
    "ஸ்ரீ": pua(0x70), "௸": pua(0x72), "‘": pua(0x22), "’": pua(0x27), "'": pua(0x27),
    ...Object.fromEntries([..."0123456789!%?&()+,-:;=."].map((c) => [c, pua(c.charCodeAt(0))])),
  },
});

/** Unicode characters that Windows-1252 bytes 0x80–0x9F become, for STMZH text pasted as plain characters. */
const CP1252_HIGH = [
  0x20ac, 0x81, 0x201a, 0x192, 0x201e, 0x2026, 0x2020, 0x2021, 0x2c6, 0x2030, 0x160, 0x2039, 0x152, 0x8d, 0x17d, 0x8f,
  0x90, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x2dc, 0x2122, 0x161, 0x203a, 0x153, 0x9d, 0x17e, 0x178,
];
const toPua = (text: string) =>
  Array.from(text, (c) => {
    const code = c.charCodeAt(0);
    const high = CP1252_HIGH.indexOf(code);
    if (high >= 0) return pua(0x80 + high);
    return code > 0x20 && code <= 0xff ? pua(code) : c;
  }).join("");

export const stmzhToUnicode = (text: string) => greedyMap(toPua(text), STMZH.decode).normalize("NFC");
export const unicodeToStmzh = (text: string) => greedyMap(text.normalize("NFC"), STMZH.encode);
