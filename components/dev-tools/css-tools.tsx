"use client";

import { useState } from "react";
import { ArrowDownUp, Check, Plus, Trash2, X } from "lucide-react";
import { contrastRatio, formatHsl, formatRgb, hslToRgb, parseColor, parseHex, parseHsl, parseRgb, rgbToHsl, toHex, wcagResults } from "@/lib/dev-tools/convert";
import { cn } from "@/lib/utils";
import { CheckboxField, NumberField, SegmentedControl, SelectField, TextField } from "@/components/shared/form-fields";
import { Button } from "@/components/ui/button";
import { CodeArea, CopyText, ErrorNote, Hint, Panel, TwoPane, ValueRows } from "@/components/dev-tools/shared";

/** A native color swatch plus a text field; the swatch drops alpha, the text keeps it. */
function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const parsed = parseColor(value);
  return (
    <div className="flex items-end gap-2">
      <input type="color" aria-label={`${label} picker`} value={parsed ? toHex({ ...parsed, a: 1 }) : "#000000"} onChange={(e) => onChange(e.target.value)} className="h-11 w-12 shrink-0 cursor-pointer rounded-lg border bg-background p-1" />
      <TextField label={label} value={value} onChange={onChange} className="flex-1" />
    </div>
  );
}

function Swatch({ color, className }: { color: string; className?: string }) {
  return <div className={cn("rounded-lg ring-1 ring-foreground/10 bg-[repeating-conic-gradient(#e5e7eb_0_25%,#fff_0_50%)] bg-[length:16px_16px]", className)}><div className="size-full rounded-lg" style={{ background: color }} /></div>;
}

// ---- Color conversion

export type ColorFrom = "hex" | "rgb" | "hsl";
const PLACEHOLDER: Record<ColorFrom, string> = { hex: "#1e40af", rgb: "rgb(30, 64, 175)", hsl: "hsl(226, 71%, 40%)" };

export function ColorConverter({ from }: { from: ColorFrom }) {
  const [input, setInput] = useState(PLACEHOLDER[from]);
  const parse = { hex: parseHex, rgb: parseRgb, hsl: (text: string) => { const hsl = parseHsl(text); return hsl ? hslToRgb(hsl) : null; } }[from];
  const color = input.trim() ? parse(input) : null;
  const hsl = color ? rgbToHsl(color) : null;
  const hex = color ? toHex(color) : "";
  const setHsl = (key: "h" | "s" | "l") => (value: number) => setInput(formatHsl({ ...hsl!, [key]: value }));
  return (
    <div className="space-y-4">
      <TwoPane
        left={<Panel title={`${from.toUpperCase()} color`}>
          <ColorInput label={`${from.toUpperCase()} value`} value={input} onChange={(v) => setInput(from === "hex" || !v.startsWith("#") ? v : { rgb: formatRgb(parseHex(v)!), hsl: formatHsl(rgbToHsl(parseHex(v)!)) }[from])} />
          {input.trim() && !color && <ErrorNote>{from === "hex" ? "Use 3, 4, 6 or 8 hex digits, e.g. #1e40af." : from === "rgb" ? "Use three numbers from 0 to 255, e.g. rgb(30, 64, 175) or 30 64 175, with optional alpha." : "Use hue 0–360 and saturation and lightness in %, e.g. hsl(226, 71%, 40%)."}</ErrorNote>}
          {from === "hsl" && hsl && <div className="space-y-3">
            {([["h", "Hue", 360], ["s", "Saturation", 100], ["l", "Lightness", 100]] as const).map(([key, name, max]) => (
              <label key={key} className="block space-y-1 text-sm"><span className="flex justify-between"><span className="font-medium">{name}</span><span className="tabular-nums text-muted-foreground">{hsl[key]}{key === "h" ? "°" : "%"}</span></span>
                <input type="range" min={0} max={max} value={hsl[key]} onChange={(e) => setHsl(key)(Number(e.target.value))} className="w-full accent-primary" /></label>
            ))}
          </div>}
        </Panel>}
        right={<Panel title="Result">
          {color ? <>
            <Swatch color={formatRgb(color)} className="h-24" />
            <ValueRows rows={[
              { label: "HEX", value: hex, mono: true },
              { label: "RGB", value: formatRgb(color), mono: true },
              { label: "HSL", value: formatHsl(hsl!), mono: true },
              { label: "CSS variable", value: `--color: ${hex};`, mono: true },
              { label: "Tailwind", value: `bg-[${hex}]`, mono: true },
            ]} />
          </> : <Hint>Enter a color to convert it.</Hint>}
        </Panel>}
      />
    </div>
  );
}

// ---- Contrast

export function ContrastChecker() {
  const [fg, setFg] = useState("#1f2937");
  const [bg, setBg] = useState("#ffffff");
  const fgColor = parseColor(fg);
  const bgColor = parseColor(bg);
  const ratio = fgColor && bgColor ? contrastRatio(fgColor, { ...bgColor, a: 1 }) : null;
  // Nudge lightness until the pair passes AA for normal text.
  const suggestion = (() => {
    if (!fgColor || !bgColor || !ratio || ratio >= 4.5) return null;
    const hsl = rgbToHsl(fgColor);
    const bgDark = rgbToHsl(bgColor).l < 50;
    for (let l = hsl.l; l >= 0 && l <= 100; l += bgDark ? 1 : -1) {
      const candidate = hslToRgb({ ...hsl, l, a: 1 });
      if (contrastRatio(candidate, { ...bgColor, a: 1 }) >= 4.5) return toHex(candidate);
    }
    return null;
  })();
  return (
    <div className="space-y-4">
      <Panel>
        <div className="grid items-end gap-4 sm:grid-cols-[1fr_auto_1fr]">
          <ColorInput label="Text color" value={fg} onChange={setFg} />
          <Button variant="outline" size="icon-lg" aria-label="Swap colors" onClick={() => { setFg(bg); setBg(fg); }}><ArrowDownUp /></Button>
          <ColorInput label="Background color" value={bg} onChange={setBg} />
        </div>
        {(!fgColor || !bgColor) && <ErrorNote>Enter both colors as HEX, rgb() or hsl().</ErrorNote>}
      </Panel>
      {ratio && fgColor && bgColor && <TwoPane
        left={<Panel title="Preview"><div className="space-y-2 rounded-lg p-6 ring-1 ring-foreground/10" style={{ background: formatRgb(bgColor), color: formatRgb(fgColor) }}><p className="text-2xl font-bold">Large heading text</p><p className="text-base">Normal body text should be easy to read for everyone, including people with low vision.</p><p className="text-sm">Small print and captions.</p></div></Panel>}
        right={<Panel title={<>Contrast ratio <span className="tabular-nums">{ratio.toFixed(2)}:1</span></>}>
          <ul className="divide-y rounded-lg border">{wcagResults(ratio).map((r) => (
            <li key={`${r.level}-${r.size}`} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
              <span><b>WCAG {r.level}</b> · {r.size} <span className="text-muted-foreground">(needs {r.needed}:1)</span></span>
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", r.pass ? "bg-accent text-accent-foreground" : "bg-destructive/10 text-destructive")}>{r.pass ? <Check className="size-3.5" /> : <X className="size-3.5" />}{r.pass ? "Pass" : "Fail"}</span>
            </li>
          ))}</ul>
          {suggestion && <div className="flex flex-wrap items-center gap-2 text-sm"><Swatch color={suggestion} className="size-8" /><span>Closest passing text color: <code className="font-mono">{suggestion}</code></span><Button variant="outline" size="sm" onClick={() => setFg(suggestion)}>Use it</Button></div>}
          <Hint>Large text is at least 24 px, or 18.5 px bold. Translucent text colors are blended over the background before measuring.</Hint>
        </Panel>}
      />}
    </div>
  );
}

// ---- Gradient

type Stop = { color: string; position: number };

export function GradientGenerator() {
  const [kind, setKind] = useState<"linear" | "radial" | "conic">("linear");
  const [angle, setAngle] = useState(135);
  const [shape, setShape] = useState<"circle" | "ellipse">("circle");
  const [stops, setStops] = useState<Stop[]>([{ color: "#1e40af", position: 0 }, { color: "#38bdf8", position: 100 }]);
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  const list = sorted.map((s) => `${s.color} ${s.position}%`).join(", ");
  const gradient = kind === "linear" ? `linear-gradient(${angle}deg, ${list})` : kind === "radial" ? `radial-gradient(${shape} at center, ${list})` : `conic-gradient(from ${angle}deg at center, ${list})`;
  const css = `background: ${sorted[0]?.color ?? "#000"};\nbackground: ${gradient};`;
  const setStop = (index: number, patch: Partial<Stop>) => setStops((all) => all.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  return (
    <TwoPane
      left={<Panel title="Gradient">
        <SegmentedControl label="Type" value={kind} onChange={setKind} options={[{ value: "linear", label: "Linear" }, { value: "radial", label: "Radial" }, { value: "conic", label: "Conic" }]} />
        {kind !== "radial" ? <label className="block space-y-1 text-sm"><span className="flex justify-between font-medium">Angle <span className="tabular-nums text-muted-foreground">{angle}°</span></span><input type="range" min={0} max={360} value={angle} onChange={(e) => setAngle(Number(e.target.value))} className="w-full accent-primary" /></label>
          : <SegmentedControl label="Shape" value={shape} onChange={setShape} options={[{ value: "circle", label: "Circle" }, { value: "ellipse", label: "Ellipse" }]} />}
        <div className="space-y-3">
          {stops.map((stop, i) => (
            <div key={i} className="grid grid-cols-[1fr_6rem_auto] items-end gap-2">
              <ColorInput label={`Color ${i + 1}`} value={stop.color} onChange={(color) => setStop(i, { color })} />
              <NumberField label="Position %" value={String(stop.position)} onChange={(v) => setStop(i, { position: Math.min(100, Math.max(0, Number(v) || 0)) })} />
              <Button variant="ghost" size="icon-lg" aria-label={`Remove color ${i + 1}`} disabled={stops.length <= 2} onClick={() => setStops((all) => all.filter((_, j) => j !== i))}><Trash2 /></Button>
            </div>
          ))}
          <Button variant="outline" onClick={() => setStops((all) => [...all, { color: "#f472b6", position: 50 }])} disabled={stops.length >= 8}><Plus /> Add color</Button>
        </div>
      </Panel>}
      right={<Panel title="Preview & CSS" actions={<CopyText text={css} label="Copy CSS" />}>
        <div className="h-56 rounded-xl ring-1 ring-foreground/10" style={{ background: gradient }} />
        <CodeArea label="CSS" hideLabel readOnly value={css} rows={3} />
        <Hint>The first line is a solid fallback for very old browsers.</Hint>
      </Panel>}
    />
  );
}

// ---- Box shadow

type Shadow = { x: number; y: number; blur: number; spread: number; color: string; opacity: number; inset: boolean };
const SHADOW_PRESETS: Record<string, Shadow[]> = {
  Soft: [{ x: 0, y: 1, blur: 3, spread: 0, color: "#000000", opacity: 10, inset: false }, { x: 0, y: 8, blur: 24, spread: -4, color: "#000000", opacity: 12, inset: false }],
  Card: [{ x: 0, y: 4, blur: 6, spread: -1, color: "#000000", opacity: 10, inset: false }, { x: 0, y: 2, blur: 4, spread: -2, color: "#000000", opacity: 10, inset: false }],
  Floating: [{ x: 0, y: 20, blur: 25, spread: -5, color: "#000000", opacity: 10, inset: false }, { x: 0, y: 8, blur: 10, spread: -6, color: "#000000", opacity: 10, inset: false }],
  Inset: [{ x: 0, y: 2, blur: 4, spread: 0, color: "#000000", opacity: 15, inset: true }],
  Glow: [{ x: 0, y: 0, blur: 24, spread: 4, color: "#3b82f6", opacity: 45, inset: false }],
};

export function BoxShadowGenerator() {
  const [layers, setLayers] = useState<Shadow[]>(SHADOW_PRESETS.Soft);
  const [radius, setRadius] = useState(12);
  const value = layers.map((l) => { const c = parseHex(l.color) ?? { r: 0, g: 0, b: 0, a: 1 }; return `${l.inset ? "inset " : ""}${l.x}px ${l.y}px ${l.blur}px ${l.spread}px rgba(${c.r}, ${c.g}, ${c.b}, ${l.opacity / 100})`; }).join(",\n    ");
  const css = `box-shadow: ${value};`;
  const set = (index: number, patch: Partial<Shadow>) => setLayers((all) => all.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  const slider = (index: number, key: "x" | "y" | "blur" | "spread" | "opacity", label: string, min: number, max: number) => (
    <label className="block space-y-1 text-sm"><span className="flex justify-between"><span>{label}</span><span className="tabular-nums text-muted-foreground">{layers[index][key]}{key === "opacity" ? "%" : "px"}</span></span>
      <input type="range" min={min} max={max} value={layers[index][key]} onChange={(e) => set(index, { [key]: Number(e.target.value) })} className="w-full accent-primary" /></label>
  );
  return (
    <TwoPane
      left={<Panel title="Shadow layers">
        <SelectField label="Preset" value="" onChange={(name) => name && setLayers(SHADOW_PRESETS[name])} options={[{ value: "", label: "Start from a preset…" }, ...Object.keys(SHADOW_PRESETS).map((name) => ({ value: name, label: name }))]} />
        {layers.map((layer, i) => (
          <fieldset key={i} className="space-y-3 rounded-lg border p-3">
            <legend className="px-1 text-sm font-medium">Layer {i + 1}</legend>
            <div className="grid gap-3 sm:grid-cols-2">{slider(i, "x", "Horizontal offset", -50, 50)}{slider(i, "y", "Vertical offset", -50, 50)}{slider(i, "blur", "Blur", 0, 100)}{slider(i, "spread", "Spread", -50, 50)}{slider(i, "opacity", "Opacity", 0, 100)}
              <ColorInput label="Color" value={layer.color} onChange={(color) => set(i, { color })} /></div>
            <div className="flex items-center justify-between"><CheckboxField label="Inset" checked={layer.inset} onChange={(inset) => set(i, { inset })} /><Button variant="ghost" disabled={layers.length <= 1} onClick={() => setLayers((all) => all.filter((_, j) => j !== i))}><Trash2 /> Remove</Button></div>
          </fieldset>
        ))}
        <Button variant="outline" disabled={layers.length >= 5} onClick={() => setLayers((all) => [...all, { x: 0, y: 4, blur: 12, spread: 0, color: "#000000", opacity: 15, inset: false }])}><Plus /> Add layer</Button>
      </Panel>}
      right={<Panel title="Preview & CSS" actions={<CopyText text={css} label="Copy CSS" />}>
        <div className="flex h-64 items-center justify-center rounded-xl bg-muted/50"><div className="size-36 bg-white" style={{ boxShadow: value.replace(/\n\s*/g, " "), borderRadius: radius }} /></div>
        <label className="block space-y-1 text-sm"><span className="flex justify-between">Preview corner radius <span className="tabular-nums text-muted-foreground">{radius}px</span></span><input type="range" min={0} max={72} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-full accent-primary" /></label>
        <CodeArea label="CSS" hideLabel readOnly value={css} rows={layers.length + 1} />
      </Panel>}
    />
  );
}

// ---- Border radius

type Corner = "topLeft" | "topRight" | "bottomRight" | "bottomLeft";
const CORNERS: { key: Corner; label: string }[] = [{ key: "topLeft", label: "Top left" }, { key: "topRight", label: "Top right" }, { key: "bottomRight", label: "Bottom right" }, { key: "bottomLeft", label: "Bottom left" }];

export function BorderRadiusGenerator() {
  const [unit, setUnit] = useState<"px" | "%">("px");
  const [linked, setLinked] = useState(false);
  const [elliptical, setElliptical] = useState(false);
  const [h, setH] = useState<Record<Corner, number>>({ topLeft: 24, topRight: 24, bottomRight: 24, bottomLeft: 24 });
  const [v, setV] = useState<Record<Corner, number>>({ topLeft: 24, topRight: 24, bottomRight: 24, bottomLeft: 24 });
  const max = unit === "%" ? 50 : 150;
  const shorten = (values: number[]) => {
    const [a, b, c, d] = values.map((n) => `${n}${n ? unit : ""}`);
    if (a === b && b === c && c === d) return a;
    if (a === c && b === d) return `${a} ${b}`;
    if (b === d) return `${a} ${b} ${c}`;
    return `${a} ${b} ${c} ${d}`;
  };
  const order = CORNERS.map((c) => c.key);
  const value = elliptical ? `${shorten(order.map((k) => h[k]))} / ${shorten(order.map((k) => v[k]))}` : shorten(order.map((k) => h[k]));
  const setCorner = (setter: typeof setH, corner: Corner) => (n: number) => setter((current) => (linked ? { topLeft: n, topRight: n, bottomRight: n, bottomLeft: n } : { ...current, [corner]: n }));
  const slider = (label: string, n: number, onChange: (n: number) => void) => (
    <label className="block space-y-1 text-sm"><span className="flex justify-between"><span>{label}</span><span className="tabular-nums text-muted-foreground">{n}{unit}</span></span><input type="range" min={0} max={max} value={Math.min(n, max)} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-primary" /></label>
  );
  return (
    <TwoPane
      left={<Panel title="Corners">
        <div className="flex flex-wrap items-end gap-4"><SegmentedControl label="Unit" value={unit} onChange={(u) => { setUnit(u); const reset = u === "%" ? 25 : 24; setH({ topLeft: reset, topRight: reset, bottomRight: reset, bottomLeft: reset }); setV({ topLeft: reset, topRight: reset, bottomRight: reset, bottomLeft: reset }); }} options={[{ value: "px", label: "px" }, { value: "%", label: "%" }]} />
          <CheckboxField label="Same for all corners" checked={linked} onChange={setLinked} className="pb-2" /><CheckboxField label="Elliptical corners" checked={elliptical} onChange={setElliptical} className="pb-2" /></div>
        <div className="grid gap-4 sm:grid-cols-2">{CORNERS.map((corner) => (
          <fieldset key={corner.key} className="space-y-2 rounded-lg border p-3"><legend className="px-1 text-sm font-medium">{corner.label}</legend>
            {slider(elliptical ? "Horizontal" : "Radius", h[corner.key], setCorner(setH, corner.key))}
            {elliptical && slider("Vertical", v[corner.key], setCorner(setV, corner.key))}
          </fieldset>
        ))}</div>
        <Button variant="outline" onClick={() => { setUnit("%"); setElliptical(true); setH({ topLeft: 30, topRight: 70, bottomRight: 70, bottomLeft: 30 }); setV({ topLeft: 30, topRight: 30, bottomRight: 70, bottomLeft: 70 }); }}>Try a blob shape</Button>
      </Panel>}
      right={<Panel title="Preview & CSS" actions={<CopyText text={`border-radius: ${value};`} label="Copy CSS" />}>
        <div className="flex h-72 items-center justify-center rounded-xl bg-muted/50"><div className="h-48 w-60 bg-gradient-to-br from-primary to-sky-400 shadow-lg" style={{ borderRadius: value }} /></div>
        <CodeArea label="CSS" hideLabel readOnly value={`border-radius: ${value};`} rows={2} />
      </Panel>}
    />
  );
}
