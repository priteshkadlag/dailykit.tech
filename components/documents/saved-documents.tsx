"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Copy, FileText, Pencil, Search, Trash2 } from "lucide-react";
import { parseDateInput } from "@/lib/calculations/age";
import { useTodayInputValue } from "@/lib/hooks/use-client-values";
import { DOC_LABEL, documentTotals, isOverdue } from "@/lib/documents/model";
import { STATUS_LABEL, type BusinessDocument, type DocStatus, type DocType } from "@/lib/documents/types";
import { formatINR } from "@/lib/format";
import { documentsStore } from "@/lib/documents/store";
import { whereSaved } from "@/lib/storage/synced-collection";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATUS_STYLE: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  accepted: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  unpaid: "bg-amber-50 text-amber-800 ring-amber-600/20",
  "partially-paid": "bg-sky-50 text-sky-700 ring-sky-600/20",
  sent: "bg-sky-50 text-sky-700 ring-sky-600/20",
  draft: "bg-muted text-muted-foreground ring-foreground/10",
  rejected: "bg-muted text-muted-foreground ring-foreground/10",
  overdue: "bg-red-50 text-red-700 ring-red-600/20",
};

interface SavedDocumentsProps {
  type: DocType;
  documents: BusinessDocument[];
  activeId: string;
  onEdit: (doc: BusinessDocument) => void;
  onDuplicate: (doc: BusinessDocument) => void;
  onDelete: (doc: BusinessDocument) => void;
  extraAction?: (doc: BusinessDocument) => React.ReactNode;
}

export function SavedDocuments({ type, documents, activeId, onEdit, onDuplicate, onDelete, extraAction }: SavedDocumentsProps) {
  const today = useTodayInputValue();
  const [query, setQuery] = useState("");
  const label = DOC_LABEL[type];

  const q = query.trim().toLowerCase();
  const list = documents
    .filter((d) => d.type === type)
    .filter((d) => !q || d.number.toLowerCase().includes(q) || d.customer.name.toLowerCase().includes(q))
    .sort((a, b) => b.date.localeCompare(a.date) || b.number.localeCompare(a.number));
  const all = documents.filter((d) => d.type === type);
  const outstanding = all.filter((d) => d.type === "invoice" && d.status !== "paid").reduce((s, d) => s + documentTotals(d).grandTotal, 0);

  return (
    <section aria-labelledby="saved-heading" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="saved-heading" className="text-xl font-semibold tracking-tight">
            My {label.plural.toLowerCase()}
          </h2>
          <p className="text-sm text-muted-foreground">
            {all.length} saved {whereSaved(documentsStore)}
            {type === "invoice" && all.length > 0 && <> · {formatINR(outstanding)} outstanding</>}
          </p>
        </div>
        {all.length > 0 && (
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search by number or customer`}
              aria-label={`Search ${label.plural.toLowerCase()}`}
              className="h-10 bg-card pl-9"
            />
          </div>
        )}
      </div>

      {all.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed bg-card/50 p-10 text-center">
          <FileText className="size-8 text-muted-foreground" aria-hidden />
          <p className="font-medium">No saved {label.plural.toLowerCase()} yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">Fill in the form above and click Save. Your {label.plural.toLowerCase()} are kept in this browser.</p>
        </div>
      ) : list.length === 0 ? (
        <p className="rounded-xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">No {label.plural.toLowerCase()} match “{query}”.</p>
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
          {list.map((doc) => {
            const overdue = today ? isOverdue(doc, today) : false;
            const statusKey = overdue ? "overdue" : doc.status;
            const date = parseDateInput(doc.date);
            return (
              <li key={doc.id} className={cn("flex flex-col gap-3 p-4 sm:flex-row sm:items-center", doc.id === activeId && "bg-accent/40")}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{doc.number}</span>
                    <Badge variant="outline" className={cn("ring-1 ring-inset border-0", STATUS_STYLE[statusKey])}>
                      {overdue ? "Overdue" : STATUS_LABEL[doc.status as DocStatus] ?? doc.status}
                    </Badge>
                    {doc.id === activeId && <span className="text-xs font-medium text-primary">Editing</span>}
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {doc.customer.name || "No customer"} · {date ? format(date, "dd MMM yyyy") : "No date"}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span className="font-semibold tabular-nums">{formatINR(documentTotals(doc).grandTotal)}</span>
                  <div className="flex items-center">
                    {extraAction?.(doc)}
                    <Button variant="ghost" size="icon" className="size-10" aria-label={`Edit ${doc.number}`} onClick={() => onEdit(doc)}>
                      <Pencil />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-10" aria-label={`Duplicate ${doc.number}`} onClick={() => onDuplicate(doc)}>
                      <Copy />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-10 text-destructive hover:text-destructive" aria-label={`Delete ${doc.number}`} onClick={() => onDelete(doc)}>
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
