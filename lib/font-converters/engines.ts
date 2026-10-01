import { ConvertToASCII, ConvertToUnicode } from "unicode2ascii";
import { devanagariToBraille } from "@/lib/font-converters/braille";
import { ukToUs, usToUk } from "@/lib/font-converters/english";
import { gujaratiLysToUnicode, lmgArunToUnicode, unicodeToGujaratiLys, unicodeToLmgArun } from "@/lib/font-converters/gujarati";
import { nudiToUnicode, unicodeToNudi } from "@/lib/font-converters/kannada";
import { krutiToUnicode, unicodeToKruti } from "@/lib/font-converters/krutidev";
import {
  chanakyaToUnicode, gandhiToUnicode, shushaToUnicode, unicodeToChanakya, unicodeToGandhi, unicodeToShusha, unicodeToSurekh,
} from "@/lib/font-converters/legacy-devanagari";
import { unicodeToMlTt } from "@/lib/font-converters/malayalam";
import { kantipurToUnicode, preetiToUnicode, unicodeToKantipur, unicodeToPreeti } from "@/lib/font-converters/nepali";
import { anmolLipiToUnicode, unicodeToAnmolLipi } from "@/lib/font-converters/punjabi";
import { devanagariToRoman, type RomanScheme } from "@/lib/font-converters/roman";
import { shreeToUnicode, unicodeToShree } from "@/lib/font-converters/shree-lipi";
import { unicodeToShivaji } from "@/lib/font-converters/shivaji";
import { baminiToUnicode, unicodeToBamini, unicodeToShreeLipiTamil, unicodeToStmzh } from "@/lib/font-converters/tamil";

export interface ConvertOptions {
  romanScheme?: RomanScheme;
}

export interface ConvertResult {
  text: string;
  /** Number of words changed, for converters where that's meaningful (spelling). */
  changes?: number;
}

type Engine = (text: string, options: ConvertOptions) => ConvertResult;
const plain = (fn: (text: string) => string): Engine => (text) => ({ text: fn(text) });
/** Legacy font → legacy font, through Unicode. */
const via = (toUnicode: (text: string) => string, fromUnicode: (text: string) => string) => plain((text) => fromUnicode(toUnicode(text)));

/** Conversion code for every live converter in the registry, keyed by slug. */
export const engines: Record<string, Engine> = {
  "krutidev-to-unicode": plain(krutiToUnicode),
  "unicode-to-krutidev": plain(unicodeToKruti),
  "unicode-to-krutidev-010": plain(unicodeToKruti),
  // DevLys 010 uses the Kruti Dev 010 byte layout.
  "devlys-to-unicode": plain(krutiToUnicode),
  "unicode-to-devlys": plain(unicodeToKruti),
  "unicode-to-chanakya": plain(unicodeToChanakya),
  "chanakya-to-unicode": plain(chanakyaToUnicode),
  "krutidev-to-chanakya": via(krutiToUnicode, unicodeToChanakya),
  "chanakya-to-krutidev": via(chanakyaToUnicode, unicodeToKruti),
  "4cgandhi-to-unicode": plain(gandhiToUnicode),
  "unicode-to-4cgandhi": plain(unicodeToGandhi),
  "shusha-to-unicode": plain(shushaToUnicode),
  "unicode-to-shusha": plain(unicodeToShusha),
  "unicode-to-shree-lipi": plain(unicodeToShree),
  "shree-lipi-to-unicode": plain(shreeToUnicode),
  "krutidev-to-shree-lipi": via(krutiToUnicode, unicodeToShree),
  "shree-lipi-to-krutidev": via(shreeToUnicode, unicodeToKruti),
  "unicode-to-shivaji": plain(unicodeToShivaji),
  // DV-TT Yogesh shares DV-TT Surekh's layout.
  "unicode-to-surekh": plain(unicodeToSurekh),
  "unicode-to-yogesh": plain(unicodeToSurekh),
  "bijoy-to-unicode": plain((text) => ConvertToUnicode("bijoy", text)),
  "unicode-to-bijoy": plain((text) => ConvertToASCII("bijoy", text)),
  "anmol-lipi-to-unicode": plain(anmolLipiToUnicode),
  "unicode-to-anmol-lipi": plain(unicodeToAnmolLipi),
  "bamini-to-unicode": plain(baminiToUnicode),
  "unicode-to-bamini": plain(unicodeToBamini),
  "unicode-to-shree-lipi-tamil": plain(unicodeToShreeLipiTamil),
  "unicode-to-stmzh": plain(unicodeToStmzh),
  "nudi-to-unicode": plain(nudiToUnicode),
  "unicode-to-nudi": plain(unicodeToNudi),
  "unicode-to-ml-tt": plain(unicodeToMlTt),
  "unicode-to-lmg-arun": plain(unicodeToLmgArun),
  "lmg-arun-to-unicode": plain(lmgArunToUnicode),
  "gujarati-lys-to-unicode": plain(gujaratiLysToUnicode),
  "unicode-to-gujarati-lys": plain(unicodeToGujaratiLys),
  "preeti-to-unicode": plain(preetiToUnicode),
  "unicode-to-preeti": plain(unicodeToPreeti),
  "kantipur-to-unicode": plain(kantipurToUnicode),
  "unicode-to-kantipur": plain(unicodeToKantipur),
  "devanagari-to-braille": plain(devanagariToBraille),
  "hindi-to-roman": (text, options) => ({ text: devanagariToRoman(text, options.romanScheme) }),
  "uk-to-us-english": (text) => ukToUs(text),
  "us-to-uk-english": (text) => usToUk(text),
};

export function convertText(slug: string, text: string, options: ConvertOptions = {}): ConvertResult {
  const engine = engines[slug];
  if (!engine) throw new Error(`No converter for ${slug}`);
  return engine(text, options);
}
