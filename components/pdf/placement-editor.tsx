"use client";

import { useRef } from "react";
import { applyStamps, isStandardFontText, type Stamp } from "@/lib/pdf/edit";
import { textToPng } from "@/lib/pdf/browser";
import { cn } from "@/lib/utils";
import { PageView, pct, previewFontSize } from "./page-view";
import type { LoadedPdf } from "./use-pdf";

/** Something placed on a page. Positions and sizes are in points, as the page is displayed (y down). */
export type Placed =
  | { id: string; page: number; kind: "text"; x: number; y: number; text: string; size: number; color: string; font: TextFont; bold: boolean }
  | { id: string; page: number; kind: "image"; x: number; y: number; width: number; height: number; url: string; png: Uint8Array }
  | { id: string; page: number; kind: "box"; x: number; y: number; width: number; height: number; color: string };

export type TextFont = "helvetica" | "times" | "courier";

/** Screen fonts that match the PDF's built-in fonts closely, so the preview is what you get. */
export const FONT_CSS: Record<TextFont, string> = {
  helvetica: "Arial, Helvetica, 'Noto Sans', 'Nirmala UI', sans-serif",
  times: "'Times New Roman', Times, 'Noto Serif', 'Nirmala UI', serif",
  courier: "'Courier New', Courier, 'Noto Sans Mono', monospace",
};

type DragState = { id: string; mode: "move" | "resize"; startX: number; startY: number; item: Placed; scale: number };

/**
 * A page with its placed items: drag to move, drag the corner to resize, arrow keys to nudge
 * (Shift for bigger steps), Delete to remove. Works with mouse, pen and touch.
 */
export function PlacementEditor({
  pdf,
  page,
  items,
  selected,
  onSelect,
  onChange,
}: {
  pdf: LoadedPdf;
  page: number;
  items: Placed[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  onChange: (items: Placed[]) => void;
}) {
  const size = pdf.sizes[page - 1];
  const container = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);

  const update = (id: string, patch: Partial<Placed>) => onChange(items.map((i) => (i.id === id ? ({ ...i, ...patch } as Placed) : i)));
  const clampX = (x: number, w: number) => Math.min(Math.max(x, 0), Math.max(0, size.width - Math.min(w, size.width)));
  const clampY = (y: number, h: number) => Math.min(Math.max(y, 0), Math.max(0, size.height - Math.min(h, size.height)));
  const extent = (i: Placed) => (i.kind === "text" ? { w: 20, h: i.size * 1.2 } : { w: i.width, h: i.height });

  const start = (e: React.PointerEvent, item: Placed, mode: DragState["mode"]) => {
    e.stopPropagation();
    onSelect(item.id);
    const rect = container.current?.getBoundingClientRect();
    if (!rect) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { id: item.id, mode, startX: e.clientX, startY: e.clientY, item, scale: size.width / rect.width };
  };

  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.startX) * d.scale;
    const dy = (e.clientY - d.startY) * d.scale;
    const item = d.item;
    if (d.mode === "move") {
      const { w, h } = extent(item);
      update(d.id, { x: clampX(item.x + dx, w), y: clampY(item.y + dy, h) });
    } else if (item.kind !== "text") {
      let width = Math.max(8, Math.min(item.width + dx, size.width - item.x));
      let height = Math.max(8, Math.min(item.height + dy, size.height - item.y));
      // Pictures keep their proportions.
      if (item.kind === "image") {
        const ratio = item.width / item.height;
        height = width / ratio;
        if (item.y + height > size.height) [height, width] = [size.height - item.y, (size.height - item.y) * ratio];
      }
      update(d.id, { width, height });
    }
  };

  const end = () => {
    drag.current = null;
  };

  const keyboard = (e: React.KeyboardEvent, item: Placed) => {
    const step = e.shiftKey ? 10 : 1;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (moves[e.key]) {
      e.preventDefault();
      const { w, h } = extent(item);
      update(item.id, { x: clampX(item.x + moves[e.key][0], w), y: clampY(item.y + moves[e.key][1], h) });
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      onChange(items.filter((i) => i.id !== item.id));
      onSelect(null);
    }
  };

  return (
    <PageView doc={pdf.doc} page={page} size={size} containerRef={container} onPointerDown={() => onSelect(null)} className="touch-none">
      {items
        .filter((i) => i.page === page)
        .map((item) => {
          const isSelected = item.id === selected;
          const common = {
            role: "button",
            tabIndex: 0,
            "aria-pressed": isSelected,
            onPointerDown: (e: React.PointerEvent) => start(e, item, "move"),
            onPointerMove: move,
            onPointerUp: end,
            onPointerCancel: end,
            onKeyDown: (e: React.KeyboardEvent) => keyboard(e, item),
            onFocus: () => onSelect(item.id),
            className: cn(
              "absolute cursor-move outline-none",
              isSelected ? "ring-2 ring-primary ring-offset-1" : "hover:ring-1 hover:ring-primary/60 focus-visible:ring-2 focus-visible:ring-ring",
            ),
          };
          const handle = isSelected && item.kind !== "text" && (
            <span
              aria-hidden
              onPointerDown={(e) => start(e, item, "resize")}
              onPointerMove={move}
              onPointerUp={end}
              onPointerCancel={end}
              className="absolute -right-2 -bottom-2 size-4 cursor-nwse-resize rounded-sm border-2 border-white bg-primary shadow"
            />
          );
          if (item.kind === "text") {
            return (
              <div
                key={item.id}
                {...common}
                aria-label={`Text: ${item.text}`}
                style={{
                  left: pct(item.x, size.width),
                  top: pct(item.y, size.height),
                  fontSize: previewFontSize(item.size, size.width),
                  fontFamily: FONT_CSS[item.font],
                  fontWeight: item.bold ? 700 : 400,
                  color: item.color,
                  lineHeight: 1.2,
                  whiteSpace: "pre",
                }}
              >
                {item.text || " "}
              </div>
            );
          }
          const box = { left: pct(item.x, size.width), top: pct(item.y, size.height), width: pct(item.width, size.width), height: pct(item.height, size.height) };
          if (item.kind === "image") {
            return (
              <div key={item.id} {...common} aria-label="Picture" style={box}>
                {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
                <img src={item.url} alt="" draggable={false} className="pointer-events-none size-full" />
                {handle}
              </div>
            );
          }
          return (
            <div key={item.id} {...common} aria-label={item.color === "#000000" ? "Redaction box" : "Box"} style={{ ...box, background: item.color, boxShadow: item.color === "#ffffff" ? "inset 0 0 0 1px rgb(0 0 0 / 0.15)" : undefined }}>
              {handle}
            </div>
          );
        })}
    </PageView>
  );
}

/** Turn placed items into PDF stamps. Text the PDF fonts can't show (e.g. Hindi) is drawn as a picture. */
export async function placedToStamps(items: Placed[]): Promise<Stamp[]> {
  const stamps: Stamp[] = [];
  for (const item of items) {
    if (item.kind === "box") stamps.push({ kind: "rect", page: item.page, x: item.x, y: item.y, width: item.width, height: item.height, color: item.color });
    else if (item.kind === "image") stamps.push({ kind: "image", page: item.page, image: item.png, x: item.x, y: item.y, width: item.width, height: item.height });
    else if (!item.text.trim()) continue;
    else if (isStandardFontText(item.text)) {
      stamps.push({ kind: "text", page: item.page, x: item.x, y: item.y, text: item.text, size: item.size, color: item.color, font: item.font, bold: item.bold });
    } else {
      const png = await textToPng(item.text, { fontFamily: FONT_CSS[item.font], sizePt: item.size, color: item.color, bold: item.bold });
      stamps.push({ kind: "image", page: item.page, image: png.bytes, x: item.x - png.padPt, y: item.y - png.padPt, width: png.widthPt, height: png.heightPt });
    }
  }
  return stamps;
}

export async function applyPlaced(bytes: Uint8Array, items: Placed[]) {
  return applyStamps(bytes, await placedToStamps(items));
}
