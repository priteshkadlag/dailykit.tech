import { z } from "zod";

export const DOC_TYPES = ["invoice", "quotation"] as const;
export type DocType = (typeof DOC_TYPES)[number];

export const TEMPLATE_IDS = ["classic", "modern", "minimal", "professional", "corporate"] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const TEMPLATES_FOR: Record<DocType, TemplateId[]> = {
  invoice: ["classic", "modern", "minimal", "professional"],
  quotation: ["modern", "classic", "corporate"],
};

export const INVOICE_STATUSES = ["unpaid", "partially-paid", "paid"] as const;
export const QUOTATION_STATUSES = ["draft", "sent", "accepted", "rejected"] as const;
export type DocStatus = (typeof INVOICE_STATUSES)[number] | (typeof QUOTATION_STATUSES)[number];

export const STATUS_LABEL: Record<DocStatus, string> = {
  unpaid: "Unpaid",
  "partially-paid": "Partially paid",
  paid: "Paid",
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  rejected: "Rejected",
};

export const UNITS = ["pcs", "nos", "kg", "g", "ltr", "m", "box", "set", "hrs", "days", "month"] as const;

// Numeric fields are kept as the strings the user typed so the form round-trips exactly;
// they're parsed at calculation time.
const str = (max = 200) => z.string().max(max).default("");

export const lineItemSchema = z.object({
  id: z.string(),
  name: str(300),
  sku: str(60),
  hsn: str(20),
  qty: str(20),
  unit: str(20),
  rate: str(20),
  discount: str(10),
  gstRate: str(10),
});
export type LineItem = z.infer<typeof lineItemSchema>;

export const sellerSchema = z.object({
  name: str(),
  address: str(500),
  phone: str(30),
  email: str(120),
  gstin: str(20),
  pan: str(15),
  /** Downscaled data URL, capped so it fits comfortably in storage. */
  logo: z.string().max(400_000).default(""),
});
export type Seller = z.infer<typeof sellerSchema>;

export const customerSchema = z.object({
  name: str(),
  address: str(500),
  phone: str(30),
  email: str(120),
  gstin: str(20),
});
export type Customer = z.infer<typeof customerSchema>;

export const bankSchema = z.object({
  accountName: str(),
  bankName: str(),
  accountNumber: str(30),
  ifsc: str(15),
  upiId: str(80),
});
export type BankDetails = z.infer<typeof bankSchema>;

export const documentSchema = z.object({
  id: z.string(),
  type: z.enum(DOC_TYPES),
  number: str(40),
  /** yyyy-mm-dd */
  date: str(10),
  /** Due date for invoices, "valid until" for quotations. */
  dueDate: str(10),
  status: z.string().default("unpaid"),
  template: z.enum(TEMPLATE_IDS).default("modern"),
  taxMode: z.enum(["gst", "none"]).default("gst"),
  supply: z.enum(["intra", "inter"]).default("intra"),
  placeOfSupply: str(60),
  roundOff: z.boolean().default(true),
  seller: sellerSchema,
  customer: customerSchema,
  items: z.array(lineItemSchema).max(200),
  notes: str(2000),
  terms: str(2000),
  bank: bankSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type BusinessDocument = z.infer<typeof documentSchema>;

/** Seller + bank + default terms remembered between documents (full Business Profile arrives with accounts). */
export const businessDefaultsSchema = z.object({
  id: z.literal("default"),
  seller: sellerSchema,
  bank: bankSchema,
  terms: z.object({ invoice: str(2000), quotation: str(2000) }),
});
export type BusinessDefaults = z.infer<typeof businessDefaultsSchema>;
