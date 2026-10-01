import "server-only";
import { startOfMonth } from "date-fns";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS } from "@/lib/billing/plans";
import { currentPlan } from "@/lib/billing/subscriptions";
import { documentTotals } from "@/lib/documents/model";
import type { BusinessDefaults, BusinessDocument, LineItem } from "@/lib/documents/types";
import type { Expense } from "@/lib/expenses/model";
import type { Task } from "@/lib/tasks/model";
import { getToolOrNull } from "@/lib/tools";
import type { FavoriteTool, SavedCalculation, SyncItem, SyncKind } from "@/lib/sync/kinds";
import { sniffMime } from "@/lib/files/validation";

/** A write the user's plan doesn't allow — surfaced to the user as-is. */
export class PlanLimitError extends Error {}
/** Well-formed but unacceptable input (e.g. a logo that isn't an image). */
export class InvalidItemError extends Error {}

export interface Repo<T> {
  list(userId: string): Promise<T[]>;
  upsert(userId: string, item: T): Promise<void>;
  remove(userId: string, id: string): Promise<void>;
}

const iso = (d: Date | null) => (d ? d.toISOString() : null);
const toDate = (value: string | null | undefined) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

// ---------------------------------------------------------------- invoices & quotations

type ItemRow = Omit<LineItem, "id"> & { clientId: string; position: number };

const itemRows = (doc: BusinessDocument): ItemRow[] =>
  doc.items.map(({ id, ...item }, position) => ({ ...item, clientId: id, position }));

const docScalars = (doc: BusinessDocument) => ({
  number: doc.number,
  date: doc.date,
  dueDate: doc.dueDate,
  status: doc.status,
  template: doc.template,
  taxMode: doc.taxMode,
  supply: doc.supply,
  placeOfSupply: doc.placeOfSupply,
  roundOff: doc.roundOff,
  seller: doc.seller,
  customerName: doc.customer.name,
  customer: doc.customer,
  bank: doc.bank,
  notes: doc.notes,
  terms: doc.terms,
  grandTotal: documentTotals(doc).grandTotal,
});

interface DocRow {
  clientId: string;
  number: string;
  date: string;
  dueDate: string;
  status: string;
  template: string;
  taxMode: string;
  supply: string;
  placeOfSupply: string;
  roundOff: boolean;
  seller: unknown;
  customer: unknown;
  bank: unknown;
  notes: string;
  terms: string;
  clientCreatedAt: Date;
  updatedAt: Date;
  items: (ItemRow & { id: string })[];
}

function toDocument(type: BusinessDocument["type"], row: DocRow): BusinessDocument {
  return {
    id: row.clientId,
    type,
    number: row.number,
    date: row.date,
    dueDate: row.dueDate,
    status: row.status,
    template: row.template as BusinessDocument["template"],
    taxMode: row.taxMode as BusinessDocument["taxMode"],
    supply: row.supply as BusinessDocument["supply"],
    placeOfSupply: row.placeOfSupply,
    roundOff: row.roundOff,
    seller: row.seller as BusinessDocument["seller"],
    customer: row.customer as BusinessDocument["customer"],
    bank: row.bank as BusinessDocument["bank"],
    items: row.items.map(({ clientId, name, sku, hsn, qty, unit, rate, discount, gstRate }) => ({ id: clientId, name, sku, hsn, qty, unit, rate, discount, gstRate })),
    notes: row.notes,
    terms: row.terms,
    createdAt: row.clientCreatedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function assertMonthlyQuota(userId: string, type: BusinessDocument["type"]) {
  const { plan } = await currentPlan(userId);
  const limits = PLAN_LIMITS[plan];
  const limit = type === "invoice" ? limits.invoicesPerMonth : limits.quotationsPerMonth;
  if (limit === null) return;
  const since = startOfMonth(new Date());
  const used =
    type === "invoice"
      ? await prisma.invoice.count({ where: { userId, createdAt: { gte: since } } })
      : await prisma.quotation.count({ where: { userId, createdAt: { gte: since } } });
  if (used >= limit) {
    const noun = type === "invoice" ? "invoices" : "quotations";
    throw new PlanLimitError(`The Free plan saves ${limit} ${noun} a month to your account, and you've reached it. Upgrade to Pro for unlimited ${noun}.`);
  }
}

const itemsInclude = { items: { orderBy: { position: "asc" as const } } };

const documents: Repo<BusinessDocument> = {
  async list(userId) {
    const [invoices, quotations] = await Promise.all([
      prisma.invoice.findMany({ where: { userId }, include: itemsInclude }),
      prisma.quotation.findMany({ where: { userId }, include: itemsInclude }),
    ]);
    return [...invoices.map((r) => toDocument("invoice", r)), ...quotations.map((r) => toDocument("quotation", r))].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
  },

  async upsert(userId, doc) {
    const key = { userId_clientId: { userId, clientId: doc.id } };
    const data = docScalars(doc);
    const items = itemRows(doc);
    const clientCreatedAt = toDate(doc.createdAt) ?? new Date();

    if (doc.type === "invoice") {
      const existing = await prisma.invoice.findUnique({ where: key, select: { id: true } });
      if (existing) {
        await prisma.invoice.update({ where: { id: existing.id }, data: { ...data, items: { deleteMany: {}, create: items } } });
      } else {
        await assertMonthlyQuota(userId, "invoice");
        await prisma.invoice.create({ data: { ...data, userId, clientId: doc.id, clientCreatedAt, items: { create: items } } });
      }
    } else {
      const existing = await prisma.quotation.findUnique({ where: key, select: { id: true } });
      if (existing) {
        await prisma.quotation.update({ where: { id: existing.id }, data: { ...data, items: { deleteMany: {}, create: items } } });
      } else {
        await assertMonthlyQuota(userId, "quotation");
        await prisma.quotation.create({ data: { ...data, userId, clientId: doc.id, clientCreatedAt, items: { create: items } } });
      }
    }
  },

  async remove(userId, id) {
    // deleteMany with userId in the filter: a foreign id simply matches nothing.
    await prisma.$transaction([prisma.invoice.deleteMany({ where: { userId, clientId: id } }), prisma.quotation.deleteMany({ where: { userId, clientId: id } })]);
  },
};

// ---------------------------------------------------------------- expenses

const expenses: Repo<Expense> = {
  async list(userId) {
    const rows = await prisma.expense.findMany({ where: { userId }, orderBy: [{ date: "desc" }, { createdAt: "desc" }] });
    return rows.map((r) => ({
      id: r.clientId,
      amount: r.amount.toNumber(),
      category: r.category as Expense["category"],
      date: r.date,
      method: r.method as Expense["method"],
      note: r.note,
      createdAt: r.clientCreatedAt.toISOString(),
    }));
  },
  async upsert(userId, e) {
    const data = { amount: e.amount, category: e.category, date: e.date, method: e.method, note: e.note };
    await prisma.expense.upsert({
      where: { userId_clientId: { userId, clientId: e.id } },
      create: { ...data, userId, clientId: e.id, clientCreatedAt: toDate(e.createdAt) ?? new Date() },
      update: data,
    });
  },
  async remove(userId, id) {
    await prisma.expense.deleteMany({ where: { userId, clientId: id } });
  },
};

// ---------------------------------------------------------------- tasks

const tasks: Repo<Task> = {
  async list(userId) {
    const rows = await prisma.task.findMany({ where: { userId }, orderBy: { clientCreatedAt: "desc" } });
    return rows.map((r) => ({
      id: r.clientId,
      title: r.title,
      description: r.description,
      dueDate: r.dueDate,
      dueTime: r.dueTime,
      priority: r.priority as Task["priority"],
      category: r.category as Task["category"],
      reminder: r.reminder as Task["reminder"],
      completed: r.completed,
      completedAt: iso(r.completedAt),
      remindedAt: iso(r.remindedAt),
      createdAt: r.clientCreatedAt.toISOString(),
    }));
  },
  async upsert(userId, t) {
    const data = {
      title: t.title,
      description: t.description,
      dueDate: t.dueDate,
      dueTime: t.dueTime,
      priority: t.priority,
      category: t.category,
      reminder: t.reminder,
      completed: t.completed,
      completedAt: toDate(t.completedAt),
      remindedAt: toDate(t.remindedAt),
    };
    await prisma.task.upsert({
      where: { userId_clientId: { userId, clientId: t.id } },
      create: { ...data, userId, clientId: t.id, clientCreatedAt: toDate(t.createdAt) ?? new Date() },
      update: data,
    });
  },
  async remove(userId, id) {
    await prisma.task.deleteMany({ where: { userId, clientId: id } });
  },
};

// ---------------------------------------------------------------- business profile

/** Logos arrive as data URLs: accept only real PNG/JPEG/WEBP bytes, whatever the URL claims. */
function assertLogo(logo: string) {
  if (!logo) return;
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(logo);
  if (!match) throw new InvalidItemError("The logo must be a PNG, JPG or WEBP image.");
  const head = Uint8Array.from(Buffer.from(match[2].slice(0, 64), "base64"));
  if (sniffMime(head) !== `image/${match[1]}`) throw new InvalidItemError("The logo file isn't a valid image.");
}

const business: Repo<BusinessDefaults> = {
  async list(userId) {
    const p = await prisma.businessProfile.findUnique({ where: { userId } });
    if (!p) return [];
    return [
      {
        id: "default",
        seller: { name: p.businessName, address: p.address, phone: p.phone, email: p.email, gstin: p.gstin, pan: p.pan, logo: p.logo },
        bank: { accountName: p.accountName, bankName: p.bankName, accountNumber: p.accountNumber, ifsc: p.ifsc, upiId: p.upiId },
        terms: { invoice: p.invoiceTerms, quotation: p.quotationTerms },
      },
    ];
  },
  async upsert(userId, { seller, bank, terms }) {
    assertLogo(seller.logo);
    const data = {
      businessName: seller.name,
      logo: seller.logo,
      address: seller.address,
      phone: seller.phone,
      email: seller.email,
      gstin: seller.gstin.toUpperCase(),
      pan: seller.pan.toUpperCase(),
      accountName: bank.accountName,
      bankName: bank.bankName,
      accountNumber: bank.accountNumber,
      ifsc: bank.ifsc.toUpperCase(),
      upiId: bank.upiId,
      invoiceTerms: terms.invoice,
      quotationTerms: terms.quotation,
    };
    await prisma.businessProfile.upsert({ where: { userId }, create: { ...data, userId }, update: data });
  },
  async remove(userId) {
    await prisma.businessProfile.deleteMany({ where: { userId } });
  },
};

// ---------------------------------------------------------------- saved calculations

const calculations: Repo<SavedCalculation> = {
  async list(userId) {
    const rows = await prisma.savedCalculation.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
    return rows.map((r) => ({ id: r.clientId, toolSlug: r.toolSlug, summary: r.summary, url: r.url, createdAt: r.clientCreatedAt.toISOString() }));
  },
  async upsert(userId, c) {
    if (!getToolOrNull(c.toolSlug)) throw new InvalidItemError("Unknown tool.");
    const data = { toolSlug: c.toolSlug, title: getToolOrNull(c.toolSlug)!.name, summary: c.summary, url: c.url };
    await prisma.savedCalculation.upsert({
      where: { userId_clientId: { userId, clientId: c.id } },
      create: { ...data, userId, clientId: c.id, clientCreatedAt: toDate(c.createdAt) ?? new Date() },
      update: data,
    });
    // "Recent" calculations: keep the newest ones up to the plan's limit and drop the rest.
    const { savedCalculations: keep } = PLAN_LIMITS[(await currentPlan(userId)).plan];
    const stale = await prisma.savedCalculation.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, skip: keep, select: { id: true } });
    if (stale.length) await prisma.savedCalculation.deleteMany({ where: { userId, id: { in: stale.map((s) => s.id) } } });
  },
  async remove(userId, id) {
    await prisma.savedCalculation.deleteMany({ where: { userId, clientId: id } });
  },
};

// ---------------------------------------------------------------- favourite tools

const favorites: Repo<FavoriteTool> = {
  async list(userId) {
    const rows = await prisma.favoriteTool.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
    return rows.map((r) => ({ id: r.toolSlug, createdAt: r.createdAt.toISOString() }));
  },
  async upsert(userId, f) {
    if (!getToolOrNull(f.id)) throw new InvalidItemError("Unknown tool.");
    await prisma.favoriteTool.upsert({ where: { userId_toolSlug: { userId, toolSlug: f.id } }, create: { userId, toolSlug: f.id }, update: {} });
  },
  async remove(userId, id) {
    await prisma.favoriteTool.deleteMany({ where: { userId, toolSlug: id } });
  },
};

export const REPOS: { [K in SyncKind]: Repo<SyncItem<K>> } = { documents, expenses, tasks, business, calculations, favorites };
