/**
 * Shree Lipi (Shree-Dev-0714) ⇄ Unicode (Marathi / Hindi Devanagari).
 *
 * Like Kruti Dev, Shree-Dev-0714 is a font-based encoding: text is stored as
 * ASCII / Latin-1 and the font draws each byte as a Devanagari glyph. The glyph
 * layout follows the widely used Shree-Dev-0714 converter tables, checked
 * against real Marathi text (see converters.test.ts).
 *
 * Quirks of the layout:
 * - Round consonants carry a separate hook glyph: क = "H$", फ = "\$", ट = "Q>".
 *   A below/above sign (ु ू े ं …) is typed between the letter and its hook: कु = "Hw$".
 * - ि is typed before its cluster: "{" before a single glyph, "p" (a longer
 *   loop) before a cluster built from several glyphs — स्थि = "pñW".
 * - The reph (र् on top) is typed after its syllable as "©", or merged with the
 *   vowel sign before it: र्ती = "Vu", र्षां = "fmª".
 */

const VIRAMA = "्";
const NUKTA = "़";
/** क–ह plus the precomposed nukta letters क़–य़. */
const IS_CONSONANT = /[क-हक़-य़]/u;

type Hook = "" | "$" | ">";
interface Glyph { text: string; hook?: Hook }

const g = (text: string, hook: Hook = ""): Glyph => ({ text, hook });

/** Full consonants. */
const FULL: Record<string, Glyph> = {
  क: g("H", "$"), ख: g("I"), ग: g("J"), घ: g("K"), ङ: g("L", ">"),
  च: g("M"), छ: g("N", ">"), ज: g("O"), झ: g("P"),
  ट: g("Q", ">"), ठ: g("R", ">"), ड: g("S", ">"), ढ: g("T", ">"), ण: g("U"),
  त: g("V"), थ: g("W"), द: g("X"), ध: g("Y"), न: g("Z"),
  प: g("n"), फ: g("\\", "$"), ब: g("~"), भ: g("^"), म: g("_"),
  य: g("`"), र: g("a"), ल: g("b"), ळ: g("i"), व: g("d"),
  श: g("e"), ष: g("f"), स: g("g"), ह: g("h"),
};

/** Half forms (consonant + ्). Consonants missing here are written full + "²" (visible virama). */
const HALF: Record<string, string> = {
  क: "Š", ख: "»", ग: "½", घ: "¿", च: "À", ज: "Á", झ: "Â", ञ: "Ä", ण: "Ê",
  त: "Ë", थ: "Ï", ध: "Ü", न: "Ý", प: "ß", फ: "â", ब: "ã", भ: "ä", म: "å",
  य: "æ", ल: "ë", ळ: "ù", व: "ì", श: "í", ष: "î", स: "ñ", ह: "ô",
};

/** Conjuncts drawn as one glyph. Keys ending in ् are half forms. */
const LIGATURES: Record<string, Glyph> = {
  "क्ष": g("j"), "क्ष्": g("ú"), "ज्ञ": g("k"), "श्र": g("l"),
  "त्र": g("Ì"), "त्र्": g("Í"), "त्त": g("Îm"), "त्त्": g("Î"), "ञ्च्": g("#"), "ज्ज्": g("‚"),
  "क्क": g("¸", "$"), "क्त": g("º", "$"), "क्व": g("¹"), "ख्र": g("¼"), "ग्न": g("¾"), "च्च": g("ƒ"), "झ्र": g("Ã"),
  "ङ्म": g("¶"), "ङ्क्ष": g("¬"),
  "ट्ट": g("Å"), "ट्ठ": g("Æ"), "ठ्ठ": g("Ç"), "ड्ड": g("È"), "ड्ढ": g("É"),
  "द्र": g("Ð"), "द्ग": g("Ò"), "द्घ": g("Ó"), "द्द": g("Ô"), "द्ध": g("Õ"), "द्न": g("Ö"),
  "द्ब": g("×"), "द्भ": g("Ø"), "द्म": g("Ù"), "द्य": g("Ú"), "द्व": g("Û"),
  "न्न": g("Þ"), "प्र": g("à"), "प्त": g("á"), "ल्ल": g("„"),
  "श्च": g("ü"), "श्न": g("ý"), "श्व": g("œ"), "ष्ट": g("ï"), "ष्ठ": g("ð"),
  "स्र": g("ò"), "स्त्र": g("ó"),
  "ह्ण": g("†"), "ह्ल": g("‡"), "ह्व": g("ˆ"), "ह्र": g("õ"), "ह्म": g("÷"), "ह्य": g("ø"),
};
const LIGATURE_KEYS = Object.keys(LIGATURES).sort((a, b) => b.length - a.length);

/** A consonant together with its vowel sign, drawn as one glyph. */
const WITH_VOWEL: Record<string, Glyph> = { "रु": g("é"), "रू": g("ê", "$"), "दृ": g("Ñ"), "हृ": g("ö") };

const VOWELS: Record<string, Glyph> = {
  अ: g("A"), आ: g("Am"), इ: g("B"), ई: g("B©"), उ: g("C"), ऊ: g("D", "$"), ऋ: g("F"), ॠ: g("G"),
  ए: g("E"), ऐ: g("Eo"), ओ: g("Amo"), औ: g("Am¡"), ऑ: g("Am°"), ॲ: g("A°"), ऍ: g("E°"),
};

const MATRAS: Record<string, string> = {
  "ा": "m", "ी": "r", "ु": "w", "ू": "y", "ृ": "¥", "ॄ": "¦", "े": "o", "ै": "¡", "ो": "mo", "ौ": "m¡", "ॉ": "m°", "ॅ": "°",
};
const NASALS: Record<string, string> = { "ं": "§", "ँ": "±" };

const SYMBOLS: Record<string, string> = {
  "।": "&", "॥": "&&", "ऽ": "@", "ॐ": "›", "ः": "…", [VIRAMA]: "²", "‘": "\"", "’": "'", "–": "-", "—": "-",
  "०": "0", "१": "1", "२": "2", "३": "3", "४": "4", "५": "5", "६": "6", "७": "7", "८": "8", "९": "9",
};

/** Signs that sit between a round consonant and its hook: कु = "Hw$", टे = "Qo>". */
const BEFORE_HOOK = new Set("owy¥¦¡±§²°«´—");

function withHook(glyph: Glyph, signs: string) {
  if (!glyph.hook) return glyph.text + signs;
  // The reph also goes inside क / फ's hook (क + © = "H©$").
  const inside = signs && (BEFORE_HOOK.has(signs[0]) || (glyph.hook === "$" && signs[0] === "©")) ? 1 : 0;
  return glyph.text + signs.slice(0, inside) + glyph.hook + signs.slice(inside);
}

/** ्र after a consonant: a slanted stroke that differs for the round letters. */
function raSign(glyph: Glyph) {
  if (glyph.text === "ï") return "—";
  return glyph.hook === ">" ? "´" : "«";
}

interface Unit { consonant: string; nukta: boolean }
interface Token { glyph: Glyph; sign: string }

function consonantGlyph(unit: Unit, half: boolean): Glyph | undefined {
  const consonant = unit.consonant === "ऱ" ? "र" : unit.consonant;
  if (unit.nukta && consonant === "ख") return g(half ? "™" : "˜");
  const base = half ? (HALF[consonant] === undefined ? undefined : g(HALF[consonant])) : FULL[consonant];
  if (!base) return undefined;
  if (!unit.nukta) return base;
  return { ...base, text: (consonant === "ड" || consonant === "ढ" ? "‹" : "µ") + base.text };
}

/** Splits a consonant cluster into glyphs, preferring ligatures. */
function clusterTokens(units: Unit[], dead: boolean): Token[] {
  const text = units.map((u) => u.consonant + (u.nukta ? NUKTA : "")).join(VIRAMA) + (dead ? VIRAMA : "");
  const tokens: Token[] = [];
  let at = 0;
  while (at < text.length) {
    const ligature = LIGATURE_KEYS.find((key) => {
      if (!text.startsWith(key, at)) return false;
      const rest = text.slice(at + key.length);
      // A half ligature needs a consonant after it; a full one must not be followed by ्
      // unless that's the ्र stroke.
      if (key.endsWith(VIRAMA)) return IS_CONSONANT.test(rest[0] ?? "");
      return !rest.startsWith(VIRAMA) || rest === VIRAMA || (rest.startsWith(`${VIRAMA}र`) && rest[2] !== VIRAMA);
    });
    let glyph: Glyph | undefined;
    let next: number;
    if (ligature) {
      glyph = LIGATURES[ligature];
      next = at + ligature.length;
      if (ligature.endsWith(VIRAMA)) {
        tokens.push({ glyph, sign: "" });
        at = next;
        continue;
      }
    } else {
      const unit = { consonant: text[at], nukta: text[at + 1] === NUKTA };
      next = at + (unit.nukta ? 2 : 1);
      const followedBy = text[next + 1];
      if (text[next] === VIRAMA && IS_CONSONANT.test(followedBy ?? "") && !(followedBy === "र" && text[next + 2] !== VIRAMA)) {
        const half = consonantGlyph(unit, true);
        if (half) {
          tokens.push({ glyph: half, sign: "" });
          at = next + 1;
          continue;
        }
      }
      glyph = consonantGlyph(unit, false) ?? g(text.slice(at, next));
    }
    // What follows a full glyph: the ्र stroke, a visible virama, or nothing.
    if (text.startsWith(`${VIRAMA}र`, next) && text[next + 2] !== VIRAMA) {
      tokens.push({ glyph, sign: raSign(glyph) });
      at = next + 2;
    } else if (text[next] === VIRAMA) {
      tokens.push({ glyph, sign: "²" });
      at = next + 1;
    } else {
      tokens.push({ glyph, sign: "" });
      at = next;
    }
  }
  return tokens;
}

/** Vowel sign, anusvara, reph and visarga after a cluster, as Shree glyphs. */
function syllableTail(vowel: string, nasal: string, reph: boolean, visarga: boolean) {
  let tail: string;
  if (!reph) tail = (MATRAS[vowel] ?? "") + (NASALS[nasal] ?? "");
  else {
    const anusvara = nasal === "ं";
    const merged: Record<string, string> = { "ी": anusvara ? "v" : "u", "े": anusvara ? "]" : "}", "ै": anusvara ? "¤" : "£" };
    merged["ो"] = `m${merged["े"]}`;
    merged["ौ"] = `m${merged["ै"]}`;
    tail = merged[vowel] ?? (MATRAS[vowel] ?? "") + (anusvara ? "ª" : "©");
    if (nasal === "ँ") tail += "±";
  }
  return tail + (visarga ? "…" : "");
}

/** ीं and ैं have their own glyphs when nothing sits between the sign and the dot. */
const mergeNasals = (text: string) => text.replace(/r§/g, "t").replace(/¡§/g, "¢");

function encodeSyllable(text: string, start: number): [string, number] {
  const units: Unit[] = [];
  let at = start;
  for (;;) {
    const unit = { consonant: text[at], nukta: text[at + 1] === NUKTA };
    units.push(unit);
    at += unit.nukta ? 2 : 1;
    if (text[at] === VIRAMA && IS_CONSONANT.test(text[at + 1] ?? "")) at++;
    else break;
  }
  const dead = text[at] === VIRAMA;
  if (dead) at++;
  const reph = units.length > 1 && units[0].consonant === "र" && !units[0].nukta;
  if (reph) units.shift();

  let vowel = "";
  if (!dead && (MATRAS[text[at]] !== undefined || text[at] === "ि")) vowel = text[at++];
  const nasal = NASALS[text[at]] ? text[at++] : "";
  const visarga = text[at] === "ः";
  if (visarga) at++;

  let tokens: Token[];
  const whole = units.length === 1 && !units[0].nukta ? WITH_VOWEL[units[0].consonant + vowel] : undefined;
  if (whole) {
    tokens = [{ glyph: whole, sign: "" }];
    vowel = "";
  } else tokens = clusterTokens(units, dead);

  const last = tokens.length - 1;
  const body = tokens.map((token, i) => withHook(token.glyph, i === last ? token.sign + syllableTail(vowel, nasal, reph, visarga) : token.sign)).join("");
  const shortI = vowel === "ि" ? (tokens.length === 1 ? "{" : "p") : "";
  return [shortI + mergeNasals(body), at];
}

export function unicodeToShree(input: string): string {
  if (!input) return "";
  // Marathi eyelash ra: र्‍ (with ZWJ) is the same letter as ऱ्.
  const text = input.normalize("NFC").replace(/र्‍/g, "ऱ्").replace(/[​-‍﻿]/g, "");
  let out = "";
  let at = 0;
  while (at < text.length) {
    const char = text[at];
    if (IS_CONSONANT.test(char)) {
      const [syllable, next] = encodeSyllable(text, at);
      out += syllable;
      at = next;
      continue;
    }
    const vowel = VOWELS[char];
    if (vowel) {
      at++;
      let signs = "";
      if (text[at] === "ं" && char === "ई") {
        out += "Bª";
        at++;
        continue;
      }
      if (NASALS[text[at]]) signs += NASALS[text[at++]];
      if (text[at] === "ः") {
        signs += "…";
        at++;
      }
      out += withHook(vowel, signs);
      continue;
    }
    out += MATRAS[char] ?? NASALS[char] ?? SYMBOLS[char] ?? (char === "ि" ? "{" : char === NUKTA ? "" : char);
    at++;
  }
  return out;
}

// ---- Shree Lipi → Unicode

// Private-use placeholders for signs that must be moved after the table lookup.
const I_MARK = "";
const NUKTA_MARK = "";
const REPH_MARK = "";

const SHREE_TO_UNICODE = new Map<string, string>();
const learn = (shree: string, unicode: string) => {
  if (!SHREE_TO_UNICODE.has(shree)) SHREE_TO_UNICODE.set(shree, unicode);
};
for (const [unicode, glyph] of Object.entries({ ...LIGATURES, ...WITH_VOWEL })) learn(glyph.text, unicode);
for (const [consonant, half] of Object.entries(HALF)) learn(half, consonant + VIRAMA);
for (const [consonant, glyph] of Object.entries(FULL)) learn(glyph.text, consonant);
for (const [vowel, glyph] of Object.entries(VOWELS)) learn(glyph.text, vowel);
for (const [shree, unicode] of [
  // Vowel signs merged with the reph or anusvara.
  ["u", `ी${REPH_MARK}`], ["v", `ीं${REPH_MARK}`], ["}", `े${REPH_MARK}`], ["]", `ें${REPH_MARK}`], ["£", `ै${REPH_MARK}`], ["¤", `ैं${REPH_MARK}`],
  ["m}", `ो${REPH_MARK}`], ["m]", `ों${REPH_MARK}`], ["m£", `ौ${REPH_MARK}`], ["m¤", `ौं${REPH_MARK}`],
  ["ª", `ं${REPH_MARK}`], ["©", REPH_MARK], ["Bª", "ईं"], ["t", "ीं"], ["¢", "ैं"], ["|", "ें"],
  // ि before its cluster, nukta before its letter.
  ["{", I_MARK], ["p", I_MARK], ["[", I_MARK], ["q", `${I_MARK}ं`], ["µ", NUKTA_MARK], ["‹", NUKTA_MARK], ["˜", "ख़"], ["™", "ख़्"],
  // Alternate glyphs found in documents typed in the font.
  ["c", "ल"], ["û", "श्"], ["s", "ी"], ["x", "ु"], ["z", "ू"], ["þ", "ु"], ["ÿ", "ू"], ["¨", "ं"],
  ["«", "्र"], ["´", "्र"], ["—", "्र"], ["Œ", "्र"], ["®", "्रु"], ["¯", "्रू"], ["ç", "्य"], ["³", "्न"], ["‰", "्व"],
  ["‘", "ङ्क"], ["’", "ङ्ख"], ["“", "ङ्ग"], ["”", "ङ्घ"], ["•", "ह्न"], ["–", "ड्ढ"],
  ["\"", "‘"], ["'", "’"], ["&", "।"], ["@", "ऽ"], ["›", "ॐ"], ["…", "ः"], ["²", VIRAMA],
  ...Object.entries(MATRAS).map(([unicode, shree]) => [shree, unicode]),
  ...Object.entries(NASALS).map(([unicode, shree]) => [shree, unicode]),
  ..."०१२३४५६७८९".split("").map((digit, i) => [String(i), digit]),
] as [string, string][]) learn(shree, unicode);

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const SHREE_PATTERN = new RegExp([...SHREE_TO_UNICODE.keys()].sort((a, b) => b.length - a.length).map(escape).join("|"), "gu");

const CLUSTER = "(?:[क-ह]़?्)*[क-ह]़?";
const REPH_SKIPS = new Set([...Object.keys(MATRAS), "ि", "ं", "ँ", NUKTA]);

export function shreeToUnicode(input: string): string {
  if (!input) return "";
  // "$" and ">" are the hooks of round letters — purely visual.
  let text = input.replace(/[$>]/g, "").replace(SHREE_PATTERN, (match) => SHREE_TO_UNICODE.get(match) ?? match);

  text = text.replace(new RegExp(`${NUKTA_MARK}([क-ह])`, "gu"), `$1${NUKTA}`).replaceAll(NUKTA_MARK, "");
  // ि was typed before its cluster; Unicode puts it after.
  text = text.replace(new RegExp(`${I_MARK}(ं?)(${CLUSTER})`, "gu"), "$2ि$1").replaceAll(I_MARK, "ि");

  // The reph was typed after its syllable; Unicode puts र् before the cluster.
  let at = text.indexOf(REPH_MARK);
  while (at >= 0) {
    let start = at - 1;
    while (start > 0 && REPH_SKIPS.has(text[start])) start--;
    while (start >= 2 && text[start - 1] === VIRAMA) start -= text[start - 2] === NUKTA ? 3 : 2;
    text = start < 0 ? `र्${text.slice(at + 1)}` : `${text.slice(0, start)}र्${text.slice(start, at)}${text.slice(at + 1)}`;
    at = text.indexOf(REPH_MARK);
  }
  return text.normalize("NFC");
}
