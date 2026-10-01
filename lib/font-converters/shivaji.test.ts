import { describe, expect, it } from "vitest";
import { shivajiToUnicode, unicodeToShivaji } from "@/lib/font-converters/shivaji";

describe("Shivaji ⇄ Unicode", () => {
  it.each([
    ["मराठी", "marazI"], ["गणपती", "gaNaptI"], ["किल्ला", "ik;a"], ["धर्म", "Qama-"], ["प्रेम", "p`oma"], ["द्रव", "d/va"], ["ह्या", "(a"],
    ["आई", "Aaš"], ["ओम", "Aaoma"], ["सौंदर्य", "saaOMdya-"], ["स्वराज्य", "svarajya"], ["क्षमा", "xamaa"], ["१२३", "123"], ["रुपया", "Épyaa"],
  ])("%s ⇄ %s", (unicode, shivaji) => {
    expect(unicodeToShivaji(unicode)).toBe(shivaji);
    expect(shivajiToUnicode(shivaji)).toBe(unicode.normalize("NFC"));
  });

  it.each([
    "महाराष्ट्र राज्य", "छत्रपती शिवाजी महाराज", "विद्यार्थी", "शिक्षण", "पुणे", "मुंबई", "कृपया", "उत्तर", "ऋषी", "ऐतिहासिक", "औषध", "ऊस", "इमारत",
    "ज्ञानेश्वर", "श्री गणेश", "कर्तव्य", "पद्धत", "द्वार", "ट्रक", "भाऊ", "झाड", "थंड", "बँक", "डॉक्टर", "ळ", "पळा", "संघर्ष", "स्त्री", "पत्र", "आम्ही",
  ])("round-trips %s", (text) => {
    const shivaji = unicodeToShivaji(text);
    expect(shivaji).not.toMatch(/[ऀ-ॿ]/u);
    expect(shivajiToUnicode(shivaji)).toBe(text.normalize("NFC"));
  });
});
