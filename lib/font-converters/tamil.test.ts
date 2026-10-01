import { describe, expect, it } from "vitest";
import { baminiToUnicode, shreeLipiTamilToUnicode, stmzhToUnicode, unicodeToBamini, unicodeToShreeLipiTamil, unicodeToStmzh } from "@/lib/font-converters/tamil";

const WORDS = [
  "தமிழ்", "வணக்கம்", "கொழும்பு", "கோயில்", "கௌரவம்", "பெண்", "பேச்சு", "கை", "இலங்கை", "ஆசிரியர்", "மூன்று", "சூரியன்", "ரூபாய்", "ழூ",
  "ஞாயிறு", "ஸ்ரீ", "ஜனநாயகம்", "ஷாப்பிங்", "ஹோட்டல்", "அஃது", "ஔவையார்", "ஊர்", "ஏழு", "ஐந்து", "ஓடு", "எட்டு", "உலகம்", "ஈழம்", "டீ", "டு",
];

describe("Bamini ⇄ Unicode", () => {
  const known: [string, string][] = [["தமிழ்", "jkpo;"], ["வணக்கம்", "tzf;fk;"], ["கொழும்பு", "nfhOk;G"], ["கோயில்", "Nfhapy;"], ["இலங்கை", ",yq;if"], ["சூரியன்", "#upad;"]];
  it.each(known)("%s ⇄ %s", (unicode, bamini) => {
    expect(unicodeToBamini(unicode)).toBe(bamini);
    expect(baminiToUnicode(bamini)).toBe(unicode);
  });
  it.each(WORDS)("round-trips %s", (word) => {
    expect(baminiToUnicode(unicodeToBamini(word))).toBe(word);
  });
  it("keeps punctuation readable", () => {
    expect(baminiToUnicode(unicodeToBamini("வணக்கம், நண்பா; சரி."))).toBe("வணக்கம், நண்பா; சரி.");
  });
});

describe("Shree Lipi Tamil ⇄ Unicode", () => {
  const known: [string, string][] = [["தமிழ்", "uªÌ"], ["கொழும்பு", "öPõÊ®¦"], ["கை", "øP"]];
  it.each(known)("%s ⇄ %s", (unicode, shree) => {
    expect(unicodeToShreeLipiTamil(unicode)).toBe(shree);
    expect(shreeLipiTamilToUnicode(shree)).toBe(unicode);
  });
  it.each(WORDS)("round-trips %s", (word) => {
    const legacy = unicodeToShreeLipiTamil(word);
    expect(legacy).not.toMatch(/[஀-௿]/u);
    expect(shreeLipiTamilToUnicode(legacy)).toBe(word);
  });
});

describe("STMZH ⇄ Unicode", () => {
  const pua = (...bytes: number[]) => String.fromCharCode(...bytes.map((b) => 0xf000 + b));

  it.each([
    ["தமிழ்", pua(0x3e, 0x74, 0xb5)], ["கொ", pua(0xd8, 0xef, 0x56)], ["கோ", pua(0xbc, 0xef, 0x56)], ["கௌ", pua(0xd8, 0xef, 0xe1)],
    ["கை", pua(0xe7, 0xef)], ["ஷ", pua(0xad)], ["ஸ்ரீ", pua(0x70)], ["க்ஷ", pua(0xb3)], ["ஈ", pua(0x7e)], ["2024", pua(0x32, 0x30, 0x32, 0x34)],
  ])("%s", (unicode, stmzh) => {
    expect(unicodeToStmzh(unicode)).toBe(stmzh);
    expect(stmzhToUnicode(stmzh)).toBe(unicode.normalize("NFC"));
  });

  it("reads STMZH text pasted as plain characters", () => {
    expect(stmzhToUnicode(">t" + String.fromCharCode(0xb5))).toBe("தமிழ்");
    expect(stmzhToUnicode(String.fromCharCode(0xad))).toBe("ஷ");
  });

  it.each(["தமிழ்நாடு அரசு", "வணக்கம்", "திருக்குறள்", "கௌரவம்", "பொங்கல்", "ஜனநாயகம்", "ஹிந்தி", "ஷேக்ஸ்பியர்", "ஐந்து", "ஓம்", "எஃகு", "ஸ்ரீ ராம்"])(
    "round-trips %s",
    (text) => {
      const stmzh = unicodeToStmzh(text);
      expect(stmzh).not.toMatch(/[஀-௿]/u);
      expect(stmzhToUnicode(stmzh)).toBe(text.normalize("NFC"));
    },
  );
});
