import { describe, expect, it } from "vitest";
import { convertText, engines } from "@/lib/font-converters/engines";
import { ukToUs, usToUk } from "@/lib/font-converters/english";
import { krutiToUnicode, unicodeToKruti } from "@/lib/font-converters/krutidev";
import { fontConverters, liveFontConverters } from "@/lib/font-converters/registry";
import { devanagariToRoman, romanToDevanagari } from "@/lib/font-converters/roman";
import { shreeToUnicode, unicodeToShree } from "@/lib/font-converters/shree-lipi";
import { getFontConvertersByGroup, tools } from "@/lib/tools";

describe("Kruti Dev ⇄ Unicode", () => {
  // Standard Kruti Dev 010 spellings.
  const known: [string, string][] = [
    ["भारत की राजधानी नई दिल्ली है।", "Hkkjr dh jkt/kkuh ubZ fnYyh gSA"],
    ["धर्म", "/keZ"],
    ["पूर्ण", "iw.kZ"],
    ["स्थिति", "fLFkfr"],
    ["कीर्ति", "dhfrZ"],
    ["विद्यार्थी", "fo|kFkhZ"],
    ["उत्तर प्रदेश", "mÙkj çns'k"],
    ["हिन्दी", "fgUnh"],
  ];
  it.each(known)("%s ⇄ %s", (unicode, kruti) => {
    expect(unicodeToKruti(unicode)).toBe(kruti);
    expect(krutiToUnicode(kruti)).toBe(unicode);
  });

  it.each(["प्रिय", "कार्यों", "अर्थात्", "ज़िंदगी", "क्षत्रिय", "श्रीमान", "त्रिशूल", "महाराष्ट्र", "शक्ति", "कृपया", "ट्रेन", "द्वारा", "हृदय", "ब्राह्मण", "चौथा", "पुस्तकें", "१२३", "मराठी भाषा, महाराष्ट्राची राजभाषा आहे."])("round-trips %s", (text) => {
    expect(krutiToUnicode(unicodeToKruti(text))).toBe(text.normalize("NFC"));
  });
});

describe("Shree Lipi ⇄ Unicode", () => {
  // Marathi sentences with their Shree-Dev-0714 spellings.
  const known: [string, string][] = [
    ["शांत निळ्या आकाशाखाली, एकाकी वृक्षाच्या सान्निध्यात, तिला एका गहन आणि अवर्णनीय आंतरिक शांततेचा अनुभव आला, जो शब्दांच्या पलीकडील होता.", "em§V {Zù`m AmH$memImbr, EH$mH$r d¥jmÀ`m gm{ÞÜ`mV, {Vbm EH$m JhZ Am{U AdU©Zr` Am§V{aH$ em§VVoMm AZw^d Ambm, Omo eãXm§À`m nbrH$S>rb hmoVm."],
    ["पुराणकालीन कथांमधील गूढ रहस्यांप्रमाणे, ह्या घटनेच्या मुळाशी दडलेले सत्य अजूनही एका जाड धुक्याच्या पडद्याआड लपलेले आहे.", "nwamUH$mbrZ H$Wm§_Yrb JyT> ahñ`m§à_mUo, øm KQ>ZoÀ`m _wimer XS>bobo gË` AOyZhr EH$m OmS> YwŠ`mÀ`m nS>ÚmAmS> bnbobo Amho."],
    ["जटिल परिस्थितीतून मार्ग काढताना, तिने आपल्या अंतर्मनातील दृढ निश्चयाचा आणि अनुभवांच्या समृद्ध ज्ञानाचा कुशलतापूर्वक उपयोग केला.", "O{Q>b n{apñWVrVyZ _mJ© H$mT>VmZm, {VZo Amnë`m A§V_©ZmVrb ÑT> {Zü`mMm Am{U AZw^dm§À`m g_¥Õ kmZmMm Hw$ebVmnyd©H$ Cn`moJ Ho$bm."],
    ["दूर डोंगरावरच्या घनदाट अरण्यात, वन्य जीवांच्या अनाकलनीय आवाजांनी आणि प्राचीन वृक्षांच्या सावल्यांनी एका रहस्यमय वातावरणाची निर्मिती केली होती.", "Xya S>mo§JamdaÀ`m KZXmQ> AaÊ`mV, dÝ` Ordm§À`m AZmH$bZr` AmdmOm§Zr Am{U àmMrZ d¥jm§À`m gmdë`m§Zr EH$m ahñ`_` dmVmdaUmMr {Z{_©Vr Ho$br hmoVr."],
    ["सामाजिक बदलांच्या वादळात, काही मूल्ये आणि परंपरा काळाच्या कसोटीवर टिकून राहतात, तर काही नविन विचारांच्या प्रवाहामध्ये विलीन होऊन जातात.", "gm_m{OH$ ~Xbm§À`m dmXimV, H$mhr _yë`o Am{U na§nam H$mimÀ`m H$gmoQ>rda {Q>Hy$Z amhVmV, Va H$mhr Z{dZ {dMmam§À`m àdmhm_Ü`o {dbrZ hmoD$Z OmVmV."],
    ["अनेक वर्षांच्या कठोर परिश्रमानंतर, त्याला जीवनाच्या गुंतागुंतीचा अर्थ हळू हळू उलगडत गेला, आणि त्याने शांती आणि समाधानाचा मार्ग शोधला.", "AZoH$ dfmªÀ`m H$R>moa n{al_mZ§Va, Ë`mbm OrdZmÀ`m Jw§VmJw§VrMm AW© hiy hiy CbJS>V Jobm, Am{U Ë`mZo em§Vr Am{U g_mYmZmMm _mJ© emoYbm."],
    ["राजकीय डावपेचांच्या चक्रव्यूहात, सामान्य माणसाचे हित आणि कल्याण अनेकदा दुर्लक्षित होऊन सत्तेच्या खेळात हरवून जाते.", "amOH$r` S>mdnoMm§À`m MH«$ì`yhmV, gm_mÝ` _mUgmMo {hV Am{U H$ë`mU AZoH$Xm Xwb©{jV hmoD$Z gÎmoÀ`m IoimV hadyZ OmVo."],
    ["कला आणि साहित्याच्या माध्यमातून, मानवी संस्कृती आपल्या भूतकाळातील अनुभवांना जपते आणि भविष्याच्या दिशेने एक अर्थपूर्ण आणि समृद्ध वाटचाल करते.", "H$bm Am{U gm{hË`mÀ`m _mÜ`_mVyZ, _mZdr g§ñH¥$Vr Amnë`m ^yVH$mimVrb AZw^dm§Zm OnVo Am{U ^{dî`mÀ`m {XeoZo EH$ AW©nyU© Am{U g_¥Õ dmQ>Mmb H$aVo."],
    ["आजच्या गतिमान जगात, तंत्रज्ञानाच्या अद्भुत प्रगतीमुळे जग जवळ आले असले तरी, व्यक्तींमधील खरा संवाद आणि समजूतदारपणा कमी होत चालला आहे.", "AmOÀ`m J{V_mZ OJmV, V§ÌkmZmÀ`m AØwV àJVr_wio OJ Odi Ambo Agbo Var, ì`º$t_Yrb Iam g§dmX Am{U g_OyVXmanUm H$_r hmoV Mmbbm Amho."],
    ["दैनंदिन जीवनातील धकाधकीत, अनेकदा आपल्या आत दडलेल्या कलागुणांना वाव मिळणे कठीण होते, आणि त्यामुळे एका विशिष्ट प्रकारची आंतरिक खिन्नता मनात घर करते.", "X¡Z§{XZ OrdZmVrb YH$mYH$rV, AZoH$Xm Amnë`m AmV XS>boë`m H$bmJwUm§Zm dmd {_iUo H$R>rU hmoVo, Am{U Ë`m_wio EH$m {d{eï àH$maMr Am§V{aH$ {IÞVm _ZmV Ka H$aVo."],
  ];
  it.each(known)("%s", (unicode, shree) => {
    expect(unicodeToShree(unicode)).toBe(shree);
    expect(shreeToUnicode(shree)).toBe(unicode);
  });

  it.each(["महाराष्ट्र", "राष्ट्रीय", "कार्यक्रम", "कीर्ती", "पूर्वी", "धर्मों", "ज़िंदगी", "क्षत्रिय", "श्रीमान", "स्त्री", "हृदय", "दृष्टी", "रुपया", "रूप", "कुंकू", "ऊँ", "ईंधन", "औषध", "ऑफिस", "पैसे", "कैंची", "ट्रेन", "अर्थात्", "१२३", "ॐ नमः शिवाय।"])("round-trips %s", (text) => {
    expect(shreeToUnicode(unicodeToShree(text))).toBe(text.normalize("NFC"));
  });
});

describe("Bijoy ⇄ Unicode", () => {
  it.each(["বাংলা প্রিন্ট টেস্ট", "আমার সোনার বাংলা", "কার্যক্রম"])("round-trips %s", (text) => {
    const bijoy = convertText("unicode-to-bijoy", text).text;
    expect(bijoy).not.toBe(text);
    expect(convertText("bijoy-to-unicode", bijoy).text).toBe(text);
  });
});

describe("Hindi → Roman", () => {
  it.each([["भारत", "bharat"], ["नमस्ते", "namaste"], ["राजधानी", "rajdhani"], ["समझना", "samajhna"], ["अपना", "apna"], ["कमल", "kamal"], ["हिंदी", "hindi"], ["ज़िंदगी", "zindagi"], ["क", "ka"]])("%s → %s", (hindi, roman) => {
    expect(devanagariToRoman(hindi)).toBe(roman);
  });
  it("writes IAST with every vowel", () => {
    expect(devanagariToRoman("भारत", "iast")).toBe("bhārata");
    expect(devanagariToRoman("कृष्ण", "iast")).toBe("kr̥ṣṇa");
  });
  it("leaves non-Devanagari text alone", () => {
    expect(devanagariToRoman("Hello, भारत 2026!")).toBe("Hello, bharat 2026!");
  });
});

describe("phonetic typing", () => {
  it.each([["namaste", "नमस्ते"], ["raam", "राम"], ["bharat", "भरत"], ["Delhi", "देल्हि"], ["kaise", "कैसे"], ["sundar", "सुंदर"], ["krishna", "कृश्न"], ["hari", "हरि"], ["patra", "पत्र"], ["dnyaan", "ज्ञान"]])("%s → %s", (roman, hindi) => {
    expect(romanToDevanagari(roman)).toBe(hindi);
  });
});

describe("UK ⇄ US English", () => {
  it("converts word families and keeps case", () => {
    expect(ukToUs("The Colour of my favourite organisation's CENTRE, travelled and analysed.").text)
      .toBe("The Color of my favorite organization's CENTER, traveled and analyzed.");
    expect(usToUk("I realized the color was gray.").text).toBe("I realised the colour was grey.");
  });
  it("counts changes", () => {
    expect(ukToUs("colour and flavour").changes).toBe(2);
  });
  it("does not turn ambiguous US words into British ones", () => {
    expect(usToUk("Check the program license and practice.").text).toBe("Check the program license and practice.");
    expect(ukToUs("Pay by cheque").text).toBe("Pay by check");
  });
});

describe("registry", () => {
  it("has an engine for every live converter and none for the rest", () => {
    for (const converter of fontConverters) expect(Boolean(engines[converter.slug]), converter.slug).toBe(converter.live);
  });
  it("uses unique slugs across all tools", () => {
    const slugs = tools.map((tool) => tool.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
  it("lists every converter once in its group", () => {
    expect(getFontConvertersByGroup().flatMap((group) => group.tools)).toHaveLength(fontConverters.length);
    expect(liveFontConverters.length).toBeGreaterThan(0);
  });
});
