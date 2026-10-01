import { describe, expect, it } from "vitest";
import { kantipurToUnicode, preetiToUnicode, unicodeToKantipur, unicodeToPreeti } from "@/lib/font-converters/nepali";

describe("Preeti ⇄ Unicode", () => {
  const known: [string, string][] = [
    ["नेपाल", "g]kfn"],
    ["हिमाल", "lxdfn"],
    ["गर्ने", "ug]{"],
    ["ईश्वर", "O{Zj/"],
    ["आफ्नो", "cfKmgf]"],
    ["प्रदेश", "k|b]z"],
    ["क्षेत्र", "If]q"],
    ["मद्दत", "d2t"],
    ["ट्रेक", "6«]s"],
    ["१२३", "!@#"],
  ];
  it.each(known)("%s ⇄ %s", (unicode, preeti) => {
    expect(unicodeToPreeti(unicode)).toBe(preeti);
    expect(preetiToUnicode(preeti)).toBe(unicode);
  });

  it.each([
    ["ug{]", "गर्ने"], ["k|mfO{", "फ्राई"], ["e]mNg'", "झेल्नु"], ["hfpFm", "जाऊँ"], ["qm'/", "क्रुर"], ["k¥of]", "पर्‍यो"], ["ad]flhd", "बमोजिम"], ["k|:'tt", "प्रस्तुत"],
  ])("reads the alternative spelling %s", (preeti, unicode) => {
    expect(preetiToUnicode(preeti)).toBe(unicode);
  });

  it.each(["नेपाली भाषा", "राष्ट्रिय", "विशेषण", "प्रतिक्रिया", "स्याफ्रुबेशी", "हेर्थ्यो", "चन्द्रोदय", "ऋषि", "ऐना", "ओखती", "जाऔं", "घरमैं", "क्षेत्रपाटी", "बेमौसमी", "पर्‍यो", "काठमाडौं।"])("round-trips %s", (text) => {
    expect(preetiToUnicode(unicodeToPreeti(text))).toBe(text);
    expect(kantipurToUnicode(unicodeToKantipur(text))).toBe(text);
  });
});

describe("Kantipur", () => {
  it("reads F as ा and “ as ँ", () => {
    expect(kantipurToUnicode("sFd")).toBe("काम");
    expect(kantipurToUnicode("hfp“m")).toBe("जाऊँ");
    expect(unicodeToKantipur("जाऊँ")).toBe("hfpm“");
  });
});
