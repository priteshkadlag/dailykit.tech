import { describe, expect, it } from "vitest";
import { mlTtToUnicode, unicodeToMlTt } from "@/lib/font-converters/malayalam";

describe("ML-TT ⇄ Unicode", () => {
  it.each([
    ["കേരളം", "tIcfw"], ["മലയാളം", "aebmfw"], ["പുസ്തകം", "]pkvXIw"], ["കൂടം", "IqSw"],
    ["കൈ", "ssI"], ["കൊ", "sIm"], ["കോ", "tIm"], ["കൌ", "sIu"], ["പ്ര", "{]"], ["പ്രേ", "t{]"], ["പ്യ", "]y"], ["ക്ക", "¡"], ["അവൻ", "Ah³"],
  ])("%s ⇄ %s", (unicode, mltt) => {
    expect(unicodeToMlTt(unicode)).toBe(mltt);
    expect(mlTtToUnicode(mltt)).toBe(unicode);
  });

  it("writes old-style chillus (with a joiner) as chillu glyphs", () => {
    expect(unicodeToMlTt("അവന്‍")).toBe("Ah³");
  });

  it.each([
    "തിരുവനന്തപുരം", "കൊച്ചി", "വിദ്യാഭ്യാസം", "ഭാരതം", "സ്ത്രീ", "പ്രധാനമന്ത്രി", "ശ്രദ്ധ", "കൃഷി", "മഴ", "ഒന്ന്", "ഓണം", "ഐക്യം", "ഈശ്വരൻ",
    "ഉത്സവം", "ജ്ഞാനം", "സ്വന്തം", "കർഷകൻ", "പാൽ", "കൾ", "മണ്ണ്", "ക്ഷേത്രം", "ദൈവം", "പൊതു", "പ്രേമം", "വ്യക്തി",
  ])("round-trips %s", (text) => {
    const mltt = unicodeToMlTt(text);
    expect(mltt).not.toMatch(/[ഀ-ൿ]/u);
    expect(mlTtToUnicode(mltt)).toBe(text);
  });
});
