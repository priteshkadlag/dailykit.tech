# DailyKit — Daily Utility & Business Tools

Free calculators and business tools for Indian shopkeepers, freelancers, small businesses and everyday users.
Built with Next.js 16 (App Router), TypeScript, Tailwind CSS 4 and shadcn/ui (Base UI).

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL and AUTH_SECRET (see comments in the file)
npm run db:dev               # optional: local Postgres via `prisma dev` (then set DATABASE_POOL_MAX=1)
npm run db:migrate           # create the tables
npm run dev                  # http://localhost:3000
```

In production run `npm run db:deploy` to apply migrations. Google sign-in appears when `AUTH_GOOGLE_ID` and
`AUTH_GOOGLE_SECRET` are set; emails listed in `ADMIN_EMAILS` become admins on sign-in; password-reset emails
need `SMTP_URL` (in development they're printed to the server console instead).

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm test` | Unit tests for all calculation logic (Vitest) |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run db:migrate` / `db:deploy` | Apply Prisma migrations (dev / production) |
| `npm run db:studio` | Browse the database |

## What's built

### Phase 1

- Header with ⌘K / Ctrl+K tool search, category nav, footer, and a mobile bottom tab bar
- Homepage, tool directory (`/tools`), category pages (`/category/[slug]`) and search (`/search?q=`)
- **GST Calculator** — exclusive/inclusive, CGST+SGST or IGST, copy and PDF download
- **EMI Calculator** — EMI, totals, principal/interest charts, yearly & monthly amortization, PDF report, share
- **Percentage Calculator** — X% of Y, X as % of Y, % change, add/subtract %
- **Discount Calculator** — single, successive (stacked) discounts, discount + GST (incl. MRP)
- **Age Calculator** — years/months/days, totals, next-birthday countdown, custom "age on" date
- SEO on every tool page: title, description, canonical, Open Graph, breadcrumb, FAQ, JSON-LD
  (`WebApplication`, `BreadcrumbList`, `FAQPage`, site-wide `WebSite` + `SearchAction`), `sitemap.xml`, `robots.txt`
- 404, error and loading states; toast notifications

### Phase 2

- **Invoice Generator** — GST / non-GST, CGST+SGST or IGST, HSN/SAC, SKU, line discounts, round-off, amount in words,
  logo upload, bank details, UPI scan-to-pay QR; 4 templates (Classic, Modern, Minimal, Professional);
  live preview, PDF download, print, save, edit, duplicate, delete; draft autosave; overdue status
- **Quotation Generator** — same engine, 3 templates (Modern, Classic, Corporate), validity date, one-click convert to invoice
- **Profit Margin Calculator** — profit, margin, markup, cost per unit, break-even, target selling price (margin or markup)
- **Shipping Cost Calculator** — volumetric/chargeable weight, 0.5 kg slabs, zones, surface/express, COD, GST, editable rate card;
  `ShippingRateProvider` interface ready for courier APIs
- **Daily Expense Tracker** — add/edit/delete, today/week/month/total tiles, filters, category and daily/monthly charts, CSV & PDF export

### Phase 3

- **Image to PDF** — JPG/PNG/WEBP, drag or arrow reordering, A4/A5/Letter/original size, orientation, margins, quality
- **PDF to Image** — page thumbnails, JPG/PNG, 72/150/300 dpi, page ranges (`1-3, 5`), per-page download or ZIP;
  clear message for password-protected PDFs
- **Image Compressor** — batch, Low/Medium/High/Custom, max width, auto format (PNG→WEBP keeps transparency),
  before→after sizes, ZIP; keeps the original if it can't be made smaller
- **Image Resizer** — presets (Instagram, YouTube, Facebook, passport 35×45 mm, A4 300 dpi), aspect lock,
  fill & crop / fit / stretch, format & quality

### Phase 4

- **QR Code Generator** — URL, text, phone, email, WhatsApp, WiFi and UPI; size, error correction, colours (with a
  contrast/inversion warning), centre logo (forces ECC H); PNG and SVG download. Verified by decoding with an independent reader.
- **Password Generator** — Web Crypto CSPRNG with rejection sampling (no modulo bias), guaranteed character classes,
  look-alike exclusion, entropy-based strength. Rendered client-only; nothing stored or sent.
- **WhatsApp Message Generator** — 9 templates (orders, payments, delivery, appointments, follow-ups, enquiries,
  birthdays, 10 festivals), editable preview, `wa.me` link with +91 normalisation, copy.
- **Reminder & Task Manager** — Today / Upcoming / Overdue / Completed, priorities, categories, search, filters, sorting,
  reminders via a `ReminderChannel` interface (browser notifications + in-app today; email/push can be added later).
  Missed reminders fire when the page is next opened, exactly once.

All file tools run entirely in the browser: nothing is uploaded, files are identified by their content (not their extension),
size/count limits are enforced, and object URLs are revoked when you leave the page.

### Phase 5

- **Accounts** (Auth.js v5): email + password (bcrypt), Google, forgot / reset password (hashed one-time tokens, 60 min),
  change password, log out everywhere, delete account. Sessions are re-checked against the database on every request,
  so password changes, resets and deletions take effect immediately.
- **Saved data in PostgreSQL** (Prisma): invoices + items, quotations + items, expenses, tasks, business profile,
  saved calculations, favourite tools. Every row is keyed by `(userId, clientId)` and every query filters by the
  signed-in user, so one user can never read or overwrite another's records. Guests keep using browser storage;
  after signing in, anything saved on the device can be moved into the account in one click.
- **Dashboard** — invoiced / unpaid / expenses this month, saved invoices & quotations (open straight into the editor),
  today's and overdue tasks, recent expenses, recent calculations (Save button under every calculator result),
  favourite tools (star on every tool page), plan usage.
- **Business profile** — name, logo, address, phone, email, GSTIN, PAN, bank, IFSC, UPI, terms; fills every new document.
- **Admin** (`/admin`) — users (search, give/extend/end Pro, roles), tool usage, daily/monthly active visitors and users,
  sign-ups, subscriptions, revenue, CSV reports.
- **Anonymous analytics** — `tool_opened`, `calculation_completed`, `invoice_created`, `quotation_created`,
  `pdf_generated`, `image_compressed`, `qr_generated`, `download_clicked`. Only the event name, tool and a random
  browser id are stored — no inputs, no user id. Do Not Track / Global Privacy Control and the account opt-out are honoured.
- **Plans** — Free and Pro (₹99/month, ₹999/year) in `lib/billing/plans.ts`; Free saves 20 invoices + 20 quotations a
  month to the account. No gateway yet: admins grant Pro manually. To add Razorpay/Stripe, implement
  `PaymentProvider` in `lib/billing/provider.ts` and call `activateSubscription()` from its webhook.
- **Security** — Zod validation on every input, Postgres-backed rate limits (login, sign-up, reset, sync, analytics)
  with hashed keys, same-origin checks on API writes (Server Actions get Next.js's built-in check), open-redirect-safe
  callback URLs, logos verified by their bytes, CSV formula injection neutralised, admin area 404s for non-admins.
- Pricing, About, Contact and Privacy pages.

A tool marked `status: "coming-soon"` in `lib/tools.ts` shows as **Coming soon** in the directory and search and is left out of the sitemap.

## Project structure

```
app/
  (tools)/<slug>/page.tsx   One folder per tool, served at the root URL (/gst-calculator)
  category/[slug]/          Category pages (statically generated)
  tools/  search/           Directory and search
  sitemap.ts robots.ts opengraph-image.tsx
  login/ register/ forgot-password/ reset-password/
  dashboard/                Overview, business profile, settings
  admin/                    Overview, users, tools, subscriptions, CSV reports
  api/                      auth, me, sync, events
prisma/                     schema.prisma + migrations
components/
  calculators/              One client component per tool
  shared/                   ToolPage frame, form fields, result cards, actions, FAQ, breadcrumbs, JSON-LD
  layout/                   Header, footer, mobile nav, search palette
  ui/                       shadcn/ui primitives
lib/
  tools.ts                  Tool & category registry — nav, search, sitemap and related tools derive from it
  calculations/             Pure, unit-tested math (GST, EMI, percentage, discount, age, documents, profit, shipping)
  documents/                Invoice & quotation schema, numbering, validation, drafts
  expenses/                 Expense schema, filters, summaries, CSV
  storage/                  Collection interface: browser storage for guests, synced to the account when signed in
  auth/ account/            Auth.js config, auth & account server actions, client session state
  billing/                  Plans, limits, subscriptions, payment-gateway interface
  analytics/                Event names and the client-side tracker
  server/                   Server-only data access: sync repositories, dashboard and admin queries
  sync/                     Kinds of synced data, device-to-account import
  prisma.ts                 Database client
  validation/               Zod field helpers
  pdf/                      jsPDF reports, invoice capture, image→PDF, pdf.js rendering, page ranges
  image/                    Image decode/encode, resize geometry
  qr/                       QR payload builders (UPI, WiFi, WhatsApp…) and PNG/SVG rendering
  security/                 Password generation and strength
  whatsapp/                 Message templates
  tasks/                    Task model, views, reminders
  phone.ts upi.ts color.ts  Shared helpers (Indian phone numbers, UPI links, contrast)
  files/                    File-type sniffing & validation, downloads, ZIP
  seo.ts site.ts search.ts format.ts
```

## Adding a new tool

1. Add an entry to `lib/tools.ts` (set `status: "live"` when ready).
2. Put the math in `lib/calculations/<tool>.ts` with tests alongside.
3. Build the UI in `components/calculators/<tool>.tsx` using the shared `InputCard`, `ResultCard`, `NumberField`, etc.
4. Create `app/(tools)/<slug>/page.tsx`: export `toolMetadata(...)` and render `<ToolPage>` with FAQs.

The sitemap, search, navigation and related-tool links pick it up automatically.

## Notes

- Calculators and file tools run in the browser; nothing typed or uploaded is sent to a server. Only items a signed-in
  user saves (and anonymous usage events) reach the database.
- The pdf.js worker is copied to `public/` by `scripts/copy-pdf-worker.mjs` (runs on install, dev and build) so it
  always matches the installed version.
- Invoice PDFs are rendered from the on-screen template (exact match, image-based). Print → Save as PDF gives a text-selectable copy.
- GST quick-pick rates include the post-September-2025 slabs (5/18/40) as well as 12/28 for earlier invoices.
- The brand name lives in `lib/site.ts` (`siteConfig.name`) — change it there.
#   d a i l y k i t . t e c h  
 #   d a i l y k i t . t e c h  
 