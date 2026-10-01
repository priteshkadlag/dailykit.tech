"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, LockOpen } from "lucide-react";
import { toast } from "sonner";
import { track } from "@/lib/analytics/client";
import { formatBytes, type AcceptedFile } from "@/lib/files/validation";
import { pdfEdit } from "@/lib/pdf/lazy";
import { openPdf } from "@/lib/pdf/pdf-render";
import { Button } from "@/components/ui/button";
import { CheckboxField, TextField } from "@/components/shared/form-fields";
import { FileDropzone, PrivacyNote } from "@/components/files/file-dropzone";
import { ActionButton, baseName, FileBar, pdfBlob, PDF_RULES, PdfPicker, PdfResult, type OutputFile } from "./pdf-shell";
import { usePdf, type LoadedPdf } from "./use-pdf";

function Panel({ children }: { children: React.ReactNode }) {
  return <section className="mx-auto max-w-md space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">{children}</section>;
}

function PasswordInput({ label, value, onChange, error, hint, autoComplete }: { label: string; value: string; onChange: (v: string) => void; error?: string; hint?: string; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <TextField label={label} type={show ? "text" : "password"} value={value} onChange={onChange} error={error} hint={hint} autoComplete={autoComplete} />
      <Button type="button" variant="ghost" size="icon" className="absolute top-7 right-1 size-9" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"}>
        {show ? <EyeOff /> : <Eye />}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------- protect

export function ProtectPdf() {
  const { pdf, loading, open, reset } = usePdf();
  if (!pdf) return <PdfPicker loading={loading} onFile={open} />;
  return <Protector key={pdf.file.name + pdf.file.lastModified} pdf={pdf} reset={reset} />;
}

function Protector({ pdf, reset }: { pdf: LoadedPdf; reset: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [printing, setPrinting] = useState(true);
  const [copying, setCopying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<OutputFile[] | null>(null);

  const tooShort = password.length > 0 && password.length < 6;
  const mismatch = confirm.length > 0 && confirm !== password;

  const run = async () => {
    setBusy(true);
    try {
      const bytes = await (await pdfEdit()).protectPdf(pdf.bytes, { password, allowPrinting: printing, allowCopying: copying, allowEditing: editing });
      setResult([{ name: `${baseName(pdf.file)}-protected.pdf`, blob: pdfBlob(bytes) }]);
      track("pdf_generated");
      toast.success("Your PDF is now password-protected.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't protect this PDF.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <FileBar file={pdf.file} pages={pdf.doc.numPages} onReset={reset} disabled={busy} />
      {result ? (
        <PdfResult files={result} note="Protected with AES-256. Keep the password safe — it can't be recovered if you forget it." onReset={() => setResult(null)} resetLabel="Change settings" />
      ) : (
        <Panel>
          <PasswordInput label="Password to open the PDF" value={password} onChange={setPassword} autoComplete="new-password" error={tooShort ? "Use at least 6 characters." : undefined} hint="Longer is stronger — a short sentence works well." />
          <PasswordInput label="Type it again" value={confirm} onChange={setConfirm} autoComplete="new-password" error={mismatch ? "The passwords don't match." : undefined} />
          <fieldset className="space-y-3">
            <legend className="mb-2 text-sm font-medium">After opening, people can:</legend>
            <CheckboxField label="Print" checked={printing} onChange={setPrinting} />
            <CheckboxField label="Copy text and images" checked={copying} onChange={setCopying} />
            <CheckboxField label="Edit, annotate and rearrange pages" checked={editing} onChange={setEditing} />
          </fieldset>
          <p className="text-xs text-muted-foreground">Permissions are honoured by standard PDF readers (Adobe, Chrome, Edge…).</p>
          <ActionButton busy={busy} busyLabel="Encrypting…" disabled={password.length < 6 || confirm !== password} onClick={run}>
            <Lock /> Protect PDF
          </ActionButton>
        </Panel>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- unlock

/** Unlock has its own picker: a locked PDF can't be opened for a preview without its password. */
export function UnlockPdf() {
  const [file, setFile] = useState<{ file: File; bytes: Uint8Array; restrictionsOnly: boolean } | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<OutputFile[] | null>(null);

  const choose = async ([f]: AcceptedFile[]) => {
    setBusy(true);
    try {
      const bytes = new Uint8Array(await f.file.arrayBuffer());
      if (!(await (await pdfEdit()).isEncrypted(bytes))) {
        toast.info("This PDF isn't password-protected — there's nothing to unlock.");
        return;
      }
      // Opens without a password? Then it only has an owner password (print/copy restrictions).
      const restrictionsOnly = await openPdf(new Blob([bytes.slice().buffer as ArrayBuffer])).then(
        async (p) => {
          await p.destroy();
          return true;
        },
        () => false,
      );
      setFile({ file: f.file, bytes, restrictionsOnly });
      setPassword("");
      setError(undefined);
    } finally {
      setBusy(false);
    }
  };

  const unlock = async () => {
    if (!file) return;
    setBusy(true);
    setError(undefined);
    try {
      const bytes = await (await pdfEdit()).unlockPdf(file.bytes, file.restrictionsOnly ? "" : password);
      setResult([{ name: `${baseName(file.file)}-unlocked.pdf`, blob: pdfBlob(bytes) }]);
      track("pdf_generated");
      toast.success("Password removed.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't unlock this PDF.");
    } finally {
      setBusy(false);
    }
  };

  const start = () => {
    setFile(null);
    setResult(null);
  };

  if (result) return <PdfResult files={result} note="The new copy opens without a password and has no restrictions." onReset={start} resetLabel="Unlock another PDF" />;
  if (!file)
    return (
      <div className="space-y-6">
        <PrivacyNote />
        <FileDropzone rules={PDF_RULES} onFiles={choose} title={busy ? "Checking…" : "Choose a locked PDF"} />
        <p className="text-sm text-muted-foreground">You need to know the password. This tool removes it from your own files — it doesn&apos;t crack passwords.</p>
      </div>
    );
  return (
    <div className="space-y-6">
      <FileBar file={file.file} onReset={start} disabled={busy} />
      <Panel>
        {file.restrictionsOnly ? (
          <p className="text-sm text-muted-foreground">
            This PDF opens without a password but restricts printing, copying or editing. Unlocking removes those restrictions ({formatBytes(file.file.size)}).
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void unlock();
            }}
          >
            <PasswordInput label="PDF password" value={password} onChange={(v) => { setPassword(v); setError(undefined); }} error={error} autoComplete="current-password" />
          </form>
        )}
        {file.restrictionsOnly && error && <p className="text-sm text-destructive">{error}</p>}
        <ActionButton busy={busy} busyLabel="Unlocking…" disabled={!file.restrictionsOnly && !password} onClick={unlock}>
          <LockOpen /> {file.restrictionsOnly ? "Remove restrictions" : "Unlock PDF"}
        </ActionButton>
      </Panel>
    </div>
  );
}
