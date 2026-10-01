import { siteConfig } from "@/lib/site";

export interface ReportSection {
  heading?: string;
  rows: [label: string, value: string][];
}

export interface ReportTable {
  heading: string;
  head: string[];
  body: (string | number)[][];
}

export interface ReportOptions {
  title: string;
  fileName: string;
  sections: ReportSection[];
  tables?: ReportTable[];
}

/**
 * The PDF core fonts have no ₹ glyph, so amounts in PDFs are written as "Rs." with Indian grouping.
 */
export function pdfAmount(value: number) {
  return `Rs. ${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Builds and downloads a simple branded A4 report. jsPDF is loaded on demand so it never
 * weighs down the initial page load.
 */
export async function downloadReportPdf({ title, fileName, sections, tables = [] }: ReportOptions) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const pageWidth = doc.internal.pageSize.getWidth();
  const brand: [number, number, number] = [37, 99, 185];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 20);
  doc.text(title, margin, 64);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  doc.text(
    `Generated on ${new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} · ${siteConfig.name}`,
    margin,
    82,
  );
  doc.setDrawColor(...brand);
  doc.setLineWidth(1.5);
  doc.line(margin, 94, pageWidth - margin, 94);

  let y = 112;
  const lastY = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  for (const section of sections) {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: section.heading ? [[{ content: section.heading, colSpan: 2 }]] : undefined,
      body: section.rows,
      theme: "plain",
      styles: { fontSize: 10, cellPadding: 6 },
      headStyles: { fontStyle: "bold", textColor: brand, fontSize: 11 },
      columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
      alternateRowStyles: { fillColor: [247, 248, 250] },
    });
    y = lastY() + 16;
  }

  for (const table of tables) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...brand);
    doc.text(table.heading, margin, y + 8);
    autoTable(doc, {
      startY: y + 16,
      margin: { left: margin, right: margin },
      head: [table.head],
      body: table.body,
      styles: { fontSize: 8.5, cellPadding: 4, halign: "right" },
      headStyles: { fillColor: brand, halign: "right" },
      columnStyles: { 0: { halign: "left" } },
    });
    y = lastY() + 16;
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(
      `${siteConfig.url.replace(/^https?:\/\//, "")} · Page ${i} of ${pages}`,
      margin,
      doc.internal.pageSize.getHeight() - 24,
    );
  }

  doc.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
}
