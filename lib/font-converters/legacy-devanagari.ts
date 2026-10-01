/**
 * Legacy Devanagari fonts (Chanakya, 4CGandhi, Shusha, DV-TT Surekh / Yogesh) ⇄ Unicode.
 *
 * Each font stores Hindi / Marathi as ASCII / Latin-1 bytes that the font draws as
 * Devanagari. Converting is a table lookup plus two reorderings Unicode doesn't share:
 * - ि is typed before its consonant cluster (Unicode: after it);
 * - the reph (र् drawn on top) is typed after its syllable (Unicode: before it).
 *
 * The tables come from the public-domain Rajbhasha converters (see
 * ./tables/devanagari.generated.ts); the per-font rules below follow those converters.
 */

import * as T from "@/lib/font-converters/tables/devanagari.generated";

type Table = [string, string][];

const VIRAMA = "्";
const NUKTA = "़";
const chars = (...codes: number[]) => String.fromCharCode(...codes);
const range = (from: number, to: number) => `${chars(from)}-${chars(to)}`;

/** Consonants, including the precomposed nukta letters क़–य़. */
const CONS = `[${range(0x915, 0x939)}${range(0x958, 0x95f)}]`;
/** A consonant cluster: C, C्C, C्C्C… */
const CLUSTER = `(?:${CONS}${NUKTA}?${VIRAMA})*${CONS}${NUKTA}?`;
const MATRAS = "ािीुूृॄेैोौॅॉ";
const SIGNS = `${MATRAS}ंँः`;
const IS_CONS = new RegExp(`^${CONS}$`, "u");

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const rx = (source: string) => new RegExp(source, "gu");

/** Applies a table in order, repeating each row until it no longer matches (as the source converters do). */
export function replaceTable(text: string, table: Table) {
  for (const [from, to] of table) {
    for (let guard = 0; guard < 8 && text.includes(from); guard++) text = text.split(from).join(to);
  }
  return text;
}

/** Replaces text in one left-to-right pass, taking the longest matching key at each position. */
export function greedyMap(text: string, pairs: Table) {
  const map = new Map<string, string>();
  for (const [from, to] of pairs) if (from && !map.has(from)) map.set(from, to);
  const pattern = new RegExp([...map.keys()].sort((a, b) => b.length - a.length).map(escape).join("|"), "gu");
  return text.replace(pattern, (match) => map.get(match) ?? match);
}

/** NFC splits क़ into क + ़; the font tables use the one-character forms. */
const NUKTA_FORMS: Record<string, string> = {
  क: chars(0x958), ख: chars(0x959), ग: chars(0x95a), ज: chars(0x95b), ड: chars(0x95c), ढ: chars(0x95d), फ: chars(0x95e), य: chars(0x95f),
  न: chars(0x929), र: chars(0x931),
};
export function unicodeInput(text: string) {
  return text.normalize("NFC")
    .replace(/[​-‍﻿]/g, "")
    .replace(/([कखगजडढफयनर])़/g, (_, c: string) => NUKTA_FORMS[c]);
}
const unicodeOutput = (text: string) => text.normalize("NFC");

/** Legacy → Unicode: `glyph` + cluster becomes cluster + `as` (ि or िं). */
export function iAfterCluster(text: string, glyph: string, as = "ि") {
  return text.replace(rx(`${escape(glyph)}(${CLUSTER})`), `$1${as}`).split(glyph).join(as);
}

/** Unicode → legacy: cluster + ि becomes `glyph` + cluster (and िं becomes `nasal` + cluster). */
export function iBeforeCluster(text: string, glyph: string, nasal?: string) {
  if (nasal) text = text.replace(rx(`(${CLUSTER})िं`), `${nasal}$1`);
  return text.replace(rx(`(${CLUSTER})ि`), `${glyph}$1`);
}

/** Legacy → Unicode: a reph glyph after its syllable becomes र् before the cluster. */
export function rephBefore(text: string, glyph: string) {
  let at = text.indexOf(glyph);
  while (at >= 0) {
    let start = at - 1;
    while (start > 0 && (SIGNS.includes(text[start]) || text[start] === "ि" || text[start] === NUKTA)) start--;
    while (start >= 2 && text[start - 1] === VIRAMA && IS_CONS.test(text[start - 2])) start -= 2;
    if (start > 0 && text[start] === NUKTA) start--;
    text = start < 0 ? `र्${text.slice(at + glyph.length)}` : `${text.slice(0, start)}र्${text.slice(start, at)}${text.slice(at + glyph.length)}`;
    at = text.indexOf(glyph);
  }
  return text;
}

/**
 * Unicode → legacy: र् that starts a cluster moves after it as `glyph`.
 * `withMatras` puts it after the vowel signs too (most fonts); otherwise right after the cluster.
 */
export function rephAfter(text: string, glyph: string, withMatras = true) {
  const signs = withMatras ? `[${SIGNS}]*` : "";
  return text.replace(rx(`(?<!${VIRAMA})र्((?:${CONS}${VIRAMA})*${CONS}${signs})`), `$1${glyph}`);
}

/** A copy of `table` with some rows dropped (by source) and others overridden in place, or appended when new. */
function patchTable(table: Table, drop: string[], set: Table = []) {
  const overrides = new Map(set);
  const rows: Table = table.filter(([from]) => !drop.includes(from)).map(([from, to]) => [from, overrides.get(from) ?? to]);
  for (const [from, to] of set) if (!rows.some(([key]) => key === from)) rows.push([from, to]);
  return rows;
}

/** Tidy-ups every legacy → Unicode pipeline needs. */
export function tidyUnicode(text: string) {
  return text
    .replace(/([ंँ])([ािीुूृेैोौ])/g, "$2$1")
    .replace(/ाे/g, "ो").replace(/ाै/g, "ौ").replace(/ाॅ/g, "ॉ")
    .replace(/्ा/g, "");
}

// ---- Chanakya

export function chanakyaToUnicode(input: string) {
  let text = replaceTable(input, T.CHANAKYA_TO_UNICODE);
  text = text.replace(/Z/g, "üं");
  text = iAfterCluster(text, "ç");
  text = rephBefore(text, "ü");
  return unicodeOutput(tidyUnicode(text));
}

export function unicodeToChanakya(input: string) {
  let text = unicodeInput(input);
  text = iBeforeCluster(text, "ç");
  text = rephAfter(text, "ü");
  text = replaceTable(text, T.UNICODE_TO_CHANAKYA);
  // क, फ and the other round letters carry a separate stroke after their signs.
  text = text.replace(/([·È`ªPBQRLM])([éêëìíðñ¢´¡òýü¸]*)/g, "$1$2¤");
  return text.replace(/ð¢ü/g, "ðZ");
}

// ---- 4CGandhi

// The source's two directions disagree on रु; its decoder (ř = रु, ÷ = रू) is the one in wide use.
const UNICODE_TO_GANDHI = patchTable(T.UNICODE_TO_GANDHI, [], [["रु", "ř"]]);

export function gandhiToUnicode(input: string) {
  // The क / फ / ऊ stroke "Y" is typed after the letter's signs; bring it back first.
  let text = input.replace(/([abcghÆÇÈČZmËÊĘÑŃiÒÔÞ|`]+)(Y)/g, "$2$1");
  text = replaceTable(text, T.GANDHI_TO_UNICODE);
  // A stroke left over (after क्त, ऋ …) is only decoration.
  text = text.replace(/Y/g, "");
  text = iAfterCluster(text, "Î", "िं");
  text = iAfterCluster(text, "d");
  text = rephBefore(rephBefore(text, "Ê"), "Ę");
  text = text.replace(/ +([ािीुूृेैोौ])/g, "$1");
  return unicodeOutput(tidyUnicode(text));
}

export function unicodeToGandhi(input: string) {
  let text = unicodeInput(input);
  text = iBeforeCluster(text, "d", "Î");
  text = rephAfter(text, "Ê");
  // ि / िं with a reph, and ं with a reph, have their own glyphs.
  text = text.replace(/Êd/g, "Í").replace(/ÊÎ/g, "Ì").replace(/ंÊ/g, "Ë");
  // A virama at the end of a word is drawn explicitly.
  text = text.replace(/्([ ,;.।\n\-:])/g, "Ð$1");
  text = replaceTable(text, UNICODE_TO_GANDHI);
  return text.replace(/([XY]+)([abcghÆÇÈČZmËÊĘÑŃiÒÔÞ|`]+)/g, "$2$1");
}

// ---- Shusha

// In Shusha "." is the danda, "º" the full stop, "," the nukta and "¹" a hyphen. The source
// decoder also reads "º" as a nukta (shadowing its own "º" → "." row) and adds a space after "।".
// "º" goes last so the full stop it produces isn't read again as a danda.
const SHUSHA_TO_UNICODE = patchTable(T.SHUSHA_TO_UNICODE, ["º"], [[".", "।"], ["¹", "-"], ["º", "."]]);

export function shushaToUnicode(input: string) {
  let text = replaceTable(input, SHUSHA_TO_UNICODE);
  text = iAfterCluster(text, "i");
  text = rephBefore(text, "-");
  text = text.replace(/ +([ािीुूृेैोौ])/g, "$1");
  text = text.replace(/([ािीुूृेैोौंँ])([ािीुूृेैोौ])/g, "$1");
  return unicodeOutput(tidyUnicode(text));
}

export function unicodeToShusha(input: string) {
  let text = unicodeInput(input);
  text = iBeforeCluster(text, "i");
  // "-" is Shusha's reph, so a real hyphen is typed as "¹".
  text = text.replace(/-/g, "¹").replace(/श्र्/g, "E").replace(/त्र्य/g, "~\\ya");
  // Shusha's reph sits right after the cluster; ा, ो and ी then pull it along.
  text = rephAfter(text, "-", false);
  text = replaceTable(text, T.UNICODE_TO_SHUSHA);
  text = text.replace(/-ao/g, "ao-").replace(/-a/g, "a-").replace(/-I/g, "I-").replace(/ -/g, "-");
  for (const [from, to] of [["ki,", "ik,"], ["Ki,", "iÓ"], ["gai,", "iga,"], ["fi,", "iÔ"], ["Di,", "iD,"], ["Zi,", "iZ,"], ["jai,", "ija,"], ["nai,", "ina,"], ["ri,", "ir,"], ["Li,", "iL,"]]) {
    text = text.split(from).join(to);
  }
  return text;
}

// ---- DV-TT Surekh / Yogesh

/** The source table maps word-final "रू " to "डिग्री" (°), which corrupts words like गुरू. */
const SUREKH_TABLE = T.SUREKH_TO_UNICODE.filter(([legacy]) => legacy !== "रू ");

/** Signs merged with the reph: ी + reph = "Ô", and so on. */
const SUREKH_REPH_MERGED: Record<string, string> = { "È": "Çं", "ç": "Çें", "æ": "Çे", "ë": "Çैं", "ê": "Çै", "Ô": "Çी", "Õ": "Çीं" };

export function surekhToUnicode(input: string) {
  let text = replaceTable(input, SUREKH_TABLE);
  text = text.replace(/[ÈçæëêÔÕ]/g, (c) => SUREKH_REPH_MERGED[c] ?? c).replace(/Ó/g, "ीं");
  // ि glyphs: Ê / Î plain, Ë / Ï with a dot, Ì / Í with a reph as well.
  text = text.replace(/Ì/g, "र्Ê").replace(/Î/g, "Ê").replace(/Í/g, "र्Ë");
  text = iAfterCluster(text, "Ï", "िं");
  text = iAfterCluster(text, "Ë", "िं");
  text = iAfterCluster(text, "Ê");
  text = rephBefore(text, "Ç");
  return unicodeOutput(tidyUnicode(text));
}

const DEVANAGARI = /[ऀ-ॿ]/u;

/** Unicode → Surekh glyph, from the Surekh → Unicode table (first spelling wins). */
const SUREKH_GLYPH = new Map<string, string>();
for (const [legacy, unicode] of SUREKH_TABLE) {
  const key = unicodeInput(unicode);
  if (key && [...key].every((c) => DEVANAGARI.test(c)) && !SUREKH_GLYPH.has(key) && !DEVANAGARI.test(legacy)) SUREKH_GLYPH.set(key, legacy);
}
const SUREKH_STEM = "É";

/** A consonant cluster in Surekh glyphs: half forms, then a full form (half + stem when there's no full glyph). */
function surekhCluster(cluster: string) {
  let out = "";
  let at = 0;
  while (at < cluster.length) {
    let taken = 0;
    for (let length = Math.min(6, cluster.length - at); length > 0 && !taken; length--) {
      const piece = cluster.slice(at, at + length);
      const rest = cluster.slice(at + length);
      if (piece.endsWith(VIRAMA)) {
        // A half form needs a consonant after it.
        if (rest && SUREKH_GLYPH.has(piece)) {
          out += SUREKH_GLYPH.get(piece);
          taken = length;
        }
        continue;
      }
      // A full form can't be followed by ् + consonant unless that's the ्र / ्य subscript.
      if (rest.length > 1 && rest[0] === VIRAMA && !/^्[रय]/u.test(rest)) continue;
      const glyph = SUREKH_GLYPH.get(piece) ?? (SUREKH_GLYPH.has(piece + VIRAMA) ? SUREKH_GLYPH.get(piece + VIRAMA) + SUREKH_STEM : undefined);
      if (glyph !== undefined) {
        out += glyph;
        taken = length;
      }
    }
    if (!taken) {
      out += cluster[at] === VIRAMA ? SUREKH_GLYPH.get(VIRAMA) : cluster[at];
      taken = 1;
    }
    at += taken;
  }
  return out;
}

/** Vowel signs and dots as Surekh glyphs; ी + ं has its own glyph. */
const surekhSigns = (signs: string) => [...signs].map((sign) => SUREKH_GLYPH.get(sign) ?? sign).join("").replace(/ÒÆ/g, "Ó");

export function unicodeToSurekh(input: string) {
  // ॉ and ऑ are typed as ा / आ plus the candra sign.
  const text = unicodeInput(input).replace(/ॉ/g, "ाॅ").replace(/ऑ/g, "आॅ");
  const syllable = rx(`(र्(?=${CONS}))?(${CLUSTER}${VIRAMA}?)([${MATRAS}ि]?)([ंँ]?)`);
  return text.replace(syllable, (_, reph: string | undefined, cluster: string, vowel: string, nasal: string) => {
    // रु, रू, दृ and हृ are single glyphs.
    const merged = cluster.endsWith(VIRAMA) ? undefined : SUREKH_GLYPH.get(cluster + vowel);
    const base = merged ?? surekhCluster(cluster);
    const sign = merged === undefined ? vowel : "";
    const candrabindu = nasal === "ँ" ? surekhSigns(nasal) : "";
    const dot = nasal === "ं";
    // ि is typed before the cluster, merged with the dot and/or reph.
    if (sign === "ि") return (reph ? (dot ? "Í" : "Ì") : dot ? "Ë" : "Ê") + base + candrabindu;
    if (!reph) return base + surekhSigns(sign + nasal);
    // The reph follows the syllable, merged with ी, े, ै or ं.
    const rephTail: Record<string, string> = {
      "ी": dot ? "Õ" : "Ô", "े": dot ? "ç" : "æ", "ै": dot ? "ë" : "ê",
      "ो": SUREKH_STEM + (dot ? "ç" : "æ"), "ौ": SUREKH_STEM + (dot ? "ë" : "ê"),
    };
    return base + (rephTail[sign] ?? surekhSigns(sign) + (dot ? "È" : "Ç")) + candrabindu;
  }).replace(/[ऀ-ॿ]/gu, (c) => SUREKH_GLYPH.get(c) ?? c);
}
