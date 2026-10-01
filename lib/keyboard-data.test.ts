import { describe, expect, it } from "vitest";
import { getKeyboard, keyboards } from "@/lib/keyboard-data";
import { getToolOrNull, getTypingToolsByGroup } from "@/lib/tools";

const ids = Array.from({ length: 48 }, (_, index) => `k${index}`);

describe("keyboard layouts", () => {
  it.each(keyboards.map((k) => [k.slug, k] as const))("%s has all 48 physical keys in order", (_, keyboard) => {
    expect(keyboard.keys.map((key) => key.id)).toEqual(ids);
  });

  it("has no zero-width spaces or repeated joiners", () => {
    for (const keyboard of keyboards) {
      for (const key of keyboard.keys) {
        for (const value of [key.normal, key.shift, key.alt]) {
          expect(value ?? "", `${keyboard.slug} ${key.id}`).not.toMatch(/​|([‌‍])\1/);
        }
      }
    }
  });

  it("gives every keyboard its own layout", () => {
    const layouts = new Map<string, string>();
    for (const keyboard of keyboards) {
      const signature = JSON.stringify(keyboard.keys);
      expect(layouts.get(signature), keyboard.slug).toBeUndefined();
      layouts.set(signature, keyboard.slug);
    }
  });

  it("maps physical Backslash to its own key, not the home row", () => {
    // k25 is Backslash, k26 is A. On Russian ЙЦУКЕН, A is ф.
    expect(getKeyboard("russian-keyboard")!.keys[26].normal).toBe("ф");
    expect(getKeyboard("russian-keyboard")!.keys[25].normal).toBe("\\");
  });

  it("builds Bengali InScript in the Bengali block", () => {
    const bengali = getKeyboard("bengali-keyboard")!;
    expect(bengali.keys.slice(26, 37).map((key) => key.normal).join(" ")).toBe("ো ে ্ ি ু প র ক ত চ ট");
    for (const key of bengali.keys) {
      for (const value of [key.normal, key.shift, key.alt]) expect(value ?? "").not.toMatch(/[ऀ-ॣ०-ॿ]/);
    }
  });

  it("lists every keyboard as a grouped tool", () => {
    for (const keyboard of keyboards) expect(getToolOrNull(keyboard.slug)?.categories).toEqual(["typing-tools"]);
    expect(getTypingToolsByGroup().flatMap((group) => group.tools)).toHaveLength(keyboards.length);
  });
});
