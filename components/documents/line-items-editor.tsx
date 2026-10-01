"use client";

import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from "lucide-react";
import { GST_RATES } from "@/lib/calculations/gst";
import type { LineTotals } from "@/lib/calculations/document";
import { newLineItem } from "@/lib/documents/model";
import { UNITS, type LineItem } from "@/lib/documents/types";
import { formatINR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { NumberField, SelectField, TextField } from "@/components/shared/form-fields";

const MAX_ITEMS = 100;

interface LineItemsEditorProps {
  items: LineItem[];
  /** Totals for filled rows only, in order — matched to rows by position among filled rows. */
  lineTotals: Map<string, LineTotals>;
  gst: boolean;
  errors: Record<string, string>;
  onChange: (items: LineItem[]) => void;
}

export function LineItemsEditor({ items, lineTotals, gst, errors, onChange }: LineItemsEditorProps) {
  const update = (index: number, patch: Partial<LineItem>) => onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const move = (index: number, delta: number) => {
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const totals = lineTotals.get(item.id);
        const err = (field: string) => errors[`items.${i}.${field}`];
        return (
          <div key={item.id} className="rounded-lg border bg-background p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-muted-foreground">Item {i + 1}</span>
              <div className="flex items-center">
                <Button type="button" variant="ghost" size="icon" className="size-9" aria-label={`Move item ${i + 1} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                  <ArrowUp />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="size-9" aria-label={`Move item ${i + 1} down`} disabled={i === items.length - 1} onClick={() => move(i, 1)}>
                  <ArrowDown />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9"
                  aria-label={`Duplicate item ${i + 1}`}
                  disabled={items.length >= MAX_ITEMS}
                  onClick={() => onChange([...items.slice(0, i + 1), { ...item, id: newLineItem().id }, ...items.slice(i + 1)])}
                >
                  <Copy />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 text-destructive hover:text-destructive"
                  aria-label={`Remove item ${i + 1}`}
                  disabled={items.length === 1}
                  onClick={() => onChange(items.filter((_, j) => j !== i))}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
              <TextField className="col-span-2 sm:col-span-4" label="Product / service" value={item.name} onChange={(name) => update(i, { name })} error={err("name")} placeholder="e.g. Cotton T-shirt" />
              <TextField className="sm:col-span-1" label="SKU" value={item.sku} onChange={(sku) => update(i, { sku })} />
              <TextField className="sm:col-span-1" label="HSN/SAC" value={item.hsn} onChange={(hsn) => update(i, { hsn })} inputMode="numeric" />
              <NumberField className="sm:col-span-1" label="Qty" value={item.qty} onChange={(qty) => update(i, { qty })} error={err("qty")} />
              <SelectField className="sm:col-span-1" label="Unit" value={item.unit} onChange={(unit) => update(i, { unit })} options={UNITS.map((u) => ({ value: u, label: u }))} />
              <NumberField className="sm:col-span-2" label="Rate" prefix="₹" value={item.rate} onChange={(rate) => update(i, { rate })} error={err("rate")} />
              <NumberField className="sm:col-span-1" label="Discount" suffix="%" value={item.discount} onChange={(discount) => update(i, { discount })} error={err("discount")} placeholder="0" />
              {gst ? (
                <SelectField
                  className="sm:col-span-1"
                  label="GST"
                  value={item.gstRate}
                  onChange={(gstRate) => update(i, { gstRate })}
                  error={err("gstRate")}
                  options={[...new Set([...GST_RATES.map(String), item.gstRate])].map((r) => ({ value: r, label: `${r}%` }))}
                />
              ) : (
                <div className="hidden sm:col-span-1 sm:block" />
              )}
            </div>
            {totals && (
              <div className="mt-3 flex flex-wrap justify-end gap-x-4 gap-y-1 border-t pt-3 text-sm tabular-nums">
                {totals.discount > 0 && <span className="text-muted-foreground">Discount −{formatINR(totals.discount)}</span>}
                {gst && <span className="text-muted-foreground">Taxable {formatINR(totals.taxable)}</span>}
                {gst && <span className="text-muted-foreground">GST {formatINR(totals.gst)}</span>}
                <span className="font-semibold">Amount {formatINR(totals.total)}</span>
              </div>
            )}
          </div>
        );
      })}
      {errors.items && <p className="text-sm font-medium text-destructive">{errors.items}</p>}
      <Button type="button" variant="outline" className="h-11 w-full border-dashed" disabled={items.length >= MAX_ITEMS} onClick={() => onChange([...items, newLineItem({ gstRate: items.at(-1)?.gstRate ?? "18", unit: items.at(-1)?.unit ?? "pcs" })])}>
        <Plus /> Add item
      </Button>
    </div>
  );
}
