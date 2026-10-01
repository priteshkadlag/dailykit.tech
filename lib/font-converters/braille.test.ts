import { describe, expect, it } from "vitest";
import { devanagariToBraille } from "@/lib/font-converters/braille";

describe("Devanagari → Bharati Braille", () => {
  it.each([
    ["क", "⠅"],
    ["कि", "⠅⠊"], // vowel signs follow the consonant in braille
    ["कइ", "⠅⠁⠊"], // the inherent a is written before another vowel
    ["क्", "⠈⠅"], // the virama comes first
    ["भारत", "⠘⠜⠗⠞"],
    ["नमस्ते", "⠝⠍⠈⠎⠞⠑"],
    ["क्षमा", "⠟⠍⠜"],
    ["ज्ञान", "⠱⠜⠝"],
    ["हिंदी", "⠓⠊⠰⠙⠔"],
    ["ऋषि", "⠐⠗⠯⠊"],
    ["सड़क", "⠎⠻⠅"],
    ["है।", "⠓⠌⠲"],
    ["२०२६", "⠼⠃⠚⠃⠋"],
    ["कक्षा 10", "⠅⠟⠜ ⠼⠁⠚"],
  ])("%s → %s", (text, braille) => {
    expect(devanagariToBraille(text)).toBe(braille);
  });
});
