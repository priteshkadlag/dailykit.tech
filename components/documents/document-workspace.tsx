"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRightLeft, Download, Eye, FilePlus2, Loader2, PencilLine, Printer, Save } from "lucide-react";
import { toast } from "sonner";
import type { LineTotals } from "@/lib/calculations/document";
import {
  createDocument,
  DOC_LABEL,
  documentTotals,
  duplicateDocument,
  filledItems,
  quotationToInvoice,
  readDraft,
  validateDocument,
  writeDraft,
} from "@/lib/documents/model";
import { businessDefaultsStore, documentsStore } from "@/lib/documents/store";
import type { BusinessDocument, DocType } from "@/lib/documents/types";
import { downloadNodeAsPdf, printDocument } from "@/lib/pdf/capture";
import { track } from "@/lib/analytics/client";
import { useCollection } from "@/lib/storage/local-collection";
import { showSaveError } from "@/components/shared/save-error";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DocumentEditor } from "./document-editor";
import { DocumentPreview } from "./document-preview";
import { SavedDocuments } from "./saved-documents";
import { ScaledPreview } from "./scaled-preview";

type PendingAction =
  | { kind: "replace"; next: BusinessDocument; nextSnapshot: string | null; message: string }
  | { kind: "delete"; doc: BusinessDocument }
  | null;

const snapshot = (doc: BusinessDocument) => JSON.stringify({ ...doc, updatedAt: "" });

/**
 * Full create → preview → save / PDF / print → manage flow shared by the invoice and
 * quotation generators. Rendered client-only (it reads saved data from this device).
 */
export function DocumentWorkspace({ type }: { type: DocType }) {
  const label = DOC_LABEL[type];
  const router = useRouter();
  const documents = useCollection(documentsStore);

  const pathname = usePathname();
  // ?doc=<id> (links from the dashboard) opens that saved document for editing.
  const requested = useSearchParams().get("doc");
  const [doc, setDoc] = useState<BusinessDocument>(() => {
    const opened = requested ? documentsStore.get(requested) : undefined;
    if (opened?.type === type) return opened;
    return readDraft(type) ?? createDocument(type, documentsStore.list(), businessDefaultsStore.get("default"));
  });
  // Drop the parameter once used, so a reload shows the latest draft rather than reopening it.
  useEffect(() => {
    if (requested) router.replace(pathname, { scroll: false });
  }, [requested, router, pathname]);
  // Snapshot of the last saved/loaded version, to tell whether there are unsaved changes.
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(() => {
    const saved = documentsStore.get(doc.id);
    return saved ? snapshot(saved) : null;
  });
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [showErrors, setShowErrors] = useState(false);
  const [busy, setBusy] = useState<"pdf" | "save" | null>(null);
  const [pending, setPending] = useState<PendingAction>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const isSaved = documents.some((d) => d.id === doc.id);
  const dirty = savedSnapshot !== snapshot(doc);

  // Autosave the work in progress (debounced) so a refresh never loses edits.
  useEffect(() => {
    const t = window.setTimeout(() => writeDraft(doc, type), 400);
    return () => window.clearTimeout(t);
  }, [doc, type]);

  const totals = useMemo(() => documentTotals(doc), [doc]);
  const lineTotals = useMemo(() => {
    const map = new Map<string, LineTotals>();
    filledItems(doc).forEach((item, i) => map.set(item.id, totals.lines[i]));
    return map;
  }, [doc, totals]);
  const { errors, warnings } = useMemo(() => validateDocument(doc), [doc]);
  const toMap = (list: { field: string; message: string }[]) => Object.fromEntries(list.map((i) => [i.field, i.message]));
  const errorMap = showErrors ? toMap(errors) : {};
  const warningMap = toMap(warnings);

  const update = (fn: (d: BusinessDocument) => BusinessDocument) => setDoc(fn);

  /** Returns true when the document can be saved/exported; otherwise shows what to fix. */
  const ensureValid = () => {
    if (errors.length === 0) return true;
    setShowErrors(true);
    setView("edit");
    toast.error(errors[0].message, { description: errors.length > 1 ? `and ${errors.length - 1} more thing${errors.length > 2 ? "s" : ""} to fix` : undefined });
    return false;
  };

  const save = async () => {
    if (!ensureValid() || busy) return;
    const saved = { ...doc, updatedAt: new Date().toISOString() };
    setBusy("save");
    try {
      await documentsStore.upsert(saved);
    } catch (error) {
      showSaveError(error);
      return;
    } finally {
      setBusy(null);
    }
    setDoc(saved);
    setSavedSnapshot(snapshot(saved));
    toast.success(`${label.singular} ${isSaved ? "updated" : "saved"} successfully.`);
    track(type === "invoice" ? "invoice_created" : "quotation_created", `${type}-generator`);

    // Remember the seller, bank and terms for next time. With an account they live in the Business
    // Profile, which the first saved document seeds and which is then edited from the dashboard.
    const existing = businessDefaultsStore.get("default");
    if (businessDefaultsStore.mode() !== "cloud" || !existing) {
      businessDefaultsStore
        .upsert({
          id: "default",
          seller: saved.seller,
          bank: saved.bank,
          terms: { invoice: existing?.terms.invoice ?? "", quotation: existing?.terms.quotation ?? "", [type]: saved.terms },
        })
        .catch(() => undefined);
    }
  };

  const downloadPdf = async () => {
    if (!ensureValid() || !exportRef.current) return;
    setBusy("pdf");
    try {
      await downloadNodeAsPdf(exportRef.current, `${label.singular}-${doc.number}`.replace(/[^\w.-]+/g, "_"));
      toast.success(`${label.singular} PDF downloaded.`);
      track("pdf_generated");
    } catch {
      toast.error("Couldn't create the PDF. Try Print → Save as PDF instead.");
    } finally {
      setBusy(null);
    }
  };

  const print = () => {
    if (!ensureValid()) return;
    printDocument(`${label.singular} ${doc.number}`);
  };

  const load = (next: BusinessDocument, nextSnapshot: string | null, message: string) => {
    setDoc(next);
    setSavedSnapshot(nextSnapshot);
    setShowErrors(false);
    setView("edit");
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.info(message);
  };

  /** Swap the editor to another document, asking first if there are unsaved edits worth keeping. */
  const replaceWith = (next: BusinessDocument, message: string, nextSnapshot: string | null) => {
    if (dirty && filledItems(doc).length > 0) setPending({ kind: "replace", next, nextSnapshot, message });
    else load(next, nextSnapshot, message);
  };

  const startNew = () => replaceWith(createDocument(type, documentsStore.list(), businessDefaultsStore.get("default")), `New ${label.singular.toLowerCase()} started.`, null);
  const edit = (d: BusinessDocument) => replaceWith(d, `Editing ${d.number}.`, snapshot(d));
  const duplicate = (d: BusinessDocument) => {
    const copy = duplicateDocument(d, documentsStore.list());
    replaceWith(copy, `Duplicated as ${copy.number} — review and save.`, null);
  };

  const convertToInvoice = (quotation: BusinessDocument) => {
    const invoice = quotationToInvoice(quotation, documentsStore.list());
    writeDraft(invoice, "invoice");
    toast.success(`Created invoice ${invoice.number} from ${quotation.number}.`);
    router.push("/invoice-generator");
  };

  const confirmPending = async () => {
    if (!pending) return;
    if (pending.kind === "replace") {
      load(pending.next, pending.nextSnapshot, pending.message);
      return;
    }
    const target = pending.doc;
    try {
      await documentsStore.remove(target.id);
    } catch (error) {
      showSaveError(error);
      return;
    }
    if (target.id === doc.id) setSavedSnapshot(null);
    toast.success(`${label.singular} ${target.number} deleted.`);
  };

  const preview = <DocumentPreview doc={doc} />;

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="sticky top-16 z-30 -mx-4 flex flex-wrap items-center gap-2 border-y bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-4 lg:top-[7.25rem]">
          <div className="mr-auto flex min-w-0 items-center gap-2">
            <span className="truncate font-semibold">{doc.number || `New ${label.singular.toLowerCase()}`}</span>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                !isSaved ? "bg-muted text-muted-foreground" : dirty ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700",
              )}
            >
              {!isSaved ? "Not saved" : dirty ? "Unsaved changes" : "Saved"}
            </span>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <Button className="h-10 flex-1 px-4 sm:flex-none" onClick={save} disabled={busy === "save"}>
              {busy === "save" ? <Loader2 className="animate-spin" /> : <Save />} Save
            </Button>
            <Button variant="outline" className="h-10 flex-1 px-3 sm:flex-none" onClick={downloadPdf} disabled={busy === "pdf"}>
              {busy === "pdf" ? <Loader2 className="animate-spin" /> : <Download />} PDF
            </Button>
            <Button variant="outline" className="h-10 flex-1 px-3 sm:flex-none" onClick={print}>
              <Printer /> Print
            </Button>
            {type === "quotation" && (
              <Button variant="outline" className="h-10 flex-1 px-3 sm:flex-none" onClick={() => (ensureValid() ? convertToInvoice(doc) : undefined)}>
                <ArrowRightLeft /> To invoice
              </Button>
            )}
            <Button variant="ghost" className="h-10 flex-1 px-3 sm:flex-none" onClick={startNew}>
              <FilePlus2 /> New
            </Button>
          </div>
        </div>

        {/* Edit / Preview switch for smaller screens */}
        <div role="tablist" aria-label="View" className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 xl:hidden">
          {(["edit", "preview"] as const).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={cn("flex h-10 items-center justify-center gap-2 rounded-md text-sm font-medium", view === v ? "bg-card shadow-sm ring-1 ring-foreground/10" : "text-muted-foreground")}
            >
              {v === "edit" ? <PencilLine className="size-4" /> : <Eye className="size-4" />}
              {v === "edit" ? "Edit" : "Preview"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
          <div className={cn("min-w-0", view === "preview" && "hidden xl:block")}>
            <DocumentEditor doc={doc} totals={totals} lineTotals={lineTotals} errors={errorMap} warnings={warningMap} onChange={update} />
          </div>
          <div className={cn("min-w-0 space-y-2 xl:sticky xl:top-[12.5rem]", view === "edit" && "hidden xl:block")}>
            <p className="text-sm font-medium text-muted-foreground">Live preview</p>
            <ScaledPreview>{preview}</ScaledPreview>
          </div>
        </div>
      </div>

      <SavedDocuments
        type={type}
        documents={documents}
        activeId={doc.id}
        onEdit={edit}
        onDuplicate={duplicate}
        onDelete={(d) => setPending({ kind: "delete", doc: d })}
        extraAction={
          type === "quotation"
            ? (d) => (
                <Button variant="ghost" size="icon" className="size-10" aria-label={`Convert ${d.number} to invoice`} title="Convert to invoice" onClick={() => convertToInvoice(d)}>
                  <ArrowRightLeft />
                </Button>
              )
            : undefined
        }
      />

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={pending?.kind === "delete" ? `Delete ${pending.doc.number}?` : "Discard unsaved changes?"}
        description={
          pending?.kind === "delete"
            ? `This permanently removes the ${label.singular.toLowerCase()} from ${documentsStore.mode() === "cloud" ? "your account" : "this device"}.`
            : `You have unsaved changes to ${doc.number}. They'll be lost if you continue.`
        }
        confirmLabel={pending?.kind === "delete" ? "Delete" : "Discard changes"}
        destructive
        onConfirm={confirmPending}
      />

      {/* Full-size copy used for PDF export and printing (see print rules in globals.css). */}
      {createPortal(
        <div data-print-root aria-hidden style={{ position: "fixed", left: -10000, top: 0 }}>
          <div ref={exportRef}>{preview}</div>
        </div>,
        document.body,
      )}
    </div>
  );
}
