import { keyboardLayouts, type KeyboardKey } from "@/lib/keyboard-layouts.generated";

export type KeyboardGroup = "indian" | "international";

export interface KeyboardDefinition {
  slug: string;
  name: string;
  language: string;
  group: KeyboardGroup;
  /**
   * 48 keys, ids k0–k47 in physical order: k0–k12 number row, k13–k25 Q row
   * (ending with Backslash), k26–k36 home row, k37–k46 bottom row and k47 the
   * extra ISO key beside left Shift (IntlBackslash).
   */
  keys: KeyboardKey[];
  direction?: "ltr" | "rtl";
  /** Fonts offered first; `src` is a web font used by print. */
  fonts?: { label: string; value: string; src?: string }[];
  /**
   * Legacy font-encoded layout (Kruti Dev): the editor stores plain ASCII and the
   * font draws it as Devanagari, so physical keys are left to the browser.
   */
  legacy?: boolean;
}

/**
 * Drops zero-width spaces and collapses repeated ZWNJ/ZWJ that crept into the
 * scraped layouts — a single joiner is meaningful, a run of them is not.
 */
const tidy = (value: string | undefined) => value?.replace(/​/g, "").replace(/([‌‍])\1+/g, "$1") || undefined;

function cleanKeys(keys: KeyboardKey[]): KeyboardKey[] {
  return keys.map(({ id, normal, shift, alt }) => ({
    id,
    normal: tidy(normal) ?? "",
    ...(tidy(shift) ? { shift: tidy(shift) } : {}),
    ...(tidy(alt) ? { alt: tidy(alt) } : {}),
  }));
}

/** Code points that exist in Devanagari but not in the Bengali block. */
const BENGALI_GAPS = new Set([
  0x984, 0x98d, 0x98e, 0x991, 0x992, 0x9a9, 0x9b1, 0x9b3, 0x9b4, 0x9b5, 0x9ba, 0x9bb, 0x9c5, 0x9c6, 0x9c9, 0x9ca,
  0x9cf, 0x9d0, 0x9d1, 0x9d2, 0x9d3, 0x9d4, 0x9d5, 0x9d6, 0x9d8, 0x9d9, 0x9da, 0x9db, 0x9de, 0x9e4, 0x9e5,
  // Assigned, but to Assamese letters rather than the Devanagari sign they mirror.
  0x9f0, 0x9f1,
]);

/**
 * InScript puts the same letter on the same key in every Indic script, and the
 * Bengali block mirrors Devanagari 0x80 code points higher — so Bengali InScript
 * is Devanagari InScript shifted into the Bengali block. Letters Bengali lacks
 * are left off, except व, which Bengali InScript types as ব.
 */
function toBengaliInscript(keys: KeyboardKey[]): KeyboardKey[] {
  const convert = (value?: string) => {
    if (!value) return undefined;
    let out = "";
    for (const char of value) {
      const code = char.codePointAt(0)!;
      if (code === 0x935) out += "ব";
      else if (code < 0x900 || code > 0x97f || code === 0x964 || code === 0x965) out += char;
      else if (BENGALI_GAPS.has(code + 0x80) || code + 0x80 > 0x9fe) return undefined;
      else out += String.fromCodePoint(code + 0x80);
    }
    return out;
  };
  return keys.map(({ id, normal, shift, alt }) => {
    const [n, s, a] = [convert(normal), convert(shift), convert(alt)];
    return { id, normal: n ?? "", ...(s ? { shift: s } : {}), ...(a ? { alt: a } : {}) };
  });
}

function layout(slug: string) {
  const keys = keyboardLayouts[slug];
  if (!keys) throw new Error(`Missing keyboard layout: ${slug}`);
  return cleanKeys(keys);
}

type Options = Partial<Pick<KeyboardDefinition, "direction" | "fonts" | "legacy" | "keys">>;
const make = (slug: string, name: string, language: string, group: KeyboardGroup, options: Options = {}): KeyboardDefinition => ({
  slug, name, language, group, ...options, keys: options.keys ?? layout(slug),
});
const rtl = { direction: "rtl" } as const;

const US_SHIFT: Record<string, string> = { "`": "~", "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^", "7": "&", "8": "*", "9": "(", "0": ")", "-": "_", "=": "+", "[": "{", "]": "}", "\\": "|", ";": ":", "'": "\"", ",": "<", ".": ">", "/": "?" };
/** Kruti Dev is typed on a US layout; the font turns these ASCII keys into Devanagari. */
const krutiKeys: KeyboardKey[] = Array.from("`1234567890-=qwertyuiop[]\\asdfghjkl;'zxcvbnm,./\\").map((normal, index) => ({
  id: `k${index}`,
  normal,
  shift: US_SHIFT[normal] ?? normal.toUpperCase(),
}));

const krutiFont = (code: string) => ({ label: `Kruti Dev ${code}`, value: `Kruti Dev ${code}`, src: `/fonts/krutidev/KRDEV${code}.woff` });

export const keyboards: KeyboardDefinition[] = [
  make("kruti-dev-keyboard", "Kruti Dev Keyboard", "Hindi", "indian", { legacy: true, keys: krutiKeys, fonts: ["010", "011", "016", "055"].map(krutiFont) }),
  make("hindi-remington-keyboard", "Hindi Remington Keyboard", "Hindi", "indian"),
  make("hindi-mangal-keyboard", "Hindi Keyboard (Mangal)", "Hindi", "indian"),
  make("marathi-keyboard", "Marathi Keyboard", "Marathi", "indian"),
  make("bengali-keyboard", "Bengali Keyboard", "Bengali", "indian", { keys: toBengaliInscript(layout("hindi-mangal-keyboard")) }),
  make("gujarati-keyboard", "Gujarati Keyboard", "Gujarati", "indian"),
  make("oriya-keyboard", "Oriya Keyboard", "Odia", "indian"),
  make("punjabi-raavi-keyboard", "Punjabi Keyboard (Raavi)", "Punjabi", "indian"),
  make("kannada-keyboard", "Kannada Keyboard", "Kannada", "indian"),
  make("malayalam-keyboard", "Malayalam Keyboard", "Malayalam", "indian"),
  make("tamil-99-keyboard", "Tamil 99 Keyboard", "Tamil", "indian"),
  make("telugu-keyboard", "Telugu Keyboard", "Telugu", "indian"),
  make("telugu-sarala-keyboard", "Telugu Sarala Keyboard", "Telugu", "indian"),
  make("nepali-keyboard", "Nepali Keyboard", "Nepali", "indian"),
  make("urdu-keyboard", "Urdu Keyboard", "Urdu", "indian", rtl),
  make("urdu-phonetic-v1-1-keyboard", "Urdu Phonetic v1.1", "Urdu", "indian", rtl),
  make("urdu-phonetic-v1-2-keyboard", "Urdu Phonetic v1.2", "Urdu", "indian", rtl),
  make("bangla-jatiya-keyboard", "Bangla Jatiya Keyboard", "Bangla", "international"),
  make("bangla-bijoy-keyboard", "Bangla Bijoy Keyboard", "Bangla", "international"),
  make("sinhala-keyboard", "Sinhala Keyboard", "Sinhala", "international"),
  make("arabic-keyboard", "Arabic Keyboard", "Arabic", "international", rtl),
  make("persian-keyboard", "Persian Keyboard", "Persian", "international", rtl),
  make("pashto-keyboard", "Pashto Keyboard", "Pashto", "international", rtl),
  make("hebrew-keyboard", "Hebrew Keyboard", "Hebrew", "international", rtl),
  make("russian-keyboard", "Russian Keyboard", "Russian", "international"),
  make("ukrainian-keyboard", "Ukrainian Keyboard", "Ukrainian", "international"),
  make("bulgarian-keyboard", "Bulgarian Keyboard", "Bulgarian", "international"),
  make("greek-keyboard", "Greek Keyboard", "Greek", "international"),
  make("georgian-keyboard", "Georgian Keyboard", "Georgian", "international"),
  make("armenian-phonetic-keyboard", "Armenian Phonetic Keyboard", "Armenian", "international"),
  make("turkish-keyboard", "Turkish Keyboard", "Turkish", "international"),
  make("thai-keyboard", "Thai Keyboard", "Thai", "international"),
];

export const keyboardTools = keyboards.map((keyboard) => ({
  slug: keyboard.slug,
  name: keyboard.name,
  shortDescription: keyboard.legacy
    ? `Type ${keyboard.language} in the ${keyboard.fonts?.[0]?.label ?? keyboard.name} font with a visual keyboard.`
    : `Type ${keyboard.language} online with a visual keyboard and rich-text editor.`,
  categories: ["typing-tools"] as ["typing-tools"],
  group: keyboard.group,
  keywords: [keyboard.language.toLowerCase(), `${keyboard.language.toLowerCase()} typing`, "online keyboard", "typing", keyboard.name.toLowerCase()],
  icon: "languages" as const,
  status: "live" as const,
}));

export function getKeyboard(slug: string) { return keyboards.find((keyboard) => keyboard.slug === slug); }
