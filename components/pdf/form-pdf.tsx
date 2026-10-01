"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { track } from "@/lib/analytics/client";
import { fillForm, isStandardFontText, readFormFields, type FormField } from "@/lib/pdf/edit";
import { CheckboxField, SelectField, TextAreaField, TextField } from "@/components/shared/form-fields";
import { ActionButton, baseName, FileBar, pdfBlob, PdfPicker, PdfResult, type OutputFile } from "./pdf-shell";
import { usePdf, type LoadedPdf } from "./use-pdf";

export function FillPdfForm() {
  const { pdf, loading, open, reset } = usePdf();
  if (!pdf) return <PdfPicker loading={loading} onFile={open} title="Choose a fillable PDF form" />;
  return <FormEditor key={pdf.file.name + pdf.file.lastModified} pdf={pdf} reset={reset} />;
}

/** "applicant.address_line1" → "Address line1" */
const friendly = (name: string) => {
  const last = name.split(".").pop() ?? name;
  const words = last.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\[\d+\]$/, "").trim();
  return words ? words[0].toUpperCase() + words.slice(1) : name;
};

function FormEditor({ pdf, reset }: { pdf: LoadedPdf; reset: () => void }) {
  const [fields, setFields] = useState<FormField[] | null>(null);
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [flatten, setFlatten] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<OutputFile[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    readFormFields(pdf.bytes)
      .then((list) => {
        if (cancelled) return;
        setFields(list);
        setValues(Object.fromEntries(list.map((f) => [f.name, f.value])));
      })
      .catch((error) => {
        if (cancelled) return;
        toast.error(error instanceof Error ? error.message : "Couldn't read this form.");
        setFields([]);
      });
    return () => {
      cancelled = true;
    };
  }, [pdf.bytes]);

  const set = (name: string, value: string | boolean) => {
    setValues((v) => ({ ...v, [name]: value }));
    setResult(null);
  };

  const errors = Object.fromEntries(
    (fields ?? []).filter((f) => f.type === "text" && !isStandardFontText(String(values[f.name] ?? ""))).map((f) => [f.name, "PDF forms can only show English letters, numbers and common symbols."]),
  );

  const save = async () => {
    setBusy(true);
    try {
      const bytes = await fillForm(pdf.bytes, values, flatten);
      setResult([{ name: `${baseName(pdf.file)}-${flatten ? "filled-flattened" : "filled"}.pdf`, blob: pdfBlob(bytes) }]);
      track("pdf_generated");
      toast.success("Your filled form is ready.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save the form.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <FileBar file={pdf.file} pages={pdf.doc.numPages} onReset={reset} disabled={busy} />
      {result && <PdfResult files={result} onReset={() => setResult(null)} resetLabel="Keep editing" />}
      {fields === null ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Reading form fields…
        </p>
      ) : fields.length === 0 ? (
        <section className="mx-auto max-w-xl space-y-2 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
          <h2 className="font-semibold">This PDF has no fillable fields</h2>
          <p className="text-sm text-muted-foreground">
            It&apos;s a flat document, so there&apos;s nothing to fill in here. Use{" "}
            <Link href="/edit-pdf" className="font-medium text-primary underline-offset-4 hover:underline">
              Edit PDF
            </Link>{" "}
            to type text anywhere on the page instead.
          </p>
        </section>
      ) : (
        <section className="mx-auto max-w-2xl space-y-5 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
          <h2 className="text-base font-semibold">
            {fields.length} field{fields.length === 1 ? "" : "s"} in this form
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => {
              const label = friendly(f.name);
              const hint = label !== f.name ? f.name : undefined;
              if (f.type === "checkbox") return <CheckboxField key={f.name} label={label} checked={values[f.name] === true} onChange={(v) => set(f.name, v)} className="sm:col-span-2" />;
              if (f.type === "text") {
                const props = { label, value: String(values[f.name] ?? ""), onChange: (v: string) => set(f.name, v), maxLength: f.maxLength, error: errors[f.name], hint };
                return f.multiline ? <TextAreaField key={f.name} {...props} className="sm:col-span-2" /> : <TextField key={f.name} {...props} />;
              }
              return (
                <SelectField
                  key={f.name}
                  label={label}
                  hint={hint}
                  value={String(values[f.name] ?? "")}
                  onChange={(v) => set(f.name, v)}
                  options={[{ value: "", label: "— Not selected —" }, ...f.options.map((o) => ({ value: o, label: o }))]}
                />
              );
            })}
          </div>
          <CheckboxField label="Flatten the form" checked={flatten} onChange={setFlatten} hint="Makes the answers part of the page so they can't be changed. Leave off to keep the form editable." />
          <div className="sm:max-w-xs">
            <ActionButton busy={busy} busyLabel="Saving…" disabled={Object.keys(errors).length > 0} onClick={save}>
              Save filled PDF
            </ActionButton>
          </div>
        </section>
      )}
    </div>
  );
}
