/**
 * Every font converter on the platform. Pure data — the conversion code lives
 * in ./engines so tool listings don't pull it into every page.
 *
 * A converter is live only when its encoding table is verified; the rest are
 * listed as coming soon. Legacy fonts (AMS, Agra, Asees, Anu, …) are proprietary
 * glyph layouts, so each needs a mapping table checked against the font before it can go live.
 */

export const FONT_CONVERTER_GROUPS = [
  { id: "hindi", name: "Hindi" },
  { id: "marathi", name: "Marathi" },
  { id: "gujarati", name: "Gujarati" },
  { id: "punjabi", name: "Punjabi" },
  { id: "bangla", name: "Bangla" },
  { id: "tamil", name: "Tamil" },
  { id: "south", name: "Telugu, Kannada & Malayalam" },
  { id: "nepali", name: "Nepali" },
  { id: "other", name: "Braille, Roman & English" },
] as const;
export type FontConverterGroup = (typeof FONT_CONVERTER_GROUPS)[number]["id"];

/** How the text on one side of a converter is written. */
export interface TextSide {
  /** Shown in labels: "Unicode / Mangal", "Kruti Dev", "English (UK)". */
  label: string;
  /** Legacy font needed to read this side; the page renders the text in it when available. */
  font?: string;
  /** Font to fall back to when `font` isn't installed (only when it shares the encoding). */
  fallbackFont?: string;
  /** Script of Unicode text, used for the phonetic typing aid. */
  script?: "devanagari" | "bengali" | "latin" | "braille";
}

export interface FontConverter {
  slug: string;
  name: string;
  language: string;
  group: FontConverterGroup;
  from: TextSide;
  to: TextSide;
  live: boolean;
}

const UNICODE_HI: TextSide = { label: "Unicode / Mangal", script: "devanagari" };
const UNICODE_BN: TextSide = { label: "Unicode Bangla", script: "bengali" };
const unicode = (language: string): TextSide => ({ label: `Unicode ${language}` });
const UNICODE_NE: TextSide = { label: "Unicode Nepali", script: "devanagari" };
/** Kruti Dev 010 ships with the site; DevLys 010 has the same encoding, so it falls back to Kruti Dev. */
const KRUTI: TextSide = { label: "Kruti Dev", font: "Kruti Dev 010" };
const DEVLYS: TextSide = { label: "DevLys", font: "DevLys 010", fallbackFont: "Kruti Dev 010" };
const legacy = (label: string, font = label): TextSide => ({ label, font });

const c = (slug: string, name: string, language: string, group: FontConverterGroup, from: TextSide, to: TextSide, live = false): FontConverter =>
  ({ slug, name, language, group, from, to, live });

export const fontConverters: FontConverter[] = [
  // ---- Hindi
  c("krutidev-to-unicode", "Krutidev to Unicode", "Hindi", "hindi", KRUTI, UNICODE_HI, true),
  c("unicode-to-krutidev", "Unicode to Krutidev", "Hindi", "hindi", UNICODE_HI, KRUTI, true),
  c("unicode-to-krutidev-010", "Unicode to Krutidev 010", "Hindi", "hindi", UNICODE_HI, KRUTI, true),
  c("devlys-to-unicode", "DevLys to Unicode", "Hindi", "hindi", DEVLYS, UNICODE_HI, true),
  c("unicode-to-devlys", "Unicode to DevLys", "Hindi", "hindi", UNICODE_HI, DEVLYS, true),
  c("unicode-to-chanakya", "Unicode to Chanakya", "Hindi", "hindi", UNICODE_HI, legacy("Chanakya"), true),
  c("chanakya-to-unicode", "Chanakya to Unicode", "Hindi", "hindi", legacy("Chanakya"), UNICODE_HI, true),
  c("krutidev-to-chanakya", "Krutidev to Chanakya", "Hindi", "hindi", KRUTI, legacy("Chanakya"), true),
  c("chanakya-to-krutidev", "Chanakya to Krutidev", "Hindi", "hindi", legacy("Chanakya"), KRUTI, true),
  c("unicode-to-ams-calligraphy", "Unicode to AMS Calligraphy", "Hindi", "hindi", UNICODE_HI, legacy("AMS Calligraphy")),
  c("kruti-to-ams", "Kruti to AMS", "Hindi", "hindi", KRUTI, legacy("AMS Calligraphy")),
  c("unicode-to-abbasi", "Unicode to Abbasi", "Hindi", "hindi", UNICODE_HI, legacy("Abbasi")),
  c("agra-to-unicode", "Agra to Unicode", "Hindi", "hindi", legacy("Agra"), UNICODE_HI),
  c("chandini-to-unicode", "Chandini to Unicode", "Hindi", "hindi", legacy("Chandini"), UNICODE_HI),
  c("unicode-to-chandini", "Unicode to Chandini", "Hindi", "hindi", UNICODE_HI, legacy("Chandini")),
  c("4cgandhi-to-unicode", "4CGandhi to Unicode", "Hindi", "hindi", legacy("4CGandhi"), UNICODE_HI, true),
  c("unicode-to-4cgandhi", "Unicode to 4CGandhi", "Hindi", "hindi", UNICODE_HI, legacy("4CGandhi"), true),
  c("shusha-to-unicode", "Shusha to Unicode", "Hindi", "hindi", legacy("Shusha"), UNICODE_HI, true),
  c("unicode-to-shusha", "Unicode to Shusha", "Hindi", "hindi", UNICODE_HI, legacy("Shusha"), true),
  // ---- Marathi
  c("unicode-to-shree-lipi", "Unicode to Shree Lipi", "Marathi", "marathi", UNICODE_HI, legacy("Shree Lipi", "Shree-Dev-0714"), true),
  c("shree-lipi-to-unicode", "Shree Lipi to Unicode", "Marathi", "marathi", legacy("Shree Lipi", "Shree-Dev-0714"), UNICODE_HI, true),
  c("krutidev-to-shree-lipi", "Krutidev to Shree Lipi", "Marathi", "marathi", KRUTI, legacy("Shree Lipi", "Shree-Dev-0714"), true),
  c("shree-lipi-to-krutidev", "Shree Lipi to Krutidev", "Marathi", "marathi", legacy("Shree Lipi", "Shree-Dev-0714"), KRUTI, true),
  c("unicode-to-dg-marathi", "Unicode to DG", "Marathi", "marathi", UNICODE_HI, legacy("DG")),
  c("unicode-to-infinity", "Unicode to Infinity", "Marathi", "marathi", UNICODE_HI, legacy("Infinity")),
  c("unicode-to-shivaji", "Unicode to Shivaji", "Marathi", "marathi", UNICODE_HI, legacy("Shivaji", "Shivaji01"), true),
  c("saras-to-unicode", "Saras to Unicode", "Marathi", "marathi", legacy("Saras"), UNICODE_HI),
  c("unicode-to-surekh", "Unicode to Surekh", "Marathi", "marathi", UNICODE_HI, legacy("Surekh", "DV-TTSurekhEN"), true),
  c("unicode-to-yogesh", "Unicode to Yogesh", "Marathi", "marathi", UNICODE_HI, legacy("Yogesh", "DV-TTYogeshEN"), true),
  // ---- Gujarati
  c("unicode-to-ams-gujarati", "Unicode to AMS Gujarati", "Gujarati", "gujarati", unicode("Gujarati"), legacy("AMS Gujarati")),
  c("gujarati-lys-to-unicode", "Gujarati Lys to Unicode", "Gujarati", "gujarati", legacy("Gujarati Lys", "GujratiLys 010"), unicode("Gujarati"), true),
  c("unicode-to-gujarati-lys", "Unicode to Gujarati Lys", "Gujarati", "gujarati", unicode("Gujarati"), legacy("Gujarati Lys", "GujratiLys 010"), true),
  c("unicode-to-kap-gujarati", "Unicode to Kap", "Gujarati", "gujarati", unicode("Gujarati"), legacy("Kap")),
  c("unicode-to-lmg-arun", "Unicode to LMG Arun", "Gujarati", "gujarati", unicode("Gujarati"), legacy("LMG Arun", "LMG-Arun"), true),
  c("lmg-arun-to-unicode", "LMG Arun to Unicode", "Gujarati", "gujarati", legacy("LMG Arun", "LMG-Arun"), unicode("Gujarati"), true),
  // ---- Punjabi
  c("asees-to-unicode", "Asees to Unicode", "Punjabi", "punjabi", legacy("Asees"), unicode("Punjabi")),
  c("unicode-to-asees", "Unicode to Asees", "Punjabi", "punjabi", unicode("Punjabi"), legacy("Asees")),
  c("asees-to-anmol-lipi", "Asees to Anmol Lipi", "Punjabi", "punjabi", legacy("Asees"), legacy("Anmol Lipi", "AnmolLipi")),
  c("anmol-lipi-to-asees", "Anmol Lipi to Asees", "Punjabi", "punjabi", legacy("Anmol Lipi", "AnmolLipi"), legacy("Asees")),
  c("anmol-lipi-to-unicode", "Anmol Lipi to Unicode", "Punjabi", "punjabi", legacy("Anmol Lipi", "AnmolLipi"), unicode("Punjabi"), true),
  c("unicode-to-anmol-lipi", "Unicode to Anmol Lipi", "Punjabi", "punjabi", unicode("Punjabi"), legacy("Anmol Lipi", "AnmolLipi"), true),
  // ---- Bangla
  c("bijoy-to-unicode", "Bijoy to Unicode", "Bangla", "bangla", legacy("Bijoy", "SutonnyMJ"), UNICODE_BN, true),
  c("unicode-to-bijoy", "Unicode to Bijoy", "Bangla", "bangla", UNICODE_BN, legacy("Bijoy", "SutonnyMJ"), true),
  // ---- Tamil
  c("bamini-to-unicode", "Bamini to Unicode", "Tamil", "tamil", legacy("Bamini"), unicode("Tamil"), true),
  c("unicode-to-bamini", "Unicode to Bamini", "Tamil", "tamil", unicode("Tamil"), legacy("Bamini"), true),
  c("unicode-to-shree-lipi-tamil", "Unicode to Shree Lipi (Tamil)", "Tamil", "tamil", unicode("Tamil"), legacy("Shree Lipi Tamil", "SHREE-TAM7-0800"), true),
  c("unicode-to-stmzh", "Unicode to STMZH", "Tamil", "tamil", unicode("Tamil"), legacy("STMZH", "STMZH - 001"), true),
  // ---- Telugu, Kannada, Malayalam
  c("unicode-to-anu", "Unicode to Anu", "Telugu", "south", unicode("Telugu"), legacy("Anu")),
  c("unicode-to-nudi", "Unicode to Nudi", "Kannada", "south", unicode("Kannada"), legacy("Nudi", "Nudi 01 e"), true),
  c("nudi-to-unicode", "Nudi to Unicode", "Kannada", "south", legacy("Nudi", "Nudi 01 e"), unicode("Kannada"), true),
  c("unicode-to-ml-tt", "Unicode to ML-TT", "Malayalam", "south", unicode("Malayalam"), legacy("ML-TT", "ML-TTKarthika"), true),
  // ---- Nepali
  c("preeti-to-unicode", "Preeti to Unicode", "Nepali", "nepali", legacy("Preeti"), UNICODE_NE, true),
  c("unicode-to-preeti", "Unicode to Preeti", "Nepali", "nepali", UNICODE_NE, legacy("Preeti"), true),
  c("kantipur-to-unicode", "Kantipur to Unicode", "Nepali", "nepali", legacy("Kantipur"), UNICODE_NE, true),
  c("unicode-to-kantipur", "Unicode to Kantipur", "Nepali", "nepali", UNICODE_NE, legacy("Kantipur"), true),
  // ---- Braille, Roman, English
  c("hindi-to-roman", "Hindi to Roman", "Hindi", "other", UNICODE_HI, { label: "Roman (English letters)", script: "latin" }, true),
  c("devanagari-to-braille", "Devanagari to Braille", "Hindi", "other", UNICODE_HI, { label: "Bharati Braille", script: "braille" }, true),
  c("uk-to-us-english", "UK to US English", "English", "other", { label: "British English", script: "latin" }, { label: "American English", script: "latin" }, true),
  c("us-to-uk-english", "US to UK English", "English", "other", { label: "American English", script: "latin" }, { label: "British English", script: "latin" }, true),
];

export const liveFontConverters = fontConverters.filter((converter) => converter.live);

export function getFontConverter(slug: string) {
  return fontConverters.find((converter) => converter.slug === slug);
}

export const fontConverterTools = fontConverters.map((converter) => ({
  slug: converter.slug,
  name: converter.name,
  shortDescription: `Convert ${converter.from.label} text to ${converter.to.label}${converter.language === "English" ? " spelling" : ` (${converter.language})`}.`,
  categories: ["font-converters"] as ["font-converters"],
  group: converter.group,
  keywords: [converter.name.toLowerCase(), `${converter.from.label} to ${converter.to.label}`.toLowerCase(), "font converter", converter.language.toLowerCase()],
  icon: "type" as const,
  status: converter.live ? ("live" as const) : ("coming-soon" as const),
}));
