"use client";

import { useState } from "react";
import { ArrowDownUp, Plus, Trash2 } from "lucide-react";
import { PERCENT_FORMULAS, TEN_POINT_GRADES, cgpaToPercent, weightedAverage, type PercentFormula } from "@/lib/calculations/education";
import { UNIT_CATEGORIES, convertUnit, formatUnitValue } from "@/lib/calculations/units";
import { formatNumber, parseNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { NumberField, SegmentedControl, SelectField } from "@/components/shared/form-fields";
import { CopyButton, ResetButton } from "@/components/shared/result-actions";
import { CalculatorLayout, EmptyResult, InputCard, ResultCard, ResultRows } from "@/components/shared/result-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const round2 = (n: number) => formatNumber(Math.round(n * 100) / 100);

// ---- CGPA

interface Row { id: number; name: string; points: string; credits: string }
type CgpaMode = "semesters" | "subjects";
let nextId = 100;
const semesterRows = (): Row[] => [1, 2, 3, 4].map((n) => ({ id: n, name: `Semester ${n}`, points: "", credits: "" }));
const subjectRows = (): Row[] => [1, 2, 3, 4, 5].map((n) => ({ id: n, name: `Subject ${n}`, points: "", credits: "" }));

export function CgpaCalculator() {
  const [mode, setMode] = useState<CgpaMode>("semesters");
  const [rows, setRows] = useState<Row[]>(semesterRows);
  const [scale, setScale] = useState<"10" | "4">("10");
  const [formula, setFormula] = useState<PercentFormula>("x9.5");
  const max = Number(scale);
  const update = (id: number, patch: Partial<Row>) => setRows((list) => list.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const switchMode = (next: CgpaMode) => { setMode(next); setRows(next === "semesters" ? semesterRows() : subjectRows()); };

  const filled = rows.filter((r) => r.points.trim());
  const parsed = filled.map((r) => ({ points: parseNumber(r.points), credits: r.credits.trim() ? parseNumber(r.credits) : NaN }));
  const badPoints = parsed.some((p) => !Number.isFinite(p.points) || p.points < 0 || p.points > max);
  const badCredits = parsed.some((p) => !Number.isNaN(p.credits) && (!Number.isFinite(p.credits) || p.credits < 0));
  // Without credits, each semester counts equally (a simple average).
  const useCredits = parsed.length > 0 && parsed.every((p) => Number.isFinite(p.credits));
  const missingCredits = parsed.some((p) => !Number.isFinite(p.credits)) && (mode === "subjects" || parsed.some((p) => Number.isFinite(p.credits)));
  const result = parsed.length && !badPoints && !badCredits && !missingCredits ? weightedAverage(parsed.map((p) => ({ points: p.points, credits: useCredits ? p.credits : 1 }))) : null;
  const percent = result ? cgpaToPercent(result.average, formula, max) : 0;
  const label = mode === "semesters" ? "CGPA" : "SGPA";
  const summary = result ? `${label}: ${result.average.toFixed(2)} / ${max} ≈ ${round2(percent)}% (${PERCENT_FORMULAS.find((f) => f.id === formula)!.name}).` : "";
  const error = badPoints ? `Each ${mode === "semesters" ? "SGPA" : "grade point"} must be between 0 and ${max}.` : badCredits ? "Credits must be positive numbers." : missingCredits ? (mode === "subjects" ? "Enter the credits for every subject." : "Enter credits for every semester, or leave them all blank for a simple average.") : undefined;

  return (
    <CalculatorLayout
      inputs={<InputCard title={mode === "semesters" ? "Semester results" : "Subject grades"}>
        <SegmentedControl label="Calculate" value={mode} onChange={switchMode} options={[{ value: "semesters", label: "CGPA from semesters" }, { value: "subjects", label: "SGPA from subjects" }]} />
        <SegmentedControl label="Grading scale" value={scale} onChange={setScale} options={[{ value: "10", label: "10-point" }, { value: "4", label: "4-point" }]} />
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_6rem_6rem_2.25rem] gap-2 text-xs font-medium text-muted-foreground">
            <span>{mode === "semesters" ? "Semester" : "Subject"}</span><span>{mode === "semesters" ? "SGPA" : "Grade point"}</span><span>Credits{mode === "semesters" && " (optional)"}</span><span />
          </div>
          {rows.map((row) => (
            <div key={row.id} className="grid grid-cols-[1fr_6rem_6rem_2.25rem] items-center gap-2">
              <Input aria-label="Name" value={row.name} onChange={(e) => update(row.id, { name: e.target.value })} className="h-10" />
              {mode === "subjects" && scale === "10" ? (
                <select aria-label={`${row.name} grade`} value={row.points} onChange={(e) => update(row.id, { points: e.target.value })} className="h-10 rounded-lg border bg-background px-2 text-sm">
                  <option value="">Grade</option>
                  {TEN_POINT_GRADES.map((g) => <option key={g.grade} value={String(g.points)}>{g.grade} ({g.points})</option>)}
                </select>
              ) : (
                <Input aria-label={`${row.name} ${mode === "semesters" ? "SGPA" : "grade point"}`} inputMode="decimal" value={row.points} onChange={(e) => update(row.id, { points: e.target.value })} className="h-10" placeholder={`0–${max}`} />
              )}
              <Input aria-label={`${row.name} credits`} inputMode="decimal" value={row.credits} onChange={(e) => update(row.id, { credits: e.target.value })} className="h-10" placeholder={mode === "semesters" ? "—" : "4"} />
              <Button variant="ghost" size="icon" aria-label={`Remove ${row.name}`} disabled={rows.length === 1} onClick={() => setRows((list) => list.filter((r) => r.id !== row.id))}><Trash2 /></Button>
            </div>
          ))}
          <Button variant="outline" onClick={() => setRows((list) => [...list, { id: nextId++, name: `${mode === "semesters" ? "Semester" : "Subject"} ${list.length + 1}`, points: "", credits: "" }])}><Plus /> Add {mode === "semesters" ? "semester" : "subject"}</Button>
        </div>
        <SelectField label="Percentage formula" value={formula} onChange={setFormula} options={PERCENT_FORMULAS.map((f) => ({ value: f.id, label: `${f.name} — ${f.note}` }))} hint="Universities use different formulas — check your mark sheet or university rules" />
      </InputCard>}
      result={result ? (
        <ResultCard highlightLabel={`Your ${label}`} highlightValue={result.average.toFixed(2)} highlightCaption={`out of ${max} · about ${round2(percent)}%`}
          actions={<><CopyButton text={summary} /><ResetButton onReset={() => switchMode(mode)} /></>}>
          <ResultRows rows={[
            { label: mode === "semesters" ? "Semesters counted" : "Subjects counted", value: String(parsed.length) },
            ...(useCredits ? [{ label: "Total credits", value: formatNumber(result.credits) }, { label: "Total credit points", value: round2(result.points) }] : [{ label: "Method", value: "Simple average (no credits entered)" }]),
            { label: label, value: result.average.toFixed(2), emphasis: true },
            { label: "Equivalent percentage", value: `${round2(percent)}%`, emphasis: true },
          ]} />
          <div className="mt-4 border-t pt-4 text-sm">
            <h3 className="mb-2 font-semibold">Percentage by formula</h3>
            <ul className="space-y-1">
              {PERCENT_FORMULAS.map((f) => <li key={f.id} className={cn("flex justify-between gap-3 rounded-md px-2 py-1", f.id === formula && "bg-accent font-medium")}><span>{f.name} <span className="text-muted-foreground">({f.note})</span></span><span className="tabular-nums">{round2(cgpaToPercent(result.average, f.id, max))}%</span></li>)}
            </ul>
          </div>
        </ResultCard>
      ) : <EmptyResult message={error ?? (mode === "semesters" ? "Enter the SGPA of each semester (and credits, if you have them) to get your CGPA." : "Pick a grade and enter the credits for each subject to get your SGPA.")} />}
    />
  );
}

// ---- Unit converter

export function UnitConverter() {
  const [categoryId, setCategoryId] = useState("length");
  const category = UNIT_CATEGORIES.find((c) => c.id === categoryId)!;
  const [from, setFrom] = useState("km");
  const [to, setTo] = useState("mi");
  const [value, setValue] = useState("1");
  const fromUnit = category.units.find((u) => u.id === from) ?? category.units[0];
  const toUnit = category.units.find((u) => u.id === to) ?? category.units[1];
  const n = parseNumber(value);
  const valid = Number.isFinite(n);
  const result = valid ? convertUnit(n, fromUnit, toUnit) : NaN;
  const pick = (id: string) => {
    const next = UNIT_CATEGORIES.find((c) => c.id === id)!;
    setCategoryId(id);
    setFrom(next.units[0].id);
    setTo(next.units[1].id);
  };
  const options = category.units.map((u) => ({ value: u.id, label: `${u.name} (${u.symbol})` }));
  const line = valid ? `${formatUnitValue(n)} ${fromUnit.symbol} = ${formatUnitValue(result)} ${toUnit.symbol}` : "";

  return (
    <div className="space-y-6">
      <CalculatorLayout
        inputs={<InputCard title="Convert">
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Quantity">
            {UNIT_CATEGORIES.map((c) => (
              <button key={c.id} type="button" role="radio" aria-checked={c.id === categoryId} onClick={() => pick(c.id)}
                className={cn("min-h-9 rounded-full border px-3.5 text-sm font-medium transition-colors", c.id === categoryId ? "border-transparent bg-brand text-white shadow-sm" : "bg-background hover:bg-accent")}>{c.name}</button>
            ))}
          </div>
          <NumberField label="Value" value={value} onChange={setValue} error={value.trim() && !valid ? "Enter a valid number" : undefined} />
          <SelectField label="From" value={fromUnit.id} onChange={setFrom} options={options} />
          <Button variant="outline" onClick={() => { setFrom(toUnit.id); setTo(fromUnit.id); }}><ArrowDownUp /> Swap units</Button>
          <SelectField label="To" value={toUnit.id} onChange={setTo} options={options} />
        </InputCard>}
        result={valid ? (
          <ResultCard highlightLabel={`${formatUnitValue(n)} ${fromUnit.name.toLowerCase()}${n === 1 ? "" : "s"} is`} highlightValue={`${formatUnitValue(result)} ${toUnit.symbol}`} highlightCaption={toUnit.name}
            actions={<><CopyButton text={line} saveable={false} /><ResetButton onReset={() => setValue("1")} /></>}>
            <h3 className="mb-1 text-sm font-semibold">{formatUnitValue(n)} {fromUnit.symbol} in every {category.name.toLowerCase()} unit</h3>
            <ResultRows rows={category.units.filter((u) => u.id !== fromUnit.id).map((u) => ({ label: u.name, value: `${formatUnitValue(convertUnit(n, fromUnit, u))} ${u.symbol}`, emphasis: u.id === toUnit.id }))} />
          </ResultCard>
        ) : <EmptyResult message="Enter a value to convert." />}
      />
    </div>
  );
}
