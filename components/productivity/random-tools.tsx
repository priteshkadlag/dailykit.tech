"use client";

import { useState } from "react";
import { Dices, RotateCcw, Shuffle } from "lucide-react";
import { parseEntries, pickRandom, secureRandomInt, secureShuffle, wheelRotation } from "@/lib/calculations/random";
import { cn } from "@/lib/utils";
import { CheckboxField, NumberField, SegmentedControl, TextAreaField } from "@/components/shared/form-fields";
import { CopyButton } from "@/components/shared/result-actions";
import { Button } from "@/components/ui/button";

const FLIP_MS = 1100;

// ---- Coin flip

type Side = "heads" | "tails";

function Coin({ rotation, flipping }: { rotation: number; flipping: boolean }) {
  const face = "absolute inset-0 flex flex-col items-center justify-center rounded-full border-4 text-3xl font-bold shadow-inner [backface-visibility:hidden]";
  return (
    <div className="mx-auto size-40 perspective-midrange sm:size-48" aria-hidden>
      <div className="relative size-full transform-3d" style={{ transform: `rotateY(${rotation}deg)`, transition: flipping ? `transform ${FLIP_MS}ms cubic-bezier(0.2, 0.7, 0.2, 1)` : "none" }}>
        <div className={cn(face, "border-amber-500 bg-linear-to-br from-amber-200 via-amber-300 to-amber-500 text-amber-900")}>₹<span className="text-sm font-semibold uppercase tracking-widest">Heads</span></div>
        <div className={cn(face, "border-slate-400 bg-linear-to-br from-slate-100 via-slate-300 to-slate-400 text-slate-800 transform-[rotateY(180deg)]")}>1<span className="text-sm font-semibold uppercase tracking-widest">Tails</span></div>
      </div>
    </div>
  );
}

export function CoinFlip() {
  const [rotation, setRotation] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<Side | null>(null);
  const [history, setHistory] = useState<Side[]>([]);
  const [count, setCount] = useState("1");
  const [batch, setBatch] = useState<Side[] | null>(null);

  const flip = () => {
    if (flipping) return;
    const n = Math.min(100, Math.max(1, Math.floor(Number(count)) || 1));
    const sides = Array.from({ length: n }, (): Side => (secureRandomInt(2) ? "tails" : "heads"));
    const first = sides[0];
    // Spin several whole turns and stop on the right face (0° = heads, 180° = tails).
    const base = rotation - (rotation % 360) + 1800;
    setRotation(base + (first === "tails" ? 180 : 0));
    setFlipping(true);
    setResult(null);
    window.setTimeout(() => {
      setFlipping(false);
      setResult(first);
      setBatch(n > 1 ? sides : null);
      setHistory((h) => [...sides, ...h].slice(0, 500));
    }, FLIP_MS);
  };
  const heads = history.filter((s) => s === "heads").length;
  const tails = history.length - heads;
  const batchHeads = batch?.filter((s) => s === "heads").length ?? 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <section className="space-y-6 rounded-xl bg-card p-6 text-center ring-1 ring-foreground/10 sm:p-8" aria-label="Coin">
        <Coin rotation={rotation} flipping={flipping} />
        <p className="min-h-9 text-3xl font-bold" aria-live="polite">{flipping ? "Flipping…" : result ? (result === "heads" ? "Heads!" : "Tails!") : "Ready"}</p>
        {batch && !flipping && <p className="text-sm text-muted-foreground">{batch.length} coins: {batchHeads} heads, {batch.length - batchHeads} tails</p>}
        <div className="flex flex-wrap items-end justify-center gap-3">
          <NumberField label="Coins per flip" value={count} onChange={setCount} className="w-36 text-left" />
          <Button size="lg" className="h-11 px-8" onClick={flip} disabled={flipping}>Flip {Number(count) > 1 ? `${Math.min(100, Math.floor(Number(count)))} coins` : "the coin"}</Button>
        </div>
      </section>
      <aside className="space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10" aria-label="Results so far">
        <div className="flex items-center justify-between"><h2 className="font-semibold">Results so far</h2><Button variant="ghost" size="sm" onClick={() => { setHistory([]); setResult(null); setBatch(null); }} disabled={!history.length}><RotateCcw /> Clear</Button></div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-lg bg-amber-100 p-3 text-amber-900 dark:bg-amber-950 dark:text-amber-100"><p className="text-2xl font-bold tabular-nums">{heads}</p><p className="text-xs">Heads {history.length ? `· ${Math.round((heads / history.length) * 100)}%` : ""}</p></div>
          <div className="rounded-lg bg-muted p-3"><p className="text-2xl font-bold tabular-nums">{tails}</p><p className="text-xs">Tails {history.length ? `· ${Math.round((tails / history.length) * 100)}%` : ""}</p></div>
        </div>
        {history.length > 0 && <p className="flex flex-wrap gap-1 text-xs" aria-label="Recent flips, newest first">{history.slice(0, 60).map((s, i) => <span key={i} className={cn("rounded px-1.5 py-0.5 font-mono", s === "heads" ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100" : "bg-muted")}>{s === "heads" ? "H" : "T"}</span>)}</p>}
        <p className="text-xs text-muted-foreground">Each flip uses your browser&apos;s cryptographic random number generator, so heads and tails are exactly 50/50.</p>
      </aside>
    </div>
  );
}

// ---- Random picker / wheel

const SAMPLE = "Asha\nRavi\nMeera\nKabir\nZoya\nArjun";
const SPIN_MS = 4500;
const segmentColor = (i: number, n: number) => `hsl(${Math.round((i * 360) / n + 200) % 360} 75% ${i % 2 ? 72 : 64}%)`;

function Wheel({ entries, rotation, spinning }: { entries: string[]; rotation: number; spinning: boolean }) {
  const n = entries.length;
  const r = 100;
  // Rounded: Math.sin/cos can differ in the last digits between the server and the browser, which breaks hydration.
  const round = (n: number) => Math.round(n * 1000) / 1000;
  const point = (angle: number) => [round(r + r * Math.sin((angle * Math.PI) / 180)), round(r - r * Math.cos((angle * Math.PI) / 180))];
  return (
    <div className="relative mx-auto aspect-square w-full max-w-md">
      <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1 border-x-14 border-t-26 border-x-transparent border-t-foreground drop-shadow" aria-hidden />
      <svg viewBox="-4 -4 208 208" className="size-full drop-shadow-md" role="img" aria-label={`Wheel with ${n} entries`}>
        <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: "100px 100px", transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.15, 0.85, 0.25, 1)` : "none" }}>
          {n === 1 ? <circle cx={r} cy={r} r={r} fill={segmentColor(0, 1)} /> : entries.map((entry, i) => {
            const a0 = (i * 360) / n;
            const a1 = ((i + 1) * 360) / n;
            const [x0, y0] = point(a0);
            const [x1, y1] = point(a1);
            return <path key={i} d={`M${r} ${r} L${x0} ${y0} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1} Z`} fill={segmentColor(i, n)} stroke="white" strokeWidth={0.8} />;
          })}
          {entries.map((entry, i) => {
            const mid = ((i + 0.5) * 360) / n;
            const label = entry.length > 16 ? `${entry.slice(0, 15)}…` : entry;
            return (
              <text key={i} x={r} y={r} transform={`rotate(${mid - 90} ${r} ${r}) translate(${r * 0.92} 0)`} textAnchor="end" dominantBaseline="middle" fontSize={n > 24 ? 5 : n > 12 ? 7 : 9} fontWeight={600} fill="#1f2937">{label}</text>
            );
          })}
          <circle cx={r} cy={r} r={10} fill="white" stroke="#1f2937" strokeWidth={1.5} />
        </g>
      </svg>
    </div>
  );
}

export function RandomPicker() {
  const [text, setText] = useState(SAMPLE);
  const [mode, setMode] = useState<"wheel" | "list">("wheel");
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [removeWinner, setRemoveWinner] = useState(false);
  const [howMany, setHowMany] = useState("2");
  const [picked, setPicked] = useState<string[] | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const entries = parseEntries(text);
  const shown = entries.slice(0, 100);

  const spin = () => {
    if (spinning || shown.length < 2) return;
    const index = secureRandomInt(shown.length);
    const jitter = 0.15 + (secureRandomInt(70) / 100);
    setWinner(null);
    setSpinning(true);
    setRotation((current) => wheelRotation(current, index, shown.length, 6, jitter));
    window.setTimeout(() => {
      const chosen = shown[index];
      setSpinning(false);
      setWinner(chosen);
      setHistory((h) => [chosen, ...h].slice(0, 50));
      if (removeWinner) {
        // Remove only the first matching line so duplicate names stay.
        const lines = text.split(/\r?\n/);
        const at = lines.findIndex((l) => l.trim() === chosen);
        if (at >= 0) { lines.splice(at, 1); setText(lines.join("\n")); }
      }
    }, SPIN_MS + 100);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <section className="space-y-5 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6" aria-label="Picker">
        <SegmentedControl label="Mode" hideLabel value={mode} onChange={setMode} options={[{ value: "wheel", label: "Spin the wheel" }, { value: "list", label: "Pick several / shuffle" }]} />
        {mode === "wheel" ? (
          <>
            {shown.length >= 2 ? <Wheel entries={shown} rotation={rotation} spinning={spinning} /> : <p className="py-16 text-center text-muted-foreground">Add at least two entries to spin the wheel.</p>}
            <p className="min-h-9 text-center text-2xl font-bold" aria-live="polite">{spinning ? "Spinning…" : winner ? `🎉 ${winner}` : ""}</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" className="h-11 px-10" onClick={spin} disabled={spinning || shown.length < 2}><Dices /> Spin</Button>
              <CheckboxField label="Remove the winner after each spin" checked={removeWinner} onChange={setRemoveWinner} />
            </div>
            {entries.length > 100 && <p className="text-center text-xs text-muted-foreground">The wheel shows the first 100 entries.</p>}
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <NumberField label="How many to pick" value={howMany} onChange={setHowMany} className="w-40" />
              <Button className="h-11" disabled={!entries.length} onClick={() => setPicked(pickRandom(entries, Math.max(1, Math.floor(Number(howMany)) || 1)))}><Dices /> Pick</Button>
              <Button className="h-11" variant="outline" disabled={entries.length < 2} onClick={() => setPicked(secureShuffle(entries))}><Shuffle /> Shuffle all</Button>
            </div>
            {picked && (
              <div className="space-y-3">
                <ol className="list-decimal space-y-1 rounded-lg bg-muted/50 py-3 pl-10 pr-4">{picked.map((p, i) => <li key={i} className="font-medium">{p}</li>)}</ol>
                <CopyButton text={picked.map((p, i) => `${i + 1}. ${p}`).join("\n")} saveable={false} />
              </div>
            )}
            <p className="text-xs text-muted-foreground">Picks never repeat an entry, and every entry has the same chance.</p>
          </div>
        )}
      </section>
      <aside className="space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10" aria-label="Entries">
        <TextAreaField label={`Entries (${entries.length})`} value={text} onChange={setText} rows={12} placeholder="One per line, or separated by commas" />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={entries.length < 2} onClick={() => setText(secureShuffle(entries).join("\n"))}><Shuffle /> Shuffle list</Button>
          <Button variant="ghost" size="sm" onClick={() => { setText(""); setWinner(null); setPicked(null); }}>Clear</Button>
        </div>
        {history.length > 0 && <div className="space-y-1 border-t pt-3 text-sm"><h3 className="font-semibold">Previous winners</h3><p className="text-muted-foreground">{history.join(", ")}</p></div>}
      </aside>
    </div>
  );
}
