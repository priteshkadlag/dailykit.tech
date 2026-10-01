import { decompressFrames, parseGIF } from "gifuct-js";
import { applyPalette, GIFEncoder, quantize } from "gifenc";

export interface GifInfo { width: number; height: number; frames: number; duration: number }

export async function transformGif(file: Blob, targetWidth?: number, speed = 1) {
  const parsed = parseGIF(await file.arrayBuffer());
  const frames = decompressFrames(parsed, true);
  if (!frames.length) throw new Error("This GIF contains no readable frames.");
  if (frames.length > 400 || parsed.lsd.width * parsed.lsd.height * frames.length > 120_000_000) throw new Error("This animation is too large to process safely in the browser.");
  const width = targetWidth && targetWidth > 0 ? Math.round(targetWidth) : parsed.lsd.width;
  const height = Math.max(1, Math.round(parsed.lsd.height * width / parsed.lsd.width));
  const source = document.createElement("canvas"); source.width = parsed.lsd.width; source.height = parsed.lsd.height;
  const sourceCtx = source.getContext("2d")!;
  const patch = document.createElement("canvas");
  const output = document.createElement("canvas"); output.width = width; output.height = height;
  const outputCtx = output.getContext("2d", { willReadFrequently: true })!;
  const encoder = GIFEncoder();
  let duration = 0;

  frames.forEach((frame) => {
    patch.width = frame.dims.width; patch.height = frame.dims.height;
    patch.getContext("2d")!.putImageData(new ImageData(Uint8ClampedArray.from(frame.patch), frame.dims.width, frame.dims.height), 0, 0);
    sourceCtx.drawImage(patch, frame.dims.left, frame.dims.top);
    outputCtx.clearRect(0, 0, width, height);
    outputCtx.drawImage(source, 0, 0, width, height);
    const rgba = outputCtx.getImageData(0, 0, width, height).data;
    const palette = quantize(rgba, 256);
    const delay = Math.max(20, Math.round((frame.delay || 100) / Math.max(0.1, speed)));
    duration += delay;
    encoder.writeFrame(applyPalette(rgba, palette), width, height, { palette, delay, repeat: 0 });
    if (frame.disposalType === 2) sourceCtx.clearRect(frame.dims.left, frame.dims.top, frame.dims.width, frame.dims.height);
  });
  encoder.finish();
  const bytes = encoder.bytes();
  return { blob: new Blob([bytes.buffer as ArrayBuffer], { type: "image/gif" }), info: { width, height, frames: frames.length, duration } satisfies GifInfo };
}

export async function imagesToGif(files: Blob[], targetWidth = 800, delay = 500) {
  if (!files.length) throw new Error("Choose at least one image.");
  const bitmaps = await Promise.all(files.map((file) => createImageBitmap(file)));
  const width = Math.max(1, Math.round(targetWidth));
  const height = Math.max(1, Math.round(bitmaps[0].height * width / bitmaps[0].width));
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const encoder = GIFEncoder();
  bitmaps.forEach((bitmap) => {
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, width, height);
    const scale = Math.min(width / bitmap.width, height / bitmap.height);
    const w = bitmap.width * scale, h = bitmap.height * scale;
    ctx.drawImage(bitmap, (width - w) / 2, (height - h) / 2, w, h);
    const rgba = ctx.getImageData(0, 0, width, height).data;
    const palette = quantize(rgba, 256);
    encoder.writeFrame(applyPalette(rgba, palette), width, height, { palette, delay: Math.max(20, delay), repeat: 0 });
    bitmap.close();
  });
  encoder.finish();
  const bytes = encoder.bytes();
  return new Blob([bytes.buffer as ArrayBuffer], { type: "image/gif" });
}
