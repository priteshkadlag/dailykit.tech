import { describe, expect, it } from "vitest";
import { nudiToUnicode, unicodeToNudi } from "@/lib/font-converters/kannada";

describe("Nudi ⇄ Unicode", () => {
  it.each([
    ["PÀ", "ಕ"], ["PÉ", "ಕೆ"], ["QÃ", "ಕೀ"], ["PÉÆÃ", "ಕೋ"], ["ªÀÄÄ", "ಮು"], ["CA", "ಅಂ"], ["Pï", "ಕ್"],
    ["PÀÌ", "ಕ್ಕ"], ["¥Áæ", "ಪ್ರಾ"], ["gÁµÀÖç", "ರಾಷ್ಟ್ರ"], ["¹ÛçÃAiÀÄgÀÄ", "ಸ್ತ್ರೀಯರು"], ["n¥ÀàtÂ", "ಟಿಪ್ಪಣಿ"], ["AiÀÄð", "ರ್ಯ"],
  ])("reads %s as %s", (nudi, unicode) => {
    expect(nudiToUnicode(nudi)).toBe(unicode);
  });

  it("keeps the joiner only after ರ", () => {
    expect(nudiToUnicode("gÀå")).toBe("ರ‍್ಯ");
    expect(nudiToUnicode("±À¸ÁÛç¸ÀÛçªÀ£ÀÄß")).toBe("ಶಸ್ತ್ರಾಸ್ತ್ರವನ್ನು");
  });

  it.each([
    "ಕನ್ನಡ", "ಬೆಂಗಳೂರು", "ಕರ್ನಾಟಕ", "ಸರ್ಕಾರ", "ಕಾರ್ಯಕ್ರಮ", "ರಾಷ್ಟ್ರೀಯ", "ವಿದ್ಯಾರ್ಥಿ", "ಶಿಕ್ಷಣ", "ಪ್ರಜಾಪ್ರಭುತ್ವ", "ಮುದ್ರಿಸುತ್ತಿರುವುದು",
    "ಸ್ತ್ರೀ", "ಕೃಷಿ", "ಹೊಸ", "ಮೋದಿ", "ಕೈ", "ಗೌರವ", "ಇಂಗ್ಲಿಷ್", "ಅಜಯ್", "ಸಿದ್ದರಾಮಯ್ಯ", "ಲಕ್ಷ್ಮೀ", "ಆಟ", "ಊರು", "ಎಲ್ಲಿ", "ಒಂದು", "ಔಷಧ",
  ])("round-trips %s", (text) => {
    const nudi = unicodeToNudi(text);
    expect(nudi).not.toMatch(/[ಀ-೿]/u);
    expect(nudiToUnicode(nudi)).toBe(text);
  });
});
