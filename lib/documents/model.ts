import { addDays } from "date-fns";
import { toDateInputValue } from "@/lib/calculations/age";
import { calculateDocumentTotals, isValidGstin } from "@/lib/calculations/document";
import { parseNumber } from "@/lib/format";
import { newId } from "@/lib/storage/id";
import { isValidUpiId, upiLink } from "@/lib/upi";
import {
  documentSchema,
  type BankDetails,
  type BusinessDefaults,
  type BusinessDocument,
  type DocType,
  type LineItem,
  type Seller,
  TEMPLATES_FOR,
} from "./types";

export const DOC_LABEL: Record<DocType, { singular: string; plural: string; prefix: string; dueLabel: string }> = {
  invoice: { singular: "Invoice", plural: "Invoices", prefix: "INV-", dueLabel: "Due date" },
  quotation: { singular: "Quotation", plural: "Quotations", prefix: "QT-", dueLabel: "Valid until" },
};

const DEFAULT_TERMS: Record<DocType, string> = {
  invoice: "Payment is due by the due date shown above.\nGoods once sold will not be taken back.",
  quotation: "Prices are valid until the date shown above.\nDelivery within 7 working days of order confirmation.",
};

const emptySeller: Seller = { name: "", address: "", phone: "", email: "", gstin: "", pan: "", logo: "" };
const emptyBank: BankDetails = { accountName: "", bankName: "", accountNumber: "", ifsc: "", upiId: "" };

export function newLineItem(overrides: Partial<LineItem> = {}): LineItem {
  return { id: newId(), name: "", sku: "", hsn: "", qty: "1", unit: "pcs", rate: "", discount: "", gstRate: "18", ...overrides };
}

/** Next number in the series, e.g. INV-0007 after INV-0006. Keeps any custom prefix the user adopted. */
export function nextDocumentNumber(type: DocType, existing: BusinessDocument[]) {
  let best: { prefix: string; n: number; width: number } | null = null;
  for (const doc of existing) {
    if (doc.type !== type) continue;
    const match = /^(.*?)(\d+)$/.exec(doc.number.trim());
    if (!match) continue;
    const n = Number(match[2]);
    if (!best || n > best.n) best = { prefix: match[1], n, width: match[2].length };
  }
  if (!best) return `${DOC_LABEL[type].prefix}0001`;
  return `${best.prefix}${String(best.n + 1).padStart(best.width, "0")}`;
}

export function createDocument(type: DocType, existing: BusinessDocument[], defaults?: BusinessDefaults): BusinessDocument {
  const today = new Date();
  const now = today.toISOString();
  return {
    id: newId(),
    type,
    number: nextDocumentNumber(type, existing),
    date: toDateInputValue(today),
    dueDate: toDateInputValue(addDays(today, type === "invoice" ? 15 : 30)),
    status: type === "invoice" ? "unpaid" : "draft",
    template: "modern",
    taxMode: "gst",
    supply: "intra",
    placeOfSupply: "",
    roundOff: true,
    seller: defaults?.seller ?? emptySeller,
    customer: { name: "", address: "", phone: "", email: "", gstin: "" },
    items: [newLineItem()],
    notes: type === "invoice" ? "Thank you for your business!" : "",
    terms: defaults?.terms[type] || DEFAULT_TERMS[type],
    bank: defaults?.bank ?? emptyBank,
    createdAt: now,
    updatedAt: now,
  };
}

export function duplicateDocument(doc: BusinessDocument, existing: BusinessDocument[]): BusinessDocument {
  const fresh = createDocument(doc.type, existing);
  return {
    ...doc,
    id: fresh.id,
    number: fresh.number,
    date: fresh.date,
    dueDate: fresh.dueDate,
    status: fresh.status,
    items: doc.items.map((item) => ({ ...item, id: newId() })),
    createdAt: fresh.createdAt,
    updatedAt: fresh.updatedAt,
  };
}

const num = (s: string) => {
  const n = parseNumber(s);
  return Number.isFinite(n) ? n : 0;
};

/** Items that have any content — blank trailing rows are ignored in totals, previews and PDFs. */
export function filledItems(doc: BusinessDocument) {
  return doc.items.filter((i) => i.name.trim() || i.rate.trim());
}

export function documentTotals(doc: BusinessDocument) {
  return calculateDocumentTotals(
    filledItems(doc).map((i) => ({ qty: num(i.qty), rate: num(i.rate), discount: num(i.discount), gstRate: num(i.gstRate) })),
    { gst: doc.taxMode === "gst", supply: doc.supply, roundOff: doc.roundOff },
  );
}

export interface DocumentIssue {
  field: string;
  message: string;
}

/** Problems that block saving/exporting. GSTIN format is a warning, not a blocker. */
export function validateDocument(doc: BusinessDocument): { errors: DocumentIssue[]; warnings: DocumentIssue[] } {
  const errors: DocumentIssue[] = [];
  const warnings: DocumentIssue[] = [];
  if (!doc.seller.name.trim()) errors.push({ field: "seller.name", message: "Add your business name" });
  if (!doc.customer.name.trim()) errors.push({ field: "customer.name", message: "Add the customer name" });
  if (!doc.number.trim()) errors.push({ field: "number", message: `Add a ${DOC_LABEL[doc.type].singular.toLowerCase()} number` });
  if (!doc.date) errors.push({ field: "date", message: "Add a date" });
  if (doc.dueDate && doc.date && doc.dueDate < doc.date) {
    errors.push({ field: "dueDate", message: `${DOC_LABEL[doc.type].dueLabel} can't be before the ${DOC_LABEL[doc.type].singular.toLowerCase()} date` });
  }

  const items = filledItems(doc);
  if (items.length === 0) errors.push({ field: "items", message: "Add at least one item" });
  doc.items.forEach((item, i) => {
    const hasContent = item.name.trim() || item.rate.trim();
    if (!hasContent) return;
    const row = `Item ${i + 1}`;
    if (!item.name.trim()) errors.push({ field: `items.${i}.name`, message: `${row}: add a name` });
    const qty = parseNumber(item.qty);
    if (!Number.isFinite(qty) || qty <= 0) errors.push({ field: `items.${i}.qty`, message: `${row}: quantity must be more than 0` });
    const rate = parseNumber(item.rate);
    if (!Number.isFinite(rate) || rate < 0) errors.push({ field: `items.${i}.rate`, message: `${row}: enter a valid rate` });
    const discount = item.discount.trim() ? parseNumber(item.discount) : 0;
    if (!Number.isFinite(discount) || discount < 0 || discount > 100) errors.push({ field: `items.${i}.discount`, message: `${row}: discount must be 0–100%` });
    const gst = parseNumber(item.gstRate);
    if (doc.taxMode === "gst" && (!Number.isFinite(gst) || gst < 0 || gst > 100)) errors.push({ field: `items.${i}.gstRate`, message: `${row}: enter a valid GST rate` });
  });

  if (doc.seller.gstin && !isValidGstin(doc.seller.gstin)) warnings.push({ field: "seller.gstin", message: "Your GSTIN doesn't look like a valid 15-character GSTIN" });
  if (doc.customer.gstin && !isValidGstin(doc.customer.gstin)) warnings.push({ field: "customer.gstin", message: "Customer GSTIN doesn't look valid" });
  if (doc.bank.ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(doc.bank.ifsc.trim())) warnings.push({ field: "bank.ifsc", message: "IFSC should be 11 characters, e.g. HDFC0001234" });
  if (doc.bank.upiId && !isValidUpiId(doc.bank.upiId)) warnings.push({ field: "bank.upiId", message: "UPI ID should look like name@bank" });
  return { errors, warnings };
}

/** Unpaid invoices past their due date. */
export function isOverdue(doc: BusinessDocument, todayIso: string) {
  return doc.type === "invoice" && doc.status !== "paid" && !!doc.dueDate && doc.dueDate < todayIso;
}

/** UPI deep link used for the "scan to pay" QR code. */
export function upiPaymentLink(doc: BusinessDocument, amount: number) {
  return upiLink({ upiId: doc.bank.upiId, payeeName: doc.bank.accountName || doc.seller.name, amount, note: `${DOC_LABEL[doc.type].singular} ${doc.number}` });
}

/** Work-in-progress editor state is autosaved here so a refresh or accidental close loses nothing. */
export const draftKey = (type: DocType) => `dailykit:draft:${type}:v1`;

export function readDraft(type: DocType): BusinessDocument | null {
  try {
    const parsed = documentSchema.safeParse(JSON.parse(window.localStorage.getItem(draftKey(type)) ?? "null"));
    return parsed.success && parsed.data.type === type ? parsed.data : null;
  } catch {
    return null;
  }
}

export function writeDraft(doc: BusinessDocument | null, type: DocType) {
  try {
    if (doc) window.localStorage.setItem(draftKey(type), JSON.stringify(doc));
    else window.localStorage.removeItem(draftKey(type));
  } catch {
    // Storage full or disabled — the draft simply isn't persisted.
  }
}

/** Turn an accepted quotation into a new, unsaved invoice with the same customer and items. */
export function quotationToInvoice(quotation: BusinessDocument, existing: BusinessDocument[]): BusinessDocument {
  const fresh = createDocument("invoice", existing);
  return {
    ...quotation,
    id: fresh.id,
    type: "invoice",
    number: fresh.number,
    date: fresh.date,
    dueDate: fresh.dueDate,
    status: "unpaid",
    template: TEMPLATES_FOR.invoice.includes(quotation.template) ? quotation.template : "modern",
    notes: [quotation.notes, `Ref: Quotation ${quotation.number}`].filter(Boolean).join("\n"),
    terms: fresh.terms,
    items: quotation.items.map((item) => ({ ...item, id: newId() })),
    createdAt: fresh.createdAt,
    updatedAt: fresh.updatedAt,
  };
}
