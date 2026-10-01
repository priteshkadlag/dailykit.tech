import { describe, expect, it } from "vitest";
import { gujaratiLysToUnicode, lmgArunToUnicode, unicodeToGujaratiLys, unicodeToLmgArun } from "@/lib/font-converters/gujarati";

const WORDS = [
  "ગુજરાતી ભાષા", "વિદ્યાર્થી", "મહાત્મા ગાંધી", "રાષ્ટ્ર", "શિક્ષણ", "સ્વતંત્રતા", "અમદાવાદ", "કૃષ્ણ", "ધન્યવાદ", "ઉત્તર",
  "ઐતિહાસિક", "ઔષધ", "ઊંચું", "ઇંડું", "દ્વારા", "પદ્મ", "આત્મા", "મુદ્દો", "કર્મચારી", "દર્શન", "પૂર્વ", "સૂર્ય", "ચિત્ર", "વ્યક્તિ",
  "સ્ત્રી", "હ્રદય", "ટ્રેન", "ડૉક્ટર", "બૅંક", "કીર્તિ", "નિર્ણય", "ખેડૂત", "ઋષિ", "જ્ઞાન", "શ્રી", "ચિહ્ન", "બ્રહ્મ",
  "ભાષા", "દૃશ્ય", "રત્ન", "જીવન",
];

describe("LMG Arun ⇄ Unicode", () => {
  it.each([
    ["ગુજરાત", "U]HZFT"], ["કિંમત", "ÃSDT"], ["ધર્મ", "WD\""], ["કાર્ય", "SFI\""], ["પ્રેમ", "5=[D"], ["આભાર", "VFEFZ"],
    ["સ્તર", ":TZ"], ["ક્ષમા", "ÙDF"], ["શુદ્ધ", "X]â"], ["દ્વારા", "£FZF"], ["જાણ", "Ô6"], ["ઓમ", "VMD"], ["ઈશ્વર", ".xJZ"], ["ઇચ્છા", ">R|KF"],
    ["૧૨૩", "!r#"], ["રૂપ", "~5"], ["હૃદય", "ìNI"],
  ])("%s ⇄ %s", (unicode, lmg) => {
    expect(unicodeToLmgArun(unicode)).toBe(lmg);
    expect(lmgArunToUnicode(lmg)).toBe(unicode);
  });

  it("writes ASCII digits as Gujarati digits", () => {
    expect(unicodeToLmgArun("2024")).toBe("r_r$");
  });

  it("reads the glyphs shared by digits and letters by context", () => {
    expect(unicodeToLmgArun("૧૨૩૪૫")).toBe("!r#$5");
    expect(lmgArunToUnicode("!r#$5")).toBe("૧૨૩૪૫");
    expect(lmgArunToUnicode("5T")).toBe("પત");
    expect(lmgArunToUnicode("rT")).toBe("ય્ત");
  });

  it.each(WORDS)("round-trips %s", (text) => {
    const lmg = unicodeToLmgArun(text);
    expect(lmg).not.toMatch(/[઀-૿]/u);
    expect(lmgArunToUnicode(lmg)).toBe(text.normalize("NFC"));
  });
});

describe("Gujarati Lys ⇄ Unicode", () => {
  it.each([
    ["ગુજરાત", "U]HZFT"], ["ધર્મ", "WD\""], ["પ્રેમ", "5=[D"], ["ષ", "QF"], ["ભાષા", "EFQFF"], ["શુદ્ધ", "X]‚"], ["દ્વારા", "‰FZF"],
    ["જીવન", "“JG"], ["રત્ન", "ZÓ"], ["શ્વાસ", "ùF;"], ["ઔષધ", "V¡QFW"], ["દૃશ્ય", "œxI"], ["કીંમત", "SƒDT"],
  ])("%s ⇄ %s", (unicode, lys) => {
    expect(unicodeToGujaratiLys(unicode)).toBe(lys);
    expect(gujaratiLysToUnicode(lys)).toBe(unicode);
  });

  it("leaves ૅ and ૉ in Unicode: Lys has no chandra glyph", () => {
    expect(unicodeToGujaratiLys("બૅંક")).toBe(String.raw`Aૅ\S`);
  });

  it.each(WORDS.filter((word) => !/[ૅૉ]/u.test(word)))("round-trips %s", (text) => {
    const lys = unicodeToGujaratiLys(text);
    expect(lys).not.toMatch(/[઀-૿]/u);
    expect(gujaratiLysToUnicode(lys)).toBe(text.normalize("NFC"));
  });
});
