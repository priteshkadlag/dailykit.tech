/** A4 at 96 dpi — templates are laid out at exactly this width. */
export const A4_PX = { width: 794, height: 1123 };

/**
 * Renders a DOM node (laid out at A4 width) to a multi-page A4 PDF.
 * What you see in the preview is exactly what lands in the PDF, template styles included.
 * Libraries load on demand to keep them out of the initial bundle.
 */
export async function downloadNodeAsPdf(node: HTMLElement, fileName: string) {
  const [{ toCanvas }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
  const canvas = await toCanvas(node, { pixelRatio: 2, backgroundColor: "#ffffff", cacheBust: true });

  const pdf = new jsPDF({ unit: "pt", format: "a4", compress: true });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const pxPerPt = canvas.width / pageW;
  const pageHeightPx = Math.floor(pageH * pxPerPt);

  const slice = document.createElement("canvas");
  slice.width = canvas.width;
  const ctx = slice.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  for (let y = 0, page = 0; y < canvas.height; y += pageHeightPx, page++) {
    const h = Math.min(pageHeightPx, canvas.height - y);
    slice.height = h;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, slice.width, h);
    ctx.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
    if (page > 0) pdf.addPage();
    pdf.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pageW, h / pxPerPt);
  }

  pdf.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
}

/**
 * Prints only the element marked `data-print-root` (see the print rules in globals.css),
 * so the browser's "Save as PDF" gives a crisp, text-selectable copy.
 */
export function printDocument(title: string) {
  const previous = document.title;
  // Browsers use the page title as the default file name when saving as PDF.
  document.title = title;
  document.body.classList.add("printing-document");
  const cleanup = () => {
    document.title = previous;
    document.body.classList.remove("printing-document");
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  window.print();
}
