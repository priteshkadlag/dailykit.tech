/**
 * On-demand loaders for the heavy PDF modules (pdf-lib and friends). Tool components call these inside
 * their "process" handlers, so a PDF tool page loads quickly and the library is fetched only when needed.
 */
export const pdfEdit = () => import("@/lib/pdf/edit");
export const pdfCompress = () => import("@/lib/pdf/compress");
export const pdfA = () => import("@/lib/pdf/pdfa");
