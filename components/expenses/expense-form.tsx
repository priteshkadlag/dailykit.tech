"use client";

import { useState } from "react";
import { z } from "zod";
import { toDateInputValue } from "@/lib/calculations/age";
import { CATEGORY_LABEL, EXPENSE_CATEGORIES, METHOD_LABEL, PAYMENT_METHODS, type Expense, type ExpenseCategory, type PaymentMethod } from "@/lib/expenses/model";
import { numberString, validateInputs } from "@/lib/validation/fields";
import { Button } from "@/components/ui/button";
import { DateField, NumberField, SegmentedControl, SelectField, TextField } from "@/components/shared/form-fields";

const schema = z.object({ amount: numberString({ min: 0, max: 1e10, exclusiveMin: true }) });

interface ExpenseFormProps {
  /** When set, the form edits this expense instead of adding a new one. */
  editing: Expense | null;
  /** Resolves true when saved; the form keeps its values otherwise. */
  onSubmit: (values: Omit<Expense, "id" | "createdAt">) => Promise<boolean>;
  onCancelEdit: () => void;
}

export function ExpenseForm({ editing, onSubmit, onCancelEdit }: ExpenseFormProps) {
  // Re-mount (via key in the parent) to load a different expense into the form.
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [category, setCategory] = useState<ExpenseCategory>(editing?.category ?? "food");
  const [date, setDate] = useState(editing?.date ?? toDateInputValue(new Date()));
  const [method, setMethod] = useState<PaymentMethod>(editing?.method ?? "upi");
  const [note, setNote] = useState(editing?.note ?? "");
  const [submitted, setSubmitted] = useState(false);

  const validation = validateInputs(schema, { amount });
  const amountError = validation.errors.amount ?? (submitted && amount.trim() === "" ? "Enter an amount" : undefined);
  const dateError = submitted && !date ? "Pick a date" : undefined;

  return (
    <form
      className="space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitted(true);
        if (!validation.ok || !date) return;
        const saved = await onSubmit({ amount: validation.data.amount, category, date, method, note: note.trim() });
        if (saved && !editing) {
          setAmount("");
          setNote("");
          setSubmitted(false);
        }
      }}
      noValidate
    >
      <h2 className="text-base font-semibold">{editing ? "Edit expense" : "Add expense"}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="Amount" prefix="₹" value={amount} onChange={setAmount} error={amountError} placeholder="0" autoFocus={!!editing} />
        <SelectField label="Category" value={category} onChange={setCategory} options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABEL[c] }))} />
        <DateField label="Date" value={date} onChange={setDate} error={dateError} />
        <TextField label="Note" value={note} onChange={setNote} placeholder="e.g. Office tea & snacks" maxLength={300} />
      </div>
      <SegmentedControl label="Paid by" value={method} onChange={setMethod} options={PAYMENT_METHODS.map((m) => ({ value: m, label: METHOD_LABEL[m] }))} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" className="h-11 flex-1 px-6 sm:flex-none">
          {editing ? "Update expense" : "Add expense"}
        </Button>
        {editing && (
          <Button type="button" variant="outline" className="h-11 px-5" onClick={onCancelEdit}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
