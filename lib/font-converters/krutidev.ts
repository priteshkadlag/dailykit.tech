/**
 * Kruti Dev 010 ⇄ Unicode (Hindi / Marathi Devanagari).
 *
 * Kruti Dev is a font-based encoding: text is stored as ASCII / Latin-1 and the
 * font draws each byte as a Devanagari glyph. DevLys 010 uses the same byte
 * layout, so it shares these tables.
 *
 * The Kruti → Unicode table and reordering steps follow the widely used
 * public-domain Rajbhasha algorithm as packaged in @bharattype/hindi-transliteration
 * (MIT, © bharattype), with its duplicate entries removed. Order matters: longer
 * sequences must be replaced before the shorter ones they contain.
 */

const KRUTI_TO_UNICODE: [string, string][] = [
  ["ñ", "॰"], ["Q+Z", "QZ+"], ["sas", "sa"], ["aa", "a"], [")Z", "र्द्ध"], ["ZZ", "Z"],
  ["‘", "\""], ["’", "\""], ["“", "'"], ["”", "'"],
  ["å", "०"], ["ƒ", "१"], ["„", "२"], ["…", "३"], ["†", "४"], ["‡", "५"], ["ˆ", "६"], ["‰", "७"], ["Š", "८"], ["‹", "९"],
  ["¶+", "फ़्"], ["d+", "क़"], ["[+k", "ख़"], ["[+", "ख़्"], ["x+", "ग़"], ["T+", "ज़्"], ["t+", "ज़"], ["M+", "ड़"], ["<+", "ढ़"], ["Q+", "फ़"], [";+", "य़"], ["j+", "ऱ"], ["u+", "ऩ"],
  ["Ùk", "त्त"], ["Ù", "त्त्"], ["ä", "क्त"], ["–", "दृ"], ["—", "कृ"], ["é", "न्न"], ["™", "न्न्"], ["=kk", "=k"], ["f=k", "f="],
  ["à", "ह्न"], ["á", "ह्य"], ["â", "हृ"], ["ã", "ह्म"], ["ºz", "ह्र"], ["º", "ह्"], ["í", "द्द"], ["{k", "क्ष"], ["{", "क्ष्"], ["=", "त्र"], ["«", "त्र्"],
  ["Nî", "छ्य"], ["Vî", "ट्य"], ["Bî", "ठ्य"], ["Mî", "ड्य"], ["<î", "ढ्य"], ["|", "द्य"], ["K", "ज्ञ"], ["}", "द्व"], ["J", "श्र"],
  ["Vª", "ट्र"], ["Mª", "ड्र"], ["<ªª", "ढ्र"], ["Nª", "छ्र"], ["Ø", "क्र"], ["Ý", "फ्र"], ["nzZ", "र्द्र"], ["æ", "द्र"], ["ç", "प्र"], ["Á", "प्र"], ["xz", "ग्र"], ["#", "रु"], [":", "रू"],
  ["v‚", "ऑ"], ["vks", "ओ"], ["vkS", "औ"], ["vk", "आ"], ["v", "अ"], ["b±", "ईं"], ["Ã", "ई"], ["bZ", "ई"], ["b", "इ"], ["m", "उ"], ["Å", "ऊ"], [",s", "ऐ"], [",", "ए"], ["_", "ऋ"],
  ["ô", "क्क"], ["d", "क"], ["Dk", "क"], ["D", "क्"], ["[k", "ख"], ["[", "ख्"], ["x", "ग"], ["Xk", "ग"], ["X", "ग्"], ["Ä", "घ"], ["?k", "घ"], ["?", "घ्"], ["³", "ङ"],
  ["pkS", "चौ"], ["p", "च"], ["Pk", "च"], ["P", "च्"], ["N", "छ"], ["t", "ज"], ["Tk", "ज"], ["T", "ज्"], [">", "झ"], ["÷", "झ्"], ["¥", "ञ"],
  ["ê", "ट्ट"], ["ë", "ट्ठ"], ["V", "ट"], ["B", "ठ"], ["ì", "ड्ड"], ["ï", "ड्ढ"], ["M", "ड"], ["<", "ढ"], [".k", "ण"], [".", "ण्"],
  ["r", "त"], ["Rk", "त"], ["R", "त्"], ["Fk", "थ"], ["F", "थ्"], [")", "द्ध"], ["n", "द"], ["/k", "ध"], ["èk", "ध"], ["/", "ध्"], ["Ë", "ध्"], ["è", "ध्"],
  ["u", "न"], ["Uk", "न"], ["U", "न्"], ["i", "प"], ["Ik", "प"], ["I", "प्"], ["Q", "फ"], ["¶", "फ्"], ["c", "ब"], ["Ck", "ब"], ["C", "ब्"], ["Hk", "भ"], ["H", "भ्"], ["e", "म"], ["Ek", "म"], ["E", "म्"],
  [";", "य"], ["¸", "य्"], ["j", "र"], ["y", "ल"], ["Yk", "ल"], ["Y", "ल्"], ["G", "ळ"], ["o", "व"], ["Ok", "व"], ["O", "व्"],
  ["'k", "श"], ["'", "श्"], ["\"k", "ष"], ["\"", "ष्"], ["l", "स"], ["Lk", "स"], ["L", "स्"], ["g", "ह"],
  ["È", "ीं"], ["z", "्र"], ["Ì", "द्द"], ["Í", "ट्ट"], ["Î", "ट्ठ"], ["Ï", "ड्ड"], ["Ñ", "कृ"], ["Ò", "भ"], ["Ó", "्य"], ["Ô", "ड्ढ"], ["Ö", "झ्"], ["Ük", "श"], ["Ü", "श्"],
  ["‚", "ॉ"], ["ks", "ो"], ["kS", "ौ"], ["k", "ा"], ["h", "ी"], ["q", "ु"], ["w", "ू"], ["`", "ृ"], ["s", "े"], ["S", "ै"], ["a", "ं"], ["¡", "ँ"], ["%", "ः"], ["W", "ॅ"],
  ["•", "ऽ"], ["·", "ऽ"], ["∙", "ऽ"], ["~j", "्र"], ["~", "्"], ["\\", "?"], ["+", "़"], [" ः", ":"],
  ["^", "‘"], ["*", "’"], ["Þ", "“"], ["ß", "”"], ["(", ";"], ["¼", "("], ["½", ")"], ["¿", "{"], ["À", "}"], ["¾", "="],
  ["A", "।"], ["-", "."], ["&", "-"], ["Œ", "॰"], ["]", ","], ["@", "/"],
];

/** Unicode → Kruti Dev, in replacement order (punctuation first so later steps can't re-map it). */
const UNICODE_TO_KRUTI: [string, string][] = [
  ["‘", "^"], ["’", "*"], ["“", "Þ"], ["”", "ß"], ["'", "^"], ["\"", "Þ"], ["(", "¼"], [")", "½"], ["{", "¿"], ["}", "À"], ["=", "¾"],
  ["।", "A"], ["?", "\\"], ["-", "&"], ["॰", "Œ"], [",", "]"], [".", "-"], ["/", "@"], [";", "("], [":", "%"],
  ["०", "å"], ["१", "ƒ"], ["२", "„"], ["३", "…"], ["४", "†"], ["५", "‡"], ["६", "ˆ"], ["७", "‰"], ["८", "Š"], ["९", "‹"],
  ["फ़्", "¶+"], ["क़", "d+"], ["ख़", "[+k"], ["ग़", "x+"], ["ज़्", "T+"], ["ज़", "t+"], ["ड़", "M+"], ["ढ़", "<+"], ["फ़", "Q+"], ["य़", ";+"], ["ऱ", "j+"], ["ऩ", "u+"],
  ["त्त्", "Ù"], ["त्त", "Ùk"], ["क्त", "ä"], ["दृ", "–"], ["कृ", "—"], ["न्न्", "™"], ["न्न", "é"],
  ["ह्न", "à"], ["ह्य", "á"], ["हृ", "â"], ["ह्म", "ã"], ["ह्र", "ºz"], ["ह्", "º"], ["द्द", "í"], ["क्ष्", "{"], ["क्ष", "{k"], ["त्र्", "«"], ["त्र", "="], ["ज्ञ", "K"],
  ["छ्य", "Nî"], ["ट्य", "Vî"], ["ठ्य", "Bî"], ["ड्य", "Mî"], ["ढ्य", "<î"], ["द्य", "|"], ["द्व", "}"],
  ["श्र", "J"], ["ट्र", "Vª"], ["ड्र", "Mª"], ["ढ्र", "<ªª"], ["छ्र", "Nª"], ["क्र", "Ø"], ["फ्र", "Ý"], ["द्र", "æ"], ["प्र", "ç"], ["ग्र", "xz"], ["रु", "#"], ["रू", ":"],
  ["्र", "z"],
  ["ऑ", "v‚"], ["ओ", "vks"], ["औ", "vkS"], ["आ", "vk"], ["अ", "v"], ["ईं", "b±"], ["ई", "bZ"], ["इ", "b"], ["उ", "m"], ["ऊ", "Å"], ["ऐ", ",s"], ["ए", ","], ["ऋ", "_"],
  ["क्क", "ô"], ["क्", "D"], ["क", "d"], ["ख्", "["], ["ख", "[k"], ["ग्", "X"], ["ग", "x"], ["घ्", "?"], ["घ", "?k"], ["ङ", "³"],
  ["चौ", "pkS"], ["च्", "P"], ["च", "p"], ["छ", "N"], ["ज्", "T"], ["ज", "t"], ["झ्", "÷"], ["झ", ">"], ["ञ", "¥"],
  ["ट्ट", "ê"], ["ट्ठ", "ë"], ["ट", "V"], ["ठ", "B"], ["ड्ड", "ì"], ["ड्ढ", "ï"], ["ड", "M"], ["ढ", "<"], ["ण्", "."], ["ण", ".k"],
  ["त्", "R"], ["त", "r"], ["थ्", "F"], ["थ", "Fk"], ["द्ध", ")"], ["द", "n"], ["ध्", "/"], ["ध", "/k"], ["न्", "U"], ["न", "u"],
  ["प्", "I"], ["प", "i"], ["फ्", "¶"], ["फ", "Q"], ["ब्", "C"], ["ब", "c"], ["भ्", "H"], ["भ", "Hk"], ["म्", "E"], ["म", "e"],
  ["य्", "¸"], ["य", ";"], ["र", "j"], ["ल्", "Y"], ["ल", "y"], ["ळ", "G"], ["व्", "O"], ["व", "o"],
  ["श्", "'"], ["श", "'k"], ["ष्", "\""], ["ष", "\"k"], ["स्", "L"], ["स", "l"], ["ह", "g"],
  ["ॉ", "‚"], ["ो", "ks"], ["ौ", "kS"], ["ा", "k"], ["ी", "h"], ["ु", "q"], ["ू", "w"], ["ृ", "`"], ["े", "s"], ["ै", "S"],
  ["ं", "a"], ["ँ", "¡"], ["ः", "%"], ["ॅ", "W"], ["ऽ", "·"], ["़", "+"], ["्", "~"],
].map(([unicode, kruti]) => [unicode.normalize("NFC"), kruti]);

const replaceAll = (text: string, table: [string, string][]) => table.reduce((out, [from, to]) => out.split(from).join(to), text);

const CONSONANT = /[क-हक़-य़]/;
/** Dependent vowel signs and marks that sit on a syllable (the reph goes after them). */
const MATRAS = new Set(["ा", "ि", "ी", "ु", "ू", "ृ", "े", "ै", "ो", "ौ", "ॉ", "ॅ", "़"]);
const NASALS = new Set(["ं", "ँ"]);

export function krutiToUnicode(input: string): string {
  if (!input) return "";
  let text = replaceAll(input, KRUTI_TO_UNICODE);
  text = text.split("±").join("Zं").split("Æ").join("र्f");

  // "f" (short i) is typed before its consonant in Kruti; Unicode puts ि after it.
  text = text.split("Ç").join("fa").split("É").join("र्fa");
  text = text.replace(/fa([\s\S]़?)/gu, "$1िं").replace(/f([\s\S]़?)/gu, "$1ि");
  text = text.split("Ê").join("ीZ");
  // ि landed after a half consonant: move it past the rest of the cluster.
  for (let guard = 0; guard < 8 && /ि्./u.test(text); guard++) text = text.replace(/ि्(.)/gu, "्$1ि");

  // "Z" (reph) is typed after its syllable; Unicode puts र् before the cluster.
  let at = text.indexOf("Z");
  while (at > 0) {
    let start = at - 1;
    while (start > 0 && (MATRAS.has(text[start]) || NASALS.has(text[start]))) start--;
    while (start >= 2 && text[start - 1] === "्") start -= 2;
    text = `${text.slice(0, start)}र्${text.slice(start, at)}${text.slice(at + 1)}`;
    at = text.indexOf("Z");
  }
  return text.replace(/Z/g, "").replace(/[​-‍﻿]/g, "").normalize("NFC");
}

/** Length of the consonant cluster (C, C्C, C्C्C… with nuktas) starting at `from`. */
function clusterEnd(text: string, from: number) {
  let end = from;
  if (!CONSONANT.test(text[end] ?? "")) return from;
  end++;
  if (text[end] === "़") end++;
  while (text[end] === "्" && CONSONANT.test(text[end + 1] ?? "")) {
    end += 2;
    if (text[end] === "़") end++;
  }
  return end;
}

export function unicodeToKruti(input: string): string {
  if (!input) return "";
  let text = input.normalize("NFC").replace(/[​-‍﻿]/g, "");

  // Reph: र् before a consonant is written as "Z" after the syllable and its vowel signs.
  let out = "";
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "र" && text[i + 1] === "्" && CONSONANT.test(text[i + 2] ?? "") && text[i - 1] !== "्") {
      let end = clusterEnd(text, i + 2);
      while (MATRAS.has(text[end] ?? "")) end++;
      out += `${text.slice(i + 2, end)}Z`;
      i = end - 1;
    } else out += text[i];
  }
  text = out;

  // Short i: ि is typed as "f" before the whole consonant cluster.
  out = "";
  for (let i = 0; i < text.length; i++) {
    const end = clusterEnd(text, i);
    if (end > i && text[end] === "ि") {
      out += `ि${text.slice(i, end)}`;
      i = end;
    } else out += text[i];
  }
  text = out.replace(/ि/g, "f");

  return replaceAll(text, UNICODE_TO_KRUTI);
}
