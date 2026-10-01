import { format } from "date-fns";
import { parseDateInput } from "@/lib/calculations/age";
import { amountInWords } from "@/lib/calculations/words";
import { documentTotals, filledItems, upiPaymentLink } from "@/lib/documents/model";
import { STATUS_LABEL, type BusinessDocument, type DocStatus, type TemplateId } from "@/lib/documents/types";
import { formatINR, formatNumber, parseNumber } from "@/lib/format";
import { QrSvg } from "./upi-qr";

interface Theme {
  accent: string;
  /** Solid accent band across the header with white text. */
  band: boolean;
  /** Heading row in the item table. */
  head: { background: string; color: string };
  /** Full grid borders on the table (classic ledger look). */
  grid: boolean;
  zebra: boolean;
  /** Accent stripe down the left edge of the page. */
  stripe: boolean;
  titleCase: "upper" | "title";
  fontFamily: string;
}

const SANS = "var(--font-sans), 'Segoe UI', Roboto, Arial, sans-serif";

const THEMES: Record<TemplateId, Theme> = {
  classic: { accent: "#1f2937", band: false, head: { background: "#f3f4f6", color: "#111827" }, grid: true, zebra: false, stripe: false, titleCase: "upper", fontFamily: "Georgia, 'Times New Roman', serif" },
  modern: { accent: "#2563b9", band: true, head: { background: "#2563b9", color: "#ffffff" }, grid: false, zebra: true, stripe: false, titleCase: "upper", fontFamily: SANS },
  minimal: { accent: "#111827", band: false, head: { background: "transparent", color: "#6b7280" }, grid: false, zebra: false, stripe: false, titleCase: "title", fontFamily: SANS },
  professional: { accent: "#1e3a5f", band: false, head: { background: "#1e3a5f", color: "#ffffff" }, grid: false, zebra: true, stripe: true, titleCase: "upper", fontFamily: SANS },
  corporate: { accent: "#0f766e", band: true, head: { background: "#e6f4f2", color: "#0f766e" }, grid: false, zebra: false, stripe: false, titleCase: "upper", fontFamily: SANS },
};

const displayDate = (value: string) => {
  const d = parseDateInput(value);
  return d ? format(d, "dd MMM yyyy") : "";
};

function documentTitle(doc: BusinessDocument) {
  if (doc.type === "quotation") return "Quotation";
  return doc.taxMode === "gst" ? "Tax Invoice" : "Invoice";
}

/**
 * Print-ready A4 rendering of an invoice or quotation. Laid out at a fixed 794px width
 * (A4 at 96 dpi) and styled inline so preview, print and PDF export are identical.
 */
export function DocumentPreview({ doc }: { doc: BusinessDocument }) {
  const t = THEMES[doc.template];
  const totals = documentTotals(doc);
  const items = filledItems(doc);
  const gst = doc.taxMode === "gst";
  const showHsn = items.some((i) => i.hsn.trim());
  const showDiscount = totals.discount > 0;
  const title = documentTitle(doc);
  const titleText = t.titleCase === "upper" ? title.toUpperCase() : title;
  const upi = doc.bank.upiId.trim();
  const showQr = doc.type === "invoice" && upi && totals.grandTotal > 0 && doc.status !== "paid";
  const hasBank = doc.bank.bankName || doc.bank.accountNumber || doc.bank.ifsc || upi;
  const border = "#e5e7eb";
  const headerText = t.band ? "#ffffff" : "#111827";
  const headerMuted = t.band ? "rgba(255,255,255,0.8)" : "#6b7280";

  const meta: [string, string][] = [
    [`${doc.type === "invoice" ? "Invoice" : "Quotation"} No.`, doc.number],
    ["Date", displayDate(doc.date)],
    ...(doc.dueDate ? [[doc.type === "invoice" ? "Due date" : "Valid until", displayDate(doc.dueDate)] as [string, string]] : []),
    ...(doc.type === "invoice" ? [["Status", STATUS_LABEL[doc.status as DocStatus] ?? doc.status] as [string, string]] : []),
    ...(gst && doc.placeOfSupply ? [["Place of supply", doc.placeOfSupply] as [string, string]] : []),
  ];

  const cell = (align: "left" | "right" = "left"): React.CSSProperties => ({
    padding: "8px 8px",
    textAlign: align,
    verticalAlign: "top",
    ...(t.grid ? { border: `1px solid ${border}` } : {}),
  });

  const taxLines: [string, number][] = gst
    ? totals.byRate.flatMap((r) =>
        doc.supply === "intra"
          ? ([
              [`CGST @ ${formatNumber(r.rate / 2)}%`, r.cgst],
              [`SGST @ ${formatNumber(r.rate / 2)}%`, r.sgst],
            ] as [string, number][])
          : ([[`IGST @ ${formatNumber(r.rate)}%`, r.igst]] as [string, number][]),
      )
    : [];

  return (
    <article
      style={{
        width: 794,
        minHeight: 1123,
        background: "#ffffff",
        color: "#111827",
        fontFamily: t.fontFamily,
        fontSize: 12,
        lineHeight: 1.5,
        position: "relative",
        boxSizing: "border-box",
        borderLeft: t.stripe ? `10px solid ${t.accent}` : undefined,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <header
        style={{
          background: t.band ? t.accent : undefined,
          color: headerText,
          padding: t.band ? "32px 48px" : "48px 48px 0",
          display: "flex",
          justifyContent: "space-between",
          gap: 32,
          ...(doc.template === "classic" ? { flexDirection: "column", alignItems: "center", textAlign: "center" } : {}),
        }}
      >
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", maxWidth: doc.template === "classic" ? undefined : 400, ...(doc.template === "classic" ? { flexDirection: "column", alignItems: "center" } : {}) }}>
          {doc.seller.logo && (
            // eslint-disable-next-line @next/next/no-img-element -- user-uploaded data URL, must render inside the PDF capture
            <img src={doc.seller.logo} alt="" style={{ maxHeight: 64, maxWidth: 140, objectFit: "contain", background: t.band ? "#ffffff" : undefined, borderRadius: t.band ? 6 : 0, padding: t.band ? 4 : 0 }} />
          )}
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>{doc.seller.name || "Your Business Name"}</div>
            {doc.seller.address && <div style={{ whiteSpace: "pre-line", color: headerMuted, marginTop: 4 }}>{doc.seller.address}</div>}
            <div style={{ color: headerMuted, marginTop: 2 }}>
              {[doc.seller.phone && `Ph: ${doc.seller.phone}`, doc.seller.email].filter(Boolean).join("  ·  ")}
            </div>
            {(doc.seller.gstin || doc.seller.pan) && (
              <div style={{ marginTop: 2, fontWeight: 600 }}>
                {[doc.seller.gstin && `GSTIN: ${doc.seller.gstin.toUpperCase()}`, doc.seller.pan && `PAN: ${doc.seller.pan.toUpperCase()}`].filter(Boolean).join("  ·  ")}
              </div>
            )}
          </div>
        </div>
        <div style={{ textAlign: doc.template === "classic" ? "center" : "right", minWidth: 220 }}>
          <div
            style={{
              fontSize: doc.template === "minimal" ? 28 : 24,
              fontWeight: doc.template === "minimal" ? 300 : 800,
              letterSpacing: t.titleCase === "upper" ? 2 : 0,
              color: t.band ? "#ffffff" : t.accent,
              ...(doc.template === "classic" ? { borderTop: `2px solid ${t.accent}`, borderBottom: `2px solid ${t.accent}`, padding: "4px 24px", display: "inline-block" } : {}),
            }}
          >
            {titleText}
          </div>
          {doc.template !== "classic" && (
            <table style={{ marginTop: 8, marginLeft: "auto", borderCollapse: "collapse" }}>
              <tbody>
                {meta.map(([k, v]) => (
                  <tr key={k}>
                    <td style={{ color: headerMuted, paddingRight: 12, textAlign: "right" }}>{k}</td>
                    <td style={{ fontWeight: 600, textAlign: "right" }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </header>

      <div style={{ padding: "24px 48px 40px", display: "flex", flexDirection: "column", gap: 20, flex: 1 }}>
        {/* Bill to + meta (classic shows meta here) */}
        <section style={{ display: "flex", justifyContent: "space-between", gap: 24, ...(doc.template === "corporate" ? { background: "#f8fafc", border: `1px solid ${border}`, borderRadius: 8, padding: 16 } : {}) }}>
          <div style={{ maxWidth: 380 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: t.accent }}>
              {doc.type === "invoice" ? "Bill to" : "Prepared for"}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{doc.customer.name || "Customer name"}</div>
            {doc.customer.address && <div style={{ whiteSpace: "pre-line", color: "#4b5563" }}>{doc.customer.address}</div>}
            <div style={{ color: "#4b5563" }}>{[doc.customer.phone && `Ph: ${doc.customer.phone}`, doc.customer.email].filter(Boolean).join("  ·  ")}</div>
            {doc.customer.gstin && <div style={{ fontWeight: 600 }}>GSTIN: {doc.customer.gstin.toUpperCase()}</div>}
          </div>
          {doc.template === "classic" && (
            <table style={{ borderCollapse: "collapse", alignSelf: "flex-start" }}>
              <tbody>
                {meta.map(([k, v]) => (
                  <tr key={k}>
                    <td style={{ color: "#6b7280", paddingRight: 12 }}>{k}</td>
                    <td style={{ fontWeight: 600 }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Items */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
          <thead>
            <tr
              style={{
                background: t.head.background,
                color: t.head.color,
                fontSize: 10.5,
                textTransform: "uppercase",
                letterSpacing: 0.6,
                borderBottom: doc.template === "minimal" ? "1.5px solid #111827" : undefined,
              }}
            >
              <th style={{ ...cell(), width: 28 }}>#</th>
              <th style={cell()}>Item</th>
              {showHsn && <th style={cell()}>HSN/SAC</th>}
              <th style={cell("right")}>Qty</th>
              <th style={cell("right")}>Rate</th>
              {showDiscount && <th style={cell("right")}>Disc.</th>}
              {gst && <th style={cell("right")}>Taxable</th>}
              {gst && <th style={cell("right")}>GST</th>}
              <th style={cell("right")}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              const line = totals.lines[i];
              return (
                <tr key={item.id} style={{ background: t.zebra && i % 2 === 1 ? "#f8fafc" : undefined, borderBottom: t.grid ? undefined : `1px solid ${border}` }}>
                  <td style={{ ...cell(), color: "#6b7280" }}>{i + 1}</td>
                  <td style={cell()}>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    {item.sku && <div style={{ color: "#6b7280", fontSize: 10.5 }}>SKU: {item.sku}</div>}
                  </td>
                  {showHsn && <td style={cell()}>{item.hsn}</td>}
                  <td style={cell("right")}>
                    {item.qty} {item.unit}
                  </td>
                  <td style={cell("right")}>{formatINR(parseNumber(item.rate) || 0)}</td>
                  {showDiscount && <td style={cell("right")}>{item.discount ? `${item.discount}%` : "–"}</td>}
                  {gst && <td style={cell("right")}>{formatINR(line.taxable)}</td>}
                  {gst && (
                    <td style={cell("right")}>
                      <div>{item.gstRate}%</div>
                      <div style={{ color: "#6b7280", fontSize: 10.5 }}>{formatINR(line.gst)}</div>
                    </td>
                  )}
                  <td style={{ ...cell("right"), fontWeight: 600 }}>{formatINR(line.total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <section style={{ display: "flex", justifyContent: "space-between", gap: 32, alignItems: "flex-start" }}>
          <div style={{ flex: 1, paddingTop: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "#6b7280" }}>Amount in words</div>
            <div style={{ fontWeight: 600, marginTop: 2 }}>{amountInWords(totals.grandTotal)}</div>
          </div>
          <table style={{ width: 290, borderCollapse: "collapse" }}>
            <tbody>
              <TotalRow label="Subtotal" value={totals.subtotal} />
              {totals.discount > 0 && <TotalRow label="Discount" value={-totals.discount} />}
              {gst && <TotalRow label="Taxable value" value={totals.taxable} />}
              {taxLines.map(([label, value]) => (
                <TotalRow key={label} label={label} value={value} />
              ))}
              {totals.roundOff !== 0 && <TotalRow label="Round off" value={totals.roundOff} />}
              <tr>
                <td colSpan={2} style={{ paddingTop: 6 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      background: doc.template === "minimal" ? undefined : t.accent,
                      color: doc.template === "minimal" ? "#111827" : "#ffffff",
                      borderTop: doc.template === "minimal" ? "1.5px solid #111827" : undefined,
                      padding: "10px 12px",
                      borderRadius: doc.template === "minimal" || doc.template === "classic" ? 0 : 6,
                      fontSize: 15,
                      fontWeight: 800,
                    }}
                  >
                    <span>{doc.type === "invoice" ? "Grand Total" : "Total"}</span>
                    <span>{formatINR(totals.grandTotal)}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Payment, notes, terms */}
        <section style={{ display: "flex", gap: 24, marginTop: 8 }}>
          {hasBank && (
            <div style={{ flex: 1.35, display: "flex", gap: 12, border: `1px solid ${border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ flex: 1 }}>
                <SectionLabel color={t.accent}>Payment details</SectionLabel>
                <InfoLine label="A/c name" value={doc.bank.accountName} />
                <InfoLine label="Bank" value={doc.bank.bankName} />
                <InfoLine label="A/c no." value={doc.bank.accountNumber} />
                <InfoLine label="IFSC" value={doc.bank.ifsc.toUpperCase()} />
                <InfoLine label="UPI" value={upi} />
              </div>
              {showQr && (
                <div style={{ textAlign: "center" }}>
                  <QrSvg value={upiPaymentLink(doc, totals.grandTotal)} size={92} />
                  <div style={{ fontSize: 9.5, color: "#6b7280" }}>Scan to pay via UPI</div>
                </div>
              )}
            </div>
          )}
          {(doc.notes || doc.terms) && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
              {doc.notes && (
                <div>
                  <SectionLabel color={t.accent}>Notes</SectionLabel>
                  <div style={{ whiteSpace: "pre-line", color: "#374151" }}>{doc.notes}</div>
                </div>
              )}
              {doc.terms && (
                <div>
                  <SectionLabel color={t.accent}>Terms & conditions</SectionLabel>
                  <div style={{ whiteSpace: "pre-line", color: "#374151", fontSize: 11 }}>{doc.terms}</div>
                </div>
              )}
            </div>
          )}
        </section>

        <section style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingTop: 32 }}>
          <div style={{ fontSize: 10, color: "#9ca3af" }}>This is a computer-generated {doc.type === "invoice" ? "invoice" : "quotation"}.</div>
          <div style={{ textAlign: "center", minWidth: 200 }}>
            <div style={{ fontWeight: 600 }}>For {doc.seller.name || "Your Business Name"}</div>
            <div style={{ height: 40 }} />
            <div style={{ borderTop: "1px solid #9ca3af", paddingTop: 4, color: "#6b7280", fontSize: 11 }}>Authorised Signatory</div>
          </div>
        </section>
      </div>
    </article>
  );
}

function TotalRow({ label, value }: { label: string; value: number }) {
  return (
    <tr>
      <td style={{ padding: "3px 12px 3px 0", color: "#4b5563" }}>{label}</td>
      <td style={{ padding: "3px 12px", textAlign: "right", fontWeight: 600 }}>{value < 0 ? `− ${formatINR(-value)}` : formatINR(value)}</td>
    </tr>
  );
}

function SectionLabel({ color, children }: { color: string; children: React.ReactNode }) {
  return <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color, marginBottom: 4 }}>{children}</div>;
}

function InfoLine({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <span style={{ color: "#6b7280", width: 56, flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 600, overflowWrap: "anywhere" }}>{value}</span>
    </div>
  );
}
