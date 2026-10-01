import { describe, expect, it } from "vitest";
import {
  chanakyaToUnicode, gandhiToUnicode, shushaToUnicode, surekhToUnicode,
  unicodeToChanakya, unicodeToGandhi, unicodeToShusha, unicodeToSurekh,
} from "@/lib/font-converters/legacy-devanagari";

/** Words covering ि before clusters, the reph, conjuncts, nasals and vowel letters. */
const WORDS = [
  "भारत", "राजधानी", "नई", "दिल्ली", "है।", "धर्म", "पूर्ण", "स्थिति", "कीर्ति", "विद्यार्थी", "उत्तर", "प्रदेश", "हिन्दी",
  "प्रिय", "कार्यों", "शक्ति", "कृपया", "द्वारा", "हृदय", "चौथा", "पुस्तकें", "श्रीमान", "त्रिशूल", "क्षत्रिय", "ज्ञान",
  "महाराष्ट्र", "मराठी", "भाषा", "आणि", "आहे", "संस्कृती", "निर्मिती", "वर्षांच्या", "अंतर्मनातील", "परिश्रम", "चक्रव्यूह",
  "अद्भुत", "सत्य", "ऊपर", "ऐसा", "औरत", "ओम", "इमली", "ईश्वर", "उमंग", "ऋषि", "एक", "आँख", "हँसना", "गाँव",
  "कुंभ", "फूल", "कौन", "पैसा", "मौसम", "गुरु", "रूप", "दृश्य", "ट्रक", "डॉक्टर", "सिंह", "किंतु",
];
const SENTENCE = "भारत की राजधानी नई दिल्ली है। मराठी भाषा, महाराष्ट्राची राजभाषा आहे.";

const fonts = [
  ["Chanakya", unicodeToChanakya, chanakyaToUnicode],
  ["4CGandhi", unicodeToGandhi, gandhiToUnicode],
  ["Shusha", unicodeToShusha, shushaToUnicode],
  ["DV-TT Surekh", unicodeToSurekh, surekhToUnicode],
] as const;

describe.each(fonts)("%s", (_, toLegacy, toUnicode) => {
  it.each(WORDS)("round-trips %s", (word) => {
    const legacy = toLegacy(word);
    expect(legacy).not.toMatch(/[ऀ-ॿ]/u);
    expect(toUnicode(legacy)).toBe(word.normalize("NFC"));
  });
  it("round-trips a sentence", () => {
    expect(toUnicode(toLegacy(SENTENCE))).toBe(SENTENCE);
  });
});
