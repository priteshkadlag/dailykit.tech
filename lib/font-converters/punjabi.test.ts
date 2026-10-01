import { describe, expect, it } from "vitest";
import { anmolLipiToUnicode, unicodeToAnmolLipi } from "@/lib/font-converters/punjabi";

describe("Anmol Lipi ⇄ Unicode", () => {
  it.each([
    ["ਪੰਜਾਬੀ", "pMjwbI"], ["ਗੁਰਸਿਖ", "gurisK"], ["ਆਇ", "Awie"], ["ਪਿਆਰੇ", "ipAwry"], ["ਪ੍ਰੀਤ", "pRIq"], ["ਕ੍ਰਿਪਾ", "ikRpw"],
    ["ਸ਼ੇਰ", "Syr"], ["ਪੜ੍ਹਾਈ", "pVHweI"], ["ਗੁਰੂ", "gurU"], ["ਮਾਂ", "mW"], ["ਪੱਕਾ", "p`kw"], ["॥", "]"], ["੧੨੩", "ñòó"],
  ])("%s ⇄ %s", (unicode, anmol) => {
    expect(unicodeToAnmolLipi(unicode)).toBe(anmol);
    expect(anmolLipiToUnicode(anmol)).toBe(unicode.normalize("NFC"));
  });

  it("uses the lower ੁ glyph under a subjoined letter", () => {
    expect(unicodeToAnmolLipi("ਪ੍ਰੁ")).toBe("pRü");
    expect(anmolLipiToUnicode("pRü")).toBe("ਪ੍ਰੁ");
  });

  it.each([
    "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ", "ਪੰਜਾਬ ਸਰਕਾਰ", "ਵਿਦਿਆਰਥੀ", "ਉਹ", "ਊਠ", "ਏਕਤਾ", "ਐਨਕ", "ਓਟ", "ਔਰਤ", "ਈਸ਼ਵਰ", "ਖ਼ਬਰ", "ਜ਼ਮੀਨ", "ਫ਼ੌਜ", "ਗ਼ਰੀਬ", "ਲ਼",
    "ਸੱਚ", "ਚੰਗਾ", "ਨੂੰ", "ਦੁੱਧ", "ਸ੍ਵੈ", "ਪ੍ਰਧਾਨ ਮੰਤਰੀ", "ੴ", "ਸਿੱਖਿਆ", "ਕ੍ਰਿਸ਼ਨ",
  ])("round-trips %s", (text) => {
    const anmol = unicodeToAnmolLipi(text);
    expect(anmol).not.toMatch(/[਀-੿]/u);
    expect(anmolLipiToUnicode(anmol)).toBe(text.normalize("NFC"));
  });
});
