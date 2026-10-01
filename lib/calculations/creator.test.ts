import { describe, expect, it } from "vitest";
import { calculateAspect, calculateStreamBitrate, formatChapters, formatTimestamp, parseTimestamp, scaleToRatio, simplifyRatio } from "@/lib/calculations/creator";

describe("calculateStreamBitrate", () => {
  it("uses the platform's top bitrate when the upload has room", () => {
    const result = calculateStreamBitrate({ platform: "twitch", resolution: "1080p", fps: 60, uploadMbps: 20 });
    expect(result).toMatchObject({ videoKbps: 6000, audioKbps: 160, totalKbps: 6160, status: "ok", keyframeSeconds: 2 });
  });

  it("caps the bitrate at 75% of upload minus audio", () => {
    // 10 Mbps × 0.75 = 7,500 kbps, less 160 kbps audio = 7,340 kbps → 7,250 in OBS.
    const result = calculateStreamBitrate({ platform: "youtube", resolution: "1080p", fps: 60, uploadMbps: 10 });
    expect(result).toMatchObject({ budgetKbps: 7340, videoKbps: 7250, status: "limited" });
  });

  it("suggests a lower resolution when the upload is too slow", () => {
    const result = calculateStreamBitrate({ platform: "youtube", resolution: "1080p", fps: 60, uploadMbps: 4 });
    expect(result.status).toBe("too-slow");
    expect(result.suggestedResolution).toBe("720p");
  });

  it("flags resolutions the platform doesn't take", () => {
    const result = calculateStreamBitrate({ platform: "twitch", resolution: "2160p", fps: 60, uploadMbps: 100 });
    expect(result.status).toBe("unsupported");
    expect(result.suggestedResolution).toBe("1080p");
  });
});

describe("calculateAspect", () => {
  it("crops 16:9 1080p to a centred 9:16 vertical frame", () => {
    const result = calculateAspect({ sourceWidth: 1920, sourceHeight: 1080, ratioWidth: 9, ratioHeight: 16 });
    expect(result.crop).toMatchObject({ width: 606, height: 1080, x: 657, y: 0 });
    expect(result.fit).toMatchObject({ width: 1920, height: 3412, barsHorizontal: false });
    expect(result.sourceRatio).toEqual({ width: 16, height: 9 });
  });

  it("crops a vertical video to 16:9", () => {
    const result = calculateAspect({ sourceWidth: 1080, sourceHeight: 1920, ratioWidth: 16, ratioHeight: 9 });
    expect(result.crop).toMatchObject({ width: 1080, height: 606, x: 0, y: 657 });
    expect(result.fit).toMatchObject({ width: 3412, height: 1920, barsHorizontal: true, barSize: 1166 });
  });

  it("scales to even dimensions", () => {
    expect(scaleToRatio(9, 16, "width", 1080)).toEqual({ width: 1080, height: 1920 });
    expect(scaleToRatio(4, 5, "height", 1350)).toEqual({ width: 1080, height: 1350 });
    expect(simplifyRatio(2560, 1080)).toEqual({ width: 64, height: 27 });
  });
});

describe("YouTube chapters", () => {
  it("parses and formats timestamps", () => {
    expect(parseTimestamp("Intro 1:02:03")?.seconds).toBe(3723);
    expect(parseTimestamp("no time here")).toBeNull();
    expect(parseTimestamp("9:75 bad")).toBeNull();
    expect(formatTimestamp(65)).toBe("1:05");
    expect(formatTimestamp(65, true)).toBe("0:01:05");
    expect(formatTimestamp(3723)).toBe("1:02:03");
  });

  it("cleans separators, sorts and adds the 0:00 chapter", () => {
    const result = formatChapters("Setup - 02:15\n(05:40) Results\n00:30 | Why it matters", { addIntro: true, padHours: false });
    expect(result.text).toBe("0:00 Intro\n0:30 Why it matters\n2:15 Setup\n5:40 Results");
    expect(result.valid).toBe(true);
    expect(result.issues.map((issue) => issue.message)).toContain("Timestamps weren't in order, so they were sorted from earliest to latest.");
  });

  it("reports what would stop YouTube from showing chapters", () => {
    const result = formatChapters("0:05 Start\n0:10 Too short", { addIntro: false, padHours: false });
    expect(result.valid).toBe(false);
    const messages = result.issues.map((issue) => issue.message).join(" ");
    expect(messages).toContain("start at 0:00");
    expect(messages).toContain("at least 10 seconds");
    expect(messages).toContain("at least 3 chapters");
  });

  it("pads every line with hours for long videos when asked", () => {
    const result = formatChapters("0:00 Start\n30:00 Middle\n1:05:00 End", { addIntro: false, padHours: true });
    expect(result.text).toBe("0:00:00 Start\n0:30:00 Middle\n1:05:00 End");
  });

  it("skips lines without a timestamp", () => {
    const result = formatChapters("Chapters:\n0:00 A\n1:00 B\n2:00 C", { addIntro: false, padHours: false });
    expect(result.chapters).toHaveLength(3);
    expect(result.issues[0]).toMatchObject({ line: 1 });
  });
});
