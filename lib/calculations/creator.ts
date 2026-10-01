/**
 * Creator and streaming calculations: live-stream bitrate, aspect-ratio crops and
 * YouTube chapter timestamps.
 */

// ---- Stream bitrate

export type StreamPlatform = "twitch" | "youtube";
export type StreamResolution = "720p" | "1080p" | "1440p" | "2160p";
export type StreamFps = 30 | 60;

export const RESOLUTIONS: Record<StreamResolution, { width: number; height: number; label: string }> = {
  "720p": { width: 1280, height: 720, label: "720p (1280×720)" },
  "1080p": { width: 1920, height: 1080, label: "1080p (1920×1080)" },
  "1440p": { width: 2560, height: 1440, label: "1440p (2560×1440)" },
  "2160p": { width: 3840, height: 2160, label: "4K (3840×2160)" },
};
const RESOLUTION_ORDER: StreamResolution[] = ["2160p", "1440p", "1080p", "720p"];

/**
 * H.264 video bitrate ranges in kbps, from each platform's published encoder guidance.
 * Twitch's standard ingest tops out at 1080p60 around 6,000 kbps, so it has no 1440p/4K rows.
 */
const BITRATE_GUIDE: Record<StreamPlatform, Partial<Record<`${StreamResolution}${StreamFps}`, [number, number]>>> = {
  youtube: {
    "720p30": [1500, 4000], "720p60": [2250, 6000], "1080p30": [3000, 6000], "1080p60": [4500, 9000],
    "1440p30": [6000, 13000], "1440p60": [9000, 18000], "2160p30": [13000, 34000], "2160p60": [20000, 51000],
  },
  twitch: { "720p30": [2500, 4000], "720p60": [3500, 5000], "1080p30": [3500, 5000], "1080p60": [4500, 6000] },
};

/** Audio bitrate most streaming guides recommend for AAC stereo. */
export const AUDIO_KBPS = 160;
/** Share of measured upload speed to spend on the stream, leaving room for fluctuations. */
export const UPLOAD_HEADROOM = 0.75;

export interface BitrateInput {
  platform: StreamPlatform;
  resolution: StreamResolution;
  fps: StreamFps;
  /** Measured upload speed in megabits per second. */
  uploadMbps: number;
}

export interface BitrateResult {
  /** Video bitrate to enter in OBS, in kbps. */
  videoKbps: number;
  audioKbps: number;
  totalKbps: number;
  /** Most video bitrate the connection can carry with headroom, in kbps. */
  budgetKbps: number;
  /** The platform's range for the chosen resolution, or null when it doesn't offer it. */
  range: [number, number] | null;
  /** "ok" when the upload fits the ideal bitrate, "limited" when it fits the minimum only, "too-slow" otherwise. */
  status: "ok" | "limited" | "too-slow" | "unsupported";
  /** Highest resolution at this frame rate whose minimum bitrate the connection can carry. */
  suggestedResolution: StreamResolution | null;
  keyframeSeconds: number;
}

export function bitrateRange(platform: StreamPlatform, resolution: StreamResolution, fps: StreamFps) {
  return BITRATE_GUIDE[platform][`${resolution}${fps}`] ?? null;
}

export function calculateStreamBitrate(input: BitrateInput): BitrateResult {
  const budgetKbps = Math.max(0, Math.floor(input.uploadMbps * 1000 * UPLOAD_HEADROOM) - AUDIO_KBPS);
  const range = bitrateRange(input.platform, input.resolution, input.fps);
  const suggestedResolution = RESOLUTION_ORDER.find((resolution) => {
    const candidate = bitrateRange(input.platform, resolution, input.fps);
    return candidate !== null && candidate[0] <= budgetKbps;
  }) ?? null;

  let status: BitrateResult["status"];
  let videoKbps: number;
  if (!range) {
    status = "unsupported";
    videoKbps = 0;
  } else if (budgetKbps >= range[1]) {
    status = "ok";
    videoKbps = range[1];
  } else if (budgetKbps >= range[0]) {
    status = "limited";
    // Round down to a tidy step so the value is easy to type into OBS.
    videoKbps = Math.floor(budgetKbps / 250) * 250;
  } else {
    status = "too-slow";
    videoKbps = budgetKbps < 500 ? 0 : Math.floor(budgetKbps / 250) * 250;
  }
  return {
    videoKbps,
    audioKbps: AUDIO_KBPS,
    totalKbps: videoKbps ? videoKbps + AUDIO_KBPS : 0,
    budgetKbps,
    range,
    status,
    suggestedResolution,
    keyframeSeconds: 2,
  };
}

// ---- Aspect ratio

export interface AspectInput {
  sourceWidth: number;
  sourceHeight: number;
  /** Target ratio as width:height, e.g. 9:16. */
  ratioWidth: number;
  ratioHeight: number;
}

/** Video encoders need even dimensions; rounds down to the nearest even number. */
const even = (value: number) => Math.max(2, Math.floor(value / 2) * 2);

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** Simplest whole-number ratio for a width and height, e.g. 1920×1080 → 16:9. */
export function simplifyRatio(width: number, height: number) {
  const w = Math.round(width);
  const h = Math.round(height);
  const divisor = gcd(w, h) || 1;
  return { width: w / divisor, height: h / divisor };
}

export function calculateAspect(input: AspectInput) {
  const target = input.ratioWidth / input.ratioHeight;
  const source = input.sourceWidth / input.sourceHeight;
  // Crop: the largest area of the target shape that fits inside the source frame.
  const cropWidth = even(source > target ? input.sourceHeight * target : input.sourceWidth);
  const cropHeight = even(source > target ? input.sourceHeight : input.sourceWidth / target);
  // Fit: the whole source scaled into a canvas of the target shape (letterbox / pillarbox bars).
  const canvasWidth = even(source > target ? input.sourceWidth : input.sourceHeight * target);
  const canvasHeight = even(source > target ? input.sourceWidth / target : input.sourceHeight);
  return {
    sourceRatio: simplifyRatio(input.sourceWidth, input.sourceHeight),
    crop: {
      width: cropWidth,
      height: cropHeight,
      // Offsets that keep the crop centred.
      x: Math.floor((input.sourceWidth - cropWidth) / 2),
      y: Math.floor((input.sourceHeight - cropHeight) / 2),
      keptPercent: (cropWidth * cropHeight * 100) / (input.sourceWidth * input.sourceHeight),
    },
    fit: {
      width: canvasWidth,
      height: canvasHeight,
      barsHorizontal: canvasWidth > input.sourceWidth,
      barSize: Math.floor(canvasWidth > input.sourceWidth ? (canvasWidth - input.sourceWidth) / 2 : (canvasHeight - input.sourceHeight) / 2),
    },
  };
}

/** Height for a width (or width for a height) at a given ratio, rounded to even pixels. */
export function scaleToRatio(ratioWidth: number, ratioHeight: number, side: "width" | "height", value: number) {
  return side === "width" ? { width: even(value), height: even((value * ratioHeight) / ratioWidth) } : { width: even((value * ratioWidth) / ratioHeight), height: even(value) };
}

// ---- YouTube chapters

export interface Chapter {
  seconds: number;
  title: string;
}

export interface ChapterIssue {
  line?: number;
  message: string;
}

/** Timestamps YouTube reads: 0:00, 00:00, 1:02:03 (hours, minutes, seconds). */
const TIMESTAMP = /(?<![\d:])(\d{1,2}:)?(\d{1,2}):(\d{2})(?![\d:])/;
/** Separators people put between a timestamp and its title. */
const SEPARATOR = /^[\s\-–—:|•·.)\]]+|[\s\-–—:|•·.(\[]+$/g;

export function parseTimestamp(text: string) {
  const match = TIMESTAMP.exec(text);
  if (!match) return null;
  const hours = match[1] ? Number(match[1].slice(0, -1)) : 0;
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  if (seconds > 59 || (match[1] && minutes > 59)) return null;
  return { seconds: hours * 3600 + minutes * 60 + seconds, index: match.index, length: match[0].length };
}

/** m:ss under an hour, h:mm:ss after, the way YouTube displays them. */
export function formatTimestamp(total: number, withHours = total >= 3600) {
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return withHours ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}` : `${minutes}:${seconds}`;
}

export interface ChapterOptions {
  /** Add a "0:00 Intro" chapter when the list doesn't start at zero. */
  addIntro: boolean;
  introTitle?: string;
  /** Use h:mm:ss for every line when the video is an hour or longer. */
  padHours: boolean;
}

export function formatChapters(input: string, options: ChapterOptions) {
  const issues: ChapterIssue[] = [];
  const chapters: (Chapter & { line: number })[] = [];
  input.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    if (!line) return;
    const stamp = parseTimestamp(line);
    if (!stamp) {
      issues.push({ line: index + 1, message: `No timestamp found in "${line}", so it was left out.` });
      return;
    }
    const title = (line.slice(0, stamp.index) + " " + line.slice(stamp.index + stamp.length))
      // Brackets that only held the timestamp, e.g. "(05:40) Results".
      .replace(/[([{]\s*[)\]}]/g, " ")
      .replace(SEPARATOR, "").replace(/\s+/g, " ").trim();
    if (!title) issues.push({ line: index + 1, message: `The chapter at ${formatTimestamp(stamp.seconds)} has no title.` });
    chapters.push({ seconds: stamp.seconds, title: title || "Untitled", line: index + 1 });
  });

  const outOfOrder = chapters.some((chapter, i) => i > 0 && chapter.seconds <= chapters[i - 1].seconds);
  if (outOfOrder) issues.push({ message: "Timestamps weren't in order, so they were sorted from earliest to latest." });
  chapters.sort((a, b) => a.seconds - b.seconds);
  const unique = chapters.filter((chapter, i) => i === 0 || chapter.seconds !== chapters[i - 1].seconds);
  if (unique.length < chapters.length) issues.push({ message: "Chapters with the same timestamp were merged into the first one." });

  if (unique.length && unique[0].seconds !== 0) {
    if (options.addIntro) unique.unshift({ seconds: 0, title: options.introTitle?.trim() || "Intro", line: 0 });
    else issues.push({ message: "YouTube needs the first chapter to start at 0:00." });
  }
  for (let i = 1; i < unique.length; i++) {
    const length = unique[i].seconds - unique[i - 1].seconds;
    if (length < 10) issues.push({ message: `"${unique[i - 1].title}" is ${length} seconds long; YouTube needs every chapter to be at least 10 seconds.` });
  }
  if (unique.length > 0 && unique.length < 3) issues.push({ message: `YouTube needs at least 3 chapters; this list has ${unique.length}.` });

  const withHours = options.padHours && unique.some((chapter) => chapter.seconds >= 3600);
  const text = unique.map((chapter) => `${formatTimestamp(chapter.seconds, withHours || chapter.seconds >= 3600)} ${chapter.title}`).join("\n");
  const valid = unique.length >= 3 && unique[0].seconds === 0 && unique.every((chapter, i) => i === 0 || chapter.seconds - unique[i - 1].seconds >= 10);
  return { chapters: unique.map(({ seconds, title }) => ({ seconds, title })), text, issues, valid };
}
