import { describe, expect, it } from "vitest";
import { formatBytes, sniffMime, uniqueNames, withExtension } from "@/lib/files/validation";
import { parsePageRange } from "@/lib/pdf/page-range";
import { clampSize, containRect, drawPlan, layoutImagePage, resolveDimensions } from "./geometry";

const bytes = (...b: number[]) => new Uint8Array([...b, ...Array(16).fill(0)]);

describe("File checks", () => {
  it("formats sizes", () => {
    expect(formatBytes(830)).toBe("830 B");
    expect(formatBytes(420 * 1024)).toBe("420 KB");
    expect(formatBytes(2.4 * 1024 * 1024)).toBe("2.4 MB");
  });

  it("identifies files by content, not name", () => {
    expect(sniffMime(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(sniffMime(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe("image/png");
    expect(sniffMime(bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50))).toBe("image/webp");
    expect(sniffMime(bytes(0x25, 0x50, 0x44, 0x46, 0x2d))).toBe("application/pdf");
    expect(sniffMime(bytes(0x4d, 0x5a))).toBeNull(); // Windows .exe
  });

  it("renames and de-duplicates", () => {
    expect(withExtension("holiday.photo.PNG", "jpg")).toBe("holiday.photo.jpg");
    expect(uniqueNames(["a.jpg", "A.jpg", "a.jpg", "b.jpg"])).toEqual(["a.jpg", "A (2).jpg", "a (3).jpg", "b.jpg"]);
  });
});

describe("Page ranges", () => {
  it("parses lists, ranges and open ranges", () => {
    expect(parsePageRange("", 3).pages).toEqual([1, 2, 3]);
    expect(parsePageRange("1-3, 5, 8-", 9).pages).toEqual([1, 2, 3, 5, 8, 9]);
    expect(parsePageRange("-2", 5).pages).toEqual([1, 2]);
    expect(parsePageRange("3,1,3", 5).pages).toEqual([1, 3]);
  });

  it("explains bad input", () => {
    expect(parsePageRange("7", 5).error).toMatch(/only 5 pages/);
    expect(parsePageRange("4-2", 5).error).toMatch(/backwards/);
    expect(parsePageRange("a", 5).error).toMatch(/isn't a valid/);
    expect(parsePageRange("0", 5).error).toMatch(/start at 1/);
  });
});

describe("Geometry", () => {
  it("fits an image inside a box, centred", () => {
    expect(containRect({ width: 200, height: 100 }, { x: 0, y: 0, width: 100, height: 100 })).toEqual({ x: 0, y: 25, width: 100, height: 50 });
  });

  it("lays out A4 pages with margins and orientation", () => {
    const portrait = layoutImagePage({ width: 1000, height: 1000 }, "a4", "portrait", 10);
    expect(portrait.page).toEqual({ width: 210, height: 297 });
    expect(portrait.image.width).toBe(190);
    const landscape = layoutImagePage({ width: 1000, height: 1000 }, "a4", "landscape", 10);
    expect(landscape.page).toEqual({ width: 297, height: 210 });
    expect(landscape.image.height).toBe(190);
    const original = layoutImagePage({ width: 96, height: 192 }, "original", "portrait", 0);
    expect(original.page.width).toBeCloseTo(25.4);
    expect(original.page.height).toBeCloseTo(50.8);
  });

  it("keeps the aspect ratio when one side is given", () => {
    expect(resolveDimensions({ width: 4000, height: 3000 }, 1200, null)).toEqual({ width: 1200, height: 900 });
    expect(resolveDimensions({ width: 4000, height: 3000 }, null, 600)).toEqual({ width: 800, height: 600 });
  });

  it("plans cover crops from the centre and contain padding", () => {
    const cover = drawPlan({ width: 4000, height: 3000 }, { width: 1080, height: 1080 }, "cover");
    expect(cover.src).toEqual({ x: 500, y: 0, width: 3000, height: 3000 });
    const contain = drawPlan({ width: 4000, height: 3000 }, { width: 1080, height: 1080 }, "contain");
    expect(contain.dest).toEqual({ x: 0, y: 135, width: 1080, height: 810 });
  });

  it("clamps oversized canvases", () => {
    const r = clampSize({ width: 20000, height: 10000 });
    expect(r.clamped).toBe(true);
    expect(r.width).toBeLessThanOrEqual(8192);
    expect(r.width * r.height).toBeLessThanOrEqual(40_000_000);
    expect(clampSize({ width: 1000, height: 1000 }).clamped).toBe(false);
  });
});
