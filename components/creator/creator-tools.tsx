"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, TriangleAlert } from "lucide-react";
import { z } from "zod";
import {
  AUDIO_KBPS, RESOLUTIONS, UPLOAD_HEADROOM, calculateAspect, calculateStreamBitrate, formatChapters, scaleToRatio,
  type StreamFps, type StreamPlatform, type StreamResolution,
} from "@/lib/calculations/creator";
import { formatNumber } from "@/lib/format";
import { numberString, validateInputs } from "@/lib/validation/fields";
import { CheckboxField, NumberField, SegmentedControl, SelectField, TextAreaField, TextField } from "@/components/shared/form-fields";
import { CopyButton, ResetButton } from "@/components/shared/result-actions";
import { CalculatorLayout, EmptyResult, InputCard, ResultCard, ResultRows } from "@/components/shared/result-card";
import { Button } from "@/components/ui/button";

const kbps = (value: number) => `${formatNumber(value)} Kbps`;

// ---- Video bitrate

const PLATFORM_NAMES: Record<StreamPlatform, string> = { twitch: "Twitch", youtube: "YouTube" };
const bitrateSchema = z.object({ uploadMbps: numberString({ min: 0.5, max: 10000 }) });
const BITRATE_DEFAULTS = { platform: "twitch" as StreamPlatform, resolution: "1080p" as StreamResolution, fps: "60" as `${StreamFps}`, uploadMbps: "" };

export function VideoBitrateCalculator() {
  const [values, setValues] = useState(BITRATE_DEFAULTS);
  const validation = validateInputs(bitrateSchema, { uploadMbps: values.uploadMbps });
  const fps = Number(values.fps) as StreamFps;
  const result = validation.ok ? calculateStreamBitrate({ platform: values.platform, resolution: values.resolution, fps, uploadMbps: validation.data.uploadMbps }) : null;
  const set = <K extends keyof typeof values>(key: K) => (value: (typeof values)[K]) => setValues((current) => ({ ...current, [key]: value }));
  const platform = PLATFORM_NAMES[values.platform];
  const setting = `${values.resolution === "2160p" ? "4K" : values.resolution}${values.fps}`;

  let headline = "";
  let caption = "";
  if (result) {
    if (result.status === "unsupported") {
      headline = "Not supported";
      caption = `${platform} doesn't take ${setting} on standard ingest.`;
    } else if (result.videoKbps === 0) {
      headline = "Upload too slow";
      caption = "Your connection can't carry a stable stream at this setting.";
    } else {
      headline = kbps(result.videoKbps);
      caption = result.status === "ok" ? `${platform}'s recommended bitrate for ${setting}.` : result.status === "limited" ? `Capped by your upload speed; ${platform} recommends up to ${kbps(result.range![1])}.` : `Below ${platform}'s ${kbps(result.range![0])} minimum for ${setting}; expect a blurry picture.`;
    }
  }
  const suggestion = result && result.status !== "ok" && result.suggestedResolution && result.suggestedResolution !== values.resolution
    ? `Try ${RESOLUTIONS[result.suggestedResolution].label} at ${values.fps} fps instead.` : null;
  const summary = result && result.videoKbps ? `OBS settings for ${platform} ${setting}: video bitrate ${kbps(result.videoKbps)} (CBR), audio ${kbps(AUDIO_KBPS)}, keyframe interval ${result.keyframeSeconds} s.` : "";

  return <CalculatorLayout inputs={<InputCard title="Your stream">
    <SegmentedControl label="Platform" value={values.platform} onChange={set("platform")} options={[{ value: "twitch", label: "Twitch" }, { value: "youtube", label: "YouTube" }]} />
    <div className="grid gap-4 sm:grid-cols-2">
      <SelectField label="Output resolution" value={values.resolution} onChange={set("resolution")} options={(Object.keys(RESOLUTIONS) as StreamResolution[]).map((value) => ({ value, label: RESOLUTIONS[value].label }))} />
      <SegmentedControl label="Frame rate" value={values.fps} onChange={set("fps")} options={[{ value: "30", label: "30 fps" }, { value: "60", label: "60 fps" }]} />
    </div>
    <NumberField label="Upload speed" suffix="Mbps" value={values.uploadMbps} onChange={set("uploadMbps")} error={validation.errors.uploadMbps} hint="Run a speed test and use the upload figure, not the download one." />
  </InputCard>} result={result ? <ResultCard highlightLabel="Video bitrate for OBS" highlightValue={headline} highlightCaption={caption} tone={result.videoKbps && result.status !== "too-slow" ? "default" : "negative"} actions={<>{summary && <CopyButton text={summary} label="Copy settings" saveable={false} />}<ResetButton onReset={() => setValues(BITRATE_DEFAULTS)} /></>}>
    {suggestion && <p className="mb-3 rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">{suggestion}</p>}
    <ResultRows rows={[
      { label: "Audio bitrate (AAC)", value: kbps(result.audioKbps) },
      { label: "Total upload used", value: result.totalKbps ? kbps(result.totalKbps) : "—", emphasis: true },
      { label: `Safe video budget (${UPLOAD_HEADROOM * 100}% of upload, less audio)`, value: kbps(result.budgetKbps) },
      { label: `${platform} range for ${setting}`, value: result.range ? `${formatNumber(result.range[0])}–${kbps(result.range[1])}` : "Not offered" },
      { label: "Rate control", value: "CBR" },
      { label: "Keyframe interval", value: `${result.keyframeSeconds} s` },
    ]} />
  </ResultCard> : <EmptyResult message="Enter your upload speed to get the bitrate to set in OBS." />} />;
}

// ---- Aspect ratio

const RATIO_PRESETS = [
  { value: "9:16", label: "9:16 Reels / TikTok / Shorts" },
  { value: "1:1", label: "1:1 Square" },
  { value: "4:5", label: "4:5 Instagram portrait" },
  { value: "16:9", label: "16:9 YouTube" },
  { value: "4:3", label: "4:3 Classic" },
  { value: "21:9", label: "21:9 Cinema" },
  { value: "custom", label: "Custom" },
] as const;
type RatioPreset = (typeof RATIO_PRESETS)[number]["value"];
const aspectSchema = z.object({
  sourceWidth: numberString({ min: 2, max: 20000 }),
  sourceHeight: numberString({ min: 2, max: 20000 }),
  ratioWidth: numberString({ min: 0.01, max: 1000 }),
  ratioHeight: numberString({ min: 0.01, max: 1000 }),
});
const ASPECT_DEFAULTS = { sourceWidth: "1920", sourceHeight: "1080", preset: "9:16" as RatioPreset, customWidth: "2", customHeight: "3" };

export function AspectRatioCalculator() {
  const [values, setValues] = useState(ASPECT_DEFAULTS);
  const [ratioWidth, ratioHeight] = values.preset === "custom" ? [values.customWidth, values.customHeight] : values.preset.split(":");
  const validation = validateInputs(aspectSchema, { sourceWidth: values.sourceWidth, sourceHeight: values.sourceHeight, ratioWidth, ratioHeight });
  const result = validation.ok ? calculateAspect(validation.data) : null;
  const set = <K extends keyof typeof values>(key: K) => (value: (typeof values)[K]) => setValues((current) => ({ ...current, [key]: value }));
  const target = `${ratioWidth}:${ratioHeight}`;
  // Standard export size: 1080 px on the short side, as the social platforms use.
  const exportSize = validation.ok ? scaleToRatio(validation.data.ratioWidth, validation.data.ratioHeight, validation.data.ratioWidth <= validation.data.ratioHeight ? "width" : "height", 1080) : null;
  const px = (w: number, h: number) => `${formatNumber(w)} × ${formatNumber(h)} px`;
  const summary = result && exportSize ? `Crop ${px(result.crop.width, result.crop.height)} at X ${result.crop.x}, Y ${result.crop.y}; export at ${px(exportSize.width, exportSize.height)} (${target}).` : "";

  return <CalculatorLayout inputs={<InputCard title="Source video">
    <div className="grid gap-4 sm:grid-cols-2">
      <NumberField label="Width" suffix="px" value={values.sourceWidth} onChange={set("sourceWidth")} error={validation.errors.sourceWidth} />
      <NumberField label="Height" suffix="px" value={values.sourceHeight} onChange={set("sourceHeight")} error={validation.errors.sourceHeight} />
    </div>
    <SelectField label="Target aspect ratio" value={values.preset} onChange={set("preset")} options={RATIO_PRESETS} />
    {values.preset === "custom" && <div className="grid gap-4 sm:grid-cols-2">
      <NumberField label="Ratio width" value={values.customWidth} onChange={set("customWidth")} error={validation.errors.ratioWidth} />
      <NumberField label="Ratio height" value={values.customHeight} onChange={set("customHeight")} error={validation.errors.ratioHeight} />
    </div>}
    {result && <CropPreview source={{ width: validation.data!.sourceWidth, height: validation.data!.sourceHeight }} crop={result.crop} />}
  </InputCard>} result={result && exportSize ? <ResultCard highlightLabel={`Crop to ${target}`} highlightValue={px(result.crop.width, result.crop.height)} highlightCaption={`A centred crop keeps ${formatNumber(Math.round(result.crop.keptPercent))}% of the ${result.sourceRatio.width}:${result.sourceRatio.height} frame.`} actions={<><CopyButton text={summary} label="Copy sizes" saveable={false} /><ResetButton onReset={() => setValues(ASPECT_DEFAULTS)} /></>}>
    <ResultRows rows={[
      { label: "Crop position (from top-left)", value: `X ${formatNumber(result.crop.x)}, Y ${formatNumber(result.crop.y)}` },
      { label: `Export size for ${target}`, value: px(exportSize.width, exportSize.height), emphasis: true },
      { label: "Fit without cropping (canvas)", value: px(result.fit.width, result.fit.height) },
      { label: result.fit.barsHorizontal ? "Bars left and right" : "Bars top and bottom", value: result.fit.barSize ? `${formatNumber(result.fit.barSize)} px each` : "None" },
    ]} />
  </ResultCard> : <EmptyResult message="Enter your video's width and height to see the crop and export sizes." />} />;
}

function CropPreview({ source, crop }: { source: { width: number; height: number }; crop: { width: number; height: number; x: number; y: number } }) {
  const pct = (part: number, whole: number) => `${(part / whole) * 100}%`;
  return <figure className="space-y-2">
    <div className="relative mx-auto max-h-64 w-full max-w-sm overflow-hidden rounded-md bg-muted ring-1 ring-foreground/10" style={{ aspectRatio: `${source.width} / ${source.height}` }}>
      <div className="absolute rounded-sm bg-primary/25 ring-2 ring-primary" style={{ left: pct(crop.x, source.width), top: pct(crop.y, source.height), width: pct(crop.width, source.width), height: pct(crop.height, source.height) }} />
    </div>
    <figcaption className="text-center text-xs text-muted-foreground">Highlighted area: what the centred crop keeps.</figcaption>
  </figure>;
}

// ---- YouTube chapters

const CHAPTER_EXAMPLE = "Intro\n1:15 - Unboxing\nSetup (4:02)\n9:30 First impressions\n15:45 Verdict";

export function YouTubeChapterGenerator() {
  const [text, setText] = useState("");
  const [addIntro, setAddIntro] = useState(true);
  const [introTitle, setIntroTitle] = useState("Intro");
  const [padHours, setPadHours] = useState(false);
  const result = useMemo(() => formatChapters(text, { addIntro, introTitle, padHours }), [text, addIntro, introTitle, padHours]);
  const hasInput = text.trim().length > 0;

  return <div className="grid gap-6 lg:grid-cols-2">
    <section className="space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
      <h2 className="font-semibold">Your timestamps</h2>
      <TextAreaField label="One chapter per line" value={text} onChange={setText} rows={12} placeholder={"0:00 Intro\n2:15 Setup\n5:40 Results"} hint="Timestamps can sit before or after the title: 2:15 Setup, Setup - 2:15 or (2:15) Setup." />
      <CheckboxField label="Add a 0:00 chapter if the list doesn't start at zero" checked={addIntro} onChange={setAddIntro} />
      {addIntro && <TextField label="Title for the 0:00 chapter" value={introTitle} onChange={setIntroTitle} maxLength={100} />}
      <CheckboxField label="Show hours on every line" hint="For videos an hour or longer: 0:05:00 instead of 5:00." checked={padHours} onChange={setPadHours} />
      <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setText(CHAPTER_EXAMPLE)}>Load example</Button><ResetButton onReset={() => setText("")} /></div>
    </section>
    <section aria-live="polite" className="space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
      <h2 className="font-semibold">Chapters for your description</h2>
      <TextAreaField label="Paste into your YouTube description" value={result.text} onChange={() => {}} rows={12} />
      <CopyButton text={result.text} label="Copy chapters" saveable={false} />
      {hasInput && (result.valid
        ? <p className="flex items-start gap-2 rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground"><CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />Ready: starts at 0:00, has {result.chapters.length} chapters in order, each at least 10 seconds long.</p>
        : null)}
      {hasInput && result.issues.length > 0 && <ul className="space-y-2">{result.issues.map((issue, i) => <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden /><span>{issue.line ? `Line ${issue.line}: ` : ""}{issue.message}</span></li>)}</ul>}
    </section>
  </div>;
}
